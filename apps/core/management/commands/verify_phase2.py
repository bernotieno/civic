
# =============================================================================
# FILE: apps/core/management/commands/verify_phase2.py
# =============================================================================
from django.core.management.base import BaseCommand
from django.conf import settings
import importlib

class Command(BaseCommand):
    help = 'Verify Phase 2 implementation is correctly integrated'
    
    def handle(self, *args, **options):
        self.stdout.write('=== Verifying Phase 2 Integration ===\n')
        
        # Check if core app is in INSTALLED_APPS
        if 'apps.core' in settings.INSTALLED_APPS:
            self.stdout.write('✓ apps.core is in INSTALLED_APPS')
        else:
            self.stdout.write(self.style.ERROR('✗ apps.core not in INSTALLED_APPS'))
            return
        
        # Check if middleware is configured
        middleware_found = False
        for middleware in settings.MIDDLEWARE:
            if 'InvisibleBoundaryMiddleware' in middleware:
                middleware_found = True
                break
        
        if middleware_found:
            self.stdout.write('✓ InvisibleBoundaryMiddleware is configured')
        else:
            self.stdout.write(self.style.ERROR('✗ InvisibleBoundaryMiddleware not in MIDDLEWARE'))
        
        # Check if modules can be imported
        modules_to_check = [
            'apps.core.context',
            'apps.core.middleware',
            'apps.core.decorators',
        ]
        
        for module_name in modules_to_check:
            try:
                importlib.import_module(module_name)
                self.stdout.write(f'✓ {module_name} imports successfully')
            except ImportError as e:
                self.stdout.write(self.style.ERROR(f'✗ {module_name} import failed: {e}'))
        
        # Test UserContext creation
        try:
            from apps.core.context import UserContext
            from apps.users.models import CustomUser
            
            user = CustomUser.objects.first()
            if user:
                context = UserContext(user)
                self.stdout.write(f'✓ UserContext created for {user.get_role_display()}')
                self.stdout.write(f'  - Available endpoints: {len(context.app_config["available_endpoints"])}')
                self.stdout.write(f'  - Data scope: {context.app_config["data_scope"]}')
            else:
                self.stdout.write(self.style.WARNING('! No users found to test UserContext'))
        
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ UserContext test failed: {e}'))
        
        self.stdout.write('\n=== Phase 2 Verification Complete ===')
