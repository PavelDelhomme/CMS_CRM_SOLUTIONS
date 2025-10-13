"""
API views for service models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Service
from .serializers import ServiceSerializer, ServiceListSerializer, ServicePriceSerializer


class ServiceViewSet(viewsets.ModelViewSet):
    """ViewSet for managing services"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter services based on tenant context"""
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return Service.objects.filter(tenant=user.tenant)
        return Service.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ServiceListSerializer
        elif self.action == 'pricing':
            return ServicePriceSerializer
        return ServiceSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a service"""
        service = self.get_object()
        service.is_active = True
        service.save()
        return Response({'status': 'Service activated'})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a service"""
        service = self.get_object()
        service.is_active = False
        service.save()
        return Response({'status': 'Service deactivated'})

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active services"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = ServiceListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def pricing(self, request):
        """Get pricing information for services"""
        queryset = self.get_queryset().filter(is_active=True)
        serializer = ServicePriceSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def pricing_detail(self, request, pk=None):
        """Get detailed pricing for a specific service"""
        service = self.get_object()
        serializer = ServicePriceSerializer(service)
        return Response(serializer.data)
