# apps/users/utils.py (UPDATED with validation functions)
from django.core.exceptions import ValidationError
import re
import phonenumbers
from phonenumbers import NumberParseException

class KenyanIDValidator:
    """Validate Kenyan national ID (8 digits, not all zeros)."""
    def __call__(self, value):
        if not value or not str(value).isdigit() or len(str(value)) != 8 or value == "00000000":
            raise ValidationError("Invalid Kenyan National ID: Must be an 8-digit number, not all zeros.")
        return True

def validate_kenyan_national_id(national_id):
    """Validate Kenyan national ID format."""
    if not national_id:
        return False
    
    # Convert to string and remove any spaces
    national_id_str = str(national_id).replace(' ', '')
    
    # Basic format validation (8 digits, not all zeros)
    if not re.match(r'^\d{8}$', national_id_str) or national_id_str == "00000000":
        return False
    
    return True

def validate_kenyan_phone(phone):
    """Validate and standardize Kenyan phone number using phonenumbers."""
    try:
        parsed = phonenumbers.parse(phone, "KE")
        if not phonenumbers.is_valid_number_for_region(parsed, "KE"):
            raise ValidationError("Invalid Kenyan phone number.")
        return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)
    except NumberParseException:
        raise ValidationError("Invalid phone number format.")

def validate_kenyan_phone_regex(phone):
    """Validate Kenyan phone number format using regex (alternative method)."""
    if not phone:
        return False
    
    # Remove any spaces or special characters
    phone_clean = re.sub(r'[^\d+]', '', phone)
    
    # Check various Kenyan formats
    kenyan_patterns = [
        r'^254[17]\d{8}$',  # +254 format
        r'^07\d{8}$',       # 07 format
        r'^01\d{8}$',       # 01 format  
    ]
    
    return any(re.match(pattern, phone_clean) for pattern in kenyan_patterns)

def format_national_id_for_display(national_id_hash):
    """Format national ID hash for safe display."""
    if not national_id_hash:
        return 'N/A'
    
    if national_id_hash.startswith('ANON_'):
        return 'Anonymous User'
    
    # Show only first 8 characters for privacy
    return f"{national_id_hash[:8]}..."