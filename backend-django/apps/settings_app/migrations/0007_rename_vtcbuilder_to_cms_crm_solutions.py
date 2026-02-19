# Generated migration: replace VTCBuilder branding by CMS CRM Solutions in existing data

from django.db import migrations


def update_site_branding(apps, schema_editor):
    """Update SystemSettings: VTCBuilder -> CMS CRM Solutions (site_name, meta, etc.)."""
    SystemSettings = apps.get_model('settings_app', 'SystemSettings')
    for obj in SystemSettings.objects.all():
        updated = False
        if obj.site_name == 'VTCBuilder':
            obj.site_name = 'CMS CRM Solutions'
            updated = True
        if obj.public_homepage_meta_title and 'VTCBuilder' in obj.public_homepage_meta_title:
            obj.public_homepage_meta_title = obj.public_homepage_meta_title.replace(
                'VTCBuilder - Le WordPress des chauffeurs VTC',
                'CMS CRM Solutions - Votre site professionnel, simplifié'
            ).replace('VTCBuilder', 'CMS CRM Solutions')
            updated = True
        if obj.public_homepage_meta_description and 'VTC' in obj.public_homepage_meta_description:
            obj.public_homepage_meta_description = obj.public_homepage_meta_description.replace(
                'site VTC professionnel', 'site professionnel'
            ).replace('VTCBuilder', 'CMS CRM Solutions')
            updated = True
        if updated:
            obj.save()


def noop_reverse(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        ('settings_app', '0006_add_public_pages'),
    ]

    operations = [
        migrations.RunPython(update_site_branding, noop_reverse),
    ]
