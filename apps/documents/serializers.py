# =============================================================================
# FILE: apps/documents/serializers.py
# =============================================================================
from rest_framework import serializers
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema_field
from apps.documents.models import (
    Document, DocumentProcessing, ChatSession, ChatMessage, 
    DocumentViewLog, DOCUMENT_CATEGORIES, CONFIDENTIALITY_LEVELS
)
from apps.users.models import County

User = get_user_model()


class DocumentUploadSerializer(serializers.Serializer):
    """
    📤 Government Document Upload
    
    Upload new government documents with metadata and AI processing options.
    """
    # File upload
    file = serializers.FileField(
        help_text="Document file (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX)"
    )
    
    # Document metadata
    title = serializers.CharField(
        max_length=300,
        help_text="Document title"
    )
    description = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Brief description of the document"
    )
    category = serializers.ChoiceField(
        choices=DOCUMENT_CATEGORIES,
        help_text="Document category"
    )
    department = serializers.CharField(
        max_length=100,
        help_text="Responsible department"
    )
    tags = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Comma-separated tags"
    )
    confidentiality = serializers.ChoiceField(
        choices=CONFIDENTIALITY_LEVELS,
        default='public',
        help_text="Document confidentiality level"
    )
    auto_publish = serializers.BooleanField(
        default=False,
        help_text="Auto-publish after AI processing (if public)"
    )
    
    def validate_file(self, value):
        """Validate uploaded file"""
        # Check file size (50MB limit)
        max_size = 50 * 1024 * 1024  # 50MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f"File too large. Maximum size is {max_size // (1024*1024)}MB"
            )
        
        # Check file type
        allowed_extensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt']
        file_extension = value.name.lower().split('.')[-1]
        if f'.{file_extension}' not in allowed_extensions:
            raise serializers.ValidationError(
                f"File type not supported. Allowed types: {', '.join(allowed_extensions)}"
            )
        
        return value
    
    def validate_tags(self, value):
        """Process comma-separated tags"""
        if not value:
            return []
        
        tags = [tag.strip() for tag in value.split(',') if tag.strip()]
        if len(tags) > 10:
            raise serializers.ValidationError("Maximum 10 tags allowed")
        
        return tags
    
    def create(self, validated_data):
        """Create document record and trigger processing"""
        # Extract and process file
        file = validated_data.pop('file')
        tags = validated_data.pop('tags', [])
        
        # Determine file type
        file_extension = file.name.lower().split('.')[-1]
        file_type_map = {
            'pdf': 'pdf', 'doc': 'doc', 'docx': 'docx',
            'xls': 'xls', 'xlsx': 'xlsx', 'ppt': 'ppt', 
            'pptx': 'pptx', 'txt': 'txt'
        }
        file_type = file_type_map.get(file_extension, 'other')
        
        # Create document instance
        user = self.context['request'].user
        document = Document.objects.create(
            file_name=file.name,
            file_size=file.size,
            file_type=file_type,
            file_path=f"documents/{user.tenant.code}/{file.name}",  # Would be actual path
            tags=tags,
            county=user.tenant,
            uploaded_by=user,
            **validated_data
        )
        
        # In production, save file to storage and trigger AI processing
        # document.file_path = actual_file_path
        # document.save()
        
        return document


class DocumentSerializer(serializers.ModelSerializer):
    """
    📄 Complete Document Information
    
    Full document details with processing status and engagement metrics.
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    confidentiality_display = serializers.CharField(source='get_confidentiality_display', read_only=True)
    file_type_display = serializers.CharField(source='get_file_type_display', read_only=True)
    
    # Related data
    county_name = serializers.CharField(source='county.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.name', read_only=True)
    
    # Computed fields
    public_url = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    processing_status = serializers.SerializerMethodField()
    engagement_score = serializers.SerializerMethodField()
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'description', 'category', 'category_display',
            'department', 'tags', 'status', 'status_display', 
            'confidentiality', 'confidentiality_display', 'version',
            'file_name', 'file_size', 'file_type', 'file_type_display',
            'county_name', 'uploaded_by_name', 'reviewed_by_name',
            'published_at', 'created_at', 'updated_at',
            'view_count', 'download_count', 'ai_query_count',
            'ai_processed', 'ai_processing_completed_at',
            'summary', 'key_topics', 'public_url', 'can_edit', 
            'can_delete', 'processing_status', 'engagement_score'
        ]
    
    def get_public_url(self, obj):
        """Get public download URL if available"""
        return obj.get_public_url()
    
    def get_can_edit(self, obj):
        """Check if current user can edit document"""
        user = self.context['request'].user
        return (
            user.role == 'government_official' and 
            obj.county in user.get_accessible_counties() and
            obj.uploaded_by == user
        )
    
    def get_can_delete(self, obj):
        """Check if current user can delete document"""
        user = self.context['request'].user
        return (
            user.role == 'government_official' and 
            obj.county in user.get_accessible_counties() and
            (obj.uploaded_by == user or user.official_level in ['national', 'super_admin'])
        )
    
    @extend_schema_field(serializers.DictField())
    def get_processing_status(self, obj):
        """Get AI processing status details"""
        try:
            processing = obj.processing_details
            return {
                'stage': processing.processing_stage,
                'success': obj.ai_processed,
                'started_at': processing.created_at,
                'completed_at': obj.ai_processing_completed_at,
                'error': obj.ai_processing_error or processing.error_details
            }
        except:
            return {
                'stage': 'completed' if obj.ai_processed else 'pending',
                'success': obj.ai_processed,
                'started_at': obj.created_at,
                'completed_at': obj.ai_processing_completed_at,
                'error': obj.ai_processing_error
            }
    
    def get_engagement_score(self, obj):
        """Calculate engagement score based on metrics"""
        # Simple engagement calculation
        views_score = min(obj.view_count / 100, 10)  # Max 10 points for views
        downloads_score = min(obj.download_count / 10, 10)  # Max 10 points for downloads  
        queries_score = min(obj.ai_query_count / 5, 10)  # Max 10 points for AI queries
        
        return round(views_score + downloads_score + queries_score, 1)


class DocumentListSerializer(serializers.ModelSerializer):
    """
    📋 Document List View (Optimized)
    
    Lightweight serializer for document lists with essential information.
    """
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    county_name = serializers.CharField(source='county.name', read_only=True)
    uploaded_by_name = serializers.CharField(source='uploaded_by.name', read_only=True)
    
    class Meta:
        model = Document
        fields = [
            'id', 'title', 'category', 'category_display', 'department',
            'status', 'status_display', 'confidentiality', 'file_type',
            'file_size', 'county_name', 'uploaded_by_name', 'published_at',
            'created_at', 'view_count', 'download_count', 'ai_query_count',
            'ai_processed'
        ]


class DocumentUpdateSerializer(serializers.ModelSerializer):
    """
    ✏️ Document Update
    
    Update document metadata and republish if needed.
    """
    tags = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Document
        fields = [
            'title', 'description', 'category', 'department', 'tags',
            'confidentiality', 'status'
        ]
    
    def validate_tags(self, value):
        """Process comma-separated tags"""
        if not value:
            return []
        
        tags = [tag.strip() for tag in value.split(',') if tag.strip()]
        return tags
    
    def update(self, instance, validated_data):
        """Update document with version tracking"""
        tags = validated_data.pop('tags', None)
        if tags is not None:
            validated_data['tags'] = tags
        
        # Update version if significant changes
        significant_fields = ['title', 'category', 'confidentiality']
        if any(field in validated_data for field in significant_fields):
            current_version = instance.version
            try:
                major, minor = current_version.split('.')
                new_version = f"{major}.{int(minor) + 1}"
                validated_data['version'] = new_version
            except:
                validated_data['version'] = "1.1"
        
        return super().update(instance, validated_data)


class ChatSessionSerializer(serializers.ModelSerializer):
    """
    💬 Chat Session Information
    
    Chat session details with message count and status.
    """
    county_name = serializers.CharField(source='county.name', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    documents_count = serializers.SerializerMethodField()
    
    class Meta:
        model = ChatSession
        fields = [
            'session_id', 'county_name', 'user_name', 'session_title',
            'is_anonymous', 'is_active', 'message_count', 'documents_count',
            'total_tokens_used', 'satisfaction_rating', 'created_at', 'ended_at'
        ]
    
    def get_documents_count(self, obj):
        """Get count of documents discussed in session"""
        return obj.documents_discussed.count()


class ChatMessageSerializer(serializers.ModelSerializer):
    """
    💬 Chat Message
    
    Individual chat message with AI metadata and sources.
    """
    source_documents = DocumentListSerializer(many=True, read_only=True)
    user_rating_display = serializers.CharField(source='get_user_rating_display', read_only=True)
    
    class Meta:
        model = ChatMessage
        fields = [
            'message_id', 'message_type', 'content', 'ai_model_used',
            'tokens_used', 'processing_time_ms', 'confidence_score',
            'source_documents', 'document_excerpts', 'user_rating',
            'user_rating_display', 'user_feedback', 'suggested_questions',
            'created_at'
        ]


class ChatQuestionSerializer(serializers.Serializer):
    """
    ❓ Citizen Question Input
    
    Input serializer for citizen questions about documents.
    """
    question = serializers.CharField(
        max_length=1000,
        help_text="Your question about government documents"
    )
    session_id = serializers.UUIDField(
        required=False,
        help_text="Chat session ID (optional, will create new if not provided)"
    )
    county_id = serializers.IntegerField(
        required=False,
        help_text="County ID (optional, uses user's county if not provided)"
    )
    
    def validate_question(self, value):
        """Validate question content"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Question too short. Please provide more details."
            )
        
        # Basic content filtering
        banned_words = ['test', 'spam']  # Would be more comprehensive
        if any(word in value.lower() for word in banned_words):
            raise serializers.ValidationError(
                "Question contains inappropriate content."
            )
        
        return value.strip()


class ChatResponseSerializer(serializers.Serializer):
    """
    💭 AI Chat Response
    
    AI response with sources and suggestions for citizen questions.
    """
    success = serializers.BooleanField()
    message = serializers.CharField()
    sources = serializers.ListField(
        child=serializers.DictField(),
        help_text="Source documents with excerpts"
    )
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        help_text="Follow-up question suggestions"
    )
    confidence_score = serializers.FloatField()
    processing_time = serializers.FloatField()
    session_id = serializers.UUIDField()
    error_message = serializers.CharField(required=False)


class DocumentAnalyticsSerializer(serializers.Serializer):
    """
    📊 Document Analytics Summary
    
    Comprehensive analytics for government dashboard.
    """
    # Overall statistics
    total_documents = serializers.IntegerField()
    published_documents = serializers.IntegerField()
    documents_under_review = serializers.IntegerField()
    total_views = serializers.IntegerField()
    total_downloads = serializers.IntegerField()
    total_ai_queries = serializers.IntegerField()
    
    # Processing statistics
    avg_processing_time = serializers.CharField()
    documents_processed_today = serializers.IntegerField()
    processing_success_rate = serializers.FloatField()
    
    # Engagement statistics
    avg_engagement_score = serializers.FloatField()
    most_viewed_category = serializers.CharField()
    citizen_satisfaction = serializers.FloatField()
    
    # Trends (last 7 days)
    daily_views = serializers.ListField(child=serializers.DictField())
    daily_queries = serializers.ListField(child=serializers.DictField())
    category_distribution = serializers.ListField(child=serializers.DictField())
    
    # Popular content
    most_engaged_documents = DocumentListSerializer(many=True)
    trending_topics = serializers.ListField(child=serializers.CharField())


class DocumentViewLogSerializer(serializers.ModelSerializer):
    """
    📈 Document Access Analytics
    
    Detailed view logging for analytics and insights.
    """
    document_title = serializers.CharField(source='document.title', read_only=True)
    user_name = serializers.CharField(source='user.name', read_only=True)
    access_type_display = serializers.CharField(source='get_access_type_display', read_only=True)
    
    class Meta:
        model = DocumentViewLog
        fields = [
            'id', 'document_title', 'user_name', 'access_type', 
            'access_type_display', 'ip_address', 'country', 'region', 
            'city', 'created_at'
        ]


class MessageFeedbackSerializer(serializers.Serializer):
    """
    👍 Message Feedback Input
    
    Citizen feedback on AI response quality.
    """
    message_id = serializers.UUIDField()
    rating = serializers.ChoiceField(
        choices=[
            ('helpful', 'Helpful'),
            ('not_helpful', 'Not Helpful'),
            ('partially', 'Partially Helpful')
        ]
    )
    feedback = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=500,
        help_text="Optional feedback details"
    )
    
    def validate_message_id(self, value):
        """Validate message exists and is AI response"""
        try:
            message = ChatMessage.objects.get(message_id=value)
            if message.message_type != 'ai':
                raise serializers.ValidationError(
                    "Can only rate AI responses"
                )
            return value
        except ChatMessage.DoesNotExist:
            raise serializers.ValidationError("Message not found")


# Response serializers for API documentation
class DocumentUploadResponseSerializer(serializers.Serializer):
    """Document upload success response"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Document uploaded successfully")
    document = DocumentSerializer()
    processing_status = serializers.DictField()


class DocumentListResponseSerializer(serializers.Serializer):
    """Document list response with pagination"""
    success = serializers.BooleanField(default=True)
    count = serializers.IntegerField()
    next = serializers.URLField(allow_null=True)
    previous = serializers.URLField(allow_null=True)
    results = DocumentListSerializer(many=True)


class ChatSessionResponseSerializer(serializers.Serializer):
    """Chat session creation response"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Chat session started")
    session_id = serializers.UUIDField()
    county_name = serializers.CharField()


class ErrorResponseSerializer(serializers.Serializer):
    """Standard error response"""
    success = serializers.BooleanField(default=False)
    message = serializers.CharField()
    errors = serializers.DictField(required=False)