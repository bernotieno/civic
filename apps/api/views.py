# =============================================================================
# FILE: apps/api/views.py (ENHANCED WITH SWAGGER DOCUMENTATION)
# =============================================================================
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
from drf_spectacular.utils import (
    extend_schema, 
    OpenApiExample, 
    OpenApiParameter,
    OpenApiResponse,
    extend_schema_view
)
from drf_spectacular.types import OpenApiTypes

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
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            
            # Get user profile data
            profile_serializer = UserProfileSerializer(user)
            
            return Response({
                'success': True,
                'message': 'Registration successful',
                'user': profile_serializer.data,
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Registration failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


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
            
            return Response({
                'success': True,
                'message': 'Login successful',
                'user': profile_serializer.data,
                'app_config': user_context.app_config,
                'tokens': {
                    'access': access_token,
                    'refresh': str(refresh)
                }
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'message': 'Login failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


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
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            return Response({
                'success': True,
                'message': 'Logout successful'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Logout failed',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)


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
        serializer = AnonymousSessionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            session_data = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Anonymous session created',
                'session_id': session_data['session_id'],
                'expires_in': 2 * 60 * 60,  # 2 hours
                'max_submissions': 3
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Session creation failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


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
    """Get current user profile and app configuration"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        
        # Get user context for app configuration
        from apps.core.context import UserContext
        user_context = UserContext(request.user)
        
        return Response({
            'success': True,
            'user': serializer.data,
            'app_config': user_context.app_config,
            'permissions': {
                'can_access_endpoints': user_context.app_config['available_endpoints'],
                'data_scope': user_context.app_config['data_scope']
            }
        })


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
        
        if not county_id and not parent_id:
            return Response({
                'success': False,
                'message': 'county_id or parent_id is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            if county_id:
                # Get locations under county
                county = County.objects.get(id=county_id)
                locations = Location.objects.filter(
                    parent=county.location,
                    type=location_type
                ).order_by('name')
            else:
                # Get locations under parent
                parent = Location.objects.get(id=parent_id)
                locations = parent.children.filter(
                    type=location_type
                ).order_by('name')
            
            serializer = LocationSerializer(locations, many=True)
            
            return Response({
                'success': True,
                'locations': serializer.data
            })
        
        except (County.DoesNotExist, Location.DoesNotExist):
            return Response({
                'success': False,
                'message': 'Location not found'
            }, status=status.HTTP_404_NOT_FOUND)


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
    