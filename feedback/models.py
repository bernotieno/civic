from django.db import models

# Create your models here.

from django.db import models
from apps.users.models import SoftDeleteModel, ActiveManager, County, Location, CustomUser

class Feedback(SoftDeleteModel):
    """
    Stores feedback from both registered and anonymous users.
    CRITICAL: All feedback is tied to a County (tenant).
    """
    CATEGORY_CHOICES = [
        ('COMPLAINT', 'Complaint'),
        ('SUGGESTION', 'Suggestion'),
        ('PRAISE', 'Praise'),
        ('BUG_REPORT', 'Bug Report'),
    ]

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('IN_PROGRESS', 'In Progress'),
        ('RESOLVED', 'Resolved'),
        ('CLOSED', 'Closed'),
    ]
    
    # --- Core Feedback Information ---
    content = models.TextField(help_text="The actual feedback content from the user.")
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='SUGGESTION')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', db_index=True)

    # --- Link to a County and optional Location (Crucial for "Invisible Boundaries") ---
    county = models.ForeignKey(County, on_delete=models.PROTECT, related_name='feedback')
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Optional specific location for the feedback (e.g., a ward or village)."
    )
    
    # --- Link to EITHER an Authenticated User OR an Anonymous Session ---
    # For authenticated users
    user = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='feedback_submissions',
        help_text="The registered user who submitted this feedback, if any."
    )
    # For anonymous users
    anonymous_session_id = models.CharField(
        max_length=100, null=True, blank=True, db_index=True,
        help_text="The session ID for an anonymous submission."
    )

    # Use the managers from your existing design
    objects = ActiveManager()
    all_objects = models.Manager()

    def __str__(self):
        submitter = f"User ID {self.user.id}" if self.user else f"Anonymous ({self.anonymous_session_id[:12]}...)"
        return f"Feedback ({self.get_category_display()}) from {submitter} for {self.county.name}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = "Feedback"
        verbose_name_plural = "Feedback Entries"
        indexes = [
            models.Index(fields=['county', 'status']),
            models.Index(fields=['user']),
        ]
