# =============================================================================
# FILE: civicAI/celery.py
# =============================================================================
import os
from celery import Celery
from django.conf import settings
from decouple import config

# Set default Django settings module for 'celery' program
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings.development')

# Create Celery instance
app = Celery('civicAI')

# Configure Celery using Django settings with CELERY_ prefix
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load tasks from all registered Django apps
app.autodiscover_tasks()

# Celery Beat Schedule Configuration
app.conf.beat_schedule = {
    # Daily AI insights generation for all counties
    'generate-daily-ai-insights': {
        'task': 'apps.ai.tasks.generate_daily_ai_insights',
        'schedule': 60.0 * 60.0 * 24.0,  # Every 24 hours
        'options': {'expires': 60 * 60 * 23}  # Expire after 23 hours
    },
    
    # Process pending AI analysis (every 5 minutes)
    'process-pending-ai-analysis': {
        'task': 'apps.ai.tasks.process_pending_ai_analysis_batch',
        'schedule': 60.0 * 5.0,  # Every 5 minutes
        'options': {'expires': 60 * 4}  # Expire after 4 minutes
    },
    
    # Clean up old AI cache entries (every hour)
    'cleanup-ai-cache': {
        'task': 'apps.ai.tasks.cleanup_ai_cache',
        'schedule': 60.0 * 60.0,  # Every hour
        'options': {'expires': 60 * 55}  # Expire after 55 minutes
    },
    
    # Generate trend analysis (every 6 hours)
    'generate-trend-analysis': {
        'task': 'apps.ai.tasks.generate_trend_analysis',
        'schedule': 60.0 * 60.0 * 6.0,  # Every 6 hours
        'options': {'expires': 60 * 60 * 5}  # Expire after 5 hours
    },
}

# Enhanced Celery Configuration for AI Tasks
app.conf.update(
    # Task routing for AI tasks
    task_routes={
        'apps.ai.tasks.process_feedback_ai_complete': {'queue': 'ai_processing'},
        'apps.ai.tasks.generate_ai_response_suggestions': {'queue': 'ai_responses'},
        'apps.ai.tasks.analyze_sentiment_batch': {'queue': 'ai_analysis'},
        'apps.ai.tasks.calculate_urgency_scores_batch': {'queue': 'ai_analysis'},
        'apps.ai.tasks.generate_daily_ai_insights': {'queue': 'ai_insights'},
        'apps.ai.tasks.send_urgent_alert': {'queue': 'urgent_alerts'},
    },
    
    # Task priority and concurrency
    task_default_priority=5,
    task_inherit_parent_priority=True,
    
    # Enhanced error handling
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    
    # Result backend settings  
    result_expires=60 * 60 * 24,  # Results expire after 24 hours
    result_persistent=True,
    
    # Worker settings optimized for AI tasks
    worker_concurrency=config('CELERY_WORKER_CONCURRENCY', default=4, cast=int),
    worker_max_tasks_per_child=50,  # Restart workers periodically to prevent memory leaks
    worker_disable_rate_limits=False,
    
    # Task execution settings
    task_soft_time_limit=60 * 5,  # 5 minutes soft limit
    task_time_limit=60 * 10,      # 10 minutes hard limit
    task_compression='gzip',
    
    # Enhanced monitoring
    worker_send_task_events=True,
    task_send_sent_event=True,
)

# Custom task failure handler for AI tasks
@app.task(bind=True)
def debug_task(self):
    """Debug task for testing Celery configuration"""
    print(f'Request: {self.request!r}')
    return {'status': 'success', 'worker': self.request.hostname}

# AI Task Error Handler
def ai_task_failure_handler(task_id, error, traceback, einfo):
    """Handle AI task failures with enhanced logging and alerting"""
    import logging
    from django.core.cache import cache
    
    logger = logging.getLogger('apps.ai')
    
    # Log the error
    logger.error(f'AI Task {task_id} failed: {error}', extra={
        'task_id': task_id,
        'error': str(error),
        'traceback': traceback
    })
    
    # Track failure rate
    failure_key = f'ai_task_failures_{task_id.split(".")[2]}'  # Extract task name
    current_failures = cache.get(failure_key, 0)
    cache.set(failure_key, current_failures + 1, 3600)  # Track for 1 hour
    
    # Alert if failure rate is high
    if current_failures > 5:
        logger.critical(f'High failure rate for AI task: {task_id}')

# Register failure handler
app.conf.task_annotations = {
    '*': {'on_failure': ai_task_failure_handler}
}

# Health check task
@app.task
def health_check():
    """Simple health check task for monitoring"""
    from django.core.cache import cache
    from django.utils import timezone
    
    # Test cache connectivity
    test_key = 'celery_health_check'
    test_value = timezone.now().isoformat()
    cache.set(test_key, test_value, 60)
    cached_value = cache.get(test_key)
    
    return {
        'status': 'healthy' if cached_value == test_value else 'unhealthy',
        'timestamp': timezone.now().isoformat(),
        'cache_test': cached_value == test_value,
        'worker': app.current_worker_task.request.hostname if hasattr(app, 'current_worker_task') else 'unknown'
    }
    