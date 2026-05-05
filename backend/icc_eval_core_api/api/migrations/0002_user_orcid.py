# Generated manually for ORCID field addition

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='orcid',
            field=models.CharField(
                blank=True,
                help_text='ORCID identifier (e.g., 0000-0002-1825-0097)',
                max_length=19,
                null=True,
                unique=True
            ),
        ),
    ]
