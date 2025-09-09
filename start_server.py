#!/usr/bin/env python
"""
CivicAI Free Tier Server Starter
Combines Django + Celery worker in single process for free tier
"""
import os
import sys
import threading
import time
from multiprocessing import Process

def start_django():
    """Start Django server"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'civicAI.settings.render')
    
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    
    # Start Django with gunicorn
    port = os.environ.get('PORT', '8000')
    os.system(f'gunicorn civicAI.wsgi:application --bind 0.0.0.0:{port} --workers 2 --timeout 120')

def start_celery_worker():
    """Start Celery worker in background"""
    time.sleep(10)  # Wait for Django to start
    # Use prefork pool with reduced concurrency for free tier
    concurrency = os.environ.get('CELERY_WORKER_CONCURRENCY', '2')
    os.system(f'celery -A civicAI worker -l INFO --pool=prefork --concurrency={concurrency} --prefetch-multiplier=2')

def start_celery_beat():
    """Start Celery beat scheduler"""
    time.sleep(15)  # Wait for Django and worker to start
    os.system('celery -A civicAI beat -l INFO --scheduler django_celery_beat.schedulers:DatabaseScheduler')

if __name__ == '__main__':
    print("🚀 Starting CivicAI Free Tier Server...")
    
    # Start Celery worker in background thread
    worker_thread = threading.Thread(target=start_celery_worker, daemon=True)
    worker_thread.start()
    
    # Start Celery beat in background thread
    beat_thread = threading.Thread(target=start_celery_beat, daemon=True)
    beat_thread.start()
    
    # Start Django server (main process)
    start_django()