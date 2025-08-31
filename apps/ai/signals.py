# =============================================================================
# FILE: apps/ai/signals.py
# =============================================================================
import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings

logger = logging.getLogger('apps.ai.signals')


@receiver(post_save, sender='feedback.Feedback')
def process_feedback_ai(sender, instance, created, **kwargs):
    """
    🚀 Trigger AI processing when new feedback is created
    
    This signal handler processes feedback with AI services:
    - Sentiment analysis
    - Urgency scoring
    - Response generation (if enabled)
    """
    if not created:
        return  # Only process new feedback
    
    try:
        # Check if AI processing is enabled
        ai_enabled = getattr(settings, 'AI_PROCESSING_ASYNC', True)
        if not ai_enabled:
            logger.debug(f"AI processing disabled - skipping feedback {instance.id}")
            return
        
        # Import here to avoid circular imports
        from .tasks import process_feedback_ai_complete
        
        # Queue AI processing task
        process_feedback_ai_complete.delay(instance.id)
        
        logger.info(f"✅ Queued AI processing for feedback {instance.id}")
        
    except ImportError:
        # Tasks not available (probably because Celery is not set up)
        logger.warning("⚠️ Celery tasks not available - processing feedback synchronously")
        
        try:
            # Process synchronously as fallback
            from . import get_sentiment_analyzer
            
            # Basic sentiment analysis
            import asyncio
            sentiment_analyzer = get_sentiment_analyzer()
            
            # Run async sentiment analysis
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    sentiment_analyzer.analyze_feedback_sentiment(instance)
                )
                logger.info(f"✅ Processed feedback {instance.id} synchronously")
            finally:
                loop.close()
                
        except Exception as sync_error:
            logger.error(f"❌ Failed to process feedback {instance.id}: {sync_error}")
    
    except Exception as e:
        logger.error(f"❌ Error queuing AI processing for feedback {instance.id}: {e}")


@receiver(post_save, sender='feedback.FeedbackResponse')
def analyze_response_quality(sender, instance, created, **kwargs):
    """
    📊 Analyze government response quality with AI
    
    This analyzes official responses for:
    - Response quality scoring
    - Sentiment alignment with citizen concerns
    - Suggested improvements
    """
    if not created:
        return
    
    try:
        # Check if response analysis is enabled
        response_analysis_enabled = getattr(settings, 'AI_RESPONSE_GENERATION_ENABLED', True)
        if not response_analysis_enabled:
            return
        
        from .tasks import analyze_response_quality_task
        
        # Queue response analysis
        analyze_response_quality_task.delay(instance.id)
        
        logger.info(f"✅ Queued response analysis for feedback {instance.feedback.id}")
        
    except ImportError:
        logger.warning("⚠️ Response analysis tasks not available")
    except Exception as e:
        logger.error(f"❌ Error queuing response analysis: {e}")


# Additional signal handlers for AI features
def connect_ai_signals():
    """
    🔗 Connect all AI-related Django signals
    
    Called from apps.py ready() method to ensure signals are connected
    after all apps are loaded.
    """
    logger.info("🔗 AI signals connected successfully")
