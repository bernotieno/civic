# =============================================================================
# FILE: apps/feedback/utils.py (FIXED CIRCULAR IMPORT)
# =============================================================================
from apps.core.anonymous import AnonymousSessionManager
from django.core.cache import cache
from django.utils import timezone
from datetime import timedelta
from django.db.models import Q, Count, Avg
import uuid
import hashlib
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

def calculate_user_feedback_stats(user):
    """Calculate comprehensive user feedback statistics"""
    # Late import to avoid circular dependency
    from .models import Feedback
    
    user_feedback = Feedback.objects.filter(user=user, is_deleted=False)
    
    stats = {
        'total_submissions': user_feedback.count(),
    }
    
    # Category breakdown
    category_stats = user_feedback.values('category').annotate(
        count=Count('id')
    ).order_by('-count')
    
    stats['category_breakdown'] = list(category_stats)
    stats['most_used_category'] = category_stats[0]['category'] if category_stats else None
    
    # Response statistics removed
    
    # Submission streak (consecutive days with submissions)
    recent_submissions = user_feedback.filter(
        created_at__gte=timezone.now() - timedelta(days=30)
    ).values('created_at__date').distinct().count()
    
    stats['submissions_last_30_days'] = recent_submissions
    
    # Edit statistics - Handle missing fields gracefully
    try:
        stats['total_edits'] = user_feedback.aggregate(
            total=Count('edit_count')
        )['total'] or 0
        
        stats['heavily_edited_count'] = user_feedback.filter(edit_count__gte=2).count()
    except Exception:
        # Fallback if edit_count field doesn't exist yet (before migration)
        stats['total_edits'] = 0
        stats['heavily_edited_count'] = 0
    
    return stats


def track_feedback_view(feedback, user=None):
    """Increment feedback view count"""
    feedback.view_count += 1
    feedback.save(update_fields=['view_count'])


class FeedbackRateLimit:
    """
    Rate limiting for feedback submissions
    Enhanced with additional role support while keeping your core logic
    """
    
    @classmethod
    def check_citizen_limit(cls, user):
        """
        Check if citizen can submit (10 per day for citizens, 50 for officials)
        Enhanced to support government officials while keeping your citizen logic
        """
        if not user or not user.is_authenticated:
            return False, "Authentication required"
        
        # Anonymous users handled separately
        if user.role == 'anonymous':
            return False, "Anonymous users cannot use this endpoint"
        
        # Determine daily limit based on role
        if user.role == 'citizen':
            daily_limit = 10
        elif user.role == 'government_official':
            daily_limit = 50
        else:
            return False, "Invalid user role"
        
        cache_key = f"feedback_limit_{user.role}_{user.id}"
        submissions_today = cache.get(cache_key, 0)
        
        if submissions_today >= daily_limit:
            return False, f"Daily submission limit reached ({daily_limit} per day)"
        
        return True, f"OK - {daily_limit - submissions_today} submissions remaining"
    
    @classmethod
    def record_citizen_submission(cls, user):
        """
        Record citizen/official submission for rate limiting
        Enhanced to support all authenticated user types
        """
        if not user or user.role == 'anonymous':
            return
        
        cache_key = f"feedback_limit_{user.role}_{user.id}"
        submissions_today = cache.get(cache_key, 0)
        
        # Set expiry to end of day (keeping your logic)
        now = timezone.now()
        tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
        seconds_until_tomorrow = int((tomorrow - now).total_seconds())
        
        cache.set(cache_key, submissions_today + 1, seconds_until_tomorrow)
    
    @classmethod
    def check_anonymous_limit(cls, session_id):
        """Check anonymous session submission limit (keeping your implementation)"""
        return AnonymousSessionManager.can_submit(session_id)
    
    @classmethod
    def record_anonymous_submission(cls, session_id):
        """Record anonymous submission (keeping your implementation)"""
        session_data = AnonymousSessionManager.get_session(session_id)
        
        if session_data:
            AnonymousSessionManager.update_session(
                session_id,
                submission_count=session_data['submission_count'] + 1,
                last_submission=timezone.now().isoformat()
            )
    
    @classmethod
    def get_user_stats(cls, user):
        """
        Get user's rate limit statistics
        New utility for analytics and user dashboards
        """
        if not user or not user.is_authenticated or user.role == 'anonymous':
            return None
        
        # Get daily limit based on role
        if user.role == 'citizen':
            daily_limit = 10
        elif user.role == 'government_official':
            daily_limit = 50
        else:
            return None
        
        # Get current usage
        cache_key = f"feedback_limit_{user.role}_{user.id}"
        current_count = cache.get(cache_key, 0)
        
        return {
            'daily_limit': daily_limit,
            'used_today': current_count,
            'remaining_today': daily_limit - current_count,
            'can_submit': current_count < daily_limit,
            'role': user.role
        }

def generate_tracking_id():
    """
    Generate unique tracking ID (keeping your TRACK_ format)
    Enhanced with date component for better organization
    """
    now = timezone.now()
    date_component = now.strftime('%y%m%d')  # 6 characters: YYMMDD
    raw_string = f"{now.timestamp()}-{uuid.uuid4()}"
    hash_component = hashlib.sha256(raw_string.encode()).hexdigest()[:6].upper()  # 6 characters

    return f"T{date_component}{hash_component}"  # Total: 1 + 6 + 6 = 13


# =============================================================================
# NEW UTILITY FUNCTIONS (Additions that align with your patterns)
# =============================================================================

def validate_feedback_title(title):
    """
    Validate feedback title meets quality standards
    Simple validation that aligns with your validation approach
    """
    if not title or not title.strip():
        raise ValidationError(_("Title cannot be empty"))
    
    title = title.strip()
    
    # Length validation
    if len(title) < 10:
        raise ValidationError(_("Title must be at least 10 characters long"))
    
    if len(title) > 200:
        raise ValidationError(_("Title cannot exceed 200 characters"))
    
    # Basic quality check
    if title.lower() in ['test', 'testing', 'hello', 'hi']:
        raise ValidationError(_("Please provide a descriptive title"))
    
    return title


def validate_feedback_content(content):
    """
    Validate feedback content meets quality standards
    Simple validation that aligns with your approach
    """
    if not content or not content.strip():
        raise ValidationError(_("Content cannot be empty"))
    
    content = content.strip()
    
    # Length validation
    if len(content) < 50:
        raise ValidationError(_("Content must be at least 50 characters long"))
    
    if len(content) > 5000:
        raise ValidationError(_("Content cannot exceed 5000 characters"))
    
    # Basic quality check
    if content.lower() in ['test', 'testing', 'hello']:
        raise ValidationError(_("Please provide detailed feedback content"))
    
    # Minimum word count
    words = len(content.split())
    if words < 5:
        raise ValidationError(_("Content must contain at least 5 words"))
    
    return content


def validate_location_hierarchy(county, sub_county=None, ward=None, village=None):
    """
    Validate that the location hierarchy is correct
    Follows your invisible boundaries principle
    """
    if not county:
        raise ValidationError(_("County is required"))
    
    # If sub_county is provided, validate it belongs to county
    if sub_county:
        if sub_county.parent != county.location:
            raise ValidationError(_("Sub-county does not belong to the selected county"))
    
    # If ward is provided, validate it belongs to sub_county
    if ward:
        if not sub_county:
            raise ValidationError(_("Ward requires a sub-county to be selected"))
        if ward.parent != sub_county:
            raise ValidationError(_("Ward does not belong to the selected sub-county"))
    
    # If village is provided, validate it belongs to ward
    if village:
        if not ward:
            raise ValidationError(_("Village requires a ward to be selected"))
        if village.parent != ward:
            raise ValidationError(_("Village does not belong to the selected ward"))
    
    return True


def sanitize_feedback_content(content):
    """
    Sanitize feedback content to remove potential security issues
    Simple sanitization that aligns with your security approach
    """
    import html
    
    # HTML escape
    content = html.escape(content)
    
    # Remove excessive whitespace
    content = re.sub(r'\s+', ' ', content).strip()
    
    # Remove potentially harmful patterns
    content = re.sub(r'<[^>]+>', '', content)  # Remove any HTML tags
    content = re.sub(r'javascript:', '', content, flags=re.IGNORECASE)
    
    return content


def is_duplicate_feedback(title, content, user, hours=24):
    """
    Check if feedback might be a duplicate based on content similarity
    Lightweight duplicate detection
    """
    # Late import to avoid circular dependency
    from .models import Feedback
    
    # Simple hash-based duplicate detection
    content_hash = hashlib.md5(f"{title.lower()} {content.lower()}".encode()).hexdigest()
    
    # Check for similar submissions in the last N hours
    since_time = timezone.now() - timedelta(hours=hours)
    
    # Look for exact content matches from same user
    similar_feedback = Feedback.objects.filter(
        user=user,
        created_at__gte=since_time,
        is_deleted=False
    )
    
    for feedback in similar_feedback:
        existing_hash = hashlib.md5(f"{feedback.title.lower()} {feedback.content.lower()}".encode()).hexdigest()
        if content_hash == existing_hash:
            return True, feedback
    
    return False, None


def format_tracking_id_for_display(tracking_id):
    """
    Format tracking ID for better readability
    Keeps your TRACK_ format but makes it more readable
    """
    if not tracking_id or not tracking_id.startswith('TRACK_'):
        return tracking_id
    
    # TRACK_240815ABC123 -> TRACK-240815-ABC123
    if len(tracking_id) >= 15:
        base = tracking_id[6:]  # Remove 'TRACK_'
        if len(base) >= 6:
            date_part = base[:6]
            rest = base[6:]
            return f"TRACK-{date_part}-{rest}"
    
    return tracking_id


class FeedbackAnalytics:
    """
    Simple analytics functions for feedback insights
    Lightweight analytics that align with your approach
    """
    
    @classmethod
    def get_category_stats(cls, county=None, days=30):
        """Get feedback statistics by category"""
        # Late import to avoid circular dependency
        from .models import Feedback
        from django.db.models import Count
        
        # Base queryset
        queryset = Feedback.objects.filter(is_deleted=False)
        
        # Filter by county if provided
        if county:
            queryset = queryset.filter(county=county)
        
        # Filter by date range
        since_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(created_at__gte=since_date)
        
        # Get category counts
        category_stats = queryset.values('category').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return list(category_stats)
    
    @classmethod
    def get_status_distribution(cls, county=None, days=30):
        """Get feedback status distribution"""
        # Late import to avoid circular dependency
        from .models import Feedback
        from django.db.models import Count
        
        # Base queryset
        queryset = Feedback.objects.filter(is_deleted=False)
        
        # Filter by county if provided
        if county:
            queryset = queryset.filter(county=county)
        
        # Filter by date range
        since_date = timezone.now() - timedelta(days=days)
        queryset = queryset.filter(created_at__gte=since_date)
        
        # Get status distribution
        status_stats = queryset.values('status').annotate(
            count=Count('id')
        ).order_by('-count')
        
        return list(status_stats)
        

# # =============================================================================
# # FILE: apps/feedback/utils.py 
# # =============================================================================
# from apps.core.anonymous import AnonymousSessionManager
# from django.core.cache import cache
# from django.utils import timezone
# from datetime import timedelta
# from django.db.models import Q, Count, Avg
# import uuid
# import hashlib
# import re
# from django.core.exceptions import ValidationError
# from django.utils.translation import gettext_lazy as _

# def calculate_user_feedback_stats(user):
#     """Calculate comprehensive user feedback statistics"""
#     from .models import Feedback    
#     user_feedback = Feedback.objects.filter(user=user, is_deleted=False)
    
#     stats = {
#         'total_submissions': user_feedback.count(),
#         'pending_count': user_feedback.filter(status='pending').count(),
#         'in_review_count': user_feedback.filter(status='in_review').count(),
#         'responded_count': user_feedback.filter(status='responded').count(),
#         'resolved_count': user_feedback.filter(status='resolved').count(),
#         'closed_count': user_feedback.filter(status='closed').count(),
#     }
    
#     # Category breakdown
#     category_stats = user_feedback.values('category').annotate(
#         count=Count('id')
#     ).order_by('-count')
    
#     stats['category_breakdown'] = list(category_stats)
#     stats['most_used_category'] = category_stats[0]['category'] if category_stats else None
    
#     # Response statistics
#     responded_feedback = user_feedback.filter(response_count__gt=0)
#     if responded_feedback.exists():
#         # Calculate average response time
#         avg_response_time = responded_feedback.aggregate(
#             avg_time=Avg('last_response_at') - Avg('created_at')
#         )
#         stats['average_response_time_days'] = avg_response_time['avg_time'].days if avg_response_time['avg_time'] else 0
#     else:
#         stats['average_response_time_days'] = None
    
#     # Submission streak (consecutive days with submissions)
#     recent_submissions = user_feedback.filter(
#         created_at__gte=timezone.now() - timedelta(days=30)
#     ).values('created_at__date').distinct().count()
    
#     stats['submissions_last_30_days'] = recent_submissions
    
#     # Edit statistics
#     stats['total_edits'] = user_feedback.aggregate(
#         total=Count('edit_count')
#     )['total'] or 0
    
#     stats['heavily_edited_count'] = user_feedback.filter(edit_count__gte=2).count()
    
#     return stats


# def track_feedback_view(feedback, user=None):
#     """Increment feedback view count"""
#     feedback.view_count += 1
#     feedback.save(update_fields=['view_count'])


# class FeedbackRateLimit:
#     """
#     Rate limiting for feedback submissions
#     Enhanced with additional role support while keeping your core logic
#     """
    
#     @classmethod
#     def check_citizen_limit(cls, user):
#         """
#         Check if citizen can submit (10 per day for citizens, 50 for officials)
#         Enhanced to support government officials while keeping your citizen logic
#         """
#         if not user or not user.is_authenticated:
#             return False, "Authentication required"
        
#         # Anonymous users handled separately
#         if user.role == 'anonymous':
#             return False, "Anonymous users cannot use this endpoint"
        
#         # Determine daily limit based on role
#         if user.role == 'citizen':
#             daily_limit = 10
#         elif user.role == 'government_official':
#             daily_limit = 50
#         else:
#             return False, "Invalid user role"
        
#         cache_key = f"feedback_limit_{user.role}_{user.id}"
#         submissions_today = cache.get(cache_key, 0)
        
#         if submissions_today >= daily_limit:
#             return False, f"Daily submission limit reached ({daily_limit} per day)"
        
#         return True, f"OK - {daily_limit - submissions_today} submissions remaining"
    
#     @classmethod
#     def record_citizen_submission(cls, user):
#         """
#         Record citizen/official submission for rate limiting
#         Enhanced to support all authenticated user types
#         """
#         if not user or user.role == 'anonymous':
#             return
        
#         cache_key = f"feedback_limit_{user.role}_{user.id}"
#         submissions_today = cache.get(cache_key, 0)
        
#         # Set expiry to end of day (keeping your logic)
#         now = timezone.now()
#         tomorrow = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
#         seconds_until_tomorrow = int((tomorrow - now).total_seconds())
        
#         cache.set(cache_key, submissions_today + 1, seconds_until_tomorrow)
    
#     @classmethod
#     def check_anonymous_limit(cls, session_id):
#         """Check anonymous session submission limit (keeping your implementation)"""
#         return AnonymousSessionManager.can_submit(session_id)
    
#     @classmethod
#     def record_anonymous_submission(cls, session_id):
#         """Record anonymous submission (keeping your implementation)"""
#         session_data = AnonymousSessionManager.get_session(session_id)
        
#         if session_data:
#             AnonymousSessionManager.update_session(
#                 session_id,
#                 submission_count=session_data['submission_count'] + 1,
#                 last_submission=timezone.now().isoformat()
#             )
    
#     @classmethod
#     def get_user_stats(cls, user):
#         """
#         Get user's rate limit statistics
#         New utility for analytics and user dashboards
#         """
#         if not user or not user.is_authenticated or user.role == 'anonymous':
#             return None
        
#         # Get daily limit based on role
#         if user.role == 'citizen':
#             daily_limit = 10
#         elif user.role == 'government_official':
#             daily_limit = 50
#         else:
#             return None
        
#         # Get current usage
#         cache_key = f"feedback_limit_{user.role}_{user.id}"
#         current_count = cache.get(cache_key, 0)
        
#         return {
#             'daily_limit': daily_limit,
#             'used_today': current_count,
#             'remaining_today': daily_limit - current_count,
#             'can_submit': current_count < daily_limit,
#             'role': user.role
#         }

# def generate_tracking_id():
#     """
#     Generate unique tracking ID (keeping your TRACK_ format)
#     Enhanced with date component for better organization
#     """
#     now = timezone.now()
#     date_component = now.strftime('%y%m%d')  # 6 characters: YYMMDD
#     raw_string = f"{now.timestamp()}-{uuid.uuid4()}"
#     hash_component = hashlib.sha256(raw_string.encode()).hexdigest()[:6].upper()  # 6 characters

#     return f"T{date_component}{hash_component}"  # Total: 1 + 6 + 6 = 13


# # =============================================================================
# # NEW UTILITY FUNCTIONS (Additions that align with your patterns)
# # =============================================================================

# def validate_feedback_title(title):
#     """
#     Validate feedback title meets quality standards
#     Simple validation that aligns with your validation approach
#     """
#     if not title or not title.strip():
#         raise ValidationError(_("Title cannot be empty"))
    
#     title = title.strip()
    
#     # Length validation
#     if len(title) < 10:
#         raise ValidationError(_("Title must be at least 10 characters long"))
    
#     if len(title) > 200:
#         raise ValidationError(_("Title cannot exceed 200 characters"))
    
#     # Basic quality check
#     if title.lower() in ['test', 'testing', 'hello', 'hi']:
#         raise ValidationError(_("Please provide a descriptive title"))
    
#     return title


# def validate_feedback_content(content):
#     """
#     Validate feedback content meets quality standards
#     Simple validation that aligns with your approach
#     """
#     if not content or not content.strip():
#         raise ValidationError(_("Content cannot be empty"))
    
#     content = content.strip()
    
#     # Length validation
#     if len(content) < 50:
#         raise ValidationError(_("Content must be at least 50 characters long"))
    
#     if len(content) > 5000:
#         raise ValidationError(_("Content cannot exceed 5000 characters"))
    
#     # Basic quality check
#     if content.lower() in ['test', 'testing', 'hello']:
#         raise ValidationError(_("Please provide detailed feedback content"))
    
#     # Minimum word count
#     words = len(content.split())
#     if words < 5:
#         raise ValidationError(_("Content must contain at least 5 words"))
    
#     return content


# def validate_location_hierarchy(county, sub_county=None, ward=None, village=None):
#     """
#     Validate that the location hierarchy is correct
#     Follows your invisible boundaries principle
#     """
#     if not county:
#         raise ValidationError(_("County is required"))
    
#     # If sub_county is provided, validate it belongs to county
#     if sub_county:
#         if sub_county.parent != county.location:
#             raise ValidationError(_("Sub-county does not belong to the selected county"))
    
#     # If ward is provided, validate it belongs to sub_county
#     if ward:
#         if not sub_county:
#             raise ValidationError(_("Ward requires a sub-county to be selected"))
#         if ward.parent != sub_county:
#             raise ValidationError(_("Ward does not belong to the selected sub-county"))
    
#     # If village is provided, validate it belongs to ward
#     if village:
#         if not ward:
#             raise ValidationError(_("Village requires a ward to be selected"))
#         if village.parent != ward:
#             raise ValidationError(_("Village does not belong to the selected ward"))
    
#     return True


# def sanitize_feedback_content(content):
#     """
#     Sanitize feedback content to remove potential security issues
#     Simple sanitization that aligns with your security approach
#     """
#     import html
    
#     # HTML escape
#     content = html.escape(content)
    
#     # Remove excessive whitespace
#     content = re.sub(r'\s+', ' ', content).strip()
    
#     # Remove potentially harmful patterns
#     content = re.sub(r'<[^>]+>', '', content)  # Remove any HTML tags
#     content = re.sub(r'javascript:', '', content, flags=re.IGNORECASE)
    
#     return content


# def is_duplicate_feedback(title, content, user, hours=24):
#     """
#     Check if feedback might be a duplicate based on content similarity
#     Lightweight duplicate detection
#     """
#     from .models import Feedback
    
#     # Simple hash-based duplicate detection
#     content_hash = hashlib.md5(f"{title.lower()} {content.lower()}".encode()).hexdigest()
    
#     # Check for similar submissions in the last N hours
#     since_time = timezone.now() - timedelta(hours=hours)
    
#     # Look for exact content matches from same user
#     similar_feedback = Feedback.objects.filter(
#         user=user,
#         created_at__gte=since_time,
#         is_deleted=False
#     )
    
#     for feedback in similar_feedback:
#         existing_hash = hashlib.md5(f"{feedback.title.lower()} {feedback.content.lower()}".encode()).hexdigest()
#         if content_hash == existing_hash:
#             return True, feedback
    
#     return False, None


# def format_tracking_id_for_display(tracking_id):
#     """
#     Format tracking ID for better readability
#     Keeps your TRACK_ format but makes it more readable
#     """
#     if not tracking_id or not tracking_id.startswith('TRACK_'):
#         return tracking_id
    
#     # TRACK_240815ABC123 -> TRACK-240815-ABC123
#     if len(tracking_id) >= 15:
#         base = tracking_id[6:]  # Remove 'TRACK_'
#         if len(base) >= 6:
#             date_part = base[:6]
#             rest = base[6:]
#             return f"TRACK-{date_part}-{rest}"
    
#     return tracking_id


# class FeedbackAnalytics:
#     """
#     Simple analytics functions for feedback insights
#     Lightweight analytics that align with your approach
#     """
    
#     @classmethod
#     def get_category_stats(cls, county=None, days=30):
#         """Get feedback statistics by category"""
#         from .models import Feedback
#         from django.db.models import Count
        
#         # Base queryset
#         queryset = Feedback.objects.filter(is_deleted=False)
        
#         # Filter by county if provided
#         if county:
#             queryset = queryset.filter(county=county)
        
#         # Filter by date range
#         since_date = timezone.now() - timedelta(days=days)
#         queryset = queryset.filter(created_at__gte=since_date)
        
#         # Get category counts
#         category_stats = queryset.values('category').annotate(
#             count=Count('id')
#         ).order_by('-count')
        
#         return list(category_stats)
    
#     @classmethod
#     def get_status_distribution(cls, county=None, days=30):
#         """Get feedback status distribution"""
#         from .models import Feedback
#         from django.db.models import Count
        
#         # Base queryset
#         queryset = Feedback.objects.filter(is_deleted=False)
        
#         # Filter by county if provided
#         if county:
#             queryset = queryset.filter(county=county)
        
#         # Filter by date range
#         since_date = timezone.now() - timedelta(days=days)
#         queryset = queryset.filter(created_at__gte=since_date)
        
#         # Get status distribution
#         status_stats = queryset.values('status').annotate(
#             count=Count('id')
#         ).order_by('-count')
        
#         return list(status_stats)