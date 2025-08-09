# =============================================================================
# FILE: apps/ai/services/sentiment_analyzer.py
# =============================================================================
import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Avg
from django.apps import apps

from .llm_client import llm_client, get_json_response
from .prompt_templates import SentimentPrompts

logger = logging.getLogger('apps.ai.services')


def get_feedback_model():
    """Lazy import for Feedback model to avoid AppRegistryNotReady"""
    return apps.get_model('feedback', 'Feedback')


class LLMSentimentAnalyzer:
    """
    🎭 AWARD-WINNING: Context-aware sentiment analysis using real county data
    
    Analyzes citizen feedback sentiment with deep understanding of:
    - Kenyan cultural communication patterns
    - County-specific context and history
    - Seasonal and situational factors
    - Community vs individual concerns
    - Indirect expression patterns common in Kenyan civic discourse
    """
    
    def __init__(self):
        self.llm_client = llm_client
        self.prompts = SentimentPrompts()
        self.cache_ttl = 3600  # 1 hour cache for sentiment analysis
    
    async def analyze_feedback_sentiment(self, feedback) -> Dict:
        """
        🎯 Analyze sentiment with full context of county, category, and history
        
        Args:
            feedback: Feedback model instance
            
        Returns:
            Dictionary with comprehensive sentiment analysis results
        """
        try:
            # Check cache first
            cache_key = f"sentiment_analysis_{feedback.id}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Using cached sentiment analysis for feedback {feedback.id}")
                return cached_result
            
            # Gather comprehensive context
            context_data = await self._gather_sentiment_context(feedback)
            
            # Get AI sentiment analysis
            prompt = self.prompts.get_sentiment_analysis_prompt()
            llm_response = await get_json_response(prompt, context_data)
            
            if not llm_response:
                # Fallback to basic analysis
                return await self._fallback_sentiment_analysis(feedback)
            
            # Process and validate AI response
            processed_result = await self._process_sentiment_response(llm_response, feedback)
            
            # Cache the result
            cache.set(cache_key, processed_result, self.cache_ttl)
            
            logger.info(f"Sentiment analysis completed for feedback {feedback.tracking_id}: {processed_result['sentiment_label']} ({processed_result['sentiment_score']:.2f})")
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Sentiment analysis failed for feedback {feedback.id}: {e}")
            return await self._fallback_sentiment_analysis(feedback)
    
    async def _gather_sentiment_context(self, feedback) -> Dict:
        """📊 Gather real database context for intelligent sentiment analysis"""
        try:
            Feedback = get_feedback_model()
            
            # Get recent feedback from same area for comparison
            recent_similar = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=feedback.county,
                    category=feedback.category,
                    created_at__gte=timezone.now() - timedelta(days=30)
                ).count()
            )
            
            # Get county response performance stats
            county_stats = await self._get_county_response_stats(feedback.county)
            
            # Get similar resolved feedback for context
            similar_resolved = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=feedback.county,
                    category=feedback.category,
                    status__in=['resolved', 'closed'],
                    created_at__gte=timezone.now() - timedelta(days=90)
                ).count()
            )
            
            # Get seasonal context
            seasonal_context = self._get_seasonal_context(feedback.created_at)
            
            # Check for urgent keywords in content
            urgent_keywords = self._detect_urgent_keywords(feedback.content)
            
            return {
                'feedback_content': feedback.content,
                'feedback_title': feedback.title,
                'category': feedback.get_category_display(),
                'county_name': feedback.county.name,
                'location_details': self._format_location_path(feedback),
                'similar_recent_feedback_count': recent_similar,
                'similar_resolved_feedback_count': similar_resolved,
                'county_avg_response_time_hours': county_stats.get('avg_response_time_hours', 48),
                'county_resolution_rate': county_stats.get('resolution_rate', 0.65),
                'submission_time': feedback.created_at.strftime('%Y-%m-%d %H:%M'),
                'user_type': 'anonymous' if feedback.is_anonymous else 'registered_citizen',
                'seasonal_context': seasonal_context,
                'urgent_keywords_detected': urgent_keywords,
                'priority_level': feedback.get_priority_display(),
                'day_of_week': feedback.created_at.strftime('%A'),
                'time_of_day': self._get_time_of_day_context(feedback.created_at.hour),
            }
            
        except Exception as e:
            logger.error(f"Failed to gather sentiment context: {e}")
            # Return minimal context
            return {
                'feedback_content': feedback.content,
                'feedback_title': feedback.title,
                'category': feedback.get_category_display(),
                'county_name': feedback.county.name,
            }
    
    async def _get_county_response_stats(self, county) -> Dict:
        """Get county response performance statistics"""
        try:
            Feedback = get_feedback_model()
            
            # Get average response time for county
            recent_feedback = await asyncio.to_thread(
                lambda: list(Feedback.objects.filter(
                    county=county,
                    response_count__gt=0,
                    last_response_at__isnull=False,
                    created_at__gte=timezone.now() - timedelta(days=90)
                ).values('created_at', 'last_response_at', 'status'))
            )
            
            if not recent_feedback:
                return {'avg_response_time_hours': 48, 'resolution_rate': 0.65}
            
            # Calculate average response time
            response_times = []
            resolved_count = 0
            
            for item in recent_feedback:
                if item['last_response_at'] and item['created_at']:
                    delta = item['last_response_at'] - item['created_at']
                    response_times.append(delta.total_seconds() / 3600)  # Convert to hours
                
                if item['status'] in ['resolved', 'closed']:
                    resolved_count += 1
            
            avg_response_time = sum(response_times) / len(response_times) if response_times else 48
            resolution_rate = resolved_count / len(recent_feedback) if recent_feedback else 0.65
            
            return {
                'avg_response_time_hours': round(avg_response_time, 1),
                'resolution_rate': round(resolution_rate, 2),
                'sample_size': len(recent_feedback)
            }
            
        except Exception as e:
            logger.error(f"Failed to get county response stats: {e}")
            return {'avg_response_time_hours': 48, 'resolution_rate': 0.65}
    
    def _get_seasonal_context(self, timestamp) -> str:
        """Determine seasonal context for sentiment analysis"""
        month = timestamp.month
        
        if month in [3, 4, 5, 10, 11, 12]:  # Rainy seasons
            return "rainy_season"
        elif month in [6, 7, 8, 1, 2]:  # Dry seasons
            return "dry_season"
        else:  # Transition periods
            return "transition_period"
    
    def _detect_urgent_keywords(self, content: str) -> List[str]:
        """Detect urgent keywords in feedback content"""
        urgent_patterns = [
            'urgent', 'immediately', 'emergency', 'crisis', 'critical',
            'lives at risk', 'people are dying', 'children suffering',
            'no water', 'no access', 'completely blocked', 'collapsed',
            'outbreak', 'contaminated', 'dangerous', 'unsafe',
            'please help', 'desperate', 'can\'t wait', 'before it\'s too late'
        ]
        
        content_lower = content.lower()
        detected = [keyword for keyword in urgent_patterns if keyword in content_lower]
        return detected
    
    def _format_location_path(self, feedback) -> str:
        """Format location path for context"""
        parts = [feedback.county.name]
        if feedback.sub_county:
            parts.append(feedback.sub_county.name)
        if feedback.ward:
            parts.append(feedback.ward.name)
        if feedback.village:
            parts.append(feedback.village.name)
        return ' > '.join(parts)
    
    def _get_time_of_day_context(self, hour: int) -> str:
        """Get time of day context"""
        if 6 <= hour < 12:
            return "morning"
        elif 12 <= hour < 17:
            return "afternoon"
        elif 17 <= hour < 21:
            return "evening"
        else:
            return "night"
    
    async def _process_sentiment_response(self, llm_response: Dict, feedback) -> Dict:
        """Process and validate LLM sentiment analysis response"""
        try:
            # Validate required fields
            required_fields = ['sentiment_score', 'sentiment_label', 'confidence_score']
            for field in required_fields:
                if field not in llm_response:
                    raise ValueError(f"Missing required field: {field}")
            
            # Validate sentiment score range
            sentiment_score = float(llm_response['sentiment_score'])
            if not -1.0 <= sentiment_score <= 1.0:
                sentiment_score = max(-1.0, min(1.0, sentiment_score))
            
            # Validate confidence score
            confidence_score = float(llm_response['confidence_score'])
            if not 0.0 <= confidence_score <= 1.0:
                confidence_score = max(0.0, min(1.0, confidence_score))
            
            # Validate sentiment label
            valid_labels = ['negative', 'neutral', 'positive']
            sentiment_label = llm_response['sentiment_label'].lower()
            if sentiment_label not in valid_labels:
                # Infer from score
                if sentiment_score < -0.1:
                    sentiment_label = 'negative'
                elif sentiment_score > 0.1:
                    sentiment_label = 'positive'
                else:
                    sentiment_label = 'neutral'
            
            # Process additional insights
            processed_result = {
                'sentiment_score': sentiment_score,
                'sentiment_label': sentiment_label,
                'confidence_score': confidence_score,
                'emotion_detected': llm_response.get('emotion_detected', 'neutral'),
                'cultural_indicators': llm_response.get('cultural_indicators', ''),
                'urgency_indicators': llm_response.get('urgency_indicators', []),
                'citizen_expectation': llm_response.get('citizen_expectation', ''),
                'communication_style': llm_response.get('communication_style', 'formal'),
                'community_focus': llm_response.get('community_focus', False),
                'constructive_tone': llm_response.get('constructive_tone', False),
                'analysis_timestamp': timezone.now().isoformat(),
                'model_version': '1.0',
                'raw_llm_response': llm_response
            }
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Failed to process sentiment response: {e}")
            return await self._fallback_sentiment_analysis(feedback)
    
    async def _fallback_sentiment_analysis(self, feedback) -> Dict:
        """Fallback sentiment analysis using basic keyword detection"""
        content = feedback.content.lower()
        title = feedback.title.lower()
        full_text = f"{title} {content}"
        
        # Basic keyword-based sentiment scoring
        negative_keywords = [
            'bad', 'poor', 'terrible', 'awful', 'horrible', 'worst', 'broken',
            'failed', 'problem', 'issue', 'complaint', 'angry', 'frustrated',
            'disappointed', 'urgent', 'crisis', 'emergency', 'help', 'please'
        ]
        
        positive_keywords = [
            'good', 'great', 'excellent', 'wonderful', 'thank', 'appreciate',
            'happy', 'satisfied', 'improvement', 'better', 'working', 'resolved'
        ]
        
        negative_count = sum(1 for word in negative_keywords if word in full_text)
        positive_count = sum(1 for word in positive_keywords if word in full_text)
        
        # Calculate basic sentiment score
        if negative_count > positive_count:
            sentiment_score = -min(0.8, negative_count * 0.2)
            sentiment_label = 'negative'
        elif positive_count > negative_count:
            sentiment_score = min(0.8, positive_count * 0.2)
            sentiment_label = 'positive'
        else:
            sentiment_score = 0.0
            sentiment_label = 'neutral'
        
        # Detect basic emotion
        if any(word in full_text for word in ['angry', 'furious', 'outraged']):
            emotion = 'angry'
        elif any(word in full_text for word in ['frustrated', 'annoyed']):
            emotion = 'frustrated'
        elif any(word in full_text for word in ['worried', 'concerned']):
            emotion = 'worried'
        elif any(word in full_text for word in ['urgent', 'emergency', 'crisis']):
            emotion = 'desperate'
        elif any(word in full_text for word in ['thank', 'grateful', 'appreciate']):
            emotion = 'grateful'
        else:
            emotion = 'neutral'
        
        return {
            'sentiment_score': sentiment_score,
            'sentiment_label': sentiment_label,
            'confidence_score': 0.6,  # Lower confidence for fallback
            'emotion_detected': emotion,
            'cultural_indicators': 'Basic keyword analysis',
            'urgency_indicators': self._detect_urgent_keywords(content),
            'citizen_expectation': 'Government action requested',
            'communication_style': 'formal' if 'please' in full_text else 'informal',
            'community_focus': 'community' in full_text or 'we' in full_text,
            'constructive_tone': 'suggest' in full_text or 'recommend' in full_text,
            'analysis_timestamp': timezone.now().isoformat(),
            'model_version': 'fallback_1.0',
            'fallback_used': True
        }
    
    async def analyze_batch_sentiment(self, feedback_ids: List[int]) -> Dict[int, Dict]:
        """🔄 Analyze sentiment for multiple feedback items efficiently"""
        results = {}
        
        Feedback = get_feedback_model()
        
        # Get feedback objects
        feedback_items = await asyncio.to_thread(
            lambda: list(Feedback.objects.filter(id__in=feedback_ids).select_related('county'))
        )
        
        # Process in parallel (with rate limiting)
        semaphore = asyncio.Semaphore(5)  # Limit concurrent API calls
        
        async def analyze_single(feedback):
            async with semaphore:
                return await self.analyze_feedback_sentiment(feedback)
        
        # Run sentiment analysis for all items
        tasks = [analyze_single(feedback) for feedback in feedback_items]
        sentiment_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile results
        for feedback, result in zip(feedback_items, sentiment_results):
            if isinstance(result, Exception):
                logger.error(f"Batch sentiment analysis failed for feedback {feedback.id}: {result}")
                results[feedback.id] = await self._fallback_sentiment_analysis(feedback)
            else:
                results[feedback.id] = result
        
        logger.info(f"Batch sentiment analysis completed for {len(results)} feedback items")
        return results
    
    def get_sentiment_insights(self, county) -> Dict:
        """📊 Get sentiment insights and trends for a county"""
        try:
            Feedback = get_feedback_model()
            
            # Get recent feedback with sentiment analysis
            recent_feedback = Feedback.objects.filter(
                county=county,
                created_at__gte=timezone.now() - timedelta(days=30),
                ai_analysis__isnull=False
            ).select_related('ai_analysis')
            
            if not recent_feedback.exists():
                return {'error': 'No recent feedback with sentiment analysis found'}
            
            # Calculate sentiment distribution
            sentiment_counts = recent_feedback.values('ai_analysis__sentiment_label').annotate(
                count=Count('id')
            )
            
            # Calculate average sentiment by category
            category_sentiment = recent_feedback.values('category').annotate(
                avg_sentiment=Avg('ai_analysis__sentiment_score'),
                count=Count('id')
            )
            
            # Get most common emotions
            emotion_counts = recent_feedback.values('ai_analysis__emotion_detected').annotate(
                count=Count('id')
            ).order_by('-count')[:5]
            
            return {
                'county_name': county.name,
                'analysis_period_days': 30,
                'total_feedback_analyzed': recent_feedback.count(),
                'sentiment_distribution': list(sentiment_counts),
                'category_sentiment': list(category_sentiment),
                'common_emotions': list(emotion_counts),
                'overall_sentiment_score': recent_feedback.aggregate(
                    avg=Avg('ai_analysis__sentiment_score')
                )['avg'],
                'generated_at': timezone.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get sentiment insights for {county.name}: {e}")
            return {'error': str(e)}


# Singleton instance for application use
sentiment_analyzer = LLMSentimentAnalyzer()


# Utility functions for easy access
async def analyze_sentiment(feedback) -> Dict:
    """Quick sentiment analysis for single feedback"""
    return await sentiment_analyzer.analyze_feedback_sentiment(feedback)


async def analyze_sentiment_batch(feedback_ids: List[int]) -> Dict:
    """Quick batch sentiment analysis"""
    return await sentiment_analyzer.analyze_batch_sentiment(feedback_ids)


def get_county_sentiment_insights(county) -> Dict:
    """Get sentiment insights for county dashboard"""
    return sentiment_analyzer.get_sentiment_insights(county)
    