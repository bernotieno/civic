# =============================================================================
# FILE: civicAI/urls.py (UPDATED - COMPLETE FIX)
# =============================================================================
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
from django.shortcuts import render


def home_view(request):
    """Simple home page view for testing"""
    context = {
        'title': 'CivicAI - Civic Feedback System',
        'counties_count': 0,
        'users_count': 0,
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
    """Health check endpoint"""
    return HttpResponse("OK - CivicAI is running!")


urlpatterns = [
    # Admin interface
    path('admin/', admin.site.urls),
    
    # Basic views
    path('', home_view, name='home'),
    path('health/', health_check, name='health'),
    
    # Add app URLs here as you create them:
    # path('api/', include('apps.api.urls')),
    # path('feedback/', include('apps.feedback.urls')),
]

# Debug Toolbar (development only)
if settings.DEBUG:
    # Add debug toolbar URLs
    import debug_toolbar
    urlpatterns = [
        path('__debug__/', include(debug_toolbar.urls)),
    ] + urlpatterns

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

# Customize admin site
admin.site.site_header = "CivicAI Administration"
admin.site.site_title = "CivicAI Admin"
admin.site.index_title = "Welcome to CivicAI Administration"