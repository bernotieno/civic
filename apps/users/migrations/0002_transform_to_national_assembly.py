# Generated migration for transforming to National Assembly platform

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_initial'),
    ]

    operations = [
        # Rename tenant field to user_county
        migrations.RenameField(
            model_name='customuser',
            old_name='tenant',
            new_name='user_county',
        ),
        
        # Rename official_level to admin_level
        migrations.RenameField(
            model_name='customuser',
            old_name='official_level',
            new_name='admin_level',
        ),
        
        # Remove home_county field
        migrations.RemoveField(
            model_name='customuser',
            name='home_county',
        ),
        
        # Remove accessible_counties field
        migrations.RemoveField(
            model_name='customuser',
            name='accessible_counties',
        ),
        
        # Update role choices
        migrations.AlterField(
            model_name='customuser',
            name='role',
            field=models.CharField(
                choices=[
                    ('citizen', 'Citizen'),
                    ('parliament_admin', 'Parliament Administrator'),
                    ('anonymous', 'Anonymous')
                ],
                default='citizen',
                max_length=20,
                db_index=True
            ),
        ),
        
        # Update admin_level choices
        migrations.AlterField(
            model_name='customuser',
            name='admin_level',
            field=models.CharField(
                blank=True,
                choices=[
                    ('parliament_admin', 'Parliament Administrator'),
                    ('super_admin', 'Super Administrator')
                ],
                help_text='Only applicable for parliament_admin role',
                max_length=20,
                null=True
            ),
        ),
        
        # Update user_county help text
        migrations.AlterField(
            model_name='customuser',
            name='user_county',
            field=models.ForeignKey(
                help_text="User's county for location reference only",
                on_delete=django.db.models.deletion.CASCADE,
                related_name='users',
                to='users.county'
            ),
        ),
    ]