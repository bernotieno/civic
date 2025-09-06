# =============================================================================
# FILE: apps/ai/__init__.py
# =============================================================================
"""
🤖 CivicAI - AI Features Module

This module provides comprehensive AI-powered features for the CivicAI platform:

## Core AI Services:
- **Sentiment Analysis**: Intelligent emotion and sentiment detection from citizen feedback
- **Urgency Scoring**: AI-powered prioritization of citizen issues
- **Response Generation**: Context-aware government response suggestions
- **Trend Analysis**: Predictive analytics for emerging civic issues

## Key Features:
- **Real-time Processing**: Automatic AI analysis of all feedback submissions
- **Cultural Context**: Kenya-specific AI training and understanding
- **Multi-language Support**: English and Swahili language processing
- **Scalable Architecture**: Celery-based async processing for high volume

## Integration Points:
- Automatic processing triggered by feedback submission signals
- REST API endpoints for dashboard integration
- Background tasks for batch processing and analytics
- Cache-optimized for real-time dashboard performance

## Dependencies:
- OpenAI GPT-4 or Claude API for LLM processing
- Celery for distributed task processing
- Redis for caching and task queuing
- Django ORM for data persistence

Version: 1.0.0
Author: CivicAI Development Team
"""

# Version information
__version__ = '1.0.0'
__author__ = 'CivicAI Development Team'

# Module metadata
default_app_config = 'apps.ai.apps.AIConfig'

# AI Feature flags for easy checking
AI_FEATURES = {
    'SENTIMENT_ANALYSIS': 'apps.ai.services.sentiment_analyzer',
    'URGENCY_SCORING': 'apps.ai.services.urgency_scorer',
    'RESPONSE_GENERATION': 'apps.ai.services.response_generator',
    'TREND_ANALYSIS': 'apps.ai.services.trend_analyzer',
}

# Lazy import functions to avoid AppRegistryNotReady errors
def get_llm_client():
    """Lazy import for LLM client"""
    from .services.llm_client import llm_client
    return llm_client

def get_sentiment_analyzer():
    """Lazy import for sentiment analyzer"""
    from .services.sentiment_analyzer import sentiment_analyzer
    return sentiment_analyzer

def get_urgency_scorer():
    """Lazy import for urgency scorer"""
    from .services.urgency_scorer import urgency_scorer
    return urgency_scorer

def get_response_generator():
    """Lazy import for response generator"""
    from .services.response_generator import response_generator
    return response_generator

def get_trend_analyzer():
    """Lazy import for trend analyzer"""
    from .services.trend_analyzer import trend_analyzer
    return trend_analyzer

# Quick access to main AI services (lazy loaded)
def get_ai_services():
    """Get all AI services with lazy loading"""
    return {
        'llm_client': get_llm_client(),
        'sentiment_analyzer': get_sentiment_analyzer(),
        'urgency_scorer': get_urgency_scorer(),
        'response_generator': get_response_generator(),
        'trend_analyzer': get_trend_analyzer(),
    }

# Export lazy loader functions
__all__ = [
    'get_llm_client',
    'get_sentiment_analyzer', 
    'get_urgency_scorer',
    'get_response_generator',
    'get_trend_analyzer',
    'get_ai_services',
    'AI_FEATURES',
]