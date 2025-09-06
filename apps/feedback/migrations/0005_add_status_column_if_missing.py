# Generated manually to fix missing status column

from django.db import migrations, connection

def add_status_column_if_missing(apps, schema_editor):
    """Add status column if it doesn't exist"""
    with connection.cursor() as cursor:
        # Check if status column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedback_feedback' AND column_name='status';
        """)
        
        if not cursor.fetchone():
            # Add the status column
            cursor.execute("""
                ALTER TABLE feedback_feedback 
                ADD COLUMN status VARCHAR(15) NOT NULL DEFAULT 'pending';
            """)
            
            # Create index on status column
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS feedback_fe_status_idx 
                ON feedback_feedback (status);
            """)

def reverse_add_status_column(apps, schema_editor):
    """Remove status column if it exists"""
    with connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE feedback_feedback 
            DROP COLUMN IF EXISTS status;
        """)

class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0004_remove_feedback_feedback_fe_county__55692a_idx_and_more'),
    ]

    operations = [
        migrations.RunPython(add_status_column_if_missing, reverse_add_status_column),
    ]