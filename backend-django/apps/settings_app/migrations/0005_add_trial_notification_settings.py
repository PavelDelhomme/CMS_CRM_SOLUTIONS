# Generated migration to add trial notification settings

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0004_add_public_homepage_status'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemsettings',
            name='trial_notification_days',
            field=models.JSONField(
                blank=True,
                default=list,
                help_text="Jours avant expiration pour envoyer des notifications (ex: [7, 3, 1, 0])"
            ),
        ),
        migrations.AddField(
            model_name='systemsettings',
            name='trial_auto_expire',
            field=models.BooleanField(
                default=True,
                help_text="Passer automatiquement les trials expirés au statut 'expired'"
            ),
        ),
    ]

