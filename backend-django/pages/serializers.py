"""
Serializers for page models
"""
from rest_framework import serializers
from .models import Page


class PageSerializer(serializers.ModelSerializer):
    """Serializer for Page model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Page
        fields = [
            'id', 'tenant', 'tenant_name', 'title', 'slug', 'content',
            'blocks', 'meta_title', 'meta_description', 'featured_image',
            'status', 'published_at', 'order', 'is_homepage',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'created_at', 'updated_at']

    def create(self, validated_data):
        """Auto-generate slug if not provided"""
        if not validated_data.get('slug'):
            validated_data['slug'] = validated_data['title'].lower().replace(' ', '-')
        return super().create(validated_data)


class PageListSerializer(serializers.ModelSerializer):
    """Simplified serializer for page listings"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)

    class Meta:
        model = Page
        fields = [
            'id', 'tenant', 'tenant_name', 'title', 'slug', 'status',
            'published_at', 'is_homepage', 'order'
        ]


class PageContentSerializer(serializers.ModelSerializer):
    """Serializer for page content only (for public access)"""

    class Meta:
        model = Page
        fields = [
            'id', 'title', 'slug', 'content', 'blocks',
            'meta_title', 'meta_description', 'featured_image'
        ]
