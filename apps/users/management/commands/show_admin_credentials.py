# apps/users/management/commands/show_admin_credentials.py

from django.core.management.base import BaseCommand
from apps.users.models import CustomUser

class Command(BaseCommand):
    help = 'Show admin login credentials for existing superusers'
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== ADMIN LOGIN CREDENTIALS ==='))
        self.stdout.write('')
        
        superusers = CustomUser.objects.filter(is_superuser=True)
        
        if not superusers.exists():
            self.stdout.write(self.style.ERROR('No superusers found!'))
            return
        
        for i, user in enumerate(superusers, 1):
            self.stdout.write(f'SUPERUSER #{i}:')
            self.stdout.write(f'  Name: {user.name or "Not set"}')
            self.stdout.write(f'  Email: {user.email or "Not set"}')
            self.stdout.write(f'  Role: {user.get_role_display()}')
            self.stdout.write(f'  County: {user.tenant.name}')
            self.stdout.write(f'  Active: {user.is_active}')
            self.stdout.write(f'  Staff: {user.is_staff}')
            self.stdout.write('')
            self.stdout.write(self.style.WARNING('  LOGIN INSTRUCTIONS:'))
            self.stdout.write('  1. Go to: http://localhost:8000/admin/')
            self.stdout.write('  2. Username: Use the original National ID (8 digits)')
            self.stdout.write('  3. Password: Use the password set during creation')
            self.stdout.write('')
            self.stdout.write(self.style.ERROR('  NOTE: If you forgot the password, use the reset command below'))
            self.stdout.write('')
        
        self.stdout.write(self.style.SUCCESS('=== PASSWORD RESET INSTRUCTIONS ==='))
        self.stdout.write('If you forgot the password, run:')
        self.stdout.write('python manage.py reset_admin_password')
        self.stdout.write('')