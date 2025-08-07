# =============================================================================
# FILE: apps/feedback/views.py (ENHANCED WITH SWAGGER DOCUMENTATION)
# =============================================================================
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from drf_spectacular.utils import (
    extend_schema, 
    OpenApiExample, 
    OpenApiParameter,
    OpenApiResponse,
    extend_schema_view
)
from drf_spectacular.types import OpenApiTypes

from apps.core.decorators import invisible_permission_required, endpoint_allowed
from .models import Feedback, FEEDBACK_CATEGORIES
from .serializers import (
    FeedbackSubmissionSerializer, AnonymousFeedbackSerializer,
    FeedbackTrackingSerializer, FeedbackCategorySerializer,
    FeedbackSubmissionResponseSerializer, AnonymousFeedbackResponseSerializer,
    FeedbackTrackingResponseSerializer, FeedbackCategoriesResponseSerializer,
    ErrorResponseSerializer
)
from .permissions import CanSubmitFeedback


class FeedbackRateThrottle(UserRateThrottle):
    """Custom throttle for feedback submission"""
    scope = 'feedback'


@extend_schema(
    tags=['Feedback'],
    summary="📝 Submit Authenticated Feedback",
    description="""
    **Authenticated citizens submit feedback** to their county government.
    
    **🎯 Key Features:**
    - **Secure submission** with JWT authentication
    - **Location hierarchy** support (County → Sub-County → Ward → Village)
    - **Category classification** for organized feedback management
    - **Priority levels** to indicate urgency
    - **Tracking system** with unique tracking ID
    - **Rate limiting** to prevent spam
    
    **📍 Location Hierarchy:**
    Use the location endpoints to get valid IDs:
    - Counties: `GET /api/locations/counties/`
    - Sub-counties: `GET /api/locations/hierarchy/?county_id=1&type=sub_county`
    - Wards: `GET /api/locations/hierarchy/?parent_id=5&type=ward`
    - Villages: `GET /api/locations/hierarchy/?parent_id=15&type=village`
    
    **🏛️ Tenant Isolation:**
    Users can only submit feedback to counties they have access to based on their role:
    - **Citizens**: Home county only
    - **Government Officials**: Based on their access level
    
    **⚡ Rate Limiting:**
    - Citizens: 10 submissions per day
    - Government Officials: 50 submissions per day
    """,
    request=FeedbackSubmissionSerializer,
    responses={
        201: OpenApiResponse(
            response=FeedbackSubmissionResponseSerializer,
            description="Feedback submitted successfully",
            examples=[
                OpenApiExample(
                    "Successful Submission",
                    value={
                        "success": True,
                        "message": "Feedback submitted successfully",
                        "data": {
                            "feedback_id": "550e8400-e29b-41d4-a716-446655440000",
                            "tracking_id": "FB240815KSM001",
                            "status": "pending",
                            "submitted_at": "2024-08-15T10:30:00Z",
                            "location_path": "Kisumu > Kisumu East > Kondele"
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Validation errors or rate limit exceeded",
            examples=[
                OpenApiExample(
                    "Validation Error",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "title": ["This field is required"],
                            "category": ["Invalid category selection"]
                        }
                    }
                ),
                OpenApiExample(
                    "Rate Limit Exceeded",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "non_field_errors": ["You have reached your daily submission limit of 10 feedback items"]
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Authentication required"
        ),
        403: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Permission denied - cannot submit to this county"
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class FeedbackSubmissionView(APIView):
    """Authenticated citizens submit feedback"""
    permission_classes = [CanSubmitFeedback]
    throttle_classes = [FeedbackRateThrottle]
    
    def post(self, request):
        serializer = FeedbackSubmissionSerializer(
            data=request.data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            feedback = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Feedback submitted successfully',
                'data': {
                    'feedback_id': str(feedback.id),
                    'tracking_id': feedback.tracking_id,
                    'status': feedback.status,
                    'submitted_at': feedback.created_at.isoformat(),
                    'location_path': feedback.get_location_path()
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Feedback submission failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Feedback'],
    summary="👤 Submit Anonymous Feedback",
    description="""
    **Anonymous users submit feedback** without revealing their identity.
    
    **🔒 Privacy-First Design:**
    - **No personal information** required or stored
    - **Session-based** submission using anonymous session ID
    - **Limited submissions** per session (3 maximum)
    - **2-hour session** lifetime for privacy
    - **Tracking support** via unique tracking ID
    
    **📋 How It Works:**
    1. **Create anonymous session**: `POST /api/auth/anonymous/`
    2. **Submit feedback** using the session_id from step 1
    3. **Track status** using the returned tracking_id
    
    **🎯 Perfect For:**
    - Citizens who want **complete privacy**
    - **Sensitive reports** about corruption or misconduct  
    - **Quick feedback** without account creation
    - **Public kiosks** or community feedback systems
    
    **⚡ Session Limits:**
    - **3 submissions** per session maximum
    - **2-hour** session expiry
    - **County-locked** submissions (must match session county)
    
    **🛡️ Security Features:**
    - Session validation and expiry
    - Rate limiting per session
    - Anonymous user creation with no PII
    - Tracking ID for transparency without identity exposure
    """,
    request=AnonymousFeedbackSerializer,
    responses={
        201: OpenApiResponse(
            response=AnonymousFeedbackResponseSerializer,
            description="Anonymous feedback submitted successfully",
            examples=[
                OpenApiExample(
                    "Anonymous Submission Success",
                    value={
                        "success": True,
                        "message": "Anonymous feedback submitted successfully",
                        "data": {
                            "tracking_id": "FB240815ANO001",
                            "status": "pending",
                            "submitted_at": "2024-08-15T14:45:00Z",
                            "location_path": "Nairobi > Westlands > Kitisuru",
                            "instructions": "Save your tracking ID to check status later"
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Invalid session, validation errors, or submission limit exceeded",
            examples=[
                OpenApiExample(
                    "Session Expired",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed",
                        "errors": {
                            "session_id": ["Invalid or expired session"]
                        }
                    }
                ),
                OpenApiExample(
                    "Submission Limit Reached",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed", 
                        "errors": {
                            "session_id": ["Session has reached maximum submissions (3)"]
                        }
                    }
                ),
                OpenApiExample(
                    "County Mismatch",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed",
                        "errors": {
                            "non_field_errors": ["County must match session county"]
                        }
                    }
                )
            ]
        )
    }
)
@method_decorator(csrf_exempt, name='dispatch')
class AnonymousFeedbackView(APIView):
    """Anonymous users submit feedback via session"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [AnonRateThrottle]
    
    def post(self, request):
        serializer = AnonymousFeedbackSerializer(data=request.data)
        
        if serializer.is_valid():
            feedback = serializer.save()
            
            return Response({
                'success': True,
                'message': 'Anonymous feedback submitted successfully',
                'data': {
                    'tracking_id': feedback.tracking_id,
                    'status': feedback.status,
                    'submitted_at': feedback.created_at.isoformat(),
                    'location_path': feedback.get_location_path(),
                    'instructions': 'Save your tracking ID to check status later'
                }
            }, status=status.HTTP_201_CREATED)
        
        return Response({
            'success': False,
            'message': 'Anonymous feedback submission failed',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Feedback'],
    summary="🔍 Track Feedback Status",
    description="""
    **Track feedback status** using the tracking ID provided during submission.
    
    **🎯 Public Transparency:**
    - **No authentication** required - completely public
    - **Works for both** authenticated and anonymous feedback
    - **Real-time status** updates from government officials
    - **Response tracking** shows government engagement
    - **View counter** for transparency metrics
    
    **📊 Tracking Information Provided:**
    - **Current status** (Pending, In Review, Responded, Resolved, Closed)
    - **Submission timestamp** and location details
    - **Response count** from government officials  
    - **Last response date** for activity tracking
    - **Category information** for context
    
    **🔍 Status Meanings:**
    - **Pending**: Feedback received, waiting for review
    - **In Review**: Government official is reviewing the issue
    - **Responded**: Official has provided a response or update
    - **Resolved**: Issue has been addressed and resolved
    - **Closed**: Feedback completed or no longer actionable
    
    **💡 Use Cases:**
    - Citizens tracking their submitted feedback
    - Anonymous users checking feedback status
    - Community transparency initiatives
    - Government accountability tracking
    - Public feedback kiosks showing real-time status
    
    **🔒 Privacy Protection:**
    - No personal information exposed
    - Anonymous submissions remain anonymous
    - Only public status information shown
    """,
    parameters=[
        OpenApiParameter(
            name='tracking_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='Unique tracking ID provided during feedback submission (e.g., FB240815KSM001)',
            examples=[
                OpenApiExample('Authenticated feedback', value='FB240815KSM001'),
                OpenApiExample('Anonymous feedback', value='FB240815ANO001')
            ]
        )
    ],
    responses={
        200: OpenApiResponse(
            response=FeedbackTrackingResponseSerializer,
            description="Feedback status retrieved successfully",
            examples=[
                OpenApiExample(
                    "Pending Feedback",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240815KSM001",
                            "title": "Poor road conditions on Kisumu-Kakamega highway",
                            "category": "infrastructure",
                            "category_display": "Infrastructure & Roads",
                            "status": "pending",
                            "status_display": "Pending",
                            "submitted_at": "2024-08-15T10:30:00Z",
                            "location_path": "Kisumu > Kisumu East > Kondele",
                            "response_count": 0,
                            "last_response_at": None
                        }
                    }
                ),
                OpenApiExample(
                    "Responded Feedback",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240815KSM002",
                            "title": "Water shortage in residential area",
                            "category": "water_sanitation",
                            "category_display": "Water & Sanitation",
                            "status": "responded",
                            "status_display": "Responded",
                            "submitted_at": "2024-08-15T08:15:00Z",
                            "location_path": "Kisumu > Kisumu West > Central Kisumu",
                            "response_count": 2,
                            "last_response_at": "2024-08-16T14:22:00Z"
                        }
                    }
                )
            ]
        ),
        404: OpenApiResponse(
            response=ErrorResponseSerializer,
            description="Feedback not found with provided tracking ID",
            examples=[
                OpenApiExample(
                    "Tracking ID Not Found",
                    value={
                        "success": False,
                        "message": "Feedback not found"
                    }
                )
            ]
        )
    }
)
@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def track_feedback(request, tracking_id):
    """Track feedback status using tracking ID"""
    try:
        feedback = get_object_or_404(Feedback, tracking_id=tracking_id.upper())
        
        # Increment view count for analytics
        feedback.view_count += 1
        feedback.save(update_fields=['view_count'])
        
        serializer = FeedbackTrackingSerializer(feedback)
        
        return Response({
            'success': True,
            'data': serializer.data
        })
    
    except Feedback.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Feedback not found'
        }, status=status.HTTP_404_NOT_FOUND)


@extend_schema(
    tags=['Feedback'],
    summary="📂 Get Feedback Categories",
    description="""
    **Get all available feedback categories** for form dropdowns and validation.
    
    **🎯 Categories Available:**
    Perfect for organizing citizen feedback into government departments:
    
    - **🏗️ Infrastructure & Roads** - Road conditions, bridges, transportation
    - **🏥 Healthcare Services** - Hospitals, clinics, medical services  
    - **🎓 Education & Schools** - Schools, teachers, educational resources
    - **💧 Water & Sanitation** - Water supply, sewage, sanitation facilities
    - **🛡️ Security & Safety** - Police services, crime, public safety
    - **🌱 Environment & Waste** - Waste management, pollution, environmental issues
    - **🏛️ Governance & Corruption** - Government services, corruption reports
    - **💼 Economic Development** - Business, employment, economic issues
    - **📋 Other Issues** - General feedback not covered by specific categories
    
    **💡 Frontend Integration:**
    ```javascript
    // Perfect for React/Vue select components
    const categories = await fetch('/api/feedback/categories/')
      .then(res => res.json());
      
    // Use in forms
    <select>
      {categories.categories.map(cat => 
        <option value={cat.value}>{cat.label}</option>
      )}
    </select>
    ```
    
    **🔍 Usage Scenarios:**
    - **Form validation** - Ensure valid category selection
    - **Dropdown population** - Dynamic form generation
    - **Analytics filtering** - Filter feedback by category
    - **Government routing** - Route feedback to appropriate departments
    - **Mobile apps** - Category selection in mobile interfaces
    
    **⚡ Performance:**
    - **No authentication** required - completely public
    - **Cached response** for fast loading
    - **Small payload** perfect for mobile applications
    """,
    responses={
        200: OpenApiResponse(
            response=FeedbackCategoriesResponseSerializer,
            description="Feedback categories retrieved successfully",
            examples=[
                OpenApiExample(
                    "All Categories",
                    value={
                        "success": True,
                        "categories": [
                            {
                                "value": "infrastructure",
                                "label": "Infrastructure & Roads",
                                "description": "Submit feedback related to infrastructure & roads"
                            },
                            {
                                "value": "healthcare",
                                "label": "Healthcare Services", 
                                "description": "Submit feedback related to healthcare services"
                            },
                            {
                                "value": "education",
                                "label": "Education & Schools",
                                "description": "Submit feedback related to education & schools"
                            },
                            {
                                "value": "water_sanitation",
                                "label": "Water & Sanitation",
                                "description": "Submit feedback related to water & sanitation"
                            },
                            {
                                "value": "security",
                                "label": "Security & Safety",
                                "description": "Submit feedback related to security & safety"
                            },
                            {
                                "value": "environment",
                                "label": "Environment & Waste",
                                "description": "Submit feedback related to environment & waste"
                            },
                            {
                                "value": "governance",
                                "label": "Governance & Corruption",
                                "description": "Submit feedback related to governance & corruption"
                            },
                            {
                                "value": "economic",
                                "label": "Economic Development",
                                "description": "Submit feedback related to economic development"
                            },
                            {
                                "value": "other",
                                "label": "Other Issues",
                                "description": "Submit feedback related to other issues"
                            }
                        ]
                    }
                )
            ]
        )
    }
)
@csrf_exempt
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def feedback_categories(request):
    """Get available feedback categories"""
    categories = [
        {
            'value': value,
            'label': label,
            'description': f"Submit feedback related to {label.lower()}"
        }
        for value, label in FEEDBACK_CATEGORIES
    ]
    
    return Response({
        'success': True,
        'categories': categories
    })
    