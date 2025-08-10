# =============================================================================
# FILE: apps/documents/models.py
# =============================================================================
import uuid
import hashlib
from django.db import models
from django.core.exceptions import ValidationError
from django.contrib.postgres.fields import ArrayField
from apps.users.models import SoftDeleteModel, CustomUser, County


# Document Categories
DOCUMENT_CATEGORIES = [
    ('budget', 'Budget Documents'),
    ('policy', 'Policies & Regulations'),
    ('strategic_plan', 'Strategic Plans'),
    ('financial_report', 'Financial Reports'),
    ('project_report', 'Project Reports'),
    ('procurement', 'Procurement Documents'),
    ('legal', 'Legal Documents'),
    ('civic_education', 'Civic Education'),
    ('meeting_minutes', 'Meeting Minutes'),
    ('other', 'Other Documents')
]

DOCUMENT_STATUS = [
    ('draft', 'Draft'),
    ('under_review', 'Under Review'),
    ('published', 'Published'),
    ('archived', 'Archived'),
    ('rejected', 'Rejected')
]

CONFIDENTIALITY_LEVELS = [
    ('public', 'Public'),
    ('internal', 'Internal'),
    ('restricted', 'Restricted'),
    ('confidential', 'Confidential')
]

FILE_TYPES = [
    ('pdf', 'PDF Document'),
    ('doc', 'Word Document'),
    ('docx', 'Word Document (DOCX)'),
    ('xls', 'Excel Spreadsheet'),
    ('xlsx', 'Excel Spreadsheet (XLSX)'),
    ('ppt', 'PowerPoint Presentation'),
    ('pptx', 'PowerPoint Presentation (PPTX)'),
    ('txt', 'Text Document'),
    ('other', 'Other File Type')
]


class Document(SoftDeleteModel):
    """
    🏛️ CORE: Government Document Storage and Management
    
    Central model for all government documents with AI processing capabilities.
    Supports multi-tenant isolation and comprehensive metadata management.
    """
    
    # Core Identity
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300, db_index=True)
    description = models.TextField(blank=True)
    
    # Content and File Management
    file_path = models.CharField(max_length=500, help_text="Path to stored file")
    file_name = models.CharField(max_length=255)
    file_size = models.BigIntegerField(help_text="File size in bytes")
    file_type = models.CharField(max_length=10, choices=FILE_TYPES)
    file_hash = models.CharField(max_length=64, unique=True, help_text="SHA-256 hash for deduplication")
    
    # Classification
    category = models.CharField(max_length=20, choices=DOCUMENT_CATEGORIES, db_index=True)
    department = models.CharField(max_length=100, db_index=True)
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    
    # Status and Workflow
    status = models.CharField(max_length=15, choices=DOCUMENT_STATUS, default='draft', db_index=True)
    confidentiality = models.CharField(max_length=15, choices=CONFIDENTIALITY_LEVELS, default='public', db_index=True)
    
    # Tenant and User Management
    county = models.ForeignKey(
        County,
        on_delete=models.CASCADE,
        related_name='documents',
        help_text="County this document belongs to"
    )
    uploaded_by = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='uploaded_documents'
    )
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_documents'
    )
    
    # Publishing and Versioning
    version = models.CharField(max_length=10, default='1.0')
    published_at = models.DateTimeField(null=True, blank=True)
    auto_publish = models.BooleanField(default=False, help_text="Auto-publish after AI processing")
    
    # Engagement Metrics
    view_count = models.IntegerField(default=0)
    download_count = models.IntegerField(default=0)
    ai_query_count = models.IntegerField(default=0, help_text="Number of AI queries about this document")
    
    # AI Processing Status
    ai_processed = models.BooleanField(default=False, db_index=True)
    ai_processing_started_at = models.DateTimeField(null=True, blank=True)
    ai_processing_completed_at = models.DateTimeField(null=True, blank=True)
    ai_processing_error = models.TextField(blank=True)
    
    # Full-text Search (processed by AI)
    extracted_text = models.TextField(blank=True, help_text="AI-extracted text content")
    key_topics = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    summary = models.TextField(blank=True, help_text="AI-generated summary")
    
    class Meta:
        indexes = [
            models.Index(fields=['county', 'status', 'confidentiality']),
            models.Index(fields=['category', 'department']),
            models.Index(fields=['ai_processed', 'status']),
            models.Index(fields=['published_at', 'status']),
            models.Index(fields=['created_at', 'county']),
            models.Index(fields=['file_hash']),
        ]
        ordering = ['-created_at']
        permissions = [
            ('can_publish_documents', 'Can publish documents'),
            ('can_manage_all_documents', 'Can manage all county documents'),
            ('can_access_confidential', 'Can access confidential documents'),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.county.name})"
    
    def save(self, *args, **kwargs):
        # Generate file hash if not set
        if not self.file_hash and self.file_path:
            self.file_hash = self.generate_file_hash()
        
        # Auto-publish logic
        if self.auto_publish and self.ai_processed and self.status == 'under_review':
            self.status = 'published'
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def generate_file_hash(self):
        """Generate SHA-256 hash of file content"""
        import hashlib
        # In production, read actual file content
        content = f"{self.title}{self.file_name}{self.file_size}".encode()
        return hashlib.sha256(content).hexdigest()
    
    def get_public_url(self):
        """Get public URL for document access"""
        if self.status == 'published' and self.confidentiality == 'public':
            return f"/api/documents/{self.id}/download/"
        return None
    
    def can_be_viewed_by(self, user):
        """Check if user can view this document"""
        if not user or not user.is_authenticated:
            return self.status == 'published' and self.confidentiality == 'public'
        
        # Check county access
        if self.county not in user.get_accessible_counties():
            return False
        
        # Check confidentiality
        if self.confidentiality == 'public':
            return self.status == 'published'
        elif self.confidentiality == 'internal':
            return user.role == 'government_official'
        elif self.confidentiality == 'restricted':
            return user.role == 'government_official' and user.official_level in ['regional', 'national', 'super_admin']
        elif self.confidentiality == 'confidential':
            return user.role == 'government_official' and user.official_level in ['national', 'super_admin']
        
        return False
    
    def record_view(self, user=None):
        """Record document view"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
        
        # Create view log
        DocumentViewLog.objects.create(
            document=self,
            user=user,
            ip_address=None,  # Would be passed from request
            user_agent=None   # Would be passed from request
        )
    
    def record_download(self, user=None):
        """Record document download"""
        self.download_count += 1
        self.save(update_fields=['download_count'])
    
    def record_ai_query(self):
        """Record AI query about this document"""
        self.ai_query_count += 1
        self.save(update_fields=['ai_query_count'])


class DocumentProcessing(SoftDeleteModel):
    """
    🤖 AI Document Processing Pipeline
    
    Tracks AI processing status and results for each document.
    """
    
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name='processing_details'
    )
    
    # Processing Status
    task_id = models.CharField(max_length=100, db_index=True, help_text="Celery task ID")
    processing_stage = models.CharField(
        max_length=30,
        choices=[
            ('queued', 'Queued'),
            ('extracting_text', 'Extracting Text'),
            ('analyzing_content', 'Analyzing Content'),
            ('generating_summary', 'Generating Summary'),
            ('identifying_topics', 'Identifying Topics'),
            ('creating_embeddings', 'Creating Embeddings'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
        ],
        default='queued'
    )
    
    # Processing Results
    text_extraction_success = models.BooleanField(default=False)
    content_analysis_success = models.BooleanField(default=False)
    summary_generation_success = models.BooleanField(default=False)
    
    # Processing Metadata
    processing_time_seconds = models.FloatField(null=True, blank=True)
    error_details = models.JSONField(default=dict, blank=True)
    ai_model_used = models.CharField(max_length=50, blank=True)
    processing_parameters = models.JSONField(default=dict, blank=True)
    
    # Quality Metrics
    text_extraction_confidence = models.FloatField(null=True, blank=True)
    content_analysis_confidence = models.FloatField(null=True, blank=True)
    summary_quality_score = models.FloatField(null=True, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['task_id', 'processing_stage']),
            models.Index(fields=['document', 'created_at']),
        ]
    
    def __str__(self):
        return f"Processing {self.document.title} - {self.processing_stage}"


class DocumentEmbedding(SoftDeleteModel):
    """
    🔍 Document Vector Embeddings for AI Search
    
    Stores vector embeddings for semantic search and similarity matching.
    """
    
    document = models.OneToOneField(
        Document,
        on_delete=models.CASCADE,
        related_name='embedding'
    )
    
    # Embedding Data
    embedding_vector = ArrayField(
        models.FloatField(),
        size=1536,  # OpenAI embedding size
        help_text="Vector embedding of document content"
    )
    embedding_model = models.CharField(max_length=50, default='text-embedding-ada-002')
    embedding_created_at = models.DateTimeField(auto_now_add=True)
    
    # Content Chunks (for large documents)
    chunk_embeddings = models.JSONField(
        default=list,
        help_text="Embeddings for document chunks"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['document', 'embedding_created_at']),
        ]
    
    def __str__(self):
        return f"Embedding for {self.document.title}"


class ChatSession(SoftDeleteModel):
    """
    💬 AI Chat Sessions for Document Q&A
    
    Manages conversation sessions between citizens and AI about documents.
    """
    
    # Session Identity
    session_id = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='chat_sessions'
    )
    
    # Session Context
    county = models.ForeignKey(
        County,
        on_delete=models.CASCADE,
        related_name='chat_sessions'
    )
    documents_discussed = models.ManyToManyField(
        Document,
        blank=True,
        related_name='chat_sessions'
    )
    
    # Session Metadata
    session_title = models.CharField(max_length=200, blank=True)
    is_anonymous = models.BooleanField(default=False)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Session Status
    is_active = models.BooleanField(default=True)
    ended_at = models.DateTimeField(null=True, blank=True)
    message_count = models.IntegerField(default=0)
    
    # Analytics
    total_tokens_used = models.IntegerField(default=0)
    total_api_cost = models.DecimalField(max_digits=10, decimal_places=4, default=0.0000)
    satisfaction_rating = models.IntegerField(null=True, blank=True, choices=[(i, i) for i in range(1, 6)])
    
    class Meta:
        indexes = [
            models.Index(fields=['session_id', 'is_active']),
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['county', 'is_active']),
        ]
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Chat Session {self.session_id} ({self.message_count} messages)"
    
    def end_session(self, satisfaction_rating=None):
        """End chat session"""
        self.is_active = False
        self.ended_at = timezone.now()
        if satisfaction_rating:
            self.satisfaction_rating = satisfaction_rating
        self.save()


class ChatMessage(SoftDeleteModel):
    """
    💬 Individual Chat Messages in Document Q&A Sessions
    
    Stores both user questions and AI responses with context and sources.
    """
    
    # Message Identity
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    message_id = models.UUIDField(default=uuid.uuid4, unique=True)
    
    # Message Content
    message_type = models.CharField(
        max_length=10,
        choices=[
            ('user', 'User Message'),
            ('ai', 'AI Response'),
            ('system', 'System Message')
        ]
    )
    content = models.TextField()
    
    # AI Response Metadata
    ai_model_used = models.CharField(max_length=50, blank=True)
    tokens_used = models.IntegerField(default=0)
    processing_time_ms = models.IntegerField(default=0)
    confidence_score = models.FloatField(null=True, blank=True)
    
    # Source Documents
    source_documents = models.ManyToManyField(
        Document,
        blank=True,
        related_name='referenced_in_chats'
    )
    document_excerpts = models.JSONField(
        default=list,
        help_text="Relevant excerpts from source documents"
    )
    
    # User Feedback
    user_rating = models.CharField(
        max_length=10,
        choices=[
            ('helpful', 'Helpful'),
            ('not_helpful', 'Not Helpful'),
            ('partially', 'Partially Helpful')
        ],
        null=True, blank=True
    )
    user_feedback = models.TextField(blank=True)
    
    # Message Suggestions (for follow-up questions)
    suggested_questions = ArrayField(
        models.CharField(max_length=200),
        default=list,
        blank=True
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['session', 'created_at']),
            models.Index(fields=['message_type', 'created_at']),
            models.Index(fields=['message_id']),
        ]
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.message_type.title()} in {self.session.session_id}"
    
    def add_user_feedback(self, rating, feedback=None):
        """Add user feedback for AI response"""
        self.user_rating = rating
        if feedback:
            self.user_feedback = feedback
        self.save()


class DocumentViewLog(SoftDeleteModel):
    """
    📊 Document Access Analytics
    
    Detailed logging of document access for analytics and insights.
    """
    
    document = models.ForeignKey(
        Document,
        on_delete=models.CASCADE,
        related_name='view_logs'
    )
    user = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='document_views'
    )
    
    # Access Details
    access_type = models.CharField(
        max_length=15,
        choices=[
            ('view', 'Document View'),
            ('download', 'Document Download'),
            ('search', 'Found in Search'),
            ('ai_query', 'AI Query Reference')
        ],
        default='view'
    )
    
    # Request Metadata
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    session_id = models.CharField(max_length=100, blank=True)
    
    # Geographic Data (if available)
    country = models.CharField(max_length=50, blank=True)
    region = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['document', 'created_at']),
            models.Index(fields=['user', 'access_type']),
            models.Index(fields=['created_at', 'access_type']),
        ]
    
    def __str__(self):
        return f"{self.access_type} of {self.document.title} at {self.created_at}"


# =============================================================================
# SIGNALS FOR AUTOMATED PROCESSING
# =============================================================================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Document)
def trigger_document_processing(sender, instance, created, **kwargs):
    """Automatically trigger AI processing when document is uploaded"""
    if created and not instance.ai_processed:
        # Import here to avoid circular imports
        from apps.documents.tasks import process_document_complete
        
        # Trigger async processing
        task = process_document_complete.delay(instance.id)
        
        # Create processing record
        DocumentProcessing.objects.create(
            document=instance,
            task_id=task.id,
            processing_stage='queued'
        )