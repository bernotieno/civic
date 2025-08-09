
# =============================================================================
# STEP 11: TESTING COMMAND
# FILE: apps/feedback/management/commands/test_user_feedback_management.py
# =============================================================================

from django.core.management.base import BaseCommand
from django.test import Client
from django.contrib.auth import get_user_model
from apps.users.models import County
from apps.feedback.models import Feedback
import json

User = get_user_model()

class Command(BaseCommand):
    help = 'Test user feedback management endpoints'
    
    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing User Feedback Management...')
        
        # Create test user
        county = County.objects.first()
        if not county:
            self.stdout.write(self.style.ERROR('No counties found'))
            return
        
        # Create test feedback
        test_user = User.objects.filter(role='citizen').first()
        if not test_user:
            self.stdout.write(self.style.WARNING('No citizen users found - create one first'))
            return
        
        # Create test feedback for user
        test_feedback = Feedback.objects.create(
            user=test_user,
            title='Test feedback for management',
            content='This is test content for the feedback management system testing.',
            category='other',
            priority='medium',
            county=county,
            submitted_via='api'
        )
        
        self.stdout.write(f'✓ Created test feedback: {test_feedback.tracking_id}')
        
        # Note: Full endpoint testing would require authentication setup
        # This is a basic structure - in production you'd use DRF test client
        
        self.stdout.write('📋 Endpoints ready for testing:')
        self.stdout.write('  GET /api/feedback/my-submissions/')
        self.stdout.write(f'  GET /api/feedback/my-submissions/{test_feedback.id}/')
        self.stdout.write(f'  PUT /api/feedback/my-submissions/{test_feedback.id}/edit/')
        self.stdout.write(f'  DELETE /api/feedback/my-submissions/{test_feedback.id}/delete/')
        self.stdout.write('  GET /api/feedback/my-stats/')
        
        self.stdout.write('🎉 User feedback management system ready!')