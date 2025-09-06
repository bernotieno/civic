# Generated manually to fix Bill model fields safely
# This migration checks if fields exist before adding them

from django.db import migrations, models, connection


def add_field_if_not_exists(apps, schema_editor):
    """Add fields to Bill model only if they don't already exist"""
    with connection.cursor() as cursor:
        # Get existing columns
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='projects_bill'
        """)
        existing_columns = {row[0] for row in cursor.fetchall()}
        
        # Fields to add with their SQL definitions
        fields_to_add = {
            'bill_number': "VARCHAR(50) NULL",
            'committee': "VARCHAR(200) NULL", 
            'committee_deadline': "DATE NULL",
            'first_reading_date': "DATE NULL",
            'image': "VARCHAR(100) NULL",
            'introduced_date': "DATE NULL",
        }
        
        # Add missing fields
        for field_name, field_def in fields_to_add.items():
            if field_name not in existing_columns:
                cursor.execute(f"""
                    ALTER TABLE projects_bill 
                    ADD COLUMN {field_name} {field_def}
                """)
                print(f"Added field: {field_name}")
            else:
                print(f"Field already exists: {field_name}")
        
        # Handle public_participation_open specially (it exists but might need default)
        if 'public_participation_open' not in existing_columns:
            cursor.execute("""
                ALTER TABLE projects_bill 
                ADD COLUMN public_participation_open BOOLEAN NOT NULL DEFAULT true
            """)
            print("Added field: public_participation_open")
        else:
            print("Field already exists: public_participation_open")


def add_indexes_if_not_exist(apps, schema_editor):
    """Add indexes only if they don't already exist"""
    with connection.cursor() as cursor:
        # Get existing indexes
        cursor.execute("""
            SELECT indexname 
            FROM pg_indexes 
            WHERE tablename='projects_bill'
        """)
        existing_indexes = {row[0] for row in cursor.fetchall()}
        
        # Indexes to create
        indexes_to_create = [
            ("projects_bi_status_07c63a_idx", "CREATE INDEX IF NOT EXISTS projects_bi_status_07c63a_idx ON projects_bill (status, public_participation_open)"),
            ("projects_bi_bill_nu_9ea1b5_idx", "CREATE INDEX IF NOT EXISTS projects_bi_bill_nu_9ea1b5_idx ON projects_bill (bill_number)"),
            ("projects_bi_introdu_e665ec_idx", "CREATE INDEX IF NOT EXISTS projects_bi_introdu_e665ec_idx ON projects_bill (introduced_date)"),
        ]
        
        for index_name, create_sql in indexes_to_create:
            if index_name not in existing_indexes:
                cursor.execute(create_sql)
                print(f"Created index: {index_name}")
            else:
                print(f"Index already exists: {index_name}")


def reverse_migration(apps, schema_editor):
    """Reverse the migration by removing added fields and indexes"""
    with connection.cursor() as cursor:
        # Remove indexes
        cursor.execute("DROP INDEX IF EXISTS projects_bi_status_07c63a_idx")
        cursor.execute("DROP INDEX IF EXISTS projects_bi_bill_nu_9ea1b5_idx") 
        cursor.execute("DROP INDEX IF EXISTS projects_bi_introdu_e665ec_idx")
        
        # Note: We don't remove fields in reverse because they might contain data
        # and some fields already existed before this migration


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0015_add_embedding_metadata'),
    ]

    operations = [
        migrations.RunPython(
            add_field_if_not_exists,
            reverse_migration,
        ),
        migrations.RunPython(
            add_indexes_if_not_exist,
            reverse_migration,
        ),
    ]
