# =============================================================================
# FILE: apps/api/serializers.py (ENHANCED WITH SWAGGER DOCS)
# =============================================================================
from rest_framework import serializers
from django.contrib.auth import authenticate
from drf_spectacular.utils import extend_schema_field
from apps.users.models import CustomUser, County, Location, verify_national_id
from apps.users.utils import validate_kenyan_national_id
from apps.core.anonymous import AnonymousSessionManager


class RegisterSerializer(serializers.Serializer):
    """
    🚀 User Registration with Kenyan National ID
    
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
    🔐 Login with Kenyan National ID
    
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
    👤 Create Anonymous Feedback Session
    
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


class UserProfileSerializer(serializers.ModelSerializer):
    """
    👤 User Profile Information
    
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
        # For national system, all users can see national data
        return []


class LocationSerializer(serializers.ModelSerializer):
    """
    📍 Location in Kenya's Administrative Hierarchy
    
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


class CountySerializer(serializers.ModelSerializer):
    """
    🏛️ County Information
    
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


class LogoutRequestSerializer(serializers.Serializer):
    """Logout request with refresh token"""
    refresh_token = serializers.CharField(
        help_text="JWT refresh token to blacklist",
        write_only=True
    )


class ProfileResponseSerializer(serializers.Serializer):
    """User profile response with permissions"""
    success = serializers.BooleanField(default=True)
    user = UserProfileSerializer(help_text="User profile data")
    app_config = serializers.DictField(
        help_text="Application configuration for frontend"
    )
    permissions = serializers.DictField(
        help_text="User permissions and data access scope"
    )


class LocationListResponseSerializer(serializers.Serializer):
    """Location hierarchy response"""
    success = serializers.BooleanField(default=True)
    locations = serializers.ListField(
        child=LocationSerializer(),
        help_text="List of locations in hierarchy"
    )
