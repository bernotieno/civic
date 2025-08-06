# =============================================================================
# STEP 3.1: ANONYMOUS SESSION MANAGEMENT
# FILE: apps/core/anonymous.py
# =============================================================================
import hashlib
import time
import uuid
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache

class AnonymousSessionManager:
    """
    CRITICAL: Manages anonymous user sessions for feedback submission.
    Provides true anonymity while preventing abuse.
    
    DO NOT store any personally identifiable information.
    """
    
    SESSION_PREFIX = "anon_session"
    SESSION_DURATION = 2 * 60 * 60  # 2 hours in seconds
    
    @classmethod
    def create_session(cls, county_id, request_meta=None):
        """
        Create anonymous session for feedback submission.
        Returns session_id that can be used to track submissions.
        """
        # Generate unique session ID
        timestamp = str(time.time())
        random_data = str(uuid.uuid4())
        raw_string = f"{timestamp}-{random_data}-{county_id}"
        session_id = f"ANON_{hashlib.sha256(raw_string.encode()).hexdigest()[:12]}"
        
        # Create session data (NO personal information)
        session_data = {
            'session_id': session_id,
            'county_id': county_id,
            'created_at': timezone.now().isoformat(),
            'expires_at': (timezone.now() + timedelta(seconds=cls.SESSION_DURATION)).isoformat(),
            'submission_count': 0,
            'last_submission': None,
            'browser_fingerprint': cls._generate_browser_fingerprint(request_meta),
        }
        
        # Store in cache (Redis) - automatically expires
        cache_key = f"{cls.SESSION_PREFIX}:{session_id}"
        cache.set(cache_key, session_data, cls.SESSION_DURATION)
        
        return session_id
    
    @classmethod
    def get_session(cls, session_id):
        """Retrieve anonymous session data"""
        cache_key = f"{cls.SESSION_PREFIX}:{session_id}"
        return cache.get(cache_key)
    
    @classmethod
    def update_session(cls, session_id, **updates):
        """Update session data (e.g., increment submission count)"""
        session_data = cls.get_session(session_id)
        if session_data:
            session_data.update(updates)
            cache_key = f"{cls.SESSION_PREFIX}:{session_id}"
            # Reset expiry time
            cache.set(cache_key, session_data, cls.SESSION_DURATION)
            return True
        return False
    
    @classmethod
    def can_submit(cls, session_id):
        """Check if session can submit more feedback (rate limiting)"""
        session_data = cls.get_session(session_id)
        if not session_data:
            return False, "Session expired"
        
        # Check submission limits
        if session_data['submission_count'] >= 3:
            return False, "Maximum submissions reached for this session"
        
        # Check cooldown (5 minutes between submissions)
        last_submission = session_data.get('last_submission')
        if last_submission:
            last_time = timezone.datetime.fromisoformat(last_submission)
            if timezone.now() - last_time < timedelta(minutes=5):
                return False, "Please wait before submitting again"
        
        return True, "OK"
    
    @classmethod
    def _generate_browser_fingerprint(cls, request_meta):
        """
        Generate browser fingerprint for abuse prevention.
        NO personal data - just technical browser info.
        """
        if not request_meta:
            return None
        
        fingerprint_data = [
            request_meta.get('HTTP_USER_AGENT', ''),
            request_meta.get('HTTP_ACCEPT_LANGUAGE', ''),
            request_meta.get('HTTP_ACCEPT_ENCODING', ''),
        ]
        
        combined = '|'.join(fingerprint_data)
        return hashlib.md5(combined.encode()).hexdigest()[:8]
