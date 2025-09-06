# =============================================================================
# FILE: apps/feedback/views.py (ENHANCED WITH AWARD-WINNING SWAGGER DOCUMENTATION)
# =============================================================================
from rest_framework import status, generics, permissions
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Q, Count


from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import OrderingFilter, SearchFilter

from .filters import UserFeedbackFilter
from .utils import calculate_user_feedback_stats, track_feedback_view

from datetime import timedelta
from django.utils import timezone

from django.core.cache import cache
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
from .models import Feedback, FEEDBACK_CATEGORIES, PRIORITY_CHOICES, STATUS_CHOICES
from .serializers import (
    FeedbackSubmissionSerializer, AnonymousFeedbackSerializer,
    FeedbackTrackingSerializer, FeedbackCategoryChoiceSerializer,
    FeedbackSubmissionResponseSerializer, AnonymousFeedbackResponseSerializer,
    FeedbackTrackingResponseSerializer, FeedbackCategoriesResponseSerializer,
    FeedbackErrorResponseSerializer, UserFeedbackListSerializer, UserFeedbackDetailSerializer, 
    UserFeedbackUpdateSerializer, UserFeedbackStatsSerializer
)
from .permissions import CanSubmitFeedback, IsOwnerOrReadOnly, CanEditFeedback, CanDeleteFeedback


class FeedbackRateThrottle(UserRateThrottle):
    """Custom throttle for feedback submission"""
    scope = 'feedback'


@extend_schema(
    tags=['Feedback'],
    summary="📝 Submit Authenticated Feedback",
    description="""
    **🇰🇪 Citizens submit feedback to their county government with full authentication**
    
    This endpoint enables authenticated citizens and government officials to submit comprehensive 
    feedback using Kenya's administrative hierarchy. All submissions are tracked and routed to 
    appropriate government departments based on category and location.

    ## 🎯 Key Features
    - **🔐 Secure JWT Authentication** - Full user verification and permissions
    - **📍 Location Hierarchy Support** - County → Sub-County → Ward → Village structure  
    - **🏷️ Smart Categorization** - Routes feedback to correct government departments
    - **⚡ Priority-Based Processing** - Urgent issues get faster government response
    - **🔍 Tracking System** - Unique tracking ID for status monitoring
    - **🛡️ Rate Limiting** - Prevents spam while allowing legitimate submissions

    ## 📍 Kenya Administrative Hierarchy
    Use these endpoints to populate location dropdowns in order:
    
    1. **Counties**: `GET /api/locations/counties/`
    2. **Sub-Counties**: `GET /api/locations/hierarchy/?county_id=1&type=sub_county`  
    3. **Wards**: `GET /api/locations/hierarchy/?parent_id=5&type=ward`
    4. **Villages**: `GET /api/locations/hierarchy/?parent_id=15&type=village`

    ## 🏛️ Department Routing by Category
    Your feedback is automatically routed based on category:
    
    - **🏗️ Infrastructure** → Public Works Department (roads, bridges, transport)
    - **🏥 Healthcare** → Health Department (hospitals, clinics, medical services)
    - **🎓 Education** → Education Department (schools, teachers, facilities)
    - **💧 Water & Sanitation** → Water Department (supply, sewage, sanitation)
    - **🛡️ Security** → Security Department (police services, safety, crime)
    - **🌱 Environment** → Environment Department (waste, pollution, conservation)
    - **🏛️ Governance** → Ethics Department (corruption, misconduct, transparency)
    - **💼 Economic** → Development Department (business, employment, economy)
    - **📋 Other** → General Administration (miscellaneous issues)

    ## ⚡ Priority Levels & Response Times
    Choose priority based on urgency and community impact:
    
    - **🟢 Low** - Minor issues, suggestions (3-7 days response)
    - **🟡 Medium** - Standard issues needing attention (1-3 days response) 
    - **🟠 High** - Significant community impact (6-24 hours response)
    - **🔴 Urgent** - Critical safety hazards, emergencies (2-6 hours response)

    ## 🔒 Access Control & Tenant Isolation
    - **Citizens**: Can submit to their home county only
    - **Government Officials**: Can submit based on their access level
    - **Data Isolation**: Each county's data is completely isolated (invisible boundaries)

    ## ⏰ Rate Limits
    - **Citizens**: 10 submissions per day
    - **Government Officials**: 50 submissions per day
    - **Rate limit resets**: Every 24 hours at midnight

    ## 🔍 After Submission
    Save your **tracking ID** to monitor progress:
    - Track status: `GET /api/feedback/track/{tracking_id}/`
    - View your submissions: `GET /api/feedback/my-submissions/`
    - Get detailed view: `GET /api/feedback/my-submissions/{id}/`
    """,
    request=FeedbackSubmissionSerializer,
    responses={
        201: OpenApiResponse(
            response=FeedbackSubmissionResponseSerializer,
            description="✅ **Feedback submitted successfully** - Ready for government review",
            examples=[
                OpenApiExample(
                    "Infrastructure Feedback Success",
                    summary="Road condition feedback successfully submitted",
                    description="Example of successful infrastructure feedback submission with tracking details",
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
                ),
                OpenApiExample(
                    "Healthcare Urgent Feedback Success",
                    summary="Urgent healthcare issue submitted",
                    description="High-priority healthcare feedback with expected fast response",
                    value={
                        "success": True,
                        "message": "Feedback submitted successfully", 
                        "data": {
                            "feedback_id": "660f9511-f3ac-52e5-b827-557766551111",
                            "tracking_id": "FB240815NBI002",
                            "status": "pending",
                            "submitted_at": "2024-08-15T14:45:00Z",
                            "location_path": "Nairobi > Westlands > Kitisuru"
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="❌ **Validation errors** - Check your input data",
            examples=[
                OpenApiExample(
                    "Field Validation Errors",
                    summary="Missing or invalid required fields",
                    description="Common validation errors with field-specific messages",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "title": ["❌ Title must be at least 10 characters long"],
                            "content": ["❌ Content must be at least 50 characters long"],
                            "category": ["❌ Invalid category selection"],
                            "county_id": ["❌ Invalid county ID. Use /api/locations/counties/ to get valid options"]
                        }
                    }
                ),
                OpenApiExample(
                    "Location Hierarchy Error", 
                    summary="Invalid location hierarchy",
                    description="When ward doesn't belong to selected sub-county",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "non_field_errors": ["❌ Ward ID 25 does not belong to the selected sub-county"]
                        }
                    }
                ),
                OpenApiExample(
                    "Rate Limit Exceeded",
                    summary="Daily submission limit reached",
                    description="User has reached their daily feedback submission limit",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "non_field_errors": ["⏰ You've reached your daily limit of 10 feedback submissions. Please try again tomorrow or contact support if you need to submit urgent feedback."]
                        }
                    }
                ),
                OpenApiExample(
                    "Permission Denied",
                    summary="Cannot submit to this county",
                    description="User doesn't have permission to submit feedback to the selected county",
                    value={
                        "success": False,
                        "message": "Feedback submission failed",
                        "errors": {
                            "county_id": ["🚫 You cannot submit feedback to this county based on your account permissions"]
                        }
                    }
                )
            ]
        ),
        401: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="🔐 **Authentication required** - Login needed",
            examples=[
                OpenApiExample(
                    "No Authentication",
                    value={
                        "success": False,
                        "message": "Authentication credentials were not provided",
                        "errors": {
                            "detail": ["🔐 Authentication credentials were not provided"]
                        }
                    }
                ),
                OpenApiExample(
                    "Invalid Token",
                    value={
                        "success": False,
                        "message": "Authentication failed",
                        "errors": {
                            "detail": ["🔐 Given token not valid for any token type"]
                        }
                    }
                )
            ]
        ),
        403: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="🚫 **Permission denied** - Access restrictions",
            examples=[
                OpenApiExample(
                    "Role Permission Denied",
                    value={
                        "success": False,
                        "message": "Permission denied",
                        "errors": {
                            "detail": ["🚫 Only citizens and government officials can submit feedback"]
                        }
                    }
                ),
                OpenApiExample(
                    "Account Deactivated",
                    value={
                        "success": False,
                        "message": "Permission denied",
                        "errors": {
                            "detail": ["🚫 Your account has been deactivated"]
                        }
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Road Infrastructure Report",
            summary="🏗️ Infrastructure - Road condition feedback",
            description="Example of reporting poor road conditions with specific location details",
            value={
                "title": "Severe potholes on Kisumu-Kakamega Highway affecting daily commute",
                "content": "The road section between kilometer 15-20 has developed numerous large potholes that are damaging vehicles and causing traffic delays. During rainy season, these become dangerous water-filled hazards. This affects hundreds of commuters daily and local businesses are reporting reduced customer visits due to poor road access. Immediate repairs needed before the situation worsens.",
                "category": "infrastructure",
                "priority": "high",
                "county_id": 1,
                "sub_county_id": 3,
                "ward_id": 12,
                "village_id": 45
            }
        ),
        OpenApiExample(
            "Healthcare Emergency",
            summary="🏥 Healthcare - Critical medical equipment shortage",
            description="Urgent healthcare facility issue requiring immediate government attention",
            value={
                "title": "Medical equipment shortage at County Hospital emergency ward",
                "content": "The emergency ward at our county hospital has been without a functioning X-ray machine for two weeks. Patients requiring urgent diagnostics are being turned away or must travel 50km to the next facility. This is particularly challenging for accident victims and elderly patients. The broken equipment needs immediate repair or replacement to prevent potential loss of life.",
                "category": "healthcare",
                "priority": "urgent",
                "county_id": 1,
                "sub_county_id": 2,
                "ward_id": 8
            }
        ),
        OpenApiExample(
            "Water Service Issue",
            summary="💧 Water & Sanitation - Community water shortage",
            description="Water supply issue affecting entire residential area",
            value={
                "title": "Water shortage in Nyalenda residential area for over one week",
                "content": "Our residential area of approximately 200 households has been without piped water for 8 days. The community borehole is also not functioning. Residents are forced to walk 2km to fetch water from the river, which is not safe for drinking. Children are missing school to help fetch water, and there are health concerns about waterborne diseases. We urgently need restoration of piped water supply and repair of the community borehole.",
                "category": "water_sanitation", 
                "priority": "high",
                "county_id": 1,
                "sub_county_id": 4,
                "ward_id": 16,
                "village_id": 67
            }
        ),
        OpenApiExample(
            "Education Facility Issue",
            summary="🎓 Education - School infrastructure problem",
            description="Education facility issue affecting student learning",
            value={
                "title": "Collapsed classroom ceiling at Kondele Primary School",
                "content": "The ceiling of Standard 4 classroom at Kondele Primary School collapsed during heavy rains last week. Fortunately, no students were injured as it happened during the weekend. However, 45 students are now learning under a tree due to lack of alternative classroom space. With the rainy season continuing, we urgently need repairs to ensure children can continue their education safely indoors.",
                "category": "education",
                "priority": "high", 
                "county_id": 1,
                "sub_county_id": 3,
                "ward_id": 12
            }
        )
    ]
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
    **🔒 Privacy-first anonymous feedback submission without revealing citizen identity**
    
    This endpoint enables complete privacy for sensitive feedback such as corruption reports, 
    misconduct allegations, or personal safety concerns. No personal information is required 
    or stored, and submissions are linked only to anonymous session IDs.

    ## 🔒 Complete Privacy Protection
    - **🚫 No Personal Data** - Zero personally identifiable information required
    - **👤 Anonymous Sessions** - Session-based identification with automatic expiry
    - **🔍 Tracking Support** - Get tracking ID for status updates without identity exposure
    - **⏰ Limited Lifetime** - Sessions expire automatically for enhanced privacy
    - **🛡️ Submission Limits** - Prevents abuse while protecting legitimate anonymous users

    ## 📋 How Anonymous Submission Works
    
    ### Step 1: Create Anonymous Session
    ```http
    POST /api/auth/anonymous/
    Content-Type: application/json
    
    {
      "county_id": 1
    }
    ```
    
    **Response:**
    ```json
    {
      "success": true,
      "session_id": "anon_sess_1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p",
      "expires_at": "2024-08-15T16:30:00Z"
    }
    ```

    ### Step 2: Submit Anonymous Feedback
    Use the `session_id` from Step 1 in your feedback submission.

    ### Step 3: Track Status
    ```http
    GET /api/feedback/track/{tracking_id}/
    ```
    
    Your tracking ID works the same as authenticated feedback - no authentication required.

    ## 🎯 Perfect For Sensitive Reports
    
    **🏛️ Corruption & Misconduct**
    - Government official bribery
    - Misuse of public resources  
    - Electoral misconduct
    - Service delivery corruption

    **🛡️ Personal Safety Concerns**
    - Security threats to individuals
    - Criminal activity reports
    - Violence or harassment
    - Community safety issues

    **💼 Workplace Issues**
    - Government employee misconduct
    - Unsafe working conditions
    - Discrimination or harassment
    - Ethical violations

    ## ⚡ Session Limitations (Enhanced Security)
    - **3 submissions maximum** per session
    - **2-hour session lifetime** (automatic expiry)
    - **County-locked** - Must submit to session's county
    - **Location hierarchy** - Same validation as authenticated submissions

    ## 🔐 Privacy & Security Features
    - **Session validation** - Each submission validates active session
    - **Automatic cleanup** - Sessions auto-expire for privacy
    - **No cross-linking** - Anonymous feedback cannot be linked to users
    - **Rate limiting** - Prevents session abuse
    - **Tracking transparency** - Public status tracking without identity exposure

    ## 💡 Pro Tips for Anonymous Submissions
    - **Be specific** about location without revealing personal details
    - **Focus on facts** rather than opinions for better government response
    - **Avoid identifying information** like names, exact times, or personal details
    - **Save your tracking ID** - Only way to check status later
    - **Use secure browsing** - Consider private browser mode for extra privacy
    """,
    request=AnonymousFeedbackSerializer,
    responses={
        201: OpenApiResponse(
            response=AnonymousFeedbackResponseSerializer,
            description="✅ **Anonymous feedback submitted successfully** - Privacy protected",
            examples=[
                OpenApiExample(
                    "Anonymous Corruption Report Success",
                    summary="Corruption report submitted anonymously",
                    description="Sensitive governance feedback submitted with complete privacy protection",
                    value={
                        "success": True,
                        "message": "Anonymous feedback submitted successfully",
                        "data": {
                            "tracking_id": "FB240815ANO001",
                            "status": "pending",
                            "submitted_at": "2024-08-15T14:45:00Z",
                            "location_path": "Nairobi > Westlands > Kitisuru",
                            "instructions": "Save your tracking ID to check status later. Your identity remains completely anonymous."
                        }
                    }
                ),
                OpenApiExample(
                    "Anonymous Safety Report Success",
                    summary="Safety concern reported anonymously",
                    description="Personal safety concern submitted without revealing citizen identity",
                    value={
                        "success": True,
                        "message": "Anonymous feedback submitted successfully",
                        "data": {
                            "tracking_id": "FB240815ANO002", 
                            "status": "pending",
                            "submitted_at": "2024-08-15T16:20:00Z",
                            "location_path": "Kisumu > Kisumu Central > Market",
                            "instructions": "Save your tracking ID to check status later. Your identity remains completely anonymous."
                        }
                    }
                )
            ]
        ),
        400: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="❌ **Validation errors** - Session or input issues",
            examples=[
                OpenApiExample(
                    "Invalid Session",
                    summary="Session expired or invalid",
                    description="Anonymous session is no longer valid",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed",
                        "errors": {
                            "session_id": ["❌ Invalid or expired anonymous session. Create a new session at /api/auth/anonymous/"]
                        }
                    }
                ),
                OpenApiExample(
                    "Session Submission Limit",
                    summary="Maximum submissions reached",
                    description="Session has reached the 3-submission limit",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed", 
                        "errors": {
                            "session_id": ["⏰ You've reached the maximum submissions (3) for this anonymous session. Create a new session to submit more feedback."]
                        }
                    }
                ),
                OpenApiExample(
                    "County Mismatch",
                    summary="County doesn't match session",
                    description="Trying to submit to different county than session was created for",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed",
                        "errors": {
                            "non_field_errors": ["❌ County must match the county used when creating your anonymous session"]
                        }
                    }
                ),
                OpenApiExample(
                    "Content Validation",
                    summary="Anonymous content validation errors",
                    description="Title or content doesn't meet minimum requirements",
                    value={
                        "success": False,
                        "message": "Anonymous feedback submission failed",
                        "errors": {
                            "title": ["❌ Title must be at least 10 characters long"],
                            "content": ["❌ Content must be at least 50 characters long"]
                        }
                    }
                )
            ]
        )
    },
    examples=[
        OpenApiExample(
            "Anonymous Corruption Report",
            summary="🏛️ Governance - Anonymous corruption report",
            description="Report corruption or misconduct without revealing identity",
            value={
                "session_id": "anon_sess_1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q",
                "title": "Corruption in local government office - bribery for permits",
                "content": "Citizens are being asked to pay unofficial fees for building permits at the county office. The official fee is KES 5000 but staff are demanding additional KES 2000 'processing fees' paid directly to them. This is happening at the permits desk during morning hours. Multiple citizens have experienced this but are afraid to report with their names due to fear of retaliation.",
                "category": "governance",
                "priority": "high",
                "county_id": 1,
                "sub_county_id": 2
            }
        ),
        OpenApiExample(
            "Anonymous Safety Concern",
            summary="🛡️ Security - Anonymous safety report",
            description="Report safety concerns without revealing personal identity",
            value={
                "session_id": "anon_sess_2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r",
                "title": "Unsafe conditions at public market - security threats",
                "content": "There have been increasing incidents of theft and harassment at the main public market, particularly during evening hours. Vendors and customers are being threatened by groups of individuals demanding protection money. Local police patrols are infrequent and when they do patrol, the problematic individuals seem to be warned in advance. Market business is declining as people are afraid to shop there.",
                "category": "security",
                "priority": "high",
                "county_id": 1,
                "sub_county_id": 1,
                "ward_id": 3
            }
        ),
        OpenApiExample(
            "Anonymous Healthcare Misconduct",
            summary="🏥 Healthcare - Anonymous service misconduct",
            description="Report healthcare service issues anonymously",
            value={
                "session_id": "anon_sess_3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s", 
                "title": "Patients being charged for free government services at health clinic",
                "content": "The local government health clinic is charging patients for services that are supposed to be free. For example, patients are being asked to pay KES 200 for consultation that should be free under government healthcare policy. Staff claim it's for 'registration' but there are no official receipts given. Patients who refuse to pay are turned away or given poor treatment. This particularly affects poor families who cannot afford these unofficial charges.",
                "category": "healthcare",
                "priority": "high",
                "county_id": 1,
                "sub_county_id": 3,
                "ward_id": 9
            }
        )
    ]
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
                    'instructions': 'Save your tracking ID to check status later. Your identity remains completely anonymous.'
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
    **🌐 Public feedback status tracking using tracking ID - works for all feedback types**
    
    This completely public endpoint allows anyone to track the status of feedback using just 
    the tracking ID. No authentication required, works for both authenticated and anonymous 
    submissions, and provides full transparency into government response progress.

    ## 🎯 Universal Tracking Features
    - **🔓 No Authentication Required** - Completely public access
    - **👥 Works for All Feedback** - Authenticated and anonymous submissions
    - **📊 Real-Time Status** - Live updates from government officials
    - **📈 Response Tracking** - Shows government engagement level
    - **👀 View Counter** - Transparency metrics (how many people viewed)
    - **🔒 Privacy Protected** - No personal information exposed

    ## 📊 Feedback Status Workflow
    
    **🔄 Status Progression:**
    
    1. **⏳ Pending** - Feedback received, waiting for initial review
       - *What's happening:* Your feedback is in the queue for government review
       - *Next step:* Government official will review and categorize
       - *Timeline:* Initial review within 24-48 hours
    
    2. **👀 In Review** - Government official is actively reviewing
       - *What's happening:* Official is analyzing the issue and gathering information
       - *Next step:* Official will provide response or route to appropriate department
       - *Timeline:* Detailed review within 2-5 days depending on priority
    
    3. **💬 Responded** - Official has provided response or update
       - *What's happening:* Government has acknowledged and provided initial response
       - *Next step:* Implementation of solutions or request for more information
       - *Timeline:* Ongoing based on issue complexity
    
    4. **✅ Resolved** - Issue has been addressed and resolved
       - *What's happening:* Problem has been fixed or adequately addressed
       - *Next step:* Monitoring to ensure resolution is effective
       - *Timeline:* Complete
    
    5. **📁 Closed** - Feedback process completed
       - *What's happening:* Issue resolved and no further action needed
       - *Next step:* None (feedback lifecycle complete)
       - *Timeline:* Final status

    ## 📊 Tracking Information Provided
    - **📋 Feedback Title** - Brief description of the issue
    - **🏷️ Category & Department** - Which government department is handling it
    - **📊 Current Status** - Where in the workflow it currently sits
    - **📅 Submission Date** - When the feedback was originally submitted
    - **📍 Location Details** - Full administrative hierarchy
    - **💬 Response Metrics** - Number of official responses received
    - **⏰ Last Activity** - When government last updated the feedback

    ## 🔍 Tracking ID Format
    Tracking IDs follow this format: **FB{YYMMDD}{XXX}{NNN}**
    - **FB** - Feedback prefix
    - **YYMMDD** - Submission date (240815 = August 15, 2024)
    - **XXX** - County/location code (KSM = Kisumu, NBI = Nairobi)
    - **NNN** - Sequential number for the day

    **Examples:**
    - `FB240815KSM001` - First Kisumu feedback on August 15, 2024
    - `FB240815NBI025` - 25th Nairobi feedback on August 15, 2024
    - `FB240815ANO001` - First anonymous feedback on August 15, 2024

    ## 💡 Use Cases & Applications
    
    **👩‍💼 For Citizens:**
    - Track your own submitted feedback progress
    - Monitor anonymous submissions privately
    - Check if similar issues have been reported
    - See government response time patterns

    **🏛️ For Government Transparency:**
    - Public dashboard of all feedback status
    - Community engagement metrics
    - Response time performance tracking
    - Public accountability demonstration

    **📱 For Applications:**
    - Status widgets in mobile apps
    - Community feedback portals
    - Public information kiosks
    - Civic engagement platforms

    ## 🔒 Privacy & Security
    - **🚫 No Personal Data Exposed** - Only feedback content and status shown
    - **👤 Anonymous Protection** - Anonymous submissions remain anonymous
    - **📊 Public Information Only** - Tracking shows only what should be public
    - **🔍 View Tracking** - Counts views for transparency but doesn't identify viewers
    """,
    parameters=[
        OpenApiParameter(
            name='tracking_id',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.PATH,
            description='🔍 **Unique Tracking ID** - The tracking ID provided when feedback was submitted',
            required=True,
            examples=[
                OpenApiExample(
                    'Authenticated Feedback ID',
                    summary='Regular citizen feedback',
                    description='Tracking ID for authenticated citizen feedback',
                    value='FB240815KSM001'
                ),
                OpenApiExample(
                    'Anonymous Feedback ID',
                    summary='Anonymous submission',
                    description='Tracking ID for anonymous feedback submission',
                    value='FB240815ANO001'
                ),
                OpenApiExample(
                    'Government Response Active',
                    summary='Feedback with responses',
                    description='Tracking ID for feedback that has government responses',
                    value='FB240815NBI025'
                ),
                OpenApiExample(
                    'Resolved Issue',
                    summary='Completed feedback',
                    description='Tracking ID for feedback that has been resolved',
                    value='FB240814KSM015'
                )
            ]
        )
    ],
    responses={
        200: OpenApiResponse(
            response=FeedbackTrackingResponseSerializer,
            description="✅ **Feedback status retrieved successfully** - Complete tracking information",
            examples=[
                OpenApiExample(
                    "Pending Feedback Status",
                    summary="Recently submitted, awaiting review",
                    description="Feedback that was just submitted and is waiting for government review",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240815KSM001",
                            "title": "Poor road conditions on Kisumu-Kakamega highway",
                            "category": "infrastructure",
                            "category_display": "Infrastructure & Roads",
                            "status": "pending",
                            "status_display": "Pending Review",
                            "submitted_at": "2024-08-15T10:30:00Z",
                            "location_path": "Kisumu > Kisumu East > Kondele",
                            "response_count": 0,
                            "last_response_at": None
                        }
                    }
                ),
                OpenApiExample(
                    "Active Feedback with Government Response",
                    summary="Feedback with official government response",
                    description="Feedback that government has responded to with updates or solutions",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240815KSM002",
                            "title": "Water shortage in residential area affecting 200 households",
                            "category": "water_sanitation",
                            "category_display": "Water & Sanitation",
                            "status": "responded",
                            "status_display": "Official Response Provided",
                            "submitted_at": "2024-08-15T08:15:00Z",
                            "location_path": "Kisumu > Kisumu West > Central Kisumu",
                            "response_count": 2,
                            "last_response_at": "2024-08-16T14:22:00Z"
                        }
                    }
                ),
                OpenApiExample(
                    "Resolved Issue Status",
                    summary="Successfully resolved feedback",
                    description="Feedback where the reported issue has been fully resolved",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240814NBI003",
                            "title": "Broken streetlights on Uhuru Highway creating safety hazard",
                            "category": "infrastructure",
                            "category_display": "Infrastructure & Roads", 
                            "status": "resolved",
                            "status_display": "Issue Resolved",
                            "submitted_at": "2024-08-14T16:45:00Z",
                            "location_path": "Nairobi > Westlands > Parklands",
                            "response_count": 3,
                            "last_response_at": "2024-08-15T09:30:00Z"
                        }
                    }
                ),
                OpenApiExample(
                    "Anonymous Feedback Tracking",
                    summary="Anonymous submission status",
                    description="Tracking status for anonymously submitted feedback",
                    value={
                        "success": True,
                        "data": {
                            "tracking_id": "FB240815ANO001",
                            "title": "Corruption in local government office - bribery for permits",
                            "category": "governance",
                            "category_display": "Governance & Corruption",
                            "status": "in_review",
                            "status_display": "Under Investigation",
                            "submitted_at": "2024-08-15T14:45:00Z",
                            "location_path": "Nairobi > Westlands > Kitisuru",
                            "response_count": 1,
                            "last_response_at": "2024-08-16T10:15:00Z"
                        }
                    }
                )
            ]
        ),
        404: OpenApiResponse(
            response=FeedbackErrorResponseSerializer,
            description="❌ **Feedback not found** - Invalid tracking ID",
            examples=[
                OpenApiExample(
                    "Tracking ID Not Found",
                    summary="Invalid or non-existent tracking ID",
                    description="The provided tracking ID doesn't exist in the system",
                    value={
                        "success": False,
                        "message": "Feedback not found",
                        "errors": {
                            "detail": ["❌ No feedback found with tracking ID 'FB240815XXX999'. Please check your tracking ID and try again."]
                        }
                    }
                ),
                OpenApiExample(
                    "Malformed Tracking ID",
                    summary="Invalid tracking ID format",
                    description="Tracking ID doesn't follow the expected format",
                    value={
                        "success": False,
                        "message": "Feedback not found", 
                        "errors": {
                            "detail": ["❌ Invalid tracking ID format. Expected format: FB{YYMMDD}{XXX}{NNN} (e.g., FB240815KSM001)"]
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
def track_feedback(request, tracking_id):
    """Track feedback status using tracking ID"""
    try:
        feedback = get_object_or_404(
            Feedback.objects.prefetch_related('responses__responder'), 
            tracking_id=tracking_id.upper()
        )
        
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
    **📋 Get all available feedback categories for frontend dropdowns and validation**
    
    This endpoint provides comprehensive category information for building user interfaces,
    form validation, and routing feedback to appropriate government departments. Each 
    category includes detailed metadata for enhanced user experience.

    ## 🎯 Category Structure & Government Departments
    
    Each category routes feedback to specific government departments:

    **🏗️ Infrastructure & Roads** (`infrastructure`)
    - **Department:** Public Works & Infrastructure
    - **Handles:** Roads, bridges, public transport, traffic, construction
    - **Response Team:** Engineers, road maintenance crews, transport planners
    - **Priority Handling:** High priority for safety hazards, urgent for major blockages

    **🏥 Healthcare Services** (`healthcare`)
    - **Department:** Health & Medical Services  
    - **Handles:** Hospitals, clinics, medical equipment, health programs
    - **Response Team:** Health administrators, medical directors, facility managers
    - **Priority Handling:** Urgent for life-threatening issues, high for service disruptions

    **🎓 Education & Schools** (`education`)
    - **Department:** Education & Human Resources
    - **Handles:** Schools, teachers, educational facilities, learning resources
    - **Response Team:** Education officers, school administrators, facility managers
    - **Priority Handling:** High during school terms, urgent for safety issues

    **💧 Water & Sanitation** (`water_sanitation`)
    - **Department:** Water, Sanitation & Environment
    - **Handles:** Water supply, sewage systems, sanitation facilities, waste management
    - **Response Team:** Water engineers, sanitation officers, environmental health
    - **Priority Handling:** Urgent for contamination, high for supply disruptions

    **🛡️ Security & Safety** (`security`)
    - **Department:** Security & Emergency Services
    - **Handles:** Police services, crime prevention, public safety, emergency response
    - **Response Team:** Security coordinators, police liaisons, emergency services
    - **Priority Handling:** Urgent for immediate threats, high for ongoing safety concerns

    **🌱 Environment & Waste** (`environment`)
    - **Department:** Environment & Natural Resources
    - **Handles:** Waste management, pollution, environmental conservation, climate
    - **Response Team:** Environmental officers, waste management, conservation teams
    - **Priority Handling:** Urgent for pollution incidents, high for health hazards

    **🏛️ Governance & Corruption** (`governance`)
    - **Department:** Ethics & Anti-Corruption Unit
    - **Handles:** Corruption reports, misconduct, transparency issues, service delivery
    - **Response Team:** Ethics officers, investigators, internal audit
    - **Priority Handling:** High for corruption, urgent for misconduct affecting services

    **💼 Economic Development** (`economic`)
    - **Department:** Trade, Industry & Economic Development
    - **Handles:** Business environment, employment, economic policies, trade
    - **Response Team:** Economic planners, trade officers, business development
    - **Priority Handling:** Medium generally, high for issues affecting many businesses

    **📋 Other Issues** (`other`)
    - **Department:** General Administration
    - **Handles:** Issues not covered by specific departments, general concerns
    - **Response Team:** Administrative officers, customer service
    - **Priority Handling:** Assessed case by case, routed to appropriate department

    ## 💻 Frontend Integration Examples

    ### React/TypeScript Example
    ```typescript
    interface FeedbackCategory {
      value: string;
      label: string;
      description: string;
      icon: string;
      department: string;
    }
    
    // Fetch categories
    const response = await fetch('/api/feedback/categories/');
    const data = await response.json();
    const categories: FeedbackCategory[] = data.categories;
    
    // Use in component
    <select>
      {categories.map(category => (
        <option key={category.value} value={category.value}>
          {category.icon} {category.label}
        </option>
      ))}
    </select>
    ```

    ### Vue.js Example  
    ```vue
    <template>
      <select v-model="selectedCategory">
        <option value="">Select Category</option>
        <option 
          v-for="category in categories" 
          :key="category.value" 
          :value="category.value"
        >
          {{ category.icon }} {{ category.label }}
        </option>
      </select>
    </template>
    
    <script>
    export default {
      data() {
        return {
          categories: [],
          selectedCategory: ''
        }
      },
      async mounted() {
        const response = await fetch('/api/feedback/categories/');
        const data = await response.json();
        this.categories = data.categories;
      }
    }
    </script>
    ```

    ### Mobile App Integration
    ```dart
    // Flutter example
    class FeedbackCategory {
      final String value;
      final String label;
      final String description;
      final String icon;
      final String department;
      
      FeedbackCategory({...});
    }
    
    Future<List<FeedbackCategory>> fetchCategories() async {
      final response = await http.get('/api/feedback/categories/');
      final data = json.decode(response.body);
      return data['categories'].map<FeedbackCategory>(
        (json) => FeedbackCategory.fromJson(json)
      ).toList();
    }
    ```

    ## 🔍 Validation & Error Handling
    - **Validation:** Use category `value` field for form validation
    - **Display:** Use `label` field for user-friendly display
    - **Help Text:** Use `description` for tooltips or help text
    - **Routing:** Use `department` for internal routing logic

    ## ⚡ Performance & Caching
    - **No Authentication Required** - Completely public endpoint
    - **Cached Response** - Fast loading, cached for 1 hour
    - **Small Payload** - Optimized for mobile applications
    - **CDN Friendly** - Suitable for CDN caching
    """,
    responses={
        200: OpenApiResponse(
            response=FeedbackCategoriesResponseSerializer,
            description="✅ **Categories retrieved successfully** - Complete category list with metadata",
            examples=[
                OpenApiExample(
                    "Complete Category List",
                    summary="All available feedback categories",
                    description="Full list of categories with detailed metadata for frontend implementation",
                    value={
                        "success": True,
                        "categories": [
                            {
                                "value": "infrastructure",
                                "label": "Infrastructure & Roads",
                                "description": "Roads, bridges, public transport, and infrastructure maintenance issues",
                                "icon": "🏗️",
                                "department": "Public Works & Infrastructure"
                            },
                            {
                                "value": "healthcare",
                                "label": "Healthcare Services",
                                "description": "Hospitals, clinics, medical services, and health facility issues",
                                "icon": "🏥",
                                "department": "Health & Medical Services"
                            },
                            {
                                "value": "education",
                                "label": "Education & Schools",
                                "description": "Schools, teachers, educational facilities, and learning resources",
                                "icon": "🎓",
                                "department": "Education & Human Resources"
                            },
                            {
                                "value": "water_sanitation",
                                "label": "Water & Sanitation",
                                "description": "Water supply, sewage systems, sanitation facilities, and waste management",
                                "icon": "💧",
                                "department": "Water, Sanitation & Environment"
                            },
                            {
                                "value": "security",
                                "label": "Security & Safety",
                                "description": "Police services, crime prevention, public safety, and emergency response",
                                "icon": "🛡️",
                                "department": "Security & Emergency Services"
                            },
                            {
                                "value": "environment",
                                "label": "Environment & Waste",
                                "description": "Waste management, pollution, environmental conservation, and climate issues",
                                "icon": "🌱",
                                "department": "Environment & Natural Resources"
                            },
                            {
                                "value": "governance",
                                "label": "Governance & Corruption",
                                "description": "Corruption reports, misconduct, transparency issues, and service delivery problems",
                                "icon": "🏛️",
                                "department": "Ethics & Anti-Corruption Unit"
                            },
                            {
                                "value": "economic",
                                "label": "Economic Development",
                                "description": "Business environment, employment, economic policies, and trade issues",
                                "icon": "💼",
                                "department": "Trade, Industry & Economic Development"
                            },
                            {
                                "value": "other",
                                "label": "Other Issues",
                                "description": "General concerns not covered by specific categories",
                                "icon": "📋",
                                "department": "General Administration"
                            }
                        ]
                    }
                ),
                OpenApiExample(
                    "Category Selection Context",
                    summary="How to present categories to users",
                    description="Enhanced category data with usage context for better user experience",
                    value={
                        "success": True,
                        "categories": [
                            {
                                "value": "governance",
                                "label": "Governance & Corruption",
                                "description": "🔒 Report corruption, misconduct, or transparency issues. Anonymous submission recommended for sensitive reports.",
                                "icon": "🏛️",
                                "department": "Ethics & Anti-Corruption Unit",
                                "anonymous_recommended": True,
                                "typical_response_time": "2-5 days",
                                "enum": ["Bribery", "Misuse of funds", "Service delivery corruption"]
                            },
                            {
                                "value": "infrastructure",
                                "label": "Infrastructure & Roads",
                                "description": "🚧 Report road conditions, bridge problems, or public transport issues that affect community mobility.",
                                "icon": "🏗️", 
                                "department": "Public Works & Infrastructure",
                                "anonymous_recommended": False,
                                "typical_response_time": "1-3 days",
                                "enum": ["Potholes", "Bridge damage", "Traffic signals"]
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
    """Get available feedback categories with enhanced metadata"""
    categories = []
    
    # Enhanced category data with government department routing
    category_metadata = {
        'infrastructure': {
            'icon': '🏗️',
            'department': 'Public Works & Infrastructure',
            'typical_response_time': '1-3 days',
            'anonymous_recommended': False,
            'enum': ['Road conditions', 'Bridge problems', 'Traffic signals', 'Public transport']
        },
        'healthcare': {
            'icon': '🏥',
            'department': 'Health & Medical Services',
            'typical_response_time': '1-2 days',
            'anonymous_recommended': False,
            'enum': ['Hospital services', 'Clinic issues', 'Medical equipment', 'Health programs']
        },
        'education': {
            'icon': '🎓',
            'department': 'Education & Human Resources',
            'typical_response_time': '2-4 days',
            'anonymous_recommended': False,
            'enum': ['School facilities', 'Teacher issues', 'Learning resources', 'Educational programs']
        },
        'water_sanitation': {
            'icon': '💧',
            'department': 'Water, Sanitation & Environment',
            'typical_response_time': '1-3 days',
            'anonymous_recommended': False,
            'enum': ['Water supply', 'Sewage problems', 'Sanitation facilities', 'Water quality']
        },
        'security': {
            'icon': '🛡️',
            'department': 'Security & Emergency Services',
            'typical_response_time': '6-24 hours',
            'anonymous_recommended': True,
            'enum': ['Crime reports', 'Public safety', 'Emergency response', 'Police services']
        },
        'environment': {
            'icon': '🌱',
            'department': 'Environment & Natural Resources',
            'typical_response_time': '2-5 days',
            'anonymous_recommended': False,
            'enum': ['Waste management', 'Pollution', 'Environmental conservation', 'Climate issues']
        },
        'governance': {
            'icon': '🏛️',
            'department': 'Ethics & Anti-Corruption Unit',
            'typical_response_time': '2-7 days',
            'anonymous_recommended': True,
            'enum': ['Corruption reports', 'Misconduct', 'Transparency issues', 'Service delivery problems']
        },
        'economic': {
            'icon': '💼',
            'department': 'Trade, Industry & Economic Development',
            'typical_response_time': '3-7 days',
            'anonymous_recommended': False,
            'enum': ['Business environment', 'Employment issues', 'Economic policies', 'Trade problems']
        },
        'other': {
            'icon': '📋',
            'department': 'General Administration',
            'typical_response_time': '2-5 days',
            'anonymous_recommended': False,
            'enum': ['General concerns', 'Administrative issues', 'Customer service', 'Other matters']
        }
    }
    
    for value, label in FEEDBACK_CATEGORIES:
        metadata = category_metadata.get(value, {})
        
        category_data = {
            'value': value,
            'label': label,
            'description': f"{metadata.get('icon', '📋')} {label} - Submit feedback related to {label.lower()}",
            'icon': metadata.get('icon', '📋'),
            'department': metadata.get('department', 'General Administration')
        }
        
        # Add enhanced metadata for better UX
        if metadata:
            category_data.update({
                'typical_response_time': metadata.get('typical_response_time'),
                'anonymous_recommended': metadata.get('anonymous_recommended'),
                'examples': metadata.get('examples', [])
            })
        
        categories.append(category_data)
    
    return Response({
        'success': True,
        'data': {
            'categories': categories
        }
    })


# =============================================================================
# USER FEEDBACK MANAGEMENT VIEWS (EXISTING - ENHANCED DOCUMENTATION)
# =============================================================================

@extend_schema_view(
    get=extend_schema(
        tags=['Feedback'],
        summary="📋 List My Feedback Submissions",
        description="""
        **📊 Get paginated list of user's own feedback submissions with filtering and statistics**
        
        This endpoint provides authenticated users with a comprehensive view of all their 
        feedback submissions, including advanced filtering, sorting, search capabilities, 
        and user statistics dashboard.
        """,
        parameters=[
            OpenApiParameter('status', description='Filter by feedback status'),
            OpenApiParameter('category', description='Filter by feedback category'),
            OpenApiParameter('priority', description='Filter by priority level'),
            OpenApiParameter('search', description='Search in title and content'),
            OpenApiParameter('ordering', description='Sort results (-created_at, priority, etc.)')
        ]
    )
)
class UserFeedbackListView(generics.ListAPIView):
    """
    🚀 GET /api/feedback/my-submissions/
    Citizens view paginated list of their own feedback submissions
    """
    serializer_class = UserFeedbackListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = UserFeedbackFilter
    ordering_fields = ['created_at', 'updated_at', 'priority', 'status', 'response_count']
    ordering = ['-created_at']  # Newest first by default
    search_fields = ['title', 'content']
    
    def get_queryset(self):
        """Get only user's own feedback (automatic ownership filtering)"""
        # Add check for authenticated users to prevent queryset issues during schema generation
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
            # Include both anonymous and normal feedback for authenticated users
        ).select_related(
            'user_county'
        ).prefetch_related(
            'edit_history'
        )
    
    def list(self, request, *args, **kwargs):
        """Enhanced list response with user statistics and filters"""
        # Get filtered queryset
        queryset = self.filter_queryset(self.get_queryset())

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)

            # Get user statistics (cached for 15 minutes)
            cache_key = f"user_feedback_stats_{request.user.id}"
            user_stats = cache.get(cache_key)
            if user_stats is None:
                user_stats = calculate_user_feedback_stats(request.user)
                cache.set(cache_key, user_stats, 15 * 60)  # 15 minutes

            # Get available filter options
            all_user_feedback = self.get_queryset()
            filter_options = {
                'available_categories': list(all_user_feedback.values_list(
                    'category', flat=True
                ).distinct()),
                'available_statuses': list(all_user_feedback.values_list(
                    'status', flat=True
                ).distinct()),
                'available_priorities': list(all_user_feedback.values_list(
                    'priority', flat=True
                ).distinct()),
            }

            # Get pagination info
            paginator = self.paginator
            page_number = request.query_params.get(paginator.page_query_param, 1)

            # Custom response format that matches frontend expectations
            return Response({
                'success': True,
                'data': {
                    'results': serializer.data,
                    'count': paginator.page.paginator.count,
                    'next': paginator.get_next_link(),
                    'previous': paginator.get_previous_link(),
                    'user_stats': user_stats,
                    'filters': filter_options,
                    'applied_filters': {
                        'status': request.query_params.get('status'),
                        'category': request.query_params.get('category'),
                        'priority': request.query_params.get('priority'),
                        'has_response': request.query_params.get('has_response'),
                        'search': request.query_params.get('search'),
                        'ordering': request.query_params.get('ordering', '-created_at'),
                    }
                }
            })

        # Non-paginated response (fallback)
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'success': True,
            'data': {
                'results': serializer.data,
                'count': len(serializer.data)
            }
        })


@extend_schema_view(
    get=extend_schema(
        tags=['Feedback'],
        summary="🔍 Get My Feedback Details",
        description="""
        **📊 Get detailed view of specific user's feedback submission with full history and timeline**
        """,
    )
)
class UserFeedbackDetailView(generics.RetrieveAPIView):
    """
    🚀 GET /api/feedback/my-submissions/{id}/
    Get detailed view of specific user's submission with responses
    """
    serializer_class = UserFeedbackDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        # Add check for authenticated users to prevent queryset issues
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
            # Include both anonymous and normal feedback
        ).select_related(
            'user_county'
        ).prefetch_related(
            'edit_history',
            'responses__responder'
        )
    
    def retrieve(self, request, *args, **kwargs):
        """Enhanced retrieve with view tracking"""
        instance = self.get_object()
        
        # Track view (increment view count)
        track_feedback_view(instance, request.user)
        
        serializer = self.get_serializer(instance)
        
        return Response({
            'success': True,
            'data': {
                'feedback': serializer.data,
                # Future: add responses, attachments, etc.
            }
        })


@extend_schema_view(
    put=extend_schema(
        tags=['Feedback'],
        summary="✏️ Update My Feedback",
        description="""
        **📝 Update own feedback submission (title, content, category) within allowed constraints**
        """,
    )
)
class UserFeedbackUpdateView(generics.UpdateAPIView):
    """
    🚀 PUT /api/feedback/my-submissions/{id}/
    Update own feedback (title, content, category) if status allows
    """
    serializer_class = UserFeedbackUpdateSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanEditFeedback]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        # Add check for authenticated users to prevent queryset issues
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
            # Include both anonymous and normal feedback
        )
    
    def update(self, request, *args, **kwargs):
        """Enhanced update with permission checks"""
        instance = self.get_object()
        
        # Double-check edit permissions
        can_edit, restriction_reason = instance.can_be_edited()
        if not can_edit:
            return Response({
                'success': False,
                'message': 'Feedback cannot be edited',
                'reason': restriction_reason,
                'error_code': 'EDIT_RESTRICTED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
        serializer.is_valid(raise_exception=True)
        
        # Perform update
        updated_instance = serializer.save()
        
        # Clear user stats cache
        cache_key = f"user_feedback_stats_{request.user.id}"
        cache.delete(cache_key)
        
        # Return updated data
        detail_serializer = UserFeedbackDetailSerializer(updated_instance)
        
        return Response({
            'success': True,
            'message': 'Feedback updated successfully',
            'data': {
                'feedback': detail_serializer.data,
                'edit_count': updated_instance.edit_count,
                'edited_at': updated_instance.edited_at.isoformat() if updated_instance.edited_at else None
            }
        })


@extend_schema_view(
    delete=extend_schema(
        tags=['Feedback'],
        summary="🗑️ Delete My Feedback",
        description="""
        **🗑️ Soft delete own feedback submission within allowed constraints**
        """,
    )
)
class UserFeedbackDeleteView(generics.DestroyAPIView):
    """
    🚀 DELETE /api/feedback/my-submissions/{id}/
    Soft delete own feedback submission
    """
    serializer_class = UserFeedbackDetailSerializer  # Add missing serializer class
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanDeleteFeedback]
    lookup_field = 'id'
    
    def get_queryset(self):
        """Get only user's own feedback"""
        # Add check for authenticated users to prevent queryset issues
        if not self.request.user.is_authenticated:
            return Feedback.objects.none()
            
        return Feedback.objects.filter(
            user=self.request.user,
            is_deleted=False
            # Include both anonymous and normal feedback
        )
    
    def destroy(self, request, *args, **kwargs):
        """Enhanced soft delete with permission checks"""
        instance = self.get_object()
        
        # Double-check delete permissions
        can_delete, restriction_reason = instance.can_be_deleted()
        if not can_delete:
            return Response({
                'success': False,
                'message': 'Feedback cannot be deleted',
                'reason': restriction_reason,
                'error_code': 'DELETE_RESTRICTED'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Perform soft delete
        instance.soft_delete(user=request.user)
        
        # Clear user stats cache
        cache_key = f"user_feedback_stats_{request.user.id}"
        cache.delete(cache_key)
        
        return Response({
            'success': True,
            'message': 'Feedback deleted successfully',
            'data': {
                'deleted_at': instance.deleted_at.isoformat(),
                'tracking_id': instance.tracking_id,
                'note': 'This feedback has been soft deleted and can be recovered by administrators if needed.'
            }
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Feedback'],
    summary="📊 My Feedback Statistics",
    description="""
    **📈 Get comprehensive user feedback statistics and analytics dashboard data**
    """,
    responses={
        200: OpenApiResponse(
            response=UserFeedbackStatsSerializer,
            description="✅ **Statistics retrieved successfully**"
        )
    }
)
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def user_feedback_statistics(request):
    """
    🚀 GET /api/feedback/my-stats/
    Get comprehensive user feedback statistics
    """
    user = request.user
    
    # Get comprehensive stats (cached)
    cache_key = f"detailed_user_stats_{user.id}"
    detailed_stats = cache.get(cache_key)
    
    if detailed_stats is None:
        user_feedback = Feedback.objects.filter(user=user, is_deleted=False)
        
        # Basic counts
        basic_stats = {
            'total_submissions': user_feedback.count(),
            'pending_count': user_feedback.filter(status='pending').count(),
            'in_review_count': user_feedback.filter(status='in_review').count(),
            'responded_count': user_feedback.filter(status='responded').count(),
            'resolved_count': user_feedback.filter(status='resolved').count(),
            'closed_count': user_feedback.filter(status='closed').count(),
        }
        
        # Monthly breakdown (last 12 months)
        monthly_stats = []
        for i in range(12):
            month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
            month_end = month_start + timedelta(days=30)
            
            month_count = user_feedback.filter(
                created_at__gte=month_start,
                created_at__lt=month_end
            ).count()
            
            monthly_stats.append({
                'month': month_start.strftime('%Y-%m'),
                'count': month_count
            })
        
        # Category analysis
        category_stats = user_feedback.values('category').annotate(
            count=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            resolved=Count('id', filter=Q(status='resolved'))
        ).order_by('-count')
        
        # Response time analysis
        responded_feedback = user_feedback.filter(response_count__gt=0, last_response_at__isnull=False)
        avg_response_days = None
        if responded_feedback.exists():
            response_times = []
            for feedback in responded_feedback:
                delta = feedback.last_response_at - feedback.created_at
                response_times.append(delta.days)
            
            if response_times:
                avg_response_days = sum(response_times) / len(response_times)
        
        # Engagement metrics
        most_viewed = user_feedback.order_by('-view_count').first()
        most_edited = user_feedback.order_by('-edit_count').first()
        
        engagement_stats = {
            'total_views': user_feedback.aggregate(total=Count('view_count'))['total'] or 0,
            'total_edits': user_feedback.aggregate(total=Count('edit_count'))['total'] or 0,
            'most_viewed_feedback': {
                'id': str(most_viewed.id),
                'title': most_viewed.title,
                'view_count': most_viewed.view_count
            } if most_viewed else None,
            'most_edited_feedback': {
                'id': str(most_edited.id),
                'title': most_edited.title,
                'edit_count': most_edited.edit_count
            } if most_edited else None,
        }
        
        detailed_stats = {
            **basic_stats,
            'monthly_breakdown': list(reversed(monthly_stats)),  # Oldest to newest
            'category_breakdown': list(category_stats),
            'average_response_days': round(avg_response_days, 1) if avg_response_days else None,
            'engagement': engagement_stats,
            'success_rate': round(
                (basic_stats['resolved_count'] / basic_stats['total_submissions']) * 100, 1
            ) if basic_stats['total_submissions'] > 0 else 0,
        }
        
        # Cache for 1 hour
        cache.set(cache_key, detailed_stats, 60 * 60)
    
    return Response({
        'success': True,
        'data': detailed_stats
    })


# # =============================================================================
# # FILE: apps/feedback/views.py (ENHANCED WITH SWAGGER DOCUMENTATION)
# # =============================================================================
# from rest_framework import status, generics, permissions
# from rest_framework.decorators import api_view, permission_classes, throttle_classes
# from rest_framework.response import Response
# from rest_framework.views import APIView
# from django.db.models import Q, Count


# from django_filters.rest_framework import DjangoFilterBackend
# from rest_framework.filters import OrderingFilter, SearchFilter

# from .filters import UserFeedbackFilter
# from .utils import calculate_user_feedback_stats, track_feedback_view

# from datetime import timedelta
# from django.utils import timezone

# from django.core.cache import cache
# from rest_framework.throttling import UserRateThrottle, AnonRateThrottle
# from django.shortcuts import get_object_or_404
# from django.views.decorators.csrf import csrf_exempt
# from django.utils.decorators import method_decorator
# from drf_spectacular.utils import (
#     extend_schema, 
#     OpenApiExample, 
#     OpenApiParameter,
#     OpenApiResponse,
#     extend_schema_view
# )
# from drf_spectacular.types import OpenApiTypes

# from apps.core.decorators import invisible_permission_required, endpoint_allowed
# from .models import Feedback, FEEDBACK_CATEGORIES
# from .serializers import (
#     FeedbackSubmissionSerializer, AnonymousFeedbackSerializer,
#     FeedbackTrackingSerializer, FeedbackCategorySerializer,
#     FeedbackSubmissionResponseSerializer, AnonymousFeedbackResponseSerializer,
#     FeedbackTrackingResponseSerializer, FeedbackCategoriesResponseSerializer,
#     ErrorResponseSerializer, UserFeedbackListSerializer, UserFeedbackDetailSerializer, 
#     UserFeedbackUpdateSerializer
# )
# from .permissions import CanSubmitFeedback, IsOwnerOrReadOnly, CanEditFeedback, CanDeleteFeedback


# class FeedbackRateThrottle(UserRateThrottle):
#     """Custom throttle for feedback submission"""
#     scope = 'feedback'


# @extend_schema(
#     tags=['Feedback'],
#     summary="📝 Submit Authenticated Feedback",
#     description="""
#     **Authenticated citizens submit feedback** to their county government.
    
#     **🎯 Key Features:**
#     - **Secure submission** with JWT authentication
#     - **Location hierarchy** support (County → Sub-County → Ward → Village)
#     - **Category classification** for organized feedback management
#     - **Priority levels** to indicate urgency
#     - **Tracking system** with unique tracking ID
#     - **Rate limiting** to prevent spam
    
#     **📍 Location Hierarchy:**
#     Use the location endpoints to get valid IDs:
#     - Counties: `GET /api/locations/counties/`
#     - Sub-counties: `GET /api/locations/hierarchy/?county_id=1&type=sub_county`
#     - Wards: `GET /api/locations/hierarchy/?parent_id=5&type=ward`
#     - Villages: `GET /api/locations/hierarchy/?parent_id=15&type=village`
    
#     **🏛️ Tenant Isolation:**
#     Users can only submit feedback to counties they have access to based on their role:
#     - **Citizens**: Home county only
#     - **Government Officials**: Based on their access level
    
#     **⚡ Rate Limiting:**
#     - Citizens: 10 submissions per day
#     - Government Officials: 50 submissions per day
#     """,
#     request=FeedbackSubmissionSerializer,
#     responses={
#         201: OpenApiResponse(
#             response=FeedbackSubmissionResponseSerializer,
#             description="Feedback submitted successfully",
#             examples=[
#                 OpenApiExample(
#                     "Successful Submission",
#                     value={
#                         "success": True,
#                         "message": "Feedback submitted successfully",
#                         "data": {
#                             "feedback_id": "550e8400-e29b-41d4-a716-446655440000",
#                             "tracking_id": "FB240815KSM001",
#                             "status": "pending",
#                             "submitted_at": "2024-08-15T10:30:00Z",
#                             "location_path": "Kisumu > Kisumu East > Kondele"
#                         }
#                     }
#                 )
#             ]
#         ),
#         400: OpenApiResponse(
#             response=ErrorResponseSerializer,
#             description="Validation errors or rate limit exceeded",
#             examples=[
#                 OpenApiExample(
#                     "Validation Error",
#                     value={
#                         "success": False,
#                         "message": "Feedback submission failed",
#                         "errors": {
#                             "title": ["This field is required"],
#                             "category": ["Invalid category selection"]
#                         }
#                     }
#                 ),
#                 OpenApiExample(
#                     "Rate Limit Exceeded",
#                     value={
#                         "success": False,
#                         "message": "Feedback submission failed",
#                         "errors": {
#                             "non_field_errors": ["You have reached your daily submission limit of 10 feedback items"]
#                         }
#                     }
#                 )
#             ]
#         ),
#         401: OpenApiResponse(
#             response=ErrorResponseSerializer,
#             description="Authentication required"
#         ),
#         403: OpenApiResponse(
#             response=ErrorResponseSerializer,
#             description="Permission denied - cannot submit to this county"
#         )
#     }
# )
# @method_decorator(csrf_exempt, name='dispatch')
# class FeedbackSubmissionView(APIView):
#     """Authenticated citizens submit feedback"""
#     permission_classes = [CanSubmitFeedback]
#     throttle_classes = [FeedbackRateThrottle]
    
#     def post(self, request):
#         serializer = FeedbackSubmissionSerializer(
#             data=request.data,
#             context={'request': request}
#         )
        
#         if serializer.is_valid():
#             feedback = serializer.save()
            
#             return Response({
#                 'success': True,
#                 'message': 'Feedback submitted successfully',
#                 'data': {
#                     'feedback_id': str(feedback.id),
#                     'tracking_id': feedback.tracking_id,
#                     'status': feedback.status,
#                     'submitted_at': feedback.created_at.isoformat(),
#                     'location_path': feedback.get_location_path()
#                 }
#             }, status=status.HTTP_201_CREATED)
        
#         return Response({
#             'success': False,
#             'message': 'Feedback submission failed',
#             'errors': serializer.errors
#         }, status=status.HTTP_400_BAD_REQUEST)


# @extend_schema(
#     tags=['Feedback'],
#     summary="👤 Submit Anonymous Feedback",
#     description="""
#     **Anonymous users submit feedback** without revealing their identity.
    
#     **🔒 Privacy-First Design:**
#     - **No personal information** required or stored
#     - **Session-based** submission using anonymous session ID
#     - **Limited submissions** per session (3 maximum)
#     - **2-hour session** lifetime for privacy
#     - **Tracking support** via unique tracking ID
    
#     **📋 How It Works:**
#     1. **Create anonymous session**: `POST /api/auth/anonymous/`
#     2. **Submit feedback** using the session_id from step 1
#     3. **Track status** using the returned tracking_id
    
#     **🎯 Perfect For:**
#     - Citizens who want **complete privacy**
#     - **Sensitive reports** about corruption or misconduct  
#     - **Quick feedback** without account creation
#     - **Public kiosks** or community feedback systems
    
#     **⚡ Session Limits:**
#     - **3 submissions** per session maximum
#     - **2-hour** session expiry
#     - **County-locked** submissions (must match session county)
    
#     **🛡️ Security Features:**
#     - Session validation and expiry
#     - Rate limiting per session
#     - Anonymous user creation with no PII
#     - Tracking ID for transparency without identity exposure
#     """,
#     request=AnonymousFeedbackSerializer,
#     responses={
#         201: OpenApiResponse(
#             response=AnonymousFeedbackResponseSerializer,
#             description="Anonymous feedback submitted successfully",
#             examples=[
#                 OpenApiExample(
#                     "Anonymous Submission Success",
#                     value={
#                         "success": True,
#                         "message": "Anonymous feedback submitted successfully",
#                         "data": {
#                             "tracking_id": "FB240815ANO001",
#                             "status": "pending",
#                             "submitted_at": "2024-08-15T14:45:00Z",
#                             "location_path": "Nairobi > Westlands > Kitisuru",
#                             "instructions": "Save your tracking ID to check status later"
#                         }
#                     }
#                 )
#             ]
#         ),
#         400: OpenApiResponse(
#             response=ErrorResponseSerializer,
#             description="Invalid session, validation errors, or submission limit exceeded",
#             examples=[
#                 OpenApiExample(
#                     "Session Expired",
#                     value={
#                         "success": False,
#                         "message": "Anonymous feedback submission failed",
#                         "errors": {
#                             "session_id": ["Invalid or expired session"]
#                         }
#                     }
#                 ),
#                 OpenApiExample(
#                     "Submission Limit Reached",
#                     value={
#                         "success": False,
#                         "message": "Anonymous feedback submission failed", 
#                         "errors": {
#                             "session_id": ["Session has reached maximum submissions (3)"]
#                         }
#                     }
#                 ),
#                 OpenApiExample(
#                     "County Mismatch",
#                     value={
#                         "success": False,
#                         "message": "Anonymous feedback submission failed",
#                         "errors": {
#                             "non_field_errors": ["County must match session county"]
#                         }
#                     }
#                 )
#             ]
#         )
#     }
# )
# @method_decorator(csrf_exempt, name='dispatch')
# class AnonymousFeedbackView(APIView):
#     """Anonymous users submit feedback via session"""
#     permission_classes = [permissions.AllowAny]
#     throttle_classes = [AnonRateThrottle]
    
#     def post(self, request):
#         serializer = AnonymousFeedbackSerializer(data=request.data)
        
#         if serializer.is_valid():
#             feedback = serializer.save()
            
#             return Response({
#                 'success': True,
#                 'message': 'Anonymous feedback submitted successfully',
#                 'data': {
#                     'tracking_id': feedback.tracking_id,
#                     'status': feedback.status,
#                     'submitted_at': feedback.created_at.isoformat(),
#                     'location_path': feedback.get_location_path(),
#                     'instructions': 'Save your tracking ID to check status later'
#                 }
#             }, status=status.HTTP_201_CREATED)
        
#         return Response({
#             'success': False,
#             'message': 'Anonymous feedback submission failed',
#             'errors': serializer.errors
#         }, status=status.HTTP_400_BAD_REQUEST)


# @extend_schema(
#     tags=['Feedback'],
#     summary="🔍 Track Feedback Status",
#     description="""
#     **Track feedback status** using the tracking ID provided during submission.
    
#     **🎯 Public Transparency:**
#     - **No authentication** required - completely public
#     - **Works for both** authenticated and anonymous feedback
#     - **Real-time status** updates from government officials
#     - **Response tracking** shows government engagement
#     - **View counter** for transparency metrics
    
#     **📊 Tracking Information Provided:**
#     - **Current status** (Pending, In Review, Responded, Resolved, Closed)
#     - **Submission timestamp** and location details
#     - **Response count** from government officials  
#     - **Last response date** for activity tracking
#     - **Category information** for context
    
#     **🔍 Status Meanings:**
#     - **Pending**: Feedback received, waiting for review
#     - **In Review**: Government official is reviewing the issue
#     - **Responded**: Official has provided a response or update
#     - **Resolved**: Issue has been addressed and resolved
#     - **Closed**: Feedback completed or no longer actionable
    
#     **💡 Use Cases:**
#     - Citizens tracking their submitted feedback
#     - Anonymous users checking feedback status
#     - Community transparency initiatives
#     - Government accountability tracking
#     - Public feedback kiosks showing real-time status
    
#     **🔒 Privacy Protection:**
#     - No personal information exposed
#     - Anonymous submissions remain anonymous
#     - Only public status information shown
#     """,
#     parameters=[
#         OpenApiParameter(
#             name='tracking_id',
#             type=OpenApiTypes.STR,
#             location=OpenApiParameter.PATH,
#             description='Unique tracking ID provided during feedback submission (e.g., FB240815KSM001)',
#             examples=[
#                 OpenApiExample('Authenticated feedback', value='FB240815KSM001'),
#                 OpenApiExample('Anonymous feedback', value='FB240815ANO001')
#             ]
#         )
#     ],
#     responses={
#         200: OpenApiResponse(
#             response=FeedbackTrackingResponseSerializer,
#             description="Feedback status retrieved successfully",
#             examples=[
#                 OpenApiExample(
#                     "Pending Feedback",
#                     value={
#                         "success": True,
#                         "data": {
#                             "tracking_id": "FB240815KSM001",
#                             "title": "Poor road conditions on Kisumu-Kakamega highway",
#                             "category": "infrastructure",
#                             "category_display": "Infrastructure & Roads",
#                             "status": "pending",
#                             "status_display": "Pending",
#                             "submitted_at": "2024-08-15T10:30:00Z",
#                             "location_path": "Kisumu > Kisumu East > Kondele",
#                             "response_count": 0,
#                             "last_response_at": None
#                         }
#                     }
#                 ),
#                 OpenApiExample(
#                     "Responded Feedback",
#                     value={
#                         "success": True,
#                         "data": {
#                             "tracking_id": "FB240815KSM002",
#                             "title": "Water shortage in residential area",
#                             "category": "water_sanitation",
#                             "category_display": "Water & Sanitation",
#                             "status": "responded",
#                             "status_display": "Responded",
#                             "submitted_at": "2024-08-15T08:15:00Z",
#                             "location_path": "Kisumu > Kisumu West > Central Kisumu",
#                             "response_count": 2,
#                             "last_response_at": "2024-08-16T14:22:00Z"
#                         }
#                     }
#                 )
#             ]
#         ),
#         404: OpenApiResponse(
#             response=ErrorResponseSerializer,
#             description="Feedback not found with provided tracking ID",
#             examples=[
#                 OpenApiExample(
#                     "Tracking ID Not Found",
#                     value={
#                         "success": False,
#                         "message": "Feedback not found"
#                     }
#                 )
#             ]
#         )
#     }
# )
# @csrf_exempt
# @api_view(['GET'])
# @permission_classes([permissions.AllowAny])
# def track_feedback(request, tracking_id):
#     """Track feedback status using tracking ID"""
#     try:
#         feedback = get_object_or_404(Feedback, tracking_id=tracking_id.upper())
        
#         # Increment view count for analytics
#         feedback.view_count += 1
#         feedback.save(update_fields=['view_count'])
        
#         serializer = FeedbackTrackingSerializer(feedback)
        
#         return Response({
#             'success': True,
#             'data': serializer.data
#         })
    
#     except Feedback.DoesNotExist:
#         return Response({
#             'success': False,
#             'message': 'Feedback not found'
#         }, status=status.HTTP_404_NOT_FOUND)


# @extend_schema(
#     tags=['Feedback'],
#     summary="📂 Get Feedback Categories",
#     description="""
#     **Get all available feedback categories** for form dropdowns and validation.
    
#     **🎯 Categories Available:**
#     Perfect for organizing citizen feedback into government departments:
    
#     - **🏗️ Infrastructure & Roads** - Road conditions, bridges, transportation
#     - **🏥 Healthcare Services** - Hospitals, clinics, medical services  
#     - **🎓 Education & Schools** - Schools, teachers, educational resources
#     - **💧 Water & Sanitation** - Water supply, sewage, sanitation facilities
#     - **🛡️ Security & Safety** - Police services, crime, public safety
#     - **🌱 Environment & Waste** - Waste management, pollution, environmental issues
#     - **🏛️ Governance & Corruption** - Government services, corruption reports
#     - **💼 Economic Development** - Business, employment, economic issues
#     - **📋 Other Issues** - General feedback not covered by specific categories
    
#     **💡 Frontend Integration:**
#     ```javascript
#     // Perfect for React/Vue select components
#     const categories = await fetch('/api/feedback/categories/')
#       .then(res => res.json());
      
#     // Use in forms
#     <select>
#       {categories.categories.map(cat => 
#         <option value={cat.value}>{cat.label}</option>
#       )}
#     </select>
#     ```
    
#     **🔍 Usage Scenarios:**
#     - **Form validation** - Ensure valid category selection
#     - **Dropdown population** - Dynamic form generation
#     - **Analytics filtering** - Filter feedback by category
#     - **Government routing** - Route feedback to appropriate departments
#     - **Mobile apps** - Category selection in mobile interfaces
    
#     **⚡ Performance:**
#     - **No authentication** required - completely public
#     - **Cached response** for fast loading
#     - **Small payload** perfect for mobile applications
#     """,
#     responses={
#         200: OpenApiResponse(
#             response=FeedbackCategoriesResponseSerializer,
#             description="Feedback categories retrieved successfully",
#             examples=[
#                 OpenApiExample(
#                     "All Categories",
#                     value={
#                         "success": True,
#                         "categories": [
#                             {
#                                 "value": "infrastructure",
#                                 "label": "Infrastructure & Roads",
#                                 "description": "Submit feedback related to infrastructure & roads"
#                             },
#                             {
#                                 "value": "healthcare",
#                                 "label": "Healthcare Services", 
#                                 "description": "Submit feedback related to healthcare services"
#                             },
#                             {
#                                 "value": "education",
#                                 "label": "Education & Schools",
#                                 "description": "Submit feedback related to education & schools"
#                             },
#                             {
#                                 "value": "water_sanitation",
#                                 "label": "Water & Sanitation",
#                                 "description": "Submit feedback related to water & sanitation"
#                             },
#                             {
#                                 "value": "security",
#                                 "label": "Security & Safety",
#                                 "description": "Submit feedback related to security & safety"
#                             },
#                             {
#                                 "value": "environment",
#                                 "label": "Environment & Waste",
#                                 "description": "Submit feedback related to environment & waste"
#                             },
#                             {
#                                 "value": "governance",
#                                 "label": "Governance & Corruption",
#                                 "description": "Submit feedback related to governance & corruption"
#                             },
#                             {
#                                 "value": "economic",
#                                 "label": "Economic Development",
#                                 "description": "Submit feedback related to economic development"
#                             },
#                             {
#                                 "value": "other",
#                                 "label": "Other Issues",
#                                 "description": "Submit feedback related to other issues"
#                             }
#                         ]
#                     }
#                 )
#             ]
#         )
#     }
# )
# @csrf_exempt
# @api_view(['GET'])
# @permission_classes([permissions.AllowAny])
# def feedback_categories(request):
#     """Get available feedback categories"""
#     categories = [
#         {
#             'value': value,
#             'label': label,
#             'description': f"Submit feedback related to {label.lower()}"
#         }
#         for value, label in FEEDBACK_CATEGORIES
#     ]
    
#     return Response({
#         'success': True,
#         'categories': categories
#     })


# class UserFeedbackListView(generics.ListAPIView):
#     """
#     🚀 GET /api/feedback/my-submissions/
#     Citizens view paginated list of their own feedback submissions
#     """
#     serializer_class = UserFeedbackListSerializer
#     permission_classes = [permissions.IsAuthenticated]
#     filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
#     filterset_class = UserFeedbackFilter
#     ordering_fields = ['created_at', 'updated_at', 'priority', 'status', 'response_count']
#     ordering = ['-created_at']  # Newest first by default
#     search_fields = ['title', 'content']
    
#     def get_queryset(self):
#         """Get only user's own feedback (automatic ownership filtering)"""
#         return Feedback.objects.filter(
#             user=self.request.user,
#             is_deleted=False,
#             is_anonymous=False  # Exclude anonymous feedback
#         ).select_related(
#             'county', 'sub_county', 'ward', 'village'
#         ).prefetch_related(
#             'edit_history'
#         )
    
#     def list(self, request, *args, **kwargs):
#         """Enhanced list response with user statistics and filters"""
#         # Get filtered queryset
#         queryset = self.filter_queryset(self.get_queryset())
        
#         # Pagination
#         page = self.paginate_queryset(queryset)
#         if page is not None:
#             serializer = self.get_serializer(page, many=True)
            
#             # Get user statistics (cached for 15 minutes)
#             cache_key = f"user_feedback_stats_{request.user.id}"
#             user_stats = cache.get(cache_key)
#             if user_stats is None:
#                 user_stats = calculate_user_feedback_stats(request.user)
#                 cache.set(cache_key, user_stats, 15 * 60)  # 15 minutes
            
#             # Get available filter options
#             all_user_feedback = self.get_queryset()
#             filter_options = {
#                 'available_categories': list(all_user_feedback.values_list(
#                     'category', flat=True
#                 ).distinct()),
#                 'available_statuses': list(all_user_feedback.values_list(
#                     'status', flat=True
#                 ).distinct()),
#                 'available_priorities': list(all_user_feedback.values_list(
#                     'priority', flat=True
#                 ).distinct()),
#             }
            
#             # Custom paginated response
#             return self.get_paginated_response({
#                 'results': serializer.data,
#                 'user_stats': user_stats,
#                 'filters': filter_options,
#                 'applied_filters': {
#                     'status': request.query_params.get('status'),
#                     'category': request.query_params.get('category'),
#                     'priority': request.query_params.get('priority'),
#                     'has_response': request.query_params.get('has_response'),
#                     'search': request.query_params.get('search'),
#                     'ordering': request.query_params.get('ordering', '-created_at'),
#                 }
#             })
        
#         # Non-paginated response (fallback)
#         serializer = self.get_serializer(queryset, many=True)
#         return Response({
#             'success': True,
#             'data': {
#                 'results': serializer.data,
#                 'count': len(serializer.data)
#             }
#         })


# class UserFeedbackDetailView(generics.RetrieveAPIView):
#     """
#     🚀 GET /api/feedback/my-submissions/{id}/
#     Get detailed view of specific user's submission with responses
#     """
#     serializer_class = UserFeedbackDetailSerializer
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]
#     lookup_field = 'id'
    
#     def get_queryset(self):
#         """Get only user's own feedback"""
#         return Feedback.objects.filter(
#             user=self.request.user,
#             is_deleted=False,
#             is_anonymous=False
#         ).select_related(
#             'county', 'sub_county', 'ward', 'village'
#         ).prefetch_related(
#             'edit_history',
#             # 'responses'  # Future implementation
#         )
    
#     def retrieve(self, request, *args, **kwargs):
#         """Enhanced retrieve with view tracking"""
#         instance = self.get_object()
        
#         # Track view (increment view count)
#         track_feedback_view(instance, request.user)
        
#         serializer = self.get_serializer(instance)
        
#         return Response({
#             'success': True,
#             'data': {
#                 'feedback': serializer.data,
#                 # Future: add responses, attachments, etc.
#             }
#         })


# class UserFeedbackUpdateView(generics.UpdateAPIView):
#     """
#     🚀 PUT /api/feedback/my-submissions/{id}/
#     Update own feedback (title, content, category) if status allows
#     """
#     serializer_class = UserFeedbackUpdateSerializer
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanEditFeedback]
#     lookup_field = 'id'
    
#     def get_queryset(self):
#         """Get only user's own feedback"""
#         return Feedback.objects.filter(
#             user=self.request.user,
#             is_deleted=False,
#             is_anonymous=False
#         )
    
#     def update(self, request, *args, **kwargs):
#         """Enhanced update with permission checks"""
#         instance = self.get_object()
        
#         # Double-check edit permissions
#         can_edit, restriction_reason = instance.can_be_edited()
#         if not can_edit:
#             return Response({
#                 'success': False,
#                 'message': 'Feedback cannot be edited',
#                 'reason': restriction_reason,
#                 'error_code': 'EDIT_RESTRICTED'
#             }, status=status.HTTP_403_FORBIDDEN)
        
#         serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
#         serializer.is_valid(raise_exception=True)
        
#         # Perform update
#         updated_instance = serializer.save()
        
#         # Clear user stats cache
#         cache_key = f"user_feedback_stats_{request.user.id}"
#         cache.delete(cache_key)
        
#         # Return updated data
#         detail_serializer = UserFeedbackDetailSerializer(updated_instance)
        
#         return Response({
#             'success': True,
#             'message': 'Feedback updated successfully',
#             'data': {
#                 'feedback': detail_serializer.data,
#                 'edit_count': updated_instance.edit_count,
#                 'edited_at': updated_instance.edited_at.isoformat() if updated_instance.edited_at else None
#             }
#         })


# class UserFeedbackDeleteView(generics.DestroyAPIView):
#     """
#     🚀 DELETE /api/feedback/my-submissions/{id}/
#     Soft delete own feedback submission
#     """
#     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly, CanDeleteFeedback]
#     lookup_field = 'id'
    
#     def get_queryset(self):
#         """Get only user's own feedback"""
#         return Feedback.objects.filter(
#             user=self.request.user,
#             is_deleted=False,
#             is_anonymous=False
#         )
    
#     def destroy(self, request, *args, **kwargs):
#         """Enhanced soft delete with permission checks"""
#         instance = self.get_object()
        
#         # Double-check delete permissions
#         can_delete, restriction_reason = instance.can_be_deleted()
#         if not can_delete:
#             return Response({
#                 'success': False,
#                 'message': 'Feedback cannot be deleted',
#                 'reason': restriction_reason,
#                 'error_code': 'DELETE_RESTRICTED'
#             }, status=status.HTTP_403_FORBIDDEN)
        
#         # Perform soft delete
#         instance.soft_delete(user=request.user)
        
#         # Clear user stats cache
#         cache_key = f"user_feedback_stats_{request.user.id}"
#         cache.delete(cache_key)
        
#         return Response({
#             'success': True,
#             'message': 'Feedback deleted successfully',
#             'data': {
#                 'deleted_at': instance.deleted_at.isoformat(),
#                 'tracking_id': instance.tracking_id,
#                 'note': 'This feedback has been soft deleted and can be recovered by administrators if needed.'
#             }
#         }, status=status.HTTP_200_OK)



# @api_view(['GET'])
# @permission_classes([permissions.IsAuthenticated])
# def user_feedback_statistics(request):
#     """
#     🚀 GET /api/feedback/my-stats/
#     Get comprehensive user feedback statistics
#     """
#     user = request.user
    
#     # Get comprehensive stats (cached)
#     cache_key = f"detailed_user_stats_{user.id}"
#     detailed_stats = cache.get(cache_key)
    
#     if detailed_stats is None:
#         user_feedback = Feedback.objects.filter(user=user, is_deleted=False, is_anonymous=False)
        
#         # Basic counts
#         basic_stats = {
#             'total_submissions': user_feedback.count(),
#             'pending_count': user_feedback.filter(status='pending').count(),
#             'in_review_count': user_feedback.filter(status='in_review').count(),
#             'responded_count': user_feedback.filter(status='responded').count(),
#             'resolved_count': user_feedback.filter(status='resolved').count(),
#             'closed_count': user_feedback.filter(status='closed').count(),
#         }
        
#         # Monthly breakdown (last 12 months)
#         monthly_stats = []
#         for i in range(12):
#             month_start = timezone.now().replace(day=1) - timedelta(days=30*i)
#             month_end = month_start + timedelta(days=30)
            
#             month_count = user_feedback.filter(
#                 created_at__gte=month_start,
#                 created_at__lt=month_end
#             ).count()
            
#             monthly_stats.append({
#                 'month': month_start.strftime('%Y-%m'),
#                 'count': month_count
#             })
        
#         # Category analysis
#         category_stats = user_feedback.values('category').annotate(
#             count=Count('id'),
#             pending=Count('id', filter=Q(status='pending')),
#             resolved=Count('id', filter=Q(status='resolved'))
#         ).order_by('-count')
        
#         # Response time analysis
#         responded_feedback = user_feedback.filter(response_count__gt=0, last_response_at__isnull=False)
#         avg_response_days = None
#         if responded_feedback.exists():
#             response_times = []
#             for feedback in responded_feedback:
#                 delta = feedback.last_response_at - feedback.created_at
#                 response_times.append(delta.days)
            
#             if response_times:
#                 avg_response_days = sum(response_times) / len(response_times)
        
#         # Engagement metrics
#         engagement_stats = {
#             'total_views': user_feedback.aggregate(total=Count('view_count'))['total'] or 0,
#             'total_edits': user_feedback.aggregate(total=Count('edit_count'))['total'] or 0,
#             'most_viewed_feedback': user_feedback.order_by('-view_count').first(),
#             'most_edited_feedback': user_feedback.order_by('-edit_count').first(),
#         }
        
#         detailed_stats = {
#             **basic_stats,
#             'monthly_breakdown': list(reversed(monthly_stats)),  # Oldest to newest
#             'category_breakdown': list(category_stats),
#             'average_response_days': round(avg_response_days, 1) if avg_response_days else None,
#             'engagement': engagement_stats,
#             'success_rate': round(
#                 (basic_stats['resolved_count'] / basic_stats['total_submissions']) * 100, 1
#             ) if basic_stats['total_submissions'] > 0 else 0,
#         }
        
#         # Cache for 1 hour
#         cache.set(cache_key, detailed_stats, 60 * 60)
    
#     return Response({
#         'success': True,
#         'data': detailed_stats
#     })
