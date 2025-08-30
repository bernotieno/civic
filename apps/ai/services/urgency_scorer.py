# =============================================================================
# FILE: apps/ai/services/urgency_scorer.py
# =============================================================================
import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Avg, Q

from .prompt_templates import UrgencyPrompts
from apps.feedback.models import Feedback


logger = logging.getLogger('apps.ai.services')


class LLMUrgencyScorer:
    """
    ⚡ AWARD-WINNING: AI urgency scoring that considers county-specific context
    
    Calculates urgency using AI reasoning with:
    - Real county data and historical patterns
    - Seasonal and situational factors
    - Community impact assessment
    - Resource availability considerations
    - Cultural context and communication patterns
    - Escalation risk prediction
    """
    
    def __init__(self):
        self.llm_client = None
        self.prompts = UrgencyPrompts()
        self.cache_ttl = 1800  # 30 minutes cache for urgency scoring
        self._initialize_llm_client()
    
    def _initialize_llm_client(self):
        """Initialize LLM client with error handling"""
        try:
            from .llm_client import llm_client
            self.llm_client = llm_client
        except Exception as e:
            logger.warning(f"LLM client initialization failed: {e}")
            self.llm_client = None
    
    async def calculate_intelligent_urgency(self, feedback) -> Dict:
        """
        🎯 Calculate urgency using AI reasoning with real county data
        
        Args:
            feedback: Feedback model instance
            
        Returns:
            Dictionary with comprehensive urgency analysis
        """
        try:
            # Check cache first
            cache_key = f"urgency_analysis_{feedback.id}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Using cached urgency analysis for feedback {feedback.id}")
                return cached_result
            
            # Gather comprehensive context for urgency assessment
            context_data = await self._gather_urgency_context(feedback)
            
            # Get AI urgency analysis
            if not self.llm_client:
                logger.warning("LLM client not available, using fallback urgency scoring")
                return await self._fallback_urgency_scoring(feedback, context_data)
            
            prompt = self.prompts.get_urgency_scoring_prompt()
            
            try:
                from .llm_client import get_json_response
                llm_response = await get_json_response(prompt, context_data)
            except ImportError:
                logger.warning("LLM client functions not available, using fallback urgency scoring")
                return await self._fallback_urgency_scoring(feedback, context_data)
            
            if not llm_response:
                # Fallback to rule-based urgency scoring
                return await self._fallback_urgency_scoring(feedback, context_data)
            
            # Process and validate AI response
            processed_result = await self._process_urgency_response(llm_response, feedback, context_data)
            
            # Cache the result
            cache.set(cache_key, processed_result, self.cache_ttl)
            
            logger.info(f"Urgency analysis completed for feedback {feedback.tracking_id}: {processed_result['urgency_level']} ({processed_result['urgency_score']:.1f}/10)")
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Urgency analysis failed for feedback {feedback.id}: {e}")
            return await self._fallback_urgency_scoring(feedback, {})
    
    async def _gather_urgency_context(self, feedback) -> Dict:
        """📊 Gather context for intelligent urgency assessment"""
        try:
            # Get similar unresolved issues in area
            similar_unresolved = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=feedback.county,
                    category=feedback.category,
                    status__in=['pending', 'in_review'],
                    created_at__gte=timezone.now() - timedelta(days=14)
                ).count()
            )
            
            # Get recent escalations in county
            recent_escalations = await self._count_recent_escalations(feedback.county)
            
            # Get county capacity metrics
            county_metrics = await self._get_county_capacity_metrics(feedback.county)
            
            # Analyze population impact
            population_impact = await self._assess_population_impact(feedback)
            
            # Get seasonal urgency factors
            seasonal_factors = self._get_seasonal_urgency_factors(feedback.created_at, feedback.category)
            
            # Check for infrastructure criticality
            infrastructure_criticality = self._assess_infrastructure_criticality(feedback)
            
            # Get historical issue patterns
            historical_patterns = await self._get_historical_patterns(feedback)
            
            return {
                'feedback_content': feedback.content,
                'feedback_title': feedback.title,
                'category': feedback.category,
                'category_display': feedback.get_category_display(),
                'priority_level': feedback.priority,
                'county_name': feedback.county.name,
                'location_details': self._format_detailed_location(feedback),
                'similar_unresolved_count': similar_unresolved,
                'recent_escalations_count': recent_escalations,
                'county_capacity_score': county_metrics.get('capacity_score', 5.0),
                'county_response_efficiency': county_metrics.get('response_efficiency', 0.7),
                'estimated_affected_population': population_impact['estimated_population'],
                'geographic_scope': population_impact['geographic_scope'],
                'time_of_day': feedback.created_at.hour,
                'day_of_week': feedback.created_at.strftime('%A'),
                'seasonal_context': seasonal_factors['season'],
                'seasonal_urgency_multiplier': seasonal_factors['urgency_multiplier'],
                'infrastructure_criticality': infrastructure_criticality,
                'historical_escalation_probability': historical_patterns.get('escalation_probability', 0.3),
                'similar_issue_resolution_time': historical_patterns.get('avg_resolution_days', 7),
                'community_vulnerability_score': population_impact['vulnerability_score'],
                'resource_availability': county_metrics.get('resource_availability', 'medium'),
                'is_weekend': feedback.created_at.weekday() >= 5,
                'submission_method': feedback.submitted_via,
                'is_anonymous': feedback.is_anonymous,
            }
            
        except Exception as e:
            logger.error(f"Failed to gather urgency context: {e}")
            return {
                'feedback_content': feedback.content,
                'category': feedback.category,
                'county_name': feedback.county.name,
                'priority_level': feedback.priority,
            }
    
    async def _count_recent_escalations(self, county) -> int:
        """Count recent feedback escalations in the county"""
        try:
            # Look for feedback that had rapid status changes or high urgency
            escalations = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=county,
                    created_at__gte=timezone.now() - timedelta(days=30),
                    priority__in=['high', 'urgent']
                ).filter(
                    Q(response_count__gte=3) |  # Multiple responses (indicates complexity)
                    Q(view_count__gte=20)      # High visibility (public attention)
                ).count()
            )
            return escalations
        except Exception:
            return 0
    
    async def _get_county_capacity_metrics(self, county) -> Dict:
        """Assess county's capacity to handle issues"""
        try:
            # Get recent resolution performance
            recent_feedback = await asyncio.to_thread(
                lambda: list(Feedback.objects.filter(
                    county=county,
                    created_at__gte=timezone.now() - timedelta(days=60),
                    status__in=['resolved', 'closed', 'responded']
                ).values('created_at', 'updated_at', 'status', 'category'))
            )
            
            if not recent_feedback:
                return {
                    'capacity_score': 5.0,
                    'response_efficiency': 0.7,
                    'resource_availability': 'medium'
                }
            
            # Calculate response efficiency
            resolved_count = len([f for f in recent_feedback if f['status'] in ['resolved', 'closed']])
            response_efficiency = resolved_count / len(recent_feedback) if recent_feedback else 0.7
            
            # Calculate average resolution time
            resolution_times = []
            for item in recent_feedback:
                if item['status'] in ['resolved', 'closed'] and item['updated_at']:
                    delta = item['updated_at'] - item['created_at']
                    resolution_times.append(delta.days)
            
            avg_resolution_days = sum(resolution_times) / len(resolution_times) if resolution_times else 7
            
            # Calculate capacity score (1-10 scale)
            if avg_resolution_days <= 2:
                capacity_score = 9.0
            elif avg_resolution_days <= 5:
                capacity_score = 7.0
            elif avg_resolution_days <= 10:
                capacity_score = 5.0
            elif avg_resolution_days <= 20:
                capacity_score = 3.0
            else:
                capacity_score = 2.0
            
            # Adjust for response efficiency
            capacity_score *= (0.5 + response_efficiency * 0.5)
            
            # Determine resource availability
            if capacity_score >= 7:
                resource_availability = 'high'
            elif capacity_score >= 4:
                resource_availability = 'medium'
            else:
                resource_availability = 'low'
            
            return {
                'capacity_score': round(capacity_score, 1),
                'response_efficiency': round(response_efficiency, 2),
                'resource_availability': resource_availability,
                'avg_resolution_days': round(avg_resolution_days, 1),
                'sample_size': len(recent_feedback)
            }
            
        except Exception as e:
            logger.error(f"Failed to get county capacity metrics: {e}")
            return {
                'capacity_score': 5.0,
                'response_efficiency': 0.7,
                'resource_availability': 'medium'
            }
    
    async def _assess_population_impact(self, feedback) -> Dict:
        """Assess the potential population impact of the issue"""
        try:
            # Estimate affected population based on location hierarchy
            if feedback.village:
                estimated_population = 200  # Village level
                geographic_scope = 'village'
                vulnerability_score = 6.0
            elif feedback.ward:
                estimated_population = 2000  # Ward level
                geographic_scope = 'ward'
                vulnerability_score = 7.0
            elif feedback.sub_county:
                estimated_population = 15000  # Sub-county level
                geographic_scope = 'sub_county'
                vulnerability_score = 8.0
            else:
                estimated_population = 50000  # County level
                geographic_scope = 'county'
                vulnerability_score = 9.0
            
            # Adjust based on category
            category_multipliers = {
                'water_sanitation': 1.5,  # Water affects everyone
                'healthcare': 1.3,        # Health is critical
                'infrastructure': 1.2,   # Roads affect mobility
                'security': 1.4,          # Safety affects all activities
                'education': 1.1,         # Affects families with children
                'environment': 1.0,       # Baseline
                'governance': 0.8,        # Administrative
                'economic': 0.9,          # Economic impact varies
                'other': 0.7              # Unknown impact
            }
            
            multiplier = category_multipliers.get(feedback.category, 1.0)
            adjusted_population = int(estimated_population * multiplier)
            
            # Assess vulnerability based on area type and category
            if feedback.category in ['healthcare', 'water_sanitation', 'security']:
                vulnerability_score += 2.0
            elif feedback.category in ['infrastructure', 'education']:
                vulnerability_score += 1.0
            
            vulnerability_score = min(10.0, vulnerability_score)
            
            return {
                'estimated_population': adjusted_population,
                'geographic_scope': geographic_scope,
                'vulnerability_score': vulnerability_score,
                'category_multiplier': multiplier
            }
            
        except Exception:
            return {
                'estimated_population': 1000,
                'geographic_scope': 'neighborhood',
                'vulnerability_score': 5.0,
                'category_multiplier': 1.0
            }
    
    def _get_seasonal_urgency_factors(self, timestamp, category) -> Dict:
        """Get seasonal factors that affect urgency"""
        month = timestamp.month
        
        # Seasonal mappings
        if month in [3, 4, 5, 10, 11, 12]:  # Rainy seasons
            season = 'rainy'
            seasonal_urgency = {
                'infrastructure': 1.5,     # Roads become critical
                'water_sanitation': 1.3,   # Drainage and contamination
                'healthcare': 1.2,         # Disease risk increases
                'education': 1.4,          # School access affected
                'environment': 1.2,        # Flooding and waste
                'security': 1.1,           # Increased risks
                'governance': 1.0,         # Normal
                'economic': 1.1,           # Market access
                'other': 1.0
            }
        elif month in [6, 7, 8, 1, 2]:  # Dry seasons
            season = 'dry'
            seasonal_urgency = {
                'water_sanitation': 1.6,   # Water scarcity critical
                'healthcare': 1.2,         # Dust, respiratory issues
                'infrastructure': 1.1,     # Dust and maintenance
                'environment': 1.3,        # Fire risk, air quality
                'education': 1.0,          # Normal
                'security': 1.0,           # Normal
                'governance': 1.0,         # Normal
                'economic': 1.2,           # Agricultural stress
                'other': 1.0
            }
        else:  # Transition periods
            season = 'transition'
            seasonal_urgency = {category: 1.0 for category in [
                'infrastructure', 'healthcare', 'education', 'water_sanitation',
                'security', 'environment', 'governance', 'economic', 'other'
            ]}
        
        return {
            'season': season,
            'urgency_multiplier': seasonal_urgency.get(category, 1.0)
        }
    
    def _assess_infrastructure_criticality(self, feedback) -> str:
        """Assess infrastructure criticality from content"""
        content_lower = feedback.content.lower()
        title_lower = feedback.title.lower()
        full_text = f"{title_lower} {content_lower}"
        
        critical_keywords = [
            'collapsed', 'completely blocked', 'impassable', 'no access',
            'bridge down', 'road closed', 'water main burst', 'power out',
            'hospital equipment', 'school roof', 'market closed'
        ]
        
        high_keywords = [
            'major damage', 'severely damaged', 'unsafe', 'dangerous',
            'poor condition', 'urgent repair', 'immediate attention'
        ]
        
        medium_keywords = [
            'needs repair', 'maintenance required', 'improvement needed',
            'should be fixed', 'requires attention'
        ]
        
        if any(keyword in full_text for keyword in critical_keywords):
            return 'critical'
        elif any(keyword in full_text for keyword in high_keywords):
            return 'high'
        elif any(keyword in full_text for keyword in medium_keywords):
            return 'medium'
        else:
            return 'low'
    
    async def _get_historical_patterns(self, feedback) -> Dict:
        """Get historical patterns for similar issues"""
        try:
            # Get similar feedback from past 6 months
            similar_feedback = await asyncio.to_thread(
                lambda: list(Feedback.objects.filter(
                    county=feedback.county,
                    category=feedback.category,
                    created_at__gte=timezone.now() - timedelta(days=180),
                    status__in=['resolved', 'closed']
                ).values('created_at', 'updated_at', 'view_count', 'response_count'))
            )
            
            if not similar_feedback:
                return {
                    'escalation_probability': 0.3,
                    'avg_resolution_days': 7
                }
            
            # Calculate escalation probability (high view/response count indicates complexity)
            escalated_count = len([
                f for f in similar_feedback 
                if f['view_count'] > 10 or f['response_count'] > 2
            ])
            escalation_probability = escalated_count / len(similar_feedback)
            
            # Calculate average resolution time
            resolution_times = []
            for item in similar_feedback:
                if item['updated_at']:
                    delta = item['updated_at'] - item['created_at']
                    resolution_times.append(delta.days)
            
            avg_resolution_days = sum(resolution_times) / len(resolution_times) if resolution_times else 7
            
            return {
                'escalation_probability': round(escalation_probability, 2),
                'avg_resolution_days': round(avg_resolution_days, 1),
                'sample_size': len(similar_feedback)
            }
            
        except Exception:
            return {
                'escalation_probability': 0.3,
                'avg_resolution_days': 7
            }
    
    def _format_detailed_location(self, feedback) -> str:
        """Format detailed location for context"""
        parts = []
        
        if feedback.county:
            parts.append(f"County: {feedback.county.name}")
        if feedback.sub_county:
            parts.append(f"Sub-County: {feedback.sub_county.name}")
        if feedback.ward:
            parts.append(f"Ward: {feedback.ward.name}")
        if feedback.village:
            parts.append(f"Village: {feedback.village.name}")
        
        return " | ".join(parts)
    
    async def _process_urgency_response(self, llm_response: Dict, feedback, context_data: Dict) -> Dict:
        """Process and validate LLM urgency response"""
        try:
            # Validate urgency score
            urgency_score = float(llm_response.get('urgency_score', 5.0))
            urgency_score = max(1.0, min(10.0, urgency_score))
            
            # Validate urgency level
            valid_levels = ['low', 'medium', 'high', 'critical']
            urgency_level = llm_response.get('urgency_level', '').lower()
            if urgency_level not in valid_levels:
                # Infer from score
                if urgency_score >= 8.5:
                    urgency_level = 'critical'
                elif urgency_score >= 6.5:
                    urgency_level = 'high'
                elif urgency_score >= 4.0:
                    urgency_level = 'medium'
                else:
                    urgency_level = 'low'
            
            # Validate escalation risk
            escalation_risk = float(llm_response.get('escalation_risk', 0.3))
            escalation_risk = max(0.0, min(1.0, escalation_risk))
            
            # Get response timeframe
            response_timeframe = llm_response.get('recommended_response_timeframe', '3_days')
            
            # Determine if immediate alerts are needed
            alert_officials = (
                urgency_score >= 8.0 or 
                escalation_risk >= 0.8 or
                llm_response.get('alert_officials', False)
            )
            
            processed_result = {
                'urgency_score': urgency_score,
                'urgency_level': urgency_level,
                'escalation_risk': escalation_risk,
                'reasoning': llm_response.get('reasoning', 'AI urgency assessment completed'),
                'time_sensitive_factors': llm_response.get('time_sensitive_factors', []),
                'community_impact_scale': llm_response.get('community_impact_scale', 'neighborhood'),
                'affected_population_estimate': llm_response.get('affected_population_estimate', 
                                                              context_data.get('estimated_affected_population', 1000)),
                'resource_requirements': llm_response.get('resource_requirements', 'moderate'),
                'similar_issue_precedents': llm_response.get('similar_issue_precedents', 'No historical data'),
                'seasonal_considerations': llm_response.get('seasonal_considerations', 'Standard seasonal factors'),
                'recommended_response_timeframe': response_timeframe,
                'alert_officials': alert_officials,
                'analysis_timestamp': timezone.now().isoformat(),
                'model_version': '1.0',
                'context_factors_used': list(context_data.keys()),
                'raw_llm_response': llm_response
            }
            
            return processed_result
            
        except Exception as e:
            logger.error(f"Failed to process urgency response: {e}")
            return await self._fallback_urgency_scoring(feedback, context_data)
    
    async def _fallback_urgency_scoring(self, feedback, context_data: Dict) -> Dict:
        """Fallback urgency scoring using rule-based system"""
        try:
            # Base urgency from priority level
            priority_scores = {
                'low': 2.0,
                'medium': 5.0,
                'high': 7.0,
                'urgent': 9.0
            }
            base_score = priority_scores.get(feedback.priority, 5.0)
            
            # Category urgency multipliers
            category_urgency = {
                'healthcare': 1.3,
                'security': 1.3,
                'water_sanitation': 1.2,
                'infrastructure': 1.1,
                'education': 1.0,
                'environment': 0.9,
                'governance': 0.8,
                'economic': 0.8,
                'other': 0.7
            }
            
            urgency_score = base_score * category_urgency.get(feedback.category, 1.0)
            
            # Apply seasonal factors if available
            seasonal_multiplier = context_data.get('seasonal_urgency_multiplier', 1.0)
            urgency_score *= seasonal_multiplier
            
            # Adjust for infrastructure criticality
            criticality = context_data.get('infrastructure_criticality', 'medium')
            if criticality == 'critical':
                urgency_score += 2.0
            elif criticality == 'high':
                urgency_score += 1.0
            
            # Adjust for population impact
            population = context_data.get('estimated_affected_population', 1000)
            if population > 10000:
                urgency_score += 1.5
            elif population > 2000:
                urgency_score += 1.0
            elif population > 500:
                urgency_score += 0.5
            
            # Cap the score
            urgency_score = max(1.0, min(10.0, urgency_score))
            
            # Determine urgency level
            if urgency_score >= 8.5:
                urgency_level = 'critical'
            elif urgency_score >= 6.5:
                urgency_level = 'high'
            elif urgency_score >= 4.0:
                urgency_level = 'medium'
            else:
                urgency_level = 'low'
            
            # Simple escalation risk
            escalation_risk = min(0.8, urgency_score / 10.0 * 0.6)
            
            return {
                'urgency_score': round(urgency_score, 1),
                'urgency_level': urgency_level,
                'escalation_risk': round(escalation_risk, 2),
                'reasoning': 'Rule-based urgency assessment using priority, category, and context factors',
                'time_sensitive_factors': ['Priority level', 'Category type', 'Population impact'],
                'community_impact_scale': 'neighborhood',
                'affected_population_estimate': context_data.get('estimated_affected_population', 1000),
                'resource_requirements': 'moderate',
                'recommended_response_timeframe': '3_days' if urgency_score < 7 else '24_hours',
                'alert_officials': urgency_score >= 8.0,
                'analysis_timestamp': timezone.now().isoformat(),
                'model_version': 'fallback_1.0',
                'fallback_used': True
            }
            
        except Exception as e:
            logger.error(f"Fallback urgency scoring failed: {e}")
            return {
                'urgency_score': 5.0,
                'urgency_level': 'medium',
                'escalation_risk': 0.3,
                'reasoning': 'Default urgency assessment due to processing error',
                'alert_officials': False,
                'analysis_timestamp': timezone.now().isoformat(),
                'model_version': 'default_1.0',
                'error': str(e)
            }
    
    async def calculate_batch_urgency(self, feedback_ids: List[int]) -> Dict[int, Dict]:
        """🔄 Calculate urgency for multiple feedback items efficiently"""
        results = {}
        
        # Get feedback objects
        feedback_items = await asyncio.to_thread(
            lambda: list(Feedback.objects.filter(id__in=feedback_ids).select_related('county'))
        )
        
        # Process in parallel with rate limiting
        semaphore = asyncio.Semaphore(5)  # Limit concurrent AI calls
        
        async def score_single(feedback):
            async with semaphore:
                return await self.calculate_intelligent_urgency(feedback)
        
        # Run urgency scoring for all items
        tasks = [score_single(feedback) for feedback in feedback_items]
        urgency_results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Compile results
        for feedback, result in zip(feedback_items, urgency_results):
            if isinstance(result, Exception):
                logger.error(f"Batch urgency scoring failed for feedback {feedback.id}: {result}")
                results[feedback.id] = await self._fallback_urgency_scoring(feedback, {})
            else:
                results[feedback.id] = result
        
        logger.info(f"Batch urgency scoring completed for {len(results)} feedback items")
        return results


# Singleton instance for application use
urgency_scorer = LLMUrgencyScorer()


# Utility functions for easy access
async def calculate_urgency(feedback) -> Dict:
    """Quick urgency calculation for single feedback"""
    return await urgency_scorer.calculate_intelligent_urgency(feedback)


async def calculate_urgency_batch(feedback_ids: List[int]) -> Dict:
    """Quick batch urgency calculation"""
    return await urgency_scorer.calculate_batch_urgency(feedback_ids)
    