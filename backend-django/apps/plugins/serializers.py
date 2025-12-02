"""
Serializers pour les plugins et templates
"""
from rest_framework import serializers
from .models import InstalledPlugin, Template, InstalledTemplate


class InstalledPluginSerializer(serializers.ModelSerializer):
    """Serializer pour les plugins installés"""
    
    class Meta:
        model = InstalledPlugin
        fields = [
            'id', 'name', 'version', 'enabled',
            'installed_at', 'updated_at', 'settings', 'metadata'
        ]
        read_only_fields = ['id', 'installed_at', 'updated_at']


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer pour les templates"""
    
    class Meta:
        model = Template
        fields = [
            'id', 'name', 'slug', 'description', 'template_type',
            'status', 'is_marketplace', 'price', 'is_free',
            'author', 'author_url', 'preview_image', 'version',
            'tags', 'downloads', 'rating', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'downloads', 'rating', 'created_at', 'updated_at']


class InstalledTemplateSerializer(serializers.ModelSerializer):
    """Serializer pour les templates installés"""
    template = TemplateSerializer(read_only=True)
    template_id = serializers.IntegerField(write_only=True, required=False)
    
    class Meta:
        model = InstalledTemplate
        fields = [
            'id', 'tenant', 'template', 'template_id',
            'installed_at', 'is_active', 'customizations'
        ]
        read_only_fields = ['id', 'installed_at']

