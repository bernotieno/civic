# apps/users/management/commands/create_civicai_superuser.py

from django.core.management.base import BaseCommand, CommandError
from django.core.exceptions import ValidationError
from apps.users.models import CustomUser, County, hash_national_id
from apps.users.utils import validate_kenyan_national_id
import getpass
import sys


class Command(BaseCommand):
    help = 'Create a CivicAI superuser with national ID authentication'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--national-id',
            dest='national_id',
            help='Kenyan National ID (8 digits)',
        )
        parser.add_argument(
            '--email',
            dest='email',
            help='Email address',
        )
        parser.add_argument(
            '--name',
            dest='name',
            help='Full name',
        )
        parser.add_argument(
            '--county',
            dest='county_code',
            help='County code (e.g., NBI for Nairobi)',
        )
        parser.add_argument(
            '--noinput',
            action='store_true',
            dest='interactive',
            default=True,
            help='Do not prompt for input',
        )
    
    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('CivicAI Superuser Creation'))
        self.stdout.write('=' * 40)
        
        # Check if counties exist
        if County.objects.count() == 0:
            raise CommandError(
                'No counties found. Please run "python manage.py setup_counties" first.'
            )
        
        interactive = options['interactive']
        
        # Get National ID
        national_id = options['national_id']
        if not national_id and interactive:
            while True:
                national_id = input('National ID (8 digits): ')
                if validate_kenyan_national_id(national_id):
                    break
                self.stdout.write(self.style.ERROR('Invalid National ID format. Must be 8 digits.'))
        
        if not national_id or not validate_kenyan_national_id(national_id):
            raise CommandError('Valid National ID is required')
        
        # Check if user already exists
        national_id_hash = hash_national_id(national_id)
        if CustomUser.objects.filter(national_id_hash=national_id_hash).exists():
            raise CommandError('User with this National ID already exists')
        
        # Get Email
        email = options['email']
        if not email and interactive:
            email = input('Email address: ')
        
        if email and CustomUser.objects.filter(email=email).exists():
            raise CommandError('User with this email already exists')
        
        # Get Name
        name = options['name']
        if not name and interactive:
            name = input('Full name: ')
        
        # Get County
        county_code = options['county_code']
        if not county_code and interactive:
            self.stdout.write('\nAvailable counties:')
            counties = County.objects.all().order_by('code')[:10]  # Show first 10
            for county in counties:
                self.stdout.write(f'  {county.code} - {county.name}')
            if County.objects.count() > 10:
                self.stdout.write(f'  ... and {County.objects.count() - 10} more')
            
            while True:
                county_code = input('County code (e.g., NBI): ').upper()
                if County.objects.filter(code=county_code).exists():
                    break
                self.stdout.write(self.style.ERROR(f'County "{county_code}" not found'))
        
        if not county_code:
            county_code = 'NBI'  # Default to Nairobi
        
        try:
            county = County.objects.get(code=county_code)
        except County.DoesNotExist:
            raise CommandError(f'County with code "{county_code}" not found')
        
        # Get Password
        if interactive:
            password = None
            while not password:
                password = getpass.getpass('Password: ')
                if not password:
                    self.stdout.write(self.style.ERROR('Password cannot be empty'))
                    continue
                
                password2 = getpass.getpass('Password (again): ')
                if password != password2:
                    self.stdout.write(self.style.ERROR('Passwords do not match'))
                    password = None
        else:
            password = getpass.getpass('Password: ')
        
        # Create superuser
        try:
            user = CustomUser.objects.create_superuser(
                national_id_hash=national_id_hash,
                email=email or None,
                password=password,
                name=name or None,
                tenant=county,
                county=county.location,
                home_county=county
            )
            
            self.stdout.write('')
            self.stdout.write(self.style.SUCCESS('Superuser created successfully!'))
            self.stdout.write(f'Name: {user.name or "Not provided"}')
            self.stdout.write(f'Email: {user.email or "Not provided"}')
            self.stdout.write(f'Role: {user.get_role_display()}')
            self.stdout.write(f'Level: {user.get_official_level_display()}')
            self.stdout.write(f'County: {user.tenant.name}')
            self.stdout.write('')
            self.stdout.write('You can now log in to the admin interface at /admin/')
            
        except ValidationError as e:
            raise CommandError(f'Validation error: {e}')
        except Exception as e:
            raise CommandError(f'Error creating superuser: {e}')
            