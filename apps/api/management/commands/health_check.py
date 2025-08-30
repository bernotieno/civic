# management/commands/health_check.py
from django.core.management.base import BaseCommand
from django.db import connection
from django.core.cache import cache
from celery import current_app
from channels.layers import get_channel_layer
import redis
import sys

class Command(BaseCommand):
    help = 'Perform health checks for CivicAI Phase 2 components'
    
    def add_arguments(self, parser):
        parser.add_argument('--component', choices=['all', 'db', 'redis', 'celery', 'websocket'])
    
    def handle(self, *args, **options):
        component = options.get('component', 'all')
        
        if component in ['all', 'db']:
            self.check_database()
        
        if component in ['all', 'redis']:
            self.check_redis()
        
        if component in ['all', 'celery']:
            self.check_celery()
        
        if component in ['all', 'websocket']:
            self.check_websocket()
    
    def check_database(self):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write("✅ Database: Healthy")
        except Exception as e:
            self.stdout.write(f"❌ Database: {e}")
            sys.exit(1)
    
    def check_redis(self):
        try:
            cache.set('health_check', 'ok', 60)
            result = cache.get('health_check')
            if result == 'ok':
                self.stdout.write("✅ Redis Cache: Healthy")
            else:
                raise Exception("Cache test failed")
        except Exception as e:
            self.stdout.write(f"❌ Redis Cache: {e}")
            sys.exit(1)
    
    def check_celery(self):
        try:
            inspect = current_app.control.inspect()
            stats = inspect.stats()
            if stats:
                active_workers = len(stats)
                self.stdout.write(f"✅ Celery: {active_workers} workers active")
            else:
                raise Exception("No active workers")
        except Exception as e:
            self.stdout.write(f"❌ Celery: {e}")
            sys.exit(1)
    
    def check_websocket(self):
        try:
            channel_layer = get_channel_layer()
            if channel_layer:
                self.stdout.write("✅ WebSocket Channels: Configured")
            else:
                raise Exception("No channel layer configured")
        except Exception as e:
            self.stdout.write(f"❌ WebSocket Channels: {e}")
            sys.exit(1)