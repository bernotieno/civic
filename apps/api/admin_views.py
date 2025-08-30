# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Case, When, IntegerField
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
from apps.api.utils import summarize_bill_document
from apps.api.utils import summarize_bill_document
from apps.projects.models import Project, Bill, AdminFeedbackResponse
from .utils import (
    summarize_bill_document, 
    process_bill_with_enhanced_features, 
    validate_pdf_file
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

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_bills_list(request):
    """Get or create parliamentary bills"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        # Get all bills
        bills = Bill.objects.filter(is_deleted=False).select_related('created_by')
        
        bills_data = [{
            'id': str(b.id),
            'bill_number': b.bill_number,
            'title': b.title,
            'description': b.description,
            'sponsor': b.sponsor,
            'committee': b.committee,
            'status': b.status,
            'status_display': b.get_status_display(),
            'introduced_date': b.introduced_date,
            'first_reading_date': b.first_reading_date,
            'committee_deadline': b.committee_deadline,
            'public_participation_open': b.public_participation_open,
            'participation_deadline': b.participation_deadline,
            'document': b.document.url if b.document else None,
            'image': b.image.url if b.image else None,
            'summary': b.summary,
            'created_by': b.created_by.name if b.created_by else 'System',
            'created_at': b.created_at
        } for b in bills]
        
        return Response({
            'success': True,
            'data': bills_data
        })
    
    elif request.method == 'POST':
        data = request.data

        uploaded_doc = request.FILES.get('document')
        summary = None

        if uploaded_doc:
            summary = summarize_bill_document(uploaded_doc)

        
        try:
            bill = Bill.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                sponsor=data.get('sponsor'),
                status=data.get('status', 'draft'),
                participation_deadline=data.get('participation_deadline'),
                document=request.FILES.get('document'),
                summary=summary or '',
                created_by=user
            )
            
            return Response({
                'success': True,
                'message': 'Parliamentary bill created successfully',
                'bill_id': str(bill.id)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)



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
    
    # Get all active bills
    bills = Bill.objects.filter(
        is_deleted=False
    ).select_related('created_by')
    
    # Check if user is authenticated
    is_authenticated = request.user.is_authenticated
    
    bills_data = []
    for b in bills:
        bill_data = {
            'id': str(b.id),
            'bill_number': b.bill_number,
            'title': b.title,
            'description': b.description,
            'sponsor': b.sponsor,
            'committee': b.committee,
            'status': b.status,
            'status_display': b.get_status_display(),
            'introduced_date': b.introduced_date,
            'first_reading_date': b.first_reading_date,
            'committee_deadline': b.committee_deadline,
            'public_participation_open': b.public_participation_open,
            'participation_deadline': b.participation_deadline,
            'document': b.document.url if b.document else None,
            'image': b.image.url if b.image else None,
            'created_at': b.created_at
        }
        
        # Only include summary for authenticated users
        if is_authenticated:
            bill_data['summary'] = b.summary
        
        bills_data.append(bill_data)
    
    return Response({
        'success': True,
        'data': bills_data
    })