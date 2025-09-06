
# =============================================================================
# STEP 2.3: PERMISSION DECORATORS
# FILE: apps/core/decorators.py
# =============================================================================
from functools import wraps
from django.http import Http404
from django.contrib.auth.decorators import login_required

def invisible_permission_required(required_level):
    """
    CRITICAL: Decorator that enforces permissions by returning 404.
    Users should never know that features exist outside their scope.
    
    DO NOT return 403 errors - they reveal the existence of restricted features.
    """
    def decorator(view_func):
        @wraps(view_func)
        @login_required
        def wrapper(request, *args, **kwargs):
            user_context = getattr(request, 'user_context', None)
            
            if not user_context or not _has_required_level(user_context, required_level):
                # Return 404, not 403 - feature doesn't "exist" for this user
                raise Http404("Page not found")
            
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator

def _has_required_level(user_context, required_level):
    """Check if user has required access level"""
    level_hierarchy = {
        'citizen': 0,
        'anonymous': 0,
        'local': 1,
        'regional': 2,
        'national': 3,
        'super_admin': 4
    }
    
    user_level = level_hierarchy.get(user_context.level or user_context.role, 0)
    required_level_num = level_hierarchy.get(required_level, 0)
    
    return user_level >= required_level_num

def endpoint_allowed(view_func):
    """
    Decorator that checks if user can access specific endpoint.
    Returns 404 if endpoint not in user's allowed list.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user_context = getattr(request, 'user_context', None)
        
        if user_context:
            endpoint = request.path
            if not user_context.can_access_endpoint(endpoint):
                raise Http404("Page not found")
        
        return view_func(request, *args, **kwargs)
    return wrapper
    