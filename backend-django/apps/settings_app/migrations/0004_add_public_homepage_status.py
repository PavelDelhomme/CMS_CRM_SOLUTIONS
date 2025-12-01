# Generated migration to add public_homepage_status field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0003_add_stripe_config'),
    ]

    operations = [
        migrations.AddField(
            model_name='systemsettings',
            name='public_homepage_status',
            field=models.CharField(
                choices=[('draft', 'Brouillon'), ('published', 'Publié')],
                default='draft',
                help_text="Statut de publication de la page d'accueil publique",
                max_length=20
            ),
        ),
    ]

