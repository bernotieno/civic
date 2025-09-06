
# =============================================================================
# VERIFICATION: Test integration command
# FILE: apps/core/management/commands/verify_phase3_integration.py
# =============================================================================
from django.core.management.base import BaseCommand
from apps.users.models import CustomUser, County
from apps.users.anonymous import AnonymousUserHandler
from apps.core.anonymous import AnonymousSessionManager

class Command(BaseCommand):
    help = 'Verify Phase 3 integration and backward compatibility'
    
    def handle(self, *args, **options):
        self.stdout.write('=== Verifying Phase 3 Integration ===\n')
        
        county = County.objects.first()
        if not county:
            self.stdout.write(self.style.ERROR('No counties found'))
            return
        
        # Test 1: Direct AnonymousUserHandler usage (Phase 3)
        self.stdout.write('--- Test 1: Phase 3 AnonymousUserHandler ---')
        session_id = AnonymousSessionManager.create_session(county.id)
        user1 = AnonymousUserHandler.create_anonymous_user(session_id, county.id)
        
        if user1:
            self.stdout.write(f'✓ Created via AnonymousUserHandler: {user1.national_id_hash}')
        else:
            self.stdout.write(self.style.ERROR('✗ Failed via AnonymousUserHandler'))
        
        # Test 2: Backward compatibility (Phase 1 wrapper)
        self.stdout.write('\n--- Test 2: Backward Compatibility Wrapper ---')
        session_id2 = AnonymousSessionManager.create_session(county.id)
        user2 = CustomUser.create_anonymous_user(session_id2, county)
        
        if user2:
            self.stdout.write(f'✓ Created via CustomUser wrapper: {user2.national_id_hash}')
        else:
            self.stdout.write(self.style.ERROR('✗ Failed via CustomUser wrapper'))
        
        # Test 3: Verify both methods create equivalent users
        if user1 and user2:
            self.stdout.write('\n--- Test 3: Equivalence Check ---')
            
            checks = [
                ('Role', user1.role == user2.role),
                ('Is Active', user1.is_active == user2.is_active),
                ('Tenant', user1.tenant == user2.tenant),
                ('County', user1.county == user2.county),
                ('Has national_id_hash', bool(user1.national_id_hash and user2.national_id_hash)),
            ]
            
            for check_name, result in checks:
                status = '✓' if result else '✗'
                self.stdout.write(f'  {status} {check_name}')
        
        # Test 4: Session management integration
        self.stdout.write('\n--- Test 4: Session Integration ---')
        
        can_submit1, msg1 = AnonymousSessionManager.can_submit(session_id)
        can_submit2, msg2 = AnonymousSessionManager.can_submit(session_id2)
        
        self.stdout.write(f'✓ Session 1 can submit: {can_submit1}')
        self.stdout.write(f'✓ Session 2 can submit: {can_submit2}')
        
        # Test 5: Tracking ID generation
        if user1 and user2:
            self.stdout.write('\n--- Test 5: Tracking ID Generation ---')
            
            tracking1 = AnonymousUserHandler.create_tracking_id('FB001', user1.id)
            tracking2 = AnonymousUserHandler.create_tracking_id('FB002', user2.id)
            
            self.stdout.write(f'✓ Tracking ID 1: {tracking1}')
            self.stdout.write(f'✓ Tracking ID 2: {tracking2}')
        
        self.stdout.write('\n=== Phase 3 Integration Verified ===')

