# =============================================================================
# FILE: apps/ai/tasks.py - FIXED VERSION
# =============================================================================
import asyncio
import logging
from typing import Dict, List, Optional
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db import transaction
from django.conf import settings
from django.apps import apps
from celery import shared_task, group, chain
from celery.exceptions import Retry

logger = logging.getLogger('apps.ai.tasks')


# =============================================================================
# LAZY IMPORT FUNCTIONS (Prevents AppRegistryNotReady errors)
# =============================================================================

def get_ai_models():
    """Lazy import for AI models"""
    return {
        'FeedbackAIAnalysis': apps.get_model('ai', 'FeedbackAIAnalysis'),
        'AIResponseSuggestion': apps.get_model('ai', 'AIResponseSuggestion'), 
        'AITrendAnalysis': apps.get_model('ai', 'AITrendAnalysis'),
        'AIProcessingLog': apps.get_model('ai', 'AIProcessingLog'),
    }

def get_feedback_models():
    """Lazy import for feedback models"""
    return {
        'Feedback': apps.get_model('feedback', 'Feedback'),
    }

def get_user_models():
    """Lazy import for user models"""
    return {
        'CustomUser': apps.get_model('users', 'CustomUser'),
        'County': apps.get_model('users', 'County'),
    }

def get_ai_services():
    """Lazy import for AI services"""
    from . import get_sentiment_analyzer, get_urgency_scorer, get_response_generator, get_trend_analyzer
    return {
        'sentiment_analyzer': get_sentiment_analyzer(),
        'urgency_scorer': get_urgency_scorer(),
        'response_generator': get_response_generator(),
        'trend_analyzer': get_trend_analyzer(),
    }


# =============================================================================
# CORE AI PROCESSING TASKS
# =============================================================================

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_feedback_ai_complete(self, feedback_id: int) -> Dict:
    """
    🤖 CRITICAL: Complete AI processing pipeline for new feedback
    
    This is the main task that runs automatically when citizens submit feedback.
    It performs:
    1. Sentiment Analysis
    2. Urgency Scoring
    3. AI Response Generation
    4. Critical Alert Detection
    5. Data Storage and Caching
    
    Args:
        feedback_id: ID of the feedback to process
        
    Returns:
        Dictionary with processing results and metadata
    """
    
    # Lazy import models
    ai_models = get_ai_models()
    feedback_models = get_feedback_models()
    AIProcessingLog = ai_models['AIProcessingLog']
    Feedback = feedback_models['Feedback']
    FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
    
    # Create processing log entry
    log_entry = AIProcessingLog.objects.create(
        task_id=self.request.id,
        task_name='process_feedback_ai_complete',
        feedback_id=feedback_id,
        status='started'
    )
    
    try:
        # Get feedback with related data
        feedback = Feedback.objects.select_related(
            'user', 'county', 'sub_county', 'ward', 'village'
        ).get(id=feedback_id)
        
        logger.info(f"Starting complete AI processing for feedback {feedback.id}")
        
        # Check if AI processing is enabled
        if not getattr(settings, 'AI_PROCESSING_ASYNC', True):
            log_entry.complete_processing(
                success=False, 
                error_message="AI processing is disabled"
            )
            return {'success': False, 'message': 'AI processing disabled'}
        
        # Check if already processed
        existing_analysis = FeedbackAIAnalysis.objects.filter(feedback=feedback).first()
        if existing_analysis:
            logger.info(f"Feedback {feedback.id} already has AI analysis")
            log_entry.complete_processing(success=True, results={'reprocessed': False})
            return {'success': True, 'message': 'Already processed', 'reprocessed': False}
        
        log_entry.status = 'processing'
        log_entry.save()
        
        # Run AI analysis in async context
        results = asyncio.run(_run_complete_ai_analysis(feedback, log_entry))
        
        # Complete processing log
        log_entry.complete_processing(success=True, results=results)
        
        logger.info(f"AI processing completed for feedback {feedback.id}")
        return {'success': True, 'results': results}
        
    except Feedback.DoesNotExist:
        error_msg = f"Feedback with ID {feedback_id} not found"
        logger.error(error_msg)
        log_entry.complete_processing(success=False, error_message=error_msg)
        return {'success': False, 'error': error_msg}
        
    except Exception as e:
        error_msg = f"AI processing failed for feedback {feedback_id}: {str(e)}"
        logger.error(error_msg, exc_info=True)
        
        # Retry logic
        if self.request.retries < self.max_retries:
            log_entry.retry_count += 1
            log_entry.status = 'retrying'
            log_entry.save()
            
            # Exponential backoff
            retry_delay = 60 * (2 ** self.request.retries)
            raise self.retry(countdown=retry_delay, exc=e)
        
        # Max retries reached
        log_entry.complete_processing(success=False, error_message=error_msg)
        return {'success': False, 'error': error_msg}


async def _run_complete_ai_analysis(feedback, log_entry) -> Dict:
    """Run complete AI analysis for feedback"""
    results = {}
    
    try:
        # Get AI services with lazy loading
        ai_services = get_ai_services()
        sentiment_analyzer = ai_services['sentiment_analyzer']
        urgency_scorer = ai_services['urgency_scorer']
        
        # 1. Sentiment Analysis
        sentiment_result = await sentiment_analyzer.analyze_feedback_sentiment(feedback)
        results['sentiment_analysis'] = {
            'success': sentiment_result.get('sentiment_score') is not None,
            'sentiment_score': sentiment_result.get('sentiment_score'),
            'sentiment_label': sentiment_result.get('sentiment_label'),
            'emotion_detected': sentiment_result.get('emotion_detected'),
            'confidence_score': sentiment_result.get('confidence_score')
        }
        
        # 2. Urgency Scoring
        urgency_result = await urgency_scorer.calculate_intelligent_urgency(feedback)
        results['urgency_analysis'] = {
            'success': urgency_result.get('urgency_score') is not None,
            'urgency_score': urgency_result.get('urgency_score'),
            'urgency_level': urgency_result.get('urgency_level'),
            'escalation_risk': urgency_result.get('escalation_risk'),
            'alert_officials': urgency_result.get('alert_officials', False)
        }
        
        # 3. Store AI Analysis in Database
        ai_analysis = await _store_ai_analysis(feedback, sentiment_result, urgency_result)
        results['analysis_stored'] = ai_analysis is not None
        
        # 4. Generate Response Suggestions for Officials
        if getattr(settings, 'AI_RESPONSE_GENERATION_ENABLED', True):
            response_suggestions = await _generate_response_suggestions_for_feedback(feedback)
            results['response_suggestions_count'] = len(response_suggestions)
        else:
            results['response_suggestions_count'] = 0
        
        # 5. Check for Critical Alerts
        if urgency_result.get('alert_officials', False):
            send_urgent_alert.delay(feedback.id, urgency_result)
            results['urgent_alert_sent'] = True
        else:
            results['urgent_alert_sent'] = False
        
        # 6. Update processing log with API usage
        log_entry.record_api_usage(api_calls=2, tokens=500)  # Estimate
        
        return results
        
    except Exception as e:
        logger.error(f"Complete AI analysis failed: {e}")
        raise


@transaction.atomic
async def _store_ai_analysis(feedback, sentiment_result: Dict, urgency_result: Dict):
    """Store AI analysis results in database"""
    try:
        # Get AI models with lazy loading
        ai_models = get_ai_models()
        FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
        
        # Create AI analysis record
        ai_analysis = await FeedbackAIAnalysis.objects.acreate(
            feedback=feedback,
            
            # Sentiment Analysis
            sentiment_score=sentiment_result.get('sentiment_score'),
            sentiment_label=sentiment_result.get('sentiment_label'),
            emotion_detected=sentiment_result.get('emotion_detected'),
            confidence_score=sentiment_result.get('confidence_score'),
            
            # Urgency Analysis
            urgency_score=urgency_result.get('urgency_score'),
            urgency_level=urgency_result.get('urgency_level'),
            escalation_risk=urgency_result.get('escalation_risk'),
            
            # Community Impact
            community_impact_score=urgency_result.get('affected_population_estimate', 0) / 1000,
            affected_population_estimate=urgency_result.get('affected_population_estimate'),
            geographic_scope=urgency_result.get('community_impact_scale'),
            
            # Processing Metadata
            processing_version='1.0',
            processed_at=timezone.now(),
            
            # Raw Data Storage
            raw_ai_response={
                'sentiment_analysis': sentiment_result,
                'urgency_analysis': urgency_result
            }
        )
        
        logger.info(f"AI analysis stored for feedback {feedback.id}")
        return ai_analysis
        
    except Exception as e:
        logger.error(f"Failed to store AI analysis: {e}")
        return None


async def _generate_response_suggestions_for_feedback(feedback) -> List[Dict]:
    """Generate AI response suggestions for county officials"""
    try:
        suggestions = []
        
        # Get models and services with lazy loading
        user_models = get_user_models()
        ai_models = get_ai_models()
        ai_services = get_ai_services()
        CustomUser = user_models['CustomUser']
        AIResponseSuggestion = ai_models['AIResponseSuggestion']
        response_generator = ai_services['response_generator']
        
        # Get county officials who should see this feedback
        county_officials = await CustomUser.objects.filter(
            role='government_official',
            home_county=feedback.county,
            is_active=True
        ).aall()
        
        # Generate suggestions for each official (limit to avoid overload)
        for official in list(county_officials)[:3]:  # Limit to 3 officials
            try:
                official_suggestions = await response_generator.generate_response_suggestions(
                    feedback, official
                )
                
                # Store suggestions in database
                for suggestion in official_suggestions:
                    await AIResponseSuggestion.objects.acreate(
                        feedback=feedback,
                        suggested_content=suggestion.get('suggested_content', ''),
                        response_type=suggestion.get('response_type', 'acknowledgment'),
                        empathy_score=suggestion.get('empathy_score'),
                        clarity_score=suggestion.get('clarity_score'),
                        actionability_score=suggestion.get('actionability_score'),
                        appropriateness_score=suggestion.get('appropriateness_score'),
                        target_audience=suggestion.get('target_audience', 'citizen'),
                        tone=suggestion.get('tone'),
                        generation_model=suggestion.get('generation_model', 'gpt-4o'),
                        generation_parameters=suggestion.get('context_factors', {})
                    )
                
                suggestions.extend(official_suggestions)
                
            except Exception as e:
                logger.error(f"Failed to generate suggestions for official {official.id}: {e}")
                continue
        
        return suggestions
        
    except Exception as e:
        logger.error(f"Failed to generate response suggestions: {e}")
        return []


# =============================================================================
# URGENT ALERT AND NOTIFICATION TASKS
# =============================================================================

@shared_task(bind=True, max_retries=2)
def send_urgent_alert(self, feedback_id: int, urgency_data: Dict) -> Dict:
    """
    🚨 Send immediate alerts for critical issues
    
    Args:
        feedback_id: ID of the urgent feedback
        urgency_data: Urgency analysis results
    """
    try:
        # Get models with lazy loading
        feedback_models = get_feedback_models()
        user_models = get_user_models()
        Feedback = feedback_models['Feedback']
        CustomUser = user_models['CustomUser']
        
        feedback = Feedback.objects.select_related('county', 'user').get(id=feedback_id)
        
        logger.warning(f"URGENT ALERT: Critical feedback {feedback.id} requires immediate attention")
        
        # Get relevant officials for immediate notification
        urgent_officials = CustomUser.objects.filter(
            role='government_official',
            home_county=feedback.county,
            official_level__in=['local', 'regional', 'national'],
            is_active=True
        )
        
        # In production, this would send actual notifications
        # For now, log and cache for dashboard alerts
        alert_data = {
            'feedback_id': feedback_id,
            'tracking_id': str(feedback.id),
            'urgency_score': urgency_data.get('urgency_score'),
            'urgency_level': urgency_data.get('urgency_level'),
            'affected_population': urgency_data.get('affected_population_estimate'),
            'category': feedback.category,
            'county': feedback.county.name,
            'alert_time': timezone.now().isoformat(),
            'requires_immediate_action': True
        }
        
        # Cache alert for real-time dashboard
        cache_key = f"urgent_alerts_{feedback.county.id}"
        current_alerts = cache.get(cache_key, [])
        current_alerts.append(alert_data)
        cache.set(cache_key, current_alerts, 86400)  # 24 hours
        
        # Log for audit trail
        logger.critical(f"Urgent alert processed for feedback {feedback.id} - Urgency: {urgency_data.get('urgency_level')}")
        
        return {
            'success': True,
            'alert_sent': True,
            'officials_notified': urgent_officials.count(),
            'alert_level': urgency_data.get('urgency_level')
        }
        
    except Exception as e:
        logger.error(f"Failed to send urgent alert for feedback {feedback_id}: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def handle_critical_feedback(feedback_id: int) -> Dict:
    """
    🆘 Handle critical feedback with escalated procedures
    
    Args:
        feedback_id: ID of the critical feedback
    """
    try:
        # Get models with lazy loading
        feedback_models = get_feedback_models()
        user_models = get_user_models()
        Feedback = feedback_models['Feedback']
        CustomUser = user_models['CustomUser']
        
        feedback = Feedback.objects.get(id=feedback_id)
        
        # Log critical handling
        logger.critical(f"CRITICAL FEEDBACK HANDLING: {feedback.id}")
        
        # Escalate to senior officials
        senior_officials = CustomUser.objects.filter(
            role='government_official',
            official_level__in=['regional', 'national'],
            is_active=True
        )
        
        # Create high-priority cache entry
        critical_cache_key = f"critical_feedback_{feedback.county.id}"
        critical_data = {
            'feedback_id': feedback_id,
            'tracking_id': str(feedback.id),
            'escalated_at': timezone.now().isoformat(),
            'status': 'requires_immediate_response'
        }
        cache.set(critical_cache_key, critical_data, 172800)  # 48 hours
        
        return {
            'success': True,
            'escalated': True,
            'senior_officials_notified': senior_officials.count()
        }
        
    except Exception as e:
        logger.error(f"Critical feedback handling failed: {e}")
        return {'success': False, 'error': str(e)}


# =============================================================================
# BATCH PROCESSING TASKS
# =============================================================================

@shared_task
def process_pending_ai_analysis_batch() -> Dict:
    """
    🔄 Process pending AI analysis in batches
    
    Runs every 5 minutes to catch any feedback that missed real-time processing
    """
    try:
        # Get models with lazy loading
        feedback_models = get_feedback_models()
        Feedback = feedback_models['Feedback']
        
        # Find feedback without AI analysis
        pending_feedback = Feedback.objects.filter(
            ai_analysis__isnull=True,
            created_at__gte=timezone.now() - timedelta(hours=24)  # Last 24 hours only
        ).select_related('county')[:20]  # Process max 20 at a time
        
        if not pending_feedback:
            return {'success': True, 'processed': 0, 'message': 'No pending feedback found'}
        
        # Process in batches
        results = []
        for feedback in pending_feedback:
            try:
                # Schedule individual processing
                task_result = process_feedback_ai_complete.delay(feedback.id)
                results.append({
                    'feedback_id': feedback.id,
                    'tracking_id': str(feedback.id),
                    'task_id': task_result.id,
                    'status': 'scheduled'
                })
            except Exception as e:
                logger.error(f"Failed to schedule AI processing for feedback {feedback.id}: {e}")
                results.append({
                    'feedback_id': feedback.id,
                    'status': 'failed',
                    'error': str(e)
                })
        
        logger.info(f"Batch AI processing scheduled for {len(results)} feedback items")
        
        return {
            'success': True,
            'processed': len(results),
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Batch AI processing failed: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def analyze_sentiment_batch(feedback_ids: List[int]) -> Dict:
    """
    🎭 Batch sentiment analysis for multiple feedback items
    
    Args:
        feedback_ids: List of feedback IDs to analyze
    """
    try:
        # Get services and models with lazy loading
        ai_services = get_ai_services()
        ai_models = get_ai_models()
        sentiment_analyzer = ai_services['sentiment_analyzer']
        FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
        
        results = asyncio.run(sentiment_analyzer.analyze_batch_sentiment(feedback_ids))
        
        # Update existing AI analysis records
        for feedback_id, sentiment_data in results.items():
            try:
                ai_analysis, created = FeedbackAIAnalysis.objects.get_or_create(
                    feedback_id=feedback_id,
                    defaults={
                        'sentiment_score': sentiment_data.get('sentiment_score'),
                        'sentiment_label': sentiment_data.get('sentiment_label'),
                        'emotion_detected': sentiment_data.get('emotion_detected'),
                        'confidence_score': sentiment_data.get('confidence_score'),
                        'processing_version': '1.0'
                    }
                )
                
                if not created:
                    # Update existing record
                    ai_analysis.sentiment_score = sentiment_data.get('sentiment_score')
                    ai_analysis.sentiment_label = sentiment_data.get('sentiment_label')
                    ai_analysis.emotion_detected = sentiment_data.get('emotion_detected')
                    ai_analysis.confidence_score = sentiment_data.get('confidence_score')
                    ai_analysis.save()
                    
            except Exception as e:
                logger.error(f"Failed to update sentiment analysis for feedback {feedback_id}: {e}")
        
        return {
            'success': True,
            'processed': len(results),
            'feedback_analyzed': list(results.keys())
        }
        
    except Exception as e:
        logger.error(f"Batch sentiment analysis failed: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def calculate_urgency_scores_batch(feedback_ids: List[int]) -> Dict:
    """
    ⚡ Batch urgency scoring for multiple feedback items
    
    Args:
        feedback_ids: List of feedback IDs to score
    """
    try:
        # Get services and models with lazy loading
        ai_services = get_ai_services()
        ai_models = get_ai_models()
        urgency_scorer = ai_services['urgency_scorer']
        FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
        
        results = asyncio.run(urgency_scorer.calculate_batch_urgency(feedback_ids))
        
        # Update AI analysis records
        for feedback_id, urgency_data in results.items():
            try:
                ai_analysis, created = FeedbackAIAnalysis.objects.get_or_create(
                    feedback_id=feedback_id,
                    defaults={
                        'urgency_score': urgency_data.get('urgency_score'),
                        'urgency_level': urgency_data.get('urgency_level'),
                        'escalation_risk': urgency_data.get('escalation_risk'),
                        'processing_version': '1.0'
                    }
                )
                
                if not created:
                    # Update existing record
                    ai_analysis.urgency_score = urgency_data.get('urgency_score')
                    ai_analysis.urgency_level = urgency_data.get('urgency_level')
                    ai_analysis.escalation_risk = urgency_data.get('escalation_risk')
                    ai_analysis.save()
                    
            except Exception as e:
                logger.error(f"Failed to update urgency analysis for feedback {feedback_id}: {e}")
        
        return {
            'success': True,
            'processed': len(results),
            'feedback_scored': list(results.keys())
        }
        
    except Exception as e:
        logger.error(f"Batch urgency scoring failed: {e}")
        return {'success': False, 'error': str(e)}


# =============================================================================
# INSIGHTS AND ANALYTICS TASKS
# =============================================================================

@shared_task
def generate_daily_ai_insights() -> Dict:
    """
    📊 Generate daily AI insights for all counties
    
    Runs daily to create comprehensive analytics and trend reports
    """
    try:
        results = {}
        
        # Get models and services with lazy loading
        user_models = get_user_models()
        ai_models = get_ai_models()
        ai_services = get_ai_services()
        County = user_models['County']
        AITrendAnalysis = ai_models['AITrendAnalysis']
        trend_analyzer = ai_services['trend_analyzer']
        
        counties = County.objects.filter(is_active=True)
        
        for county in counties:
            try:
                # Generate trend analysis
                trend_result = asyncio.run(
                    trend_analyzer.analyze_county_trends(county, analysis_period_days=7)
                )
                
                # Store trend analysis if successful
                if trend_result.get('analysis_metadata', {}).get('confidence_score', 0) > 0.5:
                    trend_analysis = AITrendAnalysis.objects.create(
                        county=county,
                        analysis_period_start=timezone.now() - timedelta(days=7),
                        analysis_period_end=timezone.now(),
                        analysis_type='daily',
                        feedback_volume_trend=trend_result.get('volume_trends', {}),
                        category_trends=trend_result.get('category_analysis', {}),
                        sentiment_trends=trend_result.get('sentiment_trends', {}),
                        urgency_trends=trend_result.get('urgency_patterns', {}),
                        location_trends=trend_result.get('geographic_distribution', {}),
                        predicted_issues=trend_result.get('predictions', {}).get('emerging_issues', []),
                        response_time_trends=trend_result.get('response_performance', {}),
                        confidence_score=trend_result.get('analysis_metadata', {}).get('confidence_score'),
                        data_quality_score=trend_result.get('analysis_metadata', {}).get('data_quality_score'),
                        sample_size=trend_result.get('analysis_period', {}).get('total_feedback', 0),
                        generated_by_model='gpt-4o',
                        generation_parameters={'analysis_period_days': 7}
                    )
                    
                    results[county.name] = {
                        'success': True,
                        'trend_analysis_id': trend_analysis.id,
                        'confidence_score': trend_result.get('analysis_metadata', {}).get('confidence_score')
                    }
                else:
                    results[county.name] = {
                        'success': False,
                        'reason': 'Insufficient data or low confidence score'
                    }
                    
            except Exception as e:
                logger.error(f"Daily insights generation failed for {county.name}: {e}")
                results[county.name] = {
                    'success': False,
                    'error': str(e)
                }
        
        successful_counties = len([r for r in results.values() if r.get('success')])
        
        logger.info(f"Daily AI insights generated for {successful_counties}/{len(counties)} counties")
        
        return {
            'success': True,
            'counties_processed': len(counties),
            'successful_analyses': successful_counties,
            'results': results
        }
        
    except Exception as e:
        logger.error(f"Daily AI insights generation failed: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def generate_trend_analysis(county_id: int, period_days: int = 30) -> Dict:
    """
    📈 Generate comprehensive trend analysis for a specific county
    
    Args:
        county_id: ID of the county to analyze
        period_days: Number of days to analyze
    """
    try:
        # Get models and services with lazy loading
        user_models = get_user_models()
        ai_models = get_ai_models()
        ai_services = get_ai_services()
        County = user_models['County']
        AITrendAnalysis = ai_models['AITrendAnalysis']
        trend_analyzer = ai_services['trend_analyzer']
        
        county = County.objects.get(id=county_id)
        
        # Generate trend analysis
        trend_result = asyncio.run(
            trend_analyzer.analyze_county_trends(county, period_days, include_predictions=True)
        )
        
        # Store results
        if trend_result.get('analysis_metadata', {}).get('confidence_score', 0) > 0.3:
            analysis_type = 'weekly' if period_days <= 14 else ('monthly' if period_days <= 35 else 'custom')
            
            trend_analysis = AITrendAnalysis.objects.create(
                county=county,
                analysis_period_start=timezone.now() - timedelta(days=period_days),
                analysis_period_end=timezone.now(),
                analysis_type=analysis_type,
                feedback_volume_trend=trend_result.get('volume_trends', {}),
                category_trends=trend_result.get('category_analysis', {}),
                sentiment_trends=trend_result.get('sentiment_trends', {}),
                urgency_trends=trend_result.get('urgency_patterns', {}),
                location_trends=trend_result.get('geographic_distribution', {}),
                predicted_issues=trend_result.get('predictions', {}).get('emerging_issues', []),
                seasonal_patterns=trend_result.get('predictions', {}),
                response_time_trends=trend_result.get('response_performance', {}),
                confidence_score=trend_result.get('analysis_metadata', {}).get('confidence_score'),
                data_quality_score=trend_result.get('analysis_metadata', {}).get('data_quality_score'),
                sample_size=trend_result.get('analysis_period', {}).get('total_feedback', 0),
                generated_by_model='gpt-4o',
                generation_parameters={'analysis_period_days': period_days}
            )
            
            logger.info(f"Trend analysis generated for {county.name} (ID: {trend_analysis.id})")
            
            return {
                'success': True,
                'trend_analysis_id': trend_analysis.id,
                'county_name': county.name,
                'period_days': period_days,
                'confidence_score': trend_result.get('analysis_metadata', {}).get('confidence_score'),
                'sample_size': trend_result.get('analysis_period', {}).get('total_feedback', 0)
            }
        else:
            return {
                'success': False,
                'reason': 'Insufficient data for meaningful analysis',
                'county_name': county.name
            }
            
    except County.DoesNotExist:
        return {'success': False, 'error': f'County with ID {county_id} not found'}
    except Exception as e:
        logger.error(f"Trend analysis generation failed for county {county_id}: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def generate_county_insights(county_id: int) -> Dict:
    """
    💡 Generate real-time insights for county dashboard
    
    Args:
        county_id: ID of the county
    """
    try:
        # Get models and services with lazy loading
        user_models = get_user_models()
        ai_services = get_ai_services()
        County = user_models['County']
        trend_analyzer = ai_services['trend_analyzer']
        
        county = County.objects.get(id=county_id)
        
        # Get quick insights
        insights = asyncio.run(trend_analyzer.analyze_county_trends(county, 14, include_predictions=False))
        
        # Cache insights for dashboard
        cache_key = f"county_insights_{county_id}"
        cache.set(cache_key, insights, 3600)  # Cache for 1 hour
        
        return {
            'success': True,
            'county_name': county.name,
            'insights_cached': True,
            'cache_key': cache_key
        }
        
    except Exception as e:
        logger.error(f"County insights generation failed: {e}")
        return {'success': False, 'error': str(e)}


# =============================================================================
# MAINTENANCE AND CLEANUP TASKS
# =============================================================================

@shared_task
def cleanup_ai_cache() -> Dict:
    """
    🧹 Clean up old AI cache entries and temporary data
    """
    try:
        # Get AI models with lazy loading
        ai_models = get_ai_models()
        AIProcessingLog = ai_models['AIProcessingLog']
        AITrendAnalysis = ai_models['AITrendAnalysis']
        
        # Clear old processing logs (older than 30 days)
        old_logs = AIProcessingLog.objects.filter(
            start_time__lt=timezone.now() - timedelta(days=30)
        )
        deleted_logs = old_logs.count()
        old_logs.delete()
        
        # Clear old trend analyses (older than 90 days)
        old_trends = AITrendAnalysis.objects.filter(
            created_at__lt=timezone.now() - timedelta(days=90)
        )
        deleted_trends = old_trends.count()
        old_trends.delete()
        
        # Clear cache patterns (this is simplified - in production you'd use more specific patterns)
        # cache.delete_pattern("llm_response_*")  # Requires django-redis with pattern support
        
        logger.info(f"AI cleanup completed: {deleted_logs} logs, {deleted_trends} trend analyses deleted")
        
        return {
            'success': True,
            'deleted_logs': deleted_logs,
            'deleted_trends': deleted_trends,
            'cleanup_completed_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI cleanup failed: {e}")
        return {'success': False, 'error': str(e)}


@shared_task
def health_check_ai_services() -> Dict:
    """
    🏥 Health check for AI services and dependencies
    """
    try:
        health_status = {}
        
        # Check LLM client health
        from .services.llm_client import check_llm_health
        health_status['llm_services'] = check_llm_health()
        
        # Check database connectivity
        try:
            ai_models = get_ai_models()
            FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
            FeedbackAIAnalysis.objects.count()
            health_status['database'] = {'status': 'healthy'}
        except Exception as e:
            health_status['database'] = {'status': 'unhealthy', 'error': str(e)}
        
        # Check cache connectivity
        try:
            cache.set('health_check', 'ok', 60)
            cached_value = cache.get('health_check')
            health_status['cache'] = {
                'status': 'healthy' if cached_value == 'ok' else 'unhealthy'
            }
        except Exception as e:
            health_status['cache'] = {'status': 'unhealthy', 'error': str(e)}
        
        # Overall health
        all_healthy = all(
            service.get('status') == 'healthy' or service.get('healthy') == True
            for service in health_status.values()
        )
        
        return {
            'success': True,
            'overall_health': 'healthy' if all_healthy else 'degraded',
            'services': health_status,
            'checked_at': timezone.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"AI health check failed: {e}")
        return {
            'success': False,
            'overall_health': 'unhealthy',
            'error': str(e)
        }


# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

def get_ai_processing_stats() -> Dict:
    """Get AI processing statistics"""
    try:
        # Get AI models with lazy loading
        ai_models = get_ai_models()
        FeedbackAIAnalysis = ai_models['FeedbackAIAnalysis']
        AIResponseSuggestion = ai_models['AIResponseSuggestion']
        AITrendAnalysis = ai_models['AITrendAnalysis']
        AIProcessingLog = ai_models['AIProcessingLog']
        
        stats = {
            'total_analyses': FeedbackAIAnalysis.objects.count(),
            'analyses_today': FeedbackAIAnalysis.objects.filter(
                processed_at__date=timezone.now().date()
            ).count(),
            'total_response_suggestions': AIResponseSuggestion.objects.count(),
            'trend_analyses': AITrendAnalysis.objects.count(),
            'processing_logs': AIProcessingLog.objects.count(),
            'failed_processes': AIProcessingLog.objects.filter(status='failed').count(),
        }
        return stats
    except Exception as e:
        logger.error(f"Failed to get AI processing stats: {e}")
        return {}


def trigger_ai_processing_for_feedback(feedback_id: int) -> str:
    """
    Trigger AI processing for a specific feedback item
    
    Returns:
        Task ID for tracking
    """
    task = process_feedback_ai_complete.delay(feedback_id)
    return task.id


def trigger_county_insights_generation(county_id: int) -> str:
    """
    Trigger insights generation for a county
    
    Returns:
        Task ID for tracking
    """
    task = generate_county_insights.delay(county_id)
    return task.id
