# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
from apps.api.utils import summarize_bill_document
from apps.projects.models import Project, Bill, AdminFeedbackResponse
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics for national parliament system"""
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # Debug logging
    print(f"📊 National dashboard stats for {user.name} (Level: {user.admin_level})")
    
    # Get national stats (no county filtering for national system)
    total_feedback = Feedback.objects.filter(is_deleted=False).count()
    pending_feedback = Feedback.objects.filter(status='pending', is_deleted=False).count()
    in_review_feedback = Feedback.objects.filter(status='in_review', is_deleted=False).count()
    responded_feedback = Feedback.objects.filter(status='responded', is_deleted=False).count()
    resolved_feedback = Feedback.objects.filter(status='resolved', is_deleted=False).count()
    
    print(f"📈 National feedback stats: Total={total_feedback}, Pending={pending_feedback}, In Review={in_review_feedback}, Responded={responded_feedback}, Resolved={resolved_feedback}")
    
    stats = {
        'total_users': CustomUser.objects.filter(is_deleted=False).count(),
        'total_counties': County.objects.filter(is_active=True).count(),
        'total_feedback': total_feedback,
        'pending_feedback': pending_feedback,
        'in_review_feedback': in_review_feedback,
        'responded_feedback': responded_feedback,
        'resolved_feedback': resolved_feedback,
        'total_projects': Project.objects.filter(is_deleted=False).count(),
        'active_projects': Project.objects.filter(
            status__in=['approved', 'in_progress'],
            is_deleted=False
        ).count(),
        'total_bills': Bill.objects.filter(is_deleted=False).count(),
        'active_bills': Bill.objects.filter(
            status__in=['first_reading', 'committee_stage', 'second_reading'],
            is_deleted=False
        ).count(),
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
        'county': u.user_county.name,
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
    print(f"🔍 Parliament Admin {user.name} (Level: {user.admin_level}) accessing national feedback")
    
    # Get all national feedback (no county filtering)
    feedback_queryset = Feedback.objects.filter(
        is_deleted=False  # Only show non-deleted feedback
    ).select_related('user').order_by('-created_at')
    
    print(f"📊 Total national feedback found: {feedback_queryset.count()}")
    
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
                'county': f.user.user_county.name if f.user else 'Unknown',
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
            print(f"❌ Error processing feedback {f.id}: {e}")
            continue
    
    print(f"✅ Successfully processed {len(feedback_data)} national feedback items")
    
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
        
        print(f"💬 Parliament Admin {user.name} responding to feedback {feedback.tracking_id}")
        
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
        
        print(f"✅ Parliament response created successfully for feedback {feedback.tracking_id}")
        
        return Response({
            'success': True,
            'message': 'Parliament response sent successfully',
            'response_id': str(response_obj.id),
            'feedback_status': feedback.status
        })
        
    except Feedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=404)
    except Exception as e:
        print(f"❌ Error responding to feedback: {e}")
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
            'title': b.title,
            'description': b.description,
            'sponsor': b.sponsor,
            'participation_deadline': b.participation_deadline,
            'document': b.document.url if b.document else None,
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
    
    bills_data = [{
        'id': str(b.id),
        'title': b.title,
        'description': b.description,
        'sponsor': b.sponsor,
        'participation_deadline': b.participation_deadline,
        'document': b.document.url if b.document else None,
        'summary': b.summary,
        'created_at': b.created_at
    } for b in bills]
    
    return Response({
        'success': True,
        'data': bills_data
    })