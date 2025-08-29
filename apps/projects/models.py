from django.db import models
from apps.users.models import SoftDeleteModel, ActiveManager
import uuid

# Bill Status Choices
BILL_STATUS_CHOICES = [
    ('draft', 'Draft'),
    ('first_reading', 'First Reading'),
    ('committee_stage', 'Committee Stage'),
    ('second_reading', 'Second Reading'),
    ('third_reading', 'Third Reading'),
    ('presidential_assent', 'Presidential Assent'),
    ('enacted', 'Enacted'),
    ('withdrawn', 'Withdrawn'),
]

# Project Status Choices
PROJECT_STATUS_CHOICES = [
    ('proposed', 'Proposed'),
    ('approved', 'Approved'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('suspended', 'Suspended'),
]

# Content Types
CONTENT_TYPES = [
    ('bill', 'Parliamentary Bill'),
    ('project', 'National Project'),
]

PROJECT_TYPES = [
    ('infrastructure', 'Infrastructure Development'),
    ('healthcare', 'Healthcare Initiative'),
    ('education', 'Education Program'),
    ('agriculture', 'Agriculture & Food Security'),
    ('environment', 'Environment & Climate'),
    ('economic', 'Economic Development'),
    ('social', 'Social Services'),
    ('governance', 'Governance & Reform'),
]

class Bill(SoftDeleteModel):
    """Parliamentary Bills for public engagement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300)
    description = models.TextField()
    sponsor = models.CharField(max_length=200, help_text="Bill sponsor (MP/Ministry)")
    status = models.CharField(max_length=20, choices=BILL_STATUS_CHOICES, default='draft')
    document = models.FileField(upload_to='bills/documents/', null=True, blank=True)
    participation_deadline = models.DateField(null=True, blank=True)
    
    # Auto-generated fields
    summary = models.TextField(blank=True, help_text="Auto-generated summary from document")
    
    # Admin
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['participation_deadline']),
        ]
    
    def __str__(self):
        return self.title


class Project(SoftDeleteModel):
    """National Projects for public engagement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    sponsor = models.CharField(max_length=200, default="Ministry of Public Works", help_text="Project sponsor (Ministry/Department)")
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES, default='proposed')
    document = models.FileField(upload_to='projects/documents/', null=True, blank=True)
    participation_deadline = models.DateField(null=True, blank=True)
    
    # Auto-generated fields
    summary = models.TextField(blank=True, help_text="Auto-generated summary from document")
    
    # Admin
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['participation_deadline']),
        ]
    
    def __str__(self):
        return self.title

class AdminFeedbackResponse(SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.OneToOneField('feedback.Feedback', on_delete=models.CASCADE, related_name='admin_response')
    response_text = models.TextField()
    responded_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='admin_responses')
    response_date = models.DateTimeField(auto_now_add=True)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    def __str__(self):
        return f"Admin response to {self.feedback.title}"