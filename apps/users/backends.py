# =============================================================================
# FILE: apps/users/backends.py
# =============================================================================
from django.contrib.auth.backends import BaseBackend
from django.contrib.auth import get_user_model
from .models import verify_national_id

User = get_user_model()

class NationalIDBackend(BaseBackend):
    """
    Custom authentication backend for national ID login
    """
    
    def authenticate(self, request, username=None, password=None, **kwargs):
        """
        Authenticate user with national ID and password
        username = national ID (plain text)
        """
        if username is None or password is None:
            return None
        
        # Find user by trying to verify national ID against all hashed versions
        try:
            # Get all users and check their national_id_hash against the provided username
            users = User.objects.all()
            user = None
            
            for u in users:
                if verify_national_id(username, u.national_id_hash):
                    user = u
                    break
            
            if user is None:
                return None
                
            # Check password
            if user.check_password(password):
                return user
                
        except Exception as e:
            print(f"Authentication error: {e}")
            return None
        
        return None
    
    def get_user(self, user_id):
        """
        Get user by ID
        """
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return None
