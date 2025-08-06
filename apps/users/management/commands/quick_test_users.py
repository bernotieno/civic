# apps/users/management/commands/quick_test_users.py

from django.core.management.base import BaseCommand
from apps.users.models import CustomUser, County, Location
from apps.users.utils import validate_kenyan_national_id


class Command(BaseCommand):
    help = 'Create test users for CivicAI demo'
    
    def handle(self, *args, **options):
        self.stdout.write('Creating test users for CivicAI demo...')
        
        # Get some counties
        try:
            nairobi = County.objects.get(code='NBI')
            kisumu = County.objects.get(code='KSM')
            nakuru = County.objects.get(code='NKR')
        except County.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('Counties not found. Run setup_counties first.')
            )
            return
        
        test_users = [
            {
                'national_id': '12345678',
                'name': 'John Doe',
                'email': 'john@example.com',
                'role': 'citizen',
                'tenant': nairobi,
            },
            {
                'national_id': '87654321',
                'name': 'Jane Smith',
                'email': 'jane@kisumu.go.ke',
                'role': 'government_official',
                'official_level': 'local',
                'tenant': kisumu,
                'home_county': kisumu,
            },
            {
                'national_id': '11223344',
                'name': 'Robert Kiprotich',
                'email': 'robert@kenya.go.ke',
                'role': 'government_official',
                'official_level': 'national',
                'tenant': nakuru,
                'home_county': nakuru,
            },
        ]
        
        created_count = 0
        for user_data in test_users:
            national_id = user_data.pop('national_id')
            
            # Check if user exists
            if CustomUser.objects.filter(email=user_data.get('email')).exists():
                self.stdout.write(f'User {user_data["email"]} already exists, skipping...')
                continue
            
            # Set county location
            user_data['county'] = user_data['tenant'].location
            
            # Create user
            try:
                user = CustomUser.objects.create_user_with_national_id(
                    national_id=national_id,
                    password='testpass123',
                    **user_data
                )
                created_count += 1
                self.stdout.write(f'✓ Created {user.name} ({user.get_role_display()})')
                
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'✗ Failed to create {user_data["name"]}: {e}')
                )
        
        # Create anonymous user
        try:
            anon_user = CustomUser.create_anonymous_user('demo_session', nairobi)
            created_count += 1
            self.stdout.write(f'✓ Created anonymous user (session: demo_session)')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'✗ Failed to create anonymous user: {e}')
            )
        
        self.stdout.write('')
        self.stdout.write(
            self.style.SUCCESS(f'Created {created_count} test users successfully!')
        )
        self.stdout.write('Test credentials:')
        self.stdout.write('  National ID: 12345678, Password: testpass123 (Citizen)')
        self.stdout.write('  National ID: 87654321, Password: testpass123 (Local Official)')
        self.stdout.write('  National ID: 11223344, Password: testpass123 (National Official)')
