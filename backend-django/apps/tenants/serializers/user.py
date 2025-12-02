"""
Serializers for User models
"""
from rest_framework import serializers
from django.contrib.auth import get_user_model
from ..models import Client

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    tenant_id = serializers.IntegerField(source='tenant.id', read_only=True, allow_null=True)
    roles = serializers.SerializerMethodField()
    permissions = serializers.SerializerMethodField()
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'name',
            'tenant_id', 'tenant_name', 'roles', 'permissions', 'is_superuser', 'is_staff', 'is_active',
            'date_joined', 'last_login', 'password'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'tenant_name', 'tenant_id', 'is_superuser', 'is_staff']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'username': {'required': False},  # Allow partial updates without username
            'email': {'required': False},  # Allow partial updates without email
        }

    def get_roles(self, obj):
        """Return roles as array - based on is_superuser and is_staff"""
        roles = []
        if obj.is_superuser:
            roles.append('super_admin')
        if obj.is_staff:
            roles.append('staff')
        return roles

    def get_permissions(self, obj):
        """Return user permissions"""
        # TODO: Implement actual permissions from guardian
        return []

    def get_name(self, obj):
        """Return full name"""
        return obj.get_full_name() or obj.username

    def to_representation(self, instance):
        """Add tenant_id and tenant_name to representation"""
        try:
            data = super().to_representation(instance)
            try:
                # Try to access tenant if it exists (may not exist for super admins)
                if hasattr(instance, 'tenant') and instance.tenant:
                    data['tenant_id'] = instance.tenant.id
                    data['tenant_name'] = instance.tenant.name
                    # Also include tenant object for compatibility
                    data['tenant'] = {
                        'id': instance.tenant.id,
                        'name': instance.tenant.name,
                    }
                else:
                    data['tenant_id'] = None
                    data['tenant_name'] = None
                    data['tenant'] = None
            except (AttributeError, Exception) as e:
                # If tenant access fails (e.g., no tenant field or no tenant), set to None
                import logging
                logging.getLogger(__name__).debug(f"User {instance.id} has no tenant: {e}")
                data['tenant_id'] = None
                data['tenant_name'] = None
                data['tenant'] = None
            return data
        except Exception as e:
            # If serialization fails completely, return minimal data
            import logging
            logging.getLogger(__name__).error(f"Error serializing user {instance.id if instance else 'unknown'}: {e}", exc_info=True)
            return {
                'id': instance.id if instance else None,
                'email': instance.email if instance and hasattr(instance, 'email') else None,
                'username': instance.username if instance and hasattr(instance, 'username') else None,
                'is_superuser': instance.is_superuser if instance and hasattr(instance, 'is_superuser') else False,
                'error': 'Error serializing user data'
            }

    def create(self, validated_data):
        """Create user with encrypted password and quota check"""
        # Remove fields that don't exist on the User model
        validated_data.pop('tenant', None)  # tenant is not a direct field on User model
        
        # Check quota if user is being added to a tenant (would need to be handled separately)
        # tenant = validated_data.get('tenant')
        # if tenant:
        #     from ..quota import check_user_quota
        #     can_add, current_count, max_users, error_message = check_user_quota(tenant)
        #     ...
        
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        """Update user with password handling and email validation"""
        # Check if email is being changed and validate uniqueness
        if 'email' in validated_data and validated_data['email'] != instance.email:
            from django.core.exceptions import ValidationError
            from django.contrib.auth import get_user_model
            User = get_user_model()
            # Check if new email already exists
            if User.objects.filter(email=validated_data['email']).exclude(id=instance.id).exists():
                from rest_framework.exceptions import ValidationError as DRFValidationError
                raise DRFValidationError({'email': 'Un utilisateur avec cet email existe déjà.'})
        
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
            'password', 'password_confirm'
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
            'id', 'first_name', 'last_name', 'email'
        ]
        read_only_fields = ['id']


