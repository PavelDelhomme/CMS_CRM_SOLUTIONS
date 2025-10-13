"""
Serializers for media models
"""
from rest_framework import serializers
from .models import Media, Template


class MediaSerializer(serializers.ModelSerializer):
    """Serializer for Media model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    url = serializers.SerializerMethodField()
    file_extension = serializers.ReadOnlyField()
    is_image = serializers.ReadOnlyField()
    is_video = serializers.ReadOnlyField()
    is_audio = serializers.ReadOnlyField()
    is_document = serializers.ReadOnlyField()

    class Meta:
        model = Media
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'file_name', 'mime_type',
            'path', 'disk', 'size', 'collection', 'alt_text', 'order',
            'metadata', 'url', 'file_extension', 'is_image', 'is_video',
            'is_audio', 'is_document', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_url(self, obj):
        """Get the full URL for the media file"""
        return obj.url


class MediaUploadSerializer(serializers.ModelSerializer):
    """Serializer for media upload"""
    file = serializers.FileField(write_only=True)

    class Meta:
        model = Media
        fields = [
            'file', 'name', 'collection', 'alt_text'
        ]

    def create(self, validated_data):
        """Create media from uploaded file"""
        file = validated_data.pop('file')
        # Handle file upload logic here
        # This would typically involve saving to storage and creating Media record
        return super().create(validated_data)


class MediaListSerializer(serializers.ModelSerializer):
    """Simplified serializer for media listings"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    url = serializers.SerializerMethodField()
    file_extension = serializers.ReadOnlyField()

    class Meta:
        model = Media
        fields = [
            'id', 'tenant', 'tenant_name', 'name', 'file_name',
            'mime_type', 'size', 'collection', 'url', 'file_extension',
            'created_at'
        ]

    def get_url(self, obj):
        """Get the full URL for the media file"""
        return obj.url


class TemplateSerializer(serializers.ModelSerializer):
    """Serializer for Template model"""

    class Meta:
        model = Template
        fields = [
            'id', 'name', 'slug', 'description', 'thumbnail',
            'preview_url', 'structure', 'default_settings',
            'category', 'is_premium', 'price', 'is_active',
            'usage_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'slug', 'usage_count', 'created_at', 'updated_at']


class TemplateListSerializer(serializers.ModelSerializer):
    """Simplified serializer for template listings"""

    class Meta:
        model = Template
        fields = [
            'id', 'name', 'slug', 'description', 'thumbnail',
            'category', 'is_premium', 'price', 'is_active'
        ]


class TemplateUsageSerializer(serializers.ModelSerializer):
    """Serializer for template usage tracking"""

    class Meta:
        model = Template
        fields = ['id', 'usage_count']
        read_only_fields = ['id']
