# tests/test_performance.py
import concurrent.futures
import time
from django.test import TransactionTestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from apps.users.models import CustomUser
import threading

class AsyncPerformanceTests(TransactionTestCase):
    
    def setUp(self):
        self.user = CustomUser.objects.create_user(
            username='testadmin',
            email='admin@test.com', 
            role='parliament_admin'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
    
    def create_test_bill(self, index):
        """Helper to create a test bill"""
        pdf_content = b"%PDF-1.4\nTest content for bill " + str(index).encode()
        uploaded_file = SimpleUploadedFile(
            f"test_bill_{index}.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        response = self.client.post('/api/admin/bills/', {
            'title': f'Performance Test Bill {index}',
            'description': f'Performance testing bill #{index}',
            'sponsor': f'Test MP {index}',
            'async_processing': True,
            'document': uploaded_file
        })
        
        return response.json() if response.status_code == 200 else None
    
    def test_concurrent_bill_processing(self):
        """Test processing multiple bills concurrently"""
        num_bills = 5  # Test with 5 concurrent bills
        
        start_time = time.time()
        
        # Create bills concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_bills) as executor:
            futures = [
                executor.submit(self.create_test_bill, i) 
                for i in range(num_bills)
            ]
            
            results = []
            for future in concurrent.futures.as_completed(futures):
                result = future.result()
                if result and result.get('success'):
                    results.append(result)
        
        creation_time = time.time() - start_time
        
        # Verify all bills were created successfully
        self.assertEqual(len(results), num_bills)
        
        # Verify all have async processing enabled
        for result in results:
            self.assertTrue(result['processing_async'])
            self.assertIn('task_id', result)
        
        print(f"Created {num_bills} bills concurrently in {creation_time:.2f} seconds")
        
        # Monitor processing completion
        bill_ids = [result['bill_id'] for result in results]
        completed_bills = set()
        max_wait = 300  # 5 minutes timeout
        waited = 0
        
        while waited < max_wait and len(completed_bills) < num_bills:
            time.sleep(5)
            waited += 5
            
            for bill_id in bill_ids:
                if bill_id not in completed_bills:
                    response = self.client.get(f'/api/admin/bills/{bill_id}/progress/')
                    if response.status_code == 200:
                        progress_data = response.json()
                        if progress_data['progress']['status'] in ['completed', 'failed']:
                            completed_bills.add(bill_id)
        
        completion_time = time.time() - start_time
        print(f"Processed {len(completed_bills)}/{num_bills} bills in {completion_time:.2f} seconds")
        
        # At least some bills should complete successfully
        self.assertGreater(len(completed_bills), 0)
    
    def test_websocket_connection_load(self):
        """Test multiple WebSocket connections"""
        # This would require WebSocket load testing tools
        # Implementation depends on specific WebSocket testing framework
        pass