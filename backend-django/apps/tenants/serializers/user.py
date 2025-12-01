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
            'tenant', 'tenant_id', 'tenant_name', 'avatar', 'phone', 'role', 'roles', 'status',
            'permissions', 'email_verified_at', 'created_at', 'updated_at', 'password'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'tenant_name', 'tenant_id']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False},
            'tenant': {'required': False, 'allow_null': True},
            'username': {'required': False},  # Allow partial updates without username
            'email': {'required': False},  # Allow partial updates without email
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
        """Add tenant_id and tenant_name to representation"""
        try:
            data = super().to_representation(instance)
            try:
                if instance.tenant:
                    data['tenant_id'] = instance.tenant.id
                    data['tenant_name'] = instance.tenant.name
                    # Also include tenant object for compatibility
                    if 'tenant' not in data or not data.get('tenant'):
                        data['tenant'] = {
                            'id': instance.tenant.id,
                            'name': instance.tenant.name,
                        }
                else:
                    data['tenant_id'] = None
                    data['tenant_name'] = None
                    data['tenant'] = None
            except Exception as e:
                # If tenant access fails, set to None
                import logging
                logging.getLogger(__name__).warning(f"Error accessing tenant for user {instance.id}: {e}")
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
                'error': 'Error serializing user data'
            }

    def create(self, validated_data):
        """Create user with encrypted password and quota check"""
        # Check quota if user is being added to a tenant
        tenant = validated_data.get('tenant')
        if tenant:
            from ..quota import check_user_quota
            can_add, current_count, max_users, error_message = check_user_quota(tenant)
            
            if not can_add:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    'tenant': error_message,
                    'quota': {
                        'current': current_count,
                        'max': max_users,
                    }
                })
        
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


