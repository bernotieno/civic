# =============================================================================
# FILE: civicAI/celery.py (Refactored for Performance, Scalability, and Clarity)
# =============================================================================
import os
from celery import Celery
from django.conf import settings
from decouple import config
import logging
from django.core.cache import cache

logger = logging.getLogger('apps.ai')

# -----------------------------------------------------------------------------
# Set default Django settings module for the 'celery' command-line program
# -----------------------------------------------------------------------------
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings.development')

# -----------------------------------------------------------------------------
# Create the Celery app
# -----------------------------------------------------------------------------
app = Celery('civicAI')

# -----------------------------------------------------------------------------
# Load Celery config from Django settings using 'CELERY_' namespace
# -----------------------------------------------------------------------------
app.config_from_object('django.conf:settings', namespace='CELERY')

# -----------------------------------------------------------------------------
# Automatically discover tasks in all registered Django apps
# -----------------------------------------------------------------------------
app.autodiscover_tasks()

# -----------------------------------------------------------------------------
# Optionally load task routes from Django settings
# -----------------------------------------------------------------------------
app.conf.task_routes = getattr(settings, 'CELERY_TASK_ROUTES', {
    'apps.ai.tasks.process_feedback_ai_complete': {'queue': 'ai_processing'},
    'apps.ai.tasks.generate_ai_response_suggestions': {'queue': 'ai_responses'},
    'apps.ai.tasks.analyze_sentiment_batch': {'queue': 'ai_analysis'},
    'apps.ai.tasks.calculate_urgency_scores_batch': {'queue': 'ai_analysis'},
    'apps.ai.tasks.generate_daily_ai_insights': {'queue': 'ai_insights'},
    'apps.ai.tasks.send_urgent_alert': {'queue': 'urgent_alerts'},
})

# -----------------------------------------------------------------------------
# Celery Beat Schedule (Periodic Tasks)
# -----------------------------------------------------------------------------
app.conf.beat_schedule = {
    'generate-daily-ai-insights': {
        'task': 'apps.ai.tasks.generate_daily_ai_insights',
        'schedule': 60 * 60 * 24,  # every 24 hours
        'options': {'expires': 60 * 60 * 23}
    },
    'process-pending-ai-analysis': {
        'task': 'apps.ai.tasks.process_pending_ai_analysis_batch',
        'schedule': 60 * 5,  # every 5 minutes
        'options': {'expires': 60 * 4}
    },
    'cleanup-ai-cache': {
        'task': 'apps.ai.tasks.cleanup_ai_cache',
        'schedule': 60 * 60,  # every hour
        'options': {'expires': 60 * 55}
    },
    'generate-trend-analysis': {
        'task': 'apps.ai.tasks.generate_trend_analysis',
        'schedule': 60 * 60 * 6,  # every 6 hours
        'options': {'expires': 60 * 60 * 5}
    },
}

# -----------------------------------------------------------------------------
# General Celery Configuration
# -----------------------------------------------------------------------------
app.conf.update(
    task_default_priority=5,
    task_inherit_parent_priority=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
    result_expires=60 * 60 * 24,
    result_persistent=True,
    worker_concurrency=config('CELERY_WORKER_CONCURRENCY', default=4, cast=int),
    worker_max_tasks_per_child=50,
    worker_disable_rate_limits=False,
    task_soft_time_limit=60 * 5,  # 5 minutes
    task_time_limit=60 * 10,      # 10 minutes
    task_compression='gzip',
    worker_send_task_events=True,
    task_send_sent_event=True,
)

# -----------------------------------------------------------------------------
# Debug Task (Test Connectivity and Worker Identity)
# -----------------------------------------------------------------------------
@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
    return {'status': 'success', 'worker': self.request.hostname}

# -----------------------------------------------------------------------------
# Health Check Task (Cache validation and worker visibility)
# -----------------------------------------------------------------------------
@app.task
def health_check():
    from django.core.cache import cache
    from django.utils import timezone

    test_key = 'celery_health_check'
    now = timezone.now().isoformat()
    cache.set(test_key, now, timeout=60)

    return {
        'status': 'healthy' if cache.get(test_key) == now else 'unhealthy',
        'timestamp': now,
        'cache_test': cache.get(test_key) == now,
        'worker': app.current_worker_task.request.hostname if hasattr(app, 'current_worker_task') else 'unknown',
    }

# -----------------------------------------------------------------------------
# Task Failure Handler (for all tasks)
# -----------------------------------------------------------------------------
def ai_task_failure_handler(request, exc, task_id, args, kwargs, einfo):
    """
    Handle AI task failures with enhanced logging and cache-based retry tracking.
    Compatible with Celery global task_annotations['*']['on_failure'].
    """

    task_name = request.task  # e.g. 'apps.api.tasks.process_bill_async'

    logger.error(f'AI Task {task_id} ({task_name}) failed', extra={
        'task_id': task_id,
        'task_name': task_name,
        'exception': str(exc),
        'args': args,
        'kwargs': kwargs,
        'traceback': str(einfo)
    })

    # Track failure rate
    failure_key = f'ai_task_failures_{task_name}'
    failure_count = cache.get(failure_key, 0)
    cache.set(failure_key, failure_count + 1, timeout=3600)

    # Critical alerting if needed
    if failure_count > 5:
        logger.critical(f'🚨 High failure rate detected for {task_name} (ID: {task_id})')


# Register handler globally
app.conf.task_annotations = {
    '*': {'on_failure': ai_task_failure_handler}
}
