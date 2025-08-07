# =============================================================================
# FILE: apps/feedback/serializers.py (ENHANCED WITH RESPONSE SERIALIZERS)
# =============================================================================
from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema_field
from apps.users.models import County, Location
from apps.users.anonymous import AnonymousUserHandler
from apps.core.anonymous import AnonymousSessionManager
from .models import Feedback, FEEDBACK_CATEGORIES
from .validators import validate_feedback_title, validate_feedback_content, validate_location_hierarchy
from .utils import FeedbackRateLimit


# =============================================================================
# REQUEST SERIALIZERS (For form data input)
# =============================================================================

class FeedbackSubmissionSerializer(serializers.ModelSerializer):
    """
    📝 Authenticated User Feedback Submission
    
    Used for citizens and government officials to submit feedback with full authentication.
    Supports complete location hierarchy and user access validation.
    """
    
    county_id = serializers.IntegerField(
        write_only=True,
        help_text="County ID where the feedback applies (must be accessible to user)"
    )
    sub_county_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Sub-county ID within the selected county"
    )
    ward_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Ward ID within the selected sub-county"
    )
    village_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Village ID within the selected ward"
    )
    
    title = serializers.CharField(
        max_length=200,
        help_text="Clear, descriptive title for the feedback (10-200 characters)",
        style={'placeholder': 'Poor road conditions on main street'}
    )
    content = serializers.CharField(
        help_text="Detailed description of the issue or feedback (minimum 50 characters)",
        style={'rows': 4, 'placeholder': 'Please provide detailed information about the issue...'}
    )
    category = serializers.ChoiceField(
        choices=FEEDBACK_CATEGORIES,
        help_text="Category that best describes your feedback"
    )
    priority = serializers.ChoiceField(
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
        default='medium',
        help_text="Priority level based on urgency and impact"
    )
    
    # Read-only fields for response
    tracking_id = serializers.CharField(read_only=True)
    submitted_at = serializers.DateTimeField(source='created_at', read_only=True)
    location_path = serializers.CharField(source='get_location_path', read_only=True)
    
    class Meta:
        model = Feedback
        fields = [
            'title', 'content', 'category', 'priority',
            'county_id', 'sub_county_id', 'ward_id', 'village_id',
            'tracking_id', 'status', 'submitted_at', 'location_path'
        ]
        extra_kwargs = {
            'status': {'read_only': True},
        }
    
    def validate_title(self, value):
        validate_feedback_title(value)
        return value.strip()
    
    def validate_content(self, value):
        validate_feedback_content(value)
        return value.strip()
    
    def validate_county_id(self, value):
        """Validate county exists and user can access it"""
        try:
            county = County.objects.get(id=value)
            user = self.context['request'].user
            
            # Check if user can submit to this county
            accessible_counties = user.get_accessible_counties()
            if county not in accessible_counties:
                raise serializers.ValidationError("You cannot submit feedback to this county")
            
            return value
        except County.DoesNotExist:
            raise serializers.ValidationError("Invalid county")
    
    def validate(self, attrs):
        """Cross-field validation"""
        # Get location objects
        county_id = attrs.get('county_id')
        sub_county_id = attrs.get('sub_county_id')
        ward_id = attrs.get('ward_id')
        village_id = attrs.get('village_id')
        
        try:
            county = County.objects.get(id=county_id)
            attrs['county'] = county
            
            # Validate location hierarchy
            sub_county = None
            ward = None
            village = None
            
            if sub_county_id:
                sub_county = Location.objects.get(
                    id=sub_county_id, 
                    type='sub_county', 
                    parent=county.location
                )
                attrs['sub_county'] = sub_county
            
            if ward_id:
                if not sub_county:
                    raise serializers.ValidationError("Ward requires sub-county selection")
                ward = Location.objects.get(
                    id=ward_id, 
                    type='ward', 
                    parent=sub_county
                )
                attrs['ward'] = ward
            
            if village_id:
                if not ward:
                    raise serializers.ValidationError("Village requires ward selection")
                village = Location.objects.get(
                    id=village_id, 
                    type='village', 
                    parent=ward
                )
                attrs['village'] = village
            
            # Validate location hierarchy
            validate_location_hierarchy(county, sub_county, ward, village)
            
        except Location.DoesNotExist:
            raise serializers.ValidationError("Invalid location hierarchy")
        
        # Check rate limits
        user = self.context['request'].user
        can_submit, message = FeedbackRateLimit.check_citizen_limit(user)
        if not can_submit:
            raise serializers.ValidationError(message)
        
        return attrs
    
    def create(self, validated_data):
        """Create feedback with proper relationships"""
        # Extract location objects
        county = validated_data.pop('county')
        sub_county = validated_data.pop('sub_county', None)
        ward = validated_data.pop('ward', None)
        village = validated_data.pop('village', None)
        
        # Remove _id fields
        validated_data.pop('county_id', None)
        validated_data.pop('sub_county_id', None)
        validated_data.pop('ward_id', None)
        validated_data.pop('village_id', None)
        
        # Create feedback
        feedback = Feedback.objects.create(
            user=self.context['request'].user,
            county=county,
            sub_county=sub_county,
            ward=ward,
            village=village,
            submitted_via='api',
            **validated_data
        )
        
        # Record submission for rate limiting
        FeedbackRateLimit.record_citizen_submission(self.context['request'].user)
        
        return feedback


class AnonymousFeedbackSerializer(serializers.Serializer):
    """
    👤 Anonymous Feedback Submission
    
    Used for privacy-first feedback submission without requiring user registration.
    Links to anonymous sessions for rate limiting and validation.
    """
    
    session_id = serializers.CharField(
        max_length=64,
        help_text="Anonymous session ID obtained from /api/auth/anonymous/"
    )
    title = serializers.CharField(
        max_length=200,
        help_text="Clear, descriptive title for the feedback",
        style={'placeholder': 'Issue with public service'}
    )
    content = serializers.CharField(
        help_text="Detailed description of the issue (minimum 50 characters)",
        style={'rows': 4}
    )
    category = serializers.ChoiceField(
        choices=FEEDBACK_CATEGORIES,
        help_text="Category that best describes the feedback"
    )
    priority = serializers.ChoiceField(
        choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
        default='medium',
        help_text="Priority level of the feedback"
    )
    county_id = serializers.IntegerField(
        help_text="Must match the county ID used when creating the anonymous session"
    )
    sub_county_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Sub-county ID"
    )
    ward_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Ward ID"
    )
    village_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="Optional: Village ID"
    )
    
    def validate_session_id(self, value):
        """Validate anonymous session exists and can submit"""
        session_data = AnonymousSessionManager.get_session(value)
        if not session_data:
            raise serializers.ValidationError("Invalid or expired session")
        
        can_submit, message = AnonymousSessionManager.can_submit(value)
        if not can_submit:
            raise serializers.ValidationError(message)
        
        return value
    
    def validate_title(self, value):
        validate_feedback_title(value)
        return value.strip()
    
    def validate_content(self, value):
        validate_feedback_content(value)
        return value.strip()
    
    def validate(self, attrs):
        """Validate location hierarchy and session county match"""
        session_id = attrs['session_id']
        county_id = attrs['county_id']
        
        # Get session data
        session_data = AnonymousSessionManager.get_session(session_id)
        if session_data['county_id'] != county_id:
            raise serializers.ValidationError("County must match session county")
        
        # Validate locations
        try:
            county = County.objects.get(id=county_id)
            attrs['county'] = county
            
            # Same location validation as authenticated feedback
            sub_county_id = attrs.get('sub_county_id')
            ward_id = attrs.get('ward_id')
            village_id = attrs.get('village_id')
            
            sub_county = None
            ward = None
            village = None
            
            if sub_county_id:
                sub_county = Location.objects.get(
                    id=sub_county_id, 
                    type='sub_county', 
                    parent=county.location
                )
                attrs['sub_county'] = sub_county
            
            if ward_id:
                if not sub_county:
                    raise serializers.ValidationError("Ward requires sub-county selection")
                ward = Location.objects.get(
                    id=ward_id, 
                    type='ward', 
                    parent=sub_county
                )
                attrs['ward'] = ward
            
            if village_id:
                if not ward:
                    raise serializers.ValidationError("Village requires ward selection")
                village = Location.objects.get(
                    id=village_id, 
                    type='village', 
                    parent=ward
                )
                attrs['village'] = village
            
            validate_location_hierarchy(county, sub_county, ward, village)
            
        except (County.DoesNotExist, Location.DoesNotExist):
            raise serializers.ValidationError("Invalid location hierarchy")
        
        return attrs
    
    def create(self, validated_data):
        """Create anonymous feedback"""
        session_id = validated_data.pop('session_id')
        county = validated_data.pop('county')
        sub_county = validated_data.pop('sub_county', None)
        ward = validated_data.pop('ward', None)
        village = validated_data.pop('village', None)
        
        # Remove _id fields
        validated_data.pop('county_id', None)
        validated_data.pop('sub_county_id', None)
        validated_data.pop('ward_id', None)
        validated_data.pop('village_id', None)
        
        # Create or get anonymous user for this session
        anonymous_user = AnonymousUserHandler.create_anonymous_user(
            session_id, county.id, {
                'sub_county_id': sub_county.id if sub_county else None,
                'ward_id': ward.id if ward else None,
                'village_id': village.id if village else None,
            }
        )
        
        if not anonymous_user:
            raise serializers.ValidationError("Failed to create anonymous user")
        
        # Create feedback
        feedback = Feedback.objects.create(
            user=anonymous_user,
            county=county,
            sub_county=sub_county,
            ward=ward,
            village=village,
            is_anonymous=True,
            submitted_via='api',
            **validated_data
        )
        
        # Record submission for rate limiting
        FeedbackRateLimit.record_anonymous_submission(session_id)
        
        return feedback


class FeedbackTrackingSerializer(serializers.ModelSerializer):
    """
    🔍 Feedback Status Tracking
    
    Public serializer for tracking feedback status without exposing sensitive information.
    Works for both authenticated and anonymous feedback.
    """
    
    submitted_at = serializers.DateTimeField(
        source='created_at', 
        read_only=True,
        help_text="When the feedback was originally submitted"
    )
    location_path = serializers.CharField(
        source='get_location_path', 
        read_only=True,
        help_text="Full location path: 'County > Sub-County > Ward > Village'"
    )
    category_display = serializers.CharField(
        source='get_category_display', 
        read_only=True,
        help_text="Human-readable category name"
    )
    status_display = serializers.CharField(
        source='get_status_display', 
        read_only=True,
        help_text="Human-readable status description"
    )
    
    class Meta:
        model = Feedback
        fields = [
            'tracking_id', 'title', 'category', 'category_display',
            'status', 'status_display', 'submitted_at', 
            'location_path', 'response_count', 'last_response_at'
        ]


# =============================================================================
# RESPONSE SERIALIZERS (For Swagger documentation)
# =============================================================================

class FeedbackDataSerializer(serializers.Serializer):
    """Feedback response data structure"""
    feedback_id = serializers.UUIDField(help_text="Unique feedback identifier")
    tracking_id = serializers.CharField(help_text="Public tracking ID for status checks")
    status = serializers.CharField(help_text="Current status: pending, in_review, responded, resolved, closed")
    submitted_at = serializers.DateTimeField(help_text="Submission timestamp")
    location_path = serializers.CharField(help_text="Full location path")


class FeedbackSubmissionResponseSerializer(serializers.Serializer):
    """Complete response for authenticated feedback submission"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Feedback submitted successfully")
    data = FeedbackDataSerializer(help_text="Feedback submission details")


class AnonymousFeedbackDataSerializer(serializers.Serializer):
    """Anonymous feedback response data structure"""
    tracking_id = serializers.CharField(help_text="Public tracking ID for status checks")
    status = serializers.CharField(help_text="Current status")
    submitted_at = serializers.DateTimeField(help_text="Submission timestamp")
    location_path = serializers.CharField(help_text="Full location path")
    instructions = serializers.CharField(help_text="Instructions for tracking feedback")


class AnonymousFeedbackResponseSerializer(serializers.Serializer):
    """Complete response for anonymous feedback submission"""
    success = serializers.BooleanField(default=True)
    message = serializers.CharField(default="Anonymous feedback submitted successfully")
    data = AnonymousFeedbackDataSerializer(help_text="Anonymous feedback submission details")


class FeedbackTrackingResponseSerializer(serializers.Serializer):
    """Complete response for feedback tracking"""
    success = serializers.BooleanField(default=True)
    data = FeedbackTrackingSerializer(help_text="Feedback tracking information")


class FeedbackCategoryItemSerializer(serializers.Serializer):
    """Individual feedback category structure"""
    value = serializers.CharField(help_text="Category value used in API calls")
    label = serializers.CharField(help_text="Human-readable category name")
    description = serializers.CharField(help_text="Category description for users")


class FeedbackCategoriesResponseSerializer(serializers.Serializer):
    """Complete response for feedback categories"""
    success = serializers.BooleanField(default=True)
    categories = serializers.ListField(
        child=FeedbackCategoryItemSerializer(),
        help_text="List of available feedback categories"
    )


class ErrorResponseSerializer(serializers.Serializer):
    """Standard error response format"""
    success = serializers.BooleanField(default=False)
    message = serializers.CharField(help_text="Error description")
    errors = serializers.DictField(
        required=False,
        help_text="Detailed field-specific errors"
    )


# =============================================================================
# LEGACY SERIALIZERS (Keep for compatibility)
# =============================================================================

class FeedbackCategorySerializer(serializers.Serializer):
    """Legacy serializer for feedback categories"""
    value = serializers.CharField()
    label = serializers.CharField()
    description = serializers.CharField(required=False)
