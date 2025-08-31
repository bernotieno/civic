# =============================================================================
# FILE: apps/feedback/views.py (SIMPLIFIED WITHOUT TRACKING)
# =============================================================================
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter
from .filters import UserFeedbackFilter
from .utils import calculate_user_feedback_stats, track_feedback_view
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter, OpenApiResponse, extend_schema_view
from drf_spectacular.types import OpenApiTypes

from apps.core.decorators import invisible_permission_required, endpoint_allowed
from .models import Feedback
from .serializers import (
    FeedbackSubmissionSerializer, AnonymousFeedbackSerializer,
    FeedbackSubmissionResponseSerializer, 
    AnonymousFeedbackResponseSerializer,
    FeedbackErrorResponseSerializer, UserFeedbackListSerializer, 
    UserFeedbackDetailSerializer, UserFeedbackUpdateSerializer, UserFeedbackStatsSerializer
)
from .permissions import CanSubmitFeedback, IsOwnerOrReadOnly, CanEditFeedback, CanDeleteFeedback


class FeedbackRateThrottle(UserRateThrottle):
    """Custom throttle for feedback submission"""
    scope = 'feedback'


@extend_schema(
    tags=['Feedback'],
    summary="📝 Submit Authenticated Feedback",
    description="Submit feedback to government with full authentication and location hierarchy support.",
    request=FeedbackSubmissionSerializer,
    responses={
        201: OpenApiResponse(
            response=FeedbackSubmissionResponseSerializer,
            description="Feedback submitted successfully"
        ),
        400: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="Validation errors"
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackSubmissionView(APIView):
    """Authenticated citizens submit feedback"""
    permission_classes = [CanSubmitFeedback]
    throttle_classes = [FeedbackRateThrottle]
    
    def post(self, request):
        serializer = FeedbackSubmissionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            feedback = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Feedback submitted successfully',
                'data': {
                    'feedback_id': str(feedback.id),
                    'submitted_at': feedback.created_at.isoformat(),
                    'location_path': feedback.get_location_path()
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Feedback submission failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Feedback'],
    summary="👤 Submit Anonymous Feedback",
    description="Submit feedback anonymously without revealing identity.",
    request=AnonymousFeedbackSerializer,
    responses={
        201: OpenApiResponse(
            response=AnonymousFeedbackResponseSerializer,
            description="Anonymous feedback submitted successfully"
        ),
        400: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="Validation errors"
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class AnonymousFeedbackView(APIView):
    """Anonymous users submit feedback via session"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        serializer = AnonymousFeedbackSerializer(data=request.data)
        
        if serializer.is_valid():
            feedback = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Anonymous feedback submitted successfully',
                'data': {
                    'submitted_at': feedback.created_at.isoformat(),
                    'location_path': feedback.get_location_path(),
                    'message': 'Your anonymous feedback has been received and will be reviewed by the appropriate government department.'
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Anonymous feedback submission failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)





@extend_schema_view(
    get=extend_schema(
        tags=['Feedback'],
        summary="📋 List My Feedback Submissions",
        description="Get paginated list of user's own feedback submissions with filtering.",
        parameters=[
            OpenApiParameter('category', description='Filter by feedback category'),
            OpenApiParameter('priority', description='Filter by priority level'),
            OpenApiParameter('search', description='Search in title and content'),
            OpenApiParameter('ordering', description='Sort results (-created_at, priority, etc.)')
        ]
    )
)
class UserFeedbackListView(generics.ListAPIView):
    """Citizens view paginated list of their own feedback submissions"""
    serializer_class = UserFeedbackListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = UserFeedbackFilter
    ordering_fields = ['created_at', 'updated_at', 'view_count', 'edit_count']
    ordering = ['-created_at']
    search_fields = ['title', 'content']
    
    def get_queryset(self):
        """Get only user's own feedback"""
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
        ).select_related(
            'user_county'
        ).prefetch_related(
            'edit_history'
        )
    
    def list(self, request, *args, **kwargs):
        """Enhanced list response with user statistics and filters"""
        queryset = self.filter_queryset(self.get_queryset())

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)

            # Get user statistics (cached for 15 minutes)
            cache_key = f"user_feedback_stats_{request.user.id}"
            user_stats = cache.get(cache_key)
            if user_stats is None:
                user_stats = calculate_user_feedback_stats(request.user)
                cache.set(cache_key, user_stats, 15 * 60)

            # Get available filter options (placeholder for future implementation)
            filter_options = {
                'available_categories': [],
                'available_priorities': [],
            }

            return Response({
                'success': True,
                'data': {
                    'results': serializer.data,
                    'count': self.paginator.page.paginator.count,
                    'next': self.paginator.get_next_link(),
                    'previous': self.paginator.get_previous_link(),
                    'user_stats': user_stats,
                    'filters': filter_options,
                    'applied_filters': {
                        'search': request.query_params.get('search'),
                        'ordering': request.query_params.get('ordering', '-created_at'),
                    }
                }
            })

        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'count': len(serializer.data)
            }
        })


@extend_schema_view(
    get=extend_schema(
        tags=['Feedback'],
        summary="🔍 Get My Feedback Details",
        description="Get detailed view of specific user's feedback submission.",
    )
)
class UserFeedbackDetailView(generics.RetrieveAPIView):
    """Get detailed view of specific user's submission"""
    serializer_class = UserFeedbackDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
        ).select_related(
            'user_county'
        ).prefetch_related(
            'edit_history',
            'responses__responder'
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Enhanced retrieve with view tracking"""
        instance = self.get_object()
        
        # Track view (increment view count)
        track_feedback_view(instance, request.user)
        
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': {
                'feedback': serializer.data,
            }
        })


@extend_schema_view(
    put=extend_schema(
        tags=['Feedback'],
        summary="✏️ Update My Feedback",
        description="Update own feedback submission within allowed constraints.",
    )
)
class UserFeedbackUpdateView(generics.UpdateAPIView):
    """Update own feedback if status allows"""
    serializer_class = UserFeedbackUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanEditFeedback]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
        )
    
    def update(self, request, *args, **kwargs):
        """Enhanced update with permission checks"""
        instance = self.get_object()
        
        # Double-check edit permissions
        can_edit, restriction_reason = instance.can_be_edited()
        if not can_edit:
            return Response({
                'success': False,
                'message': 'Feedback cannot be edited',
                'reason': restriction_reason,
                'error_code': 'EDIT_RESTRICTED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Perform update
        updated_instance = serializer.save()
        
        # Clear user stats cache
        cache_key = f"user_feedback_stats_{request.user.id}"
        cache.delete(cache_key)
        
        # Return updated data
        detail_serializer = UserFeedbackDetailSerializer(updated_instance)
        
        return Response({
            'success': True,
            'message': 'Feedback updated successfully',
            'data': {
                'feedback': detail_serializer.data,
                'edit_count': updated_instance.edit_count,
                'edited_at': updated_instance.edited_at.isoformat() if updated_instance.edited_at else None
            }
        })


@extend_schema_view(
    delete=extend_schema(
        tags=['Feedback'],
        summary="🗑️ Delete My Feedback",
        description="Soft delete own feedback submission within allowed constraints.",
    )
)
class UserFeedbackDeleteView(generics.DestroyAPIView):
    """Soft delete own feedback submission"""
    serializer_class = UserFeedbackDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanDeleteFeedback]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
        )
    
    def destroy(self, request, *args, **kwargs):
        """Enhanced soft delete with permission checks"""
        instance = self.get_object()
        
        # Double-check delete permissions
        can_delete, restriction_reason = instance.can_be_deleted()
        if not can_delete:
            return Response({
                'success': False,
                'message': 'Feedback cannot be deleted',
                'reason': restriction_reason,
                'error_code': 'DELETE_RESTRICTED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Perform soft delete
        instance.soft_delete(user=request.user)
        
        # Clear user stats cache
        cache_key = f"user_feedback_stats_{request.user.id}"
        cache.delete(cache_key)
        
        return Response({
            'success': True,
            'message': 'Feedback deleted successfully',
            'data': {
                'deleted_at': instance.deleted_at.isoformat(),
                'feedback_id': str(instance.id),
                'note': 'This feedback has been soft deleted and can be recovered by administrators if needed.'
            }
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Feedback'],
    summary="📊 My Feedback Statistics",
    description="Get comprehensive user feedback statistics and analytics.",
    responses={
        200: OpenApiResponse(
            response=UserFeedbackStatsSerializer,
            description="Statistics retrieved successfully"
        )
    }
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_feedback_statistics(request):
    """Get comprehensive user feedback statistics"""
    user = request.user
    
    # Get comprehensive stats (cached)
    cache_key = f"detailed_user_stats_{user.id}"
    detailed_stats = cache.get(cache_key)
    
    if detailed_stats is None:
        user_feedback = Feedback.objects.filter(user=user, is_deleted=False)
        
        # Basic counts
        basic_stats = {
            'total_submissions': user_feedback.count(),
        }
        
        # Monthly breakdown (last 12 months)
        monthly_stats = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_count = user_feedback.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_count
            })
        
        # Basic analysis
        basic_analysis = {
            'total_feedback': user_feedback.count(),
            'this_month': user_feedback.filter(
                created_at__gte=timezone.now().replace(day=1)
            ).count()
        }
        
        # Engagement metrics
        most_viewed = user_feedback.order_by('-view_count').first()
        most_edited = user_feedback.order_by('-edit_count').first()
        
        engagement_stats = {
            'total_views': user_feedback.aggregate(total=Count('view_count'))['total'] or 0,
            'total_edits': user_feedback.aggregate(total=Count('edit_count'))['total'] or 0,
            'most_viewed_feedback': {
                'id': str(most_viewed.id),
                'title': most_viewed.title,
                'view_count': most_viewed.view_count
            } if most_viewed else None,
            'most_edited_feedback': {
                'id': str(most_edited.id),
                'title': most_edited.title,
                'edit_count': most_edited.edit_count
            } if most_edited else None,
        }
        
        detailed_stats = {
            **basic_stats,
            'monthly_breakdown': list(reversed(monthly_stats)),
            'basic_analysis': basic_analysis,
            'engagement': engagement_stats,
        }
        
        # Cache for 1 hour
        cache.set(cache_key, detailed_stats, 60 * 60)
    
    return Response({
        'success': True,
        'data': detailed_stats
    })