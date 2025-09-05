# Generated manually to fix remaining missing columns

from django.db import migrations, connection

def add_remaining_columns(apps, schema_editor):
    """Add remaining missing columns"""
    with connection.cursor() as cursor:
        # Get existing columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedback_feedback';
        """)
        existing_columns = [row[0] for row in cursor.fetchall()]
        
        # Define remaining required columns
        remaining_columns = {
            'tracking_id': "VARCHAR(16) UNIQUE NOT NULL DEFAULT 'TEMP'",
            'is_anonymous': "BOOLEAN NOT NULL DEFAULT false",
            'submitted_via': "VARCHAR(10) NOT NULL DEFAULT 'web'",
            'response_count': "INTEGER NOT NULL DEFAULT 0",
            'last_response_at': "TIMESTAMP NULL",
            'view_count': "INTEGER NOT NULL DEFAULT 0",
            'sentiment_score': "DOUBLE PRECISION NULL",
            'can_edit': "BOOLEAN NOT NULL DEFAULT true",
            'can_delete': "BOOLEAN NOT NULL DEFAULT true",
            'edited_at': "TIMESTAMP NULL",
            'edit_count': "INTEGER NOT NULL DEFAULT 0",
            'related_bill_id': "VARCHAR(50) NULL",
            'related_project_id': "UUID NULL"
        }
        
        # Add missing columns
        for column_name, column_def in remaining_columns.items():
            if column_name not in existing_columns:
                cursor.execute(f"""
                    ALTER TABLE feedback_feedback 
                    ADD COLUMN {column_name} {column_def};
                """)
                print(f"Added column: {column_name}")
        
        # Create indexes for important columns
        indexes = [
            "CREATE INDEX IF NOT EXISTS feedback_fe_tracking_id_idx ON feedback_feedback (tracking_id);",
            "CREATE INDEX IF NOT EXISTS feedback_fe_is_anonymous_idx ON feedback_feedback (is_anonymous);",
            "CREATE INDEX IF NOT EXISTS feedback_fe_related_bill_idx ON feedback_feedback (related_bill_id);",
            "CREATE INDEX IF NOT EXISTS feedback_fe_related_project_idx ON feedback_feedback (related_project_id);"
        ]
        
        for index_sql in indexes:
            cursor.execute(index_sql)

def reverse_remaining_columns(apps, schema_editor):
    """Remove added columns"""
    pass

class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0007_add_all_missing_columns'),
    ]

    operations = [
        migrations.RunPython(add_remaining_columns, reverse_remaining_columns),
    ]