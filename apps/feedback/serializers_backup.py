# =============================================================================
# FILE: apps/feedback/serializers.py (ENHANCED WITH AWARD-WINNING OPENAPI DOCS)
# =============================================================================
from rest_framework import serializers
from typing import Union
from django.utils import timezone
from django.db.models import Count, Avg
from drf_spectacular.utils import extend_schema_field, extend_schema_serializer
from drf_spectacular.openapi import OpenApiExample
from apps.users.models import County, Location
from apps.users.anonymous import AnonymousUserHandler
from apps.core.anonymous import AnonymousSessionManager
from .models import Feedback, FeedbackEdit, FeedbackResponse
from .validators import validate_feedback_title, validate_feedback_content, validate_location_hierarchy
from .utils import FeedbackRateLimit


# =============================================================================
# ENHANCED FIELD SERIALIZERS FOR FRONTEND DROPDOWNS
# =============================================================================







@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Pending Status",
            value={
                "value": "pending",
                "label": "Pending Review",
                "description": "Feedback received and awaiting initial review by government officials",
                "color": "#9E9E9E",
                "next_action": "Government official will review and categorize"
            }
        ),
        OpenApiExample(
            "Responded Status",
            value={
                "value": "responded", 
                "label": "Official Response",
                "description": "Government officials have provided a response or update",
                "color": "#2196F3",
                "next_action": "Citizen can track progress or provide additional information"
            }
        )
    ]
)
class StatusChoiceSerializer(serializers.Serializer):
    """📊 Feedback status workflow with clear progression"""
    
    value = serializers.CharField(help_text="Status key used in filtering")
    label = serializers.CharField(help_text="User-friendly status name")
    description = serializers.CharField(help_text="What this status means in the workflow")
    color = serializers.CharField(help_text="Status color for UI indicators")
    next_action = serializers.CharField(help_text="What happens next in this status")


# =============================================================================
# ENHANCED REQUEST SERIALIZERS WITH COMPREHENSIVE FIELD DOCUMENTATION
# =============================================================================

@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Road Infrastructure Feedback",
            summary="Citizen reporting poor road conditions",
            description="Example of a citizen reporting infrastructure issues with complete location hierarchy",
            value={
                "title": "Severe potholes on Kisumu-Kakamega Highway affecting daily commute",
                "content": "The road section between kilometer 15-20 has developed numerous large potholes that are damaging vehicles and causing traffic delays. During rainy season, these become dangerous water-filled hazards. This affects hundreds of commuters daily and local businesses are reporting reduced customer visits due to poor road access. Immediate repairs needed before the situation worsens.",
                "county_id": 1,
                "sub_county_id": 3,
                "ward_id": 12,
                "village_id": 45
            }
        ),
        OpenApiExample(
            "Healthcare Service Feedback",
            summary="Urgent healthcare facility issue",
            description="Example of urgent healthcare feedback requiring immediate attention",
            value={
                "title": "Medical equipment shortage at County Hospital emergency ward",
                "content": "The emergency ward at our county hospital has been without a functioning X-ray machine for two weeks. Patients requiring urgent diagnostics are being turned away or must travel 50km to the next facility. This is particularly challenging for accident victims and elderly patients. The broken equipment needs immediate repair or replacement to prevent potential loss of life.",
                "county_id": 1,
                "sub_county_id": 2,
                "ward_id": 8
            }
        )
    ]
)
class FeedbackSubmissionSerializer(serializers.ModelSerializer):
    """
    📝 **Authenticated User Feedback Submission**
    
    Citizens and government officials submit comprehensive feedback with full authentication.
    Supports Kenya's administrative hierarchy and role-based access validation.
    """
    
    county_id = serializers.IntegerField(
        write_only=True,
        help_text="🏛️ **County ID** where feedback applies. Must be accessible based on user permissions. Use `/api/locations/counties/` to get valid options.",
        style={'placeholder': '1'}
    )
    
    sub_county_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        write_only=True,
        help_text="🗺️ **Sub-County ID** (optional). Must belong to selected county. Use `/api/locations/hierarchy/?county_id=1&type=sub_county` to get options.",
        style={'placeholder': '3'}
    )
    
    ward_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        write_only=True,
        help_text="📍 **Ward ID** (optional). Must belong to selected sub-county. Use hierarchy endpoint with parent_id.",
        style={'placeholder': '12'}
    )
    
    village_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        write_only=True,
        help_text="🏘️ **Village ID** (optional). Most specific location level. Must belong to selected ward.",
        style={'placeholder': '45'}
    )
    
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="📋 **Clear, descriptive title** (optional). If not provided, will be auto-generated from content.",
        style={'placeholder': 'Poor road conditions causing traffic delays on Main Street'}
    )
    
    content = serializers.CharField(
        help_text="📝 **Detailed description** (minimum 50 characters). Include: What happened? Where exactly? When? How does it affect the community? What solution do you suggest?",
        style={
            'rows': 6, 
            'placeholder': 'Describe the issue in detail including location, impact on community, and suggested solutions...'
        }
    )
    

    
    is_anonymous = serializers.BooleanField(
        default=False,
        help_text="👤 **Anonymous Submission** - Submit this feedback anonymously even when logged in"
    )
    
    # Read-only response fields
    submitted_at = serializers.DateTimeField(
        source='created_at', 
        read_only=True,
        help_text="📅 **Submission Timestamp** - When your feedback was received"
    )
    location_path = serializers.CharField(
        source='get_location_path', 
        read_only=True,
        help_text="📍 **Full Location Path** - Complete administrative hierarchy (County > Sub-County > Ward > Village)"
    )
    
    class Meta:
        model = Feedback
        fields = [
            'title', 'content', 'is_anonymous',
            'county_id', 'sub_county_id', 'ward_id', 'village_id',
            'submitted_at', 'location_path'
        ]
    
    def validate_title(self, value):
        if value and value.strip():
            validate_feedback_title(value)
            return value.strip()
        return value
    
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
                raise serializers.ValidationError("🚫 You cannot submit feedback to this county based on your account permissions")
            
            return value
        except County.DoesNotExist:
            raise serializers.ValidationError("❌ Invalid county ID. Use /api/locations/counties/ to get valid options")
    
    def validate(self, attrs):
        """Cross-field validation with enhanced error messages"""
        # Get location objects
        county_id = attrs.get('county_id')
        sub_county_id = attrs.get('sub_county_id')
        ward_id = attrs.get('ward_id')
        village_id = attrs.get('village_id')
        
        try:
            county = County.objects.get(id=county_id)
            attrs['county'] = county
            
            # Validate location hierarchy with helpful error messages
            sub_county = None
            ward = None
            village = None
            
            if sub_county_id:
                try:
                    sub_county = Location.objects.get(
                        id=sub_county_id, 
                        type='sub_county', 
                        parent=county.location
                    )
                    attrs['sub_county'] = sub_county
                except Location.DoesNotExist:
                    raise serializers.ValidationError(f"❌ Sub-county ID {sub_county_id} does not belong to {county.name} county")
            
            if ward_id:
                if not sub_county:
                    raise serializers.ValidationError("❌ Ward selection requires a sub-county to be selected first")
                try:
                    ward = Location.objects.get(
                        id=ward_id, 
                        type='ward', 
                        parent=sub_county
                    )
                    attrs['ward'] = ward
                except Location.DoesNotExist:
                    raise serializers.ValidationError(f"❌ Ward ID {ward_id} does not belong to the selected sub-county")
            
            if village_id:
                if not ward:
                    raise serializers.ValidationError("❌ Village selection requires a ward to be selected first")
                try:
                    village = Location.objects.get(
                        id=village_id, 
                        type='village', 
                        parent=ward
                    )
                    attrs['village'] = village
                except Location.DoesNotExist:
                    raise serializers.ValidationError(f"❌ Village ID {village_id} does not belong to the selected ward")
            
            # Validate location hierarchy
            validate_location_hierarchy(county, sub_county, ward, village)
            
        except County.DoesNotExist:
            raise serializers.ValidationError("❌ Invalid county in location hierarchy")
        
        # Check rate limits with user-friendly messages
        user = self.context['request'].user
        can_submit, message = FeedbackRateLimit.check_citizen_limit(user)
        if not can_submit:
            if "10 per day" in message:
                raise serializers.ValidationError("⏰ You've reached your daily limit of 10 feedback submissions. Please try again tomorrow or contact support if you need to submit urgent feedback.")
            elif "50 per day" in message:
                raise serializers.ValidationError("⏰ You've reached your daily limit of 50 feedback submissions. Please try again tomorrow.")
            else:
                raise serializers.ValidationError(f"⏰ {message}")
        
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
        
        # Auto-generate title if not provided
        if not validated_data.get('title') or not validated_data['title'].strip():
            content = validated_data.get('content', '')
            category = validated_data.get('category', 'general')
            category_display = dict(FEEDBACK_CATEGORIES).get(category, 'General')
            
            # Generate title from first 50 characters of content
            if content:
                title_from_content = content[:50].strip()
                if len(content) > 50:
                    title_from_content += '...'
                validated_data['title'] = f"{category_display}: {title_from_content}"
            else:
                validated_data['title'] = f"{category_display} Feedback"
        
        # Create feedback
        feedback = Feedback.objects.create(
            user=self.context['request'].user,
            user_county=county,  # Use user_county field from model
            submitted_via='api',
            **validated_data
        )
        
        # Record submission for rate limiting
        FeedbackRateLimit.record_citizen_submission(self.context['request'].user)
        
        return feedback


@extend_schema_serializer(
    examples=[
        OpenApiExample(
            "Anonymous Infrastructure Report",
            summary="Anonymous citizen reporting without identity",
            description="Example of privacy-first feedback submission for sensitive issues",
            value={
                "session_id": "anon_sess_1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q",
                "title": "Corruption in local government office - bribery for permits",
                "content": "Citizens are being asked to pay unofficial fees for building permits at the county office. The official fee is KES 5000 but staff are demanding additional KES 2000 'processing fees' paid directly to them. This is happening at the permits desk during morning hours. Multiple citizens have experienced this but are afraid to report with their names due to fear of retaliation.",
                "category": "governance",
                "priority": "high", 
                "county_id": 1,
                "sub_county_id": 2
            }
        )
    ]
)
class AnonymousFeedbackSerializer(serializers.Serializer):
    """
    👤 **Anonymous Feedback Submission**
    
    Privacy-first feedback submission without revealing citizen identity.
    Perfect for sensitive reports about corruption, misconduct, or personal safety concerns.
    """
    
    session_id = serializers.CharField(
        max_length=64,
        help_text="🔐 **Anonymous Session ID** - Obtain from `/api/auth/anonymous/` endpoint. Required for privacy protection and rate limiting.",
        style={'placeholder': 'anon_sess_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p'}
    )
    
    title = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="📋 **Anonymous Report Title** (optional). If not provided, will be auto-generated from content.",
        style={'placeholder': 'Issue with public service - avoid personal details'}
    )
    
    content = serializers.CharField(
        help_text="📝 **Detailed Anonymous Report** (minimum 50 characters). Describe the issue thoroughly while protecting your identity. Avoid names, specific times, or details that could identify you.",
        style={
            'rows': 6,
            'placeholder': 'Describe the issue in detail while protecting your identity. Focus on facts and impact rather than personal details...'
        }
    )
    
    category = serializers.ChoiceField(
        choices=FEEDBACK_CATEGORIES,
        help_text="🏷️ **Category Selection** - Choose the area your anonymous report covers"
    )
    
    priority = serializers.ChoiceField(
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="⚡ **Priority Level** - Select urgency for anonymous report processing"
    )
    
    county_id = serializers.IntegerField(
        help_text="🏛️ **County ID** - Must match the county used when creating your anonymous session. Cannot be changed after session creation."
    )
    
    sub_county_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="🗺️ **Sub-County ID** (optional) - Additional location detail for your anonymous report"
    )
    
    ward_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="📍 **Ward ID** (optional) - More specific location if relevant to your report"
    )
    
    village_id = serializers.IntegerField(
        required=False, 
        allow_null=True,
        help_text="🏘️ **Village ID** (optional) - Most specific location level for your anonymous report"
    )
    
    def validate_session_id(self, value):
        """Validate anonymous session exists and can submit"""
        session_data = AnonymousSessionManager.get_session(value)
        if not session_data:
            raise serializers.ValidationError("❌ Invalid or expired anonymous session. Create a new session at /api/auth/anonymous/")
        
        can_submit, message = AnonymousSessionManager.can_submit(value)
        if not can_submit:
            if "maximum submissions" in message:
                raise serializers.ValidationError("⏰ You've reached the maximum submissions (3) for this anonymous session. Create a new session to submit more feedback.")
            else:
                raise serializers.ValidationError(f"❌ {message}")
        
        return value
    
    def validate_title(self, value):
        if value and value.strip():
            validate_feedback_title(value)
            return value.strip()
        return value
    
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
            raise serializers.ValidationError("❌ County must match the county used when creating your anonymous session")
        
        # Validate locations (same logic as authenticated feedback)
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
                    raise serializers.ValidationError("❌ Ward requires sub-county selection")
                ward = Location.objects.get(
                    id=ward_id, 
                    type='ward', 
                    parent=sub_county
                )
                attrs['ward'] = ward
            
            if village_id:
                if not ward:
                    raise serializers.ValidationError("❌ Village requires ward selection")
                village = Location.objects.get(
                    id=village_id, 
                    type='village', 
                    parent=ward
                )
                attrs['village'] = village
            
            validate_location_hierarchy(county, sub_county, ward, village)
            
        except (County.DoesNotExist, Location.DoesNotExist):
            raise serializers.ValidationError("❌ Invalid location hierarchy")
        
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
        
        # Auto-generate title if not provided
        if not validated_data.get('title') or not validated_data['title'].strip():
            content = validated_data.get('content', '')
            category = validated_data.get('category', 'general')
            category_display = dict(FEEDBACK_CATEGORIES).get(category, 'General')
            
            # Generate title from first 50 characters of content
            if content:
                title_from_content = content[:50].strip()
                if len(content) > 50:
                    title_from_content += '...'
                validated_data['title'] = f"{category_display}: {title_from_content}"
            else:
                validated_data['title'] = f"{category_display} Feedback"
        
        # Create or get anonymous user for this session
        anonymous_user = AnonymousUserHandler.create_anonymous_user(
            session_id, county.id, {
                'sub_county_id': sub_county.id if sub_county else None,
                'ward_id': ward.id if ward else None,
                'village_id': village.id if village else None,
            }
        )
        
        if not anonymous_user:
            raise serializers.ValidationError("❌ Failed to create anonymous user session")
        
        # Create feedback
        feedback = Feedback.objects.create(
            user=anonymous_user,
            user_county=county,  # Use user_county field from model
            is_anonymous=True,
            submitted_via='api',
            **validated_data
        )
        
        # Record submission for rate limiting
        FeedbackRateLimit.record_anonymous_submission(session_id)
        
        return feedback


# =============================================================================
# ENHANCED TRACKING AND RESPONSE SERIALIZERS
# =============================================================================

class FeedbackResponseSerializer(serializers.ModelSerializer):
    """📝 **Feedback Response** - Government official responses to feedback"""
    
    responder_name = serializers.CharField(source='responder.name', read_only=True)
    responder_role = serializers.CharField(source='responder.get_role_display', read_only=True)
    
    class Meta:
        model = FeedbackResponse
        fields = [
            'id', 'content', 'is_public', 'created_at',
            'responder_name', 'responder_role'
        ]


# Tracking functionality removed for scalability


# =============================================================================
# USER FEEDBACK MANAGEMENT SERIALIZERS (EXISTING ENHANCED)
# =============================================================================

class UserFeedbackListSerializer(serializers.ModelSerializer):
    """📋 **User's Feedback List** - Paginated view of citizen's own submissions"""
    
    location_path = serializers.CharField(source='get_location_path', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Edit/delete permissions
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    edit_restriction_reason = serializers.SerializerMethodField()
    delete_restriction_reason = serializers.SerializerMethodField()
    
    @extend_schema_field(serializers.BooleanField)
    def get_can_edit(self, obj) -> bool:
        can_edit, reason = obj.can_be_edited()
        return can_edit
    
    @extend_schema_field(serializers.BooleanField)
    def get_can_delete(self, obj) -> bool:
        can_delete, reason = obj.can_be_deleted()
        return can_delete
    
    @extend_schema_field(serializers.CharField)
    def get_edit_restriction_reason(self, obj) -> str:
        can_edit, reason = obj.can_be_edited()
        return None if can_edit else reason
    
    @extend_schema_field(serializers.CharField)
    def get_delete_restriction_reason(self, obj) -> str:
        can_delete, reason = obj.can_be_deleted()
        return None if can_delete else reason
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'content', 'category', 'category_display',
            'priority', 'priority_display',
            'created_at', 'updated_at', 'edited_at', 'edit_count',
            'view_count', 'location_path', 'can_edit', 'can_delete',
            'edit_restriction_reason', 'delete_restriction_reason', 'is_anonymous'
        ]
    def get_can_edit(self, obj):
        can_edit, reason = obj.can_be_edited()
        return can_edit
    
    def get_can_delete(self, obj):
        can_delete, reason = obj.can_be_deleted()
        return can_delete
    
    def get_edit_restriction_reason(self, obj):
        can_edit, reason = obj.can_be_edited()
        return None if can_edit else reason
    
    def get_delete_restriction_reason(self, obj):
        can_delete, reason = obj.can_be_deleted()
        return None if can_delete else reason


class FeedbackEditHistorySerializer(serializers.ModelSerializer):
    """📝 **Edit History** - Track all changes to feedback"""
    
    class Meta:
        model = FeedbackEdit
        fields = [
            'id', 'previous_title', 'previous_content', 'previous_category',
            'edit_reason', 'edited_at'
        ]


class UserFeedbackDetailSerializer(serializers.ModelSerializer):
    """🔍 **Detailed Feedback View** - Complete feedback information with history"""
    
    location_path = serializers.CharField(source='get_location_path', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Permissions
    can_edit = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    edit_restriction_reason = serializers.SerializerMethodField()
    delete_restriction_reason = serializers.SerializerMethodField()
    
    # Related data
    edit_history = FeedbackEditHistorySerializer(many=True, read_only=True)
    responses = FeedbackResponseSerializer(many=True, read_only=True)
    
    # Timeline data
    timeline = serializers.SerializerMethodField()
    
    class Meta:
        model = Feedback
        fields = [
            'id', 'title', 'content', 'category', 'category_display',
            'priority', 'priority_display',
            'created_at', 'updated_at', 'edited_at', 'edit_count',
            'view_count', 'location_path', 'can_edit', 'can_delete',
            'edit_restriction_reason', 'delete_restriction_reason',
            'edit_history', 'responses', 'timeline', 'is_anonymous'
        ]
    
    def get_can_edit(self, obj) -> bool:
        can_edit, reason = obj.can_be_edited()
        return can_edit
    
    def get_can_delete(self, obj) -> bool:
        can_delete, reason = obj.can_be_deleted()
        return can_delete
    
    def get_edit_restriction_reason(self, obj) -> Union[str, None]:
        can_edit, reason = obj.can_be_edited()
        return None if can_edit else reason
    
    def get_delete_restriction_reason(self, obj) -> Union[str, None]:
        can_delete, reason = obj.can_be_deleted()
        return None if can_delete else reason
    
    def get_timeline(self, obj):
        """Generate timeline of feedback events"""
        timeline = [
            {
                'action': 'submitted',
                'timestamp': obj.created_at.isoformat(),
                'description': 'Feedback submitted'
            }
        ]
        
        # Add edit events
        for edit in obj.edit_history.all():
            timeline.append({
                'action': 'edited',
                'timestamp': edit.edited_at.isoformat(),
                'description': f'Feedback edited (Edit #{obj.edit_history.filter(edited_at__lte=edit.edited_at).count()})'
            })
        
        # Add response events (if any responses exist)
        if obj.responses.exists():
            latest_response = obj.responses.first()
            timeline.append({
                'action': 'response_added',
                'timestamp': latest_response.created_at.isoformat(),
                'description': f'Official response added ({obj.responses.count()} responses total)'
            })
        
        # Sort by timestamp
        return sorted(timeline, key=lambda x: x['timestamp'])


class UserFeedbackUpdateSerializer(serializers.ModelSerializer):
    """✏️ **Update Feedback** - Edit existing feedback within allowed constraints"""
    
    edit_reason = serializers.CharField(
        max_length=200, 
        required=False, 
        write_only=True,
        help_text="📝 **Edit Reason** (optional) - Explain why you're making this change"
    )
    
    class Meta:
        model = Feedback
        fields = ['title', 'content', 'category', 'priority', 'edit_reason']
    
    def validate_title(self, value):
        from .validators import validate_feedback_title
        validate_feedback_title(value)
        return value.strip()
    
    def validate_content(self, value):
        from .validators import validate_feedback_content
        validate_feedback_content(value)
        return value.strip()
    
    def update(self, instance, validated_data):
        """Update feedback with edit tracking"""
        edit_reason = validated_data.pop('edit_reason', '')
        
        # Store previous data for history
        previous_data = {
            'title': instance.title,
            'content': instance.content,
            'category': instance.category,
        }
        
        # Update instance
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # Record edit
        instance.record_edit(previous_data)
        
        # Create edit history with reason
        if edit_reason:
            latest_edit = instance.edit_history.first()
            if latest_edit:
                latest_edit.edit_reason = edit_reason
                latest_edit.save(update_fields=['edit_reason'])
        
        return instance


# =============================================================================
# ENHANCED RESPONSE SERIALIZERS FOR SWAGGER DOCUMENTATION
# =============================================================================

class FeedbackDataSerializer(serializers.Serializer):
    """📤 **Feedback Response Data** - Successful submission response structure"""
    feedback_id = serializers.UUIDField(help_text="🆔 **Unique Feedback ID** - Internal database identifier")
    submitted_at = serializers.DateTimeField(help_text="📅 **Submission Time** - When feedback was received")
    location_path = serializers.CharField(help_text="📍 **Location** - Full administrative path")


class FeedbackSubmissionResponseSerializer(serializers.Serializer):
    """✅ **Successful Feedback Submission** - Complete authenticated submission response"""
    success = serializers.BooleanField(default=True, help_text="✅ **Success Flag** - Always true for successful submissions")
    message = serializers.CharField(default="Feedback submitted successfully", help_text="📝 **Success Message** - Confirmation text")
    data = FeedbackDataSerializer(help_text="📊 **Feedback Details** - Complete submission information")


class AnonymousFeedbackDataSerializer(serializers.Serializer):
    """👤 **Anonymous Submission Data** - Anonymous feedback response structure"""
    submitted_at = serializers.DateTimeField(help_text="📅 **Submission Time** - When received")
    location_path = serializers.CharField(help_text="📍 **Location** - Administrative path")
    message = serializers.CharField(help_text="💡 **Message** - Confirmation message for anonymous submission")


class AnonymousFeedbackResponseSerializer(serializers.Serializer):
    """✅ **Anonymous Submission Success** - Complete anonymous submission response"""
    success = serializers.BooleanField(default=True, help_text="✅ **Success Flag** - Submission successful")
    message = serializers.CharField(default="Anonymous feedback submitted successfully", help_text="📝 **Success Message**")
    data = AnonymousFeedbackDataSerializer(help_text="📊 **Anonymous Feedback Details**")


# Tracking response serializer removed


class FeedbackCategoriesResponseSerializer(serializers.Serializer):
    """📂 **Categories Response** - All available feedback categories"""
    success = serializers.BooleanField(default=True, help_text="✅ **Success Flag**")
    categories = serializers.ListField(
        child=FeedbackCategoryChoiceSerializer(),
        help_text="📋 **Category List** - All available feedback categories with details"
    )


class FeedbackErrorResponseSerializer(serializers.Serializer):
    """❌ **Error Response** - Standardized error format for feedback endpoints"""
    success = serializers.BooleanField(default=False, help_text="❌ **Error Flag** - Always false for errors")
    message = serializers.CharField(help_text="📝 **Error Message** - Brief error description")
    errors = serializers.DictField(
        required=False,
        help_text="🔍 **Field Errors** - Detailed validation errors by field name"
    )


class UserFeedbackStatsSerializer(serializers.Serializer):
    """📊 **User Feedback Statistics** - Comprehensive analytics for user's feedback"""
    
    total_submissions = serializers.IntegerField(help_text="Total number of feedback submissions")
    pending_count = serializers.IntegerField(help_text="Number of pending feedback items")
    in_review_count = serializers.IntegerField(help_text="Number of feedback items under review")
    responded_count = serializers.IntegerField(help_text="Number of feedback items with responses")
    resolved_count = serializers.IntegerField(help_text="Number of resolved feedback items")
    closed_count = serializers.IntegerField(help_text="Number of closed feedback items")
    monthly_breakdown = serializers.ListField(help_text="Monthly submission breakdown")
    category_breakdown = serializers.ListField(help_text="Breakdown by feedback category")
    average_response_days = serializers.FloatField(allow_null=True, help_text="Average response time in days")
    engagement = serializers.DictField(help_text="User engagement metrics")
    success_rate = serializers.FloatField(help_text="Percentage of successfully resolved feedback")


# =============================================================================
# LEGACY COMPATIBILITY SERIALIZERS
# =============================================================================

class FeedbackCategorySerializer(serializers.Serializer):
    """Legacy category serializer for backward compatibility"""
    value = serializers.CharField()
    label = serializers.CharField()
    description = serializers.CharField(required=False)

# # =============================================================================
# # FILE: apps/feedback/serializers.py 
# # =============================================================================
# from rest_framework import serializers
# from django.utils import timezone
# from django.db.models import Count, Avg
# from drf_spectacular.utils import extend_schema_field
# from apps.users.models import County, Location
# from apps.users.anonymous import AnonymousUserHandler
# from apps.core.anonymous import AnonymousSessionManager
# from .models import Feedback, FeedbackEdit, FEEDBACK_CATEGORIES
# from .validators import validate_feedback_title, validate_feedback_content, validate_location_hierarchy
# from .utils import FeedbackRateLimit


# # =============================================================================
# # REQUEST SERIALIZERS (For form data input)
# # =============================================================================

# class FeedbackSubmissionSerializer(serializers.ModelSerializer):
#     """
#     📝 Authenticated User Feedback Submission
    
#     Used for citizens and government officials to submit feedback with full authentication.
#     Supports complete location hierarchy and user access validation.
#     """
    
#     county_id = serializers.IntegerField(
#         write_only=True,
#         help_text="County ID where the feedback applies (must be accessible to user)"
#     )
#     sub_county_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Sub-county ID within the selected county"
#     )
#     ward_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Ward ID within the selected sub-county"
#     )
#     village_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Village ID within the selected ward"
#     )
    
#     title = serializers.CharField(
#         max_length=200,
#         help_text="Clear, descriptive title for the feedback (10-200 characters)",
#         style={'placeholder': 'Poor road conditions on main street'}
#     )
#     content = serializers.CharField(
#         help_text="Detailed description of the issue or feedback (minimum 50 characters)",
#         style={'rows': 4, 'placeholder': 'Please provide detailed information about the issue...'}
#     )
#     category = serializers.ChoiceField(
#         choices=FEEDBACK_CATEGORIES,
#         help_text="Category that best describes your feedback"
#     )
#     priority = serializers.ChoiceField(
#         choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
#         default='medium',
#         help_text="Priority level based on urgency and impact"
#     )
    
#     # Read-only fields for response
#     tracking_id = serializers.CharField(read_only=True)
#     submitted_at = serializers.DateTimeField(source='created_at', read_only=True)
#     location_path = serializers.CharField(source='get_location_path', read_only=True)
    
#     class Meta:
#         model = Feedback
#         fields = [
#             'title', 'content', 'category', 'priority',
#             'county_id', 'sub_county_id', 'ward_id', 'village_id',
#             'tracking_id', 'status', 'submitted_at', 'location_path'
#         ]
#         extra_kwargs = {
#             'status': {'read_only': True},
#         }
    
#     def validate_title(self, value):
#         validate_feedback_title(value)
#         return value.strip()
    
#     def validate_content(self, value):
#         validate_feedback_content(value)
#         return value.strip()
    
#     def validate_county_id(self, value):
#         """Validate county exists and user can access it"""
#         try:
#             county = County.objects.get(id=value)
#             user = self.context['request'].user
            
#             # Check if user can submit to this county
#             accessible_counties = user.get_accessible_counties()
#             if county not in accessible_counties:
#                 raise serializers.ValidationError("You cannot submit feedback to this county")
            
#             return value
#         except County.DoesNotExist:
#             raise serializers.ValidationError("Invalid county")
    
#     def validate(self, attrs):
#         """Cross-field validation"""
#         # Get location objects
#         county_id = attrs.get('county_id')
#         sub_county_id = attrs.get('sub_county_id')
#         ward_id = attrs.get('ward_id')
#         village_id = attrs.get('village_id')
        
#         try:
#             county = County.objects.get(id=county_id)
#             attrs['county'] = county
            
#             # Validate location hierarchy
#             sub_county = None
#             ward = None
#             village = None
            
#             if sub_county_id:
#                 sub_county = Location.objects.get(
#                     id=sub_county_id, 
#                     type='sub_county', 
#                     parent=county.location
#                 )
#                 attrs['sub_county'] = sub_county
            
#             if ward_id:
#                 if not sub_county:
#                     raise serializers.ValidationError("Ward requires sub-county selection")
#                 ward = Location.objects.get(
#                     id=ward_id, 
#                     type='ward', 
#                     parent=sub_county
#                 )
#                 attrs['ward'] = ward
            
#             if village_id:
#                 if not ward:
#                     raise serializers.ValidationError("Village requires ward selection")
#                 village = Location.objects.get(
#                     id=village_id, 
#                     type='village', 
#                     parent=ward
#                 )
#                 attrs['village'] = village
            
#             # Validate location hierarchy
#             validate_location_hierarchy(county, sub_county, ward, village)
            
#         except Location.DoesNotExist:
#             raise serializers.ValidationError("Invalid location hierarchy")
        
#         # Check rate limits
#         user = self.context['request'].user
#         can_submit, message = FeedbackRateLimit.check_citizen_limit(user)
#         if not can_submit:
#             raise serializers.ValidationError(message)
        
#         return attrs
    
#     def create(self, validated_data):
#         """Create feedback with proper relationships"""
#         # Extract location objects
#         county = validated_data.pop('county')
#         sub_county = validated_data.pop('sub_county', None)
#         ward = validated_data.pop('ward', None)
#         village = validated_data.pop('village', None)
        
#         # Remove _id fields
#         validated_data.pop('county_id', None)
#         validated_data.pop('sub_county_id', None)
#         validated_data.pop('ward_id', None)
#         validated_data.pop('village_id', None)
        
#         # Create feedback
#         feedback = Feedback.objects.create(
#             user=self.context['request'].user,
#             county=county,
#             sub_county=sub_county,
#             ward=ward,
#             village=village,
#             submitted_via='api',
#             **validated_data
#         )
        
#         # Record submission for rate limiting
#         FeedbackRateLimit.record_citizen_submission(self.context['request'].user)
        
#         return feedback


# class AnonymousFeedbackSerializer(serializers.Serializer):
#     """
#     👤 Anonymous Feedback Submission
    
#     Used for privacy-first feedback submission without requiring user registration.
#     Links to anonymous sessions for rate limiting and validation.
#     """
    
#     session_id = serializers.CharField(
#         max_length=64,
#         help_text="Anonymous session ID obtained from /api/auth/anonymous/"
#     )
#     title = serializers.CharField(
#         max_length=200,
#         help_text="Clear, descriptive title for the feedback",
#         style={'placeholder': 'Issue with public service'}
#     )
#     content = serializers.CharField(
#         help_text="Detailed description of the issue (minimum 50 characters)",
#         style={'rows': 4}
#     )
#     category = serializers.ChoiceField(
#         choices=FEEDBACK_CATEGORIES,
#         help_text="Category that best describes the feedback"
#     )
#     priority = serializers.ChoiceField(
#         choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High'), ('urgent', 'Urgent')],
#         default='medium',
#         help_text="Priority level of the feedback"
#     )
#     county_id = serializers.IntegerField(
#         help_text="Must match the county ID used when creating the anonymous session"
#     )
#     sub_county_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Sub-county ID"
#     )
#     ward_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Ward ID"
#     )
#     village_id = serializers.IntegerField(
#         required=False, 
#         allow_null=True,
#         help_text="Optional: Village ID"
#     )
    
#     def validate_session_id(self, value):
#         """Validate anonymous session exists and can submit"""
#         session_data = AnonymousSessionManager.get_session(value)
#         if not session_data:
#             raise serializers.ValidationError("Invalid or expired session")
        
#         can_submit, message = AnonymousSessionManager.can_submit(value)
#         if not can_submit:
#             raise serializers.ValidationError(message)
        
#         return value
    
#     def validate_title(self, value):
#         validate_feedback_title(value)
#         return value.strip()
    
#     def validate_content(self, value):
#         validate_feedback_content(value)
#         return value.strip()
    
#     def validate(self, attrs):
#         """Validate location hierarchy and session county match"""
#         session_id = attrs['session_id']
#         county_id = attrs['county_id']
        
#         # Get session data
#         session_data = AnonymousSessionManager.get_session(session_id)
#         if session_data['county_id'] != county_id:
#             raise serializers.ValidationError("County must match session county")
        
#         # Validate locations
#         try:
#             county = County.objects.get(id=county_id)
#             attrs['county'] = county
            
#             # Same location validation as authenticated feedback
#             sub_county_id = attrs.get('sub_county_id')
#             ward_id = attrs.get('ward_id')
#             village_id = attrs.get('village_id')
            
#             sub_county = None
#             ward = None
#             village = None
            
#             if sub_county_id:
#                 sub_county = Location.objects.get(
#                     id=sub_county_id, 
#                     type='sub_county', 
#                     parent=county.location
#                 )
#                 attrs['sub_county'] = sub_county
            
#             if ward_id:
#                 if not sub_county:
#                     raise serializers.ValidationError("Ward requires sub-county selection")
#                 ward = Location.objects.get(
#                     id=ward_id, 
#                     type='ward', 
#                     parent=sub_county
#                 )
#                 attrs['ward'] = ward
            
#             if village_id:
#                 if not ward:
#                     raise serializers.ValidationError("Village requires ward selection")
#                 village = Location.objects.get(
#                     id=village_id, 
#                     type='village', 
#                     parent=ward
#                 )
#                 attrs['village'] = village
            
#             validate_location_hierarchy(county, sub_county, ward, village)
            
#         except (County.DoesNotExist, Location.DoesNotExist):
#             raise serializers.ValidationError("Invalid location hierarchy")
        
#         return attrs
    
#     def create(self, validated_data):
#         """Create anonymous feedback"""
#         session_id = validated_data.pop('session_id')
#         county = validated_data.pop('county')
#         sub_county = validated_data.pop('sub_county', None)
#         ward = validated_data.pop('ward', None)
#         village = validated_data.pop('village', None)
        
#         # Remove _id fields
#         validated_data.pop('county_id', None)
#         validated_data.pop('sub_county_id', None)
#         validated_data.pop('ward_id', None)
#         validated_data.pop('village_id', None)
        
#         # Create or get anonymous user for this session
#         anonymous_user = AnonymousUserHandler.create_anonymous_user(
#             session_id, county.id, {
#                 'sub_county_id': sub_county.id if sub_county else None,
#                 'ward_id': ward.id if ward else None,
#                 'village_id': village.id if village else None,
#             }
#         )
        
#         if not anonymous_user:
#             raise serializers.ValidationError("Failed to create anonymous user")
        
#         # Create feedback
#         feedback = Feedback.objects.create(
#             user=anonymous_user,
#             county=county,
#             sub_county=sub_county,
#             ward=ward,
#             village=village,
#             is_anonymous=True,
#             submitted_via='api',
#             **validated_data
#         )
        
#         # Record submission for rate limiting
#         FeedbackRateLimit.record_anonymous_submission(session_id)
        
#         return feedback


# class FeedbackTrackingSerializer(serializers.ModelSerializer):
#     """
#     🔍 Feedback Status Tracking
    
#     Public serializer for tracking feedback status without exposing sensitive information.
#     Works for both authenticated and anonymous feedback.
#     """
    
#     submitted_at = serializers.DateTimeField(
#         source='created_at', 
#         read_only=True,
#         help_text="When the feedback was originally submitted"
#     )
#     location_path = serializers.CharField(
#         source='get_location_path', 
#         read_only=True,
#         help_text="Full location path: 'County > Sub-County > Ward > Village'"
#     )
#     category_display = serializers.CharField(
#         source='get_category_display', 
#         read_only=True,
#         help_text="Human-readable category name"
#     )
#     status_display = serializers.CharField(
#         source='get_status_display', 
#         read_only=True,
#         help_text="Human-readable status description"
#     )
    
#     class Meta:
#         model = Feedback
#         fields = [
#             'tracking_id', 'title', 'category', 'category_display',
#             'status', 'status_display', 'submitted_at', 
#             'location_path', 'response_count', 'last_response_at'
#         ]


# class UserFeedbackListSerializer(serializers.ModelSerializer):
#     """Serializer for user's feedback list view"""
    
#     location_path = serializers.CharField(source='get_location_path', read_only=True)
#     category_display = serializers.CharField(source='get_category_display', read_only=True)
#     status_display = serializers.CharField(source='get_status_display', read_only=True)
#     priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
#     # Edit/delete permissions
#     can_edit = serializers.SerializerMethodField()
#     can_delete = serializers.SerializerMethodField()
#     edit_restriction_reason = serializers.SerializerMethodField()
#     delete_restriction_reason = serializers.SerializerMethodField()
    
#     class Meta:
#         model = Feedback
#         fields = [
#             'id', 'tracking_id', 'title', 'category', 'category_display',
#             'priority', 'priority_display', 'status', 'status_display',
#             'created_at', 'updated_at', 'edited_at', 'edit_count',
#             'response_count', 'last_response_at', 'view_count',
#             'location_path', 'can_edit', 'can_delete',
#             'edit_restriction_reason', 'delete_restriction_reason'
#         ]
    
#     def get_can_edit(self, obj):
#         can_edit, reason = obj.can_be_edited()
#         return can_edit
    
#     def get_can_delete(self, obj):
#         can_delete, reason = obj.can_be_deleted()
#         return can_delete
    
#     def get_edit_restriction_reason(self, obj):
#         can_edit, reason = obj.can_be_edited()
#         return None if can_edit else reason
    
#     def get_delete_restriction_reason(self, obj):
#         can_delete, reason = obj.can_be_deleted()
#         return None if can_delete else reason


# class FeedbackEditHistorySerializer(serializers.ModelSerializer):
#     """Serializer for feedback edit history"""
    
#     class Meta:
#         model = FeedbackEdit
#         fields = [
#             'id', 'previous_title', 'previous_content', 'previous_category',
#             'edit_reason', 'edited_at'
#         ]


# class UserFeedbackDetailSerializer(serializers.ModelSerializer):
#     """Detailed serializer for single feedback view"""
    
#     location_path = serializers.CharField(source='get_location_path', read_only=True)
#     category_display = serializers.CharField(source='get_category_display', read_only=True)
#     status_display = serializers.CharField(source='get_status_display', read_only=True)
#     priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
#     # Permissions
#     can_edit = serializers.SerializerMethodField()
#     can_delete = serializers.SerializerMethodField()
#     edit_restriction_reason = serializers.SerializerMethodField()
#     delete_restriction_reason = serializers.SerializerMethodField()
    
#     # Related data
#     edit_history = FeedbackEditHistorySerializer(many=True, read_only=True)
#     # responses = FeedbackResponseSerializer(many=True, read_only=True)  # Future implementation
    
#     # Timeline data
#     timeline = serializers.SerializerMethodField()
    
#     class Meta:
#         model = Feedback
#         fields = [
#             'id', 'tracking_id', 'title', 'content', 'category', 'category_display',
#             'priority', 'priority_display', 'status', 'status_display',
#             'created_at', 'updated_at', 'edited_at', 'edit_count',
#             'response_count', 'last_response_at', 'view_count',
#             'location_path', 'can_edit', 'can_delete',
#             'edit_restriction_reason', 'delete_restriction_reason',
#             'edit_history', 'timeline'
#         ]
    
#     def get_can_edit(self, obj):
#         can_edit, reason = obj.can_be_edited()
#         return can_edit
    
#     def get_can_delete(self, obj):
#         can_delete, reason = obj.can_be_deleted()
#         return can_delete
    
#     def get_edit_restriction_reason(self, obj):
#         can_edit, reason = obj.can_be_edited()
#         return None if can_edit else reason
    
#     def get_delete_restriction_reason(self, obj):
#         can_delete, reason = obj.can_be_deleted()
#         return None if can_delete else reason
    
#     def get_timeline(self, obj):

#         """Generate timeline of feedback events"""
#         timeline = [
#             {
#                 'action': 'submitted',
#                 'timestamp': obj.created_at.isoformat(),
#                 'description': 'Feedback submitted'
#             }
#         ]
        
#         # Add edit events
#         for edit in obj.edit_history.all():
#             timeline.append({
#                 'action': 'edited',
#                 'timestamp': edit.edited_at.isoformat(),
#                 'description': f'Feedback edited (Edit #{obj.edit_history.filter(edited_at__lte=edit.edited_at).count()})'
#             })
        
#         # Add status changes (simplified - could be enhanced with status history)
#         if obj.status != 'pending':
#             timeline.append({
#                 'action': 'status_changed',
#                 'timestamp': obj.updated_at.isoformat(),
#                 'description': f'Status changed to {obj.get_status_display()}'
#             })
        
#         # Add response events
#         if obj.last_response_at:
#             timeline.append({
#                 'action': 'response_added',
#                 'timestamp': obj.last_response_at.isoformat(),
#                 'description': f'Official response added ({obj.response_count} responses total)'
#             })
        
#         # Sort by timestamp
#         return sorted(timeline, key=lambda x: x['timestamp'])


# class UserFeedbackUpdateSerializer(serializers.ModelSerializer):
#     """Serializer for updating user's feedback"""
    
#     edit_reason = serializers.CharField(max_length=200, required=False, write_only=True)
    
#     class Meta:
#         model = Feedback
#         fields = ['title', 'content', 'category', 'priority', 'edit_reason']
    
#     def validate_title(self, value):
#         from .validators import validate_feedback_title
#         validate_feedback_title(value)
#         return value.strip()
    
#     def validate_content(self, value):
#         from .validators import validate_feedback_content
#         validate_feedback_content(value)
#         return value.strip()
    
#     def update(self, instance, validated_data):
#         """Update feedback with edit tracking"""
#         edit_reason = validated_data.pop('edit_reason', '')
        
#         # Store previous data for history
#         previous_data = {
#             'title': instance.title,
#             'content': instance.content,
#             'category': instance.category,
#         }
        
#         # Update instance
#         for attr, value in validated_data.items():
#             setattr(instance, attr, value)
        
#         # Record edit
#         instance.record_edit(previous_data)
        
#         # Create edit history with reason
#         if edit_reason:
#             latest_edit = instance.edit_history.first()
#             if latest_edit:
#                 latest_edit.edit_reason = edit_reason
#                 latest_edit.save(update_fields=['edit_reason'])
        
#         return instance


# # =============================================================================
# # RESPONSE SERIALIZERS (For Swagger documentation)
# # =============================================================================

# class FeedbackDataSerializer(serializers.Serializer):
#     """Feedback response data structure"""
#     feedback_id = serializers.UUIDField(help_text="Unique feedback identifier")
#     tracking_id = serializers.CharField(help_text="Public tracking ID for status checks")
#     status = serializers.CharField(help_text="Current status: pending, in_review, responded, resolved, closed")
#     submitted_at = serializers.DateTimeField(help_text="Submission timestamp")
#     location_path = serializers.CharField(help_text="Full location path")


# class FeedbackSubmissionResponseSerializer(serializers.Serializer):
#     """Complete response for authenticated feedback submission"""
#     success = serializers.BooleanField(default=True)
#     message = serializers.CharField(default="Feedback submitted successfully")
#     data = FeedbackDataSerializer(help_text="Feedback submission details")


# class AnonymousFeedbackDataSerializer(serializers.Serializer):
#     """Anonymous feedback response data structure"""
#     tracking_id = serializers.CharField(help_text="Public tracking ID for status checks")
#     status = serializers.CharField(help_text="Current status")
#     submitted_at = serializers.DateTimeField(help_text="Submission timestamp")
#     location_path = serializers.CharField(help_text="Full location path")
#     instructions = serializers.CharField(help_text="Instructions for tracking feedback")


# class AnonymousFeedbackResponseSerializer(serializers.Serializer):
#     """Complete response for anonymous feedback submission"""
#     success = serializers.BooleanField(default=True)
#     message = serializers.CharField(default="Anonymous feedback submitted successfully")
#     data = AnonymousFeedbackDataSerializer(help_text="Anonymous feedback submission details")


# class FeedbackTrackingResponseSerializer(serializers.Serializer):
#     """Complete response for feedback tracking"""
#     success = serializers.BooleanField(default=True)
#     data = FeedbackTrackingSerializer(help_text="Feedback tracking information")


# class FeedbackCategoryItemSerializer(serializers.Serializer):
#     """Individual feedback category structure"""
#     value = serializers.CharField(help_text="Category value used in API calls")
#     label = serializers.CharField(help_text="Human-readable category name")
#     description = serializers.CharField(help_text="Category description for users")


# class FeedbackCategoriesResponseSerializer(serializers.Serializer):
#     """Complete response for feedback categories"""
#     success = serializers.BooleanField(default=True)
#     categories = serializers.ListField(
#         child=FeedbackCategoryItemSerializer(),
#         help_text="List of available feedback categories"
#     )


# class ErrorResponseSerializer(serializers.Serializer):
#     """Standard error response format"""
#     success = serializers.BooleanField(default=False)
#     message = serializers.CharField(help_text="Error description")
#     errors = serializers.DictField(
#         required=False,
#         help_text="Detailed field-specific errors"
#     )


# # =============================================================================
# # LEGACY SERIALIZERS (Keep for compatibility)
# # =============================================================================

# class FeedbackCategorySerializer(serializers.Serializer):
#     """Legacy serializer for feedback categories"""
#     value = serializers.CharField()
#     label = serializers.CharField()
#     description = serializers.CharField(required=False)