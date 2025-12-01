"""
Serializers for Feature models
"""
from rest_framework import serializers
from ..models import Feature, UserFeature
from django.contrib.auth import get_user_model

User = get_user_model()


class FeatureSerializer(serializers.ModelSerializer):
    """Serializer for Feature model"""
    available_plans = serializers.SerializerMethodField()
    plan_names = serializers.SerializerMethodField()
    
    class Meta:
        model = Feature
        fields = [
            'id', 'name', 'label', 'description', 'status', 'available_plans', 'plan_names',
            'requires_setup', 'category', 'order', 'is_active', 'metadata',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_available_plans(self, obj):
        """Retourne les IDs des plans qui donnent accès à cette feature"""
        return [plan.id for plan in obj.available_plans.all()]
    
    def get_plan_names(self, obj):
        """Retourne les noms des plans pour affichage"""
        return [plan.name for plan in obj.available_plans.all()]


class UserFeatureSerializer(serializers.ModelSerializer):
    """Serializer for UserFeature model"""
    feature = FeatureSerializer(read_only=True)
    feature_id = serializers.IntegerField(write_only=True, required=False)
    user_email = serializers.CharField(source='user.email', read_only=True)
    enabled_by_email = serializers.CharField(source='enabled_by.email', read_only=True, allow_null=True)
    
    class Meta:
        model = UserFeature
        fields = [
            'id', 'user', 'user_email', 'feature', 'feature_id',
            'is_enabled', 'enabled_at', 'enabled_by', 'enabled_by_email', 'notes'
        ]
        read_only_fields = ['id', 'enabled_at', 'user']
    
    def create(self, validated_data):
        feature_id = validated_data.pop('feature_id', None)
        if feature_id:
            try:
                from ..models import Feature
                feature = Feature.objects.get(id=feature_id)
                validated_data['feature'] = feature
            except Feature.DoesNotExist:
                raise serializers.ValidationError({'feature_id': 'Feature not found'})
        
        validated_data['enabled_by'] = self.context['request'].user
        return super().create(validated_data)
