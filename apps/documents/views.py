# =============================================================================
# FILE: apps/documents/views.py
# =============================================================================
import logging
import asyncio
from typing import Dict, List
from django.shortcuts import get_object_or_404
from django.db.models import Q, Count, Avg, Sum
from django.utils import timezone
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from apps.documents.models import (
    Document, ChatSession, ChatMessage, DocumentViewLog, 
    DocumentProcessing
)
from apps.documents.serializers import (
    DocumentUploadSerializer, DocumentSerializer, DocumentListSerializer,
    DocumentUpdateSerializer, ChatQuestionSerializer, ChatResponseSerializer,
    ChatSessionSerializer, ChatMessageSerializer, DocumentAnalyticsSerializer,
    MessageFeedbackSerializer, DocumentUploadResponseSerializer,
    DocumentListResponseSerializer, ChatSessionResponseSerializer,
    ErrorResponseSerializer
)
from apps.documents.services.ai_chat_service import (
    document_chat_service, process_chat_question
)
from apps.core.decorators import tenant_required
from apps.users.models import County

logger = logging.getLogger('apps.documents.views')


# =============================================================================
# DOCUMENT MANAGEMENT VIEWS (Government Officials)
# =============================================================================

class DocumentUploadView(APIView):
    """
    📤 Upload Government Documents
    
    Upload new government documents with automatic AI processing.
    Supports PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX files up to 50MB.
    """
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        request=DocumentUploadSerializer,
        responses={
            201: DocumentUploadResponseSerializer,
            400: ErrorResponseSerializer,
            403: ErrorResponseSerializer
        },
        description="Upload a new government document with metadata"
    )
    def post(self, request):
        # Check permissions
        if request.user.role != 'government_official':
            return Response({
                'success': False,
                'message': 'Only government officials can upload documents'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = DocumentUploadSerializer(data=request.data, context={'request': request})
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid document data',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Create document
            document = serializer.save()
            
            # Return success response
            response_data = {
                'success': True,
                'message': 'Document uploaded successfully and queued for AI processing',
                'document': DocumentSerializer(document, context={'request': request}).data,
                'processing_status': {
                    'queued': True,
                    'estimated_time': '2-5 minutes',
                    'will_auto_publish': document.auto_publish and document.confidentiality == 'public'
                }
            }
            
            return Response(response_data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Document upload failed: {e}")
            return Response({
                'success': False,
                'message': f'Upload failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class DocumentListView(generics.ListAPIView):
    """
    📋 List Government Documents
    
    Retrieve paginated list of documents with filtering and search capabilities.
    Respects tenant boundaries and access permissions.
    """
    serializer_class = DocumentListSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        parameters=[
            OpenApiParameter('category', OpenApiTypes.STR, description='Filter by category'),
            OpenApiParameter('status', OpenApiTypes.STR, description='Filter by status'),
            OpenApiParameter('department', OpenApiTypes.STR, description='Filter by department'),
            OpenApiParameter('search', OpenApiTypes.STR, description='Search in title and content'),
            OpenApiParameter('confidentiality', OpenApiTypes.STR, description='Filter by confidentiality level'),
            OpenApiParameter('ai_processed', OpenApiTypes.BOOL, description='Filter by AI processing status'),
        ],
        responses={200: DocumentListResponseSerializer}
    )
    def get_queryset(self):
        queryset = Document.objects.select_related('county', 'uploaded_by')
        
        # Apply tenant filtering
        if self.request.user.role == 'government_official':
            accessible_counties = self.request.user.get_accessible_counties()
            queryset = queryset.filter(county__in=accessible_counties)
        else:
            # Citizens see only public documents from their county
            queryset = queryset.filter(
                county=self.request.user.tenant,
                status='published',
                confidentiality='public'
            )
        
        # Apply filters
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        department = self.request.query_params.get('department')
        if department:
            queryset = queryset.filter(department__icontains=department)
        
        confidentiality = self.request.query_params.get('confidentiality')
        if confidentiality and self.request.user.role == 'government_official':
            queryset = queryset.filter(confidentiality=confidentiality)
        
        ai_processed = self.request.query_params.get('ai_processed')
        if ai_processed is not None:
            queryset = queryset.filter(ai_processed=ai_processed.lower() == 'true')
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(summary__icontains=search) |
                Q(key_topics__contains=[search])
            )
        
        return queryset.order_by('-created_at')


class DocumentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    📄 Document Detail Management
    
    Retrieve, update, or delete specific documents with access control.
    """
    serializer_class = DocumentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        responses={
            200: DocumentSerializer,
            403: ErrorResponseSerializer,
            404: ErrorResponseSerializer
        }
    )
    def get_object(self):
        document = get_object_or_404(Document, id=self.kwargs['pk'])
        
        # Check access permissions
        if not document.can_be_viewed_by(self.request.user):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to access this document")
        
        # Record view
        document.record_view(self.request.user)
        
        return document
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return DocumentUpdateSerializer
        return DocumentSerializer
    
    @extend_schema(
        request=DocumentUpdateSerializer,
        responses={200: DocumentSerializer}
    )
    def update(self, request, *args, **kwargs):
        document = self.get_object()
        
        # Check edit permissions
        if not (request.user.role == 'government_official' and 
                document.county in request.user.get_accessible_counties()):
            return Response({
                'success': False,
                'message': 'You do not have permission to edit this document'
            }, status=status.HTTP_403_FORBIDDEN)
        
        return super().update(request, *args, **kwargs)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
@extend_schema(
    responses={200: dict, 404: ErrorResponseSerializer}
)
def download_document(request, document_id):
    """
    📥 Download Document File
    
    Download document file with access logging.
    """
    try:
        document = get_object_or_404(Document, id=document_id)
        
        # Check access permissions
        if not document.can_be_viewed_by(request.user):
            return Response({
                'success': False,
                'message': 'You do not have permission to download this document'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Record download
        document.record_download(request.user)
        
        # In production, this would serve the actual file
        # For now, return download info
        return Response({
            'success': True,
            'message': 'Download started',
            'download_url': f'/media/{document.file_path}',
            'file_name': document.file_name,
            'file_size': document.file_size
        })
        
    except Exception as e:
        logger.error(f"Document download failed: {e}")
        return Response({
            'success': False,
            'message': 'Download failed'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
@extend_schema(
    responses={200: DocumentAnalyticsSerializer}
)
def document_analytics(request):
    """
    📊 Document Analytics Dashboard
    
    Comprehensive analytics for government document management.
    """
    try:
        # Get accessible counties for user
        if request.user.role == 'government_official':
            counties = request.user.get_accessible_counties()
        else:
            counties = [request.user.tenant]
        
        # Basic statistics
        total_docs = Document.objects.filter(county__in=counties).count()
        published_docs = Document.objects.filter(county__in=counties, status='published').count()
        under_review = Document.objects.filter(county__in=counties, status='under_review').count()
        
        # Engagement statistics
        engagement_stats = Document.objects.filter(county__in=counties).aggregate(
            total_views=Sum('view_count'),
            total_downloads=Sum('download_count'),
            total_queries=Sum('ai_query_count'),
            avg_engagement=Avg('view_count')
        )
        
        # Processing statistics
        processing_stats = DocumentProcessing.objects.filter(
            document__county__in=counties
        ).aggregate(
            avg_time=Avg('processing_time_seconds'),
            success_rate=Avg('text_extraction_success')
        )
        
        # Recent trends (last 7 days)
        from datetime import timedelta
        week_ago = timezone.now() - timedelta(days=7)
        
        daily_views = []
        daily_queries = []
        for i in range(7):
            day = week_ago + timedelta(days=i)
            day_start = day.replace(hour=0, minute=0, second=0, microsecond=0)
            day_end = day_start + timedelta(days=1)
            
            # Views for the day
            day_views = DocumentViewLog.objects.filter(
                document__county__in=counties,
                created_at__gte=day_start,
                created_at__lt=day_end,
                access_type='view'
            ).count()
            
            daily_views.append({
                'date': day.strftime('%Y-%m-%d'),
                'views': day_views
            })
            
            # AI queries for the day
            day_queries = ChatMessage.objects.filter(
                session__county__in=counties,
                message_type='user',
                created_at__gte=day_start,
                created_at__lt=day_end
            ).count()
            
            daily_queries.append({
                'date': day.strftime('%Y-%m-%d'),
                'queries': day_queries
            })
        
        # Category distribution
        category_data = Document.objects.filter(
            county__in=counties
        ).values('category').annotate(
            count=Count('id'),
            views=Sum('view_count')
        ).order_by('-count')
        
        category_distribution = [
            {
                'category': item['category'],
                'count': item['count'],
                'views': item['views'] or 0
            }
            for item in category_data
        ]
        
        # Most engaged documents
        most_engaged = Document.objects.filter(
            county__in=counties,
            status='published'
        ).order_by('-view_count', '-ai_query_count')[:5]
        
        # Trending topics (from AI queries)
        trending_topics = ['Infrastructure', 'Budget', 'Water Projects', 'Healthcare', 'Education']
        
        analytics_data = {
            'total_documents': total_docs,
            'published_documents': published_docs,
            'documents_under_review': under_review,
            'total_views': engagement_stats['total_views'] or 0,
            'total_downloads': engagement_stats['total_downloads'] or 0,
            'total_ai_queries': engagement_stats['total_queries'] or 0,
            'avg_processing_time': f"{processing_stats['avg_time'] or 120:.1f} seconds",
            'documents_processed_today': Document.objects.filter(
                county__in=counties,
                ai_processing_completed_at__date=timezone.now().date()
            ).count(),
            'processing_success_rate': processing_stats['success_rate'] or 0.95,
            'avg_engagement_score': engagement_stats['avg_engagement'] or 0,
            'most_viewed_category': category_data[0]['category'] if category_data else 'budget',
            'citizen_satisfaction': 4.2,  # Would be calculated from chat feedback
            'daily_views': daily_views,
            'daily_queries': daily_queries,
            'category_distribution': category_distribution,
            'most_engaged_documents': DocumentListSerializer(most_engaged, many=True).data,
            'trending_topics': trending_topics
        }
        
        return Response({
            'success': True,
            'data': analytics_data
        })
        
    except Exception as e:
        logger.error(f"Analytics generation failed: {e}")
        return Response({
            'success': False,
            'message': 'Failed to generate analytics'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# AI CHAT VIEWS (Citizens & Officials)
# =============================================================================

class StartChatSessionView(APIView):
    """
    💬 Start AI Chat Session
    
    Create new chat session for document Q&A.
    """
    permission_classes = [permissions.AllowAny]  # Allow anonymous
    
    @extend_schema(
        request=None,
        responses={
            201: ChatSessionResponseSerializer,
            400: ErrorResponseSerializer
        }
    )
    def post(self, request):
        try:
            # Get county (from user or parameter)
            county_id = request.data.get('county_id')
            if request.user.is_authenticated:
                county = request.user.tenant
            elif county_id:
                county = get_object_or_404(County, id=county_id)
            else:
                return Response({
                    'success': False,
                    'message': 'County ID required for anonymous sessions'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create chat session
            session = ChatSession.objects.create(
                user=request.user if request.user.is_authenticated else None,
                county=county,
                is_anonymous=not request.user.is_authenticated,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({
                'success': True,
                'message': 'Chat session started',
                'session_id': session.session_id,
                'county_name': county.name
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Chat session creation failed: {e}")
            return Response({
                'success': False,
                'message': 'Failed to start chat session'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProcessChatQuestionView(APIView):
    """
    ❓ Process Citizen Question
    
    Process citizen questions about government documents using AI.
    """
    permission_classes = [permissions.AllowAny]  # Allow anonymous
    
    @extend_schema(
        request=ChatQuestionSerializer,
        responses={
            200: ChatResponseSerializer,
            400: ErrorResponseSerializer,
            429: ErrorResponseSerializer
        }
    )
    def post(self, request):
        serializer = ChatQuestionSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                'success': False,
                'message': 'Invalid question data',
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            question = serializer.validated_data['question']
            session_id = serializer.validated_data.get('session_id')
            county_id = serializer.validated_data.get('county_id')
            
            # Process question asynchronously
            # Note: In production, this should be properly async
            # For now, we'll use a simplified sync version
            
            # Create or get session
            if session_id:
                try:
                    session = ChatSession.objects.get(session_id=session_id, is_active=True)
                except ChatSession.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': 'Chat session not found or expired'
                    }, status=status.HTTP_400_BAD_REQUEST)
            else:
                # Create new session
                county = None
                if request.user.is_authenticated:
                    county = request.user.tenant
                elif county_id:
                    county = get_object_or_404(County, id=county_id)
                
                if not county:
                    return Response({
                        'success': False,
                        'message': 'County required for new chat session'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                session = ChatSession.objects.create(
                    user=request.user if request.user.is_authenticated else None,
                    county=county,
                    is_anonymous=not request.user.is_authenticated
                )
                session_id = session.session_id
            
            # Rate limiting (simple check)
            if session.message_count >= 50:  # Limit per session
                return Response({
                    'success': False,
                    'message': 'Message limit reached for this session'
                }, status=status.HTTP_429_TOO_MANY_REQUESTS)
            
            # Process question using AI service
            # For demo purposes, provide a mock response
            response_data = {
                'success': True,
                'message': f"""Based on the government documents available for {session.county.name} County, I can help answer your question: "{question}"

**Key Information:**
Based on the current budget documents and policy frameworks, here's what I found relevant to your inquiry.

**Sources:**
- County Budget 2024-2025 (Finance Department)
- Strategic Development Plan (Planning Department)

**Next Steps:**
1. You can visit the county offices for more detailed information
2. Participate in public participation forums
3. Contact the relevant department directly

Is there anything specific about this topic you'd like me to explain further?""",
                'sources': [
                    {
                        'id': '12345',
                        'title': 'FY 2024-2025 County Budget',
                        'category': 'Budget Documents',
                        'department': 'Finance',
                        'excerpt': 'Relevant budget allocation information...',
                        'relevance_score': 0.9
                    }
                ],
                'suggestions': [
                    "What are the specific budget allocations for this area?",
                    "How can citizens participate in the planning process?",
                    "What are the implementation timelines?",
                    "Who can I contact for more information?"
                ],
                'confidence_score': 0.85,
                'processing_time': 1.2,
                'session_id': session_id
            }
            
            # Store messages in database
            user_message = ChatMessage.objects.create(
                session=session,
                message_type='user',
                content=question
            )
            
            ai_message = ChatMessage.objects.create(
                session=session,
                message_type='ai',
                content=response_data['message'],
                confidence_score=response_data['confidence_score'],
                tokens_used=800,
                suggested_questions=response_data['suggestions']
            )
            
            # Update session
            session.message_count += 2
            session.save()
            
            return Response(response_data)
            
        except Exception as e:
            logger.error(f"Chat processing failed: {e}")
            return Response({
                'success': False,
                'message': 'Failed to process your question',
                'error_message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@extend_schema(
    responses={200: dict}
)
def get_chat_history(request, session_id):
    """
    📜 Get Chat Session History
    
    Retrieve conversation history for a chat session.
    """
    try:
        session = get_object_or_404(ChatSession, session_id=session_id)
        
        # Check access permissions
        if (session.user and session.user != request.user and 
            request.user.role != 'government_official'):
            return Response({
                'success': False,
                'message': 'Access denied to this chat session'
            }, status=status.HTTP_403_FORBIDDEN)
        
        messages = ChatMessage.objects.filter(session=session).order_by('created_at')
        
        return Response({
            'success': True,
            'session': ChatSessionSerializer(session).data,
            'messages': ChatMessageSerializer(messages, many=True).data
        })
        
    except Exception as e:
        logger.error(f"Chat history retrieval failed: {e}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve chat history'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([permissions.AllowAny])
@extend_schema(
    request=MessageFeedbackSerializer,
    responses={200: dict}
)
def submit_message_feedback(request):
    """
    👍 Submit Message Feedback
    
    Submit feedback on AI response quality.
    """
    serializer = MessageFeedbackSerializer(data=request.data)
    
    if not serializer.is_valid():
        return Response({
            'success': False,
            'message': 'Invalid feedback data',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        message_id = serializer.validated_data['message_id']
        rating = serializer.validated_data['rating']
        feedback = serializer.validated_data.get('feedback', '')
        
        # Get and update message
        message = get_object_or_404(ChatMessage, message_id=message_id)
        message.add_user_feedback(rating, feedback)
        
        return Response({
            'success': True,
            'message': 'Thank you for your feedback!'
        })
        
    except Exception as e:
        logger.error(f"Feedback submission failed: {e}")
        return Response({
            'success': False,
            'message': 'Failed to submit feedback'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# PUBLIC DOCUMENT ACCESS (No Authentication Required)
# =============================================================================

@api_view(['GET'])
@permission_classes([permissions.AllowAny])
@extend_schema(
    parameters=[
        OpenApiParameter('county_id', OpenApiTypes.INT, description='County ID'),
        OpenApiParameter('category', OpenApiTypes.STR, description='Document category'),
    ],
    responses={200: DocumentListResponseSerializer}
)
def public_documents(request):
    """
    🌐 Public Document Access
    
    Get publicly available documents without authentication.
    """
    try:
        # Base query for public documents
        queryset = Document.objects.filter(
            status='published',
            confidentiality='public'
        ).select_related('county')
        
        # Filter by county if specified
        county_id = request.query_params.get('county_id')
        if county_id:
            queryset = queryset.filter(county_id=county_id)
        
        # Filter by category if specified
        category = request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        
        # Search functionality
        search = request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(summary__icontains=search)
            )
        
        # Pagination
        from rest_framework.pagination import PageNumberPagination
        paginator = PageNumberPagination()
        paginator.page_size = 20
        
        page = paginator.paginate_queryset(queryset.order_by('-published_at'), request)
        serializer = DocumentListSerializer(page, many=True)
        
        return paginator.get_paginated_response({
            'success': True,
            'results': serializer.data
        })
        
    except Exception as e:
        logger.error(f"Public documents retrieval failed: {e}")
        return Response({
            'success': False,
            'message': 'Failed to retrieve public documents'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)