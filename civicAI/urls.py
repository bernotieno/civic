# =============================================================================
# FILE: civicAI/urls.py (ENHANCED WITH SWAGGER ENDPOINTS)
# =============================================================================
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.shortcuts import render
from drf_spectacular.views import (
    SpectacularAPIView, 
    SpectacularSwaggerView, 
    SpectacularRedocView
)


def home_view(request):
    """Enhanced home page view with API documentation links"""
    context = {
        'title': 'CivicAI - Civic Feedback System',
        'counties_count': 0,
        'users_count': 0,
        'api_docs_url': '/api/docs/',
        'api_schema_url': '/api/schema/',
        'redoc_url': '/api/redoc/',
    }
    
    # Try to get counts (may fail if models not imported yet)
    try:
        from apps.users.models import County, CustomUser
        context['counties_count'] = County.objects.count()
        context['users_count'] = CustomUser.objects.count()
    except:
        pass
    
    return render(request, 'home.html', context)


def health_check(request):
    """Enhanced health check endpoint with API info"""
    return HttpResponse(
        "✅ CivicAI is running!\n"
        "📚 API Documentation: /api/docs/\n"
        "🔧 API Schema: /api/schema/\n"
        "📖 ReDoc: /api/redoc/\n"
        "⚡ Admin: /admin/\n"
    )


urlpatterns = [
    # 🚀 API Documentation Endpoints
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    
    # Admin interface
    path('admin/', admin.site.urls),
    
    # API endpoints
    path('api/', include('apps.api.urls')),
    
    # Basic views
    path('', home_view, name='home'),
    path('health/', health_check, name='health'),
    
    # Add app URLs here as you create them:
    # path('feedback/', include('apps.feedback.urls')),
]

# Debug Toolbar (development only)
if settings.DEBUG:
    # Add debug toolbar URLs if available
    try:
        import debug_toolbar
        urlpatterns = [
            path('__debug__/', include(debug_toolbar.urls)),
        ] + urlpatterns
    except ImportError:
        pass

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = "CivicAI Administration"
admin.site.site_title = "CivicAI Admin"
admin.site.index_title = "🇰🇪 Welcome to CivicAI Administration"