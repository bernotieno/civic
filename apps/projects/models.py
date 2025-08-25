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
    bill_number = models.CharField(max_length=50, unique=True, help_text="Official bill number")
    title = models.CharField(max_length=300)
    description = models.TextField()
    full_text = models.TextField(blank=True, help_text="Full bill text")
    summary = models.TextField(help_text="Executive summary for citizens")
    
    # Bill metadata
    sponsor = models.CharField(max_length=200, help_text="Bill sponsor (MP/Ministry)")
    committee = models.CharField(max_length=200, blank=True, help_text="Assigned committee")
    status = models.CharField(max_length=20, choices=BILL_STATUS_CHOICES, default='draft')
    
    # Dates
    introduced_date = models.DateField(null=True, blank=True)
    first_reading_date = models.DateField(null=True, blank=True)
    committee_deadline = models.DateField(null=True, blank=True)
    
    # Files
    document = models.FileField(upload_to='bills/documents/', null=True, blank=True)
    image = models.ImageField(upload_to='bills/', null=True, blank=True)
    
    # Engagement
    public_participation_open = models.BooleanField(default=True)
    participation_deadline = models.DateField(null=True, blank=True)
    
    # Admin
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['-introduced_date', '-created_at']
        indexes = [
            models.Index(fields=['status', 'public_participation_open']),
            models.Index(fields=['bill_number']),
            models.Index(fields=['introduced_date']),
        ]
    
    def __str__(self):
        return f"{self.bill_number}: {self.title}"


class Project(SoftDeleteModel):
    """National Projects for public engagement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES)
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES, default='proposed')
    
    # Project details
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    implementing_ministry = models.CharField(max_length=200, blank=True)
    target_beneficiaries = models.TextField(blank=True)
    
    # Timeline
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    
    # Files
    image = models.ImageField(upload_to='projects/', null=True, blank=True)
    document = models.FileField(upload_to='projects/documents/', null=True, blank=True)
    
    # Engagement
    public_participation_open = models.BooleanField(default=True)
    participation_deadline = models.DateField(null=True, blank=True)
    
    # Admin
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'public_participation_open']),
            models.Index(fields=['project_type']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_status_display()})"

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