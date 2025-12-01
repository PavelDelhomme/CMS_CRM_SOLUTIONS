"""
Feature ViewSets - Management of features and user features
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import logging

from ..models import Feature, UserFeature
from ..serializers import FeatureSerializer, UserFeatureSerializer
from .helpers import add_cors_headers

logger = logging.getLogger(__name__)


class FeatureViewSet(viewsets.ModelViewSet):
    """ViewSet for managing features"""
    queryset = Feature.objects.all()
    serializer_class = FeatureSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter features based on user permissions"""
        queryset = Feature.objects.all()
        
        # Super admin sees all features
        if self.request.user.is_super_admin():
            return queryset
        
        # Other users see only active features
        return queryset.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def available(self, request):
        """Get all available features for the current user based on their subscription plan"""
        user = request.user
        features = self.get_queryset()
        
        # Filtrer les features selon le plan de l'utilisateur
        # Super admin voit toutes les features
        if user.is_super_admin():
            available_features = features
        else:
            # Pour les autres utilisateurs, filtrer selon leur plan
            available_features = []
            for feature in features:
                if user.can_use_feature(feature):
                    available_features.append(feature)
        
        serializer = self.get_serializer(available_features, many=True)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response
    
    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Toggle feature status (super admin only)"""
        if not request.user.is_super_admin():
            response = Response(
                {'error': 'Only super admin can toggle features'},
                status=status.HTTP_403_FORBIDDEN
            )
            add_cors_headers(response, request)
            return response
        
        feature = self.get_object()
        feature.is_active = not feature.is_active
        feature.save()
        
        serializer = self.get_serializer(feature)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response


class UserFeatureViewSet(viewsets.ModelViewSet):
    """ViewSet for managing user features"""
    queryset = UserFeature.objects.all()
    serializer_class = UserFeatureSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Filter user features based on permissions"""
        user = self.request.user
        
        # Super admin sees all
        if user.is_super_admin():
            return UserFeature.objects.all()
        
        # Users see only their own features
        return UserFeature.objects.filter(user=user)
    
    def perform_create(self, serializer):
        """Set user to current user if not specified"""
        user = self.request.data.get('user')
        if not user or (not self.request.user.is_super_admin() and user != self.request.user.id):
            serializer.save(user=self.request.user, enabled_by=self.request.user)
        else:
            serializer.save(enabled_by=self.request.user)
    
    @action(detail=False, methods=['get'], url_path='my-features')
    def my_features(self, request):
        """Get all features for current user"""
        user_features = UserFeature.objects.filter(user=request.user, is_enabled=True)
        serializer = self.get_serializer(user_features, many=True)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response
    
    @action(detail=True, methods=['post'])
    def enable(self, request, pk=None):
        """Enable a feature for a user"""
        user_feature = self.get_object()
        
        # Check permissions
        if not request.user.is_super_admin() and user_feature.user != request.user:
            response = Response(
                {'error': 'You can only enable features for yourself'},
                status=status.HTTP_403_FORBIDDEN
            )
            add_cors_headers(response, request)
            return response
        
        user_feature.is_enabled = True
        user_feature.enabled_by = request.user
        user_feature.save()
        
        serializer = self.get_serializer(user_feature)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response
    
    @action(detail=True, methods=['post'])
    def disable(self, request, pk=None):
        """Disable a feature for a user"""
        user_feature = self.get_object()
        
        # Check permissions
        if not request.user.is_super_admin() and user_feature.user != request.user:
            response = Response(
                {'error': 'You can only disable features for yourself'},
                status=status.HTTP_403_FORBIDDEN
            )
            add_cors_headers(response, request)
            return response
        
        user_feature.is_enabled = False
        user_feature.save()
        
        serializer = self.get_serializer(user_feature)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response
    
    @action(detail=False, methods=['post'], url_path='enable-feature')
    def enable_feature(self, request):
        """Enable a feature for current user by feature_id"""
        feature_id = request.data.get('feature_id')
        if not feature_id:
            response = Response(
                {'error': 'feature_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(response, request)
            return response
        
        try:
            feature = Feature.objects.get(id=feature_id, is_active=True)
        except Feature.DoesNotExist:
            response = Response(
                {'error': 'Feature not found or not available'},
                status=status.HTTP_404_NOT_FOUND
            )
            add_cors_headers(response, request)
            return response
        
        # Check if already enabled
        user_feature, created = UserFeature.objects.get_or_create(
            user=request.user,
            feature=feature,
            defaults={'is_enabled': True, 'enabled_by': request.user}
        )
        
        if not created:
            user_feature.is_enabled = True
            user_feature.enabled_by = request.user
            user_feature.save()
        
        serializer = self.get_serializer(user_feature)
        response = Response(serializer.data)
        add_cors_headers(response, request)
        return response
    
    @action(detail=False, methods=['post'], url_path='disable-feature')
    def disable_feature(self, request):
        """Disable a feature for current user by feature_id"""
        feature_id = request.data.get('feature_id')
        if not feature_id:
            response = Response(
                {'error': 'feature_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
            add_cors_headers(response, request)
            return response
        
        try:
            user_feature = UserFeature.objects.get(
                user=request.user,
                feature_id=feature_id
            )
            user_feature.is_enabled = False
            user_feature.save()
            
            serializer = self.get_serializer(user_feature)
            response = Response(serializer.data)
            add_cors_headers(response, request)
            return response
        except UserFeature.DoesNotExist:
            response = Response(
                {'error': 'Feature not enabled for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
            add_cors_headers(response, request)
            return response
