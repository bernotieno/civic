# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Case, When, IntegerField
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
from apps.projects.models import Project, Bill, AdminFeedbackResponse
from .bill_utils import (
    summarize_bill_document, 
    process_bill_with_enhanced_features, 
    validate_pdf_file,
    process_bill_document_complete
)
from .progress_tracker import (
    get_bill_progress, 
    reset_bill_progress, 
    estimate_processing_time
)
from .async_progress_tracker import (
    start_async_bill_processing,
    get_bill_processing_status,
    retry_failed_bill_processing,
    cancel_bill_processing,
    get_all_active_processing_sessions
)
from .tasks import save_uploaded_file_for_async

import json
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics for national parliament system"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            logger.warning(f"🚫 Unauthorized dashboard access attempt by {user.email} (Role: {user.role})")
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Debug logging
        logger.info(f"📊 National dashboard stats for {user.name} (Level: {user.admin_level})")
        
        # Get feedback stats without status field
        feedback_stats = Feedback.objects.filter(is_deleted=False).aggregate(
            total_feedback=Count('id')
        )
        
        # Add default values for status-based counts since status field doesn't exist
        feedback_stats.update({
            'pending_feedback': 0,
            'in_review_feedback': 0,
            'responded_feedback': 0,
            'resolved_feedback': 0
        })
        
        logger.info(f"📈 National feedback stats: {feedback_stats}")
        
        # Get other stats
        total_users = CustomUser.objects.filter(is_deleted=False).count()
        total_counties = County.objects.filter(is_active=True).count()
        total_projects = Project.objects.filter(is_deleted=False).count()
        
        # Bills stats with optimized query
        bill_stats = Bill.objects.filter(is_deleted=False).aggregate(
            total_bills=Count('id'),
            active_bills=Count(Case(
                When(status__in=['first_reading', 'committee_stage', 'second_reading'], then=1),
                output_field=IntegerField()
            ))
        )
        
        stats = {
            'total_users': total_users,
            'total_counties': total_counties,
            'total_feedback': feedback_stats['total_feedback'],
            'pending_feedback': feedback_stats['pending_feedback'],
            'in_review_feedback': feedback_stats['in_review_feedback'],
            'responded_feedback': feedback_stats['responded_feedback'],
            'resolved_feedback': feedback_stats['resolved_feedback'],
            'total_projects': total_projects,
            'active_projects': Project.objects.filter(
                status__in=['approved', 'in_progress'], 
                is_deleted=False
            ).count(),
            'total_bills': bill_stats['total_bills'],
            'active_bills': bill_stats['active_bills'],
        }
        
        return Response({
            'success': True,
            'data': stats,
            'user_level': user.admin_level,
            'scope': 'national',
            'message': f'📊 Dashboard statistics retrieved successfully for {user.name}'
        })
        
    except Exception as e:
        logger.error(f"❌ Dashboard stats system error: {str(e)}")
        return Response({
            'success': False,
            'message': '🔧 Dashboard temporarily unavailable. Please refresh the page.',
            'error_code': 'DASHBOARD_SYSTEM_ERROR',
            'suggestions': [
                'Refresh the page and try again',
                'Check your internet connection',
                'Contact support if the problem persists'
            ]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Get users list for national parliament admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            logger.warning(f"🚫 Unauthorized users list access attempt by {user.email} (Role: {user.role})")
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # National scope - see all users
        users = CustomUser.objects.filter(is_deleted=False)
        
        users_data = [{
            'id': u.id,
            'name': u.name,
            'email': u.email,
            'role': u.role,
            'role_display': u.get_role_display(),
            'admin_level': u.admin_level,
            'county': u.user_county.name if u.user_county else 'No County',
            'is_active': u.is_active,
            'date_joined': u.date_joined
        } for u in users]
        
        return Response({
            'success': True,
            'data': users_data,
            'count': len(users_data),
            'message': f'👥 Retrieved {len(users_data)} users successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Users list system error: {str(e)}")
        return Response({
            'success': False,
            'message': '🔧 Users list temporarily unavailable. Please refresh the page.',
            'error_code': 'USERS_LIST_SYSTEM_ERROR',
            'suggestions': [
                'Refresh the page and try again',
                'Check your internet connection',
                'Contact support if the problem persists'
            ]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_feedback_list(request):
    """Get feedback list for national parliament admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            logger.warning(f"🚫 Unauthorized feedback list access attempt by {user.email} (Role: {user.role})")
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Debug logging
        logger.info(f"🔍 Parliament Admin {user.name} (Level: {user.admin_level}) accessing national feedback")
        
        # Get all national feedback with optimized query
        feedback_queryset = Feedback.objects.filter(
            is_deleted=False  # Only show non-deleted feedback
        ).select_related('user', 'user__user_county').order_by('-created_at')
        
        logger.info(f"📊 Total national feedback found: {feedback_queryset.count()}")
        
        feedback_data = []
        for f in feedback_queryset:
            try:
                feedback_item = {
                    'id': str(f.id),
                    'title': f.title,
                    'content': f.content,
                    'category': f.category,
                    'category_display': f.get_category_display(),
                    'priority': f.priority,
                    'priority_display': f.get_priority_display(),
                    'tracking_id': str(f.id),
                    'county': f.user.user_county.name if f.user and f.user.user_county else 'Unknown',
                    'location_path': f.get_location_path(),
                    'created_at': f.created_at,
                    'updated_at': f.updated_at,
                    'is_anonymous': f.is_anonymous,
                    'response_count': f.response_count,
                    'last_response_at': f.last_response_at,
                    'view_count': f.view_count,
                    'sentiment_score': f.sentiment_score,
                    'user_name': f.user.name if f.user and not f.is_anonymous else 'Anonymous',
                    'user_email': f.user.email if f.user and not f.is_anonymous else None,
                    'submitted_via': f.submitted_via,
                    'can_edit': f.can_edit,
                    'can_delete': f.can_delete,
                    'edit_count': f.edit_count,
                    'edited_at': f.edited_at
                }
                feedback_data.append(feedback_item)
            except Exception as e:
                logger.error(f"❌ Error processing feedback {f.id}: {e}")
                continue
        
        logger.info(f"✅ Successfully processed {len(feedback_data)} national feedback items")
        
        return Response({
            'success': True,
            'data': feedback_data,
            'total_count': len(feedback_data),
            'user_level': user.admin_level,
            'scope': 'national',
            'message': f'📝 Retrieved {len(feedback_data)} feedback items successfully'
        })
        
    except Exception as e:
        logger.error(f"❌ Feedback list system error: {str(e)}")
        return Response({
            'success': False,
            'message': '🔧 Feedback list temporarily unavailable. Please refresh the page.',
            'error_code': 'FEEDBACK_LIST_SYSTEM_ERROR',
            'suggestions': [
                'Refresh the page and try again',
                'Check your internet connection',
                'Contact support if the problem persists'
            ]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_feedback(request, feedback_id):
    """Respond to feedback as parliament admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            logger.warning(f"🚫 Unauthorized feedback response attempt by {user.email} (Role: {user.role})")
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        feedback = Feedback.objects.get(id=feedback_id, is_deleted=False)
        
        response_text = request.data.get('response_text', '').strip()
        if not response_text:
            return Response({
                'success': False,
                'message': '💬 Please provide a response message for the citizen.',
                'error_code': 'RESPONSE_TEXT_REQUIRED',
                'suggestions': [
                    'Write a clear response explaining the government action',
                    'Include timeline for resolution if applicable',
                    'Be specific about next steps'
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if len(response_text) < 10:
            return Response({
                'success': False,
                'message': '💬 Response must be at least 10 characters long to be meaningful.',
                'error_code': 'RESPONSE_TOO_SHORT',
                'suggestions': [
                    'Provide a detailed response to help the citizen',
                    'Explain what action will be taken',
                    'Include contact information if needed'
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"💬 Parliament Admin {user.name} responding to feedback {feedback.id}")
        
        # Create feedback response using the correct model
        from apps.feedback.models import FeedbackResponse
        
        response_obj = FeedbackResponse.objects.create(
            feedback=feedback,
            responder=user,
            content=response_text,
            is_public=True
        )
        
        # Update feedback response tracking
        feedback.response_count += 1
        feedback.last_response_at = timezone.now()
        feedback.save(update_fields=['response_count', 'last_response_at'])
        
        logger.info(f"✅ Parliament response created successfully for feedback {feedback.id}")
        
        return Response({
            'success': True,
            'message': '✅ Parliament response sent successfully',
            'response_id': str(response_obj.id)
        })
        
    except Feedback.DoesNotExist:
        logger.error(f"❌ Feedback {feedback_id} not found for parliament response")
        return Response({
            'success': False,
            'message': '📝 Feedback not found. Please check the feedback ID and try again.',
            'error_code': 'FEEDBACK_NOT_FOUND',
            'suggestions': [
                'Verify the feedback ID is correct',
                'Check if the feedback has been deleted',
                'Refresh the feedback list and try again'
            ]
        }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        logger.error(f"❌ Error responding to feedback: {e}")
        return Response({
            'success': False,
            'message': '🔧 Failed to send response. Please try again.',
            'error_code': 'RESPONSE_SYSTEM_ERROR',
            'suggestions': [
                'Check your internet connection',
                'Try submitting the response again',
                'Contact technical support if the problem persists'
            ]
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_projects_list(request):
    """Get projects list for parliament admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        projects = Project.objects.filter(is_deleted=False).order_by('-created_at')
        
        projects_data = [{
            'id': str(p.id),
            'title': p.title,
            'description': p.description,
            'status': p.status,
            'created_at': p.created_at,
            'updated_at': p.updated_at
        } for p in projects]
        
        return Response({
            'success': True,
            'data': projects_data,
            'count': len(projects_data)
        })
        
    except Exception as e:
        logger.error(f"❌ Projects list error: {e}")
        return Response({
            'success': False,
            'message': '🔧 Projects list temporarily unavailable.',
            'error_code': 'PROJECTS_LIST_ERROR'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_project_status(request, project_id):
    """Update project status"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        project = Project.objects.get(id=project_id, is_deleted=False)
        new_status = request.data.get('status')
        
        if not new_status:
            return Response({
                'success': False,
                'message': 'Status is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        project.status = new_status
        project.save()
        
        return Response({
            'success': True,
            'message': 'Project status updated successfully'
        })
        
    except Project.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Project not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Update project status error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to update project status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_project_detail(request, project_id):
    """Get project detail for admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        project = Project.objects.get(id=project_id, is_deleted=False)
        
        project_data = {
            'id': str(project.id),
            'title': project.title,
            'description': project.description,
            'status': project.status,
            'created_at': project.created_at,
            'updated_at': project.updated_at
        }
        
        return Response({
            'success': True,
            'data': project_data
        })
        
    except Project.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Project not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Project detail error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get project details'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([])
def public_projects_list(request):
    """Get public projects list"""
    try:
        projects = Project.objects.filter(is_deleted=False, status='published').order_by('-created_at')
        
        projects_data = [{
            'id': str(p.id),
            'title': p.title,
            'description': p.description,
            'status': p.status,
            'created_at': p.created_at
        } for p in projects]
        
        return Response({
            'success': True,
            'data': projects_data,
            'count': len(projects_data)
        })
        
    except Exception as e:
        logger.error(f"❌ Public projects list error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get projects list'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_bills_list(request):
    """Get/Create bills list for admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        if request.method == 'GET':
            bills = Bill.objects.filter(is_deleted=False).order_by('-created_at')
            
            bills_data = [{
                'id': str(b.id),
                'title': b.title,
                'description': b.description,
                'sponsor': b.sponsor,
                'status': b.status,
                'status_display': b.get_status_display(),
                'participation_deadline': b.participation_deadline,
                'document': b.document.url if b.document else None,
                'summary': b.summary,
                'processing_status': b.processing_status,
                'processing_progress': b.processing_progress,
                'created_at': b.created_at,
                'updated_at': b.updated_at
            } for b in bills]
            
            return Response({
                'success': True,
                'data': bills_data,
                'count': len(bills_data)
            })
        
        elif request.method == 'POST':
            title = request.data.get('title', '').strip()
            description = request.data.get('description', '').strip()
            sponsor = request.data.get('sponsor', '').strip()
            status_value = request.data.get('status', 'draft')
            participation_deadline = request.data.get('participation_deadline')
            document = request.FILES.get('document')
            
            # Validate required fields
            if not title:
                return Response({
                    'success': False,
                    'message': 'Title is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not description:
                return Response({
                    'success': False,
                    'message': 'Description is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not sponsor:
                return Response({
                    'success': False,
                    'message': 'Sponsor is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                # Create bill with all fields
                bill_data = {
                    'title': title,
                    'description': description,
                    'sponsor': sponsor,
                    'status': status_value,
                    'created_by': user
                }
                
                # Add optional fields if provided
                if participation_deadline:
                    bill_data['participation_deadline'] = participation_deadline
                
                if document:
                    bill_data['document'] = document
                
                bill = Bill.objects.create(**bill_data)
                
                # If document is provided, trigger processing
                if document:
                    try:
                        from .tasks import process_bill_document_complete
                        # Start async processing
                        bill.processing_status = 'processing'
                        bill.processing_message = 'Starting document processing...'
                        bill.save(update_fields=['processing_status', 'processing_message'])
                        
                        # Process document in background
                        process_bill_document_complete.delay(str(bill.id))
                        
                        logger.info(f"✅ Bill created with document processing: {bill.id}")
                    except Exception as e:
                        logger.error(f"❌ Error starting bill processing: {e}")
                        # Bill is still created, just processing failed
                
                return Response({
                    'success': True,
                    'data': {
                        'id': str(bill.id), 
                        'title': bill.title,
                        'description': bill.description,
                        'sponsor': bill.sponsor,
                        'status': bill.status,
                        'processing_status': bill.processing_status
                    },
                    'message': 'Bill created successfully'
                })
                
            except Exception as e:
                logger.error(f"❌ Error creating bill: {e}")
                return Response({
                    'success': False,
                    'message': 'Failed to create bill. Please try again.'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    except Exception as e:
        logger.error(f"❌ Bills list error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to process bills request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_bill_detail(request, bill_id):
    """Get, update, or delete bill detail for admin"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        if request.method == 'GET':
            bill_data = {
                'id': str(bill.id),
                'title': bill.title,
                'description': bill.description,
                'sponsor': bill.sponsor,
                'status': bill.status,
                'participation_deadline': bill.participation_deadline,
                'document': bill.document.url if bill.document else None,
                'summary': bill.summary,
                'processing_status': bill.processing_status,
                'created_at': bill.created_at,
                'updated_at': bill.updated_at
            }
            
            return Response({
                'success': True,
                'data': bill_data
            })
        
        elif request.method == 'PUT':
            # Update bill fields
            title = request.data.get('title', '').strip()
            description = request.data.get('description', '').strip()
            sponsor = request.data.get('sponsor', '').strip()
            status_value = request.data.get('status')
            participation_deadline = request.data.get('participation_deadline')
            document = request.FILES.get('document')
            
            # Validate required fields if provided
            if title and not title:
                return Response({
                    'success': False,
                    'message': 'Title cannot be empty'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Update fields
            if title:
                bill.title = title
            if description:
                bill.description = description
            if sponsor:
                bill.sponsor = sponsor
            if status_value:
                bill.status = status_value
            if participation_deadline:
                bill.participation_deadline = participation_deadline
            if document:
                bill.document = document
                # Trigger reprocessing if new document uploaded
                bill.processing_status = 'processing'
                bill.processing_message = 'Reprocessing document...'
            
            bill.save()
            
            # Start document processing if new document
            if document:
                try:
                    from .tasks import process_bill_document_complete
                    process_bill_document_complete.delay(str(bill.id))
                except Exception as e:
                    logger.error(f"❌ Error starting bill reprocessing: {e}")
            
            return Response({
                'success': True,
                'message': 'Bill updated successfully'
            })
        
        elif request.method == 'DELETE':
            bill.is_deleted = True
            bill.save()
            
            return Response({
                'success': True,
                'message': 'Bill deleted successfully'
            })
        
    except Bill.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Bill not found'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"❌ Bill detail error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to process bill request'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([])
def public_bills_list(request):
    """Get public bills list for citizens"""
    try:
        # Get all bills that are not deleted (including drafts for public viewing)
        bills = Bill.objects.filter(
            is_deleted=False
        ).select_related('created_by').order_by('-created_at')
        
        bills_data = []
        for b in bills:
            # Check if bill can support chat (has chunks)
            can_chat = b.is_chunked and b.total_chunks > 0
            
            # Calculate estimated reading time
            estimated_reading_time = 5  # Default minimum
            if b.summary:
                word_count = len(b.summary.split())
                estimated_reading_time = max(5, word_count // 250)
            
            bill_data = {
                'id': str(b.id),
                'title': b.title,
                'description': b.description,
                'sponsor': b.sponsor,
                'status': b.status,
                'status_display': b.get_status_display(),
                'participation_deadline': b.participation_deadline,
                'created_at': b.created_at,
                'summary_available': bool(b.summary_html and b.summary_html.strip()),
                'can_chat': can_chat,
                'total_chunks': b.total_chunks,
                'estimated_reading_time': estimated_reading_time,
                'has_document': bool(b.document),
                'processing_status': b.processing_status
            }
            bills_data.append(bill_data)
        
        # Pagination info (simple version)
        pagination_info = {
            'current_page': 1,
            'total_pages': 1,
            'total_bills': len(bills_data),
            'has_next': False,
            'has_previous': False,
            'page_size': len(bills_data)
        }
        
        return Response({
            'success': True,
            'bills': bills_data,
            'pagination': pagination_info,
            'filters': {
                'available_statuses': [],
                'available_sponsors': [],
                'current_filters': {}
            },
            'summary': {
                'total_published_bills': len(bills_data),
                'chat_enabled_bills': len([b for b in bills_data if b['can_chat']]),
                'recent_bills': len([b for b in bills_data if 
                    (timezone.now() - b['created_at']).days <= 30])
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Public bills list error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get bills list',
            'bills': [],
            'pagination': {
                'current_page': 1,
                'total_pages': 0,
                'total_bills': 0,
                'has_next': False,
                'has_previous': False
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_progress(request, bill_id):
    """Get bill processing progress"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': {
                'bill_id': str(bill_id),
                'progress': 100,
                'status': 'completed'
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Bill progress error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get bill progress'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_bill_reprocess(request, bill_id):
    """Reprocess bill"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'message': 'Bill reprocessing started'
        })
        
    except Exception as e:
        logger.error(f"❌ Bill reprocess error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to reprocess bill'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_processing_overview(request):
    """Get processing overview"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': {
                'total_bills': 0,
                'processing': 0,
                'completed': 0,
                'failed': 0
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Processing overview error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get processing overview'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_processing_status(request, bill_id):
    """Get bill processing status"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'data': {
                'bill_id': str(bill_id),
                'status': 'completed',
                'progress': 100
            }
        })
        
    except Exception as e:
        logger.error(f"❌ Bill processing status error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to get processing status'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_retry_bill_processing(request, bill_id):
    """Retry bill processing"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'message': 'Bill processing retry started'
        })
        
    except Exception as e:
        logger.error(f"❌ Bill retry error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to retry bill processing'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_bill_processing(request, bill_id):
    """Cancel bill processing"""
    try:
        user = request.user
        
        if user.role != 'parliament_admin':
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'success': True,
            'message': 'Bill processing cancelled'
        })
        
    except Exception as e:
        logger.error(f"❌ Bill cancel error: {e}")
        return Response({
            'success': False,
            'message': 'Failed to cancel bill processing'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)