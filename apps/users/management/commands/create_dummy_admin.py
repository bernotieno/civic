from django.core.management.base import BaseCommand
from apps.users.models import CustomUser, County, hash_national_id
from django.contrib.auth.hashers import make_password

class Command(BaseCommand):
    help = 'Create dummy admin user for testing'

    def handle(self, *args, **options):
        # Get Kisumu County (or create if doesn't exist)
        county, created = County.objects.get_or_create(
            code='KSM',
            defaults={
                'name': 'Kisumu',
                'location': 'Kisumu County'
            }
        )

        # Dummy admin credentials
        national_id = '12345678'
        national_id_hash = hash_national_id(national_id)
        
        # Check if user already exists
        if CustomUser.objects.filter(national_id_hash=national_id_hash).exists():
            self.stdout.write(self.style.WARNING('Dummy admin user already exists'))
            user = CustomUser.objects.get(national_id_hash=national_id_hash)
        else:
            # Create dummy admin user
            user = CustomUser.objects.create(
                national_id_hash=national_id_hash,
                email='admin@kisumu.go.ke',
                password=make_password('admin123'),
                first_name='John',
                last_name='Admin',
                role='local_official',
                official_level='county',
                tenant=county,
                county=county.location,
                home_county=county,
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS('Dummy admin user created successfully!'))

        # Display login credentials
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=== ADMIN LOGIN CREDENTIALS ==='))
        self.stdout.write(f'National ID: {national_id}')
        self.stdout.write(f'Password: admin123')
        self.stdout.write(f'Email: {user.email}')
        self.stdout.write(f'Name: {user.first_name} {user.last_name}')
        self.stdout.write(f'Role: {user.get_role_display()}')
        self.stdout.write(f'County: {user.tenant.name}')
        self.stdout.write('')
        self.stdout.write('Use these credentials to login and access the admin dashboard.')