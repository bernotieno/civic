# =============================================================================
# FILE: apps/users/management/commands/fix_superuser.py
# =============================================================================
from django.core.management.base import BaseCommand, CommandError
from apps.users.models import CustomUser, County, hash_national_id, verify_national_id
import getpass


class Command(BaseCommand):
    help = 'Fix superuser authentication by checking/recreating superuser'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--national-id',
            dest='national_id',
            help='National ID to check/fix',
        )
        parser.add_argument(
            '--delete-and-recreate',
            action='store_true',
            help='Delete existing user and recreate',
        )
    
    def handle(self, *args, **options):
        national_id = options.get('national_id')
        if not national_id:
            national_id = input('Enter National ID to check: ')
        
        self.stdout.write(f'Checking National ID: {national_id}')
        
        # Test hashing
        test_hash = hash_national_id(national_id)
        self.stdout.write(f'Generated hash: {test_hash[:50]}...')
        
        # Test verification
        test_verify = verify_national_id(national_id, test_hash)
        self.stdout.write(f'Hash verification: {test_verify}')
        
        # Check existing users
        all_users = CustomUser.all_objects.all()
        self.stdout.write(f'\nAll users in database: {all_users.count()}')
        
        matching_user = None
        for user in all_users:
            self.stdout.write(f'User: {user.name}, Hash: {user.national_id_hash[:20]}...')
            if verify_national_id(national_id, user.national_id_hash):
                matching_user = user
                self.stdout.write(f'✓ Found matching user: {user.name}')
                break
        
        if not matching_user:
            self.stdout.write(self.style.ERROR('✗ No matching user found'))
            
            # Offer to create new superuser
            create = input('Create new superuser? (y/n): ')
            if create.lower() == 'y':
                self.create_superuser(national_id)
        else:
            # Test login
            self.stdout.write(f'\nTesting authentication for user: {matching_user.name}')
            password = getpass.getpass('Enter password to test: ')
            
            if matching_user.check_password(password):
                self.stdout.write(self.style.SUCCESS('✓ Password check passed'))
            else:
                self.stdout.write(self.style.ERROR('✗ Password check failed'))
                
                # Offer to reset password
                reset = input('Reset password? (y/n): ')
                if reset.lower() == 'y':
                    new_password = getpass.getpass('New password: ')
                    matching_user.set_password(new_password)
                    matching_user.save()
                    self.stdout.write(self.style.SUCCESS('Password reset successfully'))
    
    def create_superuser(self, national_id):
        email = input('Email: ')
        name = input('Name: ')
        password = getpass.getpass('Password: ')
        
        # Get default county
        try:
            county = County.objects.get(code='NBI')
        except County.DoesNotExist:
            county = County.objects.first()
            
        if not county:
            self.stdout.write(self.style.ERROR('No counties found. Run setup_counties first.'))
            return
        
        try:
            user = CustomUser.objects.create_superuser_with_national_id(
                national_id=national_id,
                email=email,
                password=password,
                name=name,
                tenant=county,
                county=county.location,
                home_county=county
            )
            self.stdout.write(self.style.SUCCESS(f'Superuser created: {user.name}'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error creating superuser: {e}'))
