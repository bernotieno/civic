"""
Render.com Production Settings for CivicAI
"""
from .base import *
import dj_database_url

# =============================================================================
# RENDER PRODUCTION SETTINGS
# =============================================================================

DEBUG = False
ENVIRONMENT = 'production'

# Security
ALLOWED_HOSTS = [
    'civicai-backend.onrender.com',
    'civicai-frontend.onrender.com',
    '.onrender.com',  # Allow all Render subdomains
]

# CORS for frontend
CORS_ALLOWED_ORIGINS = [
    "https://civicai-frontend.onrender.com",
]
CORS_ALLOW_ALL_ORIGINS = False  # Strict in production

# Database with connection pooling
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600,
        conn_health_checks=True,
        ssl_require=True,
    )
}

# Redis configuration for Render
REDIS_URL = config('REDIS_URL')
CACHES['default']['LOCATION'] = REDIS_URL
CACHES['ai_cache']['LOCATION'] = REDIS_URL
CACHES['async_sessions']['LOCATION'] = REDIS_URL

# Celery with Redis
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default=REDIS_URL)
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default=REDIS_URL)

# Channel layers for WebSocket
CHANNEL_LAYERS['default']['CONFIG']['hosts'] = [REDIS_URL]

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_SECONDS = 31536000
SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = True
SESSION_COOKIE_HTTPONLY = True

# Static files with WhiteNoise
MIDDLEWARE.insert(1, 'whitenoise.middleware.WhiteNoiseMiddleware')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Logging for production
LOGGING['handlers']['console']['level'] = 'INFO'
LOGGING['root']['level'] = 'INFO'

# Production optimizations
CIVICAI_SETTINGS.update({
    'CONCURRENT_BILL_PROCESSING': 8,
    'MAX_FILE_SIZE': 100 * 1024 * 1024,  # 100MB
    'ASYNC_TASK_TIMEOUT': 7200,  # 2 hours
})

# Free tier optimizations
if config('CIVICAI_FREE_TIER', default=False, cast=bool):
    CIVICAI_SETTINGS.update({
        'CONCURRENT_BILL_PROCESSING': 1,
        'MAX_FILE_SIZE': 10 * 1024 * 1024,  # 10MB
        'ASYNC_TASK_TIMEOUT': 1800,  # 30 minutes
        'WEBSOCKET_ENABLED': False,
        'MAX_CONCURRENT_PROCESSING': 1,
    })
    
    # Reduce Celery concurrency
    CELERY_WORKER_CONCURRENCY = 2
    
    # Disable some features to save resources
    CIVICAI_FEATURES.update({
        'WEBSOCKET_ENABLED': False,
        'REAL_TIME_PROGRESS': False,
    })

# Email backend
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587
EMAIL_USE_TLS = True
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# Disable debug toolbar and silk in production
if 'debug_toolbar' in INSTALLED_APPS:
    INSTALLED_APPS.remove('debug_toolbar')
if 'silk' in INSTALLED_APPS:
    INSTALLED_APPS.remove('silk')

# Remove debug middleware
MIDDLEWARE = [m for m in MIDDLEWARE if 'debug_toolbar' not in m and 'silk' not in m]