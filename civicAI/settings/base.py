# =============================================================================
# FILE: civicAI/settings/base.py - PHASE 3 INTEGRATION
# =============================================================================
import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url
from celery.schedules import crontab

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',  # 🚀 SWAGGER/OpenAPI Documentation
    'channels',  # 🚀 PHASE 2: For WebSocket support
    'django_extensions',  # 🚀 PHASE 2: For monitoring and debugging
]

LOCAL_APPS = [
    'apps.users',  # CivicAI user management
    'apps.core',   # CivicAI core - Invisible Boundaries system
    'apps.api',    # CivicAI API
    'apps.feedback',
    'apps.ai',     # 🚀 NEW: CivicAI AI Features
    'apps.projects',  # Projects and bills management
    # Add more apps here as you build them:
    # 'apps.analytics',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.locale.LocaleMiddleware',  # Language switching support
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'apps.core.middleware.InvisibleBoundaryMiddleware',  # ADD THIS LINE
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    # 'apps.api.middleware.BillProcessingMiddleware',  # 🚀 PHASE 2: Custom middleware
]

# 🚀 SWAGGER/OpenAPI Configuration
SPECTACULAR_SETTINGS = {
    'TITLE': 'CivicAI API',
    'DESCRIPTION': '''
# 🇰🇪 CivicAI - Civic Feedback System API

## Overview
CivicAI is Kenya's premier civic engagement platform that enables citizens to provide feedback to their county governments through a secure, tenant-based system.

## Key Features
- **🏛️ County-Based Tenancy**: Each county operates independently with isolated data
- **🆔 National ID Authentication**: Secure login using Kenyan National IDs
- **👤 Anonymous Submissions**: Citizens can provide feedback without revealing identity  
- **📍 Location Hierarchy**: County → Sub-County → Ward → Village structure
- **🔐 Role-Based Access**: Citizens, Government Officials with different permission levels
- **⚡ JWT Authentication**: Modern token-based authentication system

## Authentication
This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Getting Started
1. **Register** or **Login** to get your JWT tokens
2. **Create Anonymous Session** for anonymous feedback (no registration required)
3. **Explore Counties** and their administrative hierarchy
4. Use the **Profile** endpoint to get your user context and permissions

## API Conventions
- All successful responses include `"success": true`
- Error responses include `"success": false` with error details
- Pagination is available on list endpoints (20 items per page)
- Location hierarchy follows Kenya's administrative structure

## Rate Limits
- Anonymous sessions: 3 submissions per session (2-hour lifetime)
- Authenticated users: No submission limits
- Session cleanup: Automatic after expiry

---
*Built with ❤️ for Kenya's civic engagement*
    ''',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'defaultModelRendering': 'model',
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
        'displayRequestDuration': True,
        'docExpansion': 'list',
        'filter': True,
        'showExtensions': True,
        'showCommonExtensions': True,
        'tryItOutEnabled': True,
        'requestSnippetsEnabled': True,
        'supportedSubmitMethods': ['get', 'put', 'post', 'delete', 'patch'],
        'validatorUrl': None,  # Disable online validator
        'urls.primaryName': 'CivicAI API v1',
    },
    'SWAGGER_UI_FAVICON_HREF': '/static/favicon.ico',
    'REDOC_UI_SETTINGS': {
        'nativeScrollbars': True,
        'theme': {
            'colors': {
                'primary': {
                    'main': '#2E7D32'  # Kenya flag green
                }
            }
        }
    },
    'SCHEMA_PATH_PREFIX': r'/api/',
    'SCHEMA_PATH_PREFIX_TRIM': False,
    'TAGS': [
        {'name': 'Authentication', 'description': 'User registration, login, and session management'},
        {'name': 'Locations', 'description': 'Kenya administrative hierarchy (Counties, Sub-counties, Wards, Villages)'},
        {'name': 'Feedback', 'description': 'Citizen feedback submission and tracking system'},
        {'name': 'System', 'description': 'Health checks and system information'},
    ],  
    'EXTERNAL_DOCS': {
        'description': 'CivicAI Documentation',
        'url': 'https://your-docs-url.com',
    },
    'SERVERS': [
        {
            'url': 'http://localhost:8000',
            'description': 'Development server'
        },
        {
            'url': 'https://api.civicai.ke',
            'description': 'Production server'
        }
    ],
}

# Django REST Framework Configuration (ENHANCED FOR PHASE 3)
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',  # For development
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
        'rest_framework.parsers.FormParser',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'EXCEPTION_HANDLER': 'apps.api.exceptions.custom_exception_handler',
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',  # 🚀 Enable OpenAPI schema
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
        'auth': '5/min',  # For auth endpoints
        'feedback': '20/hour',  # For feedback endpoints
        'bill_upload': '10/hour',      # 🚀 PHASE 2: Limited bill uploads
        'bill_processing': '5/hour',   # 🚀 PHASE 2: Limited processing requests
        'progress_check': '120/hour',  # 🚀 PHASE 2: Progress checks
        # 🚀 PHASE 3: Citizen API rate limits
        'citizen_api': '100/hour',        # General citizen API access
        'citizen_chat': '20/hour',        # Chat requests (anonymous)
        'citizen_chat_auth': '50/hour',   # Chat requests (authenticated)
    }
}

# JWT Configuration (ENHANCED)
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
    'VERIFYING_KEY': None,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
    'TOKEN_TYPE_CLAIM': 'token_type',
    'TOKEN_USER_CLASS': 'rest_framework_simplejwt.models.TokenUser',
    'JTI_CLAIM': 'jti',
    'TOKEN_OBTAIN_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenObtainPairSerializer',
    'TOKEN_REFRESH_SERIALIZER': 'rest_framework_simplejwt.serializers.TokenRefreshSerializer',
}

# CORS Settings (ENHANCED for Development & Production + PHASE 2 WebSocket)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",    # React dev server
    "http://127.0.0.1:3000",
    "http://localhost:5173",    # Vite dev server (default)
    "http://127.0.0.1:5173",
    "http://localhost:8080",    # Vue dev server
    "http://127.0.0.1:8080",
    "http://localhost:4200",    # Angular dev server
    "http://127.0.0.1:4200",
    "http://localhost:8000",    # Django dev server (for Swagger UI)
    "http://127.0.0.1:8000",    # Django dev server (for Swagger UI)
    "https://civicai.ke",       # Production frontend
    "https://www.civicai.ke",
]

# Allow all origins in development (for Swagger UI)
CORS_ALLOW_ALL_ORIGINS = True  # ONLY for development/hackathon

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding', 
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
    'x-session-id',  # For anonymous sessions
]

# 🚀 PHASE 2: WebSocket CORS support
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.yourdomain\.com$",  # Allow subdomains
]

# Additional CORS settings for Swagger UI
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET', 
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# Disable CSRF for API endpoints
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]

# Database (ENHANCED FOR PHASE 2 - Connection Pooling)
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=3600,  # Keep connections alive for 1 hour
        conn_health_checks=True,
    )
}

ROOT_URLCONF = 'civicAI.urls'

# CRITICAL: Custom User Model Configuration
AUTH_USER_MODEL = 'users.CustomUser'

# Custom authentication backend for national ID login
AUTHENTICATION_BACKENDS = [
    'apps.users.backends.NationalIDBackend',  # Our custom backend
    'django.contrib.auth.backends.ModelBackend',  # Django default (fallback)
]

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'civicAI.wsgi.application'

# 🚀 PHASE 2: ASGI APPLICATION (WebSocket Support)
ASGI_APPLICATION = 'civicAI.asgi.application'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Cache TTL settings (in seconds)
AI_CACHE_TTL = 60 * 60 * 24  # 24 hours

# 🚀 PHASE 3: ENHANCED CACHE CONFIGURATION
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'TIMEOUT': 3600,  # 1 hour default timeout (updated for Phase 3)
        'KEY_PREFIX': 'civicai',
    },
    'ai_cache': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/2'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'TIMEOUT': AI_CACHE_TTL,
        'KEY_PREFIX': 'civicai_ai',
        'VERSION': 1,
    },
    # 🚀 PHASE 2: Separate cache for async sessions
    'async_sessions': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/3'),
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'SERIALIZER': 'django_redis.serializers.json.JSONSerializer',
        },
        'TIMEOUT': 7200,  # 2 hours for async sessions
        'KEY_PREFIX': 'civicai_async',
    }
}

# 🚀 PHASE 2: CHANNEL LAYERS (WebSocket Configuration)
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [config('REDIS_URL', default='redis://127.0.0.1:6379/0')],
            'capacity': 1500,      # Maximum number of messages per channel
            'expiry': 60,          # Message expiry time
            'group_expiry': 86400, # Group expiry time (24 hours)
            'symmetric_encryption_keys': [SECRET_KEY],  # For message encryption
        },
    },
}

# Use async_sessions cache for bill processing
CIVICAI_CACHE_ALIAS = 'async_sessions'

# Session configuration for anonymous users
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 2 * 60 * 60  # 2 hours for anonymous sessions

# Internationalization
LANGUAGE_CODE = 'en'
TIME_ZONE = config('TIME_ZONE', default='Africa/Nairobi')
USE_I18N = True
USE_L10N = True
USE_TZ = True

# Supported languages
LANGUAGES = [
    ('en', 'English'),
    ('sw', 'Kiswahili'),
]

# Locale paths
LOCALE_PATHS = [
    BASE_DIR / 'locale',
]

# Static files (CSS, JavaScript, Images)
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Email configuration
EMAIL_BACKEND = config('EMAIL_BACKEND', default='django.core.mail.backends.console.EmailBackend')
EMAIL_HOST = config('EMAIL_HOST', default='')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')

# 🚀 PHASE 2: FILE UPLOAD SECURITY
FILE_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB
DATA_UPLOAD_MAX_MEMORY_SIZE = 50 * 1024 * 1024  # 50MB

# 🚀 PHASE 2: CHANNEL SECURITY
CHANNELS_WS_PROTOCOLS = ["websocket"]
CHANNELS_HTTP_TIMEOUT = 86400  # 24 hours

# =============================================================================
# 🚀 CELERY CONFIGURATION FOR AI PROCESSING (ENHANCED PHASE 2)
# =============================================================================

# Celery settings
CELERY_BROKER_URL = config('CELERY_BROKER_URL', default='redis://127.0.0.1:6379/0')
CELERY_RESULT_BACKEND = config('CELERY_RESULT_BACKEND', default='redis://127.0.0.1:6379/0')

# Celery task configuration
CELERY_TASK_SERIALIZER = config('CELERY_TASK_SERIALIZER', default='json')
CELERY_RESULT_SERIALIZER = config('CELERY_RESULT_SERIALIZER', default='json')
CELERY_ACCEPT_CONTENT = [config('CELERY_ACCEPT_CONTENT', default='application/json')]
CELERY_TIMEZONE = config('CELERY_TIMEZONE', default='Africa/Nairobi')
CELERY_ENABLE_UTC = config('CELERY_ENABLE_UTC', default=True, cast=bool)

# Celery worker configuration
CELERY_WORKER_CONCURRENCY = config('CELERY_WORKER_CONCURRENCY', default=4, cast=int)
CELERY_WORKER_PREFETCH_MULTIPLIER = config('CELERY_WORKER_PREFETCH_MULTIPLIER', default=1, cast=int)
CELERY_TASK_ACKS_LATE = config('CELERY_TASK_ACKS_LATE', default=True, cast=bool)
CELERY_WORKER_DISABLE_RATE_LIMITS = config('CELERY_WORKER_DISABLE_RATE_LIMITS', default=False, cast=bool)

# Celery result backend configuration for database storage
CELERY_RESULT_BACKEND_DB_SHORT_LIVED_SESSIONS = True
CELERY_RESULT_EXTENDED = True

# 🚀 PHASE 2: MONITORING
CELERY_SEND_TASK_EVENTS = True
CELERY_TASK_SEND_SENT_EVENT = True

# 🚀 PHASE 2: ENHANCED CELERY TASK ROUTING (Bill Processing + AI Tasks)
CELERY_TASK_ROUTES = {
    # High priority AI processing (real-time feedback analysis)
    'apps.ai.tasks.process_feedback_ai_complete': {'queue': 'ai_realtime'},
    'apps.ai.tasks.analyze_sentiment': {'queue': 'ai_realtime'},
    'apps.ai.tasks.calculate_urgency_score': {'queue': 'ai_realtime'},
    
    # Medium priority AI tasks (response generation)
    'apps.ai.tasks.generate_ai_response_suggestions': {'queue': 'ai_responses'},
    'apps.ai.tasks.generate_county_insights': {'queue': 'ai_insights'},
    
    # Low priority AI tasks (batch processing, analytics)
    'apps.ai.tasks.analyze_sentiment_batch': {'queue': 'ai_batch'},
    'apps.ai.tasks.calculate_urgency_scores_batch': {'queue': 'ai_batch'},
    'apps.ai.tasks.generate_trend_analysis': {'queue': 'ai_analytics'},
    'apps.ai.tasks.generate_daily_ai_insights': {'queue': 'ai_analytics'},
    
    # Critical alerts (highest priority)
    'apps.ai.tasks.send_urgent_alert': {'queue': 'urgent_alerts'},
    'apps.ai.tasks.handle_critical_feedback': {'queue': 'urgent_alerts'},
    
    # 🚀 PHASE 2: CivicAI Bill Processing Tasks
    'apps.api.tasks.process_bill_async': {
        'queue': 'ai_responses',  # Medium priority for main processing
        'routing_key': 'ai_responses',
    },
    'apps.api.tasks.create_bill_chunks_async': {
        'queue': 'ai_batch',  # Low priority for chunking
        'routing_key': 'ai_batch',
    },
    'apps.api.tasks.generate_bill_embeddings_async': {
        'queue': 'ai_batch',  # Background task
        'routing_key': 'ai_batch',
    },
    'apps.api.tasks.cleanup_failed_bill_processing': {
        'queue': 'ai_analytics',  # Cleanup tasks
        'routing_key': 'ai_analytics',
    },
    'apps.api.tasks.get_async_task_status': {
        'queue': 'default',  # Fast status checks
        'routing_key': 'default',
    },
    
    # Urgent processing (small bills or priority processing)
    'apps.api.tasks.process_bill_urgent': {  # Future: priority processing
        'queue': 'ai_realtime',
        'routing_key': 'ai_realtime',
    },
}

# Queue priority levels (ENHANCED FOR PHASE 2)
CELERY_TASK_DEFAULT_QUEUE = 'default'
CELERY_TASK_QUEUES = {
    'urgent_alerts': {'routing_key': 'urgent_alerts', 'priority': 10},
    'ai_realtime': {'routing_key': 'ai_realtime', 'priority': 8},
    'ai_responses': {'routing_key': 'ai_responses', 'priority': 6},
    'ai_insights': {'routing_key': 'ai_insights', 'priority': 4},
    'ai_batch': {'routing_key': 'ai_batch', 'priority': 2},
    'ai_analytics': {'routing_key': 'ai_analytics', 'priority': 1},
    'default': {'routing_key': 'default', 'priority': 5},
}

# 🚀 PHASE 2: CELERY BEAT SCHEDULE (Periodic Tasks)
CELERY_BEAT_SCHEDULE = {
    # Clean up temp files daily at 2 AM
    'cleanup-temp-files': {
        'task': 'apps.api.tasks.cleanup_temp_files_periodic',
        'schedule': crontab(hour=2, minute=0),
    },
    
    # Clean up old async sessions daily at 3 AM  
    'cleanup-async-sessions': {
        'task': 'apps.api.tasks.cleanup_old_async_sessions',
        'schedule': crontab(hour=3, minute=0),
    },
    
    # Monitor stuck processing tasks every 30 minutes
    'monitor-stuck-tasks': {
        'task': 'apps.api.tasks.monitor_stuck_processing',
        'schedule': crontab(minute='*/30'),
    },
}

# =============================================================================
# 🚀 AI & LLM CONFIGURATION 
# =============================================================================

# OpenAI Configuration
OPENAI_API_KEY = config('OPENAI_API_KEY', default='')
OPENAI_MODEL = config('OPENAI_MODEL', default='gpt-4o')
OPENAI_MAX_TOKENS = config('OPENAI_MAX_TOKENS', default=1500, cast=int)
OPENAI_TEMPERATURE = config('OPENAI_TEMPERATURE', default=0.3, cast=float)

# Claude Configuration (Alternative/Backup)
CLAUDE_API_KEY = config('CLAUDE_API_KEY', default='')
CLAUDE_MODEL = config('CLAUDE_MODEL', default='claude-3-5-sonnet-20241022')

# AI Processing Settings
AI_PROCESSING_ASYNC = config('AI_PROCESSING_ASYNC', default=True, cast=bool)
AI_BATCH_SIZE = config('AI_BATCH_SIZE', default=10, cast=int)
AI_RETRY_ATTEMPTS = config('AI_RETRY_ATTEMPTS', default=3, cast=int)
AI_TIMEOUT_SECONDS = config('AI_TIMEOUT_SECONDS', default=30, cast=int)
AI_ENABLE_CACHING = config('AI_ENABLE_CACHING', default=True, cast=bool)
AI_CACHE_TTL = config('AI_CACHE_TTL', default=3600, cast=int)

# AI Feature Flags
AI_SENTIMENT_ANALYSIS_ENABLED = config('AI_SENTIMENT_ANALYSIS_ENABLED', default=True, cast=bool)
AI_URGENCY_SCORING_ENABLED = config('AI_URGENCY_SCORING_ENABLED', default=True, cast=bool)
AI_RESPONSE_GENERATION_ENABLED = config('AI_RESPONSE_GENERATION_ENABLED', default=True, cast=bool)
AI_TREND_ANALYSIS_ENABLED = config('AI_TREND_ANALYSIS_ENABLED', default=True, cast=bool)
AI_REALTIME_PROCESSING_ENABLED = config('AI_REALTIME_PROCESSING_ENABLED', default=True, cast=bool)

# AI Performance Settings
AI_SENTIMENT_CONFIDENCE_THRESHOLD = config('AI_SENTIMENT_CONFIDENCE_THRESHOLD', default=0.7, cast=float)
AI_URGENCY_SCORE_THRESHOLD = config('AI_URGENCY_SCORE_THRESHOLD', default=7.0, cast=float)
AI_RESPONSE_MIN_LENGTH = config('AI_RESPONSE_MIN_LENGTH', default=50, cast=int)
AI_TREND_ANALYSIS_LOOKBACK_DAYS = config('AI_TREND_ANALYSIS_LOOKBACK_DAYS', default=30, cast=int)

# Development/Demo Settings
AI_DEMO_MODE = config('AI_DEMO_MODE', default=True, cast=bool)
AI_LOG_LEVEL = config('AI_LOG_LEVEL', default='INFO')
AI_ENABLE_DETAILED_LOGGING = config('AI_ENABLE_DETAILED_LOGGING', default=True, cast=bool)

# =============================================================================
# 🚀 PHASE 2: CIVICAI ENHANCED SETTINGS
# =============================================================================

# CivicAI Specific Settings (ENHANCED FOR PHASE 2)
CIVICAI_SETTINGS = {
    # Original settings
    'ANONYMOUS_SESSION_TIMEOUT': 86400,  # 24 hours
    'MAX_ANONYMOUS_SUBMISSIONS_PER_SESSION': 5,
    'ENABLE_ANONYMOUS_FEEDBACK': True,
    'REQUIRE_EMAIL_VERIFICATION': False,  # Set to True in production
    'DEFAULT_COUNTY_CODE': 'NBI',  # Nairobi as default
    'ASYNC_PROCESSING_ENABLED': AI_PROCESSING_ASYNC,
    'BATCH_PROCESSING_SIZE': AI_BATCH_SIZE,
    'MAX_RETRY_ATTEMPTS': AI_RETRY_ATTEMPTS,
    'PROCESSING_TIMEOUT': AI_TIMEOUT_SECONDS,
    
    # 🚀 PHASE 2: File handling
    'MAX_FILE_SIZE': 50 * 1024 * 1024,  # 50MB max file size
    'TEMP_FILE_RETENTION': 3600 * 24,   # Keep temp files for 24 hours
    'TEMP_DIR': 'bills/temp/',           # Temp directory for async processing
    
    # 🚀 PHASE 2: Processing timeouts
    'ASYNC_TASK_TIMEOUT': 3600,         # 1 hour max processing time
    'PROGRESS_UPDATE_INTERVAL': 2,      # Update progress every 2 seconds
    'WEBSOCKET_TIMEOUT': 7200,          # 2 hours WebSocket connection timeout
    
    # 🚀 PHASE 2: Retry configuration
    'MAX_RETRIES': 3,                   # Maximum retry attempts
    'RETRY_BACKOFF_BASE': 60,           # Base retry delay (seconds)
    'RETRY_BACKOFF_MAX': 600,           # Maximum retry delay (seconds)
    
    # 🚀 PHASE 2: Performance settings
    'CONCURRENT_BILL_PROCESSING': 5,    # Max concurrent bill processing tasks
    'CHUNK_SIZE': 2000,                 # Characters per chunk for Phase 3
    'SECTIONS_BATCH_SIZE': 10,          # Process sections in batches
    
    # 🚀 PHASE 2: WebSocket settings
    'WEBSOCKET_HEARTBEAT': 30,          # Heartbeat interval (seconds)
    'MAX_WEBSOCKET_CONNECTIONS': 100,   # Per bill WebSocket connection limit
    
    # Feature Toggles
    'FEATURES': {
        'sentiment_analysis': AI_SENTIMENT_ANALYSIS_ENABLED,
        'urgency_scoring': AI_URGENCY_SCORING_ENABLED,
        'response_generation': AI_RESPONSE_GENERATION_ENABLED,
        'trend_analysis': AI_TREND_ANALYSIS_ENABLED,
        'realtime_processing': AI_REALTIME_PROCESSING_ENABLED,
    },
    
    # Quality Thresholds
    'QUALITY_THRESHOLDS': {
        'sentiment_confidence': AI_SENTIMENT_CONFIDENCE_THRESHOLD,
        'urgency_score': AI_URGENCY_SCORE_THRESHOLD,
        'response_min_length': AI_RESPONSE_MIN_LENGTH,
    },
    
    # Analysis Configuration
    'ANALYSIS_CONFIG': {
        'trend_lookback_days': AI_TREND_ANALYSIS_LOOKBACK_DAYS,
        'enable_caching': AI_ENABLE_CACHING,
        'cache_ttl': AI_CACHE_TTL,
    },
    
    # Demo and Development
    'DEMO_MODE': AI_DEMO_MODE,
    'LOGGING_LEVEL': AI_LOG_LEVEL,
    'DETAILED_LOGGING': AI_ENABLE_DETAILED_LOGGING,
}

# 🚀 PHASE 3: CITIZEN API SETTINGS
CIVICAI_PHASE3_SETTINGS = {
    # Chat functionality
    'CHAT_ENABLED': config('CIVICAI_CHAT_ENABLED', default=True, cast=bool),
    'MAX_CHAT_QUESTIONS_PER_SESSION': config('CIVICAI_MAX_CHAT_QUESTIONS', default=5, cast=int),
    'CHAT_SESSION_TIMEOUT': config('CIVICAI_CHAT_SESSION_TIMEOUT', default=3600, cast=int),  # 1 hour
    'ENABLE_EMBEDDINGS': config('CIVICAI_ENABLE_EMBEDDINGS', default=True, cast=bool),  # Set to False if no OpenAI API
    
    # Search functionality  
    'SEARCH_ENABLED': config('CIVICAI_SEARCH_ENABLED', default=True, cast=bool),
    'MAX_SEARCH_RESULTS': config('CIVICAI_MAX_SEARCH_RESULTS', default=20, cast=int),
    'SEARCH_MIN_QUERY_LENGTH': config('CIVICAI_SEARCH_MIN_LENGTH', default=3, cast=int),
    
    # Public access controls
    'PUBLISHED_BILL_STATUSES': [
        'first_reading', 'committee_stage', 'second_reading',
        'third_reading', 'presidential_assent', 'enacted'
    ],
    'REQUIRE_COMPLETED_PROCESSING': config('CIVICAI_REQUIRE_COMPLETED_PROCESSING', default=True, cast=bool),
    
    # Performance settings
    'ENABLE_RESPONSE_CACHING': config('CIVICAI_ENABLE_RESPONSE_CACHING', default=True, cast=bool),
    'CACHE_TIMEOUT_BILLS_LIST': config('CIVICAI_CACHE_BILLS_LIST', default=600, cast=int),      # 10 minutes
    'CACHE_TIMEOUT_BILL_DETAIL': config('CIVICAI_CACHE_BILL_DETAIL', default=1800, cast=int),    # 30 minutes  
    'CACHE_TIMEOUT_SEARCH_RESULTS': config('CIVICAI_CACHE_SEARCH_RESULTS', default=900, cast=int),  # 15 minutes
    'CACHE_TIMEOUT_CHAT_SUGGESTIONS': config('CIVICAI_CACHE_CHAT_SUGGESTIONS', default=7200, cast=int), # 2 hours
}

# 🚀 PHASE 2: CUSTOM THROTTLE CLASSES FOR CIVICAI
CIVICAI_THROTTLE_RATES = {
    'bill_creation': '10/hour',
    'async_processing': '5/hour', 
    'progress_polling': '120/hour',
    'websocket_connections': '20/hour',
}

# 🚀 PHASE 2: FEATURE FLAGS (ENHANCED FOR PHASE 3)
CIVICAI_FEATURES = {
    'ASYNC_PROCESSING_ENABLED': config('CIVICAI_ASYNC_ENABLED', default='true').lower() == 'true',
    'WEBSOCKET_ENABLED': config('CIVICAI_WEBSOCKET_ENABLED', default='true').lower() == 'true',
    'ENHANCED_PROCESSING_DEFAULT': True,  # Phase 1 feature
    'REAL_TIME_PROGRESS': config('CIVICAI_REALTIME_ENABLED', default='true').lower() == 'true',
    'AUTO_RETRY_ENABLED': True,
    'BACKGROUND_EMBEDDINGS': True,  # Preparation for Phase 3
    
    # 🚀 PHASE 3: New feature flags
    'CITIZEN_API_ENABLED': config('CIVICAI_CITIZEN_API_ENABLED', default='true').lower() == 'true',
    'PUBLIC_BILL_ACCESS': config('CIVICAI_PUBLIC_BILL_ACCESS', default='true').lower() == 'true',
    'CHAT_FUNCTIONALITY': CIVICAI_PHASE3_SETTINGS['CHAT_ENABLED'],
    'SEARCH_FUNCTIONALITY': CIVICAI_PHASE3_SETTINGS['SEARCH_ENABLED'],
    'EMBEDDINGS_GENERATION': CIVICAI_PHASE3_SETTINGS['ENABLE_EMBEDDINGS'],
}

# 🚀 PHASE 2: HEALTH CHECKS
HEALTH_CHECKS = {
    'database': 'django.db.backends.postgresql',
    'redis': config('REDIS_URL', default='redis://127.0.0.1:6379/0'),
    'celery': 'apps.api.health.celery_health_check',
    'websocket': 'apps.api.health.websocket_health_check',
}

# Custom health check endpoint settings
HEALTH_CHECK = {
    'DISK_USAGE_MAX': 90,  # Maximum disk usage percentage
    'MEMORY_MIN': 100,     # Minimum available memory (MB)
}

# Logging - Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# 🚀 PHASE 3: ENHANCED LOGGING CONFIGURATION
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
        'civicai': {
            'format': '{asctime} [{levelname}] CivicAI-{module}: {message}',
            'style': '{',
            'datefmt': '%Y-%m-%d %H:%M:%S',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'django.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'users_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'users.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        'ai_file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'ai.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
        # 🚀 PHASE 2: CivicAI specific log files
        'civicai_file': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'civicai.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'civicai',
        },
        'async_processing': {
            'class': 'logging.handlers.RotatingFileHandler', 
            'filename': LOGS_DIR / 'civicai_async.log',
            'maxBytes': 1024*1024*10,  # 10MB
            'backupCount': 5,
            'formatter': 'civicai',
        },
        'websocket_handler': {
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': LOGS_DIR / 'civicai_websocket.log',
            'maxBytes': 1024*1024*5,  # 5MB
            'backupCount': 3,
            'formatter': 'civicai',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.users': {
            'handlers': ['users_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.ai': {
            'handlers': ['ai_file', 'console'],
            'level': AI_LOG_LEVEL,
            'propagate': False,
        },
        'apps.ai.services': {
            'handlers': ['ai_file', 'console'],
            'level': 'DEBUG' if AI_ENABLE_DETAILED_LOGGING else 'INFO',
            'propagate': False,
        },
        'apps.ai.tasks': {
            'handlers': ['ai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'celery.task': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        # 🚀 PHASE 1: CivicAI specific loggers (maintained)
        'apps.api.bill_processor': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.api.progress_tracker': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        
        # 🚀 PHASE 2: CivicAI loggers (maintained)
        'apps.api.tasks': {
            'handlers': ['async_processing', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.api.async_progress_tracker': {
            'handlers': ['async_processing', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.api.websocket_handlers': {
            'handlers': ['websocket_handler', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        
        # 🚀 PHASE 3: NEW logging for citizen API features
        'apps.api.citizen_views': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.api.chat_service': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO', 
            'propagate': False,
        },
        'apps.api.chat_views': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps.api.embedding_service': {
            'handlers': ['civicai_file', 'console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# =============================================================================
# 🚀 PHASE 2: DEVELOPMENT VS PRODUCTION SETTINGS (ENHANCED FOR PHASE 3)
# =============================================================================

# Development-specific settings
DEBUG = config('DEBUG', default=False, cast=bool)

if DEBUG:
    # Enable detailed async logging
    LOGGING['loggers']['apps.api.tasks']['level'] = 'DEBUG'
    LOGGING['loggers']['apps.api.websocket_handlers']['level'] = 'DEBUG'
    
    # 🚀 PHASE 3: Enable detailed citizen API logging in development
    LOGGING['loggers']['apps.api.chat_service']['level'] = 'DEBUG'
    LOGGING['loggers']['apps.api.embedding_service']['level'] = 'DEBUG'
    
    # Shorter timeouts for testing
    CIVICAI_SETTINGS['ASYNC_TASK_TIMEOUT'] = 600  # 10 minutes
    CIVICAI_SETTINGS['WEBSOCKET_TIMEOUT'] = 1800  # 30 minutes
    
    # 🚀 PHASE 3: Development chat settings
    CIVICAI_PHASE3_SETTINGS['CHAT_SESSION_TIMEOUT'] = 1800  # 30 minutes for testing
    CIVICAI_PHASE3_SETTINGS['MAX_CHAT_QUESTIONS_PER_SESSION'] = 10  # More questions in dev

# Production settings
else:
    # Stricter security
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
    
    # Disable CORS_ALLOW_ALL_ORIGINS in production
    CORS_ALLOW_ALL_ORIGINS = False
    
    # Optimize for production
    CIVICAI_SETTINGS['CONCURRENT_BILL_PROCESSING'] = 10  # More concurrent processing
    
    # Production logging
    LOGGING['handlers']['console']['level'] = 'WARNING'
    
    # Production Redis with connection pooling
    CELERY_REDIS_BACKEND_USE_SSL = {
        'ssl_cert_reqs': None,
        'ssl_ca_certs': None,
        'ssl_certfile': None,
        'ssl_keyfile': None,
    }

# =============================================================================
# 🚀 PHASE 3: ENVIRONMENT VARIABLES DOCUMENTATION
# =============================================================================

"""
Add these environment variables to your .env file:

# Phase 2 Environment Variables (maintained)
CIVICAI_ASYNC_ENABLED=true
CIVICAI_MAX_CONCURRENT_PROCESSING=5
CIVICAI_WEBSOCKET_ENABLED=true

# Phase 3 Environment Variables (NEW)
CIVICAI_CHAT_ENABLED=true
CIVICAI_SEARCH_ENABLED=true
CIVICAI_ENABLE_EMBEDDINGS=true
CIVICAI_CITIZEN_API_ENABLED=true
CIVICAI_PUBLIC_BILL_ACCESS=true

# Chat Configuration
CIVICAI_MAX_CHAT_QUESTIONS=5
CIVICAI_CHAT_SESSION_TIMEOUT=3600
CIVICAI_MAX_SEARCH_RESULTS=20
CIVICAI_SEARCH_MIN_LENGTH=3

# Caching Configuration
CIVICAI_ENABLE_RESPONSE_CACHING=true
CIVICAI_CACHE_BILLS_LIST=600
CIVICAI_CACHE_BILL_DETAIL=1800
CIVICAI_CACHE_SEARCH_RESULTS=900
CIVICAI_CACHE_CHAT_SUGGESTIONS=7200

# Processing Control
CIVICAI_REQUIRE_COMPLETED_PROCESSING=true

# Redis Configuration  
REDIS_URL=redis://localhost:6379
REDIS_CHANNELS_DB=0
REDIS_CACHE_DB=1
REDIS_SESSIONS_DB=2

# File Processing (maintained)
CIVICAI_TEMP_DIR=bills/temp/
CIVICAI_MAX_FILE_SIZE=52428800
CIVICAI_FILE_RETENTION_HOURS=24

# Performance Tuning (maintained)
CIVICAI_CHUNK_SIZE=2000
CIVICAI_BATCH_SIZE=10
CIVICAI_PROGRESS_INTERVAL=2

# WebSocket Settings (maintained)
CIVICAI_WS_HEARTBEAT=30
CIVICAI_WS_TIMEOUT=7200
CIVICAI_MAX_WS_CONNECTIONS=100

# Retry Configuration (maintained)
CIVICAI_MAX_RETRIES=3
CIVICAI_RETRY_BACKOFF_BASE=60
CIVICAI_RETRY_BACKOFF_MAX=600

# Monitoring (maintained)
CIVICAI_DEBUG_ASYNC=false
CIVICAI_LOG_LEVEL=INFO
"""

# =============================================================================
# 🚀 PHASE 3: STARTUP CONFIGURATION SUMMARY
# =============================================================================

if config('DEBUG', default=False, cast=bool):
    print(f"🚀 CivicAI Phase 3 Configuration Loaded")
    print(f"   - Async Processing: {'✅' if CIVICAI_FEATURES['ASYNC_PROCESSING_ENABLED'] else '❌'}")
    print(f"   - WebSocket Support: {'✅' if CIVICAI_FEATURES['WEBSOCKET_ENABLED'] else '❌'}")
    print(f"   - Real-time Progress: {'✅' if CIVICAI_FEATURES['REAL_TIME_PROGRESS'] else '❌'}")
    print(f"   - Citizen API: {'✅' if CIVICAI_FEATURES['CITIZEN_API_ENABLED'] else '❌'}")
    print(f"   - Chat Functionality: {'✅' if CIVICAI_FEATURES['CHAT_FUNCTIONALITY'] else '❌'}")
    print(f"   - Search Functionality: {'✅' if CIVICAI_FEATURES['SEARCH_FUNCTIONALITY'] else '❌'}")
    print(f"   - Public Bill Access: {'✅' if CIVICAI_FEATURES['PUBLIC_BILL_ACCESS'] else '❌'}")
    print(f"   - Embeddings Generation: {'✅' if CIVICAI_FEATURES['EMBEDDINGS_GENERATION'] else '❌'}")
    print(f"   - Max Concurrent Tasks: {CIVICAI_SETTINGS['CONCURRENT_BILL_PROCESSING']}")
    print(f"   - File Size Limit: {CIVICAI_SETTINGS['MAX_FILE_SIZE'] // 1024 // 1024}MB")
    print(f"   - Debug Mode: {'✅' if DEBUG else '❌'}")
    print(f"   - AI Processing: {'✅' if AI_PROCESSING_ASYNC else '❌'}")
    print(f"   - Channel Layers: {'✅' if 'channels' in INSTALLED_APPS else '❌'}")
    print(f"   - Response Caching: {'✅' if CIVICAI_PHASE3_SETTINGS['ENABLE_RESPONSE_CACHING'] else '❌'}")