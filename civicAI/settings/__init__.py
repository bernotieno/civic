import os

# Determine which settings to use based on environment
if os.environ.get('ENVIRONMENT') == 'production':
    from .production import *
else:
    from .development import *