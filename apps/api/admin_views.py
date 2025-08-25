# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
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
    
    stats = {
        'total_users': CustomUser.objects.filter(tenant__in=accessible_counties).count(),
        'total_counties': accessible_counties.count(),
        'total_feedback': Feedback.objects.filter(county__in=accessible_counties).count(),
        'pending_feedback': Feedback.objects.filter(
            county__in=accessible_counties, 
            status='pending'
        ).count(),
        'total_projects': Project.objects.filter(county__in=accessible_counties).count(),
        'active_projects': Project.objects.filter(
            county__in=accessible_counties,
            status__in=['approved', 'in_progress']
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
    feedback = Feedback.objects.filter(county__in=accessible_counties).select_related('county', 'user')
    
    feedback_data = [{
        'id': str(f.id),
        'title': f.title,
        'description': f.description,
        'category': f.category,
        'status': f.status,
        'county': f.county.name,
        'created_at': f.created_at,
        'urgency_score': getattr(f, 'urgency_score', None),
        'has_response': hasattr(f, 'admin_response'),
        'user_name': f.user.name if f.user else 'Anonymous'
    } for f in feedback]
    
    return Response({
        'success': True,
        'data': feedback_data
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_feedback(request, feedback_id):
    """Respond to feedback"""
    user = request.user
    
    if user.role != 'government_official':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        feedback = Feedback.objects.get(id=feedback_id)
        
        if feedback.county not in user.get_accessible_counties():
            return Response({'error': 'Access denied'}, status=403)
        
        response_text = request.data.get('response_text')
        if not response_text:
            return Response({'error': 'Response text required'}, status=400)
        
        # Create or update response
        response_obj, created = AdminFeedbackResponse.objects.get_or_create(
            feedback=feedback,
            defaults={
                'response_text': response_text,
                'responded_by': user
            }
        )
        
        if not created:
            response_obj.response_text = response_text
            response_obj.responded_by = user
            response_obj.save()
        
        # Update feedback status
        feedback.status = 'responded'
        feedback.save()
        
        return Response({
            'success': True,
            'message': 'Response sent successfully'
        })
        
    except Feedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=404)

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