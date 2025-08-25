from django.db import models
from apps.users.models import SoftDeleteModel, ActiveManager
import uuid

PROJECT_STATUS_CHOICES = [
    ('planning', 'Planning'),
    ('approved', 'Approved'),
    ('in_progress', 'In Progress'),
    ('completed', 'Completed'),
    ('cancelled', 'Cancelled'),
]

PROJECT_TYPES = [
    ('infrastructure', 'Infrastructure'),
    ('healthcare', 'Healthcare'),
    ('education', 'Education'),
    ('agriculture', 'Agriculture'),
    ('environment', 'Environment'),
    ('social', 'Social Services'),
]

class Project(SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField()
    county = models.ForeignKey('users.County', on_delete=models.CASCADE, related_name='projects')
    project_type = models.CharField(max_length=20, choices=PROJECT_TYPES)
    status = models.CharField(max_length=20, choices=PROJECT_STATUS_CHOICES, default='planning')
    budget = models.DecimalField(max_digits=15, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    image = models.ImageField(upload_to='projects/', null=True, blank=True)
    document = models.FileField(upload_to='projects/documents/', null=True, blank=True)
    created_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    def __str__(self):
        return f"{self.title} - {self.county.name}"

class AdminFeedbackResponse(SoftDeleteModel):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    feedback = models.OneToOneField('feedback.Feedback', on_delete=models.CASCADE, related_name='admin_response')
    response_text = models.TextField()
    responded_by = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE, related_name='admin_responses')
    response_date = models.DateTimeField(auto_now_add=True)
    
    objects = ActiveManager()
    all_objects = models.Manager()
    
    def __str__(self):
        return f"Admin response to {self.feedback.title}"