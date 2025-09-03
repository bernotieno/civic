# apps/api/tasks.py
import os
import time
import logging
from typing import Dict, List, Optional
from celery import current_app as app
from django.core.files.uploadedfile import InMemoryUploadedFile
from django.core.files import File
from django.utils import timezone
from django.conf import settings
from celery import group

# Import Phase 1 functions (all working and tested)
from .bill_processor import (
    extract_pdf_text_with_progress,
    detect_bill_sections, 
    apply_civicai_prompt_to_section,
    markdown_to_html,
    combine_sections_to_final_summary,
    create_bill_chunks,
    validate_summary_quality
)
from .progress_tracker import (
    update_bill_progress,
    get_bill_progress,
    mark_bill_processing_complete,
    estimate_processing_time
)
from .async_progress_tracker import update_bill_progress_async
from .embedding_service import generate_chunk_embeddings

logger = logging.getLogger(__name__)


def save_uploaded_file_for_async(uploaded_file, bill_id: str) -> str:
    """
    Save uploaded file to persistent location for async processing
    Args:
        uploaded_file: Django UploadedFile or file path
        bill_id: Bill UUID string for unique naming
    Returns:
        str: Path to saved file
    """
    try:
        # Create bills temp directory if it doesn't exist
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'bills', 'temp')
        os.makedirs(temp_dir, exist_ok=True)
        
        # Generate unique filename
        timestamp = int(time.time())
        filename = f"bill_{bill_id}_{timestamp}.pdf"
        file_path = os.path.join(temp_dir, filename)
        
        # Save file
        if hasattr(uploaded_file, 'read'):
            # It's a file-like object
            with open(file_path, 'wb') as dest:
                if hasattr(uploaded_file, 'chunks'):
                    for chunk in uploaded_file.chunks():
                        dest.write(chunk)
                else:
                    uploaded_file.seek(0)
                    dest.write(uploaded_file.read())
        else:
            # It's a file path, copy it
            import shutil
            shutil.copy2(uploaded_file, file_path)
        
        logger.info(f"Saved file for async processing: {file_path}")
        return file_path
        
    except Exception as e:
        logger.error(f"Failed to save file for async processing: {str(e)}")
        raise Exception(f"File save failed: {str(e)}")


def cleanup_temp_files(file_paths: List[str]) -> None:
    """
    Cleanup temporary files after processing
    Args:
        file_paths: List of file paths to clean up
    """
    for file_path in file_paths:
        try:
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Cleaned up temp file: {file_path}")
        except Exception as e:
            logger.warning(f"Failed to cleanup temp file {file_path}: {str(e)}")


@app.task(bind=True, 
          max_retries=3,
          retry_backoff=True,
          retry_backoff_max=700,
          retry_jitter=False,
          queue='ai_responses')
def process_bill_async(self, bill_id: str, uploaded_file_path: str) -> Dict:
    """
    Main async bill processing task
    Args:
        bill_id: Bill UUID string
        uploaded_file_path: Path to uploaded PDF file
    Returns:
        dict: {
            'success': bool,
            'bill_id': str,
            'summary_html': str,
            'summary_markdown': str,
            'chunks_created': int,
            'sections_count': int,
            'processing_time': float,
            'error': str (if failed)
        }
    """
    from apps.projects.models import Bill
    
    start_time = time.time()
    temp_files_to_cleanup = [uploaded_file_path] if uploaded_file_path else []
    
    try:
        logger.info(f"Starting async processing for bill {bill_id}, task {self.request.id}")
        
        # Get bill instance
        try:
            bill = Bill.objects.get(id=bill_id, is_deleted=False)
        except Bill.DoesNotExist:
            error_msg = f"Bill {bill_id} not found"
            logger.error(error_msg)
            return {
                'success': False,
                'bill_id': bill_id,
                'error': error_msg,
                'processing_time': time.time() - start_time
            }
        
        # Update task ID in progress tracking
        from .async_progress_tracker import update_bill_task_id
        update_bill_task_id(bill_id, self.request.id)
        
        update_bill_progress_async(bill_id, 'extracting', 5, 'Starting async bill processing...')
        
        # Validate file exists
        if not os.path.exists(uploaded_file_path):
            raise FileNotFoundError(f"Uploaded file not found: {uploaded_file_path}")
        
        # Create file-like object from path for Phase 1 functions
        class FileWrapper:
            def __init__(self, file_path):
                self.file_path = file_path
                self._file = open(file_path, 'rb')
                self.name = os.path.basename(file_path)
                
            def __enter__(self):
                return self._file
                
            def __exit__(self, exc_type, exc_val, exc_tb):
                self._file.close()
                
            def seek(self, pos):
                return self._file.seek(pos)
                
            def read(self):
                return self._file.read()
                
            def close(self):
                self._file.close()
        
        # Process with Phase 1 enhanced function
        with FileWrapper(uploaded_file_path) as file_wrapper:
            # Step 1: Extract text with progress
            update_bill_progress_async(bill_id, 'extracting', 10, 'Extracting text from PDF...')
            text, page_count = extract_pdf_text_with_progress(file_wrapper, None)
            
            if not text.strip():
                raise Exception('No text could be extracted from PDF')
            
            # Step 2: Detect sections
            update_bill_progress_async(bill_id, 'analyzing', 55, 'Analyzing document structure...')
            sections = detect_bill_sections(text)
            sections_count = len(sections)
            
            update_bill_progress_async(bill_id, 'sectioning', 60, f'Identified {sections_count} sections for processing...')
            
            # Step 3: Process sections with AI (PARALLEL BATCHING)
            update_bill_progress_async(bill_id, 'processing', 60, f'Starting parallel processing of {sections_count} sections...')

            # Split sections into batches for parallel processing
            batch_size = max(15, sections_count // 8)  # Create ~8 parallel batches
            section_batches = [
                sections[i:i + batch_size] 
                for i in range(0, len(sections), batch_size)
            ]

            logger.info(f"Processing {sections_count} sections in {len(section_batches)} parallel batches")

            # Import group for parallel task execution
            from celery import group

            # Create parallel Celery tasks
            batch_jobs = group(
                process_bill_section_batch.s(bill_id, batch, batch_idx) 
                for batch_idx, batch in enumerate(section_batches)
            )

            # Use ThreadPoolExecutor for parallel processing within single task (safer approach)
            try:
                update_bill_progress_async(bill_id, 'processing', 65, 'Running parallel section processing...')
                
                from concurrent.futures import ThreadPoolExecutor, as_completed
                import threading
                
                # Process sections in parallel using ThreadPoolExecutor (within same task)
                processed_sections = []
                total_sections = len(sections)
                completed_sections = 0
                
                # Use ThreadPoolExecutor with 5 concurrent threads
                with ThreadPoolExecutor(max_workers=5) as executor:
                    # Submit all sections for processing
                    future_to_section = {
                        executor.submit(apply_civicai_prompt_to_section, section['content'], section['title']): section 
                        for section in sections
                    }
                    
                    # Collect results as they complete
                    for future in as_completed(future_to_section):
                        section = future_to_section[future]
                        try:
                            result = future.result()
                            processed_sections.append(result)
                            completed_sections += 1
                            
                            # Update progress every 10 completed sections
                            if completed_sections % 10 == 0:
                                progress = 65 + int((completed_sections / total_sections) * 20)
                                update_bill_progress_async(
                                    bill_id, 
                                    'processing', 
                                    progress, 
                                    f'Processed {completed_sections}/{total_sections} sections...'
                                )
                            
                        except Exception as e:
                            logger.error(f"Section processing failed: {e}")
                            processed_sections.append(f"**{section['title']}**\n\nProcessing failed: {str(e)}")
                            completed_sections += 1
                
                logger.info(f"ThreadPool processing completed: {len(processed_sections)} sections processed")
                update_bill_progress_async(bill_id, 'processing', 85, f'Parallel processing completed: {len(processed_sections)} sections processed')

            except Exception as e:
                logger.error(f"ThreadPool processing failed, falling back to sequential: {e}")
                # Fallback to original sequential processing
                processed_sections = []
                for i, section in enumerate(sections):
                    section_progress = 65 + int((i / sections_count) * 20)  # 65-85% range
                    update_bill_progress_async(
                        bill_id,
                        'processing', 
                        section_progress, 
                        f'Processing section {i+1} of {sections_count} (fallback): {section["title"][:50]}...'
                    )
                    processed_content = apply_civicai_prompt_to_section(section['content'], section['title'])
                    processed_sections.append(processed_content)
            
            update_bill_progress_async(bill_id, 'formatting', 90, 'Combining sections and formatting output...')
            
            # Step 4: Combine sections and create final output
            final_markdown, final_html = combine_sections_to_final_summary(processed_sections)
            
            # Validate summary quality
            quality_check = validate_summary_quality(final_markdown)
            if not quality_check['overall_quality']:
                logger.warning(f"Summary quality check failed for bill {bill_id}: {quality_check}")
            
            update_bill_progress_async(bill_id, 'completing', 95, 'Creating chunks for chat functionality...')
            
            # Step 5: Create chunks for Phase 3 chat functionality
            chunks_created = create_bill_chunks(text, bill)
            
            # Step 6: Update bill with results
            bill.summary = final_markdown
            bill.summary_html = final_html
            bill.is_chunked = True
            bill.total_chunks = chunks_created
            bill.save(update_fields=['summary', 'summary_html', 'is_chunked', 'total_chunks'])
            
            # Mark as complete
            mark_bill_processing_complete(bill_id, success=True)
            update_bill_progress_async(bill_id, 'completed', 100, 'Async processing complete!')
            
            processing_time = time.time() - start_time
            
            logger.info(f"Async processing completed for bill {bill_id} in {processing_time:.2f}s")
            
            # Schedule embedding generation for Phase 3 preparation
            generate_bill_embeddings_async.delay(bill_id)
            
            return {
                'success': True,
                'bill_id': bill_id,
                'summary_html': final_html,
                'summary_markdown': final_markdown,
                'chunks_created': chunks_created,
                'sections_count': sections_count,
                'processing_time': processing_time,
                'task_id': self.request.id,
                'quality_score': sum(quality_check.values()) / len(quality_check)
            }
    
    except Exception as exc:
        error_msg = str(exc)
        processing_time = time.time() - start_time
        
        logger.error(f"Async processing failed for bill {bill_id}: {error_msg}")
        
        # Mark as failed
        mark_bill_processing_complete(bill_id, success=False, error_message=error_msg)
        update_bill_progress_async(bill_id, 'failed', 0, f'Processing failed: {error_msg}')
        
        # Retry logic with exponential backoff
        if self.request.retries < self.max_retries:
            retry_countdown = 60 * (2 ** self.request.retries)
            logger.info(f"Retrying bill {bill_id} in {retry_countdown} seconds (attempt {self.request.retries + 1})")
            
            update_bill_progress_async(bill_id, 'pending', 0, f'Retrying in {retry_countdown} seconds...')
            raise self.retry(countdown=retry_countdown, exc=exc)
        
        return {
            'success': False,
            'bill_id': bill_id,
            'error': error_msg,
            'processing_time': processing_time,
            'task_id': self.request.id,
            'max_retries_exceeded': True
        }
    
    finally:
        # Cleanup temp files
        cleanup_temp_files(temp_files_to_cleanup)


@app.task(bind=True, queue='ai_batch')
def create_bill_chunks_async(self, bill_id: str, sections: List[Dict]) -> Dict:
    """
    Create and store bill chunks for future chat functionality
    Args:
        bill_id: Bill UUID string
        sections: List of detected sections from detect_bill_sections()
    Returns:
        dict: {
            'success': bool,
            'chunks_created': int,
            'bill_id': str,
            'error': str (if failed)
        }
    """
    try:
        from apps.projects.models import Bill, BillChunk
        
        logger.info(f"Creating chunks for bill {bill_id}")
        
        # Get bill instance
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        # Clear existing chunks
        BillChunk.objects.filter(bill=bill).delete()
        
        chunks_created = 0
        max_chunk_size = 2000  # Characters
        
        for section in sections:
            section_content = section['content']
            section_title = section['title']
            
            # If section is small enough, create one chunk
            if len(section_content) <= max_chunk_size:
                BillChunk.objects.create(
                    bill=bill,
                    chunk_index=chunks_created,
                    section_title=section_title,
                    content=section_content,
                    start_position=section['start_pos'],
                    end_position=section['end_pos']
                )
                chunks_created += 1
            else:
                # Split large sections into multiple chunks
                words = section_content.split()
                current_chunk = ''
                chunk_start_pos = section['start_pos']
                part_num = 1
                
                for word in words:
                    if len(current_chunk + word) > max_chunk_size and current_chunk:
                        # Create chunk
                        chunk_end_pos = chunk_start_pos + len(current_chunk)
                        BillChunk.objects.create(
                            bill=bill,
                            chunk_index=chunks_created,
                            section_title=f"{section_title} (Part {part_num})",
                            content=current_chunk.strip(),
                            start_position=chunk_start_pos,
                            end_position=chunk_end_pos
                        )
                        chunks_created += 1
                        part_num += 1
                        chunk_start_pos = chunk_end_pos
                        current_chunk = word + ' '
                    else:
                        current_chunk += word + ' '
                
                # Create final chunk if remaining content
                if current_chunk.strip():
                    BillChunk.objects.create(
                        bill=bill,
                        chunk_index=chunks_created,
                        section_title=f"{section_title} (Part {part_num})",
                        content=current_chunk.strip(),
                        start_position=chunk_start_pos,
                        end_position=section['end_pos']
                    )
                    chunks_created += 1
        
        # Update bill
        bill.is_chunked = True
        bill.total_chunks = chunks_created
        bill.save(update_fields=['is_chunked', 'total_chunks'])
        
        logger.info(f"Created {chunks_created} chunks for bill {bill_id}")
        
        return {
            'success': True,
            'chunks_created': chunks_created,
            'bill_id': bill_id,
            'task_id': self.request.id
        }
        
    except Exception as e:
        error_msg = f"Failed to create chunks for bill {bill_id}: {str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'chunks_created': 0,
            'bill_id': bill_id,
            'error': error_msg,
            'task_id': self.request.id
        }


@app.task(queue='ai_analytics')
def cleanup_failed_bill_processing(bill_id: str) -> Dict:
    """
    Cleanup task for failed bill processing
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {'success': bool, 'cleaned_up': bool}
    """
    try:
        from apps.projects.models import Bill, BillChunk
        
        logger.info(f"Cleaning up failed processing for bill {bill_id}")
        
        # Get bill
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        # Reset processing fields
        bill.processing_status = 'pending'
        bill.processing_progress = 0
        bill.processing_message = ''
        bill.estimated_time_remaining = None
        bill.summary = ''
        bill.summary_html = ''
        bill.is_chunked = False
        bill.total_chunks = 0
        bill.save()
        
        # Delete any partial chunks
        BillChunk.objects.filter(bill=bill).delete()
        
        # Clean up temp files
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'bills', 'temp')
        if os.path.exists(temp_dir):
            for filename in os.listdir(temp_dir):
                if bill_id in filename:
                    file_path = os.path.join(temp_dir, filename)
                    try:
                        os.remove(file_path)
                        logger.info(f"Cleaned up temp file: {file_path}")
                    except Exception as e:
                        logger.warning(f"Failed to remove temp file {file_path}: {str(e)}")
        
        logger.info(f"Cleanup completed for bill {bill_id}")
        
        return {
            'success': True,
            'cleaned_up': True,
            'bill_id': bill_id
        }
        
    except Exception as e:
        error_msg = f"Cleanup failed for bill {bill_id}: {str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'cleaned_up': False,
            'bill_id': bill_id,
            'error': error_msg
        }

@app.task(bind=True, queue='ai_batch')
def generate_bill_embeddings_async(self, bill_id: str) -> Dict:
    """
    Generate embeddings for bill chunks (preparation for Phase 3 chat)
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {'success': bool, 'embeddings_generated': int}
    """
    try:
        logger.info(f"Generating embeddings for bill {bill_id}")
        
        # Use the production embedding service to generate embeddings
        result = generate_chunk_embeddings(bill_id, force_regenerate=False)
        
        if result['success']:
            logger.info(f"Generated {result['embeddings_generated']} embeddings for bill {bill_id}")
            
            return {
                'success': True,
                'embeddings_generated': result['embeddings_generated'],
                'bill_id': bill_id,
                'task_id': self.request.id,
                'skipped': result.get('skipped', 0),
                'total_chunks': result.get('total_chunks', 0),
                'processing_info': result.get('processing_info', {})
            }
        else:
            logger.error(f"Failed to generate embeddings for bill {bill_id}: {result.get('error', 'Unknown error')}")
            
            return {
                'success': False,
                'embeddings_generated': 0,
                'bill_id': bill_id,
                'error': result.get('error', 'Unknown embedding generation error'),
                'task_id': self.request.id
            }
        
    except Exception as e:
        error_msg = f"Failed to generate embeddings for bill {bill_id}: {str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'embeddings_generated': 0,
            'bill_id': bill_id,
            'error': error_msg,
            'task_id': self.request.id
        }


@app.task(queue='default')
def get_async_task_status(task_id: str) -> Dict:
    """
    Get status of any async task
    Args:
        task_id: Celery task ID
    Returns:
        dict: Task status information
    """
    try:
        result = app.AsyncResult(task_id)
        
        return {
            'task_id': task_id,
            'status': result.status,
            'result': result.result if result.ready() else None,
            'info': result.info,
            'successful': result.successful() if result.ready() else None,
            'failed': result.failed() if result.ready() else None,
            'traceback': result.traceback if result.failed() else None
        }
        
    except Exception as e:
        return {
            'task_id': task_id,
            'status': 'ERROR',
            'error': str(e)
        }
