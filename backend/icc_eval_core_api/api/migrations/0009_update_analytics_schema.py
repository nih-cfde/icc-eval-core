from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0001_squashed_0008_alter_project_date_end_alter_project_date_start'),
    ]

    operations = [
        migrations.RenameField(
            model_name='analytics',
            old_name='top_continents',
            new_name='continents',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_countries',
            new_name='countries',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_regions',
            new_name='regions',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_cities',
            new_name='cities',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_languages',
            new_name='languages',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_devices',
            new_name='devices',
        ),
        migrations.RenameField(
            model_name='analytics',
            old_name='top_oses',
            new_name='operating_systems',
        ),
        migrations.AddField(
            model_name='analytics',
            name='page_views',
            field=models.JSONField(default=dict),
        ),
    ]
