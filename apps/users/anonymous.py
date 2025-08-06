
# =============================================================================
# STEP 3.2: ANONYMOUS USER CREATION
# FILE: apps/users/anonymous.py
# =============================================================================
import hashlib
from django.utils import timezone
from django.db import transaction
from .models import CustomUser, County, Location
from apps.core.anonymous import AnonymousSessionManager

class AnonymousUserHandler:
    """
    CRITICAL: Handles creation of anonymous users for feedback submission.
    Anonymous users are real CustomUser records but with no personal data.
    
    DO NOT store any identifiable information for anonymous users.
    """
    
    @classmethod
    def create_anonymous_user(cls, session_id, county_id, location_data=None):
        """
        Create anonymous user record for feedback submission.
        
        Args:
            session_id: Anonymous session ID
            county_id: County where feedback originates
            location_data: Optional dict with sub_county, ward, village IDs
        
        Returns:
            CustomUser instance or None if creation fails
        """
        try:
            with transaction.atomic():
                # Generate anonymous user ID
                timestamp = str(int(timezone.now().timestamp()))
                anon_id = f"ANON_{hashlib.sha256(f'{session_id}-{timestamp}'.encode()).hexdigest()[:12]}"
                
                # Get county and location objects
                county = County.objects.get(id=county_id)
                county_location = county.location
                
                # Get optional location hierarchy
                sub_county = None
                ward = None
                village = None
                
                if location_data:
                    if location_data.get('sub_county_id'):
                        sub_county = Location.objects.get(
                            id=location_data['sub_county_id'],
                            type='sub_county',
                            parent=county_location
                        )
                    if location_data.get('ward_id') and sub_county:
                        ward = Location.objects.get(
                            id=location_data['ward_id'],
                            type='ward',
                            parent=sub_county
                        )
                    if location_data.get('village_id') and ward:
                        village = Location.objects.get(
                            id=location_data['village_id'],
                            type='village',
                            parent=ward
                        )
                
                # Create anonymous user
                anonymous_user = CustomUser.objects.create(
                    national_id_hash=anon_id,  # Use anon_id as national_id_hash
                    username=anon_id,  # Required by Django
                    name=None,  # Always None for anonymous
                    email=None,  # Always None for anonymous
                    role='anonymous',
                    tenant=county,
                    county=county_location,
                    sub_county=sub_county,
                    ward=ward,
                    village=village,
                    is_active=False,  # Anonymous users aren't "active" users
                    role_assigned_at=timezone.now()
                )
                
                return anonymous_user
                
        except Exception as e:
            # Log error but don't expose details to client
            import logging
            logger = logging.getLogger('civicAI.anonymous')
            logger.error(f"Failed to create anonymous user: {e}")
            return None
    
    @classmethod
    def create_tracking_id(cls, feedback_id, user_id):
        """
        Generate tracking ID for anonymous feedback.
        Allows user to check status without revealing user ID.
        """
        raw_string = f"{feedback_id}-{user_id}-{timezone.now().date()}"
        tracking_hash = hashlib.sha256(raw_string.encode()).hexdigest()[:8]
        return f"TRACK_{tracking_hash}"
    
    @classmethod
    def get_feedback_by_tracking_id(cls, tracking_id):
        """
        Retrieve feedback using tracking ID.
        Returns basic status info without exposing sensitive data.
        """
        # This will be implemented when Feedback model is created
        # For now, return structure for future implementation
        return {
            'status': 'pending',  # pending, in_review, responded, closed
            'submitted_at': None,
            'category': None,
            'county': None,
            'has_response': False,
            'response_at': None
        }
