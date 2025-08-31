# =============================================================================
# STEP 6: FILTERING SYSTEM
# FILE: apps/feedback/filters.py (CREATE THIS)
# =============================================================================

import django_filters
from django.db.models import Q
from .models import Feedback

class UserFeedbackFilter(django_filters.FilterSet):
    """Advanced filtering for user's feedback"""
    

    
    # Date range filtering
    date_from = django_filters.DateFilter(field_name='created_at', lookup_expr='gte')
    date_to = django_filters.DateFilter(field_name='created_at', lookup_expr='lte')
    
    # Search in title and content
    search = django_filters.CharFilter(method='filter_search', label='Search')
    
    # Edit status filtering
    has_edits = django_filters.BooleanFilter(
        method='filter_has_edits',
        label='Has Edits'
    )
    
    class Meta:
        model = Feedback
        fields = ['date_from', 'date_to', 'search', 'has_edits']
    
    # Response filtering removed
    
    def filter_search(self, queryset, name, value):
        """Search in title and content"""
        if value:
            return queryset.filter(
                Q(title__icontains=value) | Q(content__icontains=value)
            )
        return queryset
    
    def filter_has_edits(self, queryset, name, value):
        """Filter by edit status"""
        if value is True:
            return queryset.filter(edit_count__gt=0)
        elif value is False:
            return queryset.filter(edit_count=0)
        return queryset
