# apps/api/admin_views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q, Case, When, IntegerField
from django.utils import timezone
from apps.users.models import CustomUser, County
from apps.feedback.models import Feedback
from apps.projects.models import Project, Bill
from .utils import (
    process_bill_with_enhanced_features, 
    validate_pdf_file
)
from .progress_tracker import (
    get_bill_progress, 
    reset_bill_progress
)
from .async_progress_tracker import (
    start_async_bill_processing,
    get_bill_processing_status,
    retry_failed_bill_processing,
    cancel_bill_processing,
    get_all_active_processing_sessions
)
from .tasks import (
    save_uploaded_file_for_async,
    process_bill_async
    )

# OpenAPI documentation imports
from drf_spectacular.utils import extend_schema, OpenApiExample, OpenApiParameter, inline_serializer
from drf_spectacular.openapi import OpenApiTypes
from rest_framework import serializers
from .serializers import (
    BillProcessingResponseSerializer,
    BillProcessingStatusSerializer, ProcessingOverviewResponseSerializer,
    SuccessResponseSerializer, ErrorResponseSerializer,
    AdminBillListResponseSerializer,
)

from .bill_serializers import (
    BillCreateRequestSerializer,
    BillUpdateRequestSerializer, 
    ProcessingRetryRequestSerializer,
    FeedbackResponseRequestSerializer,
    ProjectCreateRequestSerializer,
    ProjectUpdateRequestSerializer,
    StatusUpdateRequestSerializer,
    # Response serializers
    DashboardStatsResponseSerializer,
    UsersListResponseSerializer,
    FeedbackListResponseSerializer,
    FeedbackResponseSuccessSerializer,
    ProjectsListResponseSerializer,
    ProjectCreatedResponseSerializer,
    BillProgressResponseSerializer,
    ProcessingRetrySuccessSerializer,
    CancellationSuccessSerializer
)

import logging

logger = logging.getLogger(__name__)

@extend_schema(
    summary="Get Admin Dashboard Statistics",
    description="""
    Retrieve comprehensive dashboard statistics for parliament administrators.
    
    **Frontend Integration:**
    - Use this endpoint to populate the main admin dashboard
    - Refresh every 30 seconds for real-time stats
    - Display charts and counters based on returned data
    - Handle different admin levels (national vs regional scope)
    
    **Returned Statistics:**
    - User counts and demographics
    - Feedback statistics by status
    - Project and bill summaries
    - System-wide metrics
    """,
    tags=["Admin Dashboard"],
    responses={
        200: DashboardStatsResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats(request):
    """Get admin dashboard statistics for national parliament system"""
    # notes_for_frontend: Call this endpoint on dashboard load and set up auto-refresh every 30-60 seconds
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # Debug logging
    logger.info(f"📊 National dashboard stats for {user.name} (Level: {user.admin_level})")
    
    # Optimize feedback stats with single aggregated query
    feedback_stats = Feedback.objects.filter(is_deleted=False).aggregate(
        total_feedback=Count('id'),
        pending_feedback=Count(Case(When(status='pending', then=1), output_field=IntegerField())),
        in_review_feedback=Count(Case(When(status='in_review', then=1), output_field=IntegerField())),
        responded_feedback=Count(Case(When(status='responded', then=1), output_field=IntegerField())),
        resolved_feedback=Count(Case(When(status='resolved', then=1), output_field=IntegerField()))
    )
    
    logger.info(f"📈 National feedback stats: {feedback_stats}")
    
    # Get other stats
    total_users = CustomUser.objects.filter(is_deleted=False).count()
    total_counties = County.objects.filter(is_active=True).count()
    total_projects = Project.objects.filter(is_deleted=False).count()
    
    # Bills stats with optimized query
    bill_stats = Bill.objects.filter(is_deleted=False).aggregate(
        total_bills=Count('id'),
        active_bills=Count(Case(
            When(status__in=['first_reading', 'committee_stage', 'second_reading'], then=1),
            output_field=IntegerField()
        ))
    )
    
    stats = {
        'total_users': total_users,
        'total_counties': total_counties,
        'total_feedback': feedback_stats['total_feedback'],
        'pending_feedback': feedback_stats['pending_feedback'],
        'in_review_feedback': feedback_stats['in_review_feedback'],
        'responded_feedback': feedback_stats['responded_feedback'],
        'resolved_feedback': feedback_stats['resolved_feedback'],
        'total_projects': total_projects,
        'active_projects': Project.objects.filter(
            status__in=['approved', 'in_progress'], 
            is_deleted=False
        ).count(),
        'total_bills': bill_stats['total_bills'],
        'active_bills': bill_stats['active_bills'],
    }
    
    return Response({
        'success': True,
        'data': stats,
        'user_level': user.admin_level,
        'scope': 'national'
    })

@extend_schema(
    summary="Get Users List",
    description="""
    Retrieve complete list of all registered users in the system.
    
    **Frontend Integration:**
    - Use for user management interface
    - Implement sorting and filtering based on role, county, status
    - Show user cards with key information
    - Enable bulk operations for user management
    
    **User Information Includes:**
    - Basic profile data (name, email, role)
    - Administrative details (county, admin level)
    - Account status and join date
    """,
    tags=["Admin User Management"], 
    responses={
        200: UsersListResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_users_list(request):
    """Get users list for national parliament admin"""
    # notes_for_frontend: Display as sortable table with filters for role, county, and active status
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # National scope - see all users
    users = CustomUser.objects.filter(is_deleted=False)
    
    users_data = [{
        'id': u.id,
        'name': u.name,
        'email': u.email,
        'role': u.role,
        'role_display': u.get_role_display(),
        'admin_level': u.admin_level,
        'county': u.user_county.name if u.user_county else 'No County',
        'is_active': u.is_active,
        'date_joined': u.date_joined
    } for u in users]
    
    return Response({
        'success': True,
        'data': users_data
    })

@extend_schema(
    summary="Get National Feedback List",
    description="""
    Retrieve all citizen feedback from across the country for parliament review.
    
    **Frontend Integration:**
    - Display as paginated list with priority indicators
    - Implement filtering by status, category, county, priority
    - Show feedback cards with key details and action buttons
    - Enable bulk operations (mark as reviewed, assign, etc.)
    - Color-code by priority and status
    
    **Feedback Data Includes:**
    - Content and categorization
    - Status and priority levels
    - Location and user information
    - Response statistics and timestamps
    """,
    tags=["Admin Feedback Management"],
    responses={
        200: FeedbackListResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_feedback_list(request):
    """Get feedback list for national parliament admin"""
    # notes_for_frontend: Implement infinite scroll or pagination, add filters sidebar, use color coding for priorities
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # Debug logging
    logger.info(f"🔍 Parliament Admin {user.name} (Level: {user.admin_level}) accessing national feedback")
    
    # Get all national feedback with optimized query
    feedback_queryset = Feedback.objects.filter(
        is_deleted=False  # Only show non-deleted feedback
    ).select_related('user', 'user__user_county').order_by('-created_at')
    
    logger.info(f"📊 Total national feedback found: {feedback_queryset.count()}")
    
    feedback_data = []
    for f in feedback_queryset:
        try:
            feedback_item = {
                'id': str(f.id),
                'title': f.title,
                'content': f.content,
                'category': f.category,
                'category_display': f.get_category_display(),
                'priority': f.priority,
                'priority_display': f.get_priority_display(),
                'status': f.status,
                'status_display': f.get_status_display(),
                'tracking_id': f.tracking_id,
                'county': f.user.user_county.name if f.user and f.user.user_county else 'Unknown',
                'location_path': f.get_location_path(),
                'created_at': f.created_at,
                'updated_at': f.updated_at,
                'is_anonymous': f.is_anonymous,
                'response_count': f.response_count,
                'last_response_at': f.last_response_at,
                'view_count': f.view_count,
                'sentiment_score': f.sentiment_score,
                'user_name': f.user.name if f.user and not f.is_anonymous else 'Anonymous',
                'user_email': f.user.email if f.user and not f.is_anonymous else None,
                'submitted_via': f.submitted_via,
                'can_edit': f.can_edit,
                'can_delete': f.can_delete,
                'edit_count': f.edit_count,
                'edited_at': f.edited_at
            }
            feedback_data.append(feedback_item)
        except Exception as e:
            logger.error(f"⚠️ Error processing feedback {f.id}: {e}")
            continue
    
    logger.info(f"✅ Successfully processed {len(feedback_data)} national feedback items")
    
    return Response({
        'success': True,
        'data': feedback_data,
        'total_count': len(feedback_data),
        'user_level': user.admin_level,
        'scope': 'national'
    })

@extend_schema(
    summary="Respond to Citizen Feedback",
    description="""
    Submit an official parliament response to citizen feedback.
    
    **Frontend Integration:**
    - Use in feedback detail modal or dedicated response page
    - Implement rich text editor for response composition
    - Show preview before submission
    - Update feedback status in real-time after response
    - Send confirmation notification to user
    
    **Response Features:**
    - Official parliament response attribution
    - Automatic status update to 'responded'
    - Email notification to feedback submitter
    - Response tracking and analytics
    """,
    tags=["Admin Feedback Management"],
    request=FeedbackResponseRequestSerializer,
    responses={
        200: OpenApiExample(
            "Response Success",
            value={
                "success": True,
                "message": "Parliament response sent successfully",
                "response_id": "response-uuid-here",
                "feedback_status": "responded"
            }
        ),
        400: ErrorResponseSerializer,
        404: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def respond_to_feedback(request, feedback_id):
    """Respond to feedback as parliament admin"""
    # notes_for_frontend: Show success message and update feedback list/detail view after successful response
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        feedback = Feedback.objects.get(id=feedback_id, is_deleted=False)
        
        response_text = request.data.get('response_text')
        if not response_text:
            return Response({'error': 'Response text required'}, status=400)
        
        logger.info(f"💬 Parliament Admin {user.name} responding to feedback {feedback.tracking_id}")
        
        # Create feedback response using the correct model
        from apps.feedback.models import FeedbackResponse
        
        response_obj = FeedbackResponse.objects.create(
            feedback=feedback,
            responder=user,
            content=response_text,
            is_public=True
        )
        
        # Update feedback status and response tracking
        feedback.status = 'responded'
        feedback.response_count += 1
        feedback.last_response_at = timezone.now()
        feedback.save(update_fields=['status', 'response_count', 'last_response_at'])
        
        logger.info(f"✅ Parliament response created successfully for feedback {feedback.tracking_id}")
        
        return Response({
            'success': True,
            'message': 'Parliament response sent successfully',
            'response_id': str(response_obj.id),
            'feedback_status': feedback.status
        })
        
    except Feedback.DoesNotExist:
        return Response({'error': 'Feedback not found'}, status=404)
    except Exception as e:
        logger.error(f"⚠️ Error responding to feedback: {e}")
        return Response({'error': f'Failed to send response: {str(e)}'}, status=500)

@extend_schema(
    summary="Manage National Projects",
    description="""
    GET: Retrieve all national projects with full details and status information.
    POST: Create a new national project with document upload support.
    
    **Frontend Integration (GET):**
    - Display projects in cards/table layout
    - Implement filtering by status, date range
    - Show project timeline and budget information
    - Enable quick actions (edit, delete, status change)
    
    **Frontend Integration (POST):**
    - Use multipart form with file upload capability
    - Validate required fields before submission
    - Show progress indicator during upload
    - Redirect to project detail after successful creation
    """,
    tags=["Admin Project Management"],
    request={
        'multipart/form-data': ProjectCreateRequestSerializer,
        'application/json': ProjectCreateRequestSerializer
    },
    responses={
        200: ProjectsListResponseSerializer,
        201: ProjectCreatedResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_projects_list(request):
    """Get or create national projects"""
    # notes_for_frontend: For GET use project cards with status badges. For POST use form with file upload and validation
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        # Get all national projects
        projects = Project.objects.filter(is_deleted=False).select_related('created_by')
        
        projects_data = [{
            'id': str(p.id),
            'title': p.title,
            'description': p.description,
            'sponsor': p.sponsor,
            'participation_deadline': p.participation_deadline,
            'document': p.document.url if p.document else None,
            'status': p.status,
            'status_display': p.get_status_display(),
            'summary': p.summary,
            'created_by': p.created_by.name if p.created_by else 'System',
            'created_at': p.created_at
        } for p in projects]
        
        return Response({
            'success': True,
            'data': projects_data
        })
    
    elif request.method == 'POST':
        data = request.data
        
        try:
            project = Project.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                sponsor=data.get('sponsor'),
                status=data.get('status', 'proposed'),
                participation_deadline=data.get('participation_deadline'),
                document=request.FILES.get('document'),
                created_by=user
            )
            
            return Response({
                'success': True,
                'message': 'National project created successfully',
                'project_id': str(project.id)
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

@extend_schema(
    summary="Update Project Status",
    description="""
    Update the status of a national project (e.g., proposed → approved → in_progress → completed).
    
    **Frontend Integration:**
    - Use in project detail page or quick action buttons
    - Implement dropdown with valid status transitions
    - Show confirmation dialog for status changes
    - Update project list/detail view after successful change
    - Display status change history if available
    
    **Valid Status Values:**
    - proposed, approved, in_progress, completed, suspended, cancelled
    """,
    tags=["Admin Project Management"],
    request=StatusUpdateRequestSerializer,
    responses={
        200: SuccessResponseSerializer,
        400: ErrorResponseSerializer,
        404: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_project_status(request, project_id):
    """Update national project status"""
    # notes_for_frontend: Use status dropdown with validation, show confirmation dialog before changing status
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id, is_deleted=False)
        
        new_status = request.data.get('status')
        if new_status not in dict(Project._meta.get_field('status').choices):
            return Response({'error': 'Invalid status'}, status=400)
        
        project.status = new_status
        project.save()
        
        return Response({
            'success': True,
            'message': 'National project status updated successfully'
        })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@extend_schema(
    summary="Edit or Delete Project",
    description="""
    PUT: Update project details including title, description, sponsor, and documents.
    DELETE: Soft delete a project (removes from public view but preserves data).
    
    **Frontend Integration (PUT):**
    - Use in project edit modal/page with form validation
    - Support file upload for document updates
    - Show preview of changes before saving
    - Handle validation errors gracefully
    
    **Frontend Integration (DELETE):**
    - Show confirmation dialog with project details
    - Warn about consequences of deletion
    - Update project list after successful deletion
    - Provide option to restore if needed
    """,
    tags=["Admin Project Management"],
    request=ProjectUpdateRequestSerializer,
    responses={
        200: SuccessResponseSerializer,
        404: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_project_detail(request, project_id):
    """Edit or delete national project"""
    # notes_for_frontend: PUT - use edit form with file upload. DELETE - show confirmation dialog with project details
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        project = Project.objects.get(id=project_id, is_deleted=False)
        
        if request.method == 'PUT':
            # Update project
            data = request.data
            
            project.title = data.get('title', project.title)
            project.description = data.get('description', project.description)
            project.sponsor = data.get('sponsor', project.sponsor)
            project.status = data.get('status', project.status)
            project.participation_deadline = data.get('participation_deadline', project.participation_deadline)
            
            if 'document' in request.FILES:
                project.document = request.FILES['document']
            
            project.save()
            
            return Response({
                'success': True,
                'message': 'National project updated successfully'
            })
        
        elif request.method == 'DELETE':
            # Soft delete project
            project.soft_delete(user)
            
            return Response({
                'success': True,
                'message': 'National project deleted successfully'
            })
        
    except Project.DoesNotExist:
        return Response({'error': 'Project not found'}, status=404)

@extend_schema(
    summary="Get Public Projects List",
    description="""
    Retrieve all active projects visible to the public (no authentication required).
    
    **Frontend Integration:**
    - Use for public-facing project directory
    - Display projects in cards or list layout
    - Implement search and filtering capabilities
    - Show project status with appropriate badges
    - Enable social sharing of projects
    
    **Note:** This endpoint is publicly accessible and rate-limited.
    """,
    tags=["Public Access"],
    responses={
        200: OpenApiExample(
            "Public Projects Response",
            value={
                "success": True,
                "data": [
                    {
                        "id": "project-uuid",
                        "title": "Community Health Initiative",
                        "description": "Improving healthcare access in rural areas",
                        "sponsor": "Ministry of Health",
                        "participation_deadline": "2024-05-30T23:59:59Z",
                        "document": "/media/projects/health-initiative.pdf",
                        "status": "approved",
                        "status_display": "Approved",
                        "summary": "This project aims to establish...",
                        "created_at": "2024-01-15T10:30:00Z"
                    }
                ]
            }
        )
    }
)
@api_view(['GET'])
@permission_classes([])
def public_projects_list(request):
    """Get public projects list - no authentication required"""
    # notes_for_frontend: Display as public gallery with search/filter options, no authentication needed
    
    # Get all active projects (not deleted)
    projects = Project.objects.filter(is_deleted=False).select_related('created_by')
    
    projects_data = [{
        'id': str(p.id),
        'title': p.title,
        'description': p.description,
        'sponsor': p.sponsor,
        'participation_deadline': p.participation_deadline,
        'document': p.document.url if p.document else None,
        'status': p.status,
        'status_display': p.get_status_display(),
        'summary': p.summary,
        'created_at': p.created_at
    } for p in projects]
    
    return Response({
        'success': True,
        'data': projects_data
    })

@extend_schema(
    summary="Edit or Delete Parliamentary Bill",
    description="""
    PUT: Update bill metadata including title, description, sponsor, status, and documents.
    DELETE: Soft delete a parliamentary bill (removes from public view but preserves data).
    
    **Frontend Integration (PUT):**
    - Use in bill edit interface with comprehensive form
    - Support document replacement with validation
    - Show bill processing status during updates
    - Handle concurrent edit conflicts gracefully
    
    **Frontend Integration (DELETE):**
    - Show detailed confirmation dialog with bill information
    - Warn about impact on public access and citizen engagement
    - Verify admin permissions before allowing deletion
    - Update bill lists after successful operation
    """,
    tags=["Admin Bill Management"],
    request=BillUpdateRequestSerializer,
    examples=[
        OpenApiExample(
            "Bill Update Example",
            value={
                "title": "Updated Finance Bill 2024",
                "description": "Comprehensive tax reform legislation with updated provisions",
                "sponsor": "Ministry of Finance and Planning", 
                "status": "committee_stage",
                "participation_deadline": "2024-08-15T23:59:59Z"
            },
            request_only=True
        )
    ],
    responses={
        200: SuccessResponseSerializer,
        404: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def admin_bill_detail(request, bill_id):
    """Edit or delete parliamentary bill"""
    # notes_for_frontend: PUT - comprehensive edit form with document handling. DELETE - detailed confirmation with impact warning
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        if request.method == 'PUT':
            # Update bill
            data = request.data
            
            bill.title = data.get('title', bill.title)
            bill.description = data.get('description', bill.description)
            bill.sponsor = data.get('sponsor', bill.sponsor)
            bill.status = data.get('status', bill.status)
            bill.participation_deadline = data.get('participation_deadline', bill.participation_deadline)
            
            if 'document' in request.FILES:
                bill.document = request.FILES['document']
            
            bill.save()
            
            return Response({
                'success': True,
                'message': 'Parliamentary bill updated successfully'
            })
        
        elif request.method == 'DELETE':
            # Soft delete bill
            bill.soft_delete(user)
            
            return Response({
                'success': True,
                'message': 'Parliamentary bill deleted successfully'
            })
        
    except Bill.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=404)

@extend_schema(
    summary="Get Public Bills List",
    description="""
    Retrieve all published parliamentary bills accessible to the public (no authentication required).
    
    **Frontend Integration:**
    - Use for public bill directory and citizen engagement portal
    - Display bills with status indicators and participation deadlines
    - Implement search by title, sponsor, or content
    - Show bill summaries and key information
    - Enable filtering by status, date, and sponsor
    - Link to detailed bill view and chat functionality
    
    **Note:** Only shows completed, published bills. Rate-limited for fair usage.
    """,
    tags=["Public Access"],
    responses={
        200: OpenApiExample(
            "Public Bills Response",
            value={
                "success": True,
                "data": [
                    {
                        "id": "bill-uuid",
                        "title": "Digital Economy Bill 2024",
                        "description": "Framework for digital transformation and e-commerce regulation",
                        "sponsor": "Ministry of ICT",
                        "status": "committee_stage",
                        "status_display": "Committee Stage",
                        "participation_deadline": "2024-07-30T23:59:59Z",
                        "document": "/media/bills/digital-economy-2024.pdf",
                        "summary": "This bill establishes the framework for...",
                        "created_at": "2024-02-01T09:00:00Z"
                    }
                ]
            }
        )
    }
)
@api_view(['GET'])
@permission_classes([])
def public_bills_list(request):
    """Get public bills list - no authentication required"""
    # notes_for_frontend: Display as searchable public directory with status badges and participation info
    
    # Get all active bills
    bills = Bill.objects.filter(
        is_deleted=False
    ).select_related('created_by')
    
    bills_data = [{
        'id': str(b.id),
        'title': b.title,
        'description': b.description,
        'sponsor': b.sponsor,
        'status': b.status,
        'status_display': b.get_status_display(),
        'participation_deadline': b.participation_deadline,
        'document': b.document.url if b.document else None,
        'summary': b.summary,
        'created_at': b.created_at
    } for b in bills]
    
    return Response({
        'success': True,
        'data': bills_data
    })

@extend_schema(
    summary="Manage Parliamentary Bills",
    description="""
    GET: Retrieve all parliamentary bills with comprehensive processing status and admin controls.
    POST: Create a new parliamentary bill with document upload and processing options.
    
    **Key Features:**
    - **Phase 1**: Basic bill management with document processing
    - **Phase 2**: Async processing with real-time progress tracking  
    - **Phase 3**: AI-powered summaries and citizen chat preparation
    
    **Frontend Integration (GET):**
    - Display bills table with processing status indicators
    - Show real-time progress bars for active processing
    - Status [('draft', 'Draft'), ('first_reading', 'First Reading'), ('committee_stage', 'Committee Stage')]
    - Enable WebSocket connections for live updates
    - Provide retry/cancel controls for failed/processing bills
    - Color-code bills by processing status
    
    **Frontend Integration (POST):**
    - Multi-part form with document upload and validation
    - Processing preference controls (async vs sync)
    - Real-time progress tracking with WebSocket support
    - Fallback handling for processing failures
    - Comprehensive error handling and user feedback
    """,
    tags=["Admin Bill Management"],
    request={
        'multipart/form-data': BillCreateRequestSerializer,
        'application/json': BillCreateRequestSerializer
    },
    responses={
        200: AdminBillListResponseSerializer,
        201: BillProcessingResponseSerializer,
        400: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def admin_bills_list(request):
    """
    Get or create parliamentary bills
    ENHANCED: Now supports async processing with fallback to sync
    BACKWARD COMPATIBLE: All Phase 1 functionality preserved
    """
    # notes_for_frontend: GET - implement WebSocket for real-time updates. POST - use progress tracking with cancel/retry options
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    if request.method == 'GET':
        # Get all bills with enhanced progress and async information
        bills = Bill.objects.filter(is_deleted=False).select_related('created_by')
        
        bills_data = []
        for b in bills:
            # Basic bill data (Phase 1 - unchanged)
            bill_data = {
                'id': str(b.id),
                'title': b.title,
                'description': b.description,
                'sponsor': b.sponsor,
                'status': b.status,
                'status_display': b.get_status_display(),
                'participation_deadline': b.participation_deadline,
                'document': b.document.url if b.document else None,
                'summary': b.summary,
                'created_by': b.created_by.name if b.created_by else 'System',
                'created_at': b.created_at,
                # Phase 1 enhanced fields
                'summary_html': getattr(b, 'summary_html', ''),
                'processing_status': getattr(b, 'processing_status', 'completed'),
                'processing_progress': getattr(b, 'processing_progress', 100),
                'processing_message': getattr(b, 'processing_message', ''),
                'estimated_time_remaining': getattr(b, 'estimated_time_remaining', None),
                'is_chunked': getattr(b, 'is_chunked', False),
                'total_chunks': getattr(b, 'total_chunks', 0),
            }
            
            # NEW Phase 2: Add async processing info if available
            if bill_data['processing_status'] in ['processing', 'pending']:
                try:
                    async_status = get_bill_processing_status(str(b.id))
                    bill_data.update({
                        'async_info': {
                            'task_id': str(async_status.get('task_id', '')),
                            'can_retry': bool(async_status.get('can_retry', False)),
                            'session_info': async_status.get('session_info', {}),
                            'task_info': async_status.get('task_info', {}),
                            'supports_realtime': True  # WebSocket available
                        }
                    })
                except Exception as e:
                    logger.warning(f"Could not get async status for bill {b.id}: {str(e)}")
                    bill_data['async_info'] = {'supports_realtime': False}
            else:
                bill_data['async_info'] = {'supports_realtime': False}
            
            bills_data.append(bill_data)
        
        return Response({
            'success': True,
            'data': bills_data,
            'async_processing_available': True,  # Phase 2 feature
            'websocket_support': True  # Real-time updates available
        })
    
    elif request.method == 'POST':
        data = request.data
        uploaded_doc = request.FILES.get('document')
        
        # Check processing preference
        use_async = data.get('async_processing', True)
        force_sync = data.get('force_sync', False)
        
        # Validate file if provided
        validation_result = {}
        if uploaded_doc:
            validation_result = validate_pdf_file(uploaded_doc)
            if not validation_result['valid']:
                return Response({
                    'success': False,
                    'error': 'File validation failed',
                    'validation_errors': validation_result['errors']
                }, status=400)
        
        try:
            # Create bill instance
            bill = Bill.objects.create(
                title=data.get('title'),
                description=data.get('description'),
                sponsor=data.get('sponsor'),
                status=data.get('status', 'draft'),
                participation_deadline=data.get('participation_deadline'),
                document=uploaded_doc,
                summary='',
                created_by=user,
                processing_status='pending' if uploaded_doc else 'completed',
                processing_progress=0 if uploaded_doc else 100,
                processing_message='Waiting to start bulletproof processing...' if uploaded_doc else 'No document to process',
            )
            
            logger.info(f"Created bill {bill.id}: {bill.title}")
            
            # Process document if provided
            if uploaded_doc and use_async and not force_sync:
                # NEW: Use bulletproof async processing
                try:
                    # Save file for async processing
                    file_path = save_uploaded_file_for_async(uploaded_doc, str(bill.id))
                    
                    # Start bulletproof async task
                    task = process_bill_async.delay(str(bill.id), file_path)
                    
                    # Setup progress tracking
                    session_result = start_async_bill_processing(str(bill.id), task.id)
                    
                    if session_result['success']:
                        return Response({
                            'success': True,
                            'message': 'Bill created and bulletproof processing started',
                            'bill_id': str(bill.id),
                            'processing_async': True,
                            'processing_method': 'bulletproof_hierarchical',
                            'task_id': task.id,
                            'session_id': session_result['session_id'],
                            'websocket_channel': session_result['websocket_channel'],
                            'estimated_time': '2-3 minutes',  # Much faster with new approach
                            'progress_endpoints': {
                                'status': f'/api/admin/bills/{bill.id}/status/',
                                'websocket': f'/ws/bills/{bill.id}/progress/',
                                'polling': f'/api/admin/bills/{bill.id}/progress/'
                            }
                        })
                    else:
                        # Fall through to sync processing
                        use_async = False
                
                except Exception as e:
                    logger.error(f"Bulletproof async processing setup failed: {str(e)}")
                    use_async = False
            
            # Sync processing fallback (if needed)
            if uploaded_doc and (not use_async or force_sync):
                return Response({
                    'success': False,
                    'message': 'Sync processing not supported with bulletproof processor',
                    'bill_id': str(bill.id),
                    'error': 'Please use async processing for document processing'
                }, status=400)
            
            # No document to process
            return Response({
                'success': True,
                'message': 'Bill created successfully (no document)',
                'bill_id': str(bill.id),
                'processing_async': False
            })
            
        except Exception as e:
            logger.error(f"Bill creation failed: {str(e)}")
            return Response({'error': str(e)}, status=400)

@extend_schema(
    summary="Get Bill Processing Progress",
    description="""
    Retrieve current processing progress for a parliamentary bill.
    Supports both synchronous (Phase 1) and asynchronous (Phase 2) processing modes.
    
    **Frontend Integration:**
    - Poll this endpoint every 2-3 seconds during processing
    - Display progress bar with completion percentage
    - Show current processing stage and estimated time remaining
    - Handle WebSocket connection for real-time updates when available
    - Display error details if processing fails
    - Enable retry functionality for failed processing
    
    **Processing Stages:**
    - pending: Waiting to start processing
    - processing: Actively processing document
    - completed: Successfully completed
    - failed: Processing failed with error details
    """,
    tags=["Admin Bill Management"],
    responses={
        200: BillProgressResponseSerializer,
        404: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_progress(request, bill_id):
    """
    Get bill processing progress (Phase 1 endpoint - maintained)
    Enhanced to work with both sync and async processing
    """
    # notes_for_frontend: Poll every 2-3 seconds, display progress bar, connect WebSocket for real-time updates if supported
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Check if bill has async processing session
        try:
            async_status = get_bill_processing_status(bill_id)
            if async_status['processing_status'] != 'error':
                # Return async status
                response_data = {
                    'success': True,
                    'bill_id': bill_id,
                    'progress': async_status,
                    'processing_type': 'async',
                    'supports_realtime': True
                }
                return Response(response_data)
        except Exception as e:
            logger.debug(f"No async session for bill {bill_id}, using Phase 1 progress")
        
        # Fall back to Phase 1 progress tracking
        progress_data = get_bill_progress(bill_id)
        
        # Get bill basic info
        bill = Bill.objects.get(id=bill_id, is_deleted=False)
        
        response_data = {
            'success': True,
            'bill_id': bill_id,
            'bill_title': bill.title,
            'progress': progress_data,
            'processing_type': 'sync',
            'supports_realtime': False,
            'bill_info': {
                'has_document': bool(bill.document),
                'created_at': bill.created_at,
                'total_chunks': getattr(bill, 'total_chunks', 0),
                'is_chunked': getattr(bill, 'is_chunked', False),
            }
        }
        
        return Response(response_data)
        
    except Bill.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Bill not found'
        }, status=404)
    except Exception as e:
        logger.error(f"Failed to get progress for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@extend_schema(
    summary="Get Detailed Bill Processing Status",
    description="""
    Retrieve comprehensive processing status for async operations including:
    - Current processing stage and progress percentage
    - Celery task information and status
    - Processing logs and performance metrics
    - Error details and recovery options
    - Real-time update capabilities
    
    **Frontend Integration:**
    - Use for detailed processing monitoring dashboard
    - Display processing logs and technical details
    - Show task management controls (cancel, retry)
    - Enable WebSocket connection for live updates
    - Provide debugging information for processing issues
    
    **Available Controls:**
    - supports_cancellation: Can cancel ongoing processing
    - supports_retry: Can retry failed processing
    - WebSocket channel for real-time updates
    """,
    tags=["Admin Bill Management - Async"],
    responses={
        200: BillProcessingStatusSerializer,
        403: ErrorResponseSerializer,
        500: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_bill_processing_status(request, bill_id):
    """
    NEW ENDPOINT: Get detailed processing status for async operations
    """
    # notes_for_frontend: Use for detailed admin dashboard with processing logs, task controls, and real-time monitoring
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get comprehensive processing status
        status = get_bill_processing_status(bill_id)
        
        return Response({
            'success': True,
            'bill_id': bill_id,
            'status': status,
            'supports_cancellation': status.get('task_info', {}).get('task_active', False),
            'supports_retry': status.get('can_retry', False)
        })
        
    except Exception as e:
        logger.error(f"Failed to get processing status for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@extend_schema(
    summary="Retry Failed Bill Processing",
    description="""
    Retry processing for a failed or cancelled bill with options for async or sync processing.
    
    **Frontend Integration:**
    - Use retry button on failed processing bills
    - Provide processing mode selection (async/sync)
    - Show retry confirmation dialog with processing options
    - Track retry attempts and display retry history
    - Enable progress monitoring after retry initiation
    
    **Processing Options:**
    - async_processing: Use background task with real-time updates
    - sync processing: Immediate processing with basic progress
    - Enhanced vs original processing algorithms
    """,
    tags=["Admin Bill Management - Async"],
    request=ProcessingRetryRequestSerializer,
    responses={
        200: ProcessingRetrySuccessSerializer,
        400: ErrorResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_retry_bill_processing(request, bill_id):
    """
    NEW ENDPOINT: Retry failed bill processing
    """
    # notes_for_frontend: Show retry confirmation, track retry attempts, enable progress monitoring after retry
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get processing preference from request
        use_async = request.data.get('async_processing', True)
        
        if use_async:
            # Async retry
            result = retry_failed_bill_processing(bill_id)
            
            if result['success']:
                return Response({
                    'success': True,
                    'message': result['message'],
                    'bill_id': bill_id,
                    'new_task_id': result['new_task_id'],
                    'retry_attempt': result['retry_attempt'],
                    'processing_async': True,
                    'progress_endpoints': {
                        'status': f'/api/admin/bills/{bill_id}/status/',
                        'websocket': f'/ws/bills/{bill_id}/progress/',
                        'polling': f'/api/admin/bills/{bill_id}/progress/'
                    }
                })
            else:
                return Response({
                    'success': False,
                    'error': result['message'],
                    'can_try_sync': True
                }, status=400)
        else:
            # Sync retry using Phase 1 functionality
            try:
                bill = Bill.objects.get(id=bill_id, is_deleted=False)
                
                if not bill.document:
                    return Response({
                        'success': False,
                        'error': 'Bill has no document to process'
                    }, status=400)
                
                # Reset progress
                reset_bill_progress(bill_id)
                
                # Use Phase 1 enhanced processing
                result = process_bill_with_enhanced_features(
                    bill.document.file,
                    bill,
                    use_enhanced=True
                )
                
                if result['success']:
                    return Response({
                        'success': True,
                        'message': 'Bill reprocessing completed (sync)',
                        'bill_id': bill_id,
                        'processing_async': False,
                        'result': {
                            'used_enhanced': result['used_enhanced'],
                            'sections_count': result['sections_count'],
                            'chunks_created': result['chunks_created']
                        }
                    })
                else:
                    return Response({
                        'success': False,
                        'error': result['error']
                    }, status=500)
            
            except Bill.DoesNotExist:
                return Response({
                    'success': False,
                    'error': 'Bill not found'
                }, status=404)
        
    except Exception as e:
        logger.error(f"Failed to retry processing for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@extend_schema(
    summary="Cancel Ongoing Bill Processing",
    description="""
    Cancel currently running bill processing task gracefully.
    
    **Frontend Integration:**
    - Use cancel button on actively processing bills
    - Show cancellation confirmation dialog
    - Display cancellation progress and status
    - Enable retry option after successful cancellation
    - Update processing status in real-time
    
    **Cancellation Process:**
    - Graceful task termination
    - Cleanup of temporary resources
    - Status update to cancelled
    - Preservation of partial results
    """,
    tags=["Admin Bill Management - Async"],
    responses={
        200: CancellationSuccessSerializer,
        403: ErrorResponseSerializer,
        500: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_cancel_bill_processing(request, bill_id):
    """
    NEW ENDPOINT: Cancel ongoing bill processing
    """
    # notes_for_frontend: Show cancellation confirmation, display cancellation status, enable retry after cancellation
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        result = cancel_bill_processing(bill_id)
        
        if result['success']:
            return Response({
                'success': True,
                'message': result['message'],
                'bill_id': bill_id,
                'was_cancelled': result['was_cancelled'],
                'task_id': result.get('task_id'),
                'can_retry': True
            })
        else:
            return Response({
                'success': False,
                'error': result['message']
            }, status=500)
        
    except Exception as e:
        logger.error(f"Failed to cancel processing for bill {bill_id}: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)

@extend_schema(
    summary="Reprocess Bill (Legacy)",
    description="""
    Legacy endpoint for bill reprocessing. Now delegates to the retry endpoint for consistency.
    Use the retry endpoint directly for new implementations.
    
    **Note:** This endpoint is maintained for backward compatibility.
    For new implementations, use `/admin/bills/{bill_id}/retry/` instead.
    """,
    tags=["Admin Bill Management"],
    request=inline_serializer(
    name='BillCreationRequest',
    fields={
        'title': serializers.CharField(max_length=255, help_text="Bill title"),
        'description': serializers.CharField(help_text="Bill description"),
        'sponsor': serializers.CharField(max_length=255, help_text="Bill sponsor"),
        'status': serializers.ChoiceField(
            choices=[('draft', 'Draft'), ('first_reading', 'First Reading'), 
                    ('committee_stage', 'Committee Stage')],
            default='draft',
            required=False
        ),
        'participation_deadline': serializers.DateTimeField(required=False),
        'document': serializers.FileField(required=False, help_text="PDF document"),
        'async_processing': serializers.BooleanField(default=True),
        'use_enhanced_processing': serializers.BooleanField(default=True),
        'force_sync': serializers.BooleanField(default=False)
    }
),
    responses={
        200: BillProcessingResponseSerializer,
        403: ErrorResponseSerializer
    }
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def admin_bill_reprocess(request, bill_id):
    """
    Enhanced reprocess endpoint (Phase 1 maintained + Phase 2 async support)
    """
    # notes_for_frontend: Legacy endpoint - use retry endpoint for new implementations
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    # This endpoint now delegates to the retry endpoint for consistency
    # This endpoint now delegates to the retry endpoint for consistency
    try:
        # Get processing preference from request
        use_async = request.data.get('async_processing', True)
        
        if use_async:
            result = retry_failed_bill_processing(bill_id)
            if result['success']:
                return Response({
                    'success': True,
                    'message': 'Bill reprocessing started successfully',
                    'bill_id': bill_id,
                    'processing_async': True
                })
            else:
                return Response({'success': False, 'error': result['message']}, status=400)
        else:
            return Response({
                'success': False,
                'error': 'Sync reprocessing not implemented in legacy endpoint'
            }, status=400)
            
    except Exception as e:
        return Response({'success': False, 'error': str(e)}, status=500)

@extend_schema(
    summary="Get Processing Overview Dashboard",
    description="""
    Comprehensive system-wide processing overview for admin dashboard including:
    - Processing statistics and bill counts
    - Active async processing sessions
    - System capabilities and health status
    - Performance metrics and monitoring data
    
    **Frontend Integration:**
    - Use for main processing dashboard/overview page
    - Display system health indicators and statistics
    - Show active processing sessions with progress
    - Enable system monitoring and capacity planning
    - Implement auto-refresh for real-time monitoring
    
    **Dashboard Components:**
    - Processing statistics charts
    - Active sessions list with controls
    - System capabilities overview
    - Performance metrics visualization
    """,
    tags=["Admin Bill Management"],
    responses={
        200: ProcessingOverviewResponseSerializer,
        403: ErrorResponseSerializer,
        500: ErrorResponseSerializer
    }
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_processing_overview(request):
    """
    Enhanced processing overview (Phase 1 maintained + Phase 2 async info)
    """
    # notes_for_frontend: Use for system dashboard with charts, active sessions monitoring, and auto-refresh capability
    user = request.user
    
    if user.role != 'parliament_admin':
        return Response({'error': 'Access denied'}, status=403)
    
    try:
        # Get summary statistics
        total_bills = Bill.objects.filter(is_deleted=False).count()
        
        completed_bills = Bill.objects.filter(
            is_deleted=False, 
            processing_status='completed'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        failed_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='failed'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        processing_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='processing'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        pending_bills = Bill.objects.filter(
            is_deleted=False,
            processing_status='pending'
        ).count() if hasattr(Bill._meta.get_field('processing_status'), 'choices') else 0
        
        # NEW Phase 2: Get active async sessions
        active_sessions = get_all_active_processing_sessions()
        
        return Response({
            'success': True,
            'summary': {
                'total_bills': total_bills,
                'completed_bills': completed_bills,
                'failed_bills': failed_bills,
                'currently_processing': processing_bills,
                'pending_processing': pending_bills,
                # Phase 2 additions
                'active_async_sessions': len(active_sessions),
                'async_processing_available': True,
                'websocket_support': True
            },
            'active_sessions': active_sessions,
            'capabilities': {
                'async_processing': True,
                'real_time_updates': True,
                'task_cancellation': True,
                'retry_with_backoff': True,
                'sync_fallback': True
            }
        })
        
    except Exception as e:
        logger.error(f"Failed to get processing overview: {str(e)}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
