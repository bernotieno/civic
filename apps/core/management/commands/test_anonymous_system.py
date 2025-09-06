
# =============================================================================
# TESTING: Management command for Phase 3
# FILE: apps/core/management/commands/test_anonymous_system.py
# =============================================================================
from django.core.management.base import BaseCommand
from django.test import RequestFactory
from apps.core.anonymous import AnonymousSessionManager
from apps.users.anonymous import AnonymousUserHandler
from apps.users.models import County
from django.utils import timezone

class Command(BaseCommand):
    help = 'Test the anonymous user system'
    
    def handle(self, *args, **options):
        self.stdout.write('=== Testing Anonymous User System ===\n')
        
        # Get a test county
        county = County.objects.first()
        if not county:
            self.stdout.write(self.style.ERROR('No counties found'))
            return
        
        # Test session creation
        self.stdout.write('--- Testing Session Management ---')
        
        # Create mock request metadata
        mock_meta = {
            'HTTP_USER_AGENT': 'Mozilla/5.0 (Test Browser)',
            'HTTP_ACCEPT_LANGUAGE': 'en-US,en;q=0.9',
            'HTTP_ACCEPT_ENCODING': 'gzip, deflate',
        }
        
        session_id = AnonymousSessionManager.create_session(county.id, mock_meta)
        self.stdout.write(f'✓ Created session: {session_id}')
        
        # Test session retrieval
        session_data = AnonymousSessionManager.get_session(session_id)
        if session_data:
            self.stdout.write(f'✓ Retrieved session data')
            self.stdout.write(f'  County: {session_data["county_id"]}')
            self.stdout.write(f'  Submissions: {session_data["submission_count"]}')
            self.stdout.write(f'  Fingerprint: {session_data["browser_fingerprint"]}')
        else:
            self.stdout.write(self.style.ERROR('✗ Failed to retrieve session'))
        
        # Test submission limits
        can_submit, message = AnonymousSessionManager.can_submit(session_id)
        self.stdout.write(f'✓ Can submit: {can_submit} ({message})')
        
        # Test anonymous user creation
        self.stdout.write('\n--- Testing Anonymous User Creation ---')
        
        location_data = {
            # Optional: add sub_county, ward, village IDs if they exist
        }
        
        anonymous_user = AnonymousUserHandler.create_anonymous_user(
            session_id, county.id, location_data
        )
        
        if anonymous_user:
            self.stdout.write(f'✓ Created anonymous user: {anonymous_user.national_id_hash}')
            self.stdout.write(f'  Role: {anonymous_user.role}')
            self.stdout.write(f'  County: {anonymous_user.county.name}')
            self.stdout.write(f'  Active: {anonymous_user.is_active}')
            
            # Test tracking ID generation
            tracking_id = AnonymousUserHandler.create_tracking_id('FEEDBACK_001', anonymous_user.id)
            self.stdout.write(f'✓ Generated tracking ID: {tracking_id}')
        else:
            self.stdout.write(self.style.ERROR('✗ Failed to create anonymous user'))
        
        # Test session update
        self.stdout.write('\n--- Testing Session Updates ---')
        
        success = AnonymousSessionManager.update_session(
            session_id, 
            submission_count=1,
            last_submission=timezone.now().isoformat()
        )
        
        if success:
            updated_session = AnonymousSessionManager.get_session(session_id)
            self.stdout.write(f'✓ Updated session - submissions: {updated_session["submission_count"]}')
        else:
            self.stdout.write(self.style.ERROR('✗ Failed to update session'))
        
        self.stdout.write('\n=== Anonymous System Test Complete ===')
