# =============================================================================
# FILE: apps/ai/services/response_generator.py
# =============================================================================
import asyncio
import json
import logging
from typing import Dict, List, Optional, Tuple
from datetime import timedelta
from django.utils import timezone
from django.core.cache import cache
from django.db.models import Count, Avg, Q

from .prompt_templates import ResponsePrompts, ContextualPrompts
from apps.feedback.models import Feedback


logger = logging.getLogger('apps.ai.services')


class LLMResponseGenerator:
    """
    💬 AWARD-WINNING: Generate contextual government responses using AI
    
    Creates appropriate, empathetic, and culturally-aware responses that:
    - Match Kenyan civic communication norms
    - Consider county-specific context and capacity
    - Provide realistic timelines and next steps
    - Demonstrate empathy and understanding
    - Follow government best practices for citizen engagement
    """
    
    def __init__(self):
        self.llm_client = None
        self.prompts = ResponsePrompts()
        self.contextual_prompts = ContextualPrompts()
        self.cache_ttl = 7200  # 2 hours cache for response suggestions
        self._initialize_llm_client()
    
    def _initialize_llm_client(self):
        """Initialize LLM client with error handling"""
        try:
            from .llm_client import llm_client
            self.llm_client = llm_client
        except Exception as e:
            logger.warning(f"LLM client initialization failed: {e}")
            self.llm_client = None
    
    async def generate_response_suggestions(self, feedback, official_user) -> List[Dict]:
        """
        🎯 Generate multiple response options tailored to specific context
        
        Args:
            feedback: Feedback model instance
            official_user: CustomUser instance of the responding official
            
        Returns:
            List of response suggestions with quality metrics
        """
        try:
            # Check cache first
            cache_key = f"response_suggestions_{feedback.id}_{official_user.id}"
            cached_result = cache.get(cache_key)
            if cached_result:
                logger.debug(f"Using cached response suggestions for feedback {feedback.id}")
                return cached_result
            
            # Gather context for response generation
            context_data = await self._gather_response_context(feedback, official_user)
            
            # Determine appropriate response types based on feedback status and urgency
            response_types = self._determine_response_types(feedback, context_data)
            
            # Generate different response options
            suggestions = []
            
            for response_type in response_types:
                try:
                    suggestion = await self._generate_single_response(
                        feedback, official_user, response_type, context_data
                    )
                    if suggestion:
                        suggestions.append(suggestion)
                except Exception as e:
                    logger.error(f"Failed to generate {response_type} response: {e}")
                    continue
            
            # Sort suggestions by quality score
            suggestions.sort(key=lambda x: x.get('overall_quality_score', 0), reverse=True)
            
            # Cache the results
            cache.set(cache_key, suggestions, self.cache_ttl)
            
            logger.info(f"Generated {len(suggestions)} response suggestions for feedback {feedback.id}")
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Response generation failed for feedback {feedback.id}: {e}")
            return await self._fallback_response_suggestions(feedback, official_user)
    
    async def _gather_response_context(self, feedback, official) -> Dict:
        """📊 Gather context for intelligent response generation"""
        try:
            # Get successful response examples from same category
            successful_responses = await self._get_successful_response_examples(
                feedback.category, feedback.county
            )
            
            # Get county-specific service information
            county_info = await self._get_county_service_info(feedback.county, feedback.category)
            
            # Get official's response history and style
            official_style = await self._analyze_official_response_style(official)
            
            # Get current workload and capacity
            current_workload = await self._assess_current_workload(feedback.county, feedback.category)
            
            # Check for similar active issues
            similar_issues = await self._find_similar_active_issues(feedback)
            
            # Get escalation context if needed
            escalation_context = await self._get_escalation_context(feedback)
            
            return {
                'feedback_content': feedback.content,
                'feedback_title': feedback.title,
                'citizen_tone': self._analyze_citizen_tone(feedback),
                'feedback_urgency': getattr(feedback, 'ai_analysis', {}) and getattr(feedback.ai_analysis, 'urgency_level', 'medium'),
                'feedback_sentiment': getattr(feedback, 'ai_analysis', {}) and getattr(feedback.ai_analysis, 'sentiment_label', 'neutral'),
                'category': feedback.category,
                'category_display': feedback.get_category_display(),
                'county_name': feedback.county.name,
                'location_path': feedback.get_location_path(),
                'official_role': official.get_official_level_display(),
                'official_department': self._get_official_department(official, feedback.category),
                'successful_response_examples': successful_responses,
                'county_service_info': county_info,
                'typical_resolution_time': await self._get_typical_resolution_time(feedback.category, feedback.county),
                'available_resources': county_info.get('available_resources', []),
                'official_response_style': official_style,
                'current_workload': current_workload,
                'similar_active_issues': similar_issues,
                'escalation_context': escalation_context,
                'submission_method': feedback.submitted_via,
                'is_anonymous': feedback.is_anonymous,
                'days_since_submission': (timezone.now() - feedback.created_at).days,
                'previous_responses_count': feedback.response_count,
                'public_visibility': feedback.view_count,
                'seasonal_context': self._get_seasonal_response_context(feedback.created_at),
            }
            
        except Exception as e:
            logger.error(f"Failed to gather response context: {e}")
            return {
                'feedback_content': feedback.content,
                'category': feedback.category,
                'county_name': feedback.county.name,
                'official_role': official.get_official_level_display(),
            }
    
    def _determine_response_types(self, feedback, context_data: Dict) -> List[str]:
        """Determine appropriate response types based on context"""
        response_types = []
        
        # Always include acknowledgment for new feedback
        if feedback.response_count == 0:
            response_types.append('acknowledgment')
        
        # Add action plan for medium to high urgency
        urgency = context_data.get('feedback_urgency', 'medium')
        if urgency in ['medium', 'high', 'critical']:
            response_types.append('action_plan')
        
        # Add detailed explanation for complex issues
        if (feedback.category in ['governance', 'infrastructure', 'economic'] or
            len(feedback.content) > 500):
            response_types.append('detailed_explanation')
        
        # Add status update if there are previous responses
        if feedback.response_count > 0:
            response_types.append('status_update')
        
        # Add information request if feedback lacks details
        if (len(feedback.content) < 200 and 
            feedback.category in ['infrastructure', 'water_sanitation']):
            response_types.append('information_request')
        
        # Add crisis communication for critical issues
        if urgency == 'critical':
            response_types.append('crisis_communication')
        
        # Add corruption response for governance issues with anonymity
        if feedback.category == 'governance' and feedback.is_anonymous:
            response_types.append('corruption_response')
        
        # Ensure we have at least 2 response types
        if len(response_types) < 2:
            response_types.append('detailed_explanation')
        
        return response_types[:4]  # Limit to 4 response types
    
    async def _generate_single_response(
        self, 
        feedback, 
        official_user, 
        response_type: str, 
        context_data: Dict
    ) -> Optional[Dict]:
        """Generate a single response suggestion"""
        try:
            # Get appropriate prompt for response type
            if response_type in ['crisis_communication', 'corruption_response']:
                prompt = getattr(self.contextual_prompts, f'get_{response_type}_prompt')()
            else:
                prompt = self.prompts.get_response_generation_prompt(response_type)
            
            # Generate response content
            if not self.llm_client:
                logger.warning("LLM client not available, using fallback response generation")
                return None
            
            try:
                from .llm_client import quick_analyze
                response_content = await quick_analyze(prompt, context_data)
            except ImportError:
                logger.warning("LLM client functions not available, using fallback response generation")
                return None
            
            if not response_content:
                return None
            
            # Assess response quality
            quality_metrics = await self._assess_response_quality(
                response_content, feedback, response_type, context_data
            )
            
            # Get response metadata
            metadata = self._get_response_metadata(response_type, context_data)
            
            return {
                'response_type': response_type,
                'response_type_display': metadata['display_name'],
                'suggested_content': response_content,
                'empathy_score': quality_metrics['empathy_score'],
                'clarity_score': quality_metrics['clarity_score'],
                'actionability_score': quality_metrics['actionability_score'],
                'appropriateness_score': quality_metrics['appropriateness_score'],
                'overall_quality_score': quality_metrics['overall_quality_score'],
                'target_audience': metadata['target_audience'],
                'tone': metadata['tone'],
                'estimated_response_time': metadata['response_time'],
                'follow_up_required': metadata['follow_up_required'],
                'department_coordination': metadata['department_coordination'],
                'generated_at': timezone.now().isoformat(),
                'generation_model': 'gpt-4o',
                'context_factors': list(context_data.keys())
            }
            
        except Exception as e:
            logger.error(f"Failed to generate {response_type} response: {e}")
            return None
    
    async def _assess_response_quality(
        self, 
        response_content: str, 
        feedback, 
        response_type: str, 
        context_data: Dict
    ) -> Dict:
        """Assess the quality of generated response"""
        try:
            # Prepare quality assessment prompt
            quality_prompt = f"""
            Assess the quality of this government response to citizen feedback on a scale of 0.0-1.0:
            
            RESPONSE TO ASSESS:
            {response_content}
            
            ORIGINAL FEEDBACK:
            {feedback.content}
            
            CONTEXT:
            - Category: {feedback.get_category_display()}
            - County: {feedback.county.name}
            - Response Type: {response_type}
            - Citizen Tone: {context_data.get('citizen_tone', 'neutral')}
            
            Assess these dimensions:
            1. Empathy: Shows understanding and care for citizen concerns
            2. Clarity: Clear, easy to understand language
            3. Actionability: Provides specific next steps and timelines
            4. Appropriateness: Culturally appropriate for Kenyan context
            
            Return JSON:
            {{
                "empathy_score": <0.0-1.0>,
                "clarity_score": <0.0-1.0>,
                "actionability_score": <0.0-1.0>,
                "appropriateness_score": <0.0-1.0>,
                "strengths": ["<list of response strengths>"],
                "improvements": ["<suggested improvements>"]
            }}
            """
            
            quality_response = await self.llm_client.analyze_with_context(
                quality_prompt, {}, response_format="json"
            )
            
            if quality_response.success:
                try:
                    quality_data = json.loads(quality_response.content)
                    
                    # Calculate overall quality score
                    scores = [
                        quality_data.get('empathy_score', 0.7),
                        quality_data.get('clarity_score', 0.7),
                        quality_data.get('actionability_score', 0.7),
                        quality_data.get('appropriateness_score', 0.7)
                    ]
                    overall_score = sum(scores) / len(scores)
                    
                    return {
                        'empathy_score': quality_data.get('empathy_score', 0.7),
                        'clarity_score': quality_data.get('clarity_score', 0.7),
                        'actionability_score': quality_data.get('actionability_score', 0.7),
                        'appropriateness_score': quality_data.get('appropriateness_score', 0.7),
                        'overall_quality_score': overall_score,
                        'strengths': quality_data.get('strengths', []),
                        'improvements': quality_data.get('improvements', [])
                    }
                    
                except json.JSONDecodeError:
                    pass
            
            # Fallback quality assessment
            return self._fallback_quality_assessment(response_content, response_type)
            
        except Exception as e:
            logger.error(f"Quality assessment failed: {e}")
            return self._fallback_quality_assessment(response_content, response_type)
    
    def _fallback_quality_assessment(self, response_content: str, response_type: str) -> Dict:
        """Fallback quality assessment using simple metrics"""
        content_length = len(response_content)
        
        # Basic quality metrics based on content analysis
        empathy_keywords = ['understand', 'concern', 'appreciate', 'thank', 'sorry', 'regret']
        action_keywords = ['will', 'plan', 'schedule', 'contact', 'visit', 'investigate']
        clarity_indicators = response_content.count('.') + response_content.count('!')
        
        content_lower = response_content.lower()
        empathy_score = min(1.0, sum(1 for word in empathy_keywords if word in content_lower) * 0.2 + 0.3)
        actionability_score = min(1.0, sum(1 for word in action_keywords if word in content_lower) * 0.15 + 0.4)
        clarity_score = min(1.0, max(0.3, clarity_indicators / max(1, content_length / 100)))
        appropriateness_score = 0.8 if 50 <= content_length <= 500 else 0.6
        
        overall_score = (empathy_score + actionability_score + clarity_score + appropriateness_score) / 4
        
        return {
            'empathy_score': round(empathy_score, 2),
            'clarity_score': round(clarity_score, 2),
            'actionability_score': round(actionability_score, 2),
            'appropriateness_score': round(appropriateness_score, 2),
            'overall_quality_score': round(overall_score, 2),
            'strengths': ['Automated assessment'],
            'improvements': ['Human review recommended']
        }
    
    def _get_response_metadata(self, response_type: str, context_data: Dict) -> Dict:
        """Get metadata for response type"""
        metadata_map = {
            'acknowledgment': {
                'display_name': 'Quick Acknowledgment',
                'target_audience': 'citizen',
                'tone': 'friendly',
                'response_time': 'immediate',
                'follow_up_required': True,
                'department_coordination': False
            },
            'information_request': {
                'display_name': 'Information Request',
                'target_audience': 'citizen',
                'tone': 'professional',
                'response_time': '24_hours',
                'follow_up_required': True,
                'department_coordination': False
            },
            'action_plan': {
                'display_name': 'Action Plan Response',
                'target_audience': 'citizen',
                'tone': 'professional',
                'response_time': '3_days',
                'follow_up_required': True,
                'department_coordination': True
            },
            'status_update': {
                'display_name': 'Status Update',
                'target_audience': 'citizen',
                'tone': 'informative',
                'response_time': '24_hours',
                'follow_up_required': False,
                'department_coordination': False
            },
            'detailed_explanation': {
                'display_name': 'Detailed Explanation',
                'target_audience': 'citizen',
                'tone': 'educational',
                'response_time': '5_days',
                'follow_up_required': False,
                'department_coordination': True
            },
            'resolution': {
                'display_name': 'Resolution Notice',
                'target_audience': 'citizen',
                'tone': 'appreciative',
                'response_time': 'immediate',
                'follow_up_required': False,
                'department_coordination': False
            },
            'crisis_communication': {
                'display_name': 'Crisis Communication',
                'target_audience': 'community',
                'tone': 'urgent',
                'response_time': 'immediate',
                'follow_up_required': True,
                'department_coordination': True
            },
            'corruption_response': {
                'display_name': 'Governance Response',
                'target_audience': 'citizen',
                'tone': 'serious',
                'response_time': '24_hours',
                'follow_up_required': True,
                'department_coordination': True
            }
        }
        
        return metadata_map.get(response_type, {
            'display_name': response_type.replace('_', ' ').title(),
            'target_audience': 'citizen',
            'tone': 'professional',
            'response_time': '3_days',
            'follow_up_required': True,
            'department_coordination': False
        })
    
    async def _get_successful_response_examples(self, category: str, county) -> List[str]:
        """Get examples of successful responses from same category"""
        try:
            # This would fetch actual successful responses from the database
            # For now, return category-appropriate templates
            examples = {
                'infrastructure': [
                    "Thank you for reporting the road condition. Our Public Works team will inspect the area within 48 hours and provide repair timeline.",
                    "We've scheduled road maintenance for next week. Traffic diversions will be communicated 24 hours in advance."
                ],
                'water_sanitation': [
                    "Water supply interruption has been identified. Our technical team is working to restore service within 6 hours.",
                    "We've deployed water bowsers to your area while we repair the main supply line."
                ],
                'healthcare': [
                    "Medical equipment replacement has been prioritized in our quarterly budget. Expected delivery in 4-6 weeks.",
                    "Thank you for the health facility feedback. Our medical superintendent will address staffing concerns immediately."
                ]
            }
            return examples.get(category, ["Thank you for your feedback. We are reviewing your concerns and will respond soon."])
        except Exception:
            return ["Thank you for your feedback. We are reviewing your concerns and will respond soon."]
    
    async def _get_county_service_info(self, county, category: str) -> Dict:
        """Get county-specific service information"""
        try:
            # This would fetch real county service data from database
            # For now, return default service info structure
            return {
                'department_contact': f"{category.replace('_', ' ').title()} Department",
                'service_hours': "Monday-Friday 8:00 AM - 5:00 PM",
                'emergency_contact': f"{county.name} County Emergency Line",
                'available_resources': [
                    "Technical team",
                    "Equipment maintenance",
                    "Community liaison"
                ],
                'budget_allocation': "Available",
                'current_projects': []
            }
        except Exception:
            return {
                'department_contact': "County Administration",
                'available_resources': ["Administrative support"]
            }
    
    def _analyze_citizen_tone(self, feedback) -> str:
        """Analyze the tone of citizen feedback"""
        content_lower = feedback.content.lower()
        
        if any(word in content_lower for word in ['angry', 'furious', 'outraged', 'unacceptable']):
            return 'angry'
        elif any(word in content_lower for word in ['frustrated', 'disappointed', 'tired of']):
            return 'frustrated'
        elif any(word in content_lower for word in ['please', 'kindly', 'request', 'humbly']):
            return 'respectful'
        elif any(word in content_lower for word in ['urgent', 'immediately', 'emergency']):
            return 'urgent'
        elif any(word in content_lower for word in ['thank', 'appreciate', 'grateful']):
            return 'appreciative'
        else:
            return 'neutral'
    
    def _get_official_department(self, official, category: str) -> str:
        """Map category to appropriate department"""
        department_map = {
            'infrastructure': 'Public Works & Infrastructure',
            'healthcare': 'Health & Medical Services',
            'education': 'Education & Human Resources',
            'water_sanitation': 'Water, Sanitation & Environment',
            'security': 'Security & Emergency Services',
            'environment': 'Environment & Natural Resources',
            'governance': 'Ethics & Administration',
            'economic': 'Trade & Economic Development',
            'other': 'General Administration'
        }
        return department_map.get(category, 'County Administration')
    
    async def _get_typical_resolution_time(self, category: str, county) -> str:
        """Get typical resolution time for category in county"""
        try:
            # Get average resolution time from historical data
            recent_resolved = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=county,
                    category=category,
                    status__in=['resolved', 'closed'],
                    created_at__gte=timezone.now() - timedelta(days=90)
                ).values('created_at', 'updated_at')[:20]
            )
            
            if recent_resolved:
                resolution_times = []
                for item in recent_resolved:
                    if item['updated_at']:
                        delta = item['updated_at'] - item['created_at']
                        resolution_times.append(delta.days)
                
                if resolution_times:
                    avg_days = sum(resolution_times) / len(resolution_times)
                    if avg_days <= 2:
                        return "1-3 days"
                    elif avg_days <= 7:
                        return "3-7 days"
                    elif avg_days <= 14:
                        return "1-2 weeks"
                    else:
                        return "2-4 weeks"
            
            # Fallback to category defaults
            category_defaults = {
                'security': "24-48 hours",
                'healthcare': "1-3 days",
                'water_sanitation': "2-5 days",
                'infrastructure': "1-2 weeks",
                'education': "1-2 weeks",
                'environment': "1-3 weeks",
                'governance': "2-4 weeks",
                'economic': "2-6 weeks",
                'other': "1-2 weeks"
            }
            return category_defaults.get(category, "1-2 weeks")
            
        except Exception:
            return "1-2 weeks"
    
    async def _analyze_official_response_style(self, official) -> Dict:
        """Analyze official's previous response style"""
        try:
            # This would analyze the official's previous responses
            # For now, return default style based on role
            role_styles = {
                'local': {
                    'tone_preference': 'friendly',
                    'detail_level': 'moderate',
                    'formality': 'semi-formal'
                },
                'regional': {
                    'tone_preference': 'professional',
                    'detail_level': 'detailed',
                    'formality': 'formal'
                },
                'national': {
                    'tone_preference': 'authoritative',
                    'detail_level': 'comprehensive',
                    'formality': 'very_formal'
                }
            }
            return role_styles.get(official.official_level, role_styles['local'])
        except Exception:
            return {
                'tone_preference': 'professional',
                'detail_level': 'moderate',
                'formality': 'semi-formal'
            }
    
    async def _assess_current_workload(self, county, category: str) -> Dict:
        """Assess current workload for the department"""
        try:
            # Count pending issues in category
            pending_count = await asyncio.to_thread(
                lambda: Feedback.objects.filter(
                    county=county,
                    category=category,
                    status__in=['pending', 'in_review']
                ).count()
            )
            
            if pending_count <= 5:
                workload_level = 'low'
            elif pending_count <= 15:
                workload_level = 'moderate'
            else:
                workload_level = 'high'
            
            return {
                'workload_level': workload_level,
                'pending_issues': pending_count,
                'capacity_available': workload_level != 'high'
            }
        except Exception:
            return {
                'workload_level': 'moderate',
                'pending_issues': 10,
                'capacity_available': True
            }
    
    async def _find_similar_active_issues(self, feedback) -> List[Dict]:
        """Find similar active issues"""
        try:
            similar = await asyncio.to_thread(
                lambda: list(Feedback.objects.filter(
                    county=feedback.county,
                    category=feedback.category,
                    status__in=['pending', 'in_review'],
                    created_at__gte=timezone.now() - timedelta(days=30)
                ).exclude(id=feedback.id).values('id', 'title')[:3])
            )
            return similar
        except Exception:
            return []
    
    async def _get_escalation_context(self, feedback) -> Dict:
        """Get escalation context if needed"""
        try:
            # Check if feedback has high visibility or urgency
            has_urgency = hasattr(feedback, 'ai_analysis') and feedback.ai_analysis and feedback.ai_analysis.urgency_level in ['high', 'critical']
            high_visibility = feedback.view_count > 20
            
            return {
                'requires_escalation': has_urgency or high_visibility,
                'escalation_reason': 'High urgency' if has_urgency else ('High visibility' if high_visibility else 'None'),
                'escalation_level': 'senior_management' if has_urgency else 'department_head'
            }
        except Exception:
            return {
                'requires_escalation': False,
                'escalation_reason': 'None'
            }
    
    def _get_seasonal_response_context(self, timestamp) -> str:
        """Get seasonal context for responses"""
        month = timestamp.month
        
        if month in [3, 4, 5, 10, 11, 12]:
            return "rainy_season"
        elif month in [6, 7, 8, 1, 2]:
            return "dry_season"
        else:
            return "normal"
    
    async def _fallback_response_suggestions(self, feedback, official_user) -> List[Dict]:
        """Fallback response suggestions using templates"""
        try:
            suggestions = []
            
            # Basic acknowledgment
            acknowledgment = {
                'response_type': 'acknowledgment',
                'response_type_display': 'Quick Acknowledgment',
                'suggested_content': f"Thank you for bringing this {feedback.get_category_display().lower()} matter to our attention. We have received your feedback regarding {feedback.title.lower()} and will review it promptly. You will receive an update within 2-3 working days. Your tracking ID is {feedback.id}.",
                'empathy_score': 0.7,
                'clarity_score': 0.8,
                'actionability_score': 0.7,
                'appropriateness_score': 0.8,
                'overall_quality_score': 0.75,
                'target_audience': 'citizen',
                'tone': 'professional',
                'fallback_used': True
            }
            suggestions.append(acknowledgment)
            
            # Basic action plan
            action_plan = {
                'response_type': 'action_plan',
                'response_type_display': 'Action Plan Response',
                'suggested_content': f"We understand your concern about {feedback.title.lower()}. Our {self._get_official_department(official_user, feedback.category)} will investigate this matter within the next 5 working days. We will coordinate with the relevant technical team to assess the situation and determine the appropriate course of action. You will receive a detailed update by next week.",
                'empathy_score': 0.6,
                'clarity_score': 0.7,
                'actionability_score': 0.8,
                'appropriateness_score': 0.7,
                'overall_quality_score': 0.7,
                'target_audience': 'citizen',
                'tone': 'professional',
                'fallback_used': True
            }
            suggestions.append(action_plan)
            
            return suggestions
            
        except Exception as e:
            logger.error(f"Fallback response generation failed: {e}")
            return [{
                'response_type': 'acknowledgment',
                'suggested_content': f"Thank you for your feedback. We are reviewing your concerns and will respond appropriately. Tracking ID: {feedback.id}",
                'overall_quality_score': 0.5,
                'fallback_used': True,
                'error': str(e)
            }]


# Singleton instance for application use
response_generator = LLMResponseGenerator()


# Utility functions for easy access
async def generate_responses(feedback, official_user) -> List[Dict]:
    """Quick response generation for feedback"""
    return await response_generator.generate_response_suggestions(feedback, official_user)