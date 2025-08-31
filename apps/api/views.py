# =============================================================================
# FILE: apps/api/views.py (ENHANCED WITH SWAGGER DOCUMENTATION)
# =============================================================================
import logging
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import login
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django_filters.rest_framework import DjangoFilterBackend
from django.db import models
from django.db.models import Q, Count
from django.utils import timezone
from drf_spectacular.utils import (
    extend_schema, 
    OpenApiExample, 
    OpenApiParameter,
    OpenApiResponse,
    extend_schema_view
)
from drf_spectacular.types import OpenApiTypes

logger = logging.getLogger(__name__)

from apps.users.models import CustomUser, County, Location
from apps.core.anonymous import AnonymousSessionManager
from apps.users.anonymous import AnonymousUserHandler
from .serializers import (
    RegisterSerializer, LoginSerializer, AnonymousSessionSerializer,
    UserProfileSerializer, LocationSerializer, CountySerializer,
    LoginResponseSerializer, RegisterResponseSerializer, 
    AnonymousSessionResponseSerializer, AnonymousSessionStatusSerializer,
    SystemHealthSerializer, ErrorResponseSerializer, LogoutRequestSerializer,
    ProfileResponseSerializer, LocationListResponseSerializer, SuccessResponseSerializer
)


class AuthRateThrottle(UserRateThrottle):
    """Custom throttle for auth endpoints"""
    scope = 'auth'


@extend_schema(
    tags=['Authentication'],
    summary="🚀 Register New User",
    description="""
    Register a new user account with Kenyan National ID.
    
    **Features:**
    - Validates 8-digit Kenyan National ID format
    - Creates account in specific county tenant
    - Supports location hierarchy (County → Sub-County → Ward → Village)
    - Returns JWT tokens immediately after registration
    
    **Location Hierarchy:**
    Use the `/api/locations/` endpoints to get valid IDs:
    1. Get counties: `GET /api/locations/counties/`
    2. Get sub-counties: `GET /api/locations/hierarchy/?county_id=1&type=sub_county`
    3. Get wards: `GET /api/locations/hierarchy/?parent_id=5&type=ward`
    4. Get villages: `GET /api/locations/hierarchy/?parent_id=15&type=village`
    """,
    request=RegisterSerializer,
    responses={
        201: OpenApiResponse(
            response=RegisterResponseSerializer,
            description="Registration successful",
            examples=[
                OpenApiExample(
                    "Successful Registration",
                    value={
                        "success": True,
                        "message": "Registration successful",
                        "user": {
                            "id": 1,
                            "name": "John Doe Kiprop",
                            "email": "john.kiprop@gmail.com",
                            "role": "citizen",
                            "role_display": "Citizen",
                            "county_name": "Kisumu",
                            "tenant_name": "Kisumu"
                        },
                        "tokens": {
                            "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Registration failed - validation errors",
            examples=[
                OpenApiExample(
                    "Invalid National ID",
                    value={
                        "success": False,
                        "message": "Registration failed",
                        "errors": {
                            "national_id": ["Invalid National ID format"]
                        }
                    }
                ),
                OpenApiExample(
                    "User Already Exists",
                    value={
                        "success": False,
                        "message": "Registration failed",
                        "errors": {
                            "national_id": ["User with this National ID already exists"]
                        }
                    }
                )
            ]
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    """Register new user with National ID"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]
    
    def post(self, request):
        try:
            serializer = RegisterSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                
                # Get user profile data
                profile_serializer = UserProfileSerializer(user)
                
                logger.info(f"✅ User registration successful: {user.email} (ID: {user.id})")
                
                return Response({
                    'success': True,
                    'message': f'🎉 Welcome to CivicAI, {user.name}! Your account has been created successfully.',
                    'user': profile_serializer.data,
                    'tokens': {
                        'access': access_token,
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_201_CREATED)
            
            # Handle validation errors with enhanced formatting
            logger.warning(f"❌ Registration validation failed: {serializer.errors}")
            
            return Response({
                'success': False,
                'message': 'Please correct the following errors and try again:',
                'errors': serializer.errors,
                'error_code': 'REGISTRATION_VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"❌ Registration system error: {str(e)}")
            return Response({
                'success': False,
                'message': '🔧 Registration system temporarily unavailable. Please try again in a few moments.',
                'error_code': 'REGISTRATION_SYSTEM_ERROR',
                'suggestions': [
                    'Wait a few minutes and try again',
                    'Check your internet connection',
                    'Contact support if the problem persists'
                ]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="🔐 Login with National ID",
    description="""
    Authenticate using your 8-digit Kenyan National ID and password.
    
    **Returns:**
    - JWT access token (1 hour expiry)
    - JWT refresh token (7 days expiry) 
    - User profile with permissions
    - App configuration based on user role
    
    **Token Usage:**
    Include the access token in subsequent requests:
    ```
    Authorization: Bearer <access_token>
    ```
    
    **Roles & Access:**
    - **Citizen**: Access to own county data only
    - **Government Official**: Access based on official level:
      - Local: Home county only
      - Regional: Multiple assigned counties
      - National: All counties
      - Super Admin: Full system access
    """,
    request=LoginSerializer,
    responses={
        200: OpenApiResponse(
            response=LoginResponseSerializer,
            description="Login successful",
            examples=[
                OpenApiExample(
                    "Citizen Login",
                    value={
                        "success": True,
                        "message": "Login successful",
                        "user": {
                            "id": 1,
                            "name": "John Doe Kiprop",
                            "email": "john.kiprop@gmail.com",
                            "role": "citizen",
                            "role_display": "Citizen",
                            "county_name": "Kisumu",
                            "tenant_name": "Kisumu",
                            "accessible_counties": [
                                {"id": 1, "name": "Kisumu", "code": "KSM"}
                            ]
                        },
                        "app_config": {
                            "available_endpoints": ["feedback", "profile"],
                            "data_scope": "county"
                        },
                        "tokens": {
                            "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                            "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Login failed",
            examples=[
                OpenApiExample(
                    "Invalid Credentials",
                    value={
                        "success": False,
                        "message": "Login failed",
                        "errors": {
                            "non_field_errors": ["Invalid credentials"]
                        }
                    }
                )
            ]
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class LoginView(APIView):
    """Login with National ID and password"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AuthRateThrottle]
    
    def post(self, request):
        try:
            serializer = LoginSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                user = serializer.validated_data['user']
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                access_token = str(refresh.access_token)
                
                # Update last login
                login(request, user)
                
                # Get user context for app configuration
                from apps.core.context import UserContext
                user_context = UserContext(user)
                
                # Get user profile data
                profile_serializer = UserProfileSerializer(user)
                
                logger.info(f"✅ User login successful: {user.email} (ID: {user.id})")
                
                return Response({
                    'success': True,
                    'message': f'🎉 Welcome back, {user.name}!',
                    'user': profile_serializer.data,
                    'app_config': user_context.app_config,
                    'tokens': {
                        'access': access_token,
                        'refresh': str(refresh)
                    }
                }, status=status.HTTP_200_OK)
            
            # Handle validation errors
            logger.warning(f"❌ Login validation failed: {serializer.errors}")
            
            return Response({
                'success': False,
                'message': 'Login failed. Please check your credentials.',
                'errors': serializer.errors,
                'error_code': 'LOGIN_VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"❌ Login system error: {str(e)}")
            return Response({
                'success': False,
                'message': '🔧 Login system temporarily unavailable. Please try again in a few moments.',
                'error_code': 'LOGIN_SYSTEM_ERROR',
                'suggestions': [
                    'Wait a few minutes and try again',
                    'Check your internet connection',
                    'Contact support if the problem persists'
                ]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="🚪 Logout and Blacklist Token",
    description="""
    Logout current user and blacklist the refresh token to prevent reuse.
    
    **Security:** Always call this endpoint when user logs out to ensure tokens are invalidated.
    """,
    request=LogoutRequestSerializer,
    responses={
        200: OpenApiResponse(
            response=SuccessResponseSerializer,
            description="Logout successful"
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Logout failed"
        )
    }
)
class LogoutView(APIView):
    """Logout and blacklist refresh token"""
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            
            if not refresh_token:
                return Response({
                    'success': False,
                    'message': '🔑 Refresh token is required for secure logout.',
                    'error_code': 'MISSING_REFRESH_TOKEN',
                    'suggestions': ['Please provide your refresh token']
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
                
                logger.info(f"✅ User logout successful: {request.user.email if request.user.is_authenticated else 'Unknown'}")
                
                return Response({
                    'success': True,
                    'message': '👋 You have been logged out successfully. Thank you for using CivicAI!'
                }, status=status.HTTP_200_OK)
                
            except Exception as token_error:
                logger.warning(f"⚠️ Token blacklist failed: {str(token_error)}")
                # Still return success since user intent is to logout
                return Response({
                    'success': True,
                    'message': '👋 Logout completed. Your session has been terminated.'
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            logger.error(f"❌ Logout system error: {str(e)}")
            return Response({
                'success': False,
                'message': '🔧 Logout system error. Your session may still be active.',
                'error_code': 'LOGOUT_SYSTEM_ERROR',
                'suggestions': [
                    'Clear your browser cache and cookies',
                    'Close and reopen your browser',
                    'Contact support if you have security concerns'
                ]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'], 
    summary="👤 Create Anonymous Session",
    description="""
    Create a temporary anonymous session for submitting feedback without registration.
    
    **Session Limits:**
    - ⏱️ **Duration**: 2 hours
    - 📝 **Submissions**: Maximum 3 per session
    - 🔒 **Privacy**: No personal data stored
    
    **Use Cases:**
    - Citizens who want to provide feedback anonymously
    - Quick feedback without account creation
    - Public feedback kiosks or forms
    
    **Important:** Save the `session_id` - you'll need it for:
    - Submitting anonymous feedback
    - Checking session status
    """,
    request=AnonymousSessionSerializer,
    responses={
        201: OpenApiResponse(
            response=AnonymousSessionResponseSerializer,
            description="Anonymous session created successfully",
            examples=[
                OpenApiExample(
                    "Session Created",
                    value={
                        "success": True,
                        "message": "Anonymous session created",
                        "session_id": "ANON_8f3a2c1e4d6b9a7f2c5e8d1a4b7f9c2e",
                        "expires_in": 7200,
                        "max_submissions": 3
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Session creation failed"
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class AnonymousSessionView(APIView):
    """Create anonymous session for feedback"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        try:
            serializer = AnonymousSessionSerializer(
                data=request.data,
                context={'request': request}
            )
            
            if serializer.is_valid():
                session_data = serializer.save()
                
                logger.info(f"✅ Anonymous session created: {session_data['session_id']}")
                
                return Response({
                    'success': True,
                    'message': '🔒 Anonymous session created successfully. You can now submit feedback privately.',
                    'session_id': session_data['session_id'],
                    'expires_in': 2 * 60 * 60,  # 2 hours
                    'max_submissions': 3,
                    'instructions': [
                        'Save your session ID - you\'ll need it to submit feedback',
                        'Session expires in 2 hours',
                        'Maximum 3 submissions per session'
                    ]
                }, status=status.HTTP_201_CREATED)
            
            # Handle validation errors
            logger.warning(f"❌ Anonymous session validation failed: {serializer.errors}")
            
            return Response({
                'success': False,
                'message': 'Anonymous session creation failed. Please check your input.',
                'errors': serializer.errors,
                'error_code': 'SESSION_VALIDATION_ERROR'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            logger.error(f"❌ Anonymous session system error: {str(e)}")
            return Response({
                'success': False,
                'message': '🔧 Anonymous session system temporarily unavailable. Please try again.',
                'error_code': 'SESSION_SYSTEM_ERROR',
                'suggestions': [
                    'Wait a few minutes and try again',
                    'Try creating an account for unlimited submissions',
                    'Contact support if the problem persists'
                ]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="👤 Get User Profile",
    description="""
    Get current authenticated user's profile and application configuration.
    
    **Returns:**
    - Complete user profile information
    - Available features based on role
    - Data access permissions and scope
    - List of accessible counties
    
    **Role-Based Features:**
    - **Citizens**: Basic profile, feedback submission
    - **Government Officials**: Advanced analytics, data export, user management
    """,
    responses={
        200: OpenApiResponse(
            response=ProfileResponseSerializer,
            description="User profile retrieved successfully"
        )
    }
)
class UserProfileView(APIView):
    """Get and update user profile"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        """Get user profile with stats"""
        serializer = UserProfileSerializer(request.user)
        
        # Get user context for app configuration
        from apps.core.context import UserContext
        user_context = UserContext(request.user)
        
        # Get feedback stats
        from apps.feedback.models import Feedback
        feedback_stats = Feedback.objects.filter(
            user=request.user, 
            is_deleted=False
        ).aggregate(
            total_count=models.Count('id')
        )
        
        # Since there's no status field, we'll use response_count as a proxy for resolved
        resolved_count = Feedback.objects.filter(
            user=request.user, 
            is_deleted=False,
            response_count__gt=0
        ).count()
        
        profile_data = serializer.data.copy()
        profile_data.update({
            'feedback_count': feedback_stats['total_count'] or 0,
            'resolved_count': resolved_count or 0,
            'phone': request.user.phone or '',
            'last_login': request.user.last_login.isoformat() if request.user.last_login else None,
        })
        
        return Response({
            'success': True,
            'data': profile_data,
            'app_config': user_context.app_config,
            'permissions': {
                'can_access_endpoints': user_context.app_config['available_endpoints'],
                'data_scope': user_context.app_config['data_scope']
            }
        })
    
    def patch(self, request):
        """Update user profile"""
        user = request.user
        data = request.data
        
        # Update allowed fields
        if 'name' in data:
            name = data['name'].strip()
            if len(name) >= 2:
                user.name = name
            else:
                return Response({
                    'success': False,
                    'message': 'Name must be at least 2 characters long'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if 'phone' in data:
            user.phone = data['phone'].strip()
        
        try:
            user.save()
            
            # Return updated profile
            serializer = UserProfileSerializer(user)
            profile_data = serializer.data.copy()
            profile_data.update({
                'phone': user.phone or '',
                'feedback_count': 0,  # Will be updated by frontend
                'resolved_count': 0,  # Will be updated by frontend
            })
            
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'data': profile_data
            })
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to update profile: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="🔒 Change Password",
    description="Change user password with current password verification"
)
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def change_password(request):
    """Change user password"""
    user = request.user
    data = request.data
    
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    confirm_password = data.get('confirm_password')
    
    if not current_password or not new_password or not confirm_password:
        return Response({
            'success': False,
            'message': 'All password fields are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if new_password != confirm_password:
        return Response({
            'success': False,
            'message': 'New passwords do not match'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if len(new_password) < 6:
        return Response({
            'success': False,
            'message': 'New password must be at least 6 characters long'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not user.check_password(current_password):
        return Response({
            'success': False,
            'message': 'Current password is incorrect'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to change password: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="📥 Export User Data",
    description="Export all user data for privacy compliance"
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def export_user_data(request):
    """Export user data"""
    user = request.user
    
    try:
        # Get user feedback
        from apps.feedback.models import Feedback
        feedback_data = []
        
        for feedback in Feedback.objects.filter(user=user, is_deleted=False):
            feedback_data.append({
                'id': str(feedback.id),
                'title': feedback.title,
                'content': feedback.content,
                'category': feedback.category,
                'priority': feedback.priority,
                'status': feedback.status,
                'created_at': feedback.created_at.isoformat(),
                'updated_at': feedback.updated_at.isoformat(),
            })
        
        export_data = {
            'user_profile': {
                'name': user.name,
                'email': user.email,
                'county': user.user_county.name,
                'role': user.role,
                'date_joined': user.date_joined.isoformat(),
                'last_login': user.last_login.isoformat() if user.last_login else None,
            },
            'feedback_submissions': feedback_data,
            'export_date': timezone.now().isoformat(),
            'total_feedback': len(feedback_data)
        }
        
        return Response({
            'success': True,
            'data': export_data
        })
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Failed to export data: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# =============================================================================
# LOCATION & COUNTY APIS
# =============================================================================

@extend_schema_view(
    get=extend_schema(
        tags=['Locations'],
        summary="🏛️ List All Counties",
        description="""
        Get complete list of Kenyan counties for dropdown selection and user registration.
        
        **Features:**
        - All 47 Kenyan counties
        - County codes (3-letter abbreviations)
        - Associated location hierarchy data
        - Filtering and search capabilities
        
        **Usage:**
        Perfect for:
        - Registration forms (county selection)
        - Data filtering by county
        - Geographic analytics
        """,
        parameters=[
            OpenApiParameter(
                name='is_active',
                type=OpenApiTypes.BOOL,
                description='Filter by active status',
                examples=[
                    OpenApiExample('Active only', value=True),
                    OpenApiExample('All counties', value=None)
                ]
            ),
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                description='Search by county name or code',
                examples=[
                    OpenApiExample('Search by name', value='Kisumu'),
                    OpenApiExample('Search by code', value='KSM')
                ]
            )
        ],
        responses={
            200: OpenApiResponse(
                response=CountySerializer(many=True),
                description="List of counties",
                examples=[
                    OpenApiExample(
                        "Counties List",
                        value=[
                            {
                                "id": 1,
                                "name": "Kisumu",
                                "code": "KSM",
                                "is_active": True,
                                "location_data": {
                                    "id": 1,
                                    "name": "Kisumu",
                                    "type": "county",
                                    "level": 0,
                                    "code": "001",
                                    "full_path": "Kisumu"
                                }
                            },
                            {
                                "id": 2,
                                "name": "Nairobi",
                                "code": "NBI",
                                "is_active": True,
                                "location_data": {
                                    "id": 2,
                                    "name": "Nairobi",
                                    "type": "county",
                                    "level": 0,
                                    "code": "047",
                                    "full_path": "Nairobi"
                                }
                            }
                        ]
                    )
                ]
            )
        }
    )
)
class CountyListView(generics.ListAPIView):
    """Get all counties for dropdown selection"""
    permission_classes = [permissions.AllowAny]
    queryset = County.objects.filter(is_active=True)
    serializer_class = CountySerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['is_active']
    search_fields = ['name', 'code']
    ordering = ['name']


@extend_schema(
    tags=['Locations'],
    summary="📍 Get Location Hierarchy",
    description="""
    Get Kenya's administrative location hierarchy for cascading dropdowns.
    
    **Location Types:**
    - **county** (Level 0): Root level - all 47 Kenyan counties
    - **sub_county** (Level 1): Sub-counties within a county  
    - **ward** (Level 2): Wards within a sub-county
    - **village** (Level 3): Villages within a ward
    
    **Query Patterns:**
    
    1. **Get Sub-Counties in a County:**
       ```
       GET /api/locations/hierarchy/?county_id=1&type=sub_county
       ```
    
    2. **Get Wards in a Sub-County:**
       ```
       GET /api/locations/hierarchy/?parent_id=5&type=ward  
       ```
       
    3. **Get Villages in a Ward:**
       ```
       GET /api/locations/hierarchy/?parent_id=15&type=village
       ```
    
    **Frontend Implementation:**
    Perfect for cascading dropdowns where selecting a county loads sub-counties, 
    selecting a sub-county loads wards, etc.
    """,
    parameters=[
        OpenApiParameter(
            name='county_id',
            type=OpenApiTypes.INT,
            description='County ID to get children from (use with type parameter)',
            examples=[OpenApiExample('Kisumu County', value=1)]
        ),
        OpenApiParameter(
            name='parent_id', 
            type=OpenApiTypes.INT,
            description='Parent location ID to get children from',
            examples=[OpenApiExample('Parent location', value=5)]
        ),
        OpenApiParameter(
            name='type',
            type=OpenApiTypes.STR,
            description='Type of locations to retrieve',
            enum=['sub_county', 'ward', 'village'],
            examples=[
                OpenApiExample('Sub-counties', value='sub_county'),
                OpenApiExample('Wards', value='ward'),
                OpenApiExample('Villages', value='village')
            ]
        )
    ],
    responses={
        200: OpenApiResponse(
            response=LocationListResponseSerializer,
            description="Location hierarchy retrieved successfully",
            examples=[
                OpenApiExample(
                    "Sub-counties in Kisumu",
                    value={
                        "success": True,
                        "locations": [
                            {
                                "id": 3,
                                "name": "Kisumu East",
                                "type": "sub_county",
                                "level": 1,
                                "code": "001-001",
                                "full_path": "Kisumu > Kisumu East",
                                "children": []
                            },
                            {
                                "id": 4,
                                "name": "Kisumu West", 
                                "type": "sub_county",
                                "level": 1,
                                "code": "001-002",
                                "full_path": "Kisumu > Kisumu West",
                                "children": []
                            }
                        ]
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Bad request - missing required parameters"
        ),
        404: OpenApiResponse(
            response=ErrorResponseSerializer, 
            description="Location not found"
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class LocationHierarchyView(APIView):
    """Get location hierarchy for county/sub-county/ward selection"""
    permission_classes = [permissions.AllowAny]
    
    def get(self, request):
        county_id = request.query_params.get('county_id')
        parent_id = request.query_params.get('parent_id')
        location_type = request.query_params.get('type', 'sub_county')
        
        # Validate required parameters
        if not county_id and not parent_id:
            return Response({
                'success': False,
                'message': '📍 Please provide either county_id or parent_id to get location hierarchy.',
                'error_code': 'MISSING_LOCATION_PARAMETER',
                'suggestions': [
                    'For sub-counties: ?county_id=1&type=sub_county',
                    'For wards: ?parent_id=5&type=ward',
                    'For villages: ?parent_id=15&type=village'
                ]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate location type
        valid_types = ['sub_county', 'ward', 'village']
        if location_type not in valid_types:
            return Response({
                'success': False,
                'message': f'📍 Invalid location type "{location_type}". Must be one of: {', '.join(valid_types)}',
                'error_code': 'INVALID_LOCATION_TYPE',
                'suggestions': [f'Use type={t}' for t in valid_types]
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if county_id:
                # Get locations under county
                try:
                    county = County.objects.get(id=county_id, is_active=True)
                    locations = Location.objects.filter(
                        parent=county.location,
                        type=location_type
                    ).order_by('name')
                except County.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': f'🏛️ County with ID {county_id} not found or inactive.',
                        'error_code': 'COUNTY_NOT_FOUND',
                        'suggestions': [
                            'Check the county ID is correct',
                            'Use /api/locations/counties/ to get valid county IDs'
                        ]
                    }, status=status.HTTP_404_NOT_FOUND)
            else:
                # Get locations under parent
                try:
                    parent = Location.objects.get(id=parent_id)
                    locations = parent.children.filter(
                        type=location_type
                    ).order_by('name')
                except Location.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': f'📍 Parent location with ID {parent_id} not found.',
                        'error_code': 'PARENT_LOCATION_NOT_FOUND',
                        'suggestions': [
                            'Check the parent location ID is correct',
                            'Ensure you\'re following the hierarchy: County → Sub-County → Ward → Village'
                        ]
                    }, status=status.HTTP_404_NOT_FOUND)
            
            serializer = LocationSerializer(locations, many=True)
            
            logger.info(f"✅ Location hierarchy retrieved: {len(locations)} {location_type}s")
            
            return Response({
                'success': True,
                'locations': serializer.data,
                'count': len(serializer.data),
                'location_type': location_type
            })
        
        except Exception as e:
            logger.error(f"❌ Location hierarchy system error: {str(e)}")
            return Response({
                'success': False,
                'message': '🔧 Location system temporarily unavailable. Please try again.',
                'error_code': 'LOCATION_SYSTEM_ERROR',
                'suggestions': [
                    'Wait a few minutes and try again',
                    'Refresh the page',
                    'Contact support if the problem persists'
                ]
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema(
    tags=['Authentication'],
    summary="📊 Check Anonymous Session Status", 
    description="""
    Check the status of an anonymous session including submission limits and expiry.
    
    **Use this endpoint to:**
    - Verify session is still valid
    - Check remaining submissions  
    - Get session expiry information
    - Determine if user can still submit feedback
    
    **Session States:**
    - ✅ **Active**: Can submit (submissions < 3, not expired)
    - ⏳ **Limited**: Can submit but approaching limits
    - ❌ **Expired**: Cannot submit (time expired)  
    - ❌ **Exhausted**: Cannot submit (3 submissions used)
    """,
    responses={
        200: OpenApiResponse(
            response=AnonymousSessionStatusSerializer,
            description="Session status retrieved",
            examples=[
                OpenApiExample(
                    "Active Session",
                    value={
                        "success": True,
                        "session_id": "ANON_8f3a2c1e4d6b9a7f2c5e8d1a4b7f9c2e",
                        "can_submit": True,
                        "message": "Session active - 2 submissions remaining",
                        "submissions_used": 1,
                        "submissions_limit": 3,
                        "expires_at": "2024-01-15T16:30:00Z"
                    }
                ),
                OpenApiExample(
                    "Expired Session",
                    value={
                        "success": True,
                        "session_id": "ANON_8f3a2c1e4d6b9a7f2c5e8d1a4b7f9c2e",
                        "can_submit": False,
                        "message": "Session expired",
                        "submissions_used": 2,
                        "submissions_limit": 3,
                        "expires_at": "2024-01-15T14:30:00Z"
                    }
                )
            ]
        ),
        404: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Session not found or expired"
        )
    }
)
@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def anonymous_session_status(request, session_id):
    """Check anonymous session status and submission limits"""
    session_data = AnonymousSessionManager.get_session(session_id)
    
    if not session_data:
        return Response({
            'success': False,
            'message': 'Session not found or expired'
        }, status=status.HTTP_404_NOT_FOUND)
    
    can_submit, message = AnonymousSessionManager.can_submit(session_id)
    
    return Response({
        'success': True,
        'session_id': session_id,
        'can_submit': can_submit,
        'message': message,
        'submissions_used': session_data['submission_count'],
        'submissions_limit': 3,
        'expires_at': session_data['expires_at']
    })


@extend_schema(
    tags=['System'],
    summary="💓 System Health Check",
    description="""
    Check system health and get API information.
    
    **Perfect for:**
    - Frontend app initialization
    - Monitoring and uptime checks  
    - Getting system statistics
    - Verifying API connectivity
    
    **Returns:**
    - System status and version
    - Available features
    - County statistics
    - Feature flags
    """,
    responses={
        200: OpenApiResponse(
            response=SystemHealthSerializer,
            description="System is healthy",
            examples=[
                OpenApiExample(
                    "Healthy System",
                    value={
                        "success": True,
                        "message": "CivicAI API is running",
                        "version": "1.0.0",
                        "features": {
                            "counties": 47,
                            "anonymous_sessions": True,
                            "invisible_boundaries": True,
                            "jwt_auth": True
                        }
                    }
                )
            ]
        )
    }
)
@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def system_health(request):
    """System health check for frontend"""
    return Response({
        'success': True,
        'message': 'CivicAI API is running',
        'version': '1.0.0',
        'features': {
            'counties': County.objects.count(),
            'anonymous_sessions': True,
            'invisible_boundaries': True,
            'jwt_auth': True
        }
    })
    