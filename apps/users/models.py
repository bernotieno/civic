# apps/users/models.py
import hashlib
import time
import uuid
import bcrypt
from django.conf import settings
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone
from django.core.exceptions import ValidationError


# ============================================================================
# STEP 1.1: BASE MODEL SETUP - SOFT DELETE FOUNDATION
# ============================================================================

class SoftDeleteModel(models.Model):
    """
    CRITICAL: This is the base for ALL models in the system.
    DO NOT create models without inheriting from this.
    Provides soft delete functionality with audit trail.
    """
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(
        'users.CustomUser', 
        null=True, blank=True,
        on_delete=models.SET_NULL, 
        related_name='deleted_%(class)s_set'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
    
    def soft_delete(self, user=None):
        """Perform soft delete with audit trail"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.deleted_by = user
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])
    
    def restore(self):
        """Restore soft-deleted object"""
        self.is_deleted = False
        self.deleted_at = None
        self.deleted_by = None
        self.save(update_fields=['is_deleted', 'deleted_at', 'deleted_by'])


class ActiveManager(models.Manager):
    """
    CRITICAL: Default manager that excludes soft-deleted records.
    This ensures all queries automatically exclude deleted items.
    """
    def get_queryset(self):
        return super().get_queryset().filter(is_deleted=False)


# ============================================================================
# STEP 1.2: LOCATION HIERARCHY MODEL - KENYA ADMINISTRATIVE STRUCTURE
# ============================================================================

LOCATION_TYPES = [
    ('county', 'County'),
    ('sub_county', 'Sub County'),
    ('ward', 'Ward'),
    ('village', 'Village'),
]


class Location(SoftDeleteModel):
    """
    CRITICAL: Hierarchical model for Kenya's administrative structure.
    Each location has a parent (except counties which are root).
    This supports dropdown filtering: County -> Sub-County -> Ward -> Village
    """
    name = models.CharField(max_length=100, db_index=True)
    parent = models.ForeignKey(
        'self', 
        null=True, blank=True, 
        on_delete=models.CASCADE, 
        related_name='children'
    )
    type = models.CharField(max_length=20, choices=LOCATION_TYPES, db_index=True)
    level = models.IntegerField(db_index=True)  # 0=county, 1=sub_county, 2=ward, 3=village
    code = models.CharField(max_length=10, unique=True)  # Official government codes
    
    # Managers
    objects = ActiveManager()  # Default: only active locations
    all_objects = models.Manager()  # Include soft-deleted when needed
    
    class Meta:
        unique_together = ['name', 'parent', 'type']
        indexes = [
            models.Index(fields=['parent', 'type']),
            models.Index(fields=['type', 'is_deleted']),
            models.Index(fields=['level', 'is_deleted']),
        ]
        ordering = ['level', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.get_type_display()})"
    
    def clean(self):
        """Validate location hierarchy rules"""
        # Validate level matches type
        type_levels = {'county': 0, 'sub_county': 1, 'ward': 2, 'village': 3}
        if self.type and self.level != type_levels[self.type]:
            raise ValidationError(f"Level {self.level} doesn't match type {self.type}")
        
        # Validate parent relationship
        if self.type == 'county' and self.parent:
            raise ValidationError("Counties cannot have a parent")
        elif self.type != 'county' and not self.parent:
            raise ValidationError(f"{self.get_type_display()} must have a parent")
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    def get_full_path(self):
        """Returns: 'Kisumu > Kisumu East > Kondele > Nyalenda'"""
        path = [self.name]
        parent = self.parent
        while parent:
            path.insert(0, parent.name)
            parent = parent.parent
        return ' > '.join(path)
    
    def get_county(self):
        """Always returns the root county for this location"""
        if self.type == 'county':
            return self
        parent = self.parent
        while parent and parent.type != 'county':
            parent = parent.parent
        return parent
    
    def get_children_by_type(self, location_type):
        """Get all children of specific type"""
        return self.children.filter(type=location_type)


# ============================================================================
# STEP 1.3: COUNTY (TENANT) MODEL - TENANT FOUNDATION
# ============================================================================

class County(SoftDeleteModel):
    """
    CRITICAL: This is the TENANT model. Every piece of data in the system
    belongs to a county. This enables:
    1. Data isolation between counties
    2. Per-county sales potential
    3. Nationwide analytics by aggregating across counties
    """
    name = models.CharField(max_length=100, unique=True, db_index=True)
    code = models.CharField(max_length=3, unique=True, db_index=True)  # KSM, NBI, MBS, etc.
    location = models.OneToOneField(
        'Location', 
        on_delete=models.CASCADE,
        limit_choices_to={'type': 'county'},
        related_name='county_tenant'
    )
    is_active = models.BooleanField(default=True, db_index=True)
    
    # Government contact information
    government_email = models.EmailField(blank=True)
    government_phone = models.CharField(max_length=20, blank=True)
    
    # Configuration
    timezone = models.CharField(max_length=50, default='Africa/Nairobi')
    
    # Managers
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        verbose_name_plural = "Counties"
        ordering = ['name']
        indexes = [
            models.Index(fields=['is_active', 'is_deleted']),
            models.Index(fields=['code']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.code})"
    
    def clean(self):
        """Validate county code is exactly 3 characters"""
        if self.code and len(self.code) != 3:
            raise ValidationError("County code must be exactly 3 characters")
    
    def save(self, *args, **kwargs):
        self.code = self.code.upper() if self.code else self.code
        self.clean()
        super().save(*args, **kwargs)


# ============================================================================
# STEP 1.4 & 1.5: NATIONAL ID HASHING & CUSTOMUSER MODEL
# ============================================================================

def hash_national_id(national_id):
    """Hash Kenyan national ID with bcrypt for login comparison"""
    if not national_id:
        return None
    return bcrypt.hashpw(national_id.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def verify_national_id(national_id, hashed_id):
    """Verify national ID against hashed version"""
    if not national_id or not hashed_id:
        return False
    try:
        return bcrypt.checkpw(national_id.encode('utf-8'), hashed_id.encode('utf-8'))
    except (ValueError, TypeError):
        return False


def generate_anonymous_id():
    """Generate unique ID for anonymous users"""
    timestamp = str(int(time.time() * 1000))
    session_id = str(uuid.uuid4())
    return f"ANON_{hashlib.sha256(f'{session_id}-{timestamp}'.encode()).hexdigest()[:32]}"


# ============================================================================
# CUSTOM USER MANAGER - CRITICAL FIX FOR DJANGO USER MANAGEMENT
# ============================================================================

from django.contrib.auth.models import UserManager

class CustomUserManager(UserManager):
    """
    CRITICAL: Custom manager for CustomUser that handles both:
    1. Django's user management requirements (get_by_natural_key, etc.)
    2. Soft delete functionality
    """
    
    def get_queryset(self):
        """Default queryset excludes soft-deleted users"""
        return super().get_queryset().filter(is_deleted=False)
    
    def get_by_natural_key(self, username):
        """Required by Django for user authentication"""
        return self.get(**{self.model.USERNAME_FIELD: username})
    
    def create_user(self, national_id_hash=None, email=None, password=None, **extra_fields):
        """
        Create regular user with national ID hash
        For creating users programmatically, pass the already hashed national_id_hash
        """
        if not national_id_hash:
            raise ValueError('National ID hash is required')
        
        if email:
            email = self.normalize_email(email)
        
        # Set default values for required fields
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        
        # Ensure user_county is set (required field)
        if 'user_county' not in extra_fields:
            # Default to first available county if no county specified
            try:
                default_county = County.objects.first()
                if not default_county:
                    raise ValueError('No counties found. Please create counties first.')
                extra_fields['user_county'] = default_county
            except Exception:
                raise ValueError('Default county not found. Please create counties first.')
        
        # Ensure county location is set (required field)
        if 'county' not in extra_fields and 'user_county' in extra_fields:
            extra_fields['county'] = extra_fields['user_county'].location
        
        user = self.model(
            national_id_hash=national_id_hash,
            username=national_id_hash,  # Set username to national_id_hash for Django compatibility
            email=email,
            **extra_fields
        )
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, national_id_hash=None, email=None, password=None, **extra_fields):
        """Create superuser with national ID hash"""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'parliament_admin')
        extra_fields.setdefault('admin_level', 'super_admin')
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')
        
        return self.create_user(national_id_hash, email, password, **extra_fields)
    
    def create_user_with_national_id(self, national_id, email=None, password=None, **extra_fields):
        """
        Convenience method to create user with raw national ID (auto-hashes)
        """
        national_id_hash = hash_national_id(national_id)
        return self.create_user(national_id_hash, email, password, **extra_fields)
    
    def create_superuser_with_national_id(self, national_id, email=None, password=None, **extra_fields):
        """
        Convenience method to create superuser with raw national ID (auto-hashes)
        """
        national_id_hash = hash_national_id(national_id)
        return self.create_superuser(national_id_hash, email, password, **extra_fields)


# Role definitions
ROLE_CHOICES = [
    ('citizen', 'Citizen'),
    ('parliament_admin', 'Parliament Administrator'),
    ('anonymous', 'Anonymous'),
]

PARLIAMENT_ADMIN_LEVELS = [
    ('parliament_admin', 'Parliament Administrator'), # National Assembly admin
    ('super_admin', 'Super Administrator'), # System-wide access
]


class CustomUser(AbstractUser, SoftDeleteModel):
    """
    CRITICAL: This is the CORE of the entire system. Every user belongs to
    a tenant (county) and has a role that determines their entire application experience.
    
    The "Invisible Boundaries" principle: Users only see data/features their
    role allows. They have NO KNOWLEDGE of anything outside their scope.
    """
    
    # Core identification - Use Django's default id as primary key
    # national_id_hash replaces the custom hashed ID from original design
    national_id_hash = models.CharField(
        max_length=128, 
        unique=True,
        help_text="bcrypt hashed Kenyan national ID or anonymous identifier"
    )
    name = models.CharField(max_length=255, blank=True, null=True)
    email = models.EmailField(unique=True, blank=True, null=True)
    
    # Location hierarchy - ALL are ForeignKeys to Location model
    county = models.ForeignKey(
        'Location', 
        on_delete=models.CASCADE, 
        related_name='county_users',
        limit_choices_to={'type': 'county'}
    )
    sub_county = models.ForeignKey(
        'Location', 
        on_delete=models.CASCADE, 
        related_name='sub_county_users',
        null=True, blank=True,
        limit_choices_to={'type': 'sub_county'}
    )
    ward = models.ForeignKey(
        'Location', 
        on_delete=models.CASCADE, 
        related_name='ward_users',
        null=True, blank=True,
        limit_choices_to={'type': 'ward'}
    )
    village = models.ForeignKey(
        'Location', 
        on_delete=models.CASCADE, 
        related_name='village_users',
        null=True, blank=True,
        limit_choices_to={'type': 'village'}
    )
    
    # Role and permission system
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='citizen', db_index=True)
    admin_level = models.CharField(
        max_length=20, 
        choices=PARLIAMENT_ADMIN_LEVELS,
        null=True, blank=True,
        help_text="Only applicable for parliament_admin role"
    )
    
    # National system - no tenant isolation needed
    # County is kept only for user location reference
    user_county = models.ForeignKey(
        'County', 
        on_delete=models.CASCADE, 
        related_name='users',
        help_text="User's county for location reference only"
    )
    
    # Audit trail for role assignments
    role_assigned_by = models.ForeignKey(
        'self', 
        null=True, blank=True, 
        on_delete=models.SET_NULL,
        related_name='assigned_roles'
    )
    role_assigned_at = models.DateTimeField(auto_now_add=True)
    
    # Django user system overrides
    USERNAME_FIELD = 'national_id_hash'  # Login with hashed national ID
    REQUIRED_FIELDS = ['email']  # Required for superuser creation
    
    # Managers - CRITICAL FIX
    objects = CustomUserManager()  # Default: only active users with Django compatibility
    all_objects = models.Manager()  # Include soft-deleted when needed
    
    class Meta:
        indexes = [
            models.Index(fields=['user_county', 'role']),
            models.Index(fields=['email'], name='idx_email'),
            models.Index(fields=['is_deleted', 'role']),
            models.Index(fields=['role', 'admin_level']),
            models.Index(fields=['national_id_hash']),
        ]
    
    def __str__(self):
        return f"{self.name or 'Anonymous'} ({self.get_role_display()})"
    
    def set_national_id(self, national_id):
        """Set national ID (automatically hashes)"""
        self.national_id_hash = hash_national_id(national_id)
        # Also set username for Django compatibility
        self.username = self.national_id_hash
    
    def check_national_id(self, national_id):
        """Verify national ID for login"""
        return verify_national_id(national_id, self.national_id_hash)
    
    def clean(self):
        """Validate user data consistency"""
        # Parliament admins must have admin_level
        if self.role == 'parliament_admin' and not self.admin_level:
            raise ValidationError("Parliament administrators must have an admin level")
        
        # Skip admin_level validation for existing users during migration
        # This allows users with old 'government_official' role to login
        if hasattr(self, '_state') and self._state.adding:
            # Only validate for new users
            if self.role != 'parliament_admin' and self.admin_level:
                raise ValidationError("Only parliament administrators can have an admin level")
    
    def save(self, *args, **kwargs):
        # Set username to national_id_hash for Django compatibility
        if not self.username:
            self.username = self.national_id_hash
        
        # Skip validation during login to allow existing users
        if not kwargs.pop('skip_validation', False):
            self.clean()
        super().save(*args, **kwargs)
    
    def has_national_access(self):
        """
        CRITICAL: This method determines if user has national access.
        All users now have national scope for bills and projects.
        
        Citizens can view all national content but only manage their own submissions.
        Parliament admins can manage all national content.
        """
        return True  # All users have national access in this system
    
    def is_anonymous_user(self):
        """Returns True if this is an anonymous submission user"""
        return self.role == 'anonymous'
    
    def can_manage_national_content(self):
        """Check if user can manage national bills and projects"""
        return self.role in ['parliament_admin', 'super_admin']
    
    def get_admin_level_display(self):
        """Get display name for admin level"""
        if not self.admin_level:
            return None
        level_dict = dict(PARLIAMENT_ADMIN_LEVELS)
        return level_dict.get(self.admin_level, self.admin_level)
    
    def get_location_hierarchy(self):
        """Return user's complete location hierarchy"""
        return {
            'county': self.county,
            'sub_county': self.sub_county,
            'ward': self.ward,
            'village': self.village,
        }
    
    @classmethod
    def create_anonymous_user(cls, session_id, tenant_county):
        """
        Create anonymous user for feedback submissions.
        Wrapper that calls AnonymousUserHandler for enhanced functionality.
        """
        from apps.users.anonymous import AnonymousUserHandler
        return AnonymousUserHandler.create_anonymous_user(session_id, tenant_county.id)


# ============================================================================
# MODEL REGISTRATION AND SIGNALS
# ============================================================================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Location)
def create_county_tenant(sender, instance, created, **kwargs):
    """Automatically create County tenant when county Location is created"""
    if created and instance.type == 'county':
        # Generate county code from name (first 3 letters, uppercase)
        code = instance.name[:3].upper()
        
        # Ensure unique code
        counter = 1
        original_code = code
        while County.objects.filter(code=code).exists():
            code = f"{original_code[:2]}{counter}"
            counter += 1
            
        County.objects.get_or_create(
            location=instance,
            defaults={
                'name': instance.name,
                'code': code,
                'is_active': True
            }
        )