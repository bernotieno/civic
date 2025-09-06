# apps/users/management/commands/test_admin_access.py

from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth import authenticate
from apps.users.models import CustomUser

class Command(BaseCommand):
    help = 'Test admin interface access'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== TESTING ADMIN ACCESS ==='))
        self.stdout.write('')
        
        # Test authentication with known credentials
        national_id = '99999999'  # Updated credentials
        password = 'admin123'
        
        self.stdout.write('Testing authentication...')
        user = authenticate(username=national_id, password=password)
        
        if user:
            self.stdout.write(self.style.SUCCESS(f'✓ Authentication successful for {user.name}'))
            self.stdout.write(f'  - Is superuser: {user.is_superuser}')
            self.stdout.write(f'  - Is staff: {user.is_staff}')
            self.stdout.write(f'  - Is active: {user.is_active}')
        else:
            self.stdout.write(self.style.ERROR('✗ Authentication failed'))
            return
        
        # Test admin access
        self.stdout.write('')
        self.stdout.write('Testing admin interface access...')
        
        client = Client()
        
        # Test admin login page
        response = client.get('/admin/')
        self.stdout.write(f'Admin page status: {response.status_code}')
        
        # Test login
        response = client.post('/admin/login/', {
            'username': national_id,
            'password': password,
            'next': '/admin/'
        })
        
        if response.status_code == 302:  # Redirect after successful login
            self.stdout.write(self.style.SUCCESS('✓ Admin login successful'))
            
            # Test admin dashboard access
            response = client.get('/admin/')
            if response.status_code == 200:
                self.stdout.write(self.style.SUCCESS('✓ Admin dashboard accessible'))
            else:
                self.stdout.write(self.style.ERROR(f'✗ Admin dashboard error: {response.status_code}'))
        else:
            self.stdout.write(self.style.ERROR(f'✗ Admin login failed: {response.status_code}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== ADMIN LOGIN CREDENTIALS ==='))
        self.stdout.write(f'URL: http://localhost:8000/admin/')
        self.stdout.write(f'Username: {national_id}')
        self.stdout.write(f'Password: {password}')
        self.stdout.write('')
        self.stdout.write('If you still cannot access admin, check:')
        self.stdout.write('1. Django server is running: python manage.py runserver')
        self.stdout.write('2. No firewall blocking port 8000')
        self.stdout.write('3. Browser can access localhost:8000')