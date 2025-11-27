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
        """Return empty queryset - actual querying done in tenant_context in methods"""
        # We can't return a QuerySet created in tenant_context here because
        # the context ends before serialization. Each method must handle tenant_context.
        from django.db import models
        return models.QuerySet().none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return PageListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return PageSerializer
        return PageSerializer

    def list(self, request, *args, **kwargs):
        """List pages with error handling"""
        from django_tenants.utils import tenant_context
        from tenants.models import Tenant
        
        user = request.user
        
        # Tenant admin/users see only their tenant's pages
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Page.objects.filter(tenant=user.tenant)
                    
                    # Apply filters from query params
                    status_filter = request.query_params.get('status')
                    if status_filter:
                        queryset = queryset.filter(status=status_filter)
                    
                    # Serialize within tenant context
                    serializer = PageListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error listing pages: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        # Super admin with tenant_id
        if user.is_super_admin():
            tenant_id = request.query_params.get('tenant_id')
            if tenant_id:
                try:
                    tenant = Tenant.objects.get(id=tenant_id)
                    with tenant_context(tenant):
                        queryset = Page.objects.all()
                        serializer = PageListSerializer(queryset, many=True)
                        return Response(serializer.data)
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error listing pages: {e}", exc_info=True)
                    return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    def get_object(self):
        """Get page object within tenant context"""
        from django_tenants.utils import tenant_context
        
        user = self.request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            with tenant_context(user.tenant):
                pk = self.kwargs.get('pk')
                return Page.objects.get(pk=pk, tenant=user.tenant)
        
        # For super admin with tenant_id
        from tenants.models import Tenant
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            tenant = Tenant.objects.get(id=tenant_id)
            with tenant_context(tenant):
                pk = self.kwargs.get('pk')
                return Page.objects.get(pk=pk)
        
        from django.http import Http404
        raise Http404("Page not found")

    def create(self, request, *args, **kwargs):
        """Create a new page"""
        from django_tenants.utils import tenant_context
        from django.utils.text import slugify
        
        user = request.user
        
        # Tenant admin creates page in their tenant
        if hasattr(user, 'tenant') and user.tenant:
            try:
                # Validate data first using serializer (without saving)
                serializer = PageSerializer(data=request.data)
                serializer.is_valid(raise_exception=True)
                validated_data = serializer.validated_data
                
                # Auto-generate slug if not provided
                if not validated_data.get('slug') and validated_data.get('title'):
                    validated_data['slug'] = slugify(validated_data.get('title'))
                
                with tenant_context(user.tenant):
                    # Create page directly in tenant context
                    validated_data['tenant'] = user.tenant
                    page = Page.objects.create(**validated_data)
                    
                    # Serialize within tenant context
                    response_serializer = PageSerializer(page)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error creating page: {e}", exc_info=True)
                
                # If serializer validation error, return validation errors with details
                if hasattr(e, 'detail'):
                    # Handle ValidationError from serializer
                    if isinstance(e.detail, dict):
                        error_messages = []
                        for field, messages in e.detail.items():
                            if isinstance(messages, list):
                                error_messages.extend([f"{field}: {msg}" for msg in messages])
                            else:
                                error_messages.append(f"{field}: {messages}")
                        return Response({
                            'error': 'Erreur de validation',
                            'details': error_messages,
                            'fields': e.detail
                        }, status=status.HTTP_400_BAD_REQUEST)
                    return Response({
                        'error': str(e.detail) if hasattr(e.detail, '__str__') else 'Erreur de validation'
                    }, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, *args, **kwargs):
        """Update a page"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    partial = kwargs.pop('partial', False)
                    pk = kwargs.get('pk')
                    instance = Page.objects.get(pk=pk, tenant=user.tenant)
                    serializer = PageSerializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    return Response(serializer.data)
            except Page.DoesNotExist:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating page: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a page"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    pk = kwargs.get('pk')
                    instance = Page.objects.get(pk=pk, tenant=user.tenant)
                    instance.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
            except Page.DoesNotExist:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting page: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la suppression: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        """Publish a page"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    page = Page.objects.get(pk=pk, tenant=user.tenant)
                    page.status = 'published'
                    if not page.published_at:
                        page.published_at = timezone.now()
                    page.save()
                    return Response({'status': 'Page published'})
            except Page.DoesNotExist:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error publishing page: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la publication: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def unpublish(self, request, pk=None):
        """Unpublish a page"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    page = Page.objects.get(pk=pk, tenant=user.tenant)
                    page.status = 'draft'
                    page.save()
                    return Response({'status': 'Page unpublished'})
            except Page.DoesNotExist:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error unpublishing page: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la dépublication: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def set_homepage(self, request, pk=None):
        """Set page as homepage"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    page = Page.objects.get(pk=pk, tenant=user.tenant)

                    # Unset other homepages for this tenant
                    Page.objects.filter(tenant=user.tenant, is_homepage=True).update(is_homepage=False)

                    # Set this page as homepage
                    page.is_homepage = True
                    page.save()

                    return Response({'status': 'Page set as homepage'})
            except Page.DoesNotExist:
                return Response(
                    {'error': 'Page not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error setting homepage: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def published(self, request):
        """Get only published pages"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Page.objects.filter(
                        tenant=user.tenant,
                        status='published',
                        published_at__lte=timezone.now()
                    )
                    serializer = PageContentSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting published pages: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def homepage(self, request):
        """Get homepage for current tenant"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    homepage = Page.objects.get(
                        tenant=user.tenant,
                        is_homepage=True,
                        status='published'
                    )
                    serializer = PageContentSerializer(homepage)
                    return Response(serializer.data)
            except Page.DoesNotExist:
                return Response(
                    {'error': 'No homepage found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting homepage: {e}", exc_info=True)
                return Response(
                    {'error': 'No homepage found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )
