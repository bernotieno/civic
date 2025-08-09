# =============================================================================
# FILE: apps/api/urls.py (ENHANCED WITH ORGANIZED URL STRUCTURE)
# =============================================================================
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from apps.feedback import views as feedback_views

app_name = 'api'

# Authentication URLs
auth_urls = [
    path('register/', views.RegisterView.as_view(), name='register'),
    path('login/', views.LoginView.as_view(), name='login'),
    path('logout/', views.LogoutView.as_view(), name='logout'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.UserProfileView.as_view(), name='profile'),
    path('anonymous/', views.AnonymousSessionView.as_view(), name='anonymous_session'),
    path('anonymous/<str:session_id>/status/', views.anonymous_session_status, name='anonymous_status'),
]

# Location URLs
location_urls = [
    path('counties/', views.CountyListView.as_view(), name='counties'),
    path('hierarchy/', views.LocationHierarchyView.as_view(), name='hierarchy'),
]

# Feedback URLs
feedback_urls = [
    path('submit/', feedback_views.FeedbackSubmissionView.as_view(), name='submit'),
    path('anonymous/', feedback_views.AnonymousFeedbackView.as_view(), name='anonymous_submit'),
    path('track/<str:tracking_id>/', feedback_views.track_feedback, name='track'),
    path('categories/', feedback_views.feedback_categories, name='categories'),

    # User feedback management
    path('feedback/my-submissions/', feedback_views.UserFeedbackListView.as_view(), name='user_feedback_list'),
    path('feedback/my-submissions/<uuid:id>/', feedback_views.UserFeedbackDetailView.as_view(), name='user_feedback_detail'),
    path('feedback/my-submissions/<uuid:id>/edit/', feedback_views.UserFeedbackUpdateView.as_view(), name='user_feedback_update'),
    path('feedback/my-submissions/<uuid:id>/delete/', feedback_views.UserFeedbackDeleteView.as_view(), name='user_feedback_delete'),
    path('feedback/my-stats/', feedback_views.user_feedback_statistics, name='user_feedback_stats'),
]

urlpatterns = [
    # Health check
    path('health/', views.system_health, name='health'),
    
    # Authentication endpoints
    path('auth/', include(auth_urls)),
    
    # Location endpoints  
    path('locations/', include(location_urls)),
    
    # Feedback endpoints
    path('feedback/', include(feedback_urls)),
]
