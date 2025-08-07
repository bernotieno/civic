# =============================================================================
# FILE: apps/feedback/permissions.py
# =============================================================================
from rest_framework import permissions
from django.utils import timezone
from datetime import timedelta
from apps.core.decorators import _has_required_level


class CanSubmitFeedback(permissions.BasePermission):
    """
    Permission for feedback submission.
    Enhanced while keeping your core logic for citizens and authenticated users.
    """
    
    message = "You do not have permission to submit feedback"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required to submit feedback"
            return False
        
        # Anonymous users handled separately (keeping your logic)
        if request.user.role == 'anonymous':
            self.message = "Anonymous users must use the anonymous feedback endpoint"
            return False
        
        # Check if user account is active
        if not request.user.is_active:
            self.message = "Your account has been deactivated"
            return False
        
        # Citizens can submit feedback (keeping your logic)
        if request.user.role == 'citizen':
            # Enhanced: Check rate limits
            from .utils import FeedbackRateLimit
            can_submit, message = FeedbackRateLimit.check_citizen_limit(request.user)
            if not can_submit:
                self.message = message
                return False
            return True
        
        # Government officials can also submit feedback (keeping your logic)
        if request.user.role == 'government_official':
            # Enhanced: Check rate limits for officials too
            from .utils import FeedbackRateLimit
            can_submit, message = FeedbackRateLimit.check_citizen_limit(request.user)
            if not can_submit:
                self.message = message
                return False
            return True
        
        self.message = "Only citizens and government officials can submit feedback"
        return False


class CanViewFeedback(permissions.BasePermission):
    """
    Permission for viewing feedback.
    Based on invisible boundaries principle (keeping your implementation).
    Enhanced with additional checks.
    """
    
    message = "You do not have permission to view feedback"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required to view feedback"
            return False
        
        # Enhanced: Anonymous users should use tracking endpoint
        if request.user.role == 'anonymous':
            self.message = "Use the tracking endpoint to check feedback status"
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user can view specific feedback object (keeping your logic)"""
        can_view = obj.can_be_viewed_by(request.user)
        if not can_view:
            self.message = "You do not have access to view this feedback"
        return can_view


class CanRespondToFeedback(permissions.BasePermission):
    """
    Permission for responding to feedback.
    New permission class that aligns with your invisible boundaries approach.
    """
    
    message = "You do not have permission to respond to feedback"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required"
            return False
        
        # Only government officials can respond (aligns with your role system)
        if request.user.role != 'government_official':
            self.message = "Only government officials can respond to feedback"
            return False
        
        # Check if account is active
        if not request.user.is_active:
            self.message = "Your account has been deactivated"
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user can respond to specific feedback (using your boundaries logic)"""
        # Cannot respond to own feedback
        if obj.user == request.user:
            self.message = "Cannot respond to your own feedback"
            return False
        
        # Must have access to the county (using your invisible boundaries)
        accessible_counties = request.user.get_accessible_counties()
        if obj.county not in accessible_counties:
            self.message = "You do not have access to feedback from this county"
            return False
        
        return True


class CanManageFeedback(permissions.BasePermission):
    """
    Permission for advanced feedback management.
    Uses your _has_required_level function and invisible boundaries.
    """
    
    message = "You do not have permission to manage feedback"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required"
            return False
        
        # Must be government official (aligns with your role system)
        if request.user.role != 'government_official':
            self.message = "Only government officials can manage feedback"
            return False
        
        # Use your existing level checking function
        if not _has_required_level(request.user, 'regional'):
            self.message = "Regional or higher access level required for feedback management"
            return False
        
        return True
    
    def has_object_permission(self, request, view, obj):
        """Check if user can manage specific feedback (using your boundaries)"""
        # Must have access to the county (using your invisible boundaries)
        accessible_counties = request.user.get_accessible_counties()
        if obj.county not in accessible_counties:
            self.message = "You do not have access to feedback from this county"
            return False
        
        return True


class IsAnonymousSession(permissions.BasePermission):
    """
    Permission to validate anonymous session.
    New permission that aligns with your anonymous session system.
    """
    
    message = "Invalid or expired anonymous session"
    
    def has_permission(self, request, view):
        # Get session_id from request data
        session_id = None
        
        if hasattr(request, 'data') and isinstance(request.data, dict):
            session_id = request.data.get('session_id')
        
        if not session_id:
            self.message = "session_id is required"
            return False
        
        # Validate session using your existing anonymous system
        from apps.core.anonymous import AnonymousSessionManager
        session_data = AnonymousSessionManager.get_session(session_id)
        
        if not session_data:
            self.message = "Invalid or expired session"
            return False
        
        # Check if session can still submit (using your existing logic)
        can_submit, message = AnonymousSessionManager.can_submit(session_id)
        if not can_submit:
            self.message = message
            return False
        
        return True


class CanAccessAnalytics(permissions.BasePermission):
    """
    Permission for accessing feedback analytics.
    Uses your existing role and level system.
    """
    
    message = "You do not have permission to access analytics"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required"
            return False
        
        # Must be government official (aligns with your role system)
        if request.user.role != 'government_official':
            self.message = "Only government officials can access analytics"
            return False
        
        # Use your existing level checking - allow local+ officials to see analytics
        if not _has_required_level(request.user, 'local'):
            self.message = "Government official access required"
            return False
        
        return True


class CanExportData(permissions.BasePermission):
    """
    Permission for exporting feedback data.
    Uses your level system with higher requirements for data export.
    """
    
    message = "You do not have permission to export data"
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            self.message = "Authentication required"
            return False
        
        # Must be government official
        if request.user.role != 'government_official':
            self.message = "Only government officials can export data"
            return False
        
        # Use your existing level checking - require regional+ for exports
        if not _has_required_level(request.user, 'regional'):
            self.message = "Regional or higher access level required for data export"
            return False
        
        # Enhanced: Check export rate limits
        from django.core.cache import cache
        cache_key = f"export_limit_{request.user.id}_{timezone.now().strftime('%Y%m%d%H')}"
        current_exports = cache.get(cache_key, 0)
        
        if current_exports >= 5:
            self.message = "Export limit exceeded. Maximum 5 exports per hour"
            return False
        
        # Increment export counter
        cache.set(cache_key, current_exports + 1, timeout=3600)
        
        return True


# =============================================================================
# COMPATIBILITY ALIASES (For your existing code)
# =============================================================================

# Keep your existing permission class names for backward compatibility
class CanSubmitFeedbackAlias(CanSubmitFeedback):
    """Alias for your existing permission class"""
    pass

class CanViewFeedbackAlias(CanViewFeedback):
    """Alias for your existing permission class"""
    pass