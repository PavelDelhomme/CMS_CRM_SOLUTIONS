# Generated migration to replace requires_premium with available_plans and add call_to_action

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('blocks', '0001_initial'),
        ('billing', '0001_initial'),
    ]

    operations = [
        # Add call_to_action field
        migrations.AddField(
            model_name='blocktype',
            name='call_to_action',
            field=models.JSONField(blank=True, default=dict, help_text="Configuration des call-to-action (boutons, liens, etc.)"),
        ),
        # Add available_plans ManyToMany field
        migrations.AddField(
            model_name='blocktype',
            name='available_plans',
            field=models.ManyToManyField(
                blank=True,
                help_text="Plans tarifaires qui donnent accès à ce bloc. Si vide, accessible à tous.",
                related_name='available_blocks',
                to='billing.pricingplan'
            ),
        ),
        # Remove requires_premium field (will be done in a separate migration if needed)
        # We keep it for now to avoid data loss, but it will be deprecated
    ]

