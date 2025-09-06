# Migration to ensure all users have required fields

from django.db import migrations


def ensure_user_data_integrity(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    County = apps.get_model('users', 'County')
    
    # Get first available county as default
    default_county = County.objects.first()
    if not default_county:
        return  # Skip if no counties exist
    
    # Update users without user_county
    CustomUser.objects.filter(user_county__isnull=True).update(user_county=default_county)
    
    # Ensure all users have proper role
    CustomUser.objects.filter(role__isnull=True).update(role='citizen')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_merge_20250825_1605'),
    ]

    operations = [
        migrations.RunPython(ensure_user_data_integrity, migrations.RunPython.noop),
    ]