# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
from apps.projects.models import Project, AdminFeedbackResponse
import json

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    accessible_counties = user.get_accessible_counties()
    
    # Debug logging
    print(f"📊 Dashboard stats for {user.name} (Level: {user.official_level})")
    print(f"🏛️ Accessible counties: {[c.name for c in accessible_counties]}")
    
    # Get stats with proper filtering
    total_feedback = Feedback.objects.filter(
        county__in=accessible_counties,
        is_deleted=False
    ).count()
    
    pending_feedback = Feedback.objects.filter(
        county__in=accessible_counties,
        status='pending',
        is_deleted=False
    ).count()
    
    in_review_feedback = Feedback.objects.filter(
        county__in=accessible_counties,
        status='in_review',
        is_deleted=False
    ).count()
    
    responded_feedback = Feedback.objects.filter(
        county__in=accessible_counties,
        status='responded',
        is_deleted=False
    ).count()
    
    resolved_feedback = Feedback.objects.filter(
        county__in=accessible_counties,
        status='resolved',
        is_deleted=False
    ).count()
    
    print(f"📈 Feedback stats: Total={total_feedback}, Pending={pending_feedback}, In Review={in_review_feedback}, Responded={responded_feedback}, Resolved={resolved_feedback}")
    
    stats = {
        'total_users': CustomUser.objects.filter(
            tenant__in=accessible_counties,
            is_deleted=False
        ).count(),
        'total_counties': accessible_counties.count(),
        'total_feedback': total_feedback,
        'pending_feedback': pending_feedback,
        'in_review_feedback': in_review_feedback,
        'responded_feedback': responded_feedback,
        'resolved_feedback': resolved_feedback,
        'total_projects': Project.objects.filter(
            county__in=accessible_counties,
            is_deleted=False
        ).count(),
        'active_projects': Project.objects.filter(
            county__in=accessible_counties,
            status__in=['approved', 'in_progress'],
            is_deleted=False
        ).count(),
    }
    
    return Response({
        'success': True,
        'data': stats,
        'user_level': user.official_level,
        'accessible_counties': [{'id': c.id, 'name': c.name, 'code': c.code} for c in accessible_counties]
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Get users list for admin"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    accessible_counties = user.get_accessible_counties()
    users = CustomUser.objects.filter(tenant__in=accessible_counties)
    
    users_data = [{
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'role': u.role,
        'county': u.tenant.name,
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
    """Get feedback list for admin"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    accessible_counties = user.get_accessible_counties()
    
    # Debug logging
    print(f"🔍 Admin {user.name} (Level: {user.official_level}) accessing feedback")
    print(f"🏛️ Accessible counties: {[c.name for c in accessible_counties]}")
    
    # Get feedback with proper filtering
    feedback_queryset = Feedback.objects.filter(
        county__in=accessible_counties,
        is_deleted=False  # Only show non-deleted feedback
    ).select_related('county', 'user').order_by('-created_at')
    
    print(f"📊 Total feedback found: {feedback_queryset.count()}")
    
    feedback_data = []
    for f in feedback_queryset:
        try:
            feedback_item = {
                'id': str(f.id),
                'title': f.title,
                'content': f.content,  # Fixed: use 'content' instead of 'description'
                'category': f.category,
                'category_display': f.get_category_display(),
                'priority': f.priority,
                'priority_display': f.get_priority_display(),
                'status': f.status,
                'status_display': f.get_status_display(),
                'tracking_id': f.tracking_id,
                'county': f.county.name,
                'county_code': f.county.code,
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
    
    print(f"✅ Successfully processed {len(feedback_data)} feedback items")
    
    return Response({
        'success': True,
        'data': feedback_data,
        'total_count': len(feedback_data),
        'user_level': user.official_level,
        'accessible_counties': [{'id': c.id, 'name': c.name, 'code': c.code} for c in accessible_counties]
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_feedback(request, feedback_id):
    """Respond to feedback"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        feedback = Feedback.objects.get(id=feedback_id, is_deleted=False)
        
        if feedback.county not in user.get_accessible_counties():
            return Response({'error': 'Access denied'}, status=403)
        
        response_text = request.data.get('response_text')
        if not response_text:
            return Response({'error': 'Response text required'}, status=400)
        
        print(f"💬 {user.name} responding to feedback {feedback.tracking_id}")
        
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
        
        print(f"✅ Response created successfully for feedback {feedback.tracking_id}")
        
        return Response({
            'success': True,
            'message': 'Response sent successfully',
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
    """Get or create projects"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    accessible_counties = user.get_accessible_counties()
    
    if request.method == 'GET':
        projects = Project.objects.filter(county__in=accessible_counties).select_related('county', 'created_by')
        
        projects_data = [{
            'id': str(p.id),
            'title': p.title,
            'description': p.description,
            'project_type': p.project_type,
            'status': p.status,
            'budget': str(p.budget) if p.budget else None,
            'start_date': p.start_date,
            'end_date': p.end_date,
            'image': p.image.url if p.image else None,
            'document': p.document.url if p.document else None,
            'county': p.county.name,
            'created_by': p.created_by.name,
            'created_at': p.created_at
        } for p in projects]
        
        return Response({
            'success': True,
            'data': projects_data
        })
    
    elif request.method == 'POST':
        data = request.data
        
        try:
            # For local officials, use their tenant county automatically
            if user.official_level == 'local':
                county = user.tenant
            else:
                # For regional/national officials, allow county selection
                county = County.objects.get(id=data.get('county_id'))
                if county not in accessible_counties:
                    return Response({'error': 'Access denied'}, status=403)
            
            project = Project.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                county=county,
                project_type=data.get('project_type'),
                budget=data.get('budget'),
                start_date=data.get('start_date'),
                end_date=data.get('end_date'),
                image=request.FILES.get('image'),
                document=request.FILES.get('document'),
                created_by=user
            )
            
            return Response({
                'success': True,
                'message': 'Project created successfully',
                'project_id': str(project.id)
            })
            
        except County.DoesNotExist:
            return Response({'error': 'County not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_project_status(request, project_id):
    """Update project status"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id)
        
        if project.county not in user.get_accessible_counties():
            return Response({'error': 'Access denied'}, status=403)
        
        new_status = request.data.get('status')
        if new_status not in dict(Project._meta.get_field('status').choices):
            return Response({'error': 'Invalid status'}, status=400)
        
        project.status = new_status
        project.save()
        
        return Response({
            'success': True,
            'message': 'Project status updated successfully'
        })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_project_detail(request, project_id):
    """Edit or delete project"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id)
        
        if project.county not in user.get_accessible_counties():
            return Response({'error': 'Access denied'}, status=403)
        
        if request.method == 'PUT':
            # Update project
            data = request.data
            
            project.title = data.get('title', project.title)
            project.description = data.get('description', project.description)
            project.project_type = data.get('project_type', project.project_type)
            project.budget = data.get('budget', project.budget)
            project.start_date = data.get('start_date', project.start_date)
            project.end_date = data.get('end_date', project.end_date)
            
            if 'image' in request.FILES:
                project.image = request.FILES['image']
            
            if 'document' in request.FILES:
                project.document = request.FILES['document']
            
            project.save()
            
            return Response({
                'success': True,
                'message': 'Project updated successfully'
            })
        
        elif request.method == 'DELETE':
            # Soft delete project
            project.is_deleted = True
            project.save()
            
            return Response({
                'success': True,
                'message': 'Project deleted successfully'
            })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@api_view(['GET'])
@permission_classes([])
def public_projects_list(request):
    """Get public projects list - no authentication required"""
    
    # Get all active projects (not deleted)
    projects = Project.objects.filter(is_deleted=False).select_related('county', 'created_by')
    
    projects_data = [{
        'id': str(p.id),
        'title': p.title,
        'description': p.description,
        'project_type': p.project_type,
        'status': p.status,
        'budget': str(p.budget) if p.budget else None,
        'start_date': p.start_date,
        'end_date': p.end_date,
        'image': p.image.url if p.image else None,
        'document': p.document.url if p.document else None,
        'county': p.county.name,
        'created_by': p.created_by.name,
        'created_at': p.created_at
    } for p in projects]
    
    return Response({
        'success': True,
        'data': projects_data
    })