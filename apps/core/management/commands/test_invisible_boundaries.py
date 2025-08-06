
# =============================================================================
# FILE: apps/core/management/commands/test_invisible_boundaries.py
# =============================================================================
from django.core.management.base import BaseCommand
from apps.users.models import CustomUser, County
from apps.core.context import UserContext

class Command(BaseCommand):
    help = 'Test the Invisible Boundaries system with different user roles'
    
    def handle(self, *args, **options):
        self.stdout.write('=== Testing Invisible Boundaries System ===\n')
        
        # Test with different user types
        users_to_test = [
            ('citizen', None),
            ('anonymous', None),
            ('government_official', 'local'),
            ('government_official', 'regional'),
            ('government_official', 'national'),
            ('government_official', 'super_admin'),
        ]
        
        for role, level in users_to_test:
            self.test_user_context(role, level)
    
    def test_user_context(self, role, level):
        self.stdout.write(f'--- Testing {role}' + (f' ({level})' if level else '') + ' ---')
        
        # Create test user
        try:
            county = County.objects.first()
            if not county:
                self.stdout.write(self.style.ERROR('No counties found. Run setup_counties first.'))
                return
            
            # Create mock user for testing
            class MockUser:
                def __init__(self, role, level, county):
                    self.role = role
                    self.official_level = level
                    self.home_county = county
                    self.tenant = county
                    
                def get_accessible_counties(self):
                    if self.role != 'government_official':
                        return County.objects.filter(id=self.tenant.id)
                    elif self.official_level == 'local':
                        return County.objects.filter(id=self.home_county.id)
                    elif self.official_level == 'regional':
                        return County.objects.filter(id__in=[self.home_county.id])
                    elif self.official_level in ['national', 'super_admin']:
                        return County.objects.all()
                    else:
                        return County.objects.filter(id=self.home_county.id)
            
            mock_user = MockUser(role, level, county)
            
            # Test UserContext
            context = UserContext(mock_user)
            
            # Display results
            self.stdout.write(f'  Available endpoints: {len(context.app_config["available_endpoints"])}')
            for endpoint in context.app_config["available_endpoints"]:
                self.stdout.write(f'    - {endpoint}')
            
            self.stdout.write(f'  Dashboard widgets: {context.app_config["dashboard_widgets"]}')
            self.stdout.write(f'  Navigation items: {context.app_config["navigation_items"]}')
            self.stdout.write(f'  Data scope: {context.app_config["data_scope"]}')
            
            # Test endpoint access
            test_endpoints = [
                '/api/feedback/',
                '/api/county-stats/',
                '/api/national-analytics/',
                '/api/admin/',
            ]
            
            self.stdout.write('  Endpoint access tests:')
            for endpoint in test_endpoints:
                access = context.can_access_endpoint(endpoint)
                status = '✓' if access else '✗'
                self.stdout.write(f'    {status} {endpoint}')
            
            self.stdout.write('')
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error testing {role}: {e}'))

