# apps/users/management/commands/admin_info.py

from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from apps.users.models import CustomUser
import requests

class Command(BaseCommand):
    help = 'Show complete admin dashboard information and test access'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🇰🇪 CivicAI Admin Dashboard Access'))
        self.stdout.write('=' * 50)
        self.stdout.write('')
        
        # Admin credentials
        national_id = '99999999'
        password = 'admin123'
        
        self.stdout.write(self.style.SUCCESS('📋 ADMIN LOGIN CREDENTIALS'))
        self.stdout.write(f'🌐 URL: http://localhost:8000/admin/')
        self.stdout.write(f'👤 Username: {national_id}')
        self.stdout.write(f'🔑 Password: {password}')
        self.stdout.write('')
        
        # Test authentication
        self.stdout.write('🔍 TESTING AUTHENTICATION...')
        user = authenticate(username=national_id, password=password)
        
        if user:
            self.stdout.write(self.style.SUCCESS(f'✅ Authentication: SUCCESS'))
            self.stdout.write(f'   Name: {user.name}')
            self.stdout.write(f'   Email: {user.email}')
            self.stdout.write(f'   Superuser: {user.is_superuser}')
            self.stdout.write(f'   Staff: {user.is_staff}')
            self.stdout.write(f'   Active: {user.is_active}')
            self.stdout.write(f'   County: {user.tenant.name}')
        else:
            self.stdout.write(self.style.ERROR('❌ Authentication: FAILED'))
            return
        
        self.stdout.write('')
        
        # Test server access
        self.stdout.write('🌐 TESTING SERVER ACCESS...')
        try:
            response = requests.get('http://localhost:8000/admin/', timeout=5)
            if response.status_code == 302:  # Redirect to login
                self.stdout.write(self.style.SUCCESS('✅ Admin interface: ACCESSIBLE'))
            else:
                self.stdout.write(self.style.WARNING(f'⚠️  Admin interface: Status {response.status_code}'))
        except requests.exceptions.ConnectionError:
            self.stdout.write(self.style.ERROR('❌ Server: NOT RUNNING'))
            self.stdout.write('   Run: python manage.py runserver')
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Server error: {e}'))
            return
        
        self.stdout.write('')
        
        # Show available admin models
        self.stdout.write('📊 AVAILABLE ADMIN MODELS')
        from django.contrib import admin
        
        admin_models = []
        for model, admin_class in admin.site._registry.items():
            app_label = model._meta.app_label
            model_name = model._meta.verbose_name_plural
            admin_models.append(f'   • {app_label}.{model_name}')
        
        for model in sorted(admin_models):
            self.stdout.write(model)
        
        self.stdout.write('')
        
        # Instructions
        self.stdout.write(self.style.SUCCESS('🚀 HOW TO ACCESS ADMIN DASHBOARD'))
        self.stdout.write('1. Open your browser')
        self.stdout.write('2. Go to: http://localhost:8000/admin/')
        self.stdout.write(f'3. Enter Username: {national_id}')
        self.stdout.write(f'4. Enter Password: {password}')
        self.stdout.write('5. Click "Log in"')
        self.stdout.write('')
        
        # Troubleshooting
        self.stdout.write('🔧 TROUBLESHOOTING')
        self.stdout.write('If you cannot access the admin:')
        self.stdout.write('• Ensure Django server is running: python manage.py runserver')
        self.stdout.write('• Check no firewall is blocking port 8000')
        self.stdout.write('• Try http://127.0.0.1:8000/admin/ instead')
        self.stdout.write('• Clear browser cache and cookies')
        self.stdout.write('')
        
        # Additional admin users
        self.stdout.write('👥 OTHER ADMIN USERS')
        other_admins = CustomUser.objects.filter(is_superuser=True).exclude(email='admin@civicai.ke')
        if other_admins.exists():
            for admin in other_admins:
                self.stdout.write(f'   • {admin.name or "No name"} ({admin.email or "No email"})')
                self.stdout.write('     Note: You need their original National ID to login')
        else:
            self.stdout.write('   • No other admin users found')
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('🎉 Admin dashboard setup complete!'))
        self.stdout.write('You can now manage users, counties, feedback, and all CivicAI data.')