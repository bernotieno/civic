# =============================================================================
# FILE: apps/api/serializers.py (COMPLETE CIVICAI SERIALIZERS - PHASES 1, 2, 3)
# =============================================================================

from rest_framework import serializers
from django.contrib.auth import authenticate
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from apps.users.models import CustomUser, County, Location, verify_national_id
from apps.users.utils import validate_kenyan_national_id
from apps.core.anonymous import AnonymousSessionManager
from apps.projects.models import Bill, BillChunk
import uuid

# =============================================================================
# USER AUTHENTICATION & MANAGEMENT SERIALIZERS
# =============================================================================

class RegisterSerializer(serializers.Serializer):
    """
    User Registration with Kenyan National ID
    
    Register a new citizen or government official account using their 8-digit Kenyan National ID.
    The system automatically validates the ID format and creates the user in the appropriate county tenant.
    """
    national_id = serializers.CharField(
        max_length=8, 
        min_length=8,
        help_text="8-digit Kenyan National ID (e.g., '12345678')",
        style={'placeholder': '12345678'}
    )
    name = serializers.CharField(
        max_length=255,
        help_text="Full name as it appears on your National ID",
        style={'placeholder': 'John Doe Kiprop'}
    )
    email = serializers.EmailField(
        help_text="Valid email address for notifications",
        style={'placeholder': 'john.kiprop@gmail.com'}
    )
    password = serializers.CharField(
        min_length=6, 
        write_only=True,
        help_text="Secure password (minimum 6 characters)",
        style={'input_type': 'password', 'placeholder': '••••••••'}
    )
    county_id = serializers.IntegerField(
        help_text="Your county ID (use /api/locations/counties/ to get list)"
    )
    sub_county_id = serializers.IntegerField(
        required=False,
        help_text="Optional: Your sub-county ID"
    )
    ward_id = serializers.IntegerField(
        required=False,
        help_text="Optional: Your ward ID"
    )
    village_id = serializers.IntegerField(
        required=False,
        help_text="Optional: Your village ID"
    )
    
    def validate_national_id(self, value):
        """Validate Kenyan National ID format"""
        if not validate_kenyan_national_id(value):
            raise serializers.ValidationError("Invalid National ID format")
        
        # Check if already registered
        existing_users = CustomUser.objects.all()
        for user in existing_users:
            if verify_national_id(value, user.national_id_hash):
                raise serializers.ValidationError("User with this National ID already exists")
        
        return value

    def validate_email(self, value):
        """Check if email already exists"""
        if CustomUser.objects.filter(email=value).exists():
            raise serializers.ValidationError("User with this email already exists")
        return value    
    
    def validate_county_id(self, value):
        """Validate county exists"""
        try:
            County.objects.get(id=value)
            return value
        except County.DoesNotExist:
            raise serializers.ValidationError("Invalid county")
    
    def validate(self, attrs):
        """Cross-field validation for location hierarchy"""
        county_id = attrs.get('county_id')
        sub_county_id = attrs.get('sub_county_id')
        ward_id = attrs.get('ward_id')
        village_id = attrs.get('village_id')
        
        try:
            county = County.objects.get(id=county_id)
            county_location = county.location
            
            if sub_county_id:
                sub_county = Location.objects.get(
                    id=sub_county_id, 
                    type='sub_county', 
                    parent=county_location
                )
                attrs['sub_county'] = sub_county
                
                if ward_id:
                    ward = Location.objects.get(
                        id=ward_id, 
                        type='ward', 
                        parent=sub_county
                    )
                    attrs['ward'] = ward
                    
                    if village_id:
                        village = Location.objects.get(
                            id=village_id, 
                            type='village', 
                            parent=ward
                        )
                        attrs['village'] = village
            
            attrs['county'] = county
            attrs['county_location'] = county_location
            
        except Location.DoesNotExist:
            raise serializers.ValidationError("Invalid location hierarchy")
        
        return attrs
    
    def create(self, validated_data):
        """Create new user with National ID"""
        # Extract location data
        county = validated_data.pop('county')
        county_location = validated_data.pop('county_location')
        sub_county = validated_data.pop('sub_county', None)
        ward = validated_data.pop('ward', None)
        village = validated_data.pop('village', None)
        
        # Remove non-model fields
        national_id = validated_data.pop('national_id')
        password = validated_data.pop('password')
        validated_data.pop('county_id', None)
        validated_data.pop('sub_county_id', None)
        validated_data.pop('ward_id', None)
        validated_data.pop('village_id', None)
        
        # Create user
        user = CustomUser.objects.create_user_with_national_id(
            national_id=national_id,
            password=password,
            user_county=county,
            county=county_location,
            sub_county=sub_county,
            ward=ward,
            village=village,
            **validated_data
        )
        
        return user


class LoginSerializer(serializers.Serializer):
    """
    Login with Kenyan National ID
    
    Authenticate using your 8-digit National ID and password to receive JWT tokens.
    """
    national_id = serializers.CharField(
        max_length=8, 
        min_length=8,
        help_text="Your 8-digit Kenyan National ID",
        style={'placeholder': '12345678'}
    )
    password = serializers.CharField(
        write_only=True,
        help_text="Your account password",
        style={'input_type': 'password', 'placeholder': '••••••••'}
    )
    
    def validate(self, attrs):
        national_id = attrs.get('national_id')
        password = attrs.get('password')
        
        if national_id and password:
            user = authenticate(
                request=self.context.get('request'),
                username=national_id,
                password=password
            )
            
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include national_id and password')


class AnonymousSessionSerializer(serializers.Serializer):
    """
    Create Anonymous Feedback Session
    
    Create a temporary anonymous session for submitting feedback without registration.
    Sessions are limited to 3 submissions and expire after 2 hours.
    """
    county_id = serializers.IntegerField(
        help_text="County ID where you want to submit feedback"
    )
    
    def validate_county_id(self, value):
        try:
            County.objects.get(id=value)
            return value
        except County.DoesNotExist:
            raise serializers.ValidationError("Invalid county")
    
    def create(self, validated_data):
        """Create anonymous session"""
        county_id = validated_data['county_id']
        request = self.context.get('request')
        request_meta = request.META if request else None
        
        session_id = AnonymousSessionManager.create_session(county_id, request_meta)
        return {'session_id': session_id}


class UserProfileSerializer(serializers.ModelSerializer):
    """
    User Profile Information
    
    Complete user profile with location details and access permissions.
    """
    county_name = serializers.CharField(
        source='user_county.name', 
        read_only=True,
        help_text="User's county name"
    )
    role_display = serializers.CharField(
        source='get_role_display', 
        read_only=True,
        help_text="Human-readable role name"
    )
    level_display = serializers.CharField(
        source='get_admin_level_display', 
        read_only=True,
        help_text="Human-readable admin level (parliament admins only)"
    )
    accessible_counties = serializers.SerializerMethodField(
        help_text="Counties this user can access data from"
    )
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'name', 'email', 'role', 'role_display', 
            'admin_level', 'level_display', 'county_name', 
            'accessible_counties', 'date_joined'
        ]
    
    @extend_schema_field(serializers.ListField(
        child=serializers.DictField(),
        help_text="List of counties user can access"
    ))
    def get_accessible_counties(self, obj):
        """Get list of counties user can access"""
        return []


class ProfileResponseSerializer(serializers.Serializer):
    """User profile response with permissions and app configuration"""
    success = serializers.BooleanField(default=True, help_text="Indicates if the request was successful")
    user = UserProfileSerializer(help_text="Complete user profile information")
    app_config = serializers.DictField(
        help_text="Application configuration and feature flags for the frontend"
    )
    permissions = serializers.DictField(
        help_text="User permissions and data access scopes"
    )
    features = serializers.DictField(
        help_text="Available features based on user role and permissions"
    )
    last_login = serializers.DateTimeField(help_text="Last login timestamp")
    session_expiry = serializers.DateTimeField(help_text="Session expiry timestamp")


# =============================================================================
# BILL MANAGEMENT SERIALIZERS (PHASES 1, 2, 3)
# =============================================================================

class BillChunkSerializer(serializers.ModelSerializer):
    """
    Bill Content Chunk
    
    Represents a processed section of a bill for search and chat functionality.
    """
    bill_title = serializers.CharField(
        source='bill.title', 
        read_only=True,
        help_text="Title of the parent bill"
    )
    embedding_info = serializers.SerializerMethodField(
        help_text="Information about embedding generation status"
    )
    
    class Meta:
        model = BillChunk
        fields = [
            'id', 'bill_title', 'chunk_index', 'section_title', 
            'content', 'processed_content', 'character_count', 
            'word_count', 'start_position', 'end_position', 
            'is_processed', 'embedding_info', 'created_at'
        ]
    
    @extend_schema_field(serializers.DictField())
    def get_embedding_info(self, obj):
        """Get embedding generation information"""
        if obj.embedding:
            return {
                'has_embedding': True,
                'model': obj.embedding.get('model', 'unknown'),
                'generated_at': obj.embedding.get('generated_at'),
                'is_placeholder': obj.embedding.get('is_placeholder', False)
            }
        return {'has_embedding': False}


class BillProgressSerializer(serializers.Serializer):
    """
    Bill Processing Progress Information
    
    Real-time progress data for bill processing operations.
    """
    status = serializers.CharField(
        help_text="Current processing status: pending, processing, completed, failed"
    )
    progress = serializers.IntegerField(
        help_text="Progress percentage (0-100)"
    )
    message = serializers.CharField(
        help_text="Current processing stage message"
    )
    time_remaining = serializers.IntegerField(
        allow_null=True,
        help_text="Estimated time remaining in seconds"
    )
    stage = serializers.CharField(
        help_text="Current processing stage identifier"
    )
    stage_display = serializers.CharField(
        help_text="Human-readable stage description"
    )


class AsyncTaskInfoSerializer(serializers.Serializer):
    """
    Async Task Information
    
    Details about background processing tasks.
    """
    task_id = serializers.CharField(
        help_text="Celery task identifier"
    )
    task_status = serializers.CharField(
        help_text="Task status from Celery"
    )
    task_active = serializers.BooleanField(
        help_text="Whether task is currently running"
    )
    task_result = serializers.JSONField(
        allow_null=True,
        help_text="Task result data (if completed)"
    )
    task_failed = serializers.BooleanField(
        help_text="Whether task failed"
    )


class BillProcessingStatusSerializer(serializers.Serializer):
    """
    Detailed Bill Processing Status
    
    Comprehensive status information for async bill processing.
    """
    processing_status = serializers.CharField(
        help_text="Overall processing status"
    )
    progress = serializers.IntegerField(
        help_text="Progress percentage"
    )
    message = serializers.CharField(
        help_text="Current status message"
    )
    stage = serializers.CharField(
        help_text="Processing stage"
    )
    stage_display = serializers.CharField(
        help_text="Human-readable stage"
    )
    time_remaining = serializers.IntegerField(
        allow_null=True,
        help_text="Estimated time remaining in seconds"
    )
    task_id = serializers.CharField(
        allow_null=True,
        help_text="Associated Celery task ID"
    )
    estimated_completion = serializers.CharField(
        allow_null=True,
        help_text="Estimated completion timestamp"
    )
    can_retry = serializers.BooleanField(
        help_text="Whether processing can be retried"
    )
    error_details = serializers.CharField(
        help_text="Error details if processing failed"
    )
    session_info = serializers.DictField(
        help_text="Async session information"
    )
    task_info = AsyncTaskInfoSerializer(
        help_text="Celery task details"
    )
    bill_info = serializers.DictField(
        help_text="Basic bill information"
    )


class AdminBillSerializer(serializers.ModelSerializer):
    """
    Bill Information for Admin Interface
    
    Complete bill data including processing status and admin controls.
    """
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Human-readable bill status"
    )
    processing_status_display = serializers.CharField(
        source='get_processing_status_display', 
        read_only=True,
        help_text="Human-readable processing status"
    )
    created_by_name = serializers.CharField(
        source='created_by.name', 
        read_only=True,
        help_text="Name of the user who created the bill"
    )
    document_url = serializers.CharField(
        source='document.url', 
        read_only=True,
        help_text="URL to the uploaded bill document"
    )
    async_info = serializers.SerializerMethodField(
        help_text="Async processing information"
    )
    
    class Meta:
        model = Bill
        fields = [
            'id', 'title', 'description', 'sponsor', 'status', 'status_display',
            'participation_deadline', 'document_url', 'summary', 'summary_html',
            'processing_status', 'processing_status_display', 'processing_progress',
            'processing_message', 'estimated_time_remaining', 'is_chunked',
            'total_chunks', 'created_by_name', 'created_at', 'updated_at', 'async_info'
        ]
    
    @extend_schema_field(serializers.DictField())
    def get_async_info(self, obj):
        """Get async processing information if available"""
        if obj.processing_status in ['processing', 'pending']:
            return {
                'supports_realtime': True,
                'can_cancel': obj.processing_status == 'processing',
                'can_retry': obj.processing_status == 'pending'
            }
        return {'supports_realtime': False}


class PublicBillSerializer(serializers.ModelSerializer):
    """
    Bill Information for Public/Citizen Access
    
    Bill data optimized for citizen consumption with citizen-focused features.
    """
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Human-readable bill status"
    )
    created_by = serializers.CharField(
        source='created_by.name', 
        read_only=True,
        help_text="Government entity that created the bill"
    )
    summary_available = serializers.SerializerMethodField(
        help_text="Whether bill has processed summary available"
    )
    can_chat = serializers.SerializerMethodField(
        help_text="Whether bill supports chat functionality"
    )
    estimated_reading_time = serializers.SerializerMethodField(
        help_text="Estimated reading time in minutes"
    )
    has_document = serializers.SerializerMethodField(
        help_text="Whether bill has downloadable document"
    )
    
    class Meta:
        model = Bill
        fields = [
            'id', 'title', 'description', 'sponsor', 'status', 'status_display',
            'participation_deadline', 'created_at', 'summary_available', 'can_chat',
            'total_chunks', 'estimated_reading_time', 'has_document', 'created_by'
        ]
    
    @extend_schema_field(serializers.BooleanField())
    def get_summary_available(self, obj):
        """Check if bill has processed summary"""
        return bool(obj.summary_html and obj.summary_html.strip())
    
    @extend_schema_field(serializers.BooleanField())
    def get_can_chat(self, obj):
        """Check if bill supports chat"""
        return obj.is_chunked and obj.total_chunks > 0
    
    @extend_schema_field(serializers.IntegerField())
    def get_estimated_reading_time(self, obj):
        """Calculate estimated reading time"""
        if obj.summary_html:
            import re
            clean_text = re.sub('<[^<]+?>', '', obj.summary_html)
            word_count = len(clean_text.split())
            return max(1, word_count // 250)  # 250 words per minute
        return 5  # Default
    
    @extend_schema_field(serializers.BooleanField())
    def get_has_document(self, obj):
        """Check if bill has document"""
        return bool(obj.document)


class PublicBillDetailSerializer(serializers.ModelSerializer):
    """
    Detailed Bill Information for Citizens
    
    Complete bill details including HTML summary and chat capabilities.
    """
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Human-readable bill status"
    )
    document_url = serializers.CharField(
        source='document.url', 
        read_only=True,
        allow_null=True,
        help_text="URL to download the original bill document"
    )
    can_chat = serializers.SerializerMethodField(
        help_text="Whether interactive chat is available"
    )
    key_sections = serializers.SerializerMethodField(
        help_text="Main sections of the bill for navigation"
    )
    complexity_level = serializers.SerializerMethodField(
        help_text="Bill complexity: basic, intermediate, advanced"
    )
    estimated_reading_time = serializers.SerializerMethodField(
        help_text="Estimated reading time in minutes"
    )
    word_count = serializers.SerializerMethodField(
        help_text="Approximate word count of the summary"
    )
    created_by = serializers.CharField(
        source='created_by.name', 
        read_only=True,
        help_text="Government entity that created the bill"
    )
    
    class Meta:
        model = Bill
        fields = [
            'id', 'title', 'description', 'sponsor', 'status', 'status_display',
            'summary_html', 'participation_deadline', 'created_at', 'document_url',
            'can_chat', 'total_chunks', 'key_sections', 'complexity_level',
            'estimated_reading_time', 'word_count', 'created_by', 'last_updated'
        ]
        extra_kwargs = {
            'last_updated': {'source': 'updated_at', 'read_only': True}
        }
    
    @extend_schema_field(serializers.BooleanField())
    def get_can_chat(self, obj):
        return obj.is_chunked and obj.total_chunks > 0
    
    @extend_schema_field(serializers.ListField(child=serializers.CharField()))
    def get_key_sections(self, obj):
        """Get main sections from chunks"""
        if obj.is_chunked:
            return list(obj.chunks.values_list('section_title', flat=True).distinct()[:10])
        return []
    
    @extend_schema_field(serializers.CharField())
    def get_complexity_level(self, obj):
        """Determine complexity level"""
        if obj.total_chunks > 20:
            return 'advanced'
        elif obj.total_chunks > 10:
            return 'intermediate'
        return 'basic'
    
    @extend_schema_field(serializers.IntegerField())
    def get_estimated_reading_time(self, obj):
        """Calculate reading time"""
        if obj.summary_html:
            import re
            clean_text = re.sub('<[^<]+?>', '', obj.summary_html)
            word_count = len(clean_text.split())
            return max(5, word_count // 250)
        return 5
    
    @extend_schema_field(serializers.IntegerField())
    def get_word_count(self, obj):
        """Calculate word count"""
        if obj.summary_html:
            import re
            clean_text = re.sub('<[^<]+?>', '', obj.summary_html)
            return len(clean_text.split())
        return 0


# =============================================================================
# CHAT FUNCTIONALITY SERIALIZERS (PHASE 3)
# =============================================================================

class ChatRequestSerializer(serializers.Serializer):
    """
    Chat Request for Bill Q&A
    
    Submit a question about a specific bill for AI-powered response.
    """
    question = serializers.CharField(
        max_length=500,
        min_length=5,
        help_text="Your question about the bill (5-500 characters)",
        style={'placeholder': 'How will this bill affect small businesses?'}
    )
    conversation_context = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        help_text="Previous conversation history for context"
    )
    session_id = serializers.CharField(
        required=False,
        help_text="Session ID for anonymous users (auto-generated if not provided)"
    )
    use_embeddings = serializers.BooleanField(
        default=True,
        help_text="Whether to use semantic search with embeddings"
    )


class ChatSourceSerializer(serializers.Serializer):
    """Information about sources used in chat response"""
    section_title = serializers.CharField(
        help_text="Title of the bill section referenced"
    )
    chunk_index = serializers.IntegerField(
        help_text="Index of the chunk in the bill"
    )
    relevance_score = serializers.FloatField(
        help_text="Relevance score for this source (0-1)"
    )


class ChatResponseSerializer(serializers.Serializer):
    """
    AI Chat Response
    
    Complete response from the AI chat system including sources and follow-ups.
    """
    success = serializers.BooleanField(
        default=True,
        help_text="Whether the chat request was successful"
    )
    response = serializers.CharField(
        help_text="AI-generated response to the user's question"
    )
    sources = serializers.ListField(
        child=serializers.CharField(),
        help_text="List of bill sections used to generate the response"
    )
    confidence = serializers.FloatField(
        help_text="Confidence score for the response (0-1)"
    )
    follow_up_questions = serializers.ListField(
        child=serializers.CharField(),
        help_text="Suggested follow-up questions"
    )
    conversation_id = serializers.CharField(
        help_text="Session/conversation identifier"
    )
    disclaimer = serializers.CharField(
        help_text="Legal disclaimer about the information provided"
    )
    processing_info = serializers.DictField(
        help_text="Information about how the response was generated"
    )
    bill_info = serializers.DictField(
        help_text="Basic information about the bill being discussed"
    )


class ChatSuggestionRequestSerializer(serializers.Serializer):
    """
    Chat Suggestions Request
    
    Request for suggested questions about a bill.
    """
    category = serializers.ChoiceField(
        choices=['all', 'basic', 'intermediate', 'advanced', 'contextual'],
        default='all',
        help_text="Category of suggestions to return"
    )
    limit = serializers.IntegerField(
        default=6,
        min_value=1,
        max_value=10,
        help_text="Maximum number of suggestions to return (1-10)"
    )


class ChatSuggestionSerializer(serializers.Serializer):
    """Individual chat suggestion"""
    question = serializers.CharField(
        help_text="Suggested question text"
    )
    category = serializers.CharField(
        help_text="Question category"
    )
    complexity = serializers.CharField(
        help_text="Complexity level: basic, intermediate, advanced"
    )
    topic_area = serializers.CharField(
        help_text="Topic area the question covers"
    )


class ChatSuggestionsResponseSerializer(serializers.Serializer):
    """
    Chat Suggestions Response
    
    List of suggested questions for a bill.
    """
    success = serializers.BooleanField(default=True)
    suggestions = ChatSuggestionSerializer(many=True)
    bill_info = serializers.DictField(
        help_text="Information about the bill"
    )
    suggestion_metadata = serializers.DictField(
        help_text="Metadata about suggestion generation"
    )


class ChatContextSerializer(serializers.Serializer):
    """
    Bill Chat Context Information
    
    Contextual information about a bill for chat interface setup.
    """
    title = serializers.CharField(help_text="Bill title")
    sponsor = serializers.CharField(help_text="Bill sponsor")
    status = serializers.CharField(help_text="Current bill status")
    status_display = serializers.CharField(help_text="Human-readable status")
    description = serializers.CharField(help_text="Bill description")
    key_sections = serializers.ListField(
        child=serializers.CharField(),
        help_text="Main sections in the bill"
    )
    complexity_level = serializers.CharField(
        help_text="Bill complexity level"
    )
    estimated_reading_time = serializers.IntegerField(
        help_text="Estimated reading time in minutes"
    )
    total_chunks = serializers.IntegerField(
        help_text="Number of content chunks"
    )
    participation_deadline = serializers.DateField(
        allow_null=True,
        help_text="Public participation deadline"
    )
    created_at = serializers.DateTimeField(help_text="Bill creation date")
    last_updated = serializers.DateTimeField(help_text="Last update timestamp")
    chat_capabilities = serializers.DictField(
        help_text="Available chat features and limitations"
    )
    word_count = serializers.IntegerField(help_text="Approximate word count")
    has_document = serializers.BooleanField(help_text="Whether original document is available")
    document_url = serializers.CharField(
        allow_null=True,
        help_text="URL to download original document"
    )


class ChatContextResponseSerializer(serializers.Serializer):
    """Chat context response with usage guidelines"""
    success = serializers.BooleanField(default=True)
    bill_context = ChatContextSerializer()
    usage_guidelines = serializers.DictField(
        help_text="Guidelines for effective chat usage"
    )
    context_metadata = serializers.DictField(
        help_text="Metadata about context generation"
    )


class ChatHistoryItemSerializer(serializers.Serializer):
    """Individual chat history item"""
    question = serializers.CharField(help_text="User's question")
    answer = serializers.CharField(help_text="AI's response")
    timestamp = serializers.DateTimeField(help_text="When the exchange occurred")
    sources = serializers.ListField(
        child=serializers.CharField(),
        help_text="Sources used for the response"
    )


class ChatHistoryResponseSerializer(serializers.Serializer):
    """Chat history response"""
    success = serializers.BooleanField(default=True)
    conversation_history = ChatHistoryItemSerializer(many=True)
    session_info = serializers.DictField(
        help_text="Information about the chat session"
    )


# =============================================================================
# SEARCH FUNCTIONALITY SERIALIZERS (PHASE 3)
# =============================================================================

class SearchRequestSerializer(serializers.Serializer):
    """
    Bill Content Search Request
    
    Search within a specific bill's content for relevant information.
    """
    query = serializers.CharField(
        min_length=3,
        max_length=200,
        help_text="Search query (3-200 characters)",
        style={'placeholder': 'income tax rate'}
    )
    limit = serializers.IntegerField(
        default=10,
        min_value=1,
        max_value=20,
        help_text="Maximum results to return (1-20)"
    )
    section = serializers.CharField(
        required=False,
        help_text="Filter by specific section title"
    )


class SearchResultSerializer(serializers.Serializer):
    """Individual search result"""
    chunk_id = serializers.UUIDField(
        help_text="Unique identifier for the content chunk"
    )
    section_title = serializers.CharField(
        help_text="Title of the bill section"
    )
    content_excerpt = serializers.CharField(
        help_text="Relevant excerpt from the content"
    )
    similarity_score = serializers.FloatField(
        help_text="Relevance score (0-1, higher is more relevant)"
    )
    chunk_order = serializers.IntegerField(
        help_text="Order of this chunk in the original bill"
    )
    match_type = serializers.CharField(
        help_text="Type of match: keyword, semantic, or hybrid"
    )
    search_method = serializers.CharField(
        required=False,
        help_text="Search method used to find this result"
    )


class SearchResponseSerializer(serializers.Serializer):
    """
    Bill Search Results
    
    Results from searching within a bill's content.
    """
    success = serializers.BooleanField(default=True)
    results = SearchResultSerializer(many=True)
    total_results = serializers.IntegerField(
        help_text="Total number of results found"
    )
    query = serializers.CharField(
        help_text="The search query that was used"
    )
    search_metadata = serializers.DictField(
        help_text="Metadata about the search operation"
    )
    suggestions = serializers.DictField(
        help_text="Suggestions for improving search results"
    )


# =============================================================================
# EMBEDDING GENERATION SERIALIZERS (ADMIN)
# =============================================================================

class EmbeddingGenerationRequestSerializer(serializers.Serializer):
    """
    Embedding Generation Request
    
    Request to generate semantic search embeddings for a bill.
    """
    force_regenerate = serializers.BooleanField(
        default=False,
        help_text="Force regeneration even if embeddings already exist"
    )


class EmbeddingGenerationResponseSerializer(serializers.Serializer):
    """
    Embedding Generation Response
    
    Result of embedding generation operation.
    """
    success = serializers.BooleanField(default=True)
    embeddings_generated = serializers.IntegerField(
        help_text="Number of embeddings successfully generated"
    )
    total_chunks = serializers.IntegerField(
        help_text="Total number of chunks processed"
    )
    skipped = serializers.IntegerField(
        help_text="Number of chunks skipped (already had embeddings)"
    )
    message = serializers.CharField(
        help_text="Status message about the operation"
    )
    bill_id = serializers.UUIDField(
        help_text="ID of the bill processed"
    )
    processing_info = serializers.DictField(
        help_text="Details about the processing operation"
    )


# =============================================================================
# PROCESSING OVERVIEW SERIALIZERS (ADMIN)
# =============================================================================

class ProcessingOverviewSummarySerializer(serializers.Serializer):
    """Processing statistics summary"""
    total_bills = serializers.IntegerField(help_text="Total bills in system")
    completed_bills = serializers.IntegerField(help_text="Successfully processed bills")
    failed_bills = serializers.IntegerField(help_text="Failed processing bills")
    currently_processing = serializers.IntegerField(help_text="Bills currently being processed")
    pending_processing = serializers.IntegerField(help_text="Bills waiting to be processed")
    active_async_sessions = serializers.IntegerField(help_text="Active async processing sessions")
    async_processing_available = serializers.BooleanField(help_text="Whether async processing is enabled")
    websocket_support = serializers.BooleanField(help_text="Whether real-time updates are available")


class ActiveSessionSerializer(serializers.Serializer):
    """Active processing session information"""
    bill_id = serializers.UUIDField(help_text="Bill being processed")
    bill_title = serializers.CharField(help_text="Title of the bill")
    task_id = serializers.CharField(help_text="Celery task ID")
    progress = serializers.IntegerField(help_text="Current progress percentage")
    started_at = serializers.DateTimeField(help_text="When processing started")
    stage = serializers.CharField(help_text="Current processing stage")
    message = serializers.CharField(help_text="Current status message")


class ProcessingCapabilitiesSerializer(serializers.Serializer):
    """System processing capabilities"""
    async_processing = serializers.BooleanField(help_text="Async processing available")
    real_time_updates = serializers.BooleanField(help_text="Real-time progress updates")
    task_cancellation = serializers.BooleanField(help_text="Can cancel ongoing tasks")
    retry_with_backoff = serializers.BooleanField(help_text="Automatic retry with backoff")
    sync_fallback = serializers.BooleanField(help_text="Sync processing fallback")


class ProcessingOverviewResponseSerializer(serializers.Serializer):
    """
    Processing Overview Response
    
    Complete system status and processing information for admin dashboard.
    """
    success = serializers.BooleanField(default=True)
    summary = ProcessingOverviewSummarySerializer()
    active_sessions = ActiveSessionSerializer(many=True)
    capabilities = ProcessingCapabilitiesSerializer()


# =============================================================================
# LOCATION SERIALIZERS
# =============================================================================

class LocationSerializer(serializers.ModelSerializer):
    """
    Location in Kenya's Administrative Hierarchy
    
    Represents County, Sub-County, Ward, or Village with parent-child relationships.
    """
    children = serializers.SerializerMethodField(
        help_text="Child locations (if include_children=true in request)"
    )
    full_path = serializers.CharField(
        source='get_full_path', 
        read_only=True,
        help_text="Complete path: 'County > Sub-County > Ward > Village'"
    )
    
    class Meta:
        model = Location
        fields = ['id', 'name', 'type', 'level', 'code', 'full_path', 'children']
        
    @extend_schema_field(serializers.ListField(
        child=serializers.DictField(),
        help_text="Child locations in hierarchy"
    ))
    def get_children(self, obj):
        """Get child locations"""
        if self.context.get('include_children', False):
            children = obj.children.all()
            return LocationSerializer(children, many=True, context=self.context).data
        return []


class LocationListResponseSerializer(serializers.Serializer):
    """
    Location List Response
    
    Standardized response for location listing endpoints.
    """
    success = serializers.BooleanField(
        default=True,
        help_text="Indicates if the request was successful"
    )
    locations = serializers.ListField(
        child=LocationSerializer(),
        help_text="List of location objects"
    )
    pagination = serializers.DictField(
        required=False,
        help_text="Pagination information if results are paginated"
    )
    filters = serializers.DictField(
        required=False,
        help_text="Available location filters"
    )


class CountySerializer(serializers.ModelSerializer):
    """
    County Information
    
    County details with associated location data for dropdown selection.
    """
    location_data = LocationSerializer(
        source='location', 
        read_only=True,
        help_text="Associated location hierarchy data"
    )
    
    class Meta:
        model = County
        fields = ['id', 'name', 'code', 'is_active', 'location_data']


# =============================================================================
# STANDARD RESPONSE SERIALIZERS
# =============================================================================

class TokenResponseSerializer(serializers.Serializer):
    """JWT Token pair response"""
    access = serializers.CharField(
        help_text="JWT access token (expires in 1 hour)"
    )
    refresh = serializers.CharField(
        help_text="JWT refresh token (expires in 7 days)"
    )


class SuccessResponseSerializer(serializers.Serializer):
    """Standard success response format"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField()


class LoginResponseSerializer(serializers.Serializer):
    """Complete login response with user data and tokens"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Login successful")
    user = UserProfileSerializer(help_text="User profile information")
    app_config = serializers.DictField(
        help_text="Frontend application configuration based on user role"
    )
    tokens = TokenResponseSerializer(help_text="JWT token pair")


class RegisterResponseSerializer(serializers.Serializer):
    """Complete registration response"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Registration successful")
    user = UserProfileSerializer(help_text="Newly created user profile")
    tokens = TokenResponseSerializer(help_text="JWT token pair")


class AnonymousSessionResponseSerializer(serializers.Serializer):
    """Anonymous session creation response"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Anonymous session created")
    session_id = serializers.CharField(help_text="Unique session identifier")
    expires_in = serializers.IntegerField(
        default=7200,
        help_text="Session expiry time in seconds (2 hours)"
    )
    max_submissions = serializers.IntegerField(
        default=3,
        help_text="Maximum submissions allowed per session"
    )


class AnonymousSessionStatusSerializer(serializers.Serializer):
    """Anonymous session status response"""
    success = serializers.BooleanField(default=True)
    session_id = serializers.CharField(help_text="Session identifier")
    can_submit = serializers.BooleanField(help_text="Whether session can still submit")
    message = serializers.CharField(help_text="Status message")
    submissions_used = serializers.IntegerField(help_text="Number of submissions used")
    submissions_limit = serializers.IntegerField(help_text="Maximum submissions allowed")
    expires_at = serializers.DateTimeField(help_text="Session expiry timestamp")


class BillListResponseSerializer(serializers.Serializer):
    """Bill list response with pagination"""
    success = serializers.BooleanField(default=True)
    bills = PublicBillSerializer(many=True)
    pagination = serializers.DictField(
        help_text="Pagination information"
    )
    filters = serializers.DictField(
        help_text="Available filters and current selections"
    )
    summary = serializers.DictField(
        help_text="Summary statistics about the bills"
    )


class BillDetailResponseSerializer(serializers.Serializer):
    """Bill detail response"""
    success = serializers.BooleanField(default=True)
    bill = PublicBillDetailSerializer()
    capabilities = serializers.DictField(
        help_text="Available features for this bill"
    )
    citizen_features = serializers.DictField(
        help_text="Citizen-specific features available"
    )


class AdminBillListResponseSerializer(serializers.Serializer):
    """Admin bill list response"""
    success = serializers.BooleanField(default=True)
    data = AdminBillSerializer(many=True)
    async_processing_available = serializers.BooleanField(default=True)
    websocket_support = serializers.BooleanField(default=True)


class SystemHealthSerializer(serializers.Serializer):
    """System health check response"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="CivicAI API is running")
    version = serializers.CharField(default="1.0.0")
    features = serializers.DictField(
        help_text="Available features and statistics"
    )


class ErrorResponseSerializer(serializers.Serializer):
    """Standard error response format"""
    success = serializers.BooleanField(default=False)
    message = serializers.CharField(help_text="Error description")
    errors = serializers.DictField(
        required=False,
        help_text="Detailed field-specific errors"
    )
    suggestions = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        help_text="Helpful suggestions to resolve the error"
    )


class LogoutRequestSerializer(serializers.Serializer):
    """Logout request with refresh token"""
    refresh_token = serializers.CharField(
        help_text="JWT refresh token to blacklist",
        write_only=True
    )


class BillProcessingRequestSerializer(serializers.Serializer):
    """Request for bill processing operations"""
    async_processing = serializers.BooleanField(
        default=True,
        help_text="Whether to use async processing"
    )
    use_enhanced_processing = serializers.BooleanField(
        default=True,
        help_text="Whether to use enhanced processing features"
    )
    force_sync = serializers.BooleanField(
        default=False,
        help_text="Force synchronous processing (for debugging)"
    )


class BillProcessingResponseSerializer(serializers.Serializer):
    """Response for bill processing operations"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(help_text="Operation status message")
    bill_id = serializers.UUIDField(help_text="Bill identifier")
    processing_async = serializers.BooleanField(
        help_text="Whether processing is running asynchronously"
    )
    task_id = serializers.CharField(
        required=False,
        help_text="Celery task ID for async operations"
    )
    session_id = serializers.CharField(
        required=False,
        help_text="Processing session ID"
    )
    websocket_channel = serializers.CharField(
        required=False,
        help_text="WebSocket channel for real-time updates"
    )
    estimated_time = serializers.IntegerField(
        required=False,
        help_text="Estimated processing time in seconds"
    )
    progress_endpoints = serializers.DictField(
        required=False,
        help_text="Endpoints for tracking progress"
    )
    summary_generated = serializers.BooleanField(
        required=False,
        help_text="Whether summary was successfully generated"
    )
    used_enhanced = serializers.BooleanField(
        required=False,
        help_text="Whether enhanced processing was used"
    )
    sections_count = serializers.IntegerField(
        required=False,
        help_text="Number of sections processed"
    )
    chunks_created = serializers.IntegerField(
        required=False,
        help_text="Number of chunks created for chat"
    )


# =============================================================================
# PAGINATION SERIALIZERS
# =============================================================================

class PaginationSerializer(serializers.Serializer):
    """Standard pagination information"""
    current_page = serializers.IntegerField(help_text="Current page number")
    total_pages = serializers.IntegerField(help_text="Total number of pages")
    total_bills = serializers.IntegerField(help_text="Total number of items")
    has_next = serializers.BooleanField(help_text="Whether there's a next page")
    has_previous = serializers.BooleanField(help_text="Whether there's a previous page")
    page_size = serializers.IntegerField(help_text="Items per page")
    next_page = serializers.IntegerField(
        allow_null=True,
        help_text="Next page number (null if no next page)"
    )
    previous_page = serializers.IntegerField(
        allow_null=True,
        help_text="Previous page number (null if no previous page)"
    )


# =============================================================================
# VALIDATION SERIALIZERS
# =============================================================================

class BillAccessValidationSerializer(serializers.Serializer):
    """Validation for bill access permissions"""
    bill_id = serializers.UUIDField(help_text="Bill identifier to validate")
    
    def validate_bill_id(self, value):
        """Validate bill exists and is publicly accessible"""
        try:
            bill = Bill.objects.get(
                id=value,
                is_deleted=False,
                processing_status='completed',
                status__in=[
                    'first_reading', 'committee_stage', 'second_reading',
                    'third_reading', 'presidential_assent', 'enacted'
                ]
            )
            return value
        except Bill.DoesNotExist:
            raise serializers.ValidationError(
                "Bill not found or not publicly available"
            )


class ChatValidationSerializer(serializers.Serializer):
    """Validation for chat functionality access"""
    bill_id = serializers.UUIDField()
    
    def validate_bill_id(self, value):
        """Validate bill supports chat functionality"""
        try:
            bill = Bill.objects.get(
                id=value,
                is_deleted=False,
                processing_status='completed',
                is_chunked=True
            )
            if bill.total_chunks == 0:
                raise serializers.ValidationError(
                    "Bill has no content chunks available for chat"
                )
            return value
        except Bill.DoesNotExist:
            raise serializers.ValidationError(
                "Bill not found or does not support chat functionality"
            )

