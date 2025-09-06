# =============================================================================
# FILE: apps/feedback/validators.py
# =============================================================================
import re
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _


def validate_feedback_title(title):
    """
    Validate feedback title meets quality standards
    """
    if not title or not title.strip():
        raise ValidationError(_("Title cannot be empty"))
    
    title = title.strip()
    
    # Length validation
    if len(title) < 10:
        raise ValidationError(_("Title must be at least 10 characters long"))
    
    if len(title) > 200:
        raise ValidationError(_("Title cannot exceed 200 characters"))
    
    # Content quality validation
    if title.lower() in ['test', 'testing', 'hello', 'hi']:
        raise ValidationError(_("Please provide a descriptive title"))
    
    # Check for excessive special characters
    special_chars = len(re.findall(r'[!@#$%^&*()_+=\[\]{}|;:,.<>?]', title))
    if special_chars > len(title) * 0.3:  # More than 30% special characters
        raise ValidationError(_("Title contains too many special characters"))
    
    return title


def validate_feedback_content(content):
    """
    Validate feedback content meets quality standards
    """
    if not content or not content.strip():
        raise ValidationError(_("Content cannot be empty"))

    content = content.strip()

    # Length validation - removed minimum character requirement
    if len(content) > 5000:
        raise ValidationError(_("Content cannot exceed 5000 characters"))

    # Content quality validation
    if content.lower() in ['test', 'testing', 'hello', 'hi', 'this is a test']:
        raise ValidationError(_("Please provide detailed feedback content"))

    # Check for repetitive characters (e.g., "aaaaaaaaaa")
    if re.search(r'(.)\1{9,}', content):
        raise ValidationError(_("Content contains excessive repetitive characters"))

    # Check for minimum word count - reduced to 1 word minimum
    words = len(content.split())
    if words < 1:
        raise ValidationError(_("Content must contain at least 1 word"))

    return content


def validate_location_hierarchy(county, sub_county=None, ward=None, village=None):
    """
    Validate that the location hierarchy is correct
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


def validate_feedback_priority(priority):
    """
    Validate feedback priority level
    """
    valid_priorities = ['low', 'medium', 'high', 'urgent']
    
    if priority not in valid_priorities:
        raise ValidationError(_(f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"))
    
    return priority


def validate_tracking_id_format(tracking_id):
    """
    Validate tracking ID format: FBYYMMDDXXXNNN
    Example: FB240815KSM001
    """
    if not tracking_id:
        raise ValidationError(_("Tracking ID is required"))
    
    # Basic format validation
    pattern = r'^FB\d{6}[A-Z]{3}\d{3}$'
    if not re.match(pattern, tracking_id.upper()):
        raise ValidationError(_("Invalid tracking ID format"))
    
    return tracking_id.upper()
