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
]

LOCAL_APPS = [
    'apps.users',  # CivicAI user management
    'apps.core',   # CivicAI core - Invisible Boundaries system
    'apps.api',    # CivicAI API
    'apps.feedback',
    # Add more apps here as you build them:
    # 'apps.analytics',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
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

# Cache
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': config('REDIS_URL', default='redis://127.0.0.1:6379/1'),
    }
}

# Session configuration for anonymous users
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
SESSION_COOKIE_AGE = 2 * 60 * 60  # 2 hours for anonymous sessions

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = config('TIME_ZONE', default='Africa/Nairobi')
USE_I18N = True
USE_TZ = True

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

# CivicAI Specific Settings
CIVICAI_SETTINGS = {
    'ANONYMOUS_SESSION_TIMEOUT': 86400,  # 24 hours
    'MAX_ANONYMOUS_SUBMISSIONS_PER_SESSION': 5,
    'ENABLE_ANONYMOUS_FEEDBACK': True,
    'REQUIRE_EMAIL_VERIFICATION': False,  # Set to True in production
    'DEFAULT_COUNTY_CODE': 'NBI',  # Nairobi as default
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
    },
}