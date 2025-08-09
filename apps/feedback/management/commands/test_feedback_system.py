# FILE: apps/feedback/management/commands/test_feedback_system.py

from django.core.management.base import BaseCommand
from django.test import Client
import json

class Command(BaseCommand):
    help = 'Test feedback system endpoints'
    
    def handle(self, *args, **options):
        self.stdout.write('🧪 Testing Feedback System...')
        
        client = Client()
        
        # Test categories endpoint
        response = client.get('/api/feedback/categories/')
        self.stdout.write(f'✅ Categories: {response.status_code == 200}')
        
        # Test anonymous feedback (requires session)
        session_response = client.post('/api/auth/anonymous/', 
            data=json.dumps({'county_id': 1}),
            content_type='application/json'
        )
        
        if session_response.status_code == 201:
            session_data = json.loads(session_response.content)
            session_id = session_data['session_id']
            
            feedback_data = {
                'session_id': session_id,
                'title': 'Test feedback submission',
                'content': 'This is a test feedback to verify the system works correctly.',
                'category': 'other',
                'county_id': 1
            }
            
            feedback_response = client.post('/api/feedback/anonymous/',
                data=json.dumps(feedback_data),
                content_type='application/json'
            )
            
            self.stdout.write(f'✅ Anonymous feedback: {feedback_response.status_code == 201}')
            
            if feedback_response.status_code == 201:
                tracking_data = json.loads(feedback_response.content)
                tracking_id = tracking_data['data']['tracking_id']
                
                # Test tracking
                track_response = client.get(f'/api/feedback/track/{tracking_id}/')
                self.stdout.write(f'✅ Tracking: {track_response.status_code == 200}')
        
        self.stdout.write('🎉 Feedback system test complete!')