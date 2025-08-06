from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']


# Development-specific apps
INSTALLED_APPS += [
    'django_extensions',  # Add useful development tools
]

# Development middleware
MIDDLEWARE += [
    # Add development-specific middleware
]

# Email backend for development
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Django Debug Toolbar - PROPERLY CONFIGURED
if DEBUG:
    try:
        import debug_toolbar
        INSTALLED_APPS += ['debug_toolbar']
        
        # Insert debug toolbar middleware at the right position
        MIDDLEWARE = [
            'debug_toolbar.middleware.DebugToolbarMiddleware',
        ] + MIDDLEWARE
        
        # Configure internal IPs
        INTERNAL_IPS = [
            '127.0.0.1',
            'localhost',
        ]
        
        # Debug toolbar configuration
        DEBUG_TOOLBAR_CONFIG = {
            'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG and request.META.get('REMOTE_ADDR') in INTERNAL_IPS,
            'INTERCEPT_REDIRECTS': False,  # CRITICAL: Prevent redirect interception
            'SHOW_COLLAPSED': True,
            'DISABLE_PANELS': {
                'debug_toolbar.panels.redirects.RedirectsPanel',  # Disable redirect panel
            },
        }
        
        # Optional: Customize which panels to show
        DEBUG_TOOLBAR_PANELS = [
            'debug_toolbar.panels.versions.VersionsPanel',
            'debug_toolbar.panels.timer.TimerPanel',
            'debug_toolbar.panels.settings.SettingsPanel',
            'debug_toolbar.panels.headers.HeadersPanel',
            'debug_toolbar.panels.request.RequestPanel',
            'debug_toolbar.panels.sql.SQLPanel',
            'debug_toolbar.panels.staticfiles.StaticFilesPanel',
            'debug_toolbar.panels.templates.TemplatesPanel',
            'debug_toolbar.panels.cache.CachePanel',
            'debug_toolbar.panels.signals.SignalsPanel',
            'debug_toolbar.panels.logging.LoggingPanel',
            # 'debug_toolbar.panels.redirects.RedirectsPanel',  # DISABLED
            'debug_toolbar.panels.profiling.ProfilingPanel',
        ]
        
    except ImportError:
        # Debug toolbar not installed, skip
        pass