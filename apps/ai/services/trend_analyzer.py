# =============================================================================
# FILE: apps/ai/services/trend_analyzer.py
# =============================================================================
import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import timedelta, datetime
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Avg, Q, Max, Min
from django.db.models.functions import TruncDate, TruncWeek, TruncMonth

from .llm_client import llm_client, get_json_response
from .prompt_templates import TrendAnalysisPrompts
from apps.feedback.models import Feedback
from apps.users.models import County


logger = logging.getLogger('apps.ai.services')


class LLMTrendAnalyzer:
    """
    📊 AWARD-WINNING: AI-Powered Trend Analysis and Predictions
    
    Analyzes feedback patterns to provide actionable insights for:
    - Emerging issue detection and early warning
    - Resource allocation optimization
    - Seasonal preparation and planning
    - Performance monitoring and improvement
    - Predictive governance for proactive response
    """
    
    def __init__(self):
        self.llm_client = llm_client
        self.prompts = TrendAnalysisPrompts()
        self.cache_ttl = 3600  # 1 hour cache for trend analysis
    
    async def analyze_county_trends(
        self, 
        county, 
        analysis_period_days: int = 30,
        include_predictions: bool = True
    ) -> Dict:
        """
        🎯 Comprehensive trend analysis for a county
        
        Args:
            county: County model instance
            analysis_period_days: Number of days to analyze
            include_predictions: Whether to include AI predictions
            
        Returns:
            Dictionary with comprehensive trend analysis and insights
        """
        try:
            # Check cache first
            cache_key = f"county_trends_{county.id}_{analysis_period_days}_{include_predictions}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Using cached trend analysis for county {county.name}")
                return cached_result
            
            # Gather comprehensive trend data
            trend_data = await self._gather_trend_data(county, analysis_period_days)
            
            if not trend_data['has_sufficient_data']:
                return self._insufficient_data_response(county, analysis_period_days)
            
            # Generate AI analysis of trends
            ai_insights = await self._generate_ai_trend_insights(county, trend_data)
            
            # Generate predictions if requested
            predictions = {}
            if include_predictions:
                predictions = await self._generate_trend_predictions(county, trend_data)
            
            # Compile comprehensive analysis
            analysis_result = {
                'county_name': county.name,
                'analysis_period': {
                    'start_date': trend_data['period_start'].isoformat(),
                    'end_date': trend_data['period_end'].isoformat(),
                    'days_analyzed': analysis_period_days,
                    'total_feedback': trend_data['total_feedback']
                },
                'volume_trends': trend_data['volume_trends'],
                'category_analysis': trend_data['category_analysis'],
                'sentiment_trends': trend_data['sentiment_trends'],
                'urgency_patterns': trend_data['urgency_patterns'],
                'geographic_distribution': trend_data['geographic_distribution'],
                'response_performance': trend_data['response_performance'],
                'ai_insights': ai_insights,
                'predictions': predictions,
                'recommendations': await self._generate_recommendations(county, trend_data, ai_insights),
                'analysis_metadata': {
                    'generated_at': timezone.now().isoformat(),
                    'model_version': '1.0',
                    'confidence_score': self._calculate_confidence_score(trend_data),
                    'data_quality_score': self._assess_data_quality(trend_data)
                }
            }
            
            # Cache the result
            cache.set(cache_key, analysis_result, self.cache_ttl)
            
            logger.info(f"Trend analysis completed for {county.name}: {trend_data['total_feedback']} feedback items analyzed")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"Trend analysis failed for county {county.name}: {e}")
            return self._error_response(county, str(e))
    
    async def _gather_trend_data(self, county, analysis_period_days: int) -> Dict:
        """📊 Gather comprehensive trend data from database"""
        try:
            period_start = timezone.now() - timedelta(days=analysis_period_days)
            period_end = timezone.now()
            
            # Get base feedback queryset
            feedback_qs = Feedback.objects.filter(
                county=county,
                created_at__gte=period_start,
                created_at__lte=period_end
            )
            
            total_feedback = await asyncio.to_thread(feedback_qs.count)
            
            if total_feedback < 5:  # Insufficient data
                return {
                    'has_sufficient_data': False,
                    'total_feedback': total_feedback,
                    'period_start': period_start,
                    'period_end': period_end
                }
            
            # Volume trends over time
            volume_trends = await self._analyze_volume_trends(feedback_qs, period_start, period_end)
            
            # Category analysis
            category_analysis = await self._analyze_category_trends(feedback_qs)
            
            # Sentiment trends (if AI analysis available)
            sentiment_trends = await self._analyze_sentiment_trends(feedback_qs)
            
            # Urgency patterns
            urgency_patterns = await self._analyze_urgency_patterns(feedback_qs)
            
            # Geographic distribution
            geographic_distribution = await self._analyze_geographic_trends(feedback_qs)
            
            # Response performance metrics
            response_performance = await self._analyze_response_performance(feedback_qs)
            
            return {
                'has_sufficient_data': True,
                'total_feedback': total_feedback,
                'period_start': period_start,
                'period_end': period_end,
                'volume_trends': volume_trends,
                'category_analysis': category_analysis,
                'sentiment_trends': sentiment_trends,
                'urgency_patterns': urgency_patterns,
                'geographic_distribution': geographic_distribution,
                'response_performance': response_performance
            }
            
        except Exception as e:
            logger.error(f"Failed to gather trend data: {e}")
            return {
                'has_sufficient_data': False,
                'error': str(e)
            }
    
    async def _analyze_volume_trends(self, feedback_qs, period_start, period_end) -> Dict:
        """Analyze feedback volume trends over time"""
        try:
            # Daily volume trends
            daily_volumes = await asyncio.to_thread(
                lambda: list(feedback_qs.annotate(
                    date=TruncDate('created_at')
                ).values('date').annotate(
                    count=Count('id')
                ).order_by('date'))
            )
            
            # Weekly comparison (current period vs previous period)
            previous_period_start = period_start - (period_end - period_start)
            previous_volume = await asyncio.to_thread(
                lambda: feedback_qs.model.objects.filter(
                    county=feedback_qs.first().county if feedback_qs.exists() else None,
                    created_at__gte=previous_period_start,
                    created_at__lt=period_start
                ).count()
            ) if feedback_qs.exists() else 0
            
            current_volume = len(daily_volumes) and sum(item['count'] for item in daily_volumes) or 0
            
            # Calculate trends
            volume_change = 0
            if previous_volume > 0:
                volume_change = ((current_volume - previous_volume) / previous_volume) * 100
            
            # Identify peak days
            peak_days = sorted(daily_volumes, key=lambda x: x['count'], reverse=True)[:3]
            
            return {
                'daily_volumes': daily_volumes,
                'current_period_total': current_volume,
                'previous_period_total': previous_volume,
                'volume_change_percent': round(volume_change, 1),
                'trend_direction': 'increasing' if volume_change > 5 else ('decreasing' if volume_change < -5 else 'stable'),
                'peak_days': peak_days,
                'average_daily_volume': round(current_volume / max(1, len(daily_volumes)), 1)
            }
            
        except Exception as e:
            logger.error(f"Volume trend analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_category_trends(self, feedback_qs) -> Dict:
        """Analyze trends by feedback category"""
        try:
            # Category distribution
            category_counts = await asyncio.to_thread(
                lambda: list(feedback_qs.values('category').annotate(
                    count=Count('id'),
                    avg_priority_score=Avg('id')  # Placeholder for priority scoring
                ).order_by('-count'))
            )
            
            # Category growth rates (compare with previous period)
            category_trends = {}
            for cat_data in category_counts:
                category = cat_data['category']
                current_count = cat_data['count']
                
                # Get previous period count for this category
                previous_count = await asyncio.to_thread(
                    lambda: feedback_qs.model.objects.filter(
                        county=feedback_qs.first().county if feedback_qs.exists() else None,
                        category=category,
                        created_at__lt=feedback_qs.earliest('created_at').created_at if feedback_qs.exists() else timezone.now()
                    ).count()
                )
                
                growth_rate = 0
                if previous_count > 0:
                    growth_rate = ((current_count - previous_count) / previous_count) * 100
                
                category_trends[category] = {
                    'current_count': current_count,
                    'previous_count': previous_count,
                    'growth_rate_percent': round(growth_rate, 1),
                    'trend_status': 'growing' if growth_rate > 10 else ('declining' if growth_rate < -10 else 'stable')
                }
            
            # Identify emerging and declining categories
            emerging_categories = [
                cat for cat, data in category_trends.items() 
                if data['growth_rate_percent'] > 20
            ]
            
            declining_categories = [
                cat for cat, data in category_trends.items() 
                if data['growth_rate_percent'] < -20
            ]
            
            return {
                'category_distribution': category_counts,
                'category_trends': category_trends,
                'emerging_categories': emerging_categories,
                'declining_categories': declining_categories,
                'top_categories': [item['category'] for item in category_counts[:3]]
            }
            
        except Exception as e:
            logger.error(f"Category trend analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_sentiment_trends(self, feedback_qs) -> Dict:
        """Analyze sentiment trends (if AI analysis available)"""
        try:
            # Get feedback with AI analysis
            feedback_with_ai = feedback_qs.filter(ai_analysis__isnull=False)
            
            if not await asyncio.to_thread(feedback_with_ai.exists):
                return {
                    'has_sentiment_data': False,
                    'message': 'No AI sentiment analysis data available'
                }
            
            # Sentiment distribution
            sentiment_dist = await asyncio.to_thread(
                lambda: list(feedback_with_ai.values('ai_analysis__sentiment_label').annotate(
                    count=Count('id')
                ))
            )
            
            # Average sentiment score over time
            daily_sentiment = await asyncio.to_thread(
                lambda: list(feedback_with_ai.annotate(
                    date=TruncDate('created_at')
                ).values('date').annotate(
                    avg_sentiment=Avg('ai_analysis__sentiment_score'),
                    count=Count('id')
                ).order_by('date'))
            )
            
            # Sentiment by category
            category_sentiment = await asyncio.to_thread(
                lambda: list(feedback_with_ai.values('category').annotate(
                    avg_sentiment=Avg('ai_analysis__sentiment_score'),
                    count=Count('id')
                ).order_by('avg_sentiment'))
            )
            
            # Calculate overall sentiment trend
            if daily_sentiment:
                recent_sentiment = sum(item['avg_sentiment'] or 0 for item in daily_sentiment[-7:]) / min(7, len(daily_sentiment))
                early_sentiment = sum(item['avg_sentiment'] or 0 for item in daily_sentiment[:7]) / min(7, len(daily_sentiment))
                sentiment_trend = 'improving' if recent_sentiment > early_sentiment + 0.1 else ('declining' if recent_sentiment < early_sentiment - 0.1 else 'stable')
            else:
                sentiment_trend = 'unknown'
            
            return {
                'has_sentiment_data': True,
                'sentiment_distribution': sentiment_dist,
                'daily_sentiment_trends': daily_sentiment,
                'category_sentiment': category_sentiment,
                'overall_sentiment_trend': sentiment_trend,
                'analysis_coverage': await asyncio.to_thread(feedback_with_ai.count)
            }
            
        except Exception as e:
            logger.error(f"Sentiment trend analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_urgency_patterns(self, feedback_qs) -> Dict:
        """Analyze urgency and priority patterns"""
        try:
            # Priority distribution
            priority_dist = await asyncio.to_thread(
                lambda: list(feedback_qs.values('priority').annotate(
                    count=Count('id')
                ).order_by('-count'))
            )
            
            # Urgency trends over time (if AI analysis available)
            urgency_trends = []
            feedback_with_urgency = feedback_qs.filter(ai_analysis__isnull=False)
            
            if await asyncio.to_thread(feedback_with_urgency.exists):
                urgency_trends = await asyncio.to_thread(
                    lambda: list(feedback_with_urgency.annotate(
                        date=TruncDate('created_at')
                    ).values('date').annotate(
                        avg_urgency=Avg('ai_analysis__urgency_score'),
                        high_urgency_count=Count('id', filter=Q(ai_analysis__urgency_level__in=['high', 'critical']))
                    ).order_by('date'))
                )
            
            # High urgency feedback analysis
            high_urgency_feedback = await asyncio.to_thread(
                lambda: feedback_qs.filter(
                    Q(priority__in=['high', 'urgent']) |
                    Q(ai_analysis__urgency_level__in=['high', 'critical'])
                ).count()
            )
            
            high_urgency_categories = await asyncio.to_thread(
                lambda: list(feedback_qs.filter(
                    Q(priority__in=['high', 'urgent']) |
                    Q(ai_analysis__urgency_level__in=['high', 'critical'])
                ).values('category').annotate(
                    count=Count('id')
                ).order_by('-count')[:5])
            )
            
            return {
                'priority_distribution': priority_dist,
                'urgency_trends_over_time': urgency_trends,
                'high_urgency_count': high_urgency_feedback,
                'high_urgency_categories': high_urgency_categories,
                'urgency_rate_percent': round((high_urgency_feedback / max(1, await asyncio.to_thread(feedback_qs.count))) * 100, 1)
            }
            
        except Exception as e:
            logger.error(f"Urgency pattern analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_geographic_trends(self, feedback_qs) -> Dict:
        """Analyze geographic distribution and trends"""
        try:
            # Sub-county distribution
            sub_county_dist = await asyncio.to_thread(
                lambda: list(feedback_qs.filter(sub_county__isnull=False).values(
                    'sub_county__name'
                ).annotate(
                    count=Count('id')
                ).order_by('-count'))
            )
            
            # Ward distribution (top 10)
            ward_dist = await asyncio.to_thread(
                lambda: list(feedback_qs.filter(ward__isnull=False).values(
                    'ward__name'
                ).annotate(
                    count=Count('id')
                ).order_by('-count')[:10])
            )
            
            # Geographic hotspots (areas with high feedback volume)
            hotspots = []
            for item in sub_county_dist[:5]:  # Top 5 sub-counties
                sub_county_name = item['sub_county__name']
                count = item['count']
                
                # Get category breakdown for this sub-county
                sub_county_categories = await asyncio.to_thread(
                    lambda: list(feedback_qs.filter(
                        sub_county__name=sub_county_name
                    ).values('category').annotate(
                        count=Count('id')
                    ).order_by('-count')[:3])
                )
                
                hotspots.append({
                    'area_name': sub_county_name,
                    'feedback_count': count,
                    'top_categories': sub_county_categories
                })
            
            return {
                'sub_county_distribution': sub_county_dist,
                'ward_distribution': ward_dist,
                'geographic_hotspots': hotspots,
                'areas_with_no_feedback': await self._identify_silent_areas(feedback_qs)
            }
            
        except Exception as e:
            logger.error(f"Geographic trend analysis failed: {e}")
            return {'error': str(e)}
    
    async def _analyze_response_performance(self, feedback_qs) -> Dict:
        """Analyze government response performance trends"""
        try:
            # Overall response statistics
            total_feedback = await asyncio.to_thread(feedback_qs.count)
            responded_feedback = await asyncio.to_thread(
                lambda: feedback_qs.filter(response_count__gt=0).count()
            )
            resolved_feedback = await asyncio.to_thread(
                lambda: feedback_qs.filter(status__in=['resolved', 'closed']).count()
            )
            
            response_rate = (responded_feedback / max(1, total_feedback)) * 100
            resolution_rate = (resolved_feedback / max(1, total_feedback)) * 100
            
            # Average response time
            feedback_with_responses = feedback_qs.filter(
                response_count__gt=0,
                last_response_at__isnull=False
            )
            
            avg_response_time_hours = 0
            if await asyncio.to_thread(feedback_with_responses.exists):
                response_times = []
                async for feedback in feedback_with_responses.aiterator():
                    if feedback.last_response_at:
                        delta = feedback.last_response_at - feedback.created_at
                        response_times.append(delta.total_seconds() / 3600)  # Convert to hours
                
                if response_times:
                    avg_response_time_hours = sum(response_times) / len(response_times)
            
            # Response performance by category
            category_performance = await asyncio.to_thread(
                lambda: list(feedback_qs.values('category').annotate(
                    total_count=Count('id'),
                    responded_count=Count('id', filter=Q(response_count__gt=0)),
                    resolved_count=Count('id', filter=Q(status__in=['resolved', 'closed']))
                ).order_by('-total_count'))
            )
            
            # Add response rates to category performance
            for cat in category_performance:
                cat['response_rate'] = round((cat['responded_count'] / max(1, cat['total_count'])) * 100, 1)
                cat['resolution_rate'] = round((cat['resolved_count'] / max(1, cat['total_count'])) * 100, 1)
            
            return {
                'overall_response_rate': round(response_rate, 1),
                'overall_resolution_rate': round(resolution_rate, 1),
                'average_response_time_hours': round(avg_response_time_hours, 1),
                'category_performance': category_performance,
                'performance_grade': self._calculate_performance_grade(response_rate, resolution_rate, avg_response_time_hours)
            }
            
        except Exception as e:
            logger.error(f"Response performance analysis failed: {e}")
            return {'error': str(e)}
    
    async def _generate_ai_trend_insights(self, county, trend_data: Dict) -> Dict:
        """Generate AI insights from trend data"""
        try:
            # Prepare context for AI analysis
            context = {
                'county_name': county.name,
                'analysis_period_days': (trend_data['period_end'] - trend_data['period_start']).days,
                'total_feedback': trend_data['total_feedback'],
                'volume_trend': trend_data.get('volume_trends', {}).get('trend_direction', 'unknown'),
                'volume_change_percent': trend_data.get('volume_trends', {}).get('volume_change_percent', 0),
                'top_categories': trend_data.get('category_analysis', {}).get('top_categories', []),
                'emerging_categories': trend_data.get('category_analysis', {}).get('emerging_categories', []),
                'response_rate': trend_data.get('response_performance', {}).get('overall_response_rate', 0),
                'resolution_rate': trend_data.get('response_performance', {}).get('overall_resolution_rate', 0),
                'avg_response_time_hours': trend_data.get('response_performance', {}).get('average_response_time_hours', 48),
                'geographic_hotspots': [h['area_name'] for h in trend_data.get('geographic_distribution', {}).get('geographic_hotspots', [])],
                'high_urgency_rate': trend_data.get('urgency_patterns', {}).get('urgency_rate_percent', 0),
                'sentiment_trend': trend_data.get('sentiment_trends', {}).get('overall_sentiment_trend', 'unknown')
            }
            
            # Get AI analysis
            prompt = self.prompts.get_trend_analysis_prompt()
            ai_response = await get_json_response(prompt, context)
            
            if ai_response:
                return self._process_ai_insights(ai_response)
            else:
                return self._fallback_insights(trend_data)
            
        except Exception as e:
            logger.error(f"AI trend insights generation failed: {e}")
            return self._fallback_insights(trend_data)
    
    def _process_ai_insights(self, ai_response: Dict) -> Dict:
        """Process AI insights response"""
        try:
            return {
                'trend_summary': ai_response.get('trend_summary', 'No summary available'),
                'emerging_issues': ai_response.get('emerging_issues', []),
                'success_patterns': ai_response.get('success_patterns', []),
                'priority_recommendations': ai_response.get('priority_recommendations', []),
                'seasonal_preparations': ai_response.get('seasonal_preparations', {}),
                'risk_assessment': ai_response.get('risk_assessment', {}),
                'confidence_score': 0.8,
                'ai_generated': True
            }
        except Exception as e:
            logger.error(f"Failed to process AI insights: {e}")
            return self._fallback_insights({})
    
    def _fallback_insights(self, trend_data: Dict) -> Dict:
        """Generate fallback insights using rule-based analysis"""
        insights = {
            'trend_summary': 'Trend analysis completed using statistical methods',
            'emerging_issues': [],
            'success_patterns': [],
            'priority_recommendations': [],
            'confidence_score': 0.6,
            'ai_generated': False
        }
        
        # Generate basic insights from trend data
        volume_trends = trend_data.get('volume_trends', {})
        if volume_trends.get('volume_change_percent', 0) > 20:
            insights['emerging_issues'].append({
                'issue': 'Significant increase in feedback volume',
                'trend_direction': 'increasing',
                'confidence': 0.9
            })
        
        category_analysis = trend_data.get('category_analysis', {})
        emerging_cats = category_analysis.get('emerging_categories', [])
        for category in emerging_cats:
            insights['emerging_issues'].append({
                'issue': f'Growing concerns in {category} category',
                'trend_direction': 'increasing',
                'confidence': 0.7
            })
        
        response_perf = trend_data.get('response_performance', {})
        if response_perf.get('overall_response_rate', 0) > 80:
            insights['success_patterns'].append({
                'area': 'High response rate to citizen feedback',
                'evidence': f"{response_perf.get('overall_response_rate', 0)}% response rate",
                'replication_potential': 'Can be maintained with current processes'
            })
        
        return insights
    
    async def _generate_trend_predictions(self, county, trend_data: Dict) -> Dict:
        """Generate AI predictions based on trends"""
        try:
            prediction_context = {
                'county_name': county.name,
                'historical_trends': trend_data,
                'current_season': self._get_current_season(),
                'upcoming_events': self._get_upcoming_events(),
            }
            
            prompt = self.prompts.get_prediction_prompt()
            prediction_response = await get_json_response(prompt, prediction_context)
            
            if prediction_response:
                return prediction_response
            else:
                return self._fallback_predictions(trend_data)
            
        except Exception as e:
            logger.error(f"Trend prediction failed: {e}")
            return self._fallback_predictions(trend_data)
    
    def _fallback_predictions(self, trend_data: Dict) -> Dict:
        """Generate fallback predictions"""
        return {
            'next_30_days': ['Continue monitoring current trends'],
            'next_90_days': ['Prepare for seasonal changes'],
            'annual_planning': ['Maintain current service levels'],
            'confidence_score': 0.5,
            'method': 'rule_based'
        }
    
    async def _generate_recommendations(self, county, trend_data: Dict, ai_insights: Dict) -> List[Dict]:
        """Generate actionable recommendations"""
        recommendations = []
        
        # Response time improvement
        avg_response_time = trend_data.get('response_performance', {}).get('average_response_time_hours', 48)
        if avg_response_time > 72:  # More than 3 days
            recommendations.append({
                'category': 'Response Time',
                'recommendation': 'Improve response time to citizen feedback',
                'priority': 'high',
                'estimated_impact': 'Improved citizen satisfaction and trust',
                'resources_needed': ['Additional staff', 'Process optimization'],
                'timeline': '1-3 months'
            })
        
        # Category-specific recommendations
        emerging_issues = ai_insights.get('emerging_issues', [])
        for issue in emerging_issues[:3]:  # Top 3 emerging issues
            recommendations.append({
                'category': 'Emerging Issue',
                'recommendation': f"Address growing concerns: {issue.get('issue', 'Unknown issue')}",
                'priority': 'medium',
                'estimated_impact': 'Prevent issue escalation',
                'resources_needed': ['Department coordination', 'Targeted response'],
                'timeline': '2-4 weeks'
            })
        
        return recommendations
    
    def _calculate_confidence_score(self, trend_data: Dict) -> float:
        """Calculate confidence score for the analysis"""
        factors = []
        
        # Data volume factor
        total_feedback = trend_data.get('total_feedback', 0)
        if total_feedback >= 100:
            factors.append(0.9)
        elif total_feedback >= 50:
            factors.append(0.7)
        elif total_feedback >= 20:
            factors.append(0.5)
        else:
            factors.append(0.3)
        
        # Time period factor
        period_days = (trend_data.get('period_end', timezone.now()) - 
                      trend_data.get('period_start', timezone.now())).days
        if period_days >= 30:
            factors.append(0.8)
        elif period_days >= 14:
            factors.append(0.6)
        else:
            factors.append(0.4)
        
        # Data completeness factor
        has_sentiment = trend_data.get('sentiment_trends', {}).get('has_sentiment_data', False)
        has_response_data = 'response_performance' in trend_data
        
        if has_sentiment and has_response_data:
            factors.append(0.9)
        elif has_response_data:
            factors.append(0.7)
        else:
            factors.append(0.5)
        
        return round(sum(factors) / len(factors), 2)
    
    def _assess_data_quality(self, trend_data: Dict) -> float:
        """Assess quality of underlying data"""
        quality_factors = []
        
        # Check for data consistency
        total_feedback = trend_data.get('total_feedback', 0)
        volume_total = trend_data.get('volume_trends', {}).get('current_period_total', 0)
        
        if abs(total_feedback - volume_total) <= 2:  # Allow small discrepancies
            quality_factors.append(0.9)
        else:
            quality_factors.append(0.6)
        
        # Check for geographic coverage
        geo_data = trend_data.get('geographic_distribution', {})
        sub_counties = len(geo_data.get('sub_county_distribution', []))
        
        if sub_counties >= 3:
            quality_factors.append(0.8)
        elif sub_counties >= 1:
            quality_factors.append(0.6)
        else:
            quality_factors.append(0.4)
        
        # Check for category diversity
        category_data = trend_data.get('category_analysis', {})
        categories = len(category_data.get('category_distribution', []))
        
        if categories >= 5:
            quality_factors.append(0.9)
        elif categories >= 3:
            quality_factors.append(0.7)
        else:
            quality_factors.append(0.5)
        
        return round(sum(quality_factors) / len(quality_factors), 2)
    
    def _insufficient_data_response(self, county, analysis_period_days: int) -> Dict:
        """Response when insufficient data is available"""
        return {
            'county_name': county.name,
            'analysis_status': 'insufficient_data',
            'message': f'Insufficient feedback data for meaningful trend analysis. Only {analysis_period_days} days of data available.',
            'recommendation': 'Collect more feedback data over time for comprehensive trend analysis',
            'minimum_data_needed': 'At least 20 feedback items over 14 days',
            'generated_at': timezone.now().isoformat()
        }
    
    def _error_response(self, county, error_message: str) -> Dict:
        """Response when analysis encounters an error"""
        return {
            'county_name': county.name,
            'analysis_status': 'error',
            'error_message': error_message,
            'generated_at': timezone.now().isoformat()
        }
    
    def _get_current_season(self) -> str:
        """Get current season for predictions"""
        month = timezone.now().month
        if month in [3, 4, 5, 10, 11, 12]:
            return 'rainy'
        else:
            return 'dry'
    
    def _get_upcoming_events(self) -> List[str]:
        """Get upcoming events that might affect feedback patterns"""
        # This could be enhanced with a calendar of events
        month = timezone.now().month
        events = []
        
        if month in [2, 3]:
            events.append('School term starting')
        if month in [11, 12]:
            events.append('Holiday season')
        if month in [6, 7, 8]:
            events.append('Budget planning period')
        
        return events
    
    async def _identify_silent_areas(self, feedback_qs) -> List[str]:
        """Identify geographic areas with no feedback"""
        try:
            # Get county's sub-counties
            county = feedback_qs.first().county if await asyncio.to_thread(feedback_qs.exists) else None
            if not county:
                return []
            
            # Get all sub-counties in the county
            from apps.users.models import Location
            all_sub_counties = await asyncio.to_thread(
                lambda: list(Location.objects.filter(
                    type='sub_county',
                    parent=county.location
                ).values_list('name', flat=True))
            )
            
            # Get sub-counties with feedback
            sub_counties_with_feedback = await asyncio.to_thread(
                lambda: list(feedback_qs.filter(
                    sub_county__isnull=False
                ).values_list('sub_county__name', flat=True).distinct())
            )
            
            # Find silent areas
            silent_areas = [sc for sc in all_sub_counties if sc not in sub_counties_with_feedback]
            return silent_areas
            
        except Exception:
            return []
    
    def _calculate_performance_grade(self, response_rate: float, resolution_rate: float, avg_response_time: float) -> str:
        """Calculate overall performance grade"""
        score = 0
        
        # Response rate scoring (40% weight)
        if response_rate >= 90:
            score += 40
        elif response_rate >= 80:
            score += 35
        elif response_rate >= 70:
            score += 30
        elif response_rate >= 60:
            score += 25
        else:
            score += 20
        
        # Resolution rate scoring (40% weight)
        if resolution_rate >= 80:
            score += 40
        elif resolution_rate >= 70:
            score += 35
        elif resolution_rate >= 60:
            score += 30
        elif resolution_rate >= 50:
            score += 25
        else:
            score += 20
        
        # Response time scoring (20% weight)
        if avg_response_time <= 24:
            score += 20
        elif avg_response_time <= 48:
            score += 18
        elif avg_response_time <= 72:
            score += 15
        elif avg_response_time <= 120:
            score += 10
        else:
            score += 5
        
        # Convert to letter grade
        if score >= 90:
            return 'A'
        elif score >= 80:
            return 'B'
        elif score >= 70:
            return 'C'
        elif score >= 60:
            return 'D'
        else:
            return 'F'


# Singleton instance for application use
trend_analyzer = LLMTrendAnalyzer()


# Utility functions for easy access
async def analyze_trends(county, period_days: int = 30) -> Dict:
    """Quick trend analysis for county"""
    return await trend_analyzer.analyze_county_trends(county, period_days)


async def get_county_insights(county) -> Dict:
    """Get quick insights for county dashboard"""
    return await trend_analyzer.analyze_county_trends(county, 14, include_predictions=False)
