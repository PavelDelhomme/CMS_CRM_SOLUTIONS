"""
Serializers for Block models
"""
from rest_framework import serializers
from .models import BlockType, BlockTemplate


class BlockTypeSerializer(serializers.ModelSerializer):
    """Serializer for BlockType"""
    
    class Meta:
        model = BlockType
        fields = [
            'id', 'name', 'label', 'icon', 'category',
            'description', 'schema', 'default_styles',
            'is_active', 'requires_premium', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BlockTemplateSerializer(serializers.ModelSerializer):
    """Serializer for BlockTemplate"""
    
    class Meta:
        model = BlockTemplate
        fields = [
            'id', 'tenant', 'name', 'description',
            'block_type', 'block_data', 'block_styles',
            'block_settings', 'is_global', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

