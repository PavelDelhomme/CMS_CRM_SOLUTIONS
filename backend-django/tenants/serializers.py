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
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'tenant', 'tenant_name', 'avatar', 'phone', 'role', 'status',
            'email_verified_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'password': {'write_only': True}
        }

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
