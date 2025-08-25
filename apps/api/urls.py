# =============================================================================
# FILE: apps/api/urls.py (FIXED URL STRUCTURE)
# =============================================================================
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from apps.feedback import views as feedback_views
from apps.ai import views as ai_views
from .admin_views import (
    admin_dashboard_stats, admin_users_list, admin_feedback_list,
    respond_to_feedback, admin_projects_list, update_project_status, admin_project_detail,
    public_projects_list, admin_bills_list, update_bill_status, admin_bill_detail, public_bills_list
)

app_name = 'api'

urlpatterns = [
    # Health check
    path('health/', views.system_health, name='health'),
    
    # Authentication endpoints
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/logout/', views.LogoutView.as_view(), name='logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/profile/', views.UserProfileView.as_view(), name='profile'),
    path('auth/anonymous/', views.AnonymousSessionView.as_view(), name='anonymous_session'),
    path('auth/anonymous/<str:session_id>/status/', views.anonymous_session_status, name='anonymous_status'),
    
    # Location endpoints  
    path('locations/counties/', views.CountyListView.as_view(), name='counties'),
    path('locations/hierarchy/', views.LocationHierarchyView.as_view(), name='hierarchy'),
    
    # Feedback endpoints
    path('feedback/submit/', feedback_views.FeedbackSubmissionView.as_view(), name='submit'),
    path('feedback/anonymous/', feedback_views.AnonymousFeedbackView.as_view(), name='anonymous_submit'),
    path('feedback/track/<str:tracking_id>/', feedback_views.track_feedback, name='track'),
    path('feedback/categories/', feedback_views.feedback_categories, name='categories'),
    path('feedback/my-submissions/', feedback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
    path('feedback/my-submissions/<uuid:id>/', feedback_views.UserFeedbackDetailView.as_view(), name='user_feedback_detail'),
    path('feedback/my-submissions/<uuid:id>/edit/', feedback_views.UserFeedbackUpdateView.as_view(), name='user_feedback_update'),
    path('feedback/my-submissions/<uuid:id>/delete/', feedback_views.UserFeedbackDeleteView.as_view(), name='user_feedback_delete'),
    path('feedback/my-stats/', feedback_views.user_feedback_statistics, name='user_feedback_stats'),
    
    # AI endpoints
    path('ai/dashboard/', ai_views.CountyAIDashboardView.as_view(), name='ai-dashboard'),
    path('ai/feedback/<uuid:feedback_id>/suggestions/', ai_views.get_ai_response_suggestions, name='ai-response-suggestions'),
    path('ai/analytics/', ai_views.get_county_ai_analytics, name='ai-analytics'),
    path('ai/health/', ai_views.ai_system_health, name='ai-health'),
    path('ai/stats/', ai_views.ai_processing_stats, name='ai-stats'),
    path('ai/tasks/<str:task_id>/status/', ai_views.check_ai_task_status, name='ai-task-status'),
    path('ai/feedback/<uuid:feedback_id>/process/', ai_views.trigger_feedback_ai_processing, name='ai-trigger-processing'),
    
    # Admin endpoints
    path('admin/dashboard/', admin_dashboard_stats, name='admin-dashboard'),
    path('admin/users/', admin_users_list, name='admin-users'),
    path('admin/feedback/', admin_feedback_list, name='admin-feedback'),
    path('admin/feedback/<uuid:feedback_id>/respond/', respond_to_feedback, name='admin-respond'),
    path('admin/projects/', admin_projects_list, name='admin-projects'),
    path('admin/projects/<uuid:project_id>/status/', update_project_status, name='admin-project-status'),
    path('admin/projects/<uuid:project_id>/', admin_project_detail, name='admin-project-detail'),
    path('admin/bills/', admin_bills_list, name='admin-bills'),
    path('admin/bills/<uuid:bill_id>/status/', update_bill_status, name='admin-bill-status'),
    path('admin/bills/<uuid:bill_id>/', admin_bill_detail, name='admin-bill-detail'),
    
    # Public endpoints
    path('public/projects/', public_projects_list, name='public-projects'),
    path('public/bills/', public_bills_list, name='public-bills'),
]
