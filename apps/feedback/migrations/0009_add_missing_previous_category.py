# Generated manually to fix missing previous_category column

from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('feedback', '0008_add_remaining_columns'),
    ]

    operations = [
        migrations.AddField(
            model_name='feedbackedit',
            name='previous_category',
            field=models.CharField(default='other', max_length=20),
            preserve_default=False,
        ),
    ]
