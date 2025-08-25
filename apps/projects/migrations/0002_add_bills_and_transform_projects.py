# Generated migration for adding Bills model and transforming Projects

from django.db import migrations, models
import django.db.models.deletion
import uuid
from apps.users.models import ActiveManager


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
        ('users', '0002_transform_to_national_assembly'),
    ]

    operations = [
        # Create Bill model
        migrations.CreateModel(
            name='Bill',
            fields=[
                ('is_deleted', models.BooleanField(db_index=True, default=False)),
                ('deleted_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('bill_number', models.CharField(help_text='Official bill number', max_length=50, unique=True)),
                ('title', models.CharField(max_length=300)),
                ('description', models.TextField()),
                ('full_text', models.TextField(blank=True, help_text='Full bill text')),
                ('summary', models.TextField(help_text='Executive summary for citizens')),
                ('sponsor', models.CharField(help_text='Bill sponsor (MP/Ministry)', max_length=200)),
                ('committee', models.CharField(blank=True, help_text='Assigned committee', max_length=200)),
                ('status', models.CharField(choices=[('draft', 'Draft'), ('first_reading', 'First Reading'), ('committee_stage', 'Committee Stage'), ('second_reading', 'Second Reading'), ('third_reading', 'Third Reading'), ('presidential_assent', 'Presidential Assent'), ('enacted', 'Enacted'), ('withdrawn', 'Withdrawn')], default='draft', max_length=20)),
                ('introduced_date', models.DateField(blank=True, null=True)),
                ('first_reading_date', models.DateField(blank=True, null=True)),
                ('committee_deadline', models.DateField(blank=True, null=True)),
                ('document', models.FileField(blank=True, null=True, upload_to='bills/documents/')),
                ('image', models.ImageField(blank=True, null=True, upload_to='bills/')),
                ('public_participation_open', models.BooleanField(default=True)),
                ('participation_deadline', models.DateField(blank=True, null=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='users.customuser')),
                ('deleted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='deleted_%(class)s_set', to='users.customuser')),
            ],
            options={
                'ordering': ['-introduced_date', '-created_at'],
            },
            managers=[
                ('objects', ActiveManager()),
            ],
        ),
        
        # Remove county field from Project model
        migrations.RemoveField(
            model_name='project',
            name='county',
        ),
        
        # Update Project model fields
        migrations.AlterField(
            model_name='project',
            name='status',
            field=models.CharField(
                choices=[
                    ('proposed', 'Proposed'),
                    ('approved', 'Approved'),
                    ('in_progress', 'In Progress'),
                    ('completed', 'Completed'),
                    ('suspended', 'Suspended')
                ],
                default='proposed',
                max_length=20
            ),
        ),
        
        # Update project types
        migrations.AlterField(
            model_name='project',
            name='project_type',
            field=models.CharField(
                choices=[
                    ('infrastructure', 'Infrastructure Development'),
                    ('healthcare', 'Healthcare Initiative'),
                    ('education', 'Education Program'),
                    ('agriculture', 'Agriculture & Food Security'),
                    ('environment', 'Environment & Climate'),
                    ('economic', 'Economic Development'),
                    ('social', 'Social Services'),
                    ('governance', 'Governance & Reform')
                ],
                max_length=20
            ),
        ),
        
        # Add new fields to Project model
        migrations.AddField(
            model_name='project',
            name='implementing_ministry',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='project',
            name='target_beneficiaries',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='project',
            name='public_participation_open',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='project',
            name='participation_deadline',
            field=models.DateField(blank=True, null=True),
        ),
        
        # Add indexes for Bill model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bill_status_participation ON projects_bill(status, public_participation_open);",
            reverse_sql="DROP INDEX IF EXISTS idx_bill_status_participation;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bill_number ON projects_bill(bill_number);",
            reverse_sql="DROP INDEX IF EXISTS idx_bill_number;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_bill_introduced_date ON projects_bill(introduced_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_bill_introduced_date;"
        ),
        
        # Add indexes for Project model
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_status_participation ON projects_project(status, public_participation_open);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_status_participation;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_type ON projects_project(project_type);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_type;"
        ),
        migrations.RunSQL(
            "CREATE INDEX IF NOT EXISTS idx_project_start_date ON projects_project(start_date);",
            reverse_sql="DROP INDEX IF EXISTS idx_project_start_date;"
        ),
    ]