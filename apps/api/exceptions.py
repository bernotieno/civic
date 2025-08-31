# =============================================================================
# COMPREHENSIVE ERROR HANDLING SYSTEM
# FILE: apps/api/exceptions.py
# =============================================================================
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
from django.contrib.auth import get_user_model
import logging
import traceback

logger = logging.getLogger('civicAI.api')
User = get_user_model()

# =============================================================================
# CUSTOM EXCEPTION CLASSES
# =============================================================================

class CivicAIException(Exception):
    """Base exception for CivicAI application"""
    default_message = "An error occurred"
    default_code = "GENERAL_ERROR"
    
    def __init__(self, message=None, code=None, details=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        self.details = details or {}
        super().__init__(self.message)

class AuthenticationError(CivicAIException):
    """Authentication related errors"""
    default_message = "Authentication failed"
    default_code = "AUTH_ERROR"

class RegistrationError(CivicAIException):
    """User registration errors"""
    default_message = "Registration failed"
    default_code = "REGISTRATION_ERROR"

class ValidationError(CivicAIException):
    """Data validation errors"""
    default_message = "Invalid data provided"
    default_code = "VALIDATION_ERROR"

class PermissionError(CivicAIException):
    """Permission and access errors"""
    default_message = "Access denied"
    default_code = "PERMISSION_ERROR"

class ResourceNotFoundError(CivicAIException):
    """Resource not found errors"""
    default_message = "Resource not found"
    default_code = "NOT_FOUND"

class BusinessLogicError(CivicAIException):
    """Business logic validation errors"""
    default_message = "Business rule violation"
    default_code = "BUSINESS_ERROR"

# =============================================================================
# ERROR MESSAGE MAPPINGS
# =============================================================================

ERROR_MESSAGES = {
    # Authentication Errors
    'invalid_credentials': {
        'message': '🔐 Invalid National ID or password. Please check your credentials and try again.',
        'code': 'INVALID_CREDENTIALS',
        'suggestions': [
            'Verify your 8-digit National ID is correct',
            'Check if Caps Lock is on',
            'Try resetting your password if you forgot it'
        ]
    },
    'account_disabled': {
        'message': '🚫 Your account has been deactivated. Please contact support for assistance.',
        'code': 'ACCOUNT_DISABLED',
        'suggestions': [
            'Contact customer support',
            'Check your email for account status notifications'
        ]
    },
    'token_expired': {
        'message': '⏰ Your session has expired. Please log in again.',
        'code': 'TOKEN_EXPIRED',
        'suggestions': ['Please log in again to continue']
    },
    'token_invalid': {
        'message': '🔐 Invalid authentication token. Please log in again.',
        'code': 'TOKEN_INVALID',
        'suggestions': ['Please log in again to get a new token']
    },
    
    # Registration Errors
    'national_id_exists': {
        'message': '👤 An account with this National ID already exists. Try logging in instead.',
        'code': 'NATIONAL_ID_EXISTS',
        'suggestions': [
            'Use the login form instead',
            'Try password reset if you forgot your password',
            'Contact support if you believe this is an error'
        ]
    },
    'email_exists': {
        'message': '📧 An account with this email already exists. Try logging in instead.',
        'code': 'EMAIL_EXISTS',
        'suggestions': [
            'Use the login form instead',
            'Try password reset if you forgot your password',
            'Use a different email address'
        ]
    },
    'invalid_national_id': {
        'message': '🆔 Invalid National ID format. Please enter your 8-digit Kenyan National ID.',
        'code': 'INVALID_NATIONAL_ID',
        'suggestions': [
            'National ID must be exactly 8 digits',
            'Do not include spaces or special characters',
            'Example: 12345678'
        ]
    },
    'weak_password': {
        'message': '🔒 Password is too weak. Please choose a stronger password.',
        'code': 'WEAK_PASSWORD',
        'suggestions': [
            'Use at least 8 characters',
            'Include uppercase and lowercase letters',
            'Add numbers and special characters'
        ]
    },
    
    # Location/County Errors
    'county_not_found': {
        'message': '📍 Selected county not found. Please choose a valid county.',
        'code': 'COUNTY_NOT_FOUND',
        'suggestions': [
            'Select from the provided county list',
            'Refresh the page and try again'
        ]
    },
    'location_hierarchy_invalid': {
        'message': '📍 Invalid location selection. Please ensure ward belongs to the selected sub-county.',
        'code': 'LOCATION_HIERARCHY_INVALID',
        'suggestions': [
            'Select locations in order: County → Sub-County → Ward → Village',
            'Refresh location dropdowns if they seem outdated'
        ]
    },
    
    # Feedback Errors
    'feedback_not_found': {
        'message': '📝 Feedback not found. Please check your tracking ID and try again.',
        'code': 'FEEDBACK_NOT_FOUND',
        'suggestions': [
            'Verify your tracking ID is correct',
            'Check if you copied the full tracking ID',
            'Tracking IDs are case-sensitive'
        ]
    },
    'feedback_edit_restricted': {
        'message': '✏️ This feedback cannot be edited because it has already been reviewed by government officials.',
        'code': 'FEEDBACK_EDIT_RESTRICTED',
        'suggestions': [
            'You can only edit feedback that is still pending',
            'Submit new feedback if you have additional information'
        ]
    },
    'feedback_delete_restricted': {
        'message': '🗑️ This feedback cannot be deleted because it has government responses.',
        'code': 'FEEDBACK_DELETE_RESTRICTED',
        'suggestions': [
            'Feedback with responses cannot be deleted for transparency',
            'Contact support if you have privacy concerns'
        ]
    },
    'daily_limit_exceeded': {
        'message': '⏰ You have reached your daily feedback submission limit. Please try again tomorrow.',
        'code': 'DAILY_LIMIT_EXCEEDED',
        'suggestions': [
            'Citizens can submit up to 10 feedback items per day',
            'Contact support for urgent issues that need immediate attention'
        ]
    },
    
    # Anonymous Session Errors
    'session_expired': {
        'message': '⏰ Your anonymous session has expired. Please create a new session.',
        'code': 'SESSION_EXPIRED',
        'suggestions': [
            'Anonymous sessions last for 2 hours',
            'Create a new session to continue submitting feedback'
        ]
    },
    'session_limit_exceeded': {
        'message': '📝 You have reached the maximum submissions (3) for this anonymous session.',
        'code': 'SESSION_LIMIT_EXCEEDED',
        'suggestions': [
            'Create a new anonymous session to submit more feedback',
            'Consider creating an account for unlimited submissions'
        ]
    },
    
    # Bill Processing Errors
    'bill_upload_failed': {
        'message': '📄 Bill upload failed. Please check the file format and try again.',
        'code': 'BILL_UPLOAD_FAILED',
        'suggestions': [
            'Only PDF files are supported',
            'File size must be under 10MB',
            'Ensure the PDF is not password protected'
        ]
    },
    'bill_processing_failed': {
        'message': '⚙️ Bill processing failed. The system encountered an error while analyzing the document.',
        'code': 'BILL_PROCESSING_FAILED',
        'suggestions': [
            'Try uploading the bill again',
            'Ensure the PDF contains readable text',
            'Contact support if the problem persists'
        ]
    },
    
    # Chat/AI Errors
    'chat_invalid_question': {
        'message': '💬 Please ask a meaningful question about the bill. Avoid nonsensical input.',
        'code': 'CHAT_INVALID_QUESTION',
        'suggestions': [
            'Ask specific questions about bill content',
            'Example: "What are the main provisions of this bill?"',
            'Avoid random characters or very short messages'
        ]
    },
    'ai_service_unavailable': {
        'message': '🤖 AI service is temporarily unavailable. Please try again in a few moments.',
        'code': 'AI_SERVICE_UNAVAILABLE',
        'suggestions': [
            'Wait a few minutes and try again',
            'Check your internet connection',
            'Contact support if the issue persists'
        ]
    },
    
    # System Errors
    'database_error': {
        'message': '💾 Database connection error. Please try again in a moment.',
        'code': 'DATABASE_ERROR',
        'suggestions': [
            'This is a temporary system issue',
            'Please try again in a few minutes',
            'Contact support if the problem continues'
        ]
    },
    'server_error': {
        'message': '🔧 Internal server error. Our team has been notified and is working on a fix.',
        'code': 'SERVER_ERROR',
        'suggestions': [
            'This is a temporary system issue',
            'Please try again later',
            'Contact support if urgent'
        ]
    }
}

# =============================================================================
# ERROR DETECTION FUNCTIONS
# =============================================================================

def detect_error_type(exc, context=None):
    """Detect specific error type and return appropriate message"""
    exc_str = str(exc).lower()
    
    # Authentication errors
    if 'invalid credentials' in exc_str or 'authentication failed' in exc_str:
        return ERROR_MESSAGES['invalid_credentials']
    if 'account is disabled' in exc_str or 'user account is disabled' in exc_str:
        return ERROR_MESSAGES['account_disabled']
    if 'token' in exc_str and ('expired' in exc_str or 'invalid' in exc_str):
        if 'expired' in exc_str:
            return ERROR_MESSAGES['token_expired']
        return ERROR_MESSAGES['token_invalid']
    
    # Registration errors
    if 'national id already exists' in exc_str or 'user with this national id' in exc_str:
        return ERROR_MESSAGES['national_id_exists']
    if 'email already exists' in exc_str or 'user with this email' in exc_str:
        return ERROR_MESSAGES['email_exists']
    if 'invalid national id' in exc_str:
        return ERROR_MESSAGES['invalid_national_id']
    if 'password' in exc_str and ('weak' in exc_str or 'too short' in exc_str):
        return ERROR_MESSAGES['weak_password']
    
    # Location errors
    if 'county' in exc_str and 'not found' in exc_str:
        return ERROR_MESSAGES['county_not_found']
    if 'ward' in exc_str and ('not found' in exc_str or 'does not belong' in exc_str):
        return ERROR_MESSAGES['location_hierarchy_invalid']
    
    # Feedback errors
    if 'feedback not found' in exc_str or 'tracking id' in exc_str:
        return ERROR_MESSAGES['feedback_not_found']
    if 'cannot be edited' in exc_str:
        return ERROR_MESSAGES['feedback_edit_restricted']
    if 'cannot be deleted' in exc_str:
        return ERROR_MESSAGES['feedback_delete_restricted']
    if 'daily limit' in exc_str or 'submission limit' in exc_str:
        return ERROR_MESSAGES['daily_limit_exceeded']
    
    # Session errors
    if 'session expired' in exc_str or 'invalid session' in exc_str:
        return ERROR_MESSAGES['session_expired']
    if 'maximum submissions' in exc_str:
        return ERROR_MESSAGES['session_limit_exceeded']
    
    # Database errors
    if isinstance(exc, IntegrityError):
        if 'unique constraint' in exc_str:
            if 'national_id' in exc_str:
                return ERROR_MESSAGES['national_id_exists']
            if 'email' in exc_str:
                return ERROR_MESSAGES['email_exists']
        return ERROR_MESSAGES['database_error']
    
    # Default server error
    return ERROR_MESSAGES['server_error']

def format_validation_errors(errors):
    """Format DRF validation errors with user-friendly messages"""
    formatted_errors = {}
    
    for field, messages in errors.items():
        if field == 'non_field_errors':
            # Handle general validation errors
            formatted_messages = []
            for msg in messages:
                msg_lower = str(msg).lower()
                if 'invalid credentials' in msg_lower:
                    error_info = ERROR_MESSAGES['invalid_credentials']
                    formatted_messages.append(error_info['message'])
                elif 'national id' in msg_lower and 'exists' in msg_lower:
                    error_info = ERROR_MESSAGES['national_id_exists']
                    formatted_messages.append(error_info['message'])
                elif 'location' in msg_lower or 'ward' in msg_lower:
                    error_info = ERROR_MESSAGES['location_hierarchy_invalid']
                    formatted_messages.append(error_info['message'])
                else:
                    formatted_messages.append(f"❌ {msg}")
            formatted_errors[field] = formatted_messages
        else:
            # Handle field-specific errors
            formatted_messages = []
            for msg in messages:
                msg_lower = str(msg).lower()
                if field == 'national_id':
                    if 'invalid' in msg_lower or 'format' in msg_lower:
                        error_info = ERROR_MESSAGES['invalid_national_id']
                        formatted_messages.append(error_info['message'])
                    elif 'exists' in msg_lower:
                        error_info = ERROR_MESSAGES['national_id_exists']
                        formatted_messages.append(error_info['message'])
                    else:
                        formatted_messages.append(f"🆔 {msg}")
                elif field == 'email':
                    if 'exists' in msg_lower:
                        error_info = ERROR_MESSAGES['email_exists']
                        formatted_messages.append(error_info['message'])
                    elif 'invalid' in msg_lower:
                        formatted_messages.append("📧 Please enter a valid email address")
                    else:
                        formatted_messages.append(f"📧 {msg}")
                elif field == 'password':
                    if 'short' in msg_lower or 'weak' in msg_lower:
                        error_info = ERROR_MESSAGES['weak_password']
                        formatted_messages.append(error_info['message'])
                    else:
                        formatted_messages.append(f"🔒 {msg}")
                elif field == 'county_id':
                    if 'not found' in msg_lower:
                        error_info = ERROR_MESSAGES['county_not_found']
                        formatted_messages.append(error_info['message'])
                    else:
                        formatted_messages.append(f"📍 {msg}")
                elif field in ['title', 'content']:
                    if 'required' in msg_lower:
                        formatted_messages.append(f"📝 {field.title()} is required")
                    elif 'short' in msg_lower or 'characters' in msg_lower:
                        min_chars = '10' if field == 'title' else '50'
                        formatted_messages.append(f"📝 {field.title()} must be at least {min_chars} characters long")
                    else:
                        formatted_messages.append(f"📝 {msg}")
                else:
                    # Generic field error with appropriate emoji
                    emoji = '❌'
                    if field in ['name', 'full_name']:
                        emoji = '👤'
                    elif field in ['phone', 'phone_number']:
                        emoji = '📞'
                    elif field in ['category']:
                        emoji = '🏷️'
                    elif field in ['priority']:
                        emoji = '⚡'
                    
                    formatted_messages.append(f"{emoji} {msg}")
            
            formatted_errors[field] = formatted_messages
    
    return formatted_errors

# =============================================================================
# MAIN EXCEPTION HANDLER
# =============================================================================

def custom_exception_handler(exc, context):
    """Enhanced exception handler with specific error messages"""
    # Get the standard DRF response
    response = exception_handler(exc, context)
    
    # Log the exception for debugging
    logger.error(f"API Exception: {exc} - Context: {context}")
    logger.error(f"Traceback: {traceback.format_exc()}")
    
    if response is not None:
        # For permission errors, return 404 instead of 403 (invisible boundaries)
        if response.status_code == 403:
            return Response({
                'success': False,
                'message': '🔍 The requested resource was not found.',
                'error_code': 'NOT_FOUND',
                'suggestions': [
                    'Check the URL and try again',
                    'Ensure you have the correct permissions'
                ]
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Handle different types of errors
        if response.status_code == 400:
            # Validation errors
            if hasattr(response, 'data') and isinstance(response.data, dict):
                formatted_errors = format_validation_errors(response.data)
                
                return Response({
                    'success': False,
                    'message': 'Please correct the following errors and try again:',
                    'errors': formatted_errors,
                    'error_code': 'VALIDATION_ERROR'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        elif response.status_code == 401:
            # Authentication errors
            error_info = ERROR_MESSAGES['token_invalid']
            return Response({
                'success': False,
                'message': error_info['message'],
                'error_code': error_info['code'],
                'suggestions': error_info['suggestions']
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        elif response.status_code == 404:
            # Not found errors
            error_info = ERROR_MESSAGES['feedback_not_found']
            return Response({
                'success': False,
                'message': error_info['message'],
                'error_code': error_info['code'],
                'suggestions': error_info['suggestions']
            }, status=status.HTTP_404_NOT_FOUND)
        
        elif response.status_code >= 500:
            # Server errors
            error_info = ERROR_MESSAGES['server_error']
            return Response({
                'success': False,
                'message': error_info['message'],
                'error_code': error_info['code'],
                'suggestions': error_info['suggestions']
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    # Handle exceptions that don't have a DRF response
    else:
        error_info = detect_error_type(exc, context)
        
        # Determine appropriate status code
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        if isinstance(exc, (AuthenticationError, PermissionError)):
            status_code = status.HTTP_401_UNAUTHORIZED
        elif isinstance(exc, ValidationError):
            status_code = status.HTTP_400_BAD_REQUEST
        elif isinstance(exc, ResourceNotFoundError):
            status_code = status.HTTP_404_NOT_FOUND
        
        return Response({
            'success': False,
            'message': error_info['message'],
            'error_code': error_info['code'],
            'suggestions': error_info.get('suggestions', [])
        }, status=status_code)
    
    return response
