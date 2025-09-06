# =============================================================================
# FILE: apps/users/managers.py
# =============================================================================
from django.db import models
from django.contrib.auth.models import UserManager

class CustomUserManager(UserManager):
    """Custom manager for CustomUser with soft delete support"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def create_user(self, national_id, email=None, password=None, **extra_fields):
        """Create regular user with national ID"""
        if not national_id:
            raise ValueError('National ID is required')
        
        user = self.model(email=email, **extra_fields)
        user.set_national_id(national_id)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, national_id, email=None, password=None, **extra_fields):
        """Create superuser with national ID"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'government_official')
        extra_fields.setdefault('official_level', 'super_admin')
        
        return self.create_user(national_id, email, password, **extra_fields)


class CountyManager(models.Manager):
    """Custom manager for County model"""
    
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)
    
    def active(self):
        """Get only active counties"""
        return self.get_queryset().filter(is_active=True)
    
    def by_code(self, code):
        """Get county by code"""
        return self.get_queryset().filter(code=code.upper()).first()
