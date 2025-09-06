# tests/test_celery_tasks.py
from django.test import TestCase, TransactionTestCase
from unittest.mock import patch, MagicMock
from django.core.files.uploadedfile import SimpleUploadedFile
from apps.api.tasks import process_bill_async, save_uploaded_file_for_async
from apps.projects.models import Bill
import tempfile
import os

class CeleryTaskTests(TransactionTestCase):
    
    def setUp(self):
        self.user = User.objects.create_user(
            username='testadmin',
            email='test@test.com',
            role='parliament_admin'
        )
        self.bill = Bill.objects.create(
            title="Test Bill",
            description="Test Description", 
            sponsor="Test Sponsor",
            created_by=self.user
        )
    
    def test_save_uploaded_file_for_async(self):
        """Test saving uploaded file for async processing"""
        # Create test PDF content
        pdf_content = b"%PDF-1.4\n%Test PDF content"
        uploaded_file = SimpleUploadedFile(
            "test.pdf",
            pdf_content,
            content_type="application/pdf"
        )
        
        # Save file
        file_path = save_uploaded_file_for_async(uploaded_file, str(self.bill.id))
        
        # Verify file was saved
        self.assertTrue(os.path.exists(file_path))
        self.assertIn(str(self.bill.id), file_path)
        
        # Verify content
        with open(file_path, 'rb') as f:
            saved_content = f.read()
        self.assertEqual(saved_content, pdf_content)
        
        # Cleanup
        os.remove(file_path)
    
    @patch('apps.api.tasks.extract_pdf_text_with_progress')
    @patch('apps.api.tasks.detect_bill_sections')
    @patch('apps.api.tasks.apply_civicai_prompt_to_section')
    def test_process_bill_async_success(self, mock_prompt, mock_sections, mock_extract):
        """Test successful async bill processing"""
        # Setup mocks
        mock_extract.return_value = ("Test bill content", 10)
        mock_sections.return_value = [{
            'title': 'Section 1',
            'content': 'Test content',
            'start_pos': 0,
            'end_pos': 100
        }]
        mock_prompt.return_value = "## Summary\nTest summary"
        
        # Create test file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(b"%PDF-1.4\nTest content")
            temp_file_path = temp_file.name
        
        try:
            # Process async (synchronously for test)
            result = process_bill_async(str(self.bill.id), temp_file_path)
            
            # Verify result
            self.assertTrue(result['success'])
            self.assertEqual(result['bill_id'], str(self.bill.id))
            self.assertIn('summary_html', result)
            self.assertIn('chunks_created', result)
            
            # Verify bill was updated
            self.bill.refresh_from_db()
            self.assertNotEqual(self.bill.summary, '')
            self.assertEqual(self.bill.processing_status, 'completed')
            
        finally:
            os.unlink(temp_file_path)
    
    @patch('apps.api.tasks.extract_pdf_text_with_progress')
    def test_process_bill_async_failure(self, mock_extract):
        """Test async bill processing failure and retry"""
        # Mock failure
        mock_extract.side_effect = Exception("PDF extraction failed")
        
        # Create test file
        with tempfile.NamedTemporaryFile(suffix='.pdf', delete=False) as temp_file:
            temp_file.write(b"%PDF-1.4\nTest content")
            temp_file_path = temp_file.name
        
        try:
            # Process async (should fail)
            result = process_bill_async(str(self.bill.id), temp_file_path)
            
            # Verify failure
            self.assertFalse(result['success'])
            self.assertIn('error', result)
            
            # Verify bill status
            self.bill.refresh_from_db()
            self.assertEqual(self.bill.processing_status, 'failed')
            
        finally:
            os.unlink(temp_file_path)