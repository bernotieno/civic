# =============================================================================
# FILE: civicAI/settings/base.py
# =============================================================================
import os
from pathlib import Path
from datetime import timedelta
from decouple import config
import dj_database_url

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
    # 'django_extensions',  # Commented out for now
]

LOCAL_APPS = [
    'apps.users',  # CivicAI user management
    'apps.core',   # CivicAI core - Invisible Boundaries system
    'apps.api',    # CivicAI API
    'apps.feedback',
    'apps.ai',     # 🚀 NEW: CivicAI AI Features
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

# Django REST Framework Configuration (ENHANCED)
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

# CORS Settings (ENHANCED for Development & Production)
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

# Database
DATABASES = {
    'default': dj_database_url.config(
        default=config('DATABASE_URL'),
        conn_max_age=600
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

# Cache configuration
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
    },
    'ai_cache': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/2'),
        'OPTIONS': {
            'CONNECTION_POOL_KWARGS': {
                'max_connections': 50,
                'retry_on_timeout': True,
            }
        },
        'TIMEOUT': AI_CACHE_TTL,
        'KEY_PREFIX': 'civicai_ai',
        'VERSION': 1,
    }
}

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

# =============================================================================
# 🚀 CELERY CONFIGURATION FOR AI PROCESSING
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

# Configure different queues for different types of AI tasks
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
}

# Queue priority levels
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

# CivicAI Specific Settings
CIVICAI_SETTINGS = {
    'ANONYMOUS_SESSION_TIMEOUT': 86400,  # 24 hours
    'MAX_ANONYMOUS_SUBMISSIONS_PER_SESSION': 5,
    'ENABLE_ANONYMOUS_FEEDBACK': True,
    'REQUIRE_EMAIL_VERIFICATION': False,  # Set to True in production
    'DEFAULT_COUNTY_CODE': 'NBI',  # Nairobi as default
    'ASYNC_PROCESSING_ENABLED': AI_PROCESSING_ASYNC,
    'BATCH_PROCESSING_SIZE': AI_BATCH_SIZE,
    'MAX_RETRY_ATTEMPTS': AI_RETRY_ATTEMPTS,
    'PROCESSING_TIMEOUT': AI_TIMEOUT_SECONDS,
    
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

# Logging - Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

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
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'users_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'users.log',
            'formatter': 'verbose',
        },
        'ai_file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': LOGS_DIR / 'ai.log',
            'formatter': 'verbose',
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
    },
}
