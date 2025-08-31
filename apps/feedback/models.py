# =============================================================================
# STEP 1: FEEDBACK MODEL
# FILE: apps/feedback/models.py
# =============================================================================
import uuid
import hashlib
from django.db import models
from django.utils import timezone
from apps.users.models import SoftDeleteModel, CustomUser, County, Location
# Removed tracking ID generation





SUBMISSION_METHODS = [
    ('web', 'Web'),
    ('mobile', 'Mobile'),
    ('api', 'API')
]

STATUS_CHOICES = [
    ('pending', 'Pending Review'),
    ('in_review', 'Under Review'),
    ('responded', 'Responded'),
    ('resolved', 'Resolved'),
    ('closed', 'Closed')
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
    
    # User and national scope
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='feedback_submissions'
    )
    # County kept only for user location reference
    user_county = models.ForeignKey(
        County, 
        on_delete=models.CASCADE, 
        related_name='feedback_items',
        help_text="User's county for reference only - no data isolation"
    )
    
    # Optional: Related bill or project (for future implementation)
    related_bill_id = models.CharField(
        max_length=50, 
        null=True, blank=True,
        help_text="ID of related parliamentary bill"
    )
    related_project_id = models.UUIDField(
        null=True, blank=True,
        help_text="ID of related national project"
    )
    
    # Metadata
    is_anonymous = models.BooleanField(default=False, db_index=True)
    submitted_via = models.CharField(max_length=10, choices=SUBMISSION_METHODS, default='web')
    

    
    # Response tracking
    response_count = models.IntegerField(default=0)
    last_response_at = models.DateTimeField(null=True, blank=True)
    
    # Analytics fields
    view_count = models.IntegerField(default=0)
    sentiment_score = models.FloatField(null=True, blank=True)  # Future ML integration
    
    # Edit control fields
    can_edit = models.BooleanField(default=True, help_text="Admin can disable editing")
    can_delete = models.BooleanField(default=True, help_text="Admin can disable deletion")
    edited_at = models.DateTimeField(null=True, blank=True)
    edit_count = models.IntegerField(default=0)

    class Meta:
        indexes = [
            models.Index(fields=['user_county', 'created_at']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['is_anonymous', 'user_county']),
            models.Index(fields=['related_bill_id']),
            models.Index(fields=['related_project_id']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.user_county.name}"
    
    def save(self, *args, **kwargs):
        # Set anonymous flag based on user role
        if self.user and self.user.role == 'anonymous':
            self.is_anonymous = True
        
        super().save(*args, **kwargs)
    
    def get_location_path(self):
        """Get user county for display"""
        return self.user_county.name
    
    def can_be_viewed_by(self, user):
        """Check if user can view this feedback (national scope)"""
        if not user or not user.is_authenticated:
            return False
        
        # Anonymous users can't view feedback
        if user.role == 'anonymous':
            return False
        
        # Citizens can only view their own feedback
        if user.role == 'citizen':
            return self.user == user
        
        # Parliament admins can view all feedback
        if user.role in ['parliament_admin', 'super_admin']:
            return True
        
        return False

    def can_be_edited(self):
        """Check if feedback can be edited by owner with detailed reason"""
        if not self.can_edit:
            return False, "Editing disabled by administrator"
    
        # Edit count limit
        MAX_EDIT_COUNT = 3
        if self.edit_count >= MAX_EDIT_COUNT:
            return False, "Maximum edit limit reached (3 edits allowed)"
    
        # Time limit (24 hours)
        EDIT_TIME_LIMIT = 24 * 60 * 60  # 24 hours in seconds
        time_since_creation = timezone.now() - self.created_at
        if time_since_creation.total_seconds() > EDIT_TIME_LIMIT:
            return False, "Edit time limit exceeded (24 hours)"
    
        return True, "OK"

    def can_be_deleted(self):
        """Check if feedback can be deleted by owner"""
        if not self.can_delete:
            return False, "Deletion disabled by administrator"
    
        return True, "OK"
    
    def record_edit(self, previous_data):
        """Record feedback edit for audit trail"""
        self.edit_count += 1
        self.edited_at = timezone.now()
        self.save(update_fields=['edit_count', 'edited_at'])
    
        # Create edit history record
        FeedbackEdit.objects.create(
            feedback=self,
            previous_title=previous_data.get('title', ''),
            previous_content=previous_data.get('content', ''),
            edited_at=timezone.now()
            )


class FeedbackEdit(SoftDeleteModel):
    """
    Track all feedback edits for transparency and audit trail.
    Enables users and officials to see edit history.
    """
    feedback = models.ForeignKey(
        Feedback, 
        on_delete=models.CASCADE, 
        related_name='edit_history'
    )
    previous_title = models.CharField(max_length=200)
    previous_content = models.TextField()
    edit_reason = models.CharField(max_length=200, blank=True)
    edited_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-edited_at']
    
    def __str__(self):
        return f"Edit of {self.feedback.title} at {self.edited_at}"


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
