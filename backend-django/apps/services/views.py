"""
API views for service models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.api.mixins import CORSMixin
from .models import Service
from .serializers import ServiceSerializer, ServiceListSerializer, ServicePriceSerializer


class ServiceViewSet(CORSMixin, viewsets.ModelViewSet):
    """ViewSet for managing services"""
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
            return ServiceListSerializer
        elif self.action == 'pricing':
            return ServicePriceSerializer
        return ServiceSerializer

    def list(self, request, *args, **kwargs):
        """List services with error handling"""
        import logging
        logger = logging.getLogger(__name__)
        from django_tenants.utils import tenant_context
        from apps.tenants.models import Client
        from django.db import connection
        
        user = request.user
        
        # Tenant admin/users see only their tenant's services
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    # In tenant context, all services belong to this tenant
                    # So we can query all services without filtering by tenant
                    queryset = Service.objects.all()
                    
                    # Apply filters from query params
                    is_active = request.query_params.get('is_active')
                    if is_active is not None:
                        is_active_bool = is_active.lower() == 'true'
                        queryset = queryset.filter(is_active=is_active_bool)
                    
                    # Serialize within tenant context
                    serializer = ServiceListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                logger.error(f"Error listing services for tenant {user.tenant.id if user.tenant else 'None'}: {str(e)}", exc_info=True)
                # Return error details for debugging
                return Response(
                    {'error': f'Erreur lors de la récupération des services: {str(e)}', 'details': str(e)},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        # Super admin with tenant_id
        from apps.tenants.utils import is_super_admin
        if is_super_admin(user):
            tenant_id = request.query_params.get('tenant_id')
            if tenant_id:
                try:
                    tenant = Client.objects.get(id=tenant_id)
                    with tenant_context(tenant):
                        queryset = Service.objects.all()
                        serializer = ServiceListSerializer(queryset, many=True)
                        return Response(serializer.data)
                except Client.DoesNotExist:
                    return Response(
                        {'error': 'Tenant not found'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                except Exception as e:
                    logger.error(f"Error listing services for tenant {tenant_id}: {str(e)}", exc_info=True)
                    return Response(
                        {'error': f'Erreur lors de la récupération des services: {str(e)}', 'details': str(e)},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        return Response([], status=status.HTTP_200_OK)

    def create(self, request, *args, **kwargs):
        """Create a new service"""
        from django_tenants.utils import tenant_context
        from django.utils.text import slugify
        from apps.tenants.models import Client
        from apps.tenants.utils import is_super_admin
        import logging
        logger = logging.getLogger(__name__)
        
        user = request.user
        
        # Super admin can create service for a specific tenant
        if is_super_admin(user):
            tenant_id = request.data.get('tenant_id')
            if tenant_id:
                try:
                    tenant = Client.objects.get(id=tenant_id)
                    data = request.data.copy()
                    if 'tenant' in data:
                        del data['tenant']
                    if 'tenant_id' in data:
                        del data['tenant_id']
                    
                    logger.info(f"Super admin creating service for tenant {tenant.id} with data: {data}")
                    
                    serializer = ServiceSerializer(data=data)
                    if not serializer.is_valid():
                        logger.error(f"Serializer validation errors: {serializer.errors}")
                        return Response(
                            {'error': 'Erreur de validation', 'details': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    validated_data = serializer.validated_data
                    if not validated_data.get('slug') and validated_data.get('name'):
                        validated_data['slug'] = slugify(validated_data.get('name'))
                    
                    with tenant_context(tenant):
                        validated_data['tenant'] = tenant
                        service = Service.objects.create(**validated_data)
                        response_serializer = ServiceSerializer(service)
                        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                except Client.DoesNotExist:
                    return Response(
                        {'error': f'Tenant avec l\'ID {tenant_id} non trouvé'},
                        status=status.HTTP_404_NOT_FOUND
                    )
                except Exception as e:
                    logger.error(f"Error creating service for super admin: {e}", exc_info=True)
                    return Response(
                        {'error': f'Erreur lors de la création: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
            else:
                # Super admin without tenant_id - try to get or create a default tenant
                try:
                    # Try to get the first active tenant (exclude public schema)
                    tenant = Client.objects.filter(is_active=True).exclude(schema_name='public').first()
                    if not tenant:
                        # Create a default tenant for super admin
                        from django.utils.text import slugify
                        from apps.tenants.models import Domain
                        
                        default_name = 'Tenant par défaut'
                        
                        # Generate slug from name (will be auto-generated by save() if not provided)
                        default_slug = slugify(default_name)
                        
                        # Ensure slug is unique
                        counter = 1
                        unique_slug = default_slug
                        while Client.objects.filter(slug=unique_slug).exists():
                            unique_slug = f"{default_slug}-{counter}"
                            counter += 1
                        
                        # Generate unique schema_name (must be valid PostgreSQL identifier)
                        schema_name = unique_slug.replace('-', '_')
                        # Ensure schema_name is unique
                        counter = 1
                        unique_schema = schema_name
                        while Client.objects.filter(schema_name=unique_schema).exists():
                            unique_schema = f"{schema_name}_{counter}"
                            counter += 1
                        
                        # Create tenant with all required fields (save() will auto-generate defaults if not provided, but we set them explicitly)
                        # Generate a default email from the slug
                        from django.utils import timezone
                        default_email = f"admin@{unique_slug}.localhost"
                        tenant = Client.objects.create(
                            name=default_name,
                            slug=unique_slug,
                            email=default_email,
                            plan='free',  # Default plan
                            status='active',  # Default status
                            primary_color='#3B82F6',  # Default blue
                            secondary_color='#6B7280',  # Default gray
                            settings={},  # Empty dict as default settings
                            metadata={},  # Empty dict as default metadata
                            schema_name=unique_schema,
                            is_active=True,
                            created_at=timezone.now()  # Explicitly set created_at to avoid not-null constraint violation
                        )
                        
                        # Create default domain for the tenant
                        Domain.objects.get_or_create(
                            domain=f"{unique_slug}.localhost",
                            defaults={
                                'tenant': tenant,
                                'is_primary': True,
                            }
                        )
                        
                        logger.info(f"Created default tenant {tenant.id} ({tenant.schema_name}, slug: {tenant.slug}) for super admin")
                    
                    # Use this tenant
                    data = request.data.copy()
                    if 'tenant' in data:
                        del data['tenant']
                    if 'tenant_id' in data:
                        del data['tenant_id']
                    
                    logger.info(f"Super admin creating service for default tenant {tenant.id} with data: {data}")
                    
                    serializer = ServiceSerializer(data=data)
                    if not serializer.is_valid():
                        logger.error(f"Serializer validation errors: {serializer.errors}")
                        return Response(
                            {'error': 'Erreur de validation', 'details': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST
                        )
                    
                    validated_data = serializer.validated_data
                    if not validated_data.get('slug') and validated_data.get('name'):
                        validated_data['slug'] = slugify(validated_data.get('name'))
                    
                    with tenant_context(tenant):
                        validated_data['tenant'] = tenant
                        service = Service.objects.create(**validated_data)
                        response_serializer = ServiceSerializer(service)
                        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
                except Exception as e:
                    logger.error(f"Error creating service for super admin with default tenant: {e}", exc_info=True)
                    return Response(
                        {'error': f'Erreur lors de la création: {str(e)}'},
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR
                    )
        
        # Tenant admin creates service in their tenant
        if hasattr(user, 'tenant') and user.tenant:
            try:
                # Remove tenant from request.data if present (will be set from user context)
                data = request.data.copy()
                if 'tenant' in data:
                    del data['tenant']
                
                # Log incoming data for debugging
                logger.info(f"Creating service with data: {data}")
                logger.info(f"User tenant: {user.tenant.id if user.tenant else 'None'}")
                
                # Validate data first using serializer (without saving)
                serializer = ServiceSerializer(data=data)
                if not serializer.is_valid():
                    logger.error(f"Serializer validation errors: {serializer.errors}")
                    logger.error(f"Invalid data received: {data}")
                    return Response(
                        {'error': 'Erreur de validation', 'details': serializer.errors},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                validated_data = serializer.validated_data
                
                # Auto-generate slug if not provided
                if not validated_data.get('slug') and validated_data.get('name'):
                    validated_data['slug'] = slugify(validated_data.get('name'))
                
                with tenant_context(user.tenant):
                    # Set tenant FK - django-tenants handles cross-schema FK
                    validated_data['tenant'] = user.tenant
                    service = Service.objects.create(**validated_data)
                    
                    # Serialize within tenant context
                    response_serializer = ServiceSerializer(service)
                    return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                logger.error(f"Error creating service: {e}", exc_info=True)
                
                # If serializer validation error, return validation errors
                if hasattr(e, 'detail'):
                    return Response({'error': str(e.detail), 'details': str(e)}, status=status.HTTP_400_BAD_REQUEST)
                
                return Response(
                    {'error': f'Erreur lors de la création: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def update(self, request, *args, **kwargs):
        """Update a service"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    partial = kwargs.pop('partial', False)
                    pk = kwargs.get('pk')
                    instance = Service.objects.get(pk=pk)
                    serializer = ServiceSerializer(instance, data=request.data, partial=partial)
                    serializer.is_valid(raise_exception=True)
                    serializer.save()
                    return Response(serializer.data)
            except Service.DoesNotExist:
                return Response(
                    {'error': 'Service not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error updating service: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la mise à jour: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def destroy(self, request, *args, **kwargs):
        """Delete a service"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    pk = kwargs.get('pk')
                    instance = Service.objects.get(pk=pk)
                    instance.delete()
                    return Response(status=status.HTTP_204_NO_CONTENT)
            except Service.DoesNotExist:
                return Response(
                    {'error': 'Service not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deleting service: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la suppression: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    def get_object(self):
        """Get service object within tenant context"""
        from django_tenants.utils import tenant_context
        
        user = self.request.user
        
        if hasattr(user, 'tenant') and user.tenant:
            with tenant_context(user.tenant):
                pk = self.kwargs.get('pk')
                return Service.objects.get(pk=pk)
        
        # For super admin with tenant_id
        from apps.tenants.models import Client
        tenant_id = self.request.query_params.get('tenant_id')
        if tenant_id:
            tenant = Client.objects.get(id=tenant_id)
            with tenant_context(tenant):
                pk = self.kwargs.get('pk')
                return Service.objects.get(pk=pk)
        
        from django.http import Http404
        raise Http404("Service not found")

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a service"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    service = Service.objects.get(pk=pk)
                    service.is_active = True
                    service.save()
                    return Response({'status': 'Service activated'})
            except Service.DoesNotExist:
                return Response(
                    {'error': 'Service not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error activating service: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de l\'activation: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a service"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    service = Service.objects.get(pk=pk)
                    service.is_active = False
                    service.save()
                    return Response({'status': 'Service deactivated'})
            except Service.DoesNotExist:
                return Response(
                    {'error': 'Service not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error deactivating service: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la désactivation: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )

    @action(detail=False, methods=['get'])
    def active(self, request):
        """Get only active services"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Service.objects.filter(is_active=True)
                    serializer = ServiceListSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting active services: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def pricing(self, request):
        """Get pricing information for services"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    queryset = Service.objects.filter(is_active=True)
                    serializer = ServicePriceSerializer(queryset, many=True)
                    return Response(serializer.data)
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting pricing: {e}", exc_info=True)
                return Response([], status=status.HTTP_200_OK)
        
        return Response([], status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'])
    def pricing_detail(self, request, pk=None):
        """Get detailed pricing for a specific service"""
        from django_tenants.utils import tenant_context
        
        user = request.user
        if hasattr(user, 'tenant') and user.tenant:
            try:
                with tenant_context(user.tenant):
                    service = Service.objects.get(pk=pk)
                    serializer = ServicePriceSerializer(service)
                    return Response(serializer.data)
            except Service.DoesNotExist:
                return Response(
                    {'error': 'Service not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
            except Exception as e:
                import logging
                logger = logging.getLogger(__name__)
                logger.error(f"Error getting pricing detail: {e}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la récupération: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(
            {'error': 'Aucun tenant associé à votre compte'},
            status=status.HTTP_400_BAD_REQUEST
        )
