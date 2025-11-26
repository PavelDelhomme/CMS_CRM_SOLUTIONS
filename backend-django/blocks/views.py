"""
API views for Block models
"""
from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import BlockType, BlockTemplate
from .serializers import BlockTypeSerializer, BlockTemplateSerializer


class BlockTypeViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for BlockType (read-only for now)
    Only active block types are returned
    """
    queryset = BlockType.objects.filter(is_active=True)
    serializer_class = BlockTypeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by category if provided"""
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(category=category)
        return queryset.order_by('category', 'order', 'label')


class BlockTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for BlockTemplate
    """
    serializer_class = BlockTemplateSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter templates based on user role"""
        user = self.request.user
        queryset = BlockTemplate.objects.filter(is_active=True)
        
        # Tenant admin/users see global templates + their tenant templates
        if hasattr(user, 'tenant') and user.tenant:
            queryset = queryset.filter(
                models.Q(is_global=True) | models.Q(tenant=user.tenant)
            )
        
        # Super admin sees all
        if user.is_super_admin():
            queryset = BlockTemplate.objects.all()
        
        return queryset.order_by('-created_at')

    def perform_create(self, serializer):
        """Set tenant when creating template"""
        user = self.request.user
        if user.is_tenant_admin() and user.tenant:
            serializer.save(tenant=user.tenant)
        else:
            serializer.save()

