# apps/api/utils/logging_utils.py
import re
import logging
from typing import Any

def sanitize_for_logging(value: Any) -> str:
    """
    Sanitize user input for safe logging to prevent log injection attacks.
    
    Args:
        value: Any value to be logged
        
    Returns:
        str: Sanitized string safe for logging
    """
    if value is None:
        return "None"
    
    # Convert to string
    str_value = str(value)
    
    # Remove or replace dangerous characters
    # Remove newlines, carriage returns, and other control characters
    sanitized = re.sub(r'[\r\n\t\x00-\x1f\x7f-\x9f]', ' ', str_value)
    
    # Limit length to prevent log flooding
    if len(sanitized) > 200:
        sanitized = sanitized[:200] + "..."
    
    # Remove potential script tags or other dangerous content
    sanitized = re.sub(r'<[^>]*>', '', sanitized)
    
    return sanitized

def safe_log_info(logger: logging.Logger, message: str, *args, **kwargs):
    """
    Safely log info message with sanitized arguments.
    """
    sanitized_args = [sanitize_for_logging(arg) for arg in args]
    sanitized_kwargs = {k: sanitize_for_logging(v) for k, v in kwargs.items()}
    logger.info(message, *sanitized_args, **sanitized_kwargs)

def safe_log_error(logger: logging.Logger, message: str, *args, **kwargs):
    """
    Safely log error message with sanitized arguments.
    """
    sanitized_args = [sanitize_for_logging(arg) for arg in args]
    sanitized_kwargs = {k: sanitize_for_logging(v) for k, v in kwargs.items()}
    logger.error(message, *sanitized_args, **sanitized_kwargs)

def safe_log_warning(logger: logging.Logger, message: str, *args, **kwargs):
    """
    Safely log warning message with sanitized arguments.
    """
    sanitized_args = [sanitize_for_logging(arg) for arg in args]
    sanitized_kwargs = {k: sanitize_for_logging(v) for k, v in kwargs.items()}
    logger.warning(message, *sanitized_args, **sanitized_kwargs)