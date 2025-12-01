# Generated migration for SystemSettings model

from django.db import migrations, models
import json


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='SystemSettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('site_name', models.CharField(default='VTCBuilder', max_length=255)),
                ('site_url', models.URLField(default='http://localhost:9494')),
                ('contact_email', models.EmailField(default='contact@vtcbuilder.com', max_length=254)),
                ('support_email', models.EmailField(default='support@vtcbuilder.com', max_length=254)),
                ('email_host', models.CharField(default='smtp.maily.ovh', max_length=255)),
                ('email_port', models.IntegerField(default=587)),
                ('email_use_tls', models.BooleanField(default=True)),
                ('email_use_ssl', models.BooleanField(default=False)),
                ('email_host_user', models.CharField(blank=True, max_length=255)),
                ('email_host_password', models.CharField(blank=True, max_length=255)),
                ('email_from', models.EmailField(default='noreply@vtcbuilder.com', max_length=254)),
                ('default_trial_days', models.IntegerField(default=14)),
                ('enable_trial', models.BooleanField(default=True)),
                ('password_min_length', models.IntegerField(default=8)),
                ('require_email_verification', models.BooleanField(default=True)),
                ('session_timeout_minutes', models.IntegerField(default=1440)),
                ('max_login_attempts', models.IntegerField(default=5)),
                ('lockout_duration_minutes', models.IntegerField(default=30)),
                ('default_currency', models.CharField(default='EUR', max_length=3)),
                ('tax_rate', models.DecimalField(decimal_places=2, default=20.0, max_digits=5)),
                ('invoice_prefix', models.CharField(default='INV-', max_length=10)),
                ('payment_terms_days', models.IntegerField(default=30)),
                ('max_file_size_mb', models.IntegerField(default=10)),
                ('allowed_file_types', models.JSONField(blank=True, default=list)),
                ('enable_email_notifications', models.BooleanField(default=True)),
                ('notify_on_new_tenant', models.BooleanField(default=True)),
                ('notify_on_payment_failed', models.BooleanField(default=True)),
                ('notify_on_subscription_expiring', models.BooleanField(default=True)),
                ('maintenance_mode', models.BooleanField(default=False)),
                ('maintenance_message', models.TextField(blank=True, default='Le site est en maintenance.')),
                ('extra_settings', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'verbose_name': 'Paramètres Système',
                'verbose_name_plural': 'Paramètres Système',
                'db_table': 'system_settings',
            },
        ),
    ]

