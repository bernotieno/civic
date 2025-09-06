# =============================================================================
# STEP 4: Custom Exception Handler
# FILE: apps/api/exceptions.py
# =============================================================================
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
import logging

logger = logging.getLogger('civicAI.api')

def custom_exception_handler(exc, context):
    """Custom exception handler that maintains invisible boundaries"""
    response = exception_handler(exc, context)
    
    if response is not None:
        # Log the exception for debugging
        logger.error(f"API Exception: {exc} - Context: {context}")
        
        # For permission errors, return 404 instead of 403 (invisible boundaries)
        if response.status_code == 403:
            return Response(
                {'detail': 'Not found.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Standardize error format
        custom_response_data = {
            'error': True,
            'message': 'An error occurred',
            'details': response.data,
            'status_code': response.status_code
        }
        
        response.data = custom_response_data
    
    return response
