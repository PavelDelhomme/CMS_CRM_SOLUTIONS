"""
Serializers for tenant models
"""
from rest_framework import serializers
from .models import Tenant, Domain, User


class DomainSerializer(serializers.ModelSerializer):
    """Serializer for Domain model"""

    class Meta:
        model = Domain
        fields = ['id', 'domain', 'is_primary']
        read_only_fields = ['id']


class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model"""
    domains = DomainSerializer(many=True, read_only=True)

    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'slug', 'email', 'plan', 'status',
            'trial_ends_at', 'subscribed_at', 'logo', 'primary_color',
            'secondary_color', 'settings', 'metadata', 'domains',
            'created_at', 'updated_at', 'deleted_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at', 'deleted_at']

    def create(self, validated_data):
        """Create tenant with auto-generated slug and schema_name, and create admin with invitation"""
        from django.utils.text import slugify
        from django.utils.crypto import get_random_string
        from django.utils import timezone
        from datetime import timedelta
        from .models import User, InvitationToken
        from .permissions import assign_role_permissions
        from django.core.mail import send_mail
        from django.conf import settings
        
        # Generate slug if not provided
        if not validated_data.get('slug'):
            validated_data['slug'] = slugify(validated_data['name'])
        
        tenant = super().create(validated_data)
        
        # Use the email provided in tenant.email to create the admin user
        admin_email = validated_data.get('email', tenant.email)
        
        # If no email provided, generate a default one
        if not admin_email:
            admin_email = f"admin@{tenant.slug}.vtcbuilder.local"
            tenant.email = admin_email
            tenant.save(update_fields=['email'])
        
        # Generate username from email
        username_base = admin_email.split('@')[0].replace('.', '_').replace('-', '_')
        tenant_slug = tenant.slug.replace('-', '_').replace('.', '_')
        username = f"{username_base}_{tenant_slug}"[:30]  # Max 30 chars for username
        
        # Check if user already exists with this email
        existing_user = User.objects.filter(email=admin_email).first()
        if existing_user:
            # Update existing user to be admin of this tenant
            existing_user.tenant = tenant
            existing_user.role = 'tenant-admin'
            existing_user.status = 'pending'
            existing_user.save()
            admin_user = existing_user
        else:
            # Generate a random password (user will set their own via invitation)
            random_password = get_random_string(length=32)
            
            # Create admin user in public schema (for authentication)
            admin_user = User.objects.create_user(
                username=username,
                email=admin_email,
                password=random_password,  # Temporary password, will be changed via invitation
                first_name='Admin',
                last_name=tenant.name[:30] if tenant.name else 'User',
                tenant=tenant,
                role='tenant-admin',
                status='pending'  # Pending until they complete setup
            )
            
        # Assign permissions if function exists
        try:
            from .permissions import assign_role_permissions
            assign_role_permissions(admin_user, 'tenant-admin')
        except ImportError:
            pass  # Permissions system optional
        
        # Create invitation token (valid for 30 days) - check if one already exists
        existing_token = InvitationToken.objects.filter(
            user=admin_user,
            tenant=tenant,
            used=False
        ).first()
        
        if not existing_token:
            invitation_token = get_random_string(length=64)
            expires_at = timezone.now() + timedelta(days=30)
            
            InvitationToken.objects.create(
                user=admin_user,
                tenant=tenant,
                token=invitation_token,
                expires_at=expires_at
            )
        else:
            invitation_token = existing_token.token
        
        try:
            
            # Generate setup URL
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
            # For local development, use tenant slug subdomain pattern
            # In production, this would be tenant.domain.com
            setup_url = f"{frontend_url}/setup?token={invitation_token}&email={admin_email}"
            
            # Send invitation email
            try:
                send_mail(
                    subject=f'Invitation à configurer votre site VTC - {tenant.name}',
                    message=f'''
Bonjour,

Vous avez été invité à configurer votre compte VTCBuilder pour {tenant.name}.

Cliquez sur le lien suivant pour définir votre mot de passe et accéder à votre espace d'administration (lien valable 7 jours) :
{setup_url}

Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.

Cordialement,
L'équipe VTCBuilder
                    ''',
                    html_message=f'''
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2>Invitation à configurer votre compte VTCBuilder</h2>
                        <p>Bonjour,</p>
                        <p>Vous avez été invité à configurer votre compte VTCBuilder pour <strong>{tenant.name}</strong>.</p>
                        <p>
                            <a href="{setup_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Configurer mon compte
                            </a>
                        </p>
                        <p>Ou copiez ce lien dans votre navigateur :</p>
                        <p style="word-break: break-all; color: #666;">{setup_url}</p>
                        <p><small>Ce lien est valable pendant 7 jours.</small></p>
                        <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
                        <hr>
                        <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                    </body>
                    </html>
                    ''',
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                    recipient_list=[admin_email],
                    fail_silently=False,
                )
        except Exception as e:
            # Email sending failure shouldn't prevent tenant creation
            import logging
            logging.getLogger(__name__).error(f"Failed to send invitation email: {e}")
        
        return tenant


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'name',
            'tenant', 'tenant_id', 'tenant_name', 'avatar', 'phone', 'role', 'roles', 'status',
            'permissions', 'email_verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_roles(self, obj):
        """Return roles as array"""
        return [obj.role] if obj.role else []

    def get_permissions(self, obj):
        """Return user permissions"""
        # TODO: Implement actual permissions from guardian
        return []

    def get_name(self, obj):
        """Return full name"""
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        """Add tenant_id to representation"""
        data = super().to_representation(instance)
        if instance.tenant:
            data['tenant_id'] = instance.tenant.id
        return data

    def create(self, validated_data):
        """Create user with encrypted password"""
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """Update user with password handling"""
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


class UserRegisterSerializer(serializers.ModelSerializer):
    """Serializer for user registration"""
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'first_name', 'last_name',
            'password', 'password_confirm', 'phone', 'tenant'
        ]

    def validate(self, attrs):
        """Validate password confirmation"""
        if attrs.get('password') != attrs.get('password_confirm'):
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        """Create user with encrypted password"""
        validated_data.pop('password_confirm')
        return UserSerializer.create(self, validated_data)


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile updates"""

    class Meta:
        model = User
        fields = [
            'id', 'first_name', 'last_name', 'avatar', 'phone',
            'email_verified_at'
        ]
        read_only_fields = ['id', 'email_verified_at']
