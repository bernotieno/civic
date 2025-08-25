# Generated migration for transforming feedback to National Assembly platform

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0001_initial'),
    ]

    operations = [
        # Rename county field to user_county
        migrations.RenameField(
            model_name='feedback',
            old_name='county',
            new_name='user_county',
        ),
        
        # Remove location hierarchy fields
        migrations.RemoveField(
            model_name='feedback',
            name='sub_county',
        ),
        migrations.RemoveField(
            model_name='feedback',
            name='ward',
        ),
        migrations.RemoveField(
            model_name='feedback',
            name='village',
        ),
        
        # Add related bill and project fields
        migrations.AddField(
            model_name='feedback',
            name='related_bill_id',
            field=models.CharField(
                blank=True,
                help_text='ID of related parliamentary bill',
                max_length=50,
                null=True
            ),
        ),
        migrations.AddField(
            model_name='feedback',
            name='related_project_id',
            field=models.UUIDField(
                blank=True,
                help_text='ID of related national project',
                null=True
            ),
        ),
        
        # Update user_county help text
        migrations.AlterField(
            model_name='feedback',
            name='user_county',
            field=models.ForeignKey(
                help_text="User's county for reference only - no data isolation",
                on_delete=django.db.models.deletion.CASCADE,
                related_name='feedback_items',
                to='users.county'
            ),
        ),
        
        # Update feedback categories
        migrations.AlterField(
            model_name='feedback',
            name='category',
            field=models.CharField(
                choices=[
                    ('legislation', 'Legislation & Bills'),
                    ('budget', 'Budget & Finance'),
                    ('healthcare', 'Healthcare Policy'),
                    ('education', 'Education Policy'),
                    ('infrastructure', 'Infrastructure Development'),
                    ('agriculture', 'Agriculture & Food Security'),
                    ('environment', 'Environment & Climate'),
                    ('security', 'National Security'),
                    ('governance', 'Governance & Oversight'),
                    ('economic', 'Economic Policy'),
                    ('social', 'Social Services'),
                    ('other', 'Other National Issues')
                ],
                max_length=20,
                db_index=True
            ),
        ),
    ]