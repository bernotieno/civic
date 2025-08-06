
# =============================================================================
# EXAMPLE USAGE: Test view with Invisible Boundaries
# FILE: apps/core/views.py (for testing purposes)
# =============================================================================
from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from .decorators import invisible_permission_required, endpoint_allowed

@login_required
@endpoint_allowed
def citizen_dashboard(request):
    """Example view that uses invisible boundaries"""
    user_context = getattr(request, 'user_context', None)
    
    if not user_context:
        return JsonResponse({'error': 'No user context'}, status=400)
    
    return JsonResponse({
        'role': user_context.role,
        'available_endpoints': user_context.app_config['available_endpoints'],
        'dashboard_widgets': user_context.app_config['dashboard_widgets'],
        'navigation_items': user_context.app_config['navigation_items'],
    })

@login_required
@invisible_permission_required('local')
def county_management(request):
    """Example view requiring local official level or higher"""
    user_context = request.user_context
    
    return JsonResponse({
        'message': 'County management access granted',
        'data_scope': user_context.app_config['data_scope'],
        'accessible_counties': [c.name for c in user_context.accessible_counties],
    })

@login_required
@invisible_permission_required('national')
def national_analytics(request):
    """Example view requiring national level access"""
    return JsonResponse({
        'message': 'National analytics access granted',
        'level': 'national'
    })

