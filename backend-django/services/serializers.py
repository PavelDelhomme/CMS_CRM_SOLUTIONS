"""
Serializers for service models
"""
from rest_framework import serializers
from .models import Service


class ServiceSerializer(serializers.ModelSerializer):
    """Serializer for Service model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'slug', 'description',
            'icon', 'image', 'base_price', 'price_per_km', 'price_per_minute',
            'min_price', 'max_passengers', 'max_luggage', 'features',
            'is_active', 'order', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Auto-generate slug if not provided"""
        if not validated_data.get('slug'):
            validated_data['slug'] = validated_data['name'].lower().replace(' ', '-')
        return super().create(validated_data)


class ServiceListSerializer(serializers.ModelSerializer):
    """Simplified serializer for service listings"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Service
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'slug', 'icon',
            'base_price', 'max_passengers', 'is_active'
        ]


class ServicePriceSerializer(serializers.ModelSerializer):
    """Serializer for service pricing information"""

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'base_price', 'price_per_km', 'price_per_minute',
            'min_price', 'max_passengers', 'max_luggage'
        ]
