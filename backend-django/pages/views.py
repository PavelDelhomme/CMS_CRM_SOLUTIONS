"""
API views for page models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from .models import Page
from .serializers import PageSerializer, PageListSerializer, PageContentSerializer


class PageViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pages"""
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter pages based on tenant context"""
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return Page.objects.filter(tenant=user.tenant)
        return Page.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return PageListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PageSerializer
        return PageSerializer

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a page"""
        page = self.get_object()
        page.status = 'published'
        if not page.published_at:
            page.published_at = timezone.now()
        page.save()
        return Response({'status': 'Page published'})

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a page"""
        page = self.get_object()
        page.status = 'draft'
        page.save()
        return Response({'status': 'Page unpublished'})

    @action(detail=True, methods=['post'])
    def set_homepage(self, request, pk=None):
        """Set page as homepage"""
        page = self.get_object()

        # Unset other homepages for this tenant
        Page.objects.filter(tenant=page.tenant, is_homepage=True).update(is_homepage=False)

        # Set this page as homepage
        page.is_homepage = True
        page.save()

        return Response({'status': 'Page set as homepage'})

    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get only published pages"""
        queryset = self.get_queryset().filter(
            status='published',
            published_at__lte=timezone.now()
        )
        serializer = PageContentSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def homepage(self, request):
        """Get homepage for current tenant"""
        try:
            homepage = self.get_queryset().get(is_homepage=True, status='published')
            serializer = PageContentSerializer(homepage)
            return Response(serializer.data)
        except Page.DoesNotExist:
            return Response(
                {'error': 'No homepage found'},
                status=status.HTTP_404_NOT_FOUND
            )
