# apps/api/public_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from apps.projects.models import Project

@api_view(['GET'])
@permission_classes([AllowAny])
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