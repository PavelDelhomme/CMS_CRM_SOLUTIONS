"""
Tenant ViewSet - Management of client/tenant resources
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
import logging

from ..models import Client, Feature
from ..serializers import ClientSerializer, FeatureSerializer
from .helpers import add_cors_headers

User = get_user_model()
logger = logging.getLogger(__name__)


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenants"""
    queryset = Client.objects.all()
    serializer_class = ClientSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter tenants based on user role"""
        user = self.request.user
        queryset = Client.objects.all()
        
        # Exclude soft deleted tenants by default
        queryset = queryset.filter(deleted_at__isnull=True)
        
        if user.is_super_admin():
            return queryset
        elif user.is_tenant_admin() and user.tenant:
            return queryset.filter(id=user.tenant.id)
        return queryset.none()
    
    def get_object(self):
        """
        Override get_object to handle cases where tenant schema might not exist
        """
        from django.http import Http404
        try:
            return super().get_object()
        except Exception as e:
            # If there's an error accessing the tenant, check if it exists in public schema
            lookup_url_kwarg = self.lookup_url_kwarg or self.lookup_field
            lookup_value = self.kwargs.get(lookup_url_kwarg)
            
            if lookup_value:
                try:
                    # Try to get tenant directly from public schema
                    tenant = Client.objects.get(pk=lookup_value)
                    return tenant
                except Client.DoesNotExist:
                    raise Http404("Tenant not found")
            raise

    def retrieve(self, request, *args, **kwargs):
        """Retrieve a tenant with error handling and CORS headers"""
        try:
            tenant = self.get_object()
            serializer = self.get_serializer(tenant)
            response = Response(serializer.data)
            add_cors_headers(response, request)
            return response
        except Exception as e:
            logger.error(f"Error retrieving tenant: {e}", exc_info=True)
            response = Response(
                {'error': f'Erreur lors de la récupération du tenant: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            add_cors_headers(response, request)
            return response

    @action(detail=False, methods=['get'])
    def features(self, request):
        """
        Get all available features for the current user's tenant based on their subscription plan.
        Super admin has access to all features.
        """
        try:
            user = request.user
            
            # Super admin a accès à toutes les features
            if user.is_super_admin():
                features = Feature.objects.filter(is_active=True)
                serializer = FeatureSerializer(features, many=True)
                response = Response(serializer.data)
                add_cors_headers(response, request)
                return response
            
            # Pour les autres utilisateurs, filtrer selon leur plan
            if not user.tenant:
                response = Response(
                    {'error': 'User has no tenant associated'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                add_cors_headers(response, request)
                return response
            
            # Récupérer toutes les features actives
            all_features = Feature.objects.filter(is_active=True)
            available_features = []
            
            for feature in all_features:
                if user.can_use_feature(feature):
                    available_features.append(feature)
            
            serializer = FeatureSerializer(available_features, many=True)
            response = Response(serializer.data)
            add_cors_headers(response, request)
            return response
        except Exception as e:
            logger.error(f"Error in tenants/features endpoint: {e}", exc_info=True)
            response = Response(
                {'error': 'Internal server error', 'details': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            add_cors_headers(response, request)
            return response
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a tenant"""
        tenant = self.get_object()
        tenant.status = 'active'
        # Use update_fields to avoid schema creation on existing tenants
        tenant.save(update_fields=['status'])
        return Response({'status': 'Tenant activated'})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a tenant"""
        tenant = self.get_object()
        tenant.status = 'suspended'
        # Use update_fields to avoid schema creation on existing tenants
        tenant.save(update_fields=['status'])
        return Response({'status': 'Tenant suspended'})
    
    @action(detail=True, methods=['post'])
    def reset_admin_password(self, request, pk=None):
        """
        Reset the admin user password for a tenant (for super admin debug)
        Sets password to 'admin123' by default
        """
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can reset tenant admin passwords'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant = self.get_object()
        
        # Get the admin user for this tenant
        admin_user = User.objects.filter(
            tenant=tenant,
            role='tenant-admin'
        ).first()
        
        if not admin_user:
            return Response(
                {'error': 'No admin user found for this tenant'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Reset password to default
        default_password = request.data.get('password', 'admin123')
        admin_user.set_password(default_password)
        admin_user.status = 'active'
        admin_user.save(update_fields=['password', 'status'])
        
        return Response({
            'status': 'Password reset successfully',
            'email': admin_user.email,
            'password': default_password,
            'message': f'Le mot de passe de {admin_user.email} a été réinitialisé.'
        })

    @action(detail=True, methods=['get'])
    def get_admin_info(self, request, pk=None):
        """
        Get admin user information for a tenant (for super admin)
        """
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can view tenant admin info'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant = self.get_object()
        
        # Get the admin user for this tenant
        admin_user = User.objects.filter(
            tenant=tenant,
            role='tenant-admin'
        ).first()
        
        if not admin_user:
            return Response({
                'exists': False,
                'message': 'Aucun utilisateur admin trouvé pour ce tenant'
            })
        
        return Response({
            'exists': True,
            'email': admin_user.email,
            'username': admin_user.username,
            'status': admin_user.status,
            'created_at': admin_user.date_joined.isoformat() if admin_user.date_joined else None,
        })

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """
        Restore a soft deleted tenant
        Only super admin can restore tenants
        """
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can restore tenants'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        tenant = self.get_object()
        
        if not tenant.is_deleted():
            return Response(
                {'error': 'Tenant is not deleted and cannot be restored'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            tenant.restore()
            
            # Reactivate users if they were deactivated
            tenant_users = User.objects.filter(tenant=tenant, status='inactive')
            reactivated_count = 0
            for user in tenant_users:
                user.status = 'active'
                user.save(update_fields=['status'])
                reactivated_count += 1
            
            import logging
            logger = logging.getLogger(__name__)
            logger.info(f"Tenant {tenant.id} restored, {reactivated_count} users reactivated")
            
            return Response(
                {
                    'status': 'Tenant restored successfully',
                    'message': f'Le tenant a été restauré. {reactivated_count} utilisateur(s) réactivé(s).',
                    'tenant': ClientSerializer(tenant).data
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error restoring tenant {tenant.id}: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Error restoring tenant: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def destroy(self, request, *args, **kwargs):
        """
        Soft delete a tenant (marked as deleted, can be restored)
        Only super admin can delete tenants
        
        This method performs a soft delete:
        1. Checks if tenant has active subscription - if yes, deactivates users instead of deleting
        2. Marks tenant as deleted (soft delete) with deleted_at timestamp
        3. Tenant will be permanently deleted after 1 month by purge command
        """
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can delete tenants'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            tenant = self.get_object()
        except Client.DoesNotExist:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting tenant: {str(e)}", exc_info=True)
            return Response(
                {'error': f'Error accessing tenant: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            import logging
            from django.db import transaction, connection
            from django.utils import timezone
            logger = logging.getLogger(__name__)
            
            tenant_id = tenant.id
            tenant_name = tenant.name
            
            # Check if already deleted
            if tenant.is_deleted():
                return Response(
                    {'error': 'Tenant is already deleted'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Starting soft deletion of tenant {tenant_id} ({tenant_name})")
            
            with transaction.atomic():
                # All operations happen in public schema - no need to access tenant schema
                
                # Check if tenant has active subscription (in public schema)
                has_active_subscription = False
                try:
                    from apps.billing.models import Subscription
                    subscription = Subscription.objects.filter(tenant_id=tenant_id).first()
                    if subscription and subscription.status == 'active':
                        has_active_subscription = True
                        logger.info(f"Tenant {tenant_id} has active subscription - deactivating users instead of deleting")
                except Exception as sub_error:
                    logger.debug(f"No subscription check: {str(sub_error)}")
                
                # Get tenant users (in public schema, safe)
                tenant_users = list(User.objects.filter(tenant_id=tenant_id).values_list('id', flat=True))
                logger.info(f"Found {len(tenant_users)} users for tenant {tenant_id}")
                
                # Delete tokens using direct SQL to avoid schema access issues
                if tenant_users:
                    try:
                        from django.db import connection
                        with connection.cursor() as cursor:
                            # Delete password reset tokens (use IN clause instead of ANY for PostgreSQL)
                            if tenant_users:
                                placeholders = ','.join(['%s'] * len(tenant_users))
                                cursor.execute(
                                    f"DELETE FROM password_reset_tokens WHERE user_id IN ({placeholders});",
                                    tenant_users
                                )
                                deleted_count = cursor.rowcount
                                logger.info(f"Deleted {deleted_count} password reset tokens")
                            
                            # Delete invitation tokens
                            if tenant_users:
                                placeholders = ','.join(['%s'] * len(tenant_users))
                                cursor.execute(
                                    f"DELETE FROM invitation_tokens WHERE user_id IN ({placeholders}) OR tenant_id = %s;",
                                    tenant_users + [tenant_id]
                                )
                                deleted_count = cursor.rowcount
                                logger.info(f"Deleted {deleted_count} invitation tokens")
                            else:
                                # Delete by tenant_id only if no users
                                cursor.execute(
                                    "DELETE FROM invitation_tokens WHERE tenant_id = %s;",
                                    [tenant_id]
                                )
                                logger.info(f"Deleted invitation tokens for tenant {tenant_id}")
                    except Exception as token_error:
                        logger.warning(f"Could not delete tokens: {str(token_error)}")
                
                if has_active_subscription:
                    # If active subscription: deactivate users instead of deleting
                    try:
                        User.objects.filter(tenant_id=tenant_id).update(status='inactive')
                        logger.info(f"Deactivated {len(tenant_users)} users")
                    except Exception as e:
                        logger.warning(f"Could not deactivate users: {str(e)}")
                
                # Soft delete the tenant (just update fields, no schema access needed)
                # Use update() to avoid triggering any schema operations
                from django.utils import timezone
                Client.objects.filter(id=tenant_id).update(
                    deleted_at=timezone.now(),
                    status='cancelled'
                )
                tenant.refresh_from_db()
                logger.info(f"Tenant {tenant_id} soft deleted (deleted_at: {tenant.deleted_at})")
            
            return Response(
                {
                    'status': 'Tenant soft deleted successfully',
                    'message': 'Le tenant a été marqué comme supprimé. Il sera définitivement supprimé après 1 mois. Vous pouvez le restaurer avant ce délai.',
                    'deleted_at': tenant.deleted_at.isoformat() if tenant.deleted_at else None,
                    'can_restore': True
                },
                status=status.HTTP_200_OK
            )
        except Client.DoesNotExist:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error soft deleting tenant {tenant.id if 'tenant' in locals() else 'unknown'}: {str(e)}", exc_info=True)
            
            return Response(
                {'error': f'Error deleting tenant: {str(e)}. Please check server logs for details.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


