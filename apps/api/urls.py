# =============================================================================
# STEP 7: URL Configuration
# FILE: apps/api/urls.py
# =============================================================================
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

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

urlpatterns = [
    # Health check
    path('health/', views.system_health, name='health'),
    
    # Authentication endpoints
    path('auth/', include(auth_urls)),
    
    # Location endpoints  
    path('locations/', include(location_urls)),
]
