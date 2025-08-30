#  apps/projects/models.py
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

# Processing Status Choices
PROCESSING_STATUS_CHOICES = [
    ('pending', 'Pending'),
    ('processing', 'Processing'),
    ('completed', 'Completed'),
    ('failed', 'Failed'),
]

class Bill(SoftDeleteModel):
    """Parliamentary Bills for public engagement"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bill_number = models.CharField(max_length=50, unique=True, null=True, blank=True, help_text="Official bill number (e.g., HB-2024-001)")
    title = models.CharField(max_length=300)
    description = models.TextField()
    sponsor = models.CharField(max_length=200, help_text="Bill sponsor (MP/Ministry)")
    committee = models.CharField(max_length=200, blank=True, null=True, help_text="Parliamentary committee handling the bill")
    status = models.CharField(max_length=20, choices=BILL_STATUS_CHOICES, default='draft')
    
    # Dates
    introduced_date = models.DateField(null=True, blank=True)
    first_reading_date = models.DateField(null=True, blank=True)
    committee_deadline = models.DateField(null=True, blank=True)
    participation_deadline = models.DateField(null=True, blank=True)
    
    # Files
    document = models.FileField(upload_to='bills/documents/', null=True, blank=True)
    image = models.ImageField(upload_to='bills/images/', null=True, blank=True)
    
    # Public participation
    public_participation_open = models.BooleanField(default=True)
    
    # Auto-generated fields
    summary = models.TextField(blank=True, help_text="Auto-generated summary from document")
    
    # NEW: Enhanced processing fields (Phase 1)
    summary_html = models.TextField(blank=True, help_text="HTML formatted summary")
    processing_status = models.CharField(
        max_length=20, 
        choices=PROCESSING_STATUS_CHOICES,
        default='pending',
        help_text="Current processing status"
    )
    processing_progress = models.IntegerField(
        default=0, 
        help_text="Processing progress percentage (0-100)"
    )
    processing_message = models.CharField(
        max_length=200, 
        blank=True,
        help_text="Current processing stage message"
    )
    estimated_time_remaining = models.IntegerField(
        null=True, 
        blank=True,
        help_text="Estimated time remaining in seconds"
    )
    is_chunked = models.BooleanField(
        default=False,
        help_text="Whether bill has been chunked for chat"
    )
    total_chunks = models.IntegerField(
        default=0,
        help_text="Total number of chunks created"
    )
    
    # Admin
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['participation_deadline']),
            models.Index(fields=['processing_status']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_processing_status_display(self):
        """Get human-readable processing status"""
        return dict(PROCESSING_STATUS_CHOICES).get(self.processing_status, self.processing_status)

class BillChunk(SoftDeleteModel):
    """
    Text chunks of bills for chat functionality and search
    Prepared for Phase 2 async processing and Phase 3 citizen chat
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bill = models.ForeignKey(Bill, on_delete=models.CASCADE, related_name='chunks')
    
    # Chunk identification
    chunk_index = models.IntegerField(help_text="Order of chunk in bill (0-based)")
    section_title = models.CharField(max_length=200, blank=True, help_text="Section title if applicable")
    
    # Content
    content = models.TextField(help_text="Raw text content of chunk")
    processed_content = models.TextField(blank=True, help_text="AI-processed content")
    
    # Metadata for search and retrieval
    character_count = models.IntegerField(default=0)
    word_count = models.IntegerField(default=0)
    start_position = models.IntegerField(default=0, help_text="Character position in original document")
    end_position = models.IntegerField(default=0, help_text="End character position in original document")
    
    # Processing tracking
    is_processed = models.BooleanField(default=False)
    processing_error = models.TextField(blank=True)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    class Meta:
        ordering = ['bill', 'chunk_index']
        unique_together = [['bill', 'chunk_index']]
        indexes = [
            models.Index(fields=['bill', 'chunk_index']),
            models.Index(fields=['bill', 'is_processed']),
        ]
    
    def __str__(self):
        section = f" - {self.section_title}" if self.section_title else ""
        return f"{self.bill.title} Chunk {self.chunk_index}{section}"
    
    def save(self, *args, **kwargs):
        """Auto-calculate word and character counts on save"""
        if self.content:
            self.character_count = len(self.content)
            self.word_count = len(self.content.split())
        super().save(*args, **kwargs)

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