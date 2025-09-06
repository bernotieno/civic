# =============================================================================
# FILE: apps/api/management/commands/test_api_endpoints.py
# =============================================================================
from django.core.management.base import BaseCommand
from django.test.client import Client
from django.urls import reverse
import json
from apps.users.models import County, CustomUser

class Command(BaseCommand):
    help = '🚀 Test all API endpoints for frontend team'
    
    def handle(self, *args, **options):
        self.stdout.write('🚀 TESTING CIVICAI API ENDPOINTS')
        self.stdout.write('=' * 50)
        
        self.client = Client()
        self.test_results = []
        
        # Test endpoints
        self.test_health_endpoint()
        self.test_counties_endpoint() 
        self.test_anonymous_session()
        self.test_location_hierarchy()
        self.test_user_registration()
        self.test_user_login()
        
        # Summary
        passed = len([r for r in self.test_results if r['passed']])
        total = len(self.test_results)
        
        self.stdout.write(f'\n📊 RESULTS: {passed}/{total} endpoints working')
        
        if passed == total:
            self.stdout.write(self.style.SUCCESS('🎉 ALL API ENDPOINTS READY FOR FRONTEND!'))
        else:
            self.stdout.write(self.style.WARNING('⚠️  Some endpoints need attention'))
    
    def log_test(self, name, passed, details=''):
        status = '✅' if passed else '❌'
        self.stdout.write(f'{status} {name}')
        if details and not passed:
            self.stdout.write(f'   {details}')
        self.test_results.append({'name': name, 'passed': passed})
    
    def test_health_endpoint(self):
        """Test GET /api/health/"""
        try:
            response = self.client.get('/api/health/')
            data = json.loads(response.content)
            
            passed = (
                response.status_code == 200 and
                data.get('success') == True and
                'features' in data
            )
            
            self.log_test('GET /api/health/', passed)
        except Exception as e:
            self.log_test('GET /api/health/', False, str(e))
    
    def test_counties_endpoint(self):
        """Test GET /api/locations/counties/"""
        try:
            response = self.client.get('/api/locations/counties/')
            
            if response.status_code == 200:
                data = json.loads(response.content)
                passed = 'results' in data and len(data['results']) > 0
            else:
                passed = False
            
            self.log_test('GET /api/locations/counties/', passed)
        except Exception as e:
            self.log_test('GET /api/locations/counties/', False, str(e))
    
    def test_anonymous_session(self):
        """Test POST /api/auth/anonymous/"""
        try:
            county = County.objects.first()
            if not county:
                self.log_test('POST /api/auth/anonymous/', False, 'No counties found')
                return
            
            response = self.client.post(
                '/api/auth/anonymous/',
                data=json.dumps({'county_id': county.id}),
                content_type='application/json'
            )
            
            if response.status_code == 201:
                data = json.loads(response.content)
                passed = (
                    data.get('success') == True and
                    'session_id' in data
                )
            else:
                passed = False
            
            self.log_test('POST /api/auth/anonymous/', passed)
        except Exception as e:
            self.log_test('POST /api/auth/anonymous/', False, str(e))
    
    def test_location_hierarchy(self):
        """Test GET /api/locations/hierarchy/"""
        try:
            county = County.objects.first()
            if not county:
                self.log_test('GET /api/locations/hierarchy/', False, 'No counties found')
                return
            
            response = self.client.get(f'/api/locations/hierarchy/?county_id={county.id}&type=sub_county')
            
            passed = response.status_code == 200
            
            self.log_test('GET /api/locations/hierarchy/', passed)
        except Exception as e:
            self.log_test('GET /api/locations/hierarchy/', False, str(e))
    
    def test_user_registration(self):
        """Test POST /api/auth/register/"""
        try:
            county = County.objects.first()
            if not county:
                self.log_test('POST /api/auth/register/', False, 'No counties found')
                return
            
            # Clean up any existing test user
            test_national_id = '11223344'
            try:
                existing_user = CustomUser.objects.get(email='apitest@example.com')
                existing_user.delete()
            except CustomUser.DoesNotExist:
                pass
            
            registration_data = {
                'national_id': test_national_id,
                'name': 'API Test User',
                'email': 'apitest@example.com',
                'password': 'testpass123',
                'county_id': county.id
            }
            
            response = self.client.post(
                '/api/auth/register/',
                data=json.dumps(registration_data),
                content_type='application/json'
            )
            
            if response.status_code == 201:
                data = json.loads(response.content)
                passed = (
                    data.get('success') == True and
                    'tokens' in data and
                    'user' in data
                )
            else:
                passed = False
                # Try to get error details
                try:
                    error_data = json.loads(response.content)
                    self.stdout.write(f'   Registration error: {error_data}')
                except:
                    pass
            
            self.log_test('POST /api/auth/register/', passed)
        except Exception as e:
            self.log_test('POST /api/auth/register/', False, str(e))
    
    def test_user_login(self):
        """Test POST /api/auth/login/"""
        try:
            # Try to login with existing test user or superuser
            test_users = [
                {'national_id': '11223344', 'password': 'testpass123'},  # From registration test
                {'national_id': '25604799', 'password': '2222'},        # Potential superuser
            ]
            
            login_successful = False
            
            for credentials in test_users:
                response = self.client.post(
                    '/api/auth/login/',
                    data=json.dumps(credentials),
                    content_type='application/json'
                )
                
                if response.status_code == 200:
                    data = json.loads(response.content)
                    if data.get('success') and 'tokens' in data:
                        login_successful = True
                        break
            
            self.log_test('POST /api/auth/login/', login_successful)
        except Exception as e:
            self.log_test('POST /api/auth/login/', False, str(e))

