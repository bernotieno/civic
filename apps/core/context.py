# =============================================================================
# STEP 2.1: USER CONTEXT SYSTEM
# FILE: apps/core/context.py
# =============================================================================
class UserContext:
    """
    CRITICAL: This class determines EVERYTHING a user can see and do.
    Each user gets a completely different application experience based on their context.
    
    DO NOT modify app_config structures without testing all role types.
    """
    
    def __init__(self, user):
        self.user = user
        self.role = user.role
        self.level = getattr(user, 'admin_level', None)
        self.app_config = self._get_app_config()
    
    def _get_app_config(self):
        """
        Returns completely different app configuration per role.
        Users only see features/endpoints listed here.
        """
        configs = {
            'citizen': {
                'available_endpoints': [
                    '/api/feedback/',
                    '/api/my-submissions/',
                    '/api/locations/',  # For dropdown filtering
                ],
                'dashboard_widgets': ['submit_feedback', 'my_submissions'],
                'navigation_items': ['Home', 'Submit Feedback', 'My Feedback'],
                'data_scope': 'own_submissions_only',
                'max_submissions_per_day': 10,
            },
            'anonymous': {
                'available_endpoints': [
                    '/api/anonymous-feedback/',
                    '/api/track-submission/',
                    '/api/locations/',  # For county selection
                ],
                'dashboard_widgets': ['anonymous_submit'],
                'navigation_items': ['Submit Feedback', 'Track Feedback'],
                'data_scope': 'none',  # Cannot see any existing data
                'max_submissions_per_session': 3,
            },
            'parliament_admin': {
                'available_endpoints': [
                    '/api/admin/',
                    '/api/national-analytics/',
                    '/api/bills/',
                    '/api/projects/',
                    '/api/feedback/',
                ],
                'dashboard_widgets': ['national_overview', 'bills_management', 'projects_management', 'feedback_management'],
                'navigation_items': ['Dashboard', 'Bills & Projects', 'Feedback Management', 'Analytics'],
                'data_scope': 'full_system',
            },
            'super_admin': {
                'available_endpoints': [
                    '/api/admin/',
                    '/api/system-config/',
                    '/api/audit-logs/',
                    '/api/data-export/',
                    '/api/user-management/',
                ],
                'dashboard_widgets': ['system_admin', 'audit_trail', 'data_management', 'user_management'],
                'navigation_items': ['System Administration', 'User Management', 'Audit Logs', 'Data Management'],
                'data_scope': 'full_system_admin',
            }
        }
        
        # Use role directly for new simplified structure
        config_key = self.role
        
        return configs.get(config_key, configs['citizen'])  # Default to citizen config
    
    def can_access_endpoint(self, endpoint):
        """Check if user can access specific API endpoint"""
        return endpoint in self.app_config.get('available_endpoints', [])
    
    def get_data_scope_filter(self):
        """
        Returns Django Q object for filtering data based on user's scope.
        CRITICAL: This is used by middleware to automatically filter all queries.
        """
        from django.db.models import Q
        
        scope = self.app_config.get('data_scope')
        
        if scope == 'own_submissions_only':
            return Q(user=self.user)
        elif scope in ['full_system', 'full_system_admin']:
            return Q()  # No filter - see everything
        else:  # 'none' or unknown
            return Q(pk__isnull=True)  # See nothing

