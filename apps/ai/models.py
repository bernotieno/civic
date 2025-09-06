# =============================================================================
# FILE: apps/ai/models.py
# =============================================================================
import uuid
import json
from django.db import models
from django.utils import timezone
from django.core.exceptions import ValidationError
from apps.users.models import SoftDeleteModel, CustomUser, County
from apps.feedback.models import Feedback


# =============================================================================
# AI ANALYSIS MODELS - EXTEND EXISTING FEEDBACK WITHOUT MODIFICATION
# =============================================================================

class FeedbackAIAnalysis(SoftDeleteModel):
    """
    🤖 CRITICAL: AI Analysis storage for feedback items
    
    This model EXTENDS the existing Feedback model without modifying it.
    Stores all AI-generated insights, sentiment analysis, urgency scores,
    and predictions for each feedback submission.
    """
    
    # Link to existing feedback (1:1 relationship)
    feedback = models.OneToOneField(
        Feedback,
        on_delete=models.CASCADE,
        related_name='ai_analysis',
        help_text="The feedback item this AI analysis belongs to"
    )
    
    # Sentiment Analysis Results
    sentiment_score = models.FloatField(
        null=True, blank=True,
        help_text="Sentiment score from -1.0 (negative) to 1.0 (positive)"
    )
    sentiment_label = models.CharField(
        max_length=20,
        choices=[
            ('negative', 'Negative'),
            ('neutral', 'Neutral'),
            ('positive', 'Positive'),
        ],
        null=True, blank=True,
        help_text="Classified sentiment category"
    )
    emotion_detected = models.CharField(
        max_length=30,
        null=True, blank=True,
        help_text="Specific emotion detected (angry, frustrated, hopeful, etc.)"
    )
    confidence_score = models.FloatField(
        null=True, blank=True,
        help_text="AI confidence in sentiment analysis (0.0-1.0)"
    )
    
    # Urgency and Priority Analysis
    urgency_score = models.FloatField(
        null=True, blank=True,
        help_text="AI-calculated urgency score (1.0-10.0)"
    )
    urgency_level = models.CharField(
        max_length=20,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High'),
            ('critical', 'Critical'),
        ],
        null=True, blank=True,
        help_text="Calculated urgency category"
    )
    escalation_risk = models.FloatField(
        null=True, blank=True,
        help_text="Probability that this issue will escalate (0.0-1.0)"
    )
    
    # Community Impact Assessment
    community_impact_score = models.FloatField(
        null=True, blank=True,
        help_text="Estimated impact on community (1.0-10.0)"
    )
    affected_population_estimate = models.IntegerField(
        null=True, blank=True,
        help_text="Estimated number of people affected"
    )
    geographic_scope = models.CharField(
        max_length=20,
        choices=[
            ('individual', 'Individual'),
            ('household', 'Household'),
            ('neighborhood', 'Neighborhood'),
            ('ward', 'Ward'),
            ('sub_county', 'Sub County'),
            ('county', 'County'),
            ('multi_county', 'Multi County'),
        ],
        null=True, blank=True,
        help_text="Geographic scope of the issue"
    )
    
    # Categorization and Routing
    ai_category_suggestions = models.JSONField(
        default=dict,
        help_text="AI-suggested categories with confidence scores"
    )
    department_routing = models.JSONField(
        default=dict,
        help_text="Suggested department routing with priorities"
    )
    similar_feedback_ids = models.JSONField(
        default=list,
        help_text="IDs of similar feedback for pattern recognition"
    )
    
    # Cultural and Linguistic Analysis
    language_detected = models.CharField(
        max_length=10,
        default='en',
        help_text="Detected primary language (en, sw, etc.)"
    )
    cultural_context = models.JSONField(
        default=dict,
        help_text="Cultural context indicators and local references"
    )
    communication_style = models.CharField(
        max_length=20,
        choices=[
            ('formal', 'Formal'),
            ('informal', 'Informal'),
            ('emotional', 'Emotional'),
            ('factual', 'Factual'),
            ('urgent', 'Urgent'),
            ('respectful', 'Respectful'),
        ],
        null=True, blank=True,
        help_text="Detected communication style"
    )
    
    # Processing Metadata
    processing_version = models.CharField(
        max_length=10,
        default='1.0',
        help_text="AI model version used for analysis"
    )
    processed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When AI analysis was completed"
    )
    processing_time_seconds = models.FloatField(
        null=True, blank=True,
        help_text="Time taken for AI processing"
    )
    
    # Quality and Validation
    analysis_quality_score = models.FloatField(
        null=True, blank=True,
        help_text="Quality score of AI analysis (0.0-1.0)"
    )
    human_validated = models.BooleanField(
        default=False,
        help_text="Whether a human has validated this AI analysis"
    )
    validation_notes = models.TextField(
        blank=True,
        help_text="Human validation notes or corrections"
    )
    
    # Raw AI Response Data
    raw_ai_response = models.JSONField(
        default=dict,
        help_text="Complete raw response from AI for debugging"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['feedback', 'processed_at']),
            models.Index(fields=['urgency_level', 'escalation_risk']),
            models.Index(fields=['sentiment_label', 'confidence_score']),
            models.Index(fields=['processing_version', 'analysis_quality_score']),
            models.Index(fields=['community_impact_score', 'affected_population_estimate']),
        ]
        ordering = ['-processed_at']
    
    def __str__(self):
        return f"AI Analysis for {self.feedback.tracking_id}"
    
    def get_overall_priority_score(self):
        """Calculate combined priority score from all AI factors"""
        scores = []
        
        if self.urgency_score:
            scores.append(self.urgency_score)
        if self.community_impact_score:
            scores.append(self.community_impact_score)
        if self.escalation_risk:
            scores.append(self.escalation_risk * 10)  # Scale to 0-10
        
        return sum(scores) / len(scores) if scores else 0.0
    
    def get_response_priority(self):
        """Get recommended response timeframe based on AI analysis"""
        overall_score = self.get_overall_priority_score()
        
        if overall_score >= 8.5:
            return "immediate", "Within 2 hours"
        elif overall_score >= 7.0:
            return "urgent", "Within 6 hours"
        elif overall_score >= 5.5:
            return "high", "Within 24 hours"
        elif overall_score >= 3.5:
            return "medium", "Within 3 days"
        else:
            return "low", "Within 7 days"
    
    def is_critical_alert(self):
        """Determine if this feedback requires immediate critical alerts"""
        return (
            self.urgency_level == 'critical' or
            self.urgency_score and self.urgency_score >= 9.0 or
            self.escalation_risk and self.escalation_risk >= 0.8
        )


class AIResponseSuggestion(SoftDeleteModel):
    """
    💬 AI-Generated Response Suggestions for Government Officials
    
    Stores AI-generated response templates and suggestions that government
    officials can use to respond to citizen feedback more effectively.
    """
    
    feedback = models.ForeignKey(
        Feedback,
        on_delete=models.CASCADE,
        related_name='ai_response_suggestions',
        help_text="The feedback this response suggestion is for"
    )
    
    # Response Content
    suggested_content = models.TextField(
        help_text="AI-generated response content"
    )
    response_type = models.CharField(
        max_length=30,
        choices=[
            ('acknowledgment', 'Acknowledgment'),
            ('information_request', 'Information Request'),
            ('action_plan', 'Action Plan'),
            ('status_update', 'Status Update'),
            ('resolution', 'Resolution'),
            ('escalation', 'Escalation'),
            ('detailed_explanation', 'Detailed Explanation'),
        ],
        help_text="Type of response being suggested"
    )
    
    # Response Quality Metrics
    empathy_score = models.FloatField(
        null=True, blank=True,
        help_text="AI-assessed empathy level of response (0.0-1.0)"
    )
    clarity_score = models.FloatField(
        null=True, blank=True,
        help_text="AI-assessed clarity of response (0.0-1.0)"
    )
    actionability_score = models.FloatField(
        null=True, blank=True,
        help_text="How actionable/helpful the response is (0.0-1.0)"
    )
    appropriateness_score = models.FloatField(
        null=True, blank=True,
        help_text="Cultural and contextual appropriateness (0.0-1.0)"
    )
    
    # Targeting and Personalization
    target_audience = models.CharField(
        max_length=30,
        choices=[
            ('citizen', 'Individual Citizen'),
            ('community', 'Community Group'),
            ('media', 'Media/Press'),
            ('official', 'Government Official'),
        ],
        default='citizen',
        help_text="Target audience for this response"
    )
    tone = models.CharField(
        max_length=20,
        choices=[
            ('formal', 'Formal'),
            ('friendly', 'Friendly'),
            ('empathetic', 'Empathetic'),
            ('professional', 'Professional'),
            ('urgent', 'Urgent'),
            ('reassuring', 'Reassuring'),
        ],
        null=True, blank=True,
        help_text="Recommended tone for the response"
    )
    
    # Usage and Effectiveness
    times_used = models.IntegerField(
        default=0,
        help_text="Number of times this suggestion was used"
    )
    effectiveness_rating = models.FloatField(
        null=True, blank=True,
        help_text="User-rated effectiveness (1.0-5.0)"
    )
    user_modifications = models.JSONField(
        default=list,
        help_text="Track how users modify AI suggestions"
    )
    
    # AI Generation Metadata
    generation_model = models.CharField(
        max_length=50,
        help_text="AI model used to generate this response"
    )
    generation_parameters = models.JSONField(
        default=dict,
        help_text="Parameters used for AI generation"
    )
    generated_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When this suggestion was generated"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['feedback', 'response_type']),
            models.Index(fields=['effectiveness_rating', 'times_used']),
            models.Index(fields=['target_audience', 'tone']),
            models.Index(fields=['generated_at', 'generation_model']),
        ]
        ordering = ['-effectiveness_rating', '-generated_at']
    
    def __str__(self):
        return f"{self.response_type.title()} suggestion for {self.feedback.tracking_id}"
    
    def get_overall_quality_score(self):
        """Calculate overall quality from individual metrics"""
        scores = [
            self.empathy_score or 0,
            self.clarity_score or 0,
            self.actionability_score or 0,
            self.appropriateness_score or 0,
        ]
        return sum(scores) / len(scores) if any(scores) else 0.0
    
    def record_usage(self, user_modifications=None):
        """Record when this suggestion is used"""
        self.times_used += 1
        if user_modifications:
            self.user_modifications.append({
                'timestamp': timezone.now().isoformat(),
                'modifications': user_modifications
            })
        self.save(update_fields=['times_used', 'user_modifications'])


class AITrendAnalysis(SoftDeleteModel):
    """
    📊 AI-Powered Trend Analysis and Predictions
    
    Stores aggregated trend analysis and predictions for counties,
    categories, and time periods to help government officials make
    data-driven decisions.
    """
    
    # Scope and Time Period
    county = models.ForeignKey(
        County,
        on_delete=models.CASCADE,
        related_name='ai_trend_analyses',
        help_text="County this trend analysis covers"
    )
    analysis_period_start = models.DateTimeField(
        help_text="Start of the analysis period"
    )
    analysis_period_end = models.DateTimeField(
        help_text="End of the analysis period"
    )
    analysis_type = models.CharField(
        max_length=30,
        choices=[
            ('daily', 'Daily Analysis'),
            ('weekly', 'Weekly Analysis'),
            ('monthly', 'Monthly Analysis'),
            ('quarterly', 'Quarterly Analysis'),
            ('yearly', 'Yearly Analysis'),
            ('custom', 'Custom Period'),
        ],
        help_text="Type of trend analysis"
    )
    
    # Trend Data
    feedback_volume_trend = models.JSONField(
        default=dict,
        help_text="Feedback volume trends over time"
    )
    category_trends = models.JSONField(
        default=dict,
        help_text="Trends by feedback category"
    )
    sentiment_trends = models.JSONField(
        default=dict,
        help_text="Sentiment analysis trends"
    )
    urgency_trends = models.JSONField(
        default=dict,
        help_text="Urgency level trends"
    )
    location_trends = models.JSONField(
        default=dict,
        help_text="Geographic distribution trends"
    )
    
    # Predictions and Insights
    predicted_issues = models.JSONField(
        default=list,
        help_text="AI-predicted emerging issues"
    )
    seasonal_patterns = models.JSONField(
        default=dict,
        help_text="Detected seasonal patterns"
    )
    anomalies_detected = models.JSONField(
        default=list,
        help_text="Unusual patterns or anomalies"
    )
    
    # Performance Metrics
    response_time_trends = models.JSONField(
        default=dict,
        help_text="Government response time trends"
    )
    resolution_rate_trends = models.JSONField(
        default=dict,
        help_text="Issue resolution rate trends"
    )
    citizen_satisfaction_trends = models.JSONField(
        default=dict,
        help_text="Inferred citizen satisfaction trends"
    )
    
    # AI Analysis Metadata
    confidence_score = models.FloatField(
        null=True, blank=True,
        help_text="Overall confidence in trend analysis (0.0-1.0)"
    )
    data_quality_score = models.FloatField(
        null=True, blank=True,
        help_text="Quality of underlying data (0.0-1.0)"
    )
    sample_size = models.IntegerField(
        help_text="Number of feedback items analyzed"
    )
    
    # Generation Details
    generated_by_model = models.CharField(
        max_length=50,
        help_text="AI model used for trend analysis"
    )
    generation_parameters = models.JSONField(
        default=dict,
        help_text="Parameters used for analysis"
    )
    processing_time_minutes = models.FloatField(
        null=True, blank=True,
        help_text="Time taken to generate analysis"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['county', 'analysis_type', 'analysis_period_end']),
            models.Index(fields=['analysis_period_start', 'analysis_period_end']),
            models.Index(fields=['confidence_score', 'data_quality_score']),
            models.Index(fields=['created_at', 'generated_by_model']),
        ]
        ordering = ['-analysis_period_end', '-created_at']
        unique_together = ['county', 'analysis_type', 'analysis_period_start', 'analysis_period_end']
    
    def __str__(self):
        return f"{self.get_analysis_type_display()} for {self.county.name} ({self.analysis_period_start.date()})"
    
    def get_top_emerging_issues(self, limit=5):
        """Get top emerging issues from predictions"""
        issues = self.predicted_issues
        if isinstance(issues, list):
            return sorted(issues, key=lambda x: x.get('confidence', 0), reverse=True)[:limit]
        return []
    
    def get_priority_categories(self, limit=3):
        """Get categories that need immediate attention"""
        category_data = self.category_trends
        if not isinstance(category_data, dict):
            return []
        
        priority_categories = []
        for category, data in category_data.items():
            if isinstance(data, dict):
                urgency = data.get('avg_urgency_score', 0)
                volume = data.get('volume_change_percent', 0)
                priority_score = (urgency * 0.7) + (volume * 0.3)
                priority_categories.append({
                    'category': category,
                    'priority_score': priority_score,
                    'urgency': urgency,
                    'volume_change': volume
                })
        
        return sorted(priority_categories, key=lambda x: x['priority_score'], reverse=True)[:limit]


class AIProcessingLog(SoftDeleteModel):
    """
    📋 Audit Trail for AI Processing
    
    Tracks all AI processing activities for monitoring, debugging,
    and performance optimization.
    """
    
    # Processing Details
    task_id = models.CharField(
        max_length=100,
        db_index=True,
        help_text="Celery task ID for tracking"
    )
    task_name = models.CharField(
        max_length=100,
        help_text="Name of the AI task executed"
    )
    feedback = models.ForeignKey(
        Feedback,
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='ai_processing_logs',
        help_text="Feedback item processed (if applicable)"
    )
    
    # Processing Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('started', 'Started'),
            ('processing', 'Processing'),
            ('completed', 'Completed'),
            ('failed', 'Failed'),
            ('retrying', 'Retrying'),
            ('timeout', 'Timeout'),
        ],
        default='started',
        help_text="Current processing status"
    )
    
    # Performance Metrics
    start_time = models.DateTimeField(
        auto_now_add=True,
        help_text="When processing started"
    )
    end_time = models.DateTimeField(
        null=True, blank=True,
        help_text="When processing completed"
    )
    duration_seconds = models.FloatField(
        null=True, blank=True,
        help_text="Total processing time"
    )
    
    # Resource Usage
    memory_usage_mb = models.FloatField(
        null=True, blank=True,
        help_text="Peak memory usage during processing"
    )
    api_calls_made = models.IntegerField(
        default=0,
        help_text="Number of API calls to LLM services"
    )
    tokens_consumed = models.IntegerField(
        default=0,
        help_text="Total tokens consumed by LLM APIs"
    )
    
    # Error Handling
    error_message = models.TextField(
        blank=True,
        help_text="Error message if processing failed"
    )
    retry_count = models.IntegerField(
        default=0,
        help_text="Number of retry attempts"
    )
    
    # Results Summary
    results_summary = models.JSONField(
        default=dict,
        help_text="Summary of processing results"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['task_id', 'status']),
            models.Index(fields=['task_name', 'start_time']),
            models.Index(fields=['feedback', 'status']),
            models.Index(fields=['start_time', 'duration_seconds']),
        ]
        ordering = ['-start_time']
    
    def __str__(self):
        return f"{self.task_name} - {self.status} ({self.start_time})"
    
    def complete_processing(self, success=True, results=None, error_message=None):
        """Mark processing as complete"""
        self.end_time = timezone.now()
        self.duration_seconds = (self.end_time - self.start_time).total_seconds()
        self.status = 'completed' if success else 'failed'
        if results:
            self.results_summary = results
        if error_message:
            self.error_message = error_message
        self.save()
    
    def record_api_usage(self, api_calls=1, tokens=0):
        """Record API usage during processing"""
        self.api_calls_made += api_calls
        self.tokens_consumed += tokens
        self.save(update_fields=['api_calls_made', 'tokens_consumed'])