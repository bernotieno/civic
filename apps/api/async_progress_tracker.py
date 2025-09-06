# apps/api/async_progress_tracker.py
import uuid
import logging
from typing import Dict, Optional, Tuple, List
from django.utils import timezone
from django.core.cache import cache
from celery import current_app as app

# Import Phase 1 progress functions (all working)
from .progress_tracker import (
    update_bill_progress as phase1_update_progress,
    get_bill_progress as phase1_get_progress,
    estimate_processing_time,
    mark_bill_processing_complete,
    reset_bill_progress
)

logger = logging.getLogger(__name__)

# Cache keys for async processing sessions
ASYNC_SESSION_KEY = "bill_async_session_{bill_id}"
TASK_STATUS_KEY = "bill_task_status_{task_id}"


def start_async_bill_processing(bill_id: str, task_id: str) -> Dict:
    """
    Initialize async processing session
    Args:
        bill_id: Bill UUID string
        task_id: Celery task ID
    Returns:
        dict: {'success': bool, 'session_id': str}
    """
    try:
        from apps.projects.models import Bill
        
        # Validate bill exists
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        bill = Bill.objects.get(id=bill_uuid, is_deleted=False)
        
        # Create session data
        session_id = f"session_{bill_id}_{int(timezone.now().timestamp())}"
        session_data = {
            'session_id': session_id,
            'bill_id': bill_id,
            'task_id': task_id,
            'started_at': timezone.now().isoformat(),
            'status': 'started',
            'progress': 0,
            'stage': 'initializing',
            'message': 'Async processing session started',
            'retries': 0,
            'max_retries': 100,
            'websocket_channel': f'bill_progress_{bill_id}'
        }
        
        # Store session in cache (expires in 2 hours)
        cache.set(
            ASYNC_SESSION_KEY.format(bill_id=bill_id),
            session_data,
            timeout=7200  # 2 hours
        )
        
        # Store task status mapping
        cache.set(
            TASK_STATUS_KEY.format(task_id=task_id),
            {
                'bill_id': bill_id,
                'session_id': session_id,
                'created_at': timezone.now().isoformat()
            },
            timeout=7200
        )
        
        # Update bill to processing status
        bill.processing_status = 'processing'
        bill.processing_progress = 0
        bill.processing_message = 'Async processing started'
        bill.estimated_time_remaining = estimate_processing_time(50)  # Default estimate
        bill.save(update_fields=[
            'processing_status', 'processing_progress', 
            'processing_message', 'estimated_time_remaining'
        ])
        
        logger.info(f"Started async processing session for bill {bill_id}, task {task_id}")
        
        return {
            'success': True,
            'session_id': session_id,
            'bill_id': bill_id,
            'task_id': task_id,
            'websocket_channel': session_data['websocket_channel']
        }
        
    except Exception as e:
        error_msg = f"Failed to start async processing session: {str(e)}"
        logger.error(error_msg)
        return {
            'success': False,
            'session_id': None,
            'error': error_msg
        }


def update_bill_progress_async(bill_id: str, stage: str, percentage: int, message: str, broadcast: bool = True) -> None:
    """
    Update progress with optional WebSocket broadcasting
    Args:
        bill_id: Bill UUID string
        stage: Processing stage name
        percentage: Progress 0-100
        message: User-friendly message
        broadcast: Whether to broadcast via WebSocket
    """
    try:
        # Use Phase 1 progress update function (maintains database consistency)
        time_remaining = None
        if percentage > 0 and percentage < 100:
            estimated_total = estimate_processing_time(50)
            time_remaining = int((100 - percentage) / 100 * estimated_total)
        
        phase1_update_progress(bill_id, stage, percentage, message, time_remaining)
        
        # Update async session data
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        if session_data:
            session_data.update({
                'stage': stage,
                'progress': percentage,
                'message': message,
                'time_remaining': time_remaining,
                'last_update': timezone.now().isoformat()
            })
            cache.set(session_key, session_data, timeout=7200)
        
        # Broadcast via WebSocket if enabled
        if broadcast:
            try:
                from .websocket_handlers import broadcast_bill_progress
                
                progress_data = {
                    'stage': stage,
                    'progress': percentage,
                    'message': message,
                    'time_remaining': time_remaining,
                    'bill_id': bill_id
                }
                
                broadcast_bill_progress(bill_id, progress_data)
                
            except ImportError:
                logger.warning("WebSocket handlers not available for broadcasting")
            except Exception as e:
                logger.warning(f"WebSocket broadcast failed for bill {bill_id}: {str(e)}")
        
        logger.debug(f"Updated async progress for bill {bill_id}: {stage} - {percentage}%")
        
    except Exception as e:
        logger.error(f"Failed to update async progress for bill {bill_id}: {str(e)}")


def get_bill_processing_status(bill_id: str) -> Dict:
    """
    Get comprehensive bill processing status
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {
            'processing_status': str,
            'progress': int,
            'message': str,
            'task_id': str,
            'estimated_completion': str,
            'can_retry': bool,
            'error_details': str,
            'session_info': dict
        }
    """
    try:
        from apps.projects.models import Bill
        
        # Get basic progress from Phase 1 function
        basic_progress = phase1_get_progress(bill_id)
        
        # Get async session data
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        # Get bill instance for additional info
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        bill = Bill.objects.get(id=bill_uuid, is_deleted=False)
        
        # Check if task is still active
        task_id = session_data.get('task_id')
        task_active = False
        task_info = {}
        
        if task_id:
            try:
                result = app.AsyncResult(task_id)
                task_active = not result.ready()
                task_info = {
                    'task_id': task_id,
                    'task_status': result.status,
                    'task_active': task_active,
                    'task_result': result.result if result.ready() else None,
                    'task_failed': result.failed() if result.ready() else False
                }
            except Exception as e:
                logger.warning(f"Could not get task status for {task_id}: {str(e)}")
        
        # Determine if retry is possible
        can_retry = (
            basic_progress['status'] in ['failed', 'pending'] and
            session_data.get('retries', 0) < session_data.get('max_retries', 100)
        )
        
        # Calculate estimated completion
        estimated_completion = None
        if basic_progress['time_remaining']:
            estimated_completion = (
                timezone.now() + 
                timezone.timedelta(seconds=basic_progress['time_remaining'])
            ).isoformat()
        
        return {
            'processing_status': basic_progress['status'],
            'progress': basic_progress['progress'],
            'message': basic_progress['message'],
            'stage': basic_progress['stage'],
            'stage_display': basic_progress['stage_display'],
            'time_remaining': basic_progress['time_remaining'],
            'task_id': task_id,
            'estimated_completion': estimated_completion,
            'can_retry': can_retry,
            'error_details': session_data.get('error_details', ''),
            'session_info': {
                'session_id': session_data.get('session_id'),
                'started_at': session_data.get('started_at'),
                'last_update': session_data.get('last_update'),
                'retries': session_data.get('retries', 0),
                'max_retries': session_data.get('max_retries', 100)
            },
            'task_info': task_info,
            'bill_info': {
                'title': bill.title,
                'has_document': bool(bill.document),
                'total_chunks': bill.total_chunks if hasattr(bill, 'total_chunks') else 0,
                'is_chunked': bill.is_chunked if hasattr(bill, 'is_chunked') else False
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get processing status for bill {bill_id}: {str(e)}")
        return {
            'processing_status': 'error',
            'progress': 0,
            'message': f'Error retrieving status: {str(e)}',
            'stage': 'error',
            'stage_display': 'Error',
            'time_remaining': None,
            'task_id': None,
            'estimated_completion': None,
            'can_retry': False,
            'error_details': str(e),
            'session_info': {},
            'task_info': {},
            'bill_info': {}
        }


def retry_failed_bill_processing(bill_id: str) -> Dict:
    """
    Retry failed bill processing
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {'success': bool, 'new_task_id': str, 'message': str}
    """
    try:
        from apps.projects.models import Bill
        from .tasks import process_bill_async
        
        logger.info(f"Retrying bill processing for {bill_id}")
        
        # Get bill instance
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        bill = Bill.objects.get(id=bill_uuid, is_deleted=False)
        
        if not bill.document:
            return {
                'success': False,
                'new_task_id': None,
                'message': 'Bill has no document to process'
            }
        
        # Get current session data
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        # Check retry limit
        current_retries = session_data.get('retries', 0)
        max_retries = session_data.get('max_retries', 100)
        
        if current_retries >= max_retries:
            return {
                'success': False,
                'new_task_id': None,
                'message': f'Maximum retries ({max_retries}) exceeded'
            }
        
        # Cancel any existing task
        old_task_id = session_data.get('task_id')
        if old_task_id:
            try:
                app.control.revoke(old_task_id, terminate=True)
                logger.info(f"Revoked old task {old_task_id} for bill {bill_id}")
            except Exception as e:
                logger.warning(f"Could not revoke old task {old_task_id}: {str(e)}")
        
        # Reset bill progress
        reset_bill_progress(bill_id)
        
        # Save file for new async processing
        from .tasks import save_uploaded_file_for_async
        file_path = save_uploaded_file_for_async(bill.document.file, bill_id)
        
        # Start new async task
        new_task = process_bill_async.delay(bill_id, file_path)
        
        # Update session data
        session_data.update({
            'task_id': new_task.id,
            'retries': current_retries + 1,
            'retried_at': timezone.now().isoformat(),
            'status': 'retrying',
            'progress': 0,
            'stage': 'initializing',
            'message': f'Retrying processing (attempt {current_retries + 2})'
        })
        
        cache.set(session_key, session_data, timeout=7200)
        
        # Update task status mapping
        cache.set(
            TASK_STATUS_KEY.format(task_id=new_task.id),
            {
                'bill_id': bill_id,
                'session_id': session_data.get('session_id'),
                'retry_attempt': current_retries + 1,
                'created_at': timezone.now().isoformat()
            },
            timeout=7200
        )
        
        logger.info(f"Started retry task {new_task.id} for bill {bill_id}")
        
        return {
            'success': True,
            'new_task_id': new_task.id,
            'message': f'Retry started (attempt {current_retries + 2} of {max_retries + 1})',
            'retry_attempt': current_retries + 1,
            'max_retries': max_retries
        }
        
    except Exception as e:
        error_msg = f"Failed to retry processing for bill {bill_id}: {str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'new_task_id': None,
            'message': error_msg,
            'error': str(e)
        }


def cancel_bill_processing(bill_id: str) -> Dict:
    """
    Cancel ongoing bill processing
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {'success': bool, 'message': str, 'was_cancelled': bool}
    """
    try:
        logger.info(f"Cancelling bill processing for {bill_id}")
        
        # Get session data
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        task_id = session_data.get('task_id')
        was_cancelled = False
        
        if task_id:
            try:
                # Revoke the task
                app.control.revoke(task_id, terminate=True)
                
                # Check if task was actually cancelled
                result = app.AsyncResult(task_id)
                was_cancelled = result.status in ['REVOKED', 'FAILURE']
                
                logger.info(f"Revoked task {task_id} for bill {bill_id}, status: {result.status}")
                
            except Exception as e:
                logger.warning(f"Could not revoke task {task_id}: {str(e)}")
        
        # Update session data
        session_data.update({
            'status': 'cancelled',
            'cancelled_at': timezone.now().isoformat(),
            'message': 'Processing cancelled by user'
        })
        cache.set(session_key, session_data, timeout=7200)
        
        # Update bill status
        from apps.projects.models import Bill
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        Bill.objects.filter(id=bill_uuid).update(
            processing_status='pending',
            processing_progress=0,
            processing_message='Processing cancelled',
            estimated_time_remaining=None
        )
        
        # Broadcast cancellation
        try:
            from .websocket_handlers import broadcast_bill_progress
            broadcast_bill_progress(bill_id, {
                'stage': 'cancelled',
                'progress': 0,
                'message': 'Processing cancelled',
                'cancelled': True
            })
        except Exception as e:
            logger.warning(f"Could not broadcast cancellation for bill {bill_id}: {str(e)}")
        
        return {
            'success': True,
            'message': 'Processing cancellation requested',
            'was_cancelled': was_cancelled,
            'task_id': task_id
        }
        
    except Exception as e:
        error_msg = f"Failed to cancel processing for bill {bill_id}: {str(e)}"
        logger.error(error_msg)
        
        return {
            'success': False,
            'message': error_msg,
            'was_cancelled': False,
            'error': str(e)
        }


def cleanup_async_session(bill_id: str) -> None:
    """
    Cleanup async processing session data
    Args:
        bill_id: Bill UUID string
    """
    try:
        # Remove session data from cache
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        # Remove task status mapping if exists
        task_id = session_data.get('task_id')
        if task_id:
            cache.delete(TASK_STATUS_KEY.format(task_id=task_id))
        
        cache.delete(session_key)
        
        logger.info(f"Cleaned up async session for bill {bill_id}")
        
    except Exception as e:
        logger.error(f"Failed to cleanup async session for bill {bill_id}: {str(e)}")


def update_bill_task_id(bill_id: str, task_id: str) -> None:
    """
    Update task ID in existing async session
    Args:
        bill_id: Bill UUID string
        task_id: New Celery task ID
    """
    try:
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        if session_data:
            old_task_id = session_data.get('task_id')
            session_data['task_id'] = task_id
            session_data['task_updated_at'] = timezone.now().isoformat()
            
            cache.set(session_key, session_data, timeout=7200)
            
            # Update task status mapping
            cache.set(
                TASK_STATUS_KEY.format(task_id=task_id),
                {
                    'bill_id': bill_id,
                    'session_id': session_data.get('session_id'),
                    'updated_from': old_task_id,
                    'created_at': timezone.now().isoformat()
                },
                timeout=7200
            )
            
            logger.debug(f"Updated task ID for bill {bill_id}: {old_task_id} -> {task_id}")
        
    except Exception as e:
        logger.error(f"Failed to update task ID for bill {bill_id}: {str(e)}")


def get_all_active_processing_sessions() -> List[Dict]:
    """
    Get all active async processing sessions
    Returns:
        list[dict]: List of active session data
    """
    try:
        # Note: This is a simplified implementation
        # A more robust solution would store session IDs in a set for easier retrieval
        
        active_sessions = []
        
        # Get bills currently being processed
        from apps.projects.models import Bill
        processing_bills = Bill.objects.filter(
            processing_status__in=['processing', 'pending'],
            is_deleted=False
        )
        
        for bill in processing_bills:
            session_key = ASYNC_SESSION_KEY.format(bill_id=str(bill.id))
            session_data = cache.get(session_key)
            
            if session_data:
                active_sessions.append({
                    'bill_id': str(bill.id),
                    'bill_title': bill.title,
                    **session_data
                })
        
        return active_sessions
        
    except Exception as e:
        logger.error(f"Failed to get active processing sessions: {str(e)}")
        return []


def complete_bill_processing_async(bill_id: str, success_metrics: dict) -> None:
    """
    Mark bill processing as completed and cleanup session
    
    Args:
        bill_id: Bill UUID string
        success_metrics: Metrics from successful processing
    """
    try:
        session_key = ASYNC_SESSION_KEY.format(bill_id=bill_id)
        session_data = cache.get(session_key, {})
        
        if session_data:
            session_data.update({
                'status': 'completed',
                'progress': 100,
                'stage': 'completed',
                'message': 'Processing completed successfully',
                'completed_at': timezone.now().isoformat(),
                'success_metrics': success_metrics
            })
            
            # Keep session data for 1 hour for status queries
            cache.set(session_key, session_data, timeout=3600)
            
            # Broadcast completion
            try:
                from .websocket_handlers import broadcast_bill_progress
                broadcast_bill_progress(bill_id, {
                    'stage': 'completed',
                    'progress': 100,
                    'message': 'Processing completed successfully',
                    'success_metrics': success_metrics,
                    'completed': True
                })
            except Exception as e:
                logger.warning(f"Could not broadcast completion for bill {bill_id}: {str(e)}")
        
        logger.info(f"Marked bill {bill_id} as completed with metrics: {success_metrics}")
        
    except Exception as e:
        logger.error(f"Failed to complete async processing for bill {bill_id}: {str(e)}")
# Export key functions
__all__ = [
    'start_async_bill_processing',
    'update_bill_progress_async', 
    'get_bill_processing_status',
    'retry_failed_bill_processing',
    'cancel_bill_processing',
    'cleanup_async_session',
    'update_bill_task_id',
    'complete_bill_processing_async',
    'get_all_active_processing_sessions'
]
