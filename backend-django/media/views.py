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
        """Return empty queryset - actual querying done in tenant_context in methods"""
        from django.db import models
        return models.QuerySet().none()

    def list(self, request, *args, **kwargs):
        """List media files with error handling"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        # Tenant admin/users see only their tenant's media
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Media.objects.filter(tenant=user.tenant)
                    
                    # Apply filters from query params
                    collection = request.query_params.get('collection')
                    if collection:
                        queryset = queryset.filter(collection=collection)
                    
                    # Serialize within tenant context
                    serializer = MediaListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error listing media: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        # Super admin with tenant_id (optional for future use)
        if user.is_super_admin():
            tenant_id = request.query_params.get('tenant_id')
            if tenant_id:
                try:
                    from tenants.models import Tenant
                    tenant = Tenant.objects.get(id=tenant_id)
                    with tenant_context(tenant):
                        queryset = Media.objects.all()
                        serializer = MediaListSerializer(queryset, many=True)
                        return Response(serializer.data)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error listing media: {e}", exc_info=True)
                    return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    def get_object(self):
        """Get media object within tenant context"""
        from django_tenants.utils import tenant_context
        
        user = self.request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            with tenant_context(user.tenant):
                pk = self.kwargs.get('pk')
                return Media.objects.get(pk=pk, tenant=user.tenant)
        
        # For super admin with tenant_id
        from tenants.models import Tenant
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            tenant = Tenant.objects.get(id=tenant_id)
            with tenant_context(tenant):
                pk = self.kwargs.get('pk')
                return Media.objects.get(pk=pk)
        
        from django.http import Http404
        raise Http404("Media not found")

    def create(self, request, *args, **kwargs):
        """Create a new media"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                serializer = MediaUploadSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                validated_data = serializer.validated_data
                
                with tenant_context(user.tenant):
                    validated_data['tenant'] = user.tenant
                    media = Media.objects.create(**validated_data)
                    response_serializer = MediaSerializer(media)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating media: {e}", exc_info=True)
                if hasattr(e, 'detail'):
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, *args, **kwargs):
        """Update a media"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    partial = kwargs.pop('partial', False)
                    pk = kwargs.get('pk')
                    instance = Media.objects.get(pk=pk, tenant=user.tenant)
                    serializer = MediaSerializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    return Response(serializer.data)
            except Media.DoesNotExist:
                return Response(
                    {'error': 'Media not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating media: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a media"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    pk = kwargs.get('pk')
                    instance = Media.objects.get(pk=pk, tenant=user.tenant)
                    instance.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
            except Media.DoesNotExist:
                return Response(
                    {'error': 'Media not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting media: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la suppression: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

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
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                serializer = MediaUploadSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                validated_data = serializer.validated_data
                
                with tenant_context(user.tenant):
                    validated_data['tenant'] = user.tenant
                    media = Media.objects.create(**validated_data)
                    return Response(MediaSerializer(media).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error uploading media: {str(e)}")
                if hasattr(e, 'detail'):
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                return Response(
                    {'error': f'Erreur lors du téléversement: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def images(self, request):
        """Get only image files"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Media.objects.filter(tenant=user.tenant, mime_type__startswith='image/')
                    serializer = MediaListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting images: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def documents(self, request):
        """Get only document files"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Media.objects.filter(
                        tenant=user.tenant
                    ).filter(
                        mime_type__startswith='application/'
                    ) | Media.objects.filter(
                        tenant=user.tenant,
                        mime_type__startswith='text/'
                    )
                    serializer = MediaListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting documents: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def by_collection(self, request):
        """Get media filtered by collection"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        collection = request.query_params.get('collection', 'other')
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Media.objects.filter(tenant=user.tenant, collection=collection)
                    serializer = MediaListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting media by collection: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)


class TemplateViewSet(viewsets.ModelViewSet):
    """ViewSet for managing templates"""
    permission_classes = [IsAuthenticated]

    def _get_reference_tenant(self):
        """Get a reference tenant for super admin template management"""
        from tenants.models import Tenant
        # Use first active tenant as reference for templates
        tenant = Tenant.objects.filter(deleted_at__isnull=True, status='active').first()
        if not tenant:
            # Fallback to any tenant (even inactive) if no active tenant
            tenant = Tenant.objects.filter(deleted_at__isnull=True).first()
        return tenant

    def get_queryset(self):
        """Return empty queryset - actual querying done in tenant_context in methods"""
        from django.db import models
        return models.QuerySet().none()

    def create(self, request, *args, **kwargs):
        """Create a new template"""
        from django_tenants.utils import tenant_context
        from django.utils.text import slugify
        
        user = request.user
        
        # Super admin creates template in reference tenant
        if user.is_super_admin():
            tenant = self._get_reference_tenant()
            if not tenant:
                return Response(
                    {'error': 'Aucun tenant de référence disponible pour créer des templates'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                serializer = self.get_serializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                
                with tenant_context(tenant):
                    # Auto-generate slug if not provided
                    data = serializer.validated_data.copy()
                    if not data.get('slug'):
                        from django.utils.text import slugify
                        data['slug'] = slugify(data.get('name', ''))
                    
                    template = Template.objects.create(**data)
                    return Response(TemplateSerializer(template).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating template: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Tenant admin creates template in their tenant
        if hasattr(user, 'tenant') and user.tenant:
            try:
                serializer = TemplateSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                validated_data = serializer.validated_data
                
                # Auto-generate slug if not provided
                if not validated_data.get('slug') and validated_data.get('name'):
                    from django.utils.text import slugify
                    validated_data['slug'] = slugify(validated_data.get('name'))
                
                with tenant_context(user.tenant):
                    template = Template.objects.create(**validated_data)
                    return Response(TemplateSerializer(template).data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating template: {e}", exc_info=True)
                if hasattr(e, 'detail'):
                    return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, *args, **kwargs):
        """Update a template"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if user.is_super_admin():
            tenant = self._get_reference_tenant()
            if not tenant:
                return Response(
                    {'error': 'Aucun tenant de référence disponible'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                with tenant_context(tenant):
                    partial = kwargs.pop('partial', False)
                    pk = kwargs.get('pk')
                    instance = Template.objects.get(pk=pk)
                    serializer = TemplateSerializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    return Response(serializer.data)
            except Template.DoesNotExist:
                return Response(
                    {'error': 'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating template: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Tenant admin updates template in their tenant
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    partial = kwargs.pop('partial', False)
                    pk = kwargs.get('pk')
                    instance = Template.objects.get(pk=pk)
                    serializer = TemplateSerializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    return Response(serializer.data)
            except Template.DoesNotExist:
                return Response(
                    {'error': 'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating template: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a template"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if user.is_super_admin():
            tenant = self._get_reference_tenant()
            if not tenant:
                return Response(
                    {'error': 'Aucun tenant de référence disponible'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            try:
                with tenant_context(tenant):
                    pk = kwargs.get('pk')
                    instance = Template.objects.get(pk=pk)
                    instance.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
            except Template.DoesNotExist:
                return Response(
                    {'error': 'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting template: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la suppression: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Tenant admin deletes template in their tenant
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    pk = kwargs.get('pk')
                    instance = Template.objects.get(pk=pk)
                    instance.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
            except Template.DoesNotExist:
                return Response(
                    {'error': 'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting template: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la suppression: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return TemplateListSerializer
        return TemplateSerializer

    def list(self, request, *args, **kwargs):
        """List templates with error handling"""
        import logging
        logger = logging.getLogger(__name__)
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        try:
            # Tenant users access templates from their tenant
            if hasattr(user, 'tenant') and user.tenant:
                try:
                    with tenant_context(user.tenant):
                        queryset = Template.objects.filter(is_active=True)
                        
                        # Apply filters from query params
                        is_premium = request.query_params.get('is_premium')
                        category = request.query_params.get('category')
                        
                        if is_premium is not None:
                            is_premium_bool = is_premium.lower() == 'true'
                            queryset = queryset.filter(is_premium=is_premium_bool)
                        
                        if category:
                            queryset = queryset.filter(category=category)
                        
                        # Serialize within tenant context
                        serializer = TemplateListSerializer(queryset, many=True)
                        return Response(serializer.data)
                except Exception as e:
                    logger.error(f"Error listing templates for tenant {user.tenant.id if user.tenant else 'None'}: {str(e)}", exc_info=True)
                    # Return empty array on error instead of 500
                    return Response([], status=status.HTTP_200_OK)
            
            # Super admin can access templates from reference tenant
            if user.is_super_admin():
                tenant = self._get_reference_tenant()
                if tenant:
                    try:
                        logger.debug(f"Super admin accessing templates from reference tenant: {tenant.id}")
                        with tenant_context(tenant):
                            queryset = Template.objects.all()
                            
                            # Apply filters
                            is_premium = request.query_params.get('is_premium')
                            category = request.query_params.get('category')
                            
                            if is_premium is not None:
                                is_premium_bool = is_premium.lower() == 'true'
                                queryset = queryset.filter(is_premium=is_premium_bool)
                            
                            if category:
                                queryset = queryset.filter(category=category)
                            
                            serializer = TemplateListSerializer(queryset, many=True)
                            logger.debug(f"Returning {len(serializer.data)} templates")
                            return Response(serializer.data)
                    except Exception as e:
                        logger.error(f"Error listing templates for super admin with tenant {tenant.id}: {str(e)}", exc_info=True)
                        # Return empty array on error instead of 500
                        return Response([], status=status.HTTP_200_OK)
                else:
                    logger.warning("No reference tenant available for super admin template listing")
                    # No reference tenant available, return empty list
                    return Response([], status=status.HTTP_200_OK)
            
            logger.warning(f"User {user.id} is neither tenant user nor super admin")
            return Response([], status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Unexpected error in TemplateViewSet.list: {str(e)}", exc_info=True)
            return Response([], status=status.HTTP_200_OK)

    def get_object(self):
        """Get template object within tenant context"""
        from django_tenants.utils import tenant_context
        
        user = self.request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            with tenant_context(user.tenant):
                pk = self.kwargs.get('pk')
                return Template.objects.get(pk=pk)
        
        # For super admin with reference tenant
        if user.is_super_admin():
            tenant = self._get_reference_tenant()
            if tenant:
                with tenant_context(tenant):
                    pk = self.kwargs.get('pk')
                    return Template.objects.get(pk=pk)
        
        from django.http import Http404
        raise Http404("Template not found")

    @action(detail=True, methods=['post'])
    def use_template(self, request, pk=None):
        """Mark template as used (increment usage count)"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    template = Template.objects.get(pk=pk)
                    template.increment_usage()
                    serializer = TemplateSerializer(template)
                    return Response(serializer.data)
            except Template.DoesNotExist:
                return Response(
                    {'error': 'Template not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error using template: {str(e)}")
                return Response(
                    {'error': f'Erreur lors de l\'utilisation du template: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def free(self, request):
        """Get only free templates"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Template.objects.filter(is_active=True, is_premium=False)
                    serializer = TemplateListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting free templates: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def premium(self, request):
        """Get only premium templates"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Template.objects.filter(is_active=True, is_premium=True)
                    serializer = TemplateListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting premium templates: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get templates filtered by category"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        category = request.query_params.get('category', 'vtc')
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Template.objects.filter(is_active=True, category=category)
                    serializer = TemplateListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting templates by category: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)
