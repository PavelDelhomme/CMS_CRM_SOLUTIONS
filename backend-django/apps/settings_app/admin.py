"""
Admin configuration for System Settings
"""
from django.contrib import admin
from .models import SystemSettings


@admin.register(SystemSettings)
class SystemSettingsAdmin(admin.ModelAdmin):
    """Admin interface for System Settings"""
    list_display = ['site_name', 'site_url', 'contact_email', 'maintenance_mode', 'updated_at']
    readonly_fields = ['created_at', 'updated_at']
    
    fieldsets = (
        ('Général', {
            'fields': ('site_name', 'site_url', 'contact_email', 'support_email')
        }),
        ('Configuration Email', {
            'fields': ('email_host', 'email_port', 'email_use_tls', 'email_use_ssl', 
                      'email_host_user', 'email_host_password', 'email_from')
        }),
        ('Essai', {
            'fields': ('enable_trial', 'default_trial_days')
        }),
        ('Sécurité', {
            'fields': ('password_min_length', 'require_email_verification', 
                      'session_timeout_minutes', 'max_login_attempts', 'lockout_duration_minutes')
        }),
        ('Facturation', {
            'fields': ('default_currency', 'tax_rate', 'invoice_prefix', 'payment_terms_days')
        }),
        ('Stockage', {
            'fields': ('max_file_size_mb', 'allowed_file_types')
        }),
        ('Notifications', {
            'fields': ('enable_email_notifications', 'notify_on_new_tenant', 
                      'notify_on_payment_failed', 'notify_on_subscription_expiring')
        }),
        ('Maintenance', {
            'fields': ('maintenance_mode', 'maintenance_message')
        }),
        ('Autres', {
            'fields': ('extra_settings',)
        }),
        ('Horodatage', {
            'fields': ('created_at', 'updated_at')
        }),
    )

