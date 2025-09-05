# apps/api/bill_serializers.py
from rest_framework import serializers

# Request serializers (existing)
class BillCreateRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=True)
    description = serializers.CharField(required=True)
    sponsor = serializers.CharField(max_length=255, required=True)
    status = serializers.ChoiceField(
        choices=[
            ('draft', 'Draft'),
            ('first_reading', 'First Reading'),
            ('committee_stage', 'Committee Stage'),
            ('second_reading', 'Second Reading'),
            ('third_reading', 'Third Reading')
        ],
        default='draft',
        required=False
    )
    participation_deadline = serializers.DateField(required=False)
    public_participation_open = serializers.BooleanField(default=True, required=False)
    document = serializers.FileField(
        required=False,
        help_text="Upload PDF document"
    )
    async_processing = serializers.BooleanField(default=True, required=False)
    use_enhanced_processing = serializers.BooleanField(default=True, required=False)

class BillUpdateRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False)
    sponsor = serializers.CharField(max_length=255, required=False)
    status = serializers.ChoiceField(
        choices=[
            ('draft', 'Draft'),
            ('first_reading', 'First Reading'),
            ('committee_stage', 'Committee Stage'),
            ('second_reading', 'Second Reading'),
            ('third_reading', 'Third Reading')
        ],
        required=False
    )
    participation_deadline = serializers.DateField(required=False)
    document = serializers.FileField(required=False)

class ProcessingRetryRequestSerializer(serializers.Serializer):
    async_processing = serializers.BooleanField(
        default=True,
        help_text="Use background task with real-time updates"
    )
    use_enhanced_processing = serializers.BooleanField(
        default=True,
        help_text="Use enhanced AI processing features"
    )

class FeedbackResponseRequestSerializer(serializers.Serializer):
    response_text = serializers.CharField(
        help_text="Parliament response to citizen feedback"
    )

class ProjectCreateRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField()
    sponsor = serializers.CharField(max_length=255)
    status = serializers.ChoiceField(
        choices=[
            ('proposed', 'Proposed'),
            ('approved', 'Approved'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed')
        ],
        default='proposed'
    )
    participation_deadline = serializers.DateTimeField(required=False)
    document = serializers.FileField(required=False)

class ProjectUpdateRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255, required=False)
    description = serializers.CharField(required=False)
    sponsor = serializers.CharField(max_length=255, required=False)
    status = serializers.ChoiceField(
        choices=[
            ('proposed', 'Proposed'),
            ('approved', 'Approved'),
            ('in_progress', 'In Progress'),
            ('completed', 'Completed')
        ],
        required=False
    )
    participation_deadline = serializers.DateTimeField(required=False)
    document = serializers.FileField(required=False)

class StatusUpdateRequestSerializer(serializers.Serializer):
    status = serializers.CharField()

# Response serializers (new)
class DashboardStatsResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = serializers.DictField()
    user_level = serializers.CharField()
    scope = serializers.CharField()

class UsersListResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = serializers.ListField()

class FeedbackListResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = serializers.ListField()
    total_count = serializers.IntegerField()
    user_level = serializers.CharField()
    scope = serializers.CharField()

class FeedbackResponseSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    response_id = serializers.CharField()
    feedback_status = serializers.CharField()

class ProjectsListResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    data = serializers.ListField()

class ProjectCreatedResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    project_id = serializers.CharField()

class BillProgressResponseSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    bill_id = serializers.CharField()
    progress = serializers.DictField()
    processing_type = serializers.CharField()
    supports_realtime = serializers.BooleanField()
    bill_info = serializers.DictField()

class ProcessingRetrySuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    bill_id = serializers.CharField()
    new_task_id = serializers.CharField(required=False)
    retry_attempt = serializers.IntegerField(required=False)
    processing_async = serializers.BooleanField()
    progress_endpoints = serializers.DictField(required=False)

class CancellationSuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField()
    message = serializers.CharField()
    bill_id = serializers.CharField()
    was_cancelled = serializers.BooleanField()
    task_id = serializers.CharField(required=False)
    can_retry = serializers.BooleanField()
