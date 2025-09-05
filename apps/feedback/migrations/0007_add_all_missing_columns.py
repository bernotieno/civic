# Generated manually to fix all missing columns

from django.db import migrations, connection

def add_all_missing_columns(apps, schema_editor):
    """Add all missing columns from the Feedback model"""
    with connection.cursor() as cursor:
        # Get existing columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedback_feedback';
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Define all required columns with their SQL definitions
        required_columns = {
            'priority': "VARCHAR(10) NOT NULL DEFAULT 'medium'",
            'related_bill_id': "VARCHAR(50) NULL",
            'related_project_id': "UUID NULL",
            'submitted_via': "VARCHAR(10) NOT NULL DEFAULT 'web'",
            'response_count': "INTEGER NOT NULL DEFAULT 0",
            'last_response_at': "TIMESTAMP NULL",
            'resolved_at': "TIMESTAMP NULL",
            'view_count': "INTEGER NOT NULL DEFAULT 0",
            'sentiment_score': "DOUBLE PRECISION NULL",
            'can_edit': "BOOLEAN NOT NULL DEFAULT true",
            'can_delete': "BOOLEAN NOT NULL DEFAULT true",
            'edited_at': "TIMESTAMP NULL",
            'edit_count': "INTEGER NOT NULL DEFAULT 0"
        }
        
        # Add missing columns
        for column_name, column_def in required_columns.items():
            if column_name not in existing_columns:
                cursor.execute(f"""
                    ALTER TABLE feedback_feedback 
                    ADD COLUMN {column_name} {column_def};
                """)
                print(f"Added column: {column_name}")

def reverse_add_all_missing_columns(apps, schema_editor):
    """Remove added columns"""
    pass  # Don't remove columns in reverse

class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0006_add_category_column_if_missing'),
    ]

    operations = [
        migrations.RunPython(add_all_missing_columns, reverse_add_all_missing_columns),
    ]