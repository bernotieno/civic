# tests/test_async_functions.py
from django.test import TestCase
from unittest.mock import patch, mock_open
from apps.api.async_progress_tracker import (
    start_async_bill_processing,
    update_bill_progress_async,
    get_bill_processing_status
)
from apps.projects.models import Bill

class AsyncProgressTrackerTests(TestCase):
    
    def setUp(self):
        self.bill = Bill.objects.create(
            title="Test Bill",
            description="Test Description",
            sponsor="Test Sponsor",
            created_by=self.user
        )
    
    def test_start_async_processing_session(self):
        """Test starting async processing session"""
        result = start_async_bill_processing(
            str(self.bill.id), 
            "test-task-id"
        )
        
        self.assertTrue(result['success'])
        self.assertIsNotNone(result['session_id'])
        self.assertEqual(result['bill_id'], str(self.bill.id))
        self.assertEqual(result['task_id'], "test-task-id")
    
    def test_update_progress_async(self):
        """Test async progress updates"""
        # Start session first
        start_async_bill_processing(str(self.bill.id), "test-task-id")
        
        # Update progress
        update_bill_progress_async(
            str(self.bill.id),
            'processing', 
            50, 
            'Processing section 1 of 2',
            broadcast=False  # Disable WebSocket for unit test
        )
        
        # Verify database was updated
        self.bill.refresh_from_db()
        self.assertEqual(self.bill.processing_progress, 50)
        self.assertEqual(self.bill.processing_message, 'Processing section 1 of 2')
    
    def test_get_processing_status(self):
        """Test getting comprehensive processing status"""
        # Setup session
        start_async_bill_processing(str(self.bill.id), "test-task-id")
        
        # Get status
        status = get_bill_processing_status(str(self.bill.id))
        
        self.assertIn('processing_status', status)
        self.assertIn('task_id', status)
        self.assertIn('session_info', status)
        self.assertEqual(status['task_id'], "test-task-id")