# =============================================================================
# FILE: apps/users/admin.py
# =============================================================================
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Location, County, CustomUser


@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'level', 'parent', 'code', 'full_path', 'is_deleted']
    list_filter = ['type', 'level', 'is_deleted']
    search_fields = ['name', 'code']
    ordering = ['level', 'name']
    raw_id_fields = ['parent']
    
    def full_path(self, obj):
        return obj.get_full_path()
    full_path.short_description = 'Full Path'
    
    def get_queryset(self, request):
        # Show all objects including soft-deleted in admin
        return self.model.all_objects.get_queryset()


@admin.register(County)
class CountyAdmin(admin.ModelAdmin):
    list_display = ['name', 'code', 'location_link', 'is_active', 'user_count', 'is_deleted']
    list_filter = ['is_active', 'is_deleted']
    search_fields = ['name', 'code']
    ordering = ['name']
    raw_id_fields = ['location']
    
    def location_link(self, obj):
        if obj.location:
            url = reverse('admin:users_location_change', args=[obj.location.pk])
            return format_html('<a href="{}">{}</a>', url, obj.location.name)
        return '-'
    location_link.short_description = 'Location'
    
    def user_count(self, obj):
        return obj.users.count()
    user_count.short_description = 'Users'
    
    def get_queryset(self, request):
        return self.model.all_objects.get_queryset()


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = [
        'name', 'email', 'role', 'admin_level', 
        'user_county', 'is_active', 'is_deleted'
    ]
    list_filter = [
        'role', 'admin_level', 'is_active', 'is_deleted',
        'user_county'
    ]
    search_fields = ['name', 'email', 'national_id_hash']
    ordering = ['name']
    
    # Custom fieldsets for user form
    fieldsets = (
        (None, {
            'fields': ('national_id_hash', 'password')
        }),
        ('Personal info', {
            'fields': ('name', 'email', 'first_name', 'last_name')
        }),
        ('Location Hierarchy', {
            'fields': ('county', 'sub_county', 'ward', 'village'),
            'description': 'User\'s location in Kenya\'s administrative hierarchy'
        }),
        ('Role & Permissions', {
            'fields': ('role', 'admin_level', 'user_county'),
            'description': 'Role determines what the user can see and do'
        }),
        ('Audit Trail', {
            'fields': ('role_assigned_by', 'role_assigned_at'),
            'classes': ('collapse',),
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',),
        }),
        ('Important dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',),
        }),
        ('Soft Delete', {
            'fields': ('is_deleted', 'deleted_at', 'deleted_by'),
            'classes': ('collapse',),
        }),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('national_id_hash', 'password1', 'password2'),
        }),
        ('Basic Info', {
            'fields': ('name', 'email', 'role', 'user_county'),
        }),
        ('Location', {
            'fields': ('county',),
        }),
    )
    
    filter_horizontal = ('groups', 'user_permissions')
    raw_id_fields = ['county', 'sub_county', 'ward', 'village', 'user_county', 'role_assigned_by']
    
    def get_queryset(self, request):
        return self.model.all_objects.get_queryset()
    
    def save_model(self, request, obj, form, change):
        # Auto-assign role_assigned_by
        if not change:  # Creating new user
            obj.role_assigned_by = request.user
        super().save_model(request, obj, form, change)
