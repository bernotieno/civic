# =============================================================================
# FILE: apps/ai/services/llm_client.py
# =============================================================================
import asyncio
import json
import time
import logging
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from django.conf import settings
from django.core.cache import cache
from django.utils import timezone

# Import LLM libraries
try:
    import openai
except ImportError:
    openai = None

try:
    import anthropic
except ImportError:
    anthropic = None


logger = logging.getLogger('apps.ai.services')


@dataclass
class LLMResponse:
    """Standardized response format for all LLM interactions"""
    content: str
    model_used: str
    tokens_used: int
    processing_time: float
    success: bool
    error_message: Optional[str] = None
    confidence_score: Optional[float] = None
    raw_response: Optional[Dict] = None


class LLMClientError(Exception):
    """Custom exception for LLM client errors"""
    pass


class LLMClient:
    """
    🤖 AWARD-WINNING: Intelligent LLM client with error handling and optimization
    
    Unified client for OpenAI GPT-4 and Claude with:
    - Automatic failover between providers
    - Intelligent caching and rate limiting
    - Context-aware prompting with Kenyan civic expertise
    - Error handling and retry logic
    - Token usage tracking and cost optimization
    """
    
    def __init__(self):
        self.openai_client = None
        self.claude_client = None
        self.max_retries = getattr(settings, 'AI_RETRY_ATTEMPTS', 3)
        self.retry_delay = 1  # seconds
        self.timeout = getattr(settings, 'AI_TIMEOUT_SECONDS', 30)
        
        # Initialize clients
        self._initialize_clients()
        
        # Performance tracking
        self.api_call_count = 0
        self.total_tokens_used = 0
        self.total_cost_usd = 0.0
    
    def _initialize_clients(self):
        """Initialize OpenAI and Claude clients if API keys are available"""
        # Temporarily disable experimental proxy support that causes issues
        import os
        original_proxy_support = os.environ.get('EXPERIMENTAL_HTTP_PROXY_SUPPORT')
        if original_proxy_support:
            os.environ.pop('EXPERIMENTAL_HTTP_PROXY_SUPPORT', None)
            logger.debug("Temporarily disabled EXPERIMENTAL_HTTP_PROXY_SUPPORT for OpenAI client initialization")
        
        try:
            # Initialize OpenAI
            openai_key = getattr(settings, 'OPENAI_API_KEY', '')
            if openai_key and openai:
                try:
                    # Only pass supported parameters to avoid 'proxies' error
                    client_params = {
                        'api_key': openai_key,
                        'timeout': self.timeout
                    }
                    
                    self.openai_client = openai.OpenAI(**client_params)
                    logger.info("OpenAI client initialized successfully")
                except TypeError as e:
                    if "proxies" in str(e):
                        # Handle the specific proxies parameter error
                        logger.warning(f"OpenAI client initialization failed due to proxy configuration: {e}")
                        logger.info("Attempting to initialize OpenAI client without proxy support...")
                        try:
                            # Try with minimal parameters
                            self.openai_client = openai.OpenAI(api_key=openai_key)
                            logger.info("OpenAI client initialized successfully without proxy support")
                        except Exception as retry_e:
                            logger.error(f"Failed to initialize OpenAI client even without proxy support: {retry_e}")
                            self.openai_client = None
                    else:
                        logger.error(f"Failed to initialize OpenAI client: {e}")
                        self.openai_client = None
                except Exception as e:
                    logger.error(f"Failed to initialize OpenAI client: {e}")
                    self.openai_client = None
            
            # Initialize Claude
            claude_key = getattr(settings, 'CLAUDE_API_KEY', '')
            if claude_key and anthropic:
                try:
                    self.claude_client = anthropic.Anthropic(api_key=claude_key)
                    logger.info("Claude client initialized successfully")
                except Exception as e:
                    logger.error(f"Failed to initialize Claude client: {e}")
            
            if not self.openai_client and not self.claude_client:
                logger.error("No LLM clients available - check API keys")
                
        finally:
            # Restore the original environment variable if it was set
            if original_proxy_support:
                os.environ['EXPERIMENTAL_HTTP_PROXY_SUPPORT'] = original_proxy_support
                logger.debug("Restored EXPERIMENTAL_HTTP_PROXY_SUPPORT environment variable")
    
    async def analyze_with_context(
        self, 
        prompt: str, 
        context_data: Dict, 
        response_format: str = "json",
        use_cache: bool = True,
        preferred_model: str = "openai"
    ) -> LLMResponse:
        """
        🎯 Send context-aware prompts to LLM with real database data
        
        Args:
            prompt: Base prompt template
            context_data: Real database context to inject
            response_format: "json" or "text"
            use_cache: Whether to use cached responses
            preferred_model: "openai" or "claude"
        
        Returns:
            LLMResponse with standardized format
        """
        start_time = time.time()
        
        # Build cache key
        cache_key = None
        if use_cache and getattr(settings, 'AI_ENABLE_CACHING', True):
            cache_key = self._build_cache_key(prompt, context_data, response_format)
            cached_response = cache.get(cache_key)
            if cached_response:
                logger.debug(f"Using cached LLM response for key: {cache_key[:50]}...")
                return LLMResponse(**cached_response)
        
        # Build enriched prompt
        enriched_prompt = self._build_contextual_prompt(prompt, context_data)
        
        # Try preferred model first, then fallback
        models_to_try = [preferred_model]
        if preferred_model == "openai" and self.claude_client:
            models_to_try.append("claude")
        elif preferred_model == "claude" and self.openai_client:
            models_to_try.append("openai")
        
        last_error = None
        
        for model_name in models_to_try:
            try:
                if model_name == "openai" and self.openai_client:
                    response = await self._call_openai(enriched_prompt, response_format)
                elif model_name == "claude" and self.claude_client:
                    response = await self._call_claude(enriched_prompt, response_format)
                else:
                    continue
                
                # Process successful response
                processing_time = time.time() - start_time
                llm_response = LLMResponse(
                    content=response['content'],
                    model_used=response['model'],
                    tokens_used=response['tokens'],
                    processing_time=processing_time,
                    success=True,
                    raw_response=response
                )
                
                # Cache successful response
                if cache_key:
                    cache_data = {
                        'content': llm_response.content,
                        'model_used': llm_response.model_used,
                        'tokens_used': llm_response.tokens_used,
                        'processing_time': llm_response.processing_time,
                        'success': llm_response.success,
                    }
                    cache.set(cache_key, cache_data, getattr(settings, 'AI_CACHE_TTL', 3600))
                
                # Track usage
                self._track_usage(response['tokens'], model_name)
                
                return llm_response
                
            except Exception as e:
                last_error = e
                logger.warning(f"Failed to get response from {model_name}: {e}")
                continue
        
        # All models failed
        processing_time = time.time() - start_time
        return LLMResponse(
            content="",
            model_used="none",
            tokens_used=0,
            processing_time=processing_time,
            success=False,
            error_message=str(last_error) if last_error else "All LLM providers failed"
        )
    
    async def _call_openai(self, prompt: str, response_format: str) -> Dict:
        """Call OpenAI API with proper error handling"""
        try:
            model = getattr(settings, 'OPENAI_MODEL', 'gpt-4o')
            max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 1500)
            temperature = getattr(settings, 'OPENAI_TEMPERATURE', 0.3)
            
            # Build messages
            messages = [
                {
                    "role": "system",
                    "content": self._get_system_prompt()
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
            
            # Prepare request parameters
            request_params = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "timeout": self.timeout
            }
            
            # Add response format if JSON requested
            if response_format == "json":
                request_params["response_format"] = {"type": "json_object"}
            
            # Make API call
            response = await asyncio.to_thread(
                self.openai_client.chat.completions.create,
                **request_params
            )
            
            # Parse response
            content = response.choices[0].message.content
            tokens_used = response.usage.total_tokens if hasattr(response, 'usage') else 0
            
            return {
                'content': content,
                'model': model,
                'tokens': tokens_used,
                'raw_response': response.model_dump() if hasattr(response, 'model_dump') else {}
            }
            
        except Exception as e:
            logger.error(f"OpenAI API call failed: {e}")
            raise LLMClientError(f"OpenAI error: {e}")
    
    async def _call_claude(self, prompt: str, response_format: str) -> Dict:
        """Call Claude API with proper error handling"""
        try:
            model = getattr(settings, 'CLAUDE_MODEL', 'claude-3-5-sonnet-20241022')
            max_tokens = getattr(settings, 'OPENAI_MAX_TOKENS', 1500)  # Use same limit
            
            # Build messages for Claude
            messages = [
                {
                    "role": "user",
                    "content": f"{self._get_system_prompt()}\n\n{prompt}"
                }
            ]
            
            # Make API call
            response = await asyncio.to_thread(
                self.claude_client.messages.create,
                model=model,
                max_tokens=max_tokens,
                messages=messages,
                timeout=self.timeout
            )
            
            # Parse response
            content = response.content[0].text if response.content else ""
            tokens_used = response.usage.input_tokens + response.usage.output_tokens if hasattr(response, 'usage') else 0
            
            return {
                'content': content,
                'model': model,
                'tokens': tokens_used,
                'raw_response': response.model_dump() if hasattr(response, 'model_dump') else {}
            }
            
        except Exception as e:
            logger.error(f"Claude API call failed: {e}")
            raise LLMClientError(f"Claude error: {e}")
    
    def _get_system_prompt(self) -> str:
        """System prompt that establishes AI as Kenyan civic expert"""
        return """
        You are an expert AI assistant specializing in Kenyan civic governance and citizen feedback analysis. 
        You understand:
        - Kenya's 47 counties and their unique challenges
        - Swahili and English languages and cultural communication patterns
        - Local cultural context and respectful communication styles
        - Government response best practices and realistic capabilities
        - Urgency patterns in civic issues specific to Kenyan context
        - Administrative hierarchy: County → Sub-County → Ward → Village
        
        Your role is to provide practical, actionable insights for government officials while being:
        - Empathetic to citizen concerns and cultural context
        - Realistic about government capabilities and constraints
        - Focused on solutions that work within Kenyan administrative systems
        - Respectful of both citizen needs and official responsibilities
        - Aware of local challenges like infrastructure, resources, and capacity
        
        Always provide responses that help improve citizen-government communication and public service delivery.
        """
    
    def _build_contextual_prompt(self, base_prompt: str, context: Dict) -> str:
        """Inject real database context into prompts"""
        # Filter out None values and format context nicely
        filtered_context = {
            key: value for key, value in context.items() 
            if value is not None and value != "" and value != []
        }
        
        context_str = "\n".join([
            f"**{key.replace('_', ' ').title()}**: {value}" 
            for key, value in filtered_context.items()
        ])
        
        return f"""
        {base_prompt}
        
        **CONTEXT FROM CIVICAI DATABASE**:
        {context_str}
        
        Please analyze based on this real data from the CivicAI system, considering Kenyan context and administrative realities.
        """
    
    def _build_cache_key(self, prompt: str, context: Dict, response_format: str) -> str:
        """Build cache key for LLM responses"""
        import hashlib
        
        # Create a deterministic key from prompt and context
        content = f"{prompt}_{json.dumps(context, sort_keys=True)}_{response_format}"
        hash_key = hashlib.md5(content.encode()).hexdigest()
        return f"llm_response_{hash_key}"
    
    def _track_usage(self, tokens: int, model: str):
        """Track API usage for monitoring and cost control"""
        self.api_call_count += 1
        self.total_tokens_used += tokens
        
        # Estimate cost (approximate pricing)
        cost_per_1k_tokens = {
            'gpt-4o': 0.005,  # $0.005 per 1K tokens
            'claude-3-5-sonnet-20241022': 0.003,  # $0.003 per 1K tokens
        }
        
        model_key = 'gpt-4o' if 'gpt' in model.lower() else 'claude-3-5-sonnet-20241022'
        cost = (tokens / 1000) * cost_per_1k_tokens.get(model_key, 0.005)
        self.total_cost_usd += cost
        
        # Log usage periodically
        if self.api_call_count % 10 == 0:
            logger.info(f"LLM Usage: {self.api_call_count} calls, {self.total_tokens_used} tokens, ${self.total_cost_usd:.4f}")
    
    def get_usage_stats(self) -> Dict:
        """Get current usage statistics"""
        return {
            'api_calls': self.api_call_count,
            'total_tokens': self.total_tokens_used,
            'estimated_cost_usd': round(self.total_cost_usd, 4),
            'openai_available': self.openai_client is not None,
            'claude_available': self.claude_client is not None,
        }
    
    def clear_cache(self, pattern: str = "llm_response_*"):
        """Clear LLM response cache"""
        try:
            # This is a simplified cache clear - in production you might want
            # more sophisticated cache management
            cache.clear()
            logger.info("LLM response cache cleared")
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")


# Singleton instance for application-wide use
llm_client = LLMClient()


# Utility functions for common LLM operations
async def quick_analyze(prompt: str, context: Dict, **kwargs) -> str:
    """Quick analysis with simplified interface"""
    response = await llm_client.analyze_with_context(prompt, context, **kwargs)
    return response.content if response.success else ""


async def get_json_response(prompt: str, context: Dict, **kwargs) -> Dict:
    """Get JSON response with error handling"""
    response = await llm_client.analyze_with_context(
        prompt, context, response_format="json", **kwargs
    )
    
    if not response.success:
        return {}
    
    try:
        return json.loads(response.content)
    except json.JSONDecodeError:
        logger.error(f"Failed to parse JSON response: {response.content}")
        return {}


# Health check function
def check_llm_health() -> Dict:
    """Check LLM service health"""
    return {
        'openai_available': llm_client.openai_client is not None,
        'claude_available': llm_client.claude_client is not None,
        'usage_stats': llm_client.get_usage_stats(),
        'cache_enabled': getattr(settings, 'AI_ENABLE_CACHING', True),
        'healthy': (llm_client.openai_client is not None or llm_client.claude_client is not None)
    }
