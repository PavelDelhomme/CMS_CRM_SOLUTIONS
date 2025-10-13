"""
API views for media models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Media, Template
from .serializers import (
    MediaSerializer, MediaUploadSerializer, MediaListSerializer,
    TemplateSerializer, TemplateListSerializer
)


class MediaViewSet(viewsets.ModelViewSet):
    """ViewSet for managing media files"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Filter media based on tenant context"""
        user = self.request.user
        if hasattr(user, 'tenant') and user.tenant:
            return Media.objects.filter(tenant=user.tenant)
        return Media.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create' or self.action == 'upload':
            return MediaUploadSerializer
        elif self.action == 'list':
            return MediaListSerializer
        return MediaSerializer

    @action(detail=False, methods=['post'])
    def upload(self, request):
        """Upload a media file"""
        serializer = MediaUploadSerializer(data=request.data)

        if serializer.is_valid():
            # Handle file upload logic here
            # For now, just save the serializer data
            media = serializer.save(tenant=request.user.tenant)
            return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def images(self, request):
        """Get only image files"""
        queryset = self.get_queryset().filter(mime_type__startswith='image/')
        serializer = MediaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def documents(self, request):
        """Get only document files"""
        queryset = self.get_queryset().filter(
            mime_type__startswith='application/'
        ) | self.get_queryset().filter(mime_type__startswith='text/')
        serializer = MediaListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_collection(self, request):
        """Get media filtered by collection"""
        collection = request.query_params.get('collection', 'other')
        queryset = self.get_queryset().filter(collection=collection)
        serializer = MediaListSerializer(queryset, many=True)
        return Response(serializer.data)


class TemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing templates"""
    queryset = Template.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return TemplateListSerializer
        return TemplateSerializer

    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Mark template as used (increment usage count)"""
        template = self.get_object()
        template.increment_usage()
        serializer = TemplateSerializer(template)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def free(self, request):
        """Get only free templates"""
        queryset = self.get_queryset().filter(is_premium=False)
        serializer = TemplateListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def premium(self, request):
        """Get only premium templates"""
        queryset = self.get_queryset().filter(is_premium=True)
        serializer = TemplateListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get templates filtered by category"""
        category = request.query_params.get('category', 'vtc')
        queryset = self.get_queryset().filter(category=category)
        serializer = TemplateListSerializer(queryset, many=True)
        return Response(serializer.data)
