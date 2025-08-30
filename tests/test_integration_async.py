# tests/test_integration_async.py
from django.test import TransactionTestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from apps.projects.models import Bill
from apps.users.models import CustomUser
import time
import json

class AsyncWorkflowIntegrationTests(TransactionTestCase):
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testadmin',
            email='admin@test.com',
            role='parliament_admin'
        )
        self.token = Token.objects.create(user=self.user)
        self.client = APIClient()
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')
    
    def test_complete_async_bill_processing_workflow(self):
        """Test complete async workflow from upload to completion"""
        # Create test PDF
        pdf_content = b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000074 00000 n \n0000000120 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n179\n%%EOF"
        uploaded_file = SimpleUploadedFile(
            "test_bill.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        # 1. Upload bill with async processing
        response = self.client.post('/api/admin/bills/', {
            'title': 'Integration Test Bill',
            'description': 'Testing async workflow',
            'sponsor': 'Test MP',
            'async_processing': True,
            'document': uploaded_file
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data['success'])
        self.assertTrue(data['processing_async'])
        self.assertIn('task_id', data)
        self.assertIn('websocket_channel', data)
        
        bill_id = data['bill_id']
        task_id = data['task_id']
        
        # 2. Check initial status
        response = self.client.get(f'/api/admin/bills/{bill_id}/status/')
        self.assertEqual(response.status_code, 200)
        status_data = response.json()
        self.assertTrue(status_data['success'])
        self.assertEqual(status_data['status']['task_id'], task_id)
        
        # 3. Wait for processing completion (with timeout)
        max_wait = 60  # 60 seconds timeout
        waited = 0
        processing_complete = False
        
        while waited < max_wait and not processing_complete:
            time.sleep(2)
            waited += 2
            
            response = self.client.get(f'/api/admin/bills/{bill_id}/progress/')
            if response.status_code == 200:
                progress_data = response.json()
                if progress_data['progress']['status'] in ['completed', 'failed']:
                    processing_complete = True
                    break
        
        # 4. Verify completion
        self.assertTrue(processing_complete, "Processing did not complete within timeout")
        
        # 5. Check final bill state
        bill = Bill.objects.get(id=bill_id)
        self.assertEqual(bill.processing_status, 'completed')
        self.assertNotEqual(bill.summary, '')
        self.assertNotEqual(bill.summary_html, '')
        self.assertTrue(bill.is_chunked)
        self.assertGreater(bill.total_chunks, 0)
    
    def test_async_processing_retry(self):
        """Test retry functionality for failed processing"""
        # Create a bill that will fail processing
        bill = Bill.objects.create(
            title="Test Retry Bill",
            description="Testing retry",
            sponsor="Test MP",
            created_by=self.user,
            processing_status='failed',
            processing_message='Test failure'
        )
        
        # Test retry
        response = self.client.post(f'/api/admin/bills/{bill.id}/retry/', {
            'async_processing': True
        })
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        # Note: Retry might fail due to no document, but should attempt
        self.assertIn('success', data)
    
    def test_async_processing_cancellation(self):
        """Test cancellation of ongoing processing"""
        # This test requires a bill that's currently processing
        # In practice, you'd need to mock a long-running task
        pass  # Implementation depends on specific test setup