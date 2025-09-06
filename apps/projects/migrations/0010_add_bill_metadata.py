# Create migration file: python manage.py makemigrations
# apps/projects/migrations/0010_add_bill_metadata.py

from django.db import migrations, models
import django.contrib.postgres.fields

class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0009_project_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='bill',
            name='processing_metadata',
            field=models.JSONField(default=dict, blank=True),
        ),
        migrations.AddField(
            model_name='bill',
            name='processing_time',
            field=models.FloatField(null=True, blank=True),
        ),
        migrations.AddField(
            model_name='bill',
            name='extraction_method',
            field=models.CharField(max_length=50, blank=True),
        ),
    ]