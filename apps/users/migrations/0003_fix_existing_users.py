# Migration to fix existing users with old role/field names

from django.db import migrations


def fix_existing_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    
    # Update users with government_official role to parliament_admin
    CustomUser.objects.filter(role='government_official').update(role='parliament_admin')
    
    # Clear admin_level for citizens and anonymous users
    CustomUser.objects.filter(role__in=['citizen', 'anonymous']).update(admin_level=None)


def reverse_fix_existing_users(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    
    # Reverse the changes
    CustomUser.objects.filter(role='parliament_admin').update(role='government_official')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_transform_to_national_assembly'),
    ]

    operations = [
        migrations.RunPython(fix_existing_users, reverse_fix_existing_users),
    ]