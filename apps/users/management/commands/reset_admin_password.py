# apps/users/management/commands/reset_admin_password.py

from django.core.management.base import BaseCommand, CommandError
from apps.users.models import CustomUser
import getpass

class Command(BaseCommand):
    help = 'Reset password for an existing superuser'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            dest='email',
            help='Email of the superuser to reset password for',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== ADMIN PASSWORD RESET ==='))
        self.stdout.write('')
        
        superusers = CustomUser.objects.filter(is_superuser=True)
        
        if not superusers.exists():
            raise CommandError('No superusers found!')
        
        # Show available superusers
        self.stdout.write('Available superusers:')
        for i, user in enumerate(superusers, 1):
            self.stdout.write(f'{i}. {user.name or "No name"} ({user.email or "No email"})')
        self.stdout.write('')
        
        # Get user selection
        email = options['email']
        if not email:
            while True:
                try:
                    choice = input('Select superuser number (or enter email): ')
                    if choice.isdigit():
                        choice = int(choice)
                        if 1 <= choice <= len(superusers):
                            user = list(superusers)[choice - 1]
                            break
                    else:
                        user = superusers.filter(email=choice).first()
                        if user:
                            break
                    self.stdout.write(self.style.ERROR('Invalid selection'))
                except (ValueError, IndexError):
                    self.stdout.write(self.style.ERROR('Invalid selection'))
        else:
            user = superusers.filter(email=email).first()
            if not user:
                raise CommandError(f'Superuser with email "{email}" not found')
        
        # Get new password
        while True:
            password = getpass.getpass('New password: ')
            if not password:
                self.stdout.write(self.style.ERROR('Password cannot be empty'))
                continue
            
            password2 = getpass.getpass('Confirm password: ')
            if password != password2:
                self.stdout.write(self.style.ERROR('Passwords do not match'))
                continue
            break
        
        # Update password
        user.set_password(password)
        user.save()
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('Password updated successfully!'))
        self.stdout.write(f'User: {user.name or "No name"} ({user.email or "No email"})')
        self.stdout.write('')
        self.stdout.write('You can now login at: http://localhost:8000/admin/')
        self.stdout.write('Username: Use the original National ID (8 digits)')
        self.stdout.write('Password: The new password you just set')