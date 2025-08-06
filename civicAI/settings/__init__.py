from decouple import config

environment = config('ENVIRONMENT', default='development')

if environment == 'production':
    from .production import *
elif environment == 'development':
    from .development import *
else:
    from .base import *
