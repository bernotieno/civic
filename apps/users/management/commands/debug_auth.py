# =============================================================================
# FILE: apps/users/management/commands/debug_auth.py
# =============================================================================
from django.core.management.base import BaseCommand
from django.contrib.auth import authenticate
from apps.users.models import CustomUser, hash_national_id, verify_national_id


class Command(BaseCommand):
    help = 'Debug authentication system'
    
    def handle(self, *args, **options):
        self.stdout.write('=== CivicAI Authentication Debug ===')
        
        # Test data
        test_national_id = '25604799'
        test_password = '2222'  # Assuming this is your password
        
        self.stdout.write(f'Testing National ID: {test_national_id}')
        
        # 1. Test hashing
        hash1 = hash_national_id(test_national_id)
        hash2 = hash_national_id(test_national_id)
        self.stdout.write(f'Hash 1: {hash1[:20]}...')
        self.stdout.write(f'Hash 2: {hash2[:20]}...')
        self.stdout.write(f'Hashes different (expected): {hash1 != hash2}')
        
        # 2. Test verification
        verify1 = verify_national_id(test_national_id, hash1)
        verify2 = verify_national_id(test_national_id, hash2)
        self.stdout.write(f'Verify hash 1: {verify1}')
        self.stdout.write(f'Verify hash 2: {verify2}')
        
        # 3. Check all users
        self.stdout.write('\n=== All Users ===')
        for user in CustomUser.all_objects.all():
            self.stdout.write(f'User: {user.name}')
            self.stdout.write(f'  Hash: {user.national_id_hash[:30]}...')
            self.stdout.write(f'  Username: {user.username}')
            self.stdout.write(f'  Superuser: {user.is_superuser}')
            self.stdout.write(f'  Active: {user.is_active}')
            self.stdout.write(f'  Deleted: {user.is_deleted}')
            
            # Test if this user matches our national ID
            matches = verify_national_id(test_national_id, user.national_id_hash)
            self.stdout.write(f'  Matches {test_national_id}: {matches}')
            self.stdout.write('')
        
        # 4. Test Django authentication
        self.stdout.write('=== Testing Django Authentication ===')
        user = authenticate(username=test_national_id, password=test_password)
        self.stdout.write(f'Authentication result: {user}')
        
        if user:
            self.stdout.write(f'Authenticated as: {user.name}')
        else:
            self.stdout.write('Authentication failed')
