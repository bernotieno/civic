# =============================================================================
# STEP 1: FEEDBACK MODEL
# FILE: apps/feedback/models.py
# =============================================================================
import uuid
import hashlib
from django.db import models
from django.utils import timezone
from apps.users.models import SoftDeleteModel, CustomUser, County, Location
from apps.feedback.utils import generate_tracking_id

# Feedback Categories
FEEDBACK_CATEGORIES = [
    ('infrastructure', 'Infrastructure & Roads'),
    ('healthcare', 'Healthcare Services'),
    ('education', 'Education & Schools'),
    ('water_sanitation', 'Water & Sanitation'),
    ('security', 'Security & Safety'),
    ('environment', 'Environment & Waste'),
    ('governance', 'Governance & Corruption'),
    ('economic', 'Economic Development'),
    ('other', 'Other Issues')
]

PRIORITY_CHOICES = [
    ('low', 'Low'),
    ('medium', 'Medium'),
    ('high', 'High'),
    ('urgent', 'Urgent')
]

STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('in_review', 'In Review'),
    ('responded', 'Responded'),
    ('resolved', 'Resolved'),
    ('closed', 'Closed')
]

SUBMISSION_METHODS = [
    ('web', 'Web'),
    ('mobile', 'Mobile'),
    ('api', 'API')
]


class Feedback(SoftDeleteModel):
    """
    CRITICAL: Core feedback model with tenant isolation and anonymous support.
    Each feedback belongs to a county (tenant) and maintains invisible boundaries.
    """
    
    # Core feedback fields
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200, db_index=True)
    content = models.TextField()
    category = models.CharField(max_length=20, choices=FEEDBACK_CATEGORIES, db_index=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='pending', db_index=True)
    
    # User and tenant isolation
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='feedback_submissions'
    )
    county = models.ForeignKey(
        County, 
        on_delete=models.CASCADE, 
        related_name='feedback_items',
        help_text="Tenant boundary - determines data access"
    )
    
    # Location hierarchy
    sub_county = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='feedback_sub_county',
        null=True, blank=True,
        limit_choices_to={'type': 'sub_county'}
    )
    ward = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='feedback_ward',
        null=True, blank=True,
        limit_choices_to={'type': 'ward'}
    )
    village = models.ForeignKey(
        Location, 
        on_delete=models.CASCADE, 
        related_name='feedback_village',
        null=True, blank=True,
        limit_choices_to={'type': 'village'}
    )
    
    # Tracking and metadata
    tracking_id = models.CharField(max_length=16, unique=True, db_index=True)
    is_anonymous = models.BooleanField(default=False, db_index=True)
    submitted_via = models.CharField(max_length=10, choices=SUBMISSION_METHODS, default='web')
    
    # Response tracking
    response_count = models.IntegerField(default=0)
    last_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    # Analytics fields
    view_count = models.IntegerField(default=0)
    sentiment_score = models.FloatField(null=True, blank=True)  # Future ML integration
    
    class Meta:
        indexes = [
            models.Index(fields=['county', 'status']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['tracking_id']),
            models.Index(fields=['category', 'priority']),
            models.Index(fields=['is_anonymous', 'county']),
            models.Index(fields=['created_at', 'county']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.county.name} ({self.get_status_display()})"
    
    def save(self, *args, **kwargs):
        # Generate tracking ID if not set
        if not self.tracking_id:
            self.tracking_id = generate_tracking_id()
        
        # Set anonymous flag based on user role
        if self.user and self.user.role == 'anonymous':
            self.is_anonymous = True
        
        # Update resolved timestamp
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def get_location_path(self):
        """Get full location path for display"""
        parts = [self.county.name]
        
        if self.sub_county:
            parts.append(self.sub_county.name)
        if self.ward:
            parts.append(self.ward.name)
        if self.village:
            parts.append(self.village.name)
        
        return ' > '.join(parts)
    
    def can_be_viewed_by(self, user):
        """Check if user can view this feedback (invisible boundaries)"""
        if not user or not user.is_authenticated:
            return False
        
        # Anonymous users can't view feedback
        if user.role == 'anonymous':
            return False
        
        # Citizens can only view their own feedback
        if user.role == 'citizen':
            return self.user == user
        
        # Government officials based on their level
        if user.role == 'government_official':
            accessible_counties = user.get_accessible_counties()
            return self.county in accessible_counties
        
        return False


class FeedbackResponse(SoftDeleteModel):
    """
    Government official responses to feedback.
    Future implementation for response system.
    """
    feedback = models.ForeignKey(
        Feedback, 
        on_delete=models.CASCADE, 
        related_name='responses'
    )
    responder = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='feedback_responses'
    )
    content = models.TextField()
    is_public = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Response to {self.feedback.title} by {self.responder.name}"
