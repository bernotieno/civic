# apps/api/progress_tracker.py
from typing import Optional, Dict, Callable, List
from typing import Optional, Dict
import uuid
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

# Processing stages mapping
PROCESSING_STAGES = {
    'extracting': 'Extracting text from PDF...',
    'analyzing': 'Analyzing document structure...',
    'sectioning': 'Breaking into sections...',
    'processing': 'Processing with AI...',
    'formatting': 'Formatting summary...',
    'completing': 'Finalizing...',
    'completed': 'Processing complete',
    'failed': 'Processing failed'
}


def update_bill_progress(bill_id: str, stage: str, percentage: int, message: str, time_remaining: Optional[int] = None) -> None:
    """
    Update bill processing progress in database
    Args:
        bill_id: Bill UUID string
        stage: Current processing stage name
        percentage: Progress percentage (0-100)
        message: User-friendly progress message
        time_remaining: Optional estimated seconds remaining
    """
    try:
        from apps.projects.models import Bill
        
        # Validate inputs
        percentage = max(0, min(100, percentage))  # Clamp to 0-100
        
        # Determine processing status based on stage and percentage
        if stage == 'failed' or percentage == 0 and 'failed' in message.lower():
            processing_status = 'failed'
        elif stage == 'completed' or percentage == 100:
            processing_status = 'completed'
        elif percentage > 0:
            processing_status = 'processing'
        else:
            processing_status = 'pending'
        
        # Update bill progress
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        
        Bill.objects.filter(id=bill_uuid).update(
            processing_status=processing_status,
            processing_progress=percentage,
            processing_message=message[:200],  # Ensure within field limit
            estimated_time_remaining=time_remaining,
            updated_at=timezone.now()
        )
        
        logger.info(f"Updated progress for bill {bill_id}: {stage} - {percentage}% - {message}")
        
    except Exception as e:
        logger.error(f"Failed to update progress for bill {bill_id}: {str(e)}")


def get_bill_progress(bill_id: str) -> Dict:
    """
    Get current bill processing progress
    Args:
        bill_id: Bill UUID string
    Returns:
        dict: {
            'status': str,
            'progress': int,
            'message': str,
            'time_remaining': int,
            'stage': str
        }
    """
    try:
        from apps.projects.models import Bill
        
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        bill = Bill.objects.get(id=bill_uuid)
        
        # Determine current stage from status and progress
        current_stage = 'pending'
        if bill.processing_status == 'failed':
            current_stage = 'failed'
        elif bill.processing_status == 'completed':
            current_stage = 'completed'
        elif bill.processing_status == 'processing':
            # Determine stage from progress percentage
            if bill.processing_progress < 20:
                current_stage = 'extracting'
            elif bill.processing_progress < 55:
                current_stage = 'analyzing'
            elif bill.processing_progress < 60:
                current_stage = 'sectioning'
            elif bill.processing_progress < 85:
                current_stage = 'processing'
            elif bill.processing_progress < 95:
                current_stage = 'formatting'
            else:
                current_stage = 'completing'
        
        return {
            'status': bill.processing_status,
            'progress': bill.processing_progress,
            'message': bill.processing_message or PROCESSING_STAGES.get(current_stage, 'Processing...'),
            'time_remaining': bill.estimated_time_remaining,
            'stage': current_stage,
            'stage_display': PROCESSING_STAGES.get(current_stage, 'Processing...')
        }
        
    except Exception as e:
        logger.error(f"Failed to get progress for bill {bill_id}: {str(e)}")
        return {
            'status': 'failed',
            'progress': 0,
            'message': f'Error retrieving progress: {str(e)}',
            'time_remaining': None,
            'stage': 'failed',
            'stage_display': 'Failed to retrieve progress'
        }


def estimate_processing_time(page_count: int) -> int:
    """
    Estimate processing time based on document size
    Args:
        page_count: Number of pages in document
    Returns:
        int: Estimated processing time in seconds
    """
    # Base processing time: 10 seconds per page for AI processing
    # Additional overhead: 30 seconds for extraction and formatting
    base_time_per_page = 10
    overhead_time = 30
    
    # Adjust based on page count ranges
    if page_count <= 5:
        time_per_page = 8  # Faster for small documents
    elif page_count <= 20:
        time_per_page = 10  # Standard time
    elif page_count <= 50:
        time_per_page = 12  # Slightly slower for medium docs
    else:
        time_per_page = 15  # Slower for large documents
    
    estimated_time = (page_count * time_per_page) + overhead_time
    
    # Cap maximum estimate at 30 minutes
    return min(estimated_time, 1800)


def create_progress_callback(bill_id: str) -> Callable:
    """
    Create a progress callback function for a specific bill
    Args:
        bill_id: Bill UUID string
    Returns:
        Callable: Progress callback function
    """
    def callback(stage: str, percentage: int, message: str):
        # Estimate time remaining based on current progress
        if percentage > 0 and percentage < 100:
            # Simple linear estimation (can be improved in Phase 2)
            estimated_total_time = estimate_processing_time(50)  # Default estimate
            time_remaining = int((100 - percentage) / 100 * estimated_total_time)
        else:
            time_remaining = None
        
        update_bill_progress(bill_id, stage, percentage, message, time_remaining)
    
    return callback


def reset_bill_progress(bill_id: str) -> None:
    """
    Reset bill processing progress to initial state
    Args:
        bill_id: Bill UUID string
    """
    try:
        from apps.projects.models import Bill
        
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        
        Bill.objects.filter(id=bill_uuid).update(
            processing_status='pending',
            processing_progress=0,
            processing_message='',
            estimated_time_remaining=None,
            updated_at=timezone.now()
        )
        
        logger.info(f"Reset progress for bill {bill_id}")
        
    except Exception as e:
        logger.error(f"Failed to reset progress for bill {bill_id}: {str(e)}")


def mark_bill_processing_complete(bill_id: str, success: bool = True, error_message: Optional[str] = None) -> None:
    """
    Mark bill processing as complete or failed
    Args:
        bill_id: Bill UUID string
        success: Whether processing succeeded
        error_message: Optional error message if failed
    """
    try:
        from apps.projects.models import Bill
        
        bill_uuid = uuid.UUID(bill_id) if isinstance(bill_id, str) else bill_id
        
        if success:
            Bill.objects.filter(id=bill_uuid).update(
                processing_status='completed',
                processing_progress=100,
                processing_message='Processing complete',
                estimated_time_remaining=0,
                updated_at=timezone.now()
            )
        else:
            Bill.objects.filter(id=bill_uuid).update(
                processing_status='failed',
                processing_progress=0,
                processing_message=error_message or 'Processing failed',
                estimated_time_remaining=None,
                updated_at=timezone.now()
            )
        
        logger.info(f"Marked bill {bill_id} as {'completed' if success else 'failed'}")
        
    except Exception as e:
        logger.error(f"Failed to mark bill {bill_id} complete: {str(e)}")


def get_all_processing_bills() -> List[Dict]:
    """
    Get all bills currently being processed
    Returns:
        list[dict]: List of bills with processing status
    """
    try:
        from apps.projects.models import Bill
        
        processing_bills = Bill.objects.filter(
            processing_status__in=['processing', 'pending'],
            is_deleted=False
        ).values(
            'id', 'title', 'processing_status', 'processing_progress', 
            'processing_message', 'estimated_time_remaining', 'created_at'
        )
        
        return list(processing_bills)
        
    except Exception as e:
        logger.error(f"Failed to get processing bills: {str(e)}")
        return []