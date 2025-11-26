"""
Serializers for System Settings
"""
from rest_framework import serializers
from .models import SystemSettings


class SystemSettingsSerializer(serializers.ModelSerializer):
    """Serializer for System Settings"""
    
    class Meta:
        model = SystemSettings
        fields = [
            'id',
            'site_name',
            'site_url',
            'contact_email',
            'support_email',
            'email_host',
            'email_port',
            'email_use_tls',
            'email_use_ssl',
            'email_host_user',
            'email_host_password',
            'email_from',
            'default_trial_days',
            'enable_trial',
            'password_min_length',
            'require_email_verification',
            'session_timeout_minutes',
            'max_login_attempts',
            'lockout_duration_minutes',
            'default_currency',
            'tax_rate',
            'invoice_prefix',
            'payment_terms_days',
            'max_file_size_mb',
            'allowed_file_types',
            'enable_email_notifications',
            'notify_on_new_tenant',
            'notify_on_payment_failed',
            'notify_on_subscription_expiring',
            'maintenance_mode',
            'maintenance_message',
            'extra_settings',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def validate(self, data):
        """Validate settings data"""
        if data.get('email_port') and not (1 <= data['email_port'] <= 65535):
            raise serializers.ValidationError({'email_port': 'Le port doit être entre 1 et 65535'})
        
        if data.get('default_trial_days') and data['default_trial_days'] < 0:
            raise serializers.ValidationError({'default_trial_days': 'Les jours d\'essai doivent être positifs'})
        
        if data.get('password_min_length') and data['password_min_length'] < 6:
            raise serializers.ValidationError({'password_min_length': 'La longueur minimale du mot de passe doit être d\'au moins 6 caractères'})
        
        if data.get('tax_rate') is not None and (data['tax_rate'] < 0 or data['tax_rate'] > 100):
            raise serializers.ValidationError({'tax_rate': 'Le taux de taxe doit être entre 0 et 100'})
        
        return data

