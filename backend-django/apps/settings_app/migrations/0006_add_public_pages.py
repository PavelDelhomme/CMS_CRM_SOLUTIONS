# Generated migration to add public_pages field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0005_add_trial_notification_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemsettings',
            name='public_pages',
            field=models.JSONField(
                blank=True,
                default=dict,
                help_text="Pages publiques du site (docs, contact, faq, legal/terms, legal/privacy)"
            ),
        ),
    ]

