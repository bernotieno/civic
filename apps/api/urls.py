# =============================================================================
# FILE: apps/api/urls.py - CivicAI Complete URL Configuration
# =============================================================================
"""
CivicAI API URL Configuration - Complete Implementation

This file contains all URL patterns for the CivicAI system across all phases:
- Authentication & User Management
- Location Services
- Feedback System with AI Processing
- Admin Bill Management (Phase 1)
- Async Processing with Real-time Updates (Phase 2) 
- Public Citizen Access & Interactive Chat (Phase 3)

FRONTEND INTEGRATION GUIDE:
==========================
All endpoints return consistent JSON responses with:
- success: boolean (true/false)
- data/error: response payload
- message: user-friendly messages
- suggestions: helpful next steps (on errors)

Authentication:
- Admin endpoints: Bearer token required
- Public endpoints: No auth, but rate-limited
- Anonymous sessions: Temporary session support

Rate Limits:
- Anonymous: 100 API calls/hour, 20 chat requests/hour
- Authenticated: 1000 API calls/hour, 50 chat requests/hour

Error Handling:
- 200: Success
- 400: Validation errors
- 404: Not found
- 429: Rate limited
- 500: Server error
"""

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from apps.feedback import views as feedback_views
from apps.ai import views as ai_views
from .admin_views import (
    admin_dashboard_stats, admin_users_list, admin_feedback_list,
    respond_to_feedback, admin_projects_list, update_project_status, admin_project_detail,
    public_projects_list, admin_bills_list, admin_bill_detail, public_bills_list, admin_bill_progress,
    admin_bill_reprocess, admin_processing_overview, admin_bill_processing_status, admin_retry_bill_processing,
    admin_cancel_bill_processing
)
# Phase 3 imports for public citizen access and chat
from . import citizen_views, chat_views, embedding_service

app_name = 'api'

# =============================================================================
# CORE SYSTEM ENDPOINTS
# =============================================================================
"""
System health and monitoring endpoints for DevOps and frontend health checks
"""
core_urlpatterns = [
    # System health check - Use for app startup verification
    path('health/', views.system_health, name='health'),
]

# =============================================================================
# AUTHENTICATION & USER MANAGEMENT ENDPOINTS
# =============================================================================
"""
Authentication endpoints supporting both regular users and anonymous sessions.
Frontend should implement token refresh logic and handle session expiration.

Usage Examples:
- POST /api/auth/login/ { "username": "user", "password": "pass" }
- POST /api/auth/register/ { "username", "email", "password", "location_data" }
- POST /api/auth/refresh/ { "refresh": "token" }
- GET /api/auth/profile/ (requires Bearer token)
"""
auth_urlpatterns = [
    # Standard authentication flow
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    
    # Anonymous session support for non-registered users
    # Returns temporary session_id for tracking anonymous interactions
    path('auth/anonymous/', views.AnonymousSessionView.as_view(), name='anonymous_session'),
    path('auth/anonymous/<str:session_id>/status/', views.anonymous_session_status, name='anonymous_status'),
]

# =============================================================================
# LOCATION SERVICES ENDPOINTS
# =============================================================================
"""
Kenya location hierarchy endpoints for forms and user registration.
Supports county, sub-county, and ward selection with proper hierarchical data.

Frontend Integration:
- Use /api/locations/counties/ for county dropdown
- Use /api/locations/hierarchy/ for cascading location selectors
"""
location_urlpatterns = [
    # Get all counties for dropdown menus
    path('locations/counties/', views.CountyListView.as_view(), name='counties'),
    # Get complete location hierarchy for advanced forms
    path('locations/hierarchy/', views.LocationHierarchyView.as_view(), name='hierarchy'),
]

# =============================================================================
# CITIZEN FEEDBACK SYSTEM ENDPOINTS
# =============================================================================
"""
Comprehensive feedback system with AI processing capabilities.
Supports both authenticated and anonymous feedback submission.

Key Features:
- Real-time AI response suggestions for county officials
- Feedback tracking with public tracking IDs
- User dashboard for managing their submissions
- Category-based organization
- Advanced analytics and statistics

Frontend Usage:
- POST /api/feedback/submit/ (authenticated users)
- POST /api/feedback/anonymous/ (anonymous users) 
- GET /api/feedback/track/{tracking_id}/ (public tracking)
"""
feedback_urlpatterns = [
    # Feedback submission endpoints
    path('feedback/submit/', feedback_views.FeedbackSubmissionView.as_view(), name='submit'),
    path('feedback/anonymous/', feedback_views.AnonymousFeedbackView.as_view(), name='anonymous_submit'),
    
    # Tracking functionality removed for scalability
    
    # Feedback metadata and categories
    path('feedback/categories/', feedback_views.feedback_categories, name='categories'),
    
    # User feedback management (authenticated users only)
    path('feedback/my-submissions/', feedback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
    path('feedback/my-submissions/<uuid:id>/', feedback_views.UserFeedbackDetailView.as_view(), name='user_feedback_detail'),
    path('feedback/my-submissions/<uuid:id>/edit/', feedback_views.UserFeedbackUpdateView.as_view(), name='user_feedback_update'),
    path('feedback/my-submissions/<uuid:id>/delete/', feedback_views.UserFeedbackDeleteView.as_view(), name='user_feedback_delete'),
    
    # User statistics and analytics
    path('feedback/my-stats/', feedback_views.user_feedback_statistics, name='user_feedback_stats'),
]

# =============================================================================
# AI PROCESSING ENDPOINTS
# =============================================================================
"""
AI-powered features for county officials and system automation.
Includes response suggestions, analytics, and processing status monitoring.

Key Capabilities:
- AI-generated response suggestions for feedback
- County-specific analytics and insights  
- Processing status monitoring
- Task queue management
- System health monitoring

Frontend Integration:
- Use for county official dashboards
- Implement polling for task status updates
- Display AI suggestions to improve response quality
"""
ai_urlpatterns = [
    # County AI dashboard and analytics
    path('ai/dashboard/', ai_views.CountyAIDashboardView.as_view(), name='ai-dashboard'),
    path('ai/analytics/', ai_views.get_county_ai_analytics, name='ai-analytics'),
    
    # AI response generation for feedback
    path('ai/feedback/<uuid:feedback_id>/suggestions/', ai_views.get_ai_response_suggestions, name='ai-response-suggestions'),
    path('ai/feedback/<uuid:feedback_id>/process/', ai_views.trigger_feedback_ai_processing, name='ai-trigger-processing'),
    
    # AI system monitoring and task management
    path('ai/health/', ai_views.ai_system_health, name='ai-health'),
    path('ai/stats/', ai_views.ai_processing_stats, name='ai-stats'),
    path('ai/tasks/<str:task_id>/status/', ai_views.check_ai_task_status, name='ai-task-status'),
]

# =============================================================================
# PHASE 1 - ADMIN BILL MANAGEMENT ENDPOINTS
# =============================================================================
"""
Administrative bill management system for parliament staff.
Provides comprehensive bill lifecycle management with processing status tracking.

Key Features:
- Bill creation, editing, and status management
- Document upload and processing
- Progress tracking and monitoring
- Detailed analytics and reporting

Authentication Required: parliament_admin role
"""
admin_core_urlpatterns = [
    # System administration dashboard
    path('admin/dashboard/', admin_dashboard_stats, name='admin-dashboard'),
    path('admin/users/', admin_users_list, name='admin-users'),
    
    # Feedback administration
    path('admin/feedback/', admin_feedback_list, name='admin-feedback'),
    path('admin/feedback/<uuid:feedback_id>/respond/', respond_to_feedback, name='admin-respond'),
    
    # Project management
    path('admin/projects/', admin_projects_list, name='admin-projects'),
    path('admin/projects/<uuid:project_id>/status/', update_project_status, name='admin-project-status'),
    path('admin/projects/<uuid:project_id>/', admin_project_detail, name='admin-project-detail'),
]

# Phase 1 - Bill Management (Enhanced through all phases)
admin_bills_urlpatterns = [
    # Core bill management
    # GET: List all bills with filtering, sorting, pagination
    # POST: Create new bill with document upload
    path('admin/bills/', admin_bills_list, name='admin-bills'),
    
    # Individual bill management
    # GET: Detailed bill information with processing status
    # PUT/PATCH: Update bill metadata, status, documents
    # DELETE: Remove bill (with safety checks)
    path('admin/bills/<uuid:bill_id>/', admin_bill_detail, name='admin-bill-detail'),
    
    # Phase 1 Progress tracking (enhanced in Phase 2)
    # GET: Current processing progress with completion percentage
    path('admin/bills/<uuid:bill_id>/progress/', admin_bill_progress, name='admin_bill_progress'),
    
    # POST: Trigger reprocessing of bill (e.g., after document updates)
    path('admin/bills/<uuid:bill_id>/reprocess/', admin_bill_reprocess, name='admin_bill_reprocess'),
    
    # GET: System-wide processing overview dashboard
    path('admin/processing-overview/', admin_processing_overview, name='admin_processing_overview'),
]

# =============================================================================
# PHASE 2 - ASYNC PROCESSING & REAL-TIME UPDATES
# =============================================================================
"""
Advanced async processing system with real-time progress updates.
Enables long-running bill processing tasks with proper monitoring and control.

Key Features:
- WebSocket support for real-time progress updates
- Task queue management with retry logic
- Processing cancellation and error recovery
- Detailed status reporting with logs

Frontend Integration:
- Implement WebSocket connections for real-time updates
- Use polling as fallback for progress tracking
- Provide cancel/retry controls in admin interface
- Display detailed error information for debugging

WebSocket Endpoint: ws://domain/ws/bills/{id}/progress/
"""
async_processing_urlpatterns = [
    # Detailed async processing status with logs and metrics
    # GET: Complete processing status, progress, logs, performance metrics
    path('admin/bills/<uuid:bill_id>/status/', 
         admin_bill_processing_status, 
         name='admin_bill_processing_status'),
    
    # Processing control endpoints
    # POST: Retry failed processing with optional parameters
    path('admin/bills/<uuid:bill_id>/retry/', 
         admin_retry_bill_processing, 
         name='admin_retry_bill_processing'),
    
    # POST: Cancel ongoing processing (graceful shutdown)
    path('admin/bills/<uuid:bill_id>/cancel/', 
         admin_cancel_bill_processing, 
         name='admin_cancel_bill_processing'),
]

# =============================================================================
# PHASE 3 - PUBLIC CITIZEN ACCESS & INTERACTIVE CHAT
# =============================================================================
"""
Public-facing endpoints for citizen access to parliamentary bills.
No authentication required, but rate-limited for fair usage.

Key Features:
- Bill discovery with search and filtering
- Interactive AI chat for bill questions
- Mobile-optimized responses
- Privacy-aware session management
- Comprehensive bill summaries in citizen-friendly language

Target Users: General public, journalists, civil society
"""

# Public bill access (no authentication required)
public_access_urlpatterns = [
    # Public bill discovery and access
    # GET: List published bills with search, filtering, pagination
    # Query params: page, page_size, status, search, sponsor, sort
    # Response: Bills formatted for citizen consumption with summaries
    path('public/bills/', 
         citizen_views.public_bills_list, 
         name='public_bills_list'),
    
    # Individual bill access for citizens
    # GET: Complete bill information with HTML summary, key sections
    # Includes: complexity level, reading time, key deadlines
    path('public/bills/<uuid:bill_id>/', 
         citizen_views.public_bill_detail, 
         name='public_bill_detail'),
    
    # In-bill search functionality
    # GET: Search within specific bill content using embeddings
    # Query params: query (required), limit, section
    # Returns: Relevant excerpts with similarity scores
    path('public/bills/<uuid:bill_id>/search/', 
         citizen_views.public_bill_search, 
         name='public_bill_search'),
]

# Interactive chat system for bill questions
interactive_chat_urlpatterns = [
    # Main chat endpoint - Ask questions about bills
    # POST: Submit questions and get AI-powered responses
    # Body: { question, conversation_context?, session_id?, use_embeddings? }
    # Returns: Answer, sources, confidence, follow-up questions
    path('public/bills/<uuid:bill_id>/chat/', 
         chat_views.bill_chat, 
         name='bill_chat'),
    
    # Chat support endpoints
    # POST: Get suggested questions based on bill content and user interest
    # Body: { category?, user_type?, limit? }
    # Categories: "general", "impact", "timeline", "implementation"
    path('public/bills/<uuid:bill_id>/chat/suggestions/', 
         chat_views.bill_chat_suggestions, 
         name='bill_chat_suggestions'),
    
    # GET: Get bill context optimized for chat interface
    # Returns: Bill summary, key sections, complexity info for chat UI
    path('public/bills/<uuid:bill_id>/chat/context/', 
         chat_views.bill_chat_context, 
         name='bill_chat_context'),
    
    # GET: Retrieve chat conversation history
    # Query params: session_id (required), limit, offset
    # Returns: Previous questions and answers for context
    path('public/bills/<uuid:bill_id>/chat/history/', 
         chat_views.bill_chat_history, 
         name='bill_chat_history'),
]

# =============================================================================
# UTILITY & MAINTENANCE ENDPOINTS
# =============================================================================
"""
Backend utility endpoints for system maintenance and optimization.
Primarily used by admin staff and automated systems.
"""
utility_urlpatterns = [
    # Embedding generation for search functionality (admin only)
    # POST: Generate or regenerate embeddings for bill content
    # Used when: New bills added, content updated, search optimization needed
    path('admin/bills/<uuid:bill_id>/embeddings/generate/', 
         embedding_service.generate_embeddings_endpoint, 
         name='generate_embeddings'),
]

# =============================================================================
# PUBLIC PROJECT ENDPOINTS (Legacy - Maintained for compatibility)
# =============================================================================
"""
Public project endpoints maintained for backward compatibility.
These will eventually be migrated to the new public access pattern.
"""
public_legacy_urlpatterns = [
    # Legacy public project access
    path('public/projects/', public_projects_list, name='public-projects'),
    path('public/bills/', public_bills_list, name='public-bills'),  # Legacy endpoint
]

# =============================================================================
# COMPLETE URL CONFIGURATION
# =============================================================================
"""
Combine all URL patterns in logical order for Django URL resolution.
Order matters - more specific patterns should come before general ones.
"""
urlpatterns = (
    # Core system endpoints (health checks, etc.)
    core_urlpatterns +
    
    # Authentication and user management
    auth_urlpatterns +
    
    # Location services
    location_urlpatterns +
    
    # Citizen feedback system
    feedback_urlpatterns +
    
    # AI processing and analytics
    ai_urlpatterns +
    
    # Admin core functionality
    admin_core_urlpatterns +
    
    # Phase 1: Admin bill management
    admin_bills_urlpatterns +
    
    # Phase 2: Async processing and real-time updates
    async_processing_urlpatterns +
    
    # Phase 3: Public citizen access
    public_access_urlpatterns +
    
    # Phase 3: Interactive chat system
    interactive_chat_urlpatterns +
    
    # Utility endpoints
    utility_urlpatterns +
    
    # Legacy endpoints (backward compatibility)
    public_legacy_urlpatterns
)

# =============================================================================
# FRONTEND DEVELOPER INTEGRATION GUIDE
# =============================================================================
"""
QUICK START GUIDE FOR FRONTEND DEVELOPERS

1. AUTHENTICATION FLOW
======================
// Login user
const loginResponse = await fetch('/api/auth/login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'user', password: 'pass' })
});

// Store tokens and set up refresh
const { access, refresh } = await loginResponse.json();
localStorage.setItem('access_token', access);
localStorage.setItem('refresh_token', refresh);

// Use in subsequent requests
const headers = {
    'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
    'Content-Type': 'application/json'
};

2. ERROR HANDLING PATTERN
==========================
async function apiCall(url, options = {}) {
    try {
        const response = await fetch(url, options);
        const data = await response.json();
        
        if (!data.success) {
            showError(data.message);
            if (data.suggestions) {
                showSuggestions(data.suggestions);
            }
            return null;
        }
        
        return data;
    } catch (error) {
        showError('Network error. Please check your connection.');
        return null;
    }
}

3. PUBLIC BILL ACCESS
=====================
// Get published bills for citizens
const bills = await apiCall('/api/public/bills/?search=education&page=1');
if (bills) {
    displayBillsList(bills.bills);
    setupPagination(bills.pagination);
}

// Get bill details
const bill = await apiCall(`/api/public/bills/${billId}/`);
if (bill && bill.bill.can_chat) {
    enableChatInterface();
}

4. INTERACTIVE CHAT
====================
// Chat with bill
const chatResponse = await apiCall(`/api/public/bills/${billId}/chat/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        question: 'How will this affect small businesses?',
        session_id: getSessionId(),
        use_embeddings: true
    })
});

if (chatResponse) {
    displayResponse(chatResponse.response);
    showSources(chatResponse.sources);
    suggestFollowUps(chatResponse.follow_up_questions);
}

5. ADMIN FUNCTIONALITY
=======================
// Upload and process new bill (admin)
const formData = new FormData();
formData.append('title', 'New Bill Title');
formData.append('document', fileInput.files[0]);
formData.append('process_immediately', 'true');

const result = await fetch('/api/admin/bills/', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
});

// Monitor processing progress
const progressInterval = setInterval(async () => {
    const progress = await apiCall(`/api/admin/bills/${billId}/progress/`);
    updateProgressBar(progress.completion_percentage);
    
    if (progress.status === 'completed') {
        clearInterval(progressInterval);
        showSuccess('Bill processing completed!');
    }
}, 2000);

6. REAL-TIME UPDATES (WebSocket)
================================
// Connect to progress updates (admin)
const socket = new WebSocket(`ws://${window.location.host}/ws/bills/${billId}/progress/`);

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updateProgressBar(data.progress);
    updateStatus(data.status);
    if (data.logs) {
        appendLogs(data.logs);
    }
};

7. RATE LIMITING HANDLING
==========================
// Implement exponential backoff for rate limits
async function apiCallWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        const response = await fetch(url, options);
        
        if (response.status === 429) {
            const retryAfter = response.headers.get('Retry-After') || Math.pow(2, i);
            await sleep(retryAfter * 1000);
            continue;
        }
        
        return response;
    }
    throw new Error('Max retries exceeded');
}

8. MOBILE OPTIMIZATION
======================
// Use pagination and optimize for mobile
const bills = await apiCall('/api/public/bills/?page=1&page_size=5');

// Implement infinite scroll
const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasNextPage) {
        loadMoreBills();
    }
});

9. CACHING STRATEGY
===================
// Cache frequently accessed data
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

async function getCachedData(key, fetchFunction) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    
    const data = await fetchFunction();
    cache.set(key, { data, timestamp: Date.now() });
    return data;
}

10. ACCESSIBILITY CONSIDERATIONS
===============================
// Announce progress updates to screen readers
const announcer = document.getElementById('sr-announcer');
announcer.textContent = `Processing progress: ${percentage}% complete`;

// Provide keyboard navigation for chat
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
        sendMessage();
    }
});

11. PERFORMANCE TIPS
====================
- Use AbortController to cancel requests on route changes
- Implement search debouncing (300ms delay)
- Preload chat suggestions for better UX  
- Use Virtual scrolling for large bill lists
- Implement service worker for offline bill reading
- Compress images and use WebP format
- Lazy load bill content below the fold

12. SECURITY BEST PRACTICES
============================
- Never store sensitive data in localStorage
- Sanitize all user inputs before display
- Use HTTPS in production
- Implement CSP headers
- Validate file uploads on frontend
- Use secure session management
- Implement proper CORS headers

RESPONSE FORMATS REFERENCE
===========================
All API responses follow this consistent structure:

Success Response:
{
    "success": true,
    "data": { ... },
    "message": "Optional success message",
    "metadata": { ... }  // Optional additional info
}

Error Response:
{
    "success": false,
    "error": "Technical error description",
    "message": "User-friendly error message", 
    "suggestions": ["Try this", "Or this"],
    "error_code": "BILL_NOT_FOUND"  // Optional error code
}

Pagination Response:
{
    "success": true,
    "data": [...],
    "pagination": {
        "current_page": 1,
        "total_pages": 10,
        "total_items": 95,
        "has_next": true,
        "has_previous": false,
        "next_page": 2,
        "previous_page": null
    }
}

This comprehensive URL configuration supports all phases of the CivicAI system
while providing clear guidance for frontend developers to build excellent user experiences.
"""


# # =============================================================================
# # FILE: apps/api/urls.py (FIXED URL STRUCTURE)
# # =============================================================================
# from django.urls import path
# from rest_framework_simplejwt.views import TokenRefreshView
# from . import views
# from apps.feedback import views as feedback_views
# from apps.ai import views as ai_views
# from .admin_views import (
#     admin_dashboard_stats, admin_users_list, admin_feedback_list,
#     respond_to_feedback, admin_projects_list, update_project_status, admin_project_detail,
#     public_projects_list, admin_bills_list, admin_bill_detail, public_bills_list, admin_bill_progress,
#     admin_bill_reprocess, admin_processing_overview, admin_bill_processing_status, admin_retry_bill_processing,
#     admin_cancel_bill_processing, admin_bill_processing_status
# )

# app_name = 'api'

# urlpatterns = [
#     # Health check
#     path('health/', views.system_health, name='health'),
    
#     # Authentication endpoints
#     path('auth/register/', views.RegisterView.as_view(), name='register'),
#     path('auth/login/', views.LoginView.as_view(), name='login'),
#     path('auth/logout/', views.LogoutView.as_view(), name='logout'),
#     path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
#     path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
#     path('auth/anonymous/', views.AnonymousSessionView.as_view(), name='anonymous_session'),
#     path('auth/anonymous/<str:session_id>/status/', views.anonymous_session_status, name='anonymous_status'),
    
#     # Location endpoints  
#     path('locations/counties/', views.CountyListView.as_view(), name='counties'),
#     path('locations/hierarchy/', views.LocationHierarchyView.as_view(), name='hierarchy'),
    
#     # Feedback endpoints
#     path('feedback/submit/', feedback_views.FeedbackSubmissionView.as_view(), name='submit'),
#     path('feedback/anonymous/', feedback_views.AnonymousFeedbackView.as_view(), name='anonymous_submit'),
#     path('feedback/track/<str:tracking_id>/', feedback_views.track_feedback, name='track'),
#     path('feedback/categories/', feedback_views.feedback_categories, name='categories'),
#     path('feedback/my-submissions/', feedback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
#     path('feedback/my-submissions/<uuid:id>/', feedback_views.UserFeedbackDetailView.as_view(), name='user_feedback_detail'),
#     path('feedback/my-submissions/<uuid:id>/edit/', feedback_views.UserFeedbackUpdateView.as_view(), name='user_feedback_update'),
#     path('feedback/my-submissions/<uuid:id>/delete/', feedback_views.UserFeedbackDeleteView.as_view(), name='user_feedback_delete'),
#     path('feedback/my-stats/', feedback_views.user_feedback_statistics, name='user_feedback_stats'),
    
#     # AI endpoints
#     path('ai/dashboard/', ai_views.CountyAIDashboardView.as_view(), name='ai-dashboard'),
#     path('ai/feedback/<uuid:feedback_id>/suggestions/', ai_views.get_ai_response_suggestions, name='ai-response-suggestions'),
#     path('ai/analytics/', ai_views.get_county_ai_analytics, name='ai-analytics'),
#     path('ai/health/', ai_views.ai_system_health, name='ai-health'),
#     path('ai/stats/', ai_views.ai_processing_stats, name='ai-stats'),
#     path('ai/tasks/<str:task_id>/status/', ai_views.check_ai_task_status, name='ai-task-status'),
#     path('ai/feedback/<uuid:feedback_id>/process/', ai_views.trigger_feedback_ai_processing, name='ai-trigger-processing'),
    
#     # Admin endpoints
#     path('admin/dashboard/', admin_dashboard_stats, name='admin-dashboard'),
#     path('admin/users/', admin_users_list, name='admin-users'),
#     path('admin/feedback/', admin_feedback_list, name='admin-feedback'),
#     path('admin/feedback/<uuid:feedback_id>/respond/', respond_to_feedback, name='admin-respond'),
#     path('admin/projects/', admin_projects_list, name='admin-projects'),
#     path('admin/projects/<uuid:project_id>/status/', update_project_status, name='admin-project-status'),
#     path('admin/projects/<uuid:project_id>/', admin_project_detail, name='admin-project-detail'),
#     path('admin/bills/', admin_bills_list, name='admin-bills'),

#     path('admin/bills/<uuid:bill_id>/', admin_bill_detail, name='admin-bill-detail'),

#     # path('admin/bills/', admin_views.admin_bills_list, name='admin_bills_list'),
    
#     # NEW: Enhanced progress tracking endpoints for Phase 1
#     path('admin/bills/<uuid:bill_id>/progress/', admin_bill_progress, name='admin_bill_progress'),
#     path('admin/bills/<uuid:bill_id>/reprocess/', admin_bill_reprocess, name='admin_bill_reprocess'),
#     path('admin/processing-overview/', admin_processing_overview, name='admin_processing_overview'),

#     # NEW Phase 2 URLs - Async Processing & Real-time Updates
#     # Detailed async processing status
#     path('admin/bills/<uuid:bill_id>/status/', 
#          admin_bill_processing_status, 
#          name='admin_bill_processing_status'),
    
#     # Async processing control
#     path('admin/bills/<uuid:bill_id>/retry/', 
#         admin_retry_bill_processing, 
#          name='admin_retry_bill_processing'),
    
#     path('admin/bills/<uuid:bill_id>/cancel/', 
#          admin_cancel_bill_processing, 
#          name='admin_cancel_bill_processing'),
    
#     # Public endpoints
#     path('public/projects/', public_projects_list, name='public-projects'),
#     path('public/bills/', public_bills_list, name='public-bills'),
# ]
