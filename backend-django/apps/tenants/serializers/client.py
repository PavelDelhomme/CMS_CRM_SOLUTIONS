"""
Serializers for Client (Tenant) and Domain models
"""
from rest_framework import serializers
from ..models import Client, Domain


class DomainSerializer(serializers.ModelSerializer):
    """Serializer for Domain model"""

    class Meta:
        model = Domain
        fields = ['id', 'domain', 'is_primary']
        read_only_fields = ['id']


class ClientSerializer(serializers.ModelSerializer):
    """Serializer for Client (Tenant) model"""
    domains = DomainSerializer(many=True, read_only=True)

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'slug', 'email', 'plan', 'status',
            'trial_ends_at', 'subscribed_at', 'logo', 'primary_color',
            'secondary_color', 'settings', 'metadata', 'domains',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'deleted_at']

    def update(self, instance, validated_data):
        """Update tenant, merging settings JSON instead of replacing"""
        # Handle settings merge for partial updates
        if 'settings' in validated_data:
            current_settings = instance.settings or {}
            new_settings = validated_data['settings']
            # Merge new settings with existing ones
            if isinstance(new_settings, dict) and isinstance(current_settings, dict):
                validated_data['settings'] = {**current_settings, **new_settings}
        
        return super().update(instance, validated_data)

    def create(self, validated_data):
        """Create tenant with auto-generated slug and schema_name, and create admin with invitation"""
        from django.utils.text import slugify
        from ..models import Domain
        from django.contrib.auth import get_user_model
        from django.utils.crypto import get_random_string
        from django.utils import timezone
        from datetime import timedelta
        
        User = get_user_model()
        
        # Generate slug from name if not provided
        if 'slug' not in validated_data or not validated_data['slug']:
            validated_data['slug'] = slugify(validated_data.get('name', ''))
        
        # Create tenant
        tenant = super().create(validated_data)
        
        # Create default domain
        Domain.objects.create(
            domain=f"{tenant.slug}.localhost",
            tenant=tenant,
            is_primary=True
        )
        
        # If admin email provided, create admin user with invitation
        admin_email = self.initial_data.get('admin_email')
        if admin_email:
            try:
                from ..models import InvitationToken
                from ..quota import check_user_quota
                
                # Check quota
                can_add, current_count, max_users, error_message = check_user_quota(tenant)
                if not can_add:
                    # Log warning but don't fail tenant creation
                    import logging
                    logging.getLogger(__name__).warning(f"Cannot create admin user for tenant {tenant.id}: {error_message}")
                else:
                    # Create admin user
                    admin_username = f"admin_{tenant.slug}"
                    admin_user = User.objects.create_user(
                        username=admin_username,
                        email=admin_email,
                        password=self.initial_data.get('admin_password', get_random_string(length=12)),
                        tenant=tenant,
                        role='tenant-admin',
                        status='pending'  # Will be activated after invitation acceptance
                    )
                    
                    # Create invitation token
                    token = get_random_string(length=64)
                    expires_at = timezone.now() + timedelta(days=7)
                    InvitationToken.objects.create(
                        user=admin_user,
                        tenant=tenant,
                        token=token,
                        expires_at=expires_at
                    )
                    
                    # Send invitation email
                    try:
                        from django.core.mail import send_mail
                        from django.conf import settings
                        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
                        invitation_url = f"{frontend_url}/accept-invitation?token={token}&email={admin_email}"
                        
                        send_mail(
                            subject='Invitation à rejoindre votre tenant',
                            message=f'Vous avez été invité à rejoindre {tenant.name}. Cliquez sur ce lien pour accepter: {invitation_url}',
                            from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cms-crm-solutions.com'),
                            recipient_list=[admin_email],
                            fail_silently=True,
                        )
                    except Exception as e:
                        import logging
                        logging.getLogger(__name__).warning(f"Failed to send invitation email: {e}")
            except Exception as e:
                import logging
                logging.getLogger(__name__).error(f"Failed to create admin user for tenant {tenant.id}: {e}")
        
        return tenant

