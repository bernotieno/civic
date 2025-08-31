# =============================================================================
# COMPREHENSIVE ERROR HANDLING UTILITIES
# FILE: apps/api/error_handlers.py
# =============================================================================
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import IntegrityError
import logging

logger = logging.getLogger(__name__)

# =============================================================================
# ERROR RESPONSE BUILDER
# =============================================================================

def build_error_response(
    message, 
    error_code=None, 
    suggestions=None, 
    status_code=400, 
    technical_details=None
):
    """
    Build standardized error response for CivicAI
    
    Args:
        message (str): User-friendly error message
        error_code (str): Specific error code for frontend handling
        suggestions (list): List of suggestions to help user
        status_code (int): HTTP status code
        technical_details (str): Technical error details for logging
    
    Returns:
        Response: DRF Response object
    """
    response_data = {
        'success': False,
        'message': message
    }
    
    if error_code:
        response_data['error_code'] = error_code
    
    if suggestions:
        response_data['suggestions'] = suggestions
    
    if technical_details:
        logger.error(f"Error: {message} | Technical: {technical_details}")
    
    return Response(response_data, status=status_code)

def build_success_response(
    message, 
    data=None, 
    meta=None
):
    """
    Build standardized success response for CivicAI
    
    Args:
        message (str): Success message
        data (dict): Response data
        meta (dict): Metadata about the response
    
    Returns:
        Response: DRF Response object
    """
    response_data = {
        'success': True,
        'message': message
    }
    
    if data is not None:
        response_data['data'] = data
    
    if meta:
        response_data['meta'] = meta
    
    return Response(response_data, status=status.HTTP_200_OK)

# =============================================================================
# SPECIFIC ERROR HANDLERS
# =============================================================================

def handle_authentication_error(error_type='invalid_credentials', custom_message=None):
    """Handle authentication-related errors"""
    
    error_configs = {
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
        }
    }
    
    config = error_configs.get(error_type, error_configs['invalid_credentials'])
    
    return build_error_response(
        message=custom_message or config['message'],
        error_code=config['code'],
        suggestions=config['suggestions'],
        status_code=401
    )

def handle_validation_error(field_errors, general_message=None):
    """Handle validation errors with field-specific messages"""
    
    if general_message is None:
        general_message = 'Please correct the following errors and try again:'
    
    # Format field errors with emojis and helpful messages
    formatted_errors = {}
    
    for field, messages in field_errors.items():
        formatted_messages = []
        
        for msg in messages:
            if field == 'national_id':
                if 'invalid' in str(msg).lower():
                    formatted_messages.append('🇰🇪 Please enter a valid 8-digit Kenyan National ID')
                elif 'exists' in str(msg).lower():
                    formatted_messages.append('👤 An account with this National ID already exists')
                else:
                    formatted_messages.append(f'🇰🇪 {msg}')
            
            elif field == 'email':
                if 'invalid' in str(msg).lower():
                    formatted_messages.append('📧 Please enter a valid email address')
                elif 'exists' in str(msg).lower():
                    formatted_messages.append('📧 An account with this email already exists')
                else:
                    formatted_messages.append(f'📧 {msg}')
            
            elif field == 'password':
                if 'short' in str(msg).lower():
                    formatted_messages.append('🔒 Password must be at least 6 characters long')
                else:
                    formatted_messages.append(f'🔒 {msg}')
            
            elif field == 'county_id':
                formatted_messages.append(f'🏛️ {msg}')
            
            elif field in ['title', 'content']:
                formatted_messages.append(f'📝 {msg}')
            
            else:
                formatted_messages.append(f'❌ {msg}')
        
        formatted_errors[field] = formatted_messages
    
    return Response({
        'success': False,
        'message': general_message,
        'errors': formatted_errors,
        'error_code': 'VALIDATION_ERROR'
    }, status=400)

def handle_permission_error(resource_type='resource', custom_message=None):
    """Handle permission denied errors (returns 404 for invisible boundaries)"""
    
    message = custom_message or f'🔍 The requested {resource_type} was not found.'
    
    return build_error_response(
        message=message,
        error_code='NOT_FOUND',
        suggestions=[
            'Check the URL and try again',
            'Ensure you have the correct permissions',
            'Contact support if you believe this is an error'
        ],
        status_code=404  # Invisible boundaries - return 404 instead of 403
    )

def handle_not_found_error(resource_type='resource', resource_id=None, custom_message=None):
    """Handle resource not found errors"""
    
    if custom_message:
        message = custom_message
    elif resource_id:
        message = f'🔍 {resource_type.title()} with ID {resource_id} not found.'
    else:
        message = f'🔍 {resource_type.title()} not found.'
    
    suggestions = [
        f'Check if the {resource_type} ID is correct',
        f'The {resource_type} may have been deleted or moved',
        'Try refreshing the page and searching again'
    ]
    
    return build_error_response(
        message=message,
        error_code='NOT_FOUND',
        suggestions=suggestions,
        status_code=404
    )

def handle_rate_limit_error(limit_type='requests', retry_after=None, custom_message=None):
    """Handle rate limiting errors"""
    
    if custom_message:
        message = custom_message
    elif retry_after:
        minutes = retry_after // 60
        message = f'⏰ Too many {limit_type}. Please wait {minutes} minutes before trying again.'
    else:
        message = f'⏰ Too many {limit_type}. Please wait before trying again.'
    
    suggestions = [
        'Wait before making more requests',
        'Consider creating an account for higher limits',
        'Try making fewer requests per minute'
    ]
    
    response_data = {
        'success': False,
        'message': message,
        'error_code': 'RATE_LIMIT_EXCEEDED',
        'suggestions': suggestions
    }
    
    if retry_after:
        response_data['retry_after'] = retry_after
    
    return Response(response_data, status=429)

def handle_system_error(error_type='general', custom_message=None, technical_details=None):
    """Handle system/server errors"""
    
    error_configs = {
        'database': {
            'message': '💾 Database connection error. Please try again in a moment.',
            'code': 'DATABASE_ERROR'
        },
        'ai_service': {
            'message': '🤖 AI service is temporarily unavailable. Please try again in a few moments.',
            'code': 'AI_SERVICE_ERROR'
        },
        'file_upload': {
            'message': '📁 File upload failed. Please check the file and try again.',
            'code': 'FILE_UPLOAD_ERROR'
        },
        'processing': {
            'message': '⚙️ Processing failed. Please try again or contact support.',
            'code': 'PROCESSING_ERROR'
        },
        'general': {
            'message': '🔧 Internal server error. Our team has been notified and is working on a fix.',
            'code': 'SERVER_ERROR'
        }
    }
    
    config = error_configs.get(error_type, error_configs['general'])
    
    suggestions = [
        'This is a temporary system issue',
        'Please try again in a few minutes',
        'Contact support if the problem persists'
    ]
    
    return build_error_response(
        message=custom_message or config['message'],
        error_code=config['code'],
        suggestions=suggestions,
        status_code=500,
        technical_details=technical_details
    )

# =============================================================================
# DECORATOR FOR AUTOMATIC ERROR HANDLING
# =============================================================================

def handle_api_errors(view_func):
    """
    Decorator to automatically handle common API errors
    
    Usage:
        @handle_api_errors
        def my_view(request):
            # Your view logic here
            pass
    """
    def wrapper(*args, **kwargs):
        try:
            return view_func(*args, **kwargs)
        
        except IntegrityError as e:
            error_str = str(e).lower()
            if 'unique constraint' in error_str:
                if 'national_id' in error_str:
                    return handle_validation_error({
                        'national_id': ['An account with this National ID already exists']
                    })
                elif 'email' in error_str:
                    return handle_validation_error({
                        'email': ['An account with this email already exists']
                    })
            
            return handle_system_error('database', technical_details=str(e))
        
        except DjangoValidationError as e:
            return handle_validation_error({'non_field_errors': [str(e)]})
        
        except PermissionError:
            return handle_permission_error()
        
        except Exception as e:
            logger.error(f"Unexpected error in {view_func.__name__}: {str(e)}")
            return handle_system_error('general', technical_details=str(e))
    
    return wrapper

# =============================================================================
# CONTEXT MANAGERS FOR ERROR HANDLING
# =============================================================================

class APIErrorHandler:
    """Context manager for handling API errors in views"""
    
    def __init__(self, operation_name="operation"):
        self.operation_name = operation_name
    
    def __enter__(self):
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is None:
            return False  # No exception occurred
        
        logger.error(f"Error in {self.operation_name}: {exc_val}")
        
        # Handle specific exception types
        if exc_type == IntegrityError:
            # Handle database integrity errors
            return False  # Let the decorator handle it
        
        elif exc_type == DjangoValidationError:
            # Handle Django validation errors
            return False  # Let the decorator handle it
        
        # For other exceptions, let them bubble up
        return False

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def log_user_action(user, action, resource_type=None, resource_id=None, success=True, error_message=None):
    """Log user actions for debugging and audit purposes"""
    
    log_message = f"User {user.email if hasattr(user, 'email') else 'Anonymous'} "
    log_message += f"{'✅' if success else '❌'} {action}"
    
    if resource_type and resource_id:
        log_message += f" {resource_type} {resource_id}"
    
    if error_message:
        log_message += f" - Error: {error_message}"
    
    if success:
        logger.info(log_message)
    else:
        logger.warning(log_message)

def sanitize_error_message(message):
    """Sanitize error messages to remove sensitive information"""
    
    # Remove file paths
    import re
    message = re.sub(r'/[^\s]*', '[PATH]', message)
    
    # Remove IP addresses
    message = re.sub(r'\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b', '[IP]', message)
    
    # Remove email addresses (except in user-facing messages)
    message = re.sub(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', '[EMAIL]', message)
    
    return message

def get_client_info(request):
    """Extract client information for error logging"""
    
    client_info = {
        'ip': request.META.get('REMOTE_ADDR', 'Unknown'),
        'user_agent': request.META.get('HTTP_USER_AGENT', 'Unknown'),
        'method': request.method,
        'path': request.path,
        'user': str(request.user) if hasattr(request, 'user') and request.user.is_authenticated else 'Anonymous'
    }
    
    return client_info