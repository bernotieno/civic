# Generated manually to fix missing category column

from django.db import migrations, connection

def add_category_column_if_missing(apps, schema_editor):
    """Add category column if it doesn't exist"""
    with connection.cursor() as cursor:
        # Check if category column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='feedback_feedback' AND column_name='category';
        """)
        
        if not cursor.fetchone():
            # Add the category column
            cursor.execute("""
                ALTER TABLE feedback_feedback 
                ADD COLUMN category VARCHAR(20) NOT NULL DEFAULT 'other';
            """)
            
            # Create index on category column
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS feedback_fe_category_idx 
                ON feedback_feedback (category);
            """)

def reverse_add_category_column(apps, schema_editor):
    """Remove category column if it exists"""
    with connection.cursor() as cursor:
        cursor.execute("""
            ALTER TABLE feedback_feedback 
            DROP COLUMN IF EXISTS category;
        """)

class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0005_add_status_column_if_missing'),
    ]

    operations = [
        migrations.RunPython(add_category_column_if_missing, reverse_add_category_column),
    ]