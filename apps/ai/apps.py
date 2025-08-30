# =============================================================================
# FILE: apps/ai/apps.py
# =============================================================================
from django.apps import AppConfig


class AIConfig(AppConfig):
    """
    🤖 CivicAI AI Features App Configuration
    
    Handles initialization of AI services with proper Django app loading.
    """
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.ai'
    verbose_name = 'CivicAI AI Features'
    
    def ready(self):
        """
        Initialize AI services after Django apps are loaded.
        This prevents AppRegistryNotReady errors.
        """
        try:
            # Import and register signal handlers
            from . import signals
            
            # Initialize AI services after all apps are loaded
            self._initialize_ai_services()
            
        except ImportError:
            # Signals module doesn't exist yet, skip
            pass
    
    def _initialize_ai_services(self):
        """Initialize AI services safely after Django startup"""
        try:
            import logging
            logger = logging.getLogger('apps.ai')
            
            # Re-enabled after fixing OpenAI client proxy parameter error
            from .services.llm_client import llm_client
            from django.conf import settings
            ai_enabled = getattr(settings, 'AI_PROCESSING_ASYNC', True)
            if ai_enabled:
                health = llm_client.get_usage_stats()
                if health.get('openai_available') or health.get('claude_available'):
                    logger.info("✅ AI services initialized successfully")
                else:
                    logger.warning("⚠️ No AI providers available - check API keys")
            else:
                logger.info("ℹ️ AI processing disabled in settings")

                
        except Exception as e:
            logger = logging.getLogger('apps.ai')
            logger.error(f"❌ Failed to initialize AI services: {e}")
            # Don't raise exception - allow Django to start without AI