from django.http import JsonResponse
from django.db import connection
from django.core.cache import cache
from django.conf import settings
import time

def health_check(request):
    """
    Health check endpoint for monitoring service status
    """
    health_status = {
        'status': 'healthy',
        'timestamp': time.time(),
        'services': {}
    }
    
    # Check database connection
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        health_status['services']['database'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'unhealthy'
    
    # Check cache connection
    try:
        cache.set('health_check', 'ok', 30)
        cache_value = cache.get('health_check')
        if cache_value == 'ok':
            health_status['services']['cache'] = 'healthy'
        else:
            health_status['services']['cache'] = 'unhealthy: cache test failed'
            health_status['status'] = 'degraded'
    except Exception as e:
        health_status['services']['cache'] = f'unhealthy: {str(e)}'
        health_status['status'] = 'degraded'
    
    # Add environment info
    health_status['environment'] = getattr(settings, 'ENVIRONMENT', 'unknown')
    health_status['debug'] = settings.DEBUG
    
    status_code = 200 if health_status['status'] == 'healthy' else 503
    return JsonResponse(health_status, status=status_code)