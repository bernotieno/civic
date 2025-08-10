# =============================================================================
# FILE: apps/civic_education/models.py
# =============================================================================
import uuid
from django.db import models
from django.contrib.postgres.fields import ArrayField
from apps.users.models import SoftDeleteModel, CustomUser, County


# Education Content Types
CONTENT_TYPES = [
    ('article', 'Article'),
    ('video', 'Video'),
    ('interactive', 'Interactive Content'),
    ('quiz', 'Quiz'),
    ('infographic', 'Infographic'),
    ('podcast', 'Podcast'),
    ('webinar', 'Webinar'),
    ('simulation', 'Simulation')
]

# Education Categories
EDUCATION_CATEGORIES = [
    ('civic_rights', 'Civic Rights & Responsibilities'),
    ('governance', 'How Government Works'),
    ('public_finance', 'Public Finance & Budgets'),
    ('transparency', 'Transparency & Accountability'),
    ('participation', 'Citizen Participation'),
    ('constitution', 'Constitutional Knowledge'),
    ('legal_literacy', 'Legal Literacy'),
    ('service_delivery', 'Government Services'),
    ('democracy', 'Democratic Processes'),
    ('devolution', 'Devolved Government')
]

# Difficulty Levels
DIFFICULTY_LEVELS = [
    ('beginner', 'Beginner'),
    ('intermediate', 'Intermediate'),
    ('advanced', 'Advanced')
]

# Content Status
CONTENT_STATUS = [
    ('draft', 'Draft'),
    ('review', 'Under Review'),
    ('published', 'Published'),
    ('archived', 'Archived')
]


class EducationContent(SoftDeleteModel):
    """
    🎓 Civic Education Content Management
    
    Central model for all civic education content including articles,
    videos, quizzes, and interactive materials.
    """
    
    # Core Identity
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=300, db_index=True)
    description = models.TextField(help_text="Brief description for preview")
    content = models.TextField(help_text="Main content body")
    
    # Classification
    content_type = models.CharField(max_length=20, choices=CONTENT_TYPES, db_index=True)
    category = models.CharField(max_length=20, choices=EDUCATION_CATEGORIES, db_index=True)
    difficulty = models.CharField(max_length=15, choices=DIFFICULTY_LEVELS, default='beginner')
    
    # Content Metadata
    estimated_duration = models.CharField(
        max_length=50, 
        help_text="e.g., '10 min read', '15 min watch'"
    )
    tags = ArrayField(models.CharField(max_length=50), default=list, blank=True)
    key_learning_outcomes = ArrayField(
        models.CharField(max_length=200), 
        default=list, 
        blank=True,
        help_text="What users will learn"
    )
    
    # Media and Resources
    thumbnail = models.CharField(max_length=100, blank=True, help_text="Emoji or icon")
    featured_image = models.URLField(blank=True)
    video_url = models.URLField(blank=True)
    audio_url = models.URLField(blank=True)
    download_resources = models.JSONField(
        default=list,
        help_text="Additional downloadable resources"
    )
    
    # Status and Publishing
    status = models.CharField(max_length=15, choices=CONTENT_STATUS, default='draft', db_index=True)
    is_featured = models.BooleanField(default=False, db_index=True)
    published_at = models.DateTimeField(null=True, blank=True)
    
    # Authorship and Management
    county = models.ForeignKey(
        County,
        on_delete=models.CASCADE,
        related_name='education_content',
        help_text="County this content belongs to"
    )
    author = models.ForeignKey(
        CustomUser,
        on_delete=models.CASCADE,
        related_name='authored_content'
    )
    reviewed_by = models.ForeignKey(
        CustomUser,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='reviewed_content'
    )
    
    # Engagement Metrics
    view_count = models.IntegerField(default=0)
    like_count = models.IntegerField(default=0)
    completion_count = models.IntegerField(default=0)
    share_count = models.IntegerField(default=0)
    
    # Interactive Features
    allows_comments = models.BooleanField(default=True)
    allows_rating = models.BooleanField(default=True)
    requires_completion = models.BooleanField(
        default=False, 
        help_text="Requires completion tracking"
    )
    
    # Language and Accessibility
    language = models.CharField(max_length=10, default='en', help_text="ISO language code")
    has_swahili_version = models.BooleanField(default=False)
    accessibility_features = models.JSONField(
        default=dict,
        help_text="Accessibility compliance features"
    )
    
    class Meta:
        indexes = [
            models.Index(fields=['county', 'status', 'category']),
            models.Index(fields=['content_type', 'difficulty']),
            models.Index(fields=['is_featured', 'published_at']),
            models.Index(fields=['created_at', 'view_count']),
        ]
        ordering = ['-created_at']
        permissions = [
            ('can_publish_content', 'Can publish education content'),
            ('can_manage_all_content', 'Can manage all county content'),
            ('can_create_interactive', 'Can create interactive content'),
        ]
    
    def __str__(self):
        return f"{self.title} ({self.get_content_type_display()})"
    
    def save(self, *args, **kwargs):
        # Auto-set published_at when status changes to published
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def get_engagement_score(self):
        """Calculate overall engagement score"""
        # Weighted engagement calculation
        return (
            (self.view_count * 1) + 
            (self.like_count * 5) + 
            (self.completion_count * 10) + 
            (self.share_count * 15)
        )
    
    def get_completion_rate(self):
        """Get completion rate percentage"""
        if self.view_count == 0:
            return 0
        return (self.completion_count / self.view_count) * 100
    
    def record_view(self, user=None):
        """Record content view"""
        self.view_count += 1
        self.save(update_fields=['view_count'])
        
        # Create detailed view log
        ContentViewLog.objects.create(
            content=self,
            user=user,
            view_type='view'
        )
    
    def record_completion(self, user):
        """Record content completion"""
        completion, created = ContentCompletion.objects.get_or_create(
            content=self,
            user=user,
            defaults={'completed_at': timezone.now()}
        )
        
        if created:
            self.completion_count += 1
            self.save(update_fields=['completion_count'])
        
        return completion
    
    def can_be_viewed_by(self, user):
        """Check if user can view this content"""
        if self.status != 'published':
            return (user and user.is_authenticated and 
                    user.role == 'government_official' and
                    self.county in user.get_accessible_counties())
        return True


class ContentModule(SoftDeleteModel):
    """
    📚 Learning Modules - Grouped Educational Content
    
    Groups related content into learning modules or courses.
    """
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Module Organization
    county = models.ForeignKey(County, on_delete=models.CASCADE, related_name='education_modules')
    category = models.CharField(max_length=20, choices=EDUCATION_CATEGORIES)
    difficulty = models.CharField(max_length=15, choices=DIFFICULTY_LEVELS)
    
    # Module Content
    content_items = models.ManyToManyField(
        EducationContent, 
        through='ModuleContent',
        related_name='modules'
    )
    
    # Module Metadata
    estimated_duration = models.CharField(max_length=50)
    learning_objectives = ArrayField(models.CharField(max_length=200), default=list)
    prerequisites = models.ManyToManyField('self', blank=True, symmetrical=False)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Creator
    created_by = models.ForeignKey(CustomUser, on_delete=models.CASCADE)
    
    class Meta:
        indexes = [
            models.Index(fields=['county', 'category', 'is_active']),
            models.Index(fields=['is_featured', 'created_at']),
        ]
        ordering = ['title']
    
    def __str__(self):
        return f"{self.title} - {self.county.name}"
    
    def get_progress_for_user(self, user):
        """Get user's progress through this module"""
        total_content = self.content_items.filter(status='published').count()
        if total_content == 0:
            return 0
        
        completed_content = ContentCompletion.objects.filter(
            user=user,
            content__in=self.content_items.filter(status='published')
        ).count()
        
        return (completed_content / total_content) * 100


class ModuleContent(models.Model):
    """
    🔗 Module Content Association
    
    Links content to modules with ordering and requirements.
    """
    
    module = models.ForeignKey(ContentModule, on_delete=models.CASCADE)
    content = models.ForeignKey(EducationContent, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    is_required = models.BooleanField(default=True)
    unlock_requirements = models.JSONField(
        default=dict,
        help_text="Requirements to unlock this content"
    )
    
    class Meta:
        unique_together = ['module', 'content']
        ordering = ['order']
    
    def __str__(self):
        return f"{self.module.title} - {self.content.title}"


class Quiz(SoftDeleteModel):
    """
    🧠 Interactive Quizzes
    
    Quiz content for testing civic knowledge.
    """
    
    education_content = models.OneToOneField(
        EducationContent,
        on_delete=models.CASCADE,
        related_name='quiz_details'
    )
    
    # Quiz Configuration
    passing_score = models.IntegerField(default=70, help_text="Percentage required to pass")
    max_attempts = models.IntegerField(default=3, help_text="Maximum attempts allowed")
    time_limit_minutes = models.IntegerField(null=True, blank=True)
    randomize_questions = models.BooleanField(default=False)
    show_results_immediately = models.BooleanField(default=True)
    
    # Feedback and Certificates
    success_message = models.TextField(blank=True)
    failure_message = models.TextField(blank=True)
    provides_certificate = models.BooleanField(default=False)
    certificate_template = models.CharField(max_length=100, blank=True)
    
    class Meta:
        ordering = ['education_content__title']
    
    def __str__(self):
        return f"Quiz: {self.education_content.title}"


class QuizQuestion(SoftDeleteModel):
    """
    ❓ Quiz Questions
    
    Individual questions within quizzes.
    """
    
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(
        max_length=20,
        choices=[
            ('multiple_choice', 'Multiple Choice'),
            ('true_false', 'True/False'),
            ('short_answer', 'Short Answer'),
            ('matching', 'Matching'),
        ],
        default='multiple_choice'
    )
    
    # Question Configuration
    order = models.IntegerField(default=0)
    points = models.IntegerField(default=1)
    explanation = models.TextField(blank=True, help_text="Explanation for correct answer")
    
    # Multiple Choice Options
    options = models.JSONField(
        default=list,
        help_text="List of answer options for multiple choice"
    )
    correct_answer = models.CharField(max_length=500)
    
    class Meta:
        ordering = ['order', 'created_at']
    
    def __str__(self):
        return f"Q{self.order}: {self.question_text[:50]}..."


class ContentCompletion(SoftDeleteModel):
    """
    ✅ User Content Completion Tracking
    
    Tracks user progress through educational content.
    """
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='content_completions')
    content = models.ForeignKey(EducationContent, on_delete=models.CASCADE, related_name='completions')
    
    # Completion Details
    completed_at = models.DateTimeField(auto_now_add=True)
    time_spent_minutes = models.IntegerField(default=0)
    completion_percentage = models.IntegerField(default=100)
    
    # Quiz Results (if applicable)
    quiz_score = models.IntegerField(null=True, blank=True)
    quiz_attempts = models.IntegerField(default=0)
    passed_quiz = models.BooleanField(default=False)
    
    # Engagement Data
    rating = models.IntegerField(
        null=True, blank=True,
        choices=[(i, i) for i in range(1, 6)],
        help_text="User rating 1-5 stars"
    )
    feedback = models.TextField(blank=True)
    
    class Meta:
        unique_together = ['user', 'content']
        indexes = [
            models.Index(fields=['user', 'completed_at']),
            models.Index(fields=['content', 'completed_at']),
        ]
    
    def __str__(self):
        return f"{self.user.name} completed {self.content.title}"


class UserLearningPath(SoftDeleteModel):
    """
    🛤️ Personalized Learning Paths
    
    AI-recommended learning paths for users based on their interests and progress.
    """
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='learning_paths')
    title = models.CharField(max_length=200)
    description = models.TextField()
    
    # Path Configuration
    recommended_modules = models.ManyToManyField(ContentModule, through='PathModule')
    target_completion_days = models.IntegerField(default=30)
    difficulty_level = models.CharField(max_length=15, choices=DIFFICULTY_LEVELS)
    
    # AI Personalization
    generated_by_ai = models.BooleanField(default=False)
    ai_recommendations = models.JSONField(
        default=dict,
        help_text="AI-generated recommendations and rationale"
    )
    
    # Progress Tracking
    started_at = models.DateTimeField(null=True, blank=True)
    target_completion_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} for {self.user.name}"
    
    def get_progress_percentage(self):
        """Calculate overall progress through learning path"""
        total_modules = self.recommended_modules.count()
        if total_modules == 0:
            return 0
        
        completed_modules = 0
        for module in self.recommended_modules.all():
            if module.get_progress_for_user(self.user) >= 100:
                completed_modules += 1
        
        return (completed_modules / total_modules) * 100


class PathModule(models.Model):
    """
    🔗 Learning Path Module Association
    
    Links modules to learning paths with ordering.
    """
    
    learning_path = models.ForeignKey(UserLearningPath, on_delete=models.CASCADE)
    module = models.ForeignKey(ContentModule, on_delete=models.CASCADE)
    order = models.IntegerField(default=0)
    is_required = models.BooleanField(default=True)
    estimated_completion_days = models.IntegerField(default=7)
    
    class Meta:
        unique_together = ['learning_path', 'module']
        ordering = ['order']


class ContentViewLog(SoftDeleteModel):
    """
    📊 Content View Analytics
    
    Detailed analytics for content engagement.
    """
    
    content = models.ForeignKey(EducationContent, on_delete=models.CASCADE, related_name='view_logs')
    user = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, blank=True,
        related_name='content_views'
    )
    
    # View Details
    view_type = models.CharField(
        max_length=20,
        choices=[
            ('view', 'Content View'),
            ('like', 'Content Like'),
            ('share', 'Content Share'),
            ('comment', 'Content Comment'),
            ('download', 'Resource Download')
        ],
        default='view'
    )
    
    # Session Information
    session_id = models.CharField(max_length=100, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    referrer = models.URLField(blank=True)
    
    # Time Tracking
    time_spent_seconds = models.IntegerField(default=0)
    completion_percentage = models.IntegerField(default=0)
    
    class Meta:
        indexes = [
            models.Index(fields=['content', 'created_at']),
            models.Index(fields=['user', 'view_type']),
        ]
    
    def __str__(self):
        return f"{self.view_type} of {self.content.title}"


# =============================================================================
# SIGNALS FOR AUTOMATED PROCESSING
# =============================================================================

from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=EducationContent)
def trigger_content_ai_enhancement(sender, instance, created, **kwargs):
    """Trigger AI enhancement for new content"""
    if created and instance.status == 'published':
        # Import here to avoid circular imports
        from apps.civic_education.tasks import enhance_content_with_ai
        
        # Trigger async AI enhancement
        enhance_content_with_ai.delay(instance.id)


@receiver(post_save, sender=ContentCompletion)
def update_content_metrics(sender, instance, created, **kwargs):
    """Update content engagement metrics when completion is recorded"""
    if created:
        content = instance.content
        # Update completion count is handled in the model
        
        # Trigger AI learning path updates
        from apps.civic_education.tasks import update_user_learning_recommendations
        update_user_learning_recommendations.delay(instance.user.id)