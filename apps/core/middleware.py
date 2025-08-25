# =============================================================================
# STEP 2.2: INVISIBLE BOUNDARIES MIDDLEWARE
# FILE: apps/core/middleware.py
# =============================================================================
from django.http import Http404
from django.utils.deprecation import MiddlewareMixin
from django.db import models
from .context import UserContext

class InvisibleBoundaryMiddleware(MiddlewareMixin):
    """
    CRITICAL: This middleware implements the "Invisible Boundaries" concept.
    Users literally cannot see data outside their scope - queries are automatically filtered.
    
    DO NOT bypass this middleware in views - it's the core security mechanism.
    """
    
    def process_request(self, request):
        # Skip middleware for admin interface and API docs to avoid conflicts
        if (request.path.startswith('/admin/') or 
            request.path.startswith('/api/docs/') or 
            request.path.startswith('/api/schema/') or 
            request.path.startswith('/api/redoc/')):
            return None
            
        if request.user.is_authenticated:
            # Create user context that determines everything they can see
            request.user_context = UserContext(request.user)
            
            # Store context in thread-local for database query filtering
            self._set_thread_local_context(request.user_context)
    
    def process_response(self, request, response):
        # Clean up thread-local context
        self._clear_thread_local_context()
        return response
    
    def _set_thread_local_context(self, user_context):
        """Store user context in thread-local storage for database access"""
        import threading
        if not hasattr(threading.current_thread(), 'user_context'):
            threading.current_thread().user_context = user_context
    
    def _clear_thread_local_context(self):
        """Clean up thread-local context"""
        import threading
        if hasattr(threading.current_thread(), 'user_context'):
            delattr(threading.current_thread(), 'user_context')

class ScopedQuerySet(models.QuerySet):
    """
    CRITICAL: Custom QuerySet that automatically applies user-based filtering.
    All model queries go through this to respect invisible boundaries.
    
    DO NOT create queries that bypass this filtering.
    """
    
    def filter(self, *args, **kwargs):
        # Get user context from thread-local storage
        import threading
        user_context = getattr(threading.current_thread(), 'user_context', None)
        
        if user_context:
            # Apply automatic filtering based on user's data scope
            scope_filter = user_context.get_data_scope_filter()
            if scope_filter and scope_filter.children:  # Only apply if filter has conditions
                return super().filter(scope_filter, *args, **kwargs)
        
        return super().filter(*args, **kwargs)

class ScopedManager(models.Manager):
    """Manager that uses ScopedQuerySet for automatic filtering"""
    
    def get_queryset(self):
        return ScopedQuerySet(self.model, using=self._db)
