# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Case, When, IntegerField
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
# from apps.api.utils import summarize_bill_document  # Commented out - function not available
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
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # Debug logging
    logger.info(f"📊 National dashboard stats for {user.name} (Level: {user.admin_level})")
    
    # Optimize feedback stats with single aggregated query
    feedback_stats = Feedback.objects.filter(is_deleted=False).aggregate(
        total_feedback=Count('id'),
        pending_feedback=Count(Case(When(status='pending', then=1), output_field=IntegerField())),
        in_review_feedback=Count(Case(When(status='in_review', then=1), output_field=IntegerField())),
        responded_feedback=Count(Case(When(status='responded', then=1), output_field=IntegerField())),
        resolved_feedback=Count(Case(When(status='resolved', then=1), output_field=IntegerField()))
    )
    
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
        'scope': 'national'
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Get users list for national parliament admin"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
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
        'data': users_data
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_feedback_list(request):
    """Get feedback list for national parliament admin"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
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
                'status': f.status,
                'status_display': f.get_status_display(),
                'tracking_id': f.tracking_id,
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
        'scope': 'national'
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_feedback(request, feedback_id):
    """Respond to feedback as parliament admin"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        feedback = Feedback.objects.get(id=feedback_id, is_deleted=False)
        
        response_text = request.data.get('response_text')
        if not response_text:
            return Response({'error': 'Response text required'}, status=400)
        
        logger.info(f"💬 Parliament Admin {user.name} responding to feedback {feedback.tracking_id}")
        
        # Create feedback response using the correct model
        from apps.feedback.models import FeedbackResponse
        
        response_obj = FeedbackResponse.objects.create(
            feedback=feedback,
            responder=user,
            content=response_text,
            is_public=True
        )
        
        # Update feedback status and response tracking
        feedback.status = 'responded'
        feedback.response_count += 1
        feedback.last_response_at = timezone.now()
        feedback.save(update_fields=['status', 'response_count', 'last_response_at'])
        
        logger.info(f"✅ Parliament response created successfully for feedback {feedback.tracking_id}")
        
        return Response({
            'success': True,
            'message': 'Parliament response sent successfully',
            'response_id': str(response_obj.id),
            'feedback_status': feedback.status
        })
        
    except Feedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=404)
    except Exception as e:
        logger.error(f"❌ Error responding to feedback: {e}")
        return Response({'error': f'Failed to send response: {str(e)}'}, status=500)

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_projects_list(request):
    """Get or create national projects"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        # Get all national projects
        projects = Project.objects.filter(is_deleted=False).select_related('created_by')
        
        projects_data = [{
            'id': str(p.id),
            'title': p.title,
            'description': p.description,
            'sponsor': p.sponsor,
            'participation_deadline': p.participation_deadline,
            'document': p.document.url if p.document else None,
            'status': p.status,
            'status_display': p.get_status_display(),
            'summary': p.summary,
            'created_by': p.created_by.name if p.created_by else 'System',
            'created_at': p.created_at
        } for p in projects]
        
        return Response({
            'success': True,
            'data': projects_data
        })
    
    elif request.method == 'POST':
        data = request.data
        
        try:
            project = Project.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                sponsor=data.get('sponsor'),
                status=data.get('status', 'proposed'),
                participation_deadline=data.get('participation_deadline'),
                document=request.FILES.get('document'),
                created_by=user
            )
            
            return Response({
                'success': True,
                'message': 'National project created successfully',
                'project_id': str(project.id)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_project_status(request, project_id):
    """Update national project status"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id, is_deleted=False)
        
        new_status = request.data.get('status')
        if new_status not in dict(Project._meta.get_field('status').choices):
            return Response({'error': 'Invalid status'}, status=400)
        
        project.status = new_status
        project.save()
        
        return Response({
            'success': True,
            'message': 'National project status updated successfully'
        })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_project_detail(request, project_id):
    """Edit or delete national project"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id, is_deleted=False)
        
        if request.method == 'PUT':
            # Update project
            data = request.data
            
            project.title = data.get('title', project.title)
            project.description = data.get('description', project.description)
            project.sponsor = data.get('sponsor', project.sponsor)
            project.status = data.get('status', project.status)
            project.participation_deadline = data.get('participation_deadline', project.participation_deadline)
            
            if 'document' in request.FILES:
                project.document = request.FILES['document']
            
            project.save()
            
            return Response({
                'success': True,
                'message': 'National project updated successfully'
            })
        
        elif request.method == 'DELETE':
            # Soft delete project
            project.soft_delete(user)
            
            return Response({
                'success': True,
                'message': 'National project deleted successfully'
            })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@api_view(['GET'])
@permission_classes([])
def public_projects_list(request):
    """Get public projects list - no authentication required"""
    
    # Get all active projects (not deleted)
    projects = Project.objects.filter(is_deleted=False).select_related('created_by')
    
    projects_data = [{
        'id': str(p.id),
        'title': p.title,
        'description': p.description,
        'sponsor': p.sponsor,
        'participation_deadline': p.participation_deadline,
        'document': p.document.url if p.document else None,
        'status': p.status,
        'status_display': p.get_status_display(),
        'summary': p.summary,
        'created_at': p.created_at
    } for p in projects]
    
    return Response({
        'success': True,
        'data': projects_data
    })


@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_bill_detail(request, bill_id):
    """Edit or delete parliamentary bill"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        if request.method == 'PUT':
            # Update bill
            data = request.data
            
            bill.title = data.get('title', bill.title)
            bill.description = data.get('description', bill.description)
            bill.sponsor = data.get('sponsor', bill.sponsor)
            bill.status = data.get('status', bill.status)
            bill.participation_deadline = data.get('participation_deadline', bill.participation_deadline)
            
            if 'document' in request.FILES:
                bill.document = request.FILES['document']
            
            bill.save()
            
            return Response({
                'success': True,
                'message': 'Parliamentary bill updated successfully'
            })
        
        elif request.method == 'DELETE':
            # Soft delete bill
            bill.soft_delete(user)
            
            return Response({
                'success': True,
                'message': 'Parliamentary bill deleted successfully'
            })
        
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=404)

@api_view(['GET'])
@permission_classes([])
def public_bills_list(request):
    """Get public bills list - no authentication required"""
    
    # Get all bills including drafts
    bills = Bill.objects.filter(
        is_deleted=False,
        status__in=[  # Include draft bills
            'draft', 'first_reading', 'committee_stage', 'second_reading', 
            'third_reading', 'presidential_assent', 'enacted'
        ]
    ).select_related('created_by')
    
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
        'created_at': b.created_at,
        'summary_available': bool(getattr(b, 'summary_html', '').strip()),
        'can_chat': getattr(b, 'is_chunked', False) and getattr(b, 'total_chunks', 0) > 0,
        'total_chunks': getattr(b, 'total_chunks', 0),
        'has_document': bool(b.document)
    } for b in bills]
    
    return Response({
        'success': True,
        'data': bills_data
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_bills_list(request):
    """
    Get or create parliamentary bills
    ENHANCED: Now supports async processing with fallback to sync
    BACKWARD COMPATIBLE: All Phase 1 functionality preserved
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        # Get all bills with enhanced progress and async information
        bills = Bill.objects.filter(is_deleted=False).select_related('created_by')
        
        bills_data = []
        for b in bills:
            bill_data = {
                'id': str(b.id),
                'title': b.title,
                'description': b.description,
                'sponsor': b.sponsor,
                'status': b.status,
                'status_display': b.get_status_display(),
                'participation_deadline': b.participation_deadline,
                'document': b.document.url if b.document else None,
                'summary': b.summary,
                'created_by': b.created_by.name if b.created_by else 'System',
                'created_at': b.created_at,
            }
            bills_data.append(bill_data)
        
        return Response({
            'success': True,
            'data': bills_data
        })
    
    elif request.method == 'POST':
        data = request.data
        uploaded_doc = request.FILES.get('document')
        
        # NEW Phase 2: Check processing preference (default to sync for now)
        use_async = data.get('async_processing', False)  # Changed to False to force sync
        force_sync = data.get('force_sync', True)  # Force sync by default
        
        # Validate file if provided
        validation_result = {}
        if uploaded_doc:
            validation_result = validate_pdf_file(uploaded_doc)
            if not validation_result['valid']:
                return Response({
                    'success': False,
                    'error': 'File validation failed',
                    'validation_errors': validation_result['errors']
                }, status=400)
        
        # Validate required fields
        title = data.get('title', '').strip()
        description = data.get('description', '').strip()
        sponsor = data.get('sponsor', '').strip()
        
        if not title:
            return Response({'error': 'Title is required'}, status=400)
        if not description:
            return Response({'error': 'Description is required'}, status=400)
        if not sponsor:
            return Response({'error': 'Sponsor is required'}, status=400)
        
        try:
            # Create bill instance first (same as Phase 1)
            bill = Bill.objects.create(
                title=title,
                description=description,
                sponsor=sponsor,
                status=data.get('status', 'draft'),
                participation_deadline=data.get('participation_deadline'),
                document=uploaded_doc,
                summary='',  # Will be populated after processing
                created_by=user,
                # Initialize progress fields
                processing_status='pending' if uploaded_doc else 'completed',
                processing_progress=0 if uploaded_doc else 100,
                processing_message='Waiting to start processing...' if uploaded_doc else 'No document to process',
            )
            
            logger.info(f"Created bill {bill.id}: {bill.title}")
            
            # Process document if provided
            if uploaded_doc and use_async and not force_sync:
                # NEW Phase 2: Async processing path
                try:
                    from .tasks import process_bill_async
                    
                    logger.info(f"Starting async processing for bill {bill.id}")
                    
                    # Save file for async processing
                    file_path = save_uploaded_file_for_async(uploaded_doc, str(bill.id))
                    
                    # Start async task
                    task = process_bill_async.delay(str(bill.id), file_path)
                    
                    # Setup progress tracking
                    session_result = start_async_bill_processing(str(bill.id), task.id)
                    
                    if session_result['success']:
                        response_data = {
                            'success': True,
                            'message': 'Bill created and async processing started',
                            'bill_id': str(bill.id),
                            'processing_async': True,
                            'task_id': task.id,
                            'session_id': session_result['session_id'],
                            'websocket_channel': session_result['websocket_channel'],
                            'estimated_time': estimate_processing_time(
                                validation_result.get('page_count', 0)
                            ),
                            'progress_endpoints': {
                                'status': f'/api/admin/bills/{bill.id}/status/',
                                'websocket': f'/ws/bills/{bill.id}/progress/',
                                'polling': f'/api/admin/bills/{bill.id}/progress/'
                            }
                        }
                        
                        logger.info(f"Async processing started for bill {bill.id}")
                        return Response(response_data)
                    else:
                        logger.warning(f"Failed to start async session for bill {bill.id}, falling back to sync")
                        # Fall through to sync processing
                        use_async = False
                
                except Exception as e:
                    logger.error(f"Async processing setup failed for bill {bill.id}: {str(e)}")
                    # Fall through to sync processing
                    use_async = False
            
            if uploaded_doc and (not use_async or force_sync):
                # Phase 1: Sync processing path - Complete processing (summary + chunks)
                try:
                    logger.info(f"Starting complete processing for bill {bill.id}")
                    
                    # Use complete processing function that does both summary and chunking
                    result = process_bill_document_complete(uploaded_doc, bill)
                    
                    if result['success']:
                        # Update bill with results
                        bill.summary = result['summary_markdown']
                        bill.summary_html = result['summary_html']
                        bill.processing_status = 'completed'
                        bill.processing_progress = 100
                        bill.processing_message = 'Processing complete'
                        bill.save()
                        
                        return Response({
                            'success': True,
                            'message': 'Bill created and processed successfully',
                            'bill_id': str(bill.id),
                            'processing_async': False,
                            'summary_generated': True,
                            'chunks_created': result['chunks_created'],
                            'can_chat': result['chunks_created'] > 0,
                            'processing_method': 'complete'
                        })
                    else:
                        raise Exception(result['error'])
                
                except Exception as e:
                    # Sync processing failed, update bill status
                    error_msg = str(e)
                    logger.error(f"Sync processing failed for bill {bill.id}: {error_msg}")
                    
                    bill.processing_status = 'failed'
                    bill.processing_progress = 0
                    bill.processing_message = f'Sync processing failed: {error_msg}'
                    bill.save()
                    
                    return Response({
                        'success': True,
                        'message': 'Bill created but processing failed',
                        'bill_id': str(bill.id),
                        'processing_async': False,
                        'processing_error': error_msg,
                        'can_retry': True
                    })
            
            # No document to process
            return Response({
                'success': True,
                'message': 'Bill created successfully (no document)',
                'bill_id': str(bill.id),
                'processing_async': False,
                'summary_generated': False
            })
            
        except Exception as e:
            logger.error(f"Bill creation failed: {str(e)}")
            return Response({'error': str(e)}, status=400)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_progress(request, bill_id):
    """
    Get bill processing progress (Phase 1 endpoint - maintained)
    Enhanced to work with both sync and async processing
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Check if bill has async processing session
        try:
            async_status = get_bill_processing_status(bill_id)
            if async_status['processing_status'] != 'error':
                # Return async status
                response_data = {
                    'success': True,
                    'bill_id': bill_id,
                    'progress': async_status,
                    'processing_type': 'async',
                    'supports_realtime': True
                }
                return Response(response_data)
        except Exception as e:
            logger.debug(f"No async session for bill {bill_id}, using Phase 1 progress")
        
        # Get bill and return actual progress from database
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        # Use actual progress from bill instance
        progress_data = {
            'status': getattr(bill, 'processing_status', 'pending'),
            'progress': getattr(bill, 'processing_progress', 0),
            'message': getattr(bill, 'processing_message', 'Processing...'),
            'completion_percentage': getattr(bill, 'processing_progress', 0),
            'current_stage': getattr(bill, 'processing_message', 'Processing...'),
            'estimated_time_remaining': getattr(bill, 'estimated_time_remaining', None)
        }
        
        response_data = {
            'success': True,
            'bill_id': bill_id,
            'bill_title': bill.title,
            'progress': progress_data,
            'processing_type': 'sync',
            'supports_realtime': False,
            'bill_info': {
                'has_document': bool(bill.document),
                'created_at': bill.created_at,
                'total_chunks': getattr(bill, 'total_chunks', 0),
                'is_chunked': getattr(bill, 'is_chunked', False),
            }
        }
        
        return Response(response_data)
        
    except Bill.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Bill not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Failed to get progress for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_processing_status(request, bill_id):
    """
    NEW ENDPOINT: Get detailed processing status for async operations
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get comprehensive processing status
        status = get_bill_processing_status(bill_id)
        
        return Response({
            'success': True,
            'bill_id': bill_id,
            'status': status,
            'supports_cancellation': status.get('task_info', {}).get('task_active', False),
            'supports_retry': status.get('can_retry', False)
        })
        
    except Exception as e:
        logger.error(f"Failed to get processing status for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_retry_bill_processing(request, bill_id):
    """
    NEW ENDPOINT: Retry failed bill processing
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get processing preference from request
        use_async = request.data.get('async_processing', True)
        
        if use_async:
            # Async retry
            result = retry_failed_bill_processing(bill_id)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': result['message'],
                    'bill_id': bill_id,
                    'new_task_id': result['new_task_id'],
                    'retry_attempt': result['retry_attempt'],
                    'processing_async': True,
                    'progress_endpoints': {
                        'status': f'/api/admin/bills/{bill_id}/status/',
                        'websocket': f'/ws/bills/{bill_id}/progress/',
                        'polling': f'/api/admin/bills/{bill_id}/progress/'
                    }
                })
            else:
                return Response({
                    'success': False,
                    'error': result['message'],
                    'can_try_sync': True
                }, status=400)
        else:
            # Sync retry using Phase 1 functionality
            try:
                bill = Bill.objects.get(id=bill_id, is_deleted=False)
                
                if not bill.document:
                    return Response({
                        'success': False,
                        'error': 'Bill has no document to process'
                    }, status=400)
                
                # Reset progress
                reset_bill_progress(bill_id)
                
                # Use Phase 1 enhanced processing
                result = process_bill_with_enhanced_features(
                    bill.document.file,
                    bill,
                    use_enhanced=True
                )
                
                if result['success']:
                    return Response({
                        'success': True,
                        'message': 'Bill reprocessing completed (sync)',
                        'bill_id': bill_id,
                        'processing_async': False,
                        'result': {
                            'used_enhanced': result['used_enhanced'],
                            'sections_count': result['sections_count'],
                            'chunks_created': result['chunks_created']
                        }
                    })
                else:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=500)
            
            except Bill.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Bill not found'
                }, status=404)
        
    except Exception as e:
        logger.error(f"Failed to retry processing for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_bill_processing(request, bill_id):
    """
    NEW ENDPOINT: Cancel ongoing bill processing
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        result = cancel_bill_processing(bill_id)
        
        if result['success']:
            return Response({
                'success': True,
                'message': result['message'],
                'bill_id': bill_id,
                'was_cancelled': result['was_cancelled'],
                'task_id': result.get('task_id'),
                'can_retry': True
            })
        else:
            return Response({
                'success': False,
                'error': result['message']
            }, status=500)
        
    except Exception as e:
        logger.error(f"Failed to cancel processing for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_bill_reprocess(request, bill_id):
    """
    Enhanced reprocess endpoint (Phase 1 maintained + Phase 2 async support)
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # This endpoint now delegates to the retry endpoint for consistency
    return admin_retry_bill_processing(request, bill_id)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_processing_overview(request):
    """
    Enhanced processing overview (Phase 1 maintained + Phase 2 async info)
    """
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get summary statistics
        total_bills = Bill.objects.filter(is_deleted=False).count()
        
        completed_bills = Bill.objects.filter(
            is_deleted=False, 
            processing_status='completed'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        failed_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='failed'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        processing_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='processing'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        pending_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='pending'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        # NEW Phase 2: Get active async sessions
        active_sessions = get_all_active_processing_sessions()
        
        return Response({
            'success': True,
            'summary': {
                'total_bills': total_bills,
                'completed_bills': completed_bills,
                'failed_bills': failed_bills,
                'currently_processing': processing_bills,
                'pending_processing': pending_bills,
                # Phase 2 additions
                'active_async_sessions': len(active_sessions),
                'async_processing_available': True,
                'websocket_support': True
            },
            'active_sessions': active_sessions,
            'capabilities': {
                'async_processing': True,
                'real_time_updates': True,
                'task_cancellation': True,
                'retry_with_backoff': True,
                'sync_fallback': True
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get processing overview: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)


# @api_view(['GET', 'POST'])
# @permission_classes([IsAuthenticated])
# def admin_bills_list(request):
#     """Get or create parliamentary bills"""
#     user = request.user
    
#     if user.role != 'parliament_admin':
#         return Response({'error': 'Access denied'}, status=403)
    
#     if request.method == 'GET':
#         # Get all bills
#         bills = Bill.objects.filter(is_deleted=False).select_related('created_by')
        
#         bills_data = [{
#             'id': str(b.id),
#             'title': b.title,
#             'description': b.description,
#             'sponsor': b.sponsor,
#             'status': b.status,
#             'status_display': b.get_status_display(),
#             'participation_deadline': b.participation_deadline,
#             'document': b.document.url if b.document else None,
#             'summary': b.summary,
#             'created_by': b.created_by.name if b.created_by else 'System',
#             'created_at': b.created_at
#         } for b in bills]
        
#         return Response({
#             'success': True,
#             'data': bills_data
#         })
    
#     elif request.method == 'POST':
#         data = request.data

#         uploaded_doc = request.FILES.get('document')
#         summary = None

#         if uploaded_doc:
#             summary = summarize_bill_document(uploaded_doc)

        
#         try:
#             bill = Bill.objects.create(
#                 title=data.get('title'),
#                 description=data.get('description'),
#                 sponsor=data.get('sponsor'),
#                 status=data.get('status', 'draft'),
#                 participation_deadline=data.get('participation_deadline'),
#                 document=request.FILES.get('document'),
#                 summary=summary or '',
#                 created_by=user
#             )
            
#             return Response({
#                 'success': True,
#                 'message': 'Parliamentary bill created successfully',
#                 'bill_id': str(bill.id),
#                 'summary_generated': summary is not None and "AI summarization failed" not in summary
#             })
            
#         except Exception as e:
#             return Response({'error': str(e)}, status=400)
