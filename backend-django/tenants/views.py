"""
API views for tenant models
"""
from rest_framework import viewsets, status, generics
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.core.mail import send_mail
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.conf import settings
from datetime import timedelta
from django_tenants.utils import tenant_context
from .models import Tenant, User, PasswordResetToken, InvitationToken
from .serializers import (
    TenantSerializer, UserSerializer, UserRegisterSerializer,
    UserProfileSerializer, DomainSerializer
)


class TenantViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tenants"""
    queryset = Tenant.objects.all()
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter tenants based on user role"""
        user = self.request.user
        queryset = Tenant.objects.all()
        
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
                    tenant = Tenant.objects.get(pk=lookup_value)
                    return tenant
                except Tenant.DoesNotExist:
                    raise Http404("Tenant not found")
            raise

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
                    'tenant': TenantSerializer(tenant).data
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
        except Tenant.DoesNotExist:
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
            from django.db import transaction
            from django.utils import timezone
            from django_tenants.utils import schema_context
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
                    from billing.models import Subscription
                    subscription = Subscription.objects.filter(tenant_id=tenant_id).first()
                    if subscription and subscription.status == 'active':
                        has_active_subscription = True
                        logger.info(f"Tenant {tenant_id} has active subscription - deactivating users instead of deleting")
                except Exception as sub_error:
                    logger.debug(f"No subscription check: {str(sub_error)}")
                
                # Get tenant users (in public schema, safe)
                tenant_users = list(User.objects.filter(tenant_id=tenant_id).values_list('id', flat=True))
                logger.info(f"Found {len(tenant_users)} users for tenant {tenant_id}")
                
                if has_active_subscription:
                    # If active subscription: deactivate users instead of deleting
                    for user_id in tenant_users:
                        try:
                            User.objects.filter(id=user_id).update(status='inactive')
                            logger.info(f"Deactivated user {user_id}")
                        except Exception as e:
                            logger.warning(f"Could not deactivate user {user_id}: {str(e)}")
                
                # Soft delete the tenant (just update fields, no schema access needed)
                # Use update() to avoid triggering any schema operations
                from django.utils import timezone
                Tenant.objects.filter(id=tenant_id).update(
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
        except Tenant.DoesNotExist:
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


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter users based on tenant context"""
        user = self.request.user
        if user.is_super_admin():
            return User.objects.all()
        elif user.tenant:
            return User.objects.filter(tenant=user.tenant)
        return User.objects.none()

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return UserRegisterSerializer
        return UserSerializer

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user"""
        user = self.get_object()
        user.status = 'active'
        user.save(update_fields=['status'])
        return Response({'status': 'User activated', 'user': UserSerializer(user).data})

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user"""
        user = self.get_object()
        user.status = 'inactive'
        user.save(update_fields=['status'])
        return Response({'status': 'User deactivated', 'user': UserSerializer(user).data})

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a user"""
        user = self.get_object()
        user.status = 'suspended'
        user.save(update_fields=['status'])
        return Response({'status': 'User suspended', 'user': UserSerializer(user).data})

    def destroy(self, request, *args, **kwargs):
        """
        Delete a user
        Cannot delete super-admin users
        """
        user = self.get_object()
        
        # Prevent deletion of super-admin
        if user.is_super_admin():
            return Response(
                {'error': 'Cannot delete super-admin user'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check permissions
        request_user = request.user
        if not request_user.is_super_admin():
            # Tenant admin can only delete users in their tenant
            if not request_user.is_tenant_admin() or request_user.tenant != user.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission de supprimer cet utilisateur'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        try:
            # Delete related tokens first
            PasswordResetToken.objects.filter(user=user).delete()
            InvitationToken.objects.filter(user=user).delete()
            
            # Delete the user
            user.delete()
            
            return Response(
                {'status': 'User deleted successfully'},
                status=status.HTTP_204_NO_CONTENT
            )
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error deleting user {user.id}: {str(e)}")
            return Response(
                {'error': f'Error deleting user: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['post'])
    def send_password_reset(self, request, pk=None):
        """
        Admin action to send password reset email to a user
        Super admin OR tenant admin for their own users can do this
        """
        user_to_reset = self.get_object()
        request_user = request.user
        
        # Check permissions
        if not request_user.is_super_admin():
            # Tenant admin can only reset passwords for users in their tenant
            if not request_user.is_tenant_admin() or request_user.tenant != user_to_reset.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission de réinitialiser ce mot de passe'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        user = self.get_object()
        
        # Generate token
        token = get_random_string(length=64)
        expires_at = timezone.now() + timedelta(hours=24)  # Token valid for 24 hours
        
        # Create or update reset token
        reset_token, created = PasswordResetToken.objects.update_or_create(
            user=user,
            used=False,
            defaults={
                'token': token,
                'expires_at': expires_at,
                'used': False,
            }
        )
        
        # Generate reset URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
        reset_url = f"{frontend_url}/reset-password?token={token}&email={user.email}"
        
        # Send email
        try:
            send_mail(
                subject='Réinitialisation de votre mot de passe - VTCBuilder',
                message=f'''
Bonjour {user.get_full_name() or user.email},

Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.

Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valable 24 heures) :
{reset_url}

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

Cordialement,
L'équipe VTCBuilder
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour {user.get_full_name() or user.email},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.</p>
                    <p>
                        <a href="{reset_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ou copiez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <p><small>Ce lien est valable pendant 24 heures.</small></p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            return Response({
                'status': 'Password reset email sent',
                'message': f'Email envoyé à {user.email}',
                'reset_url': reset_url,  # For testing/debugging
            })
        except Exception as e:
            return Response(
                {'error': f'Failed to send email: {str(e)}', 'reset_url': reset_url},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint"""
    email = request.data.get('email')
    password = request.data.get('password')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(email=email, password=password)

    if user:
        if not user.is_active_user():
            return Response(
                {'error': 'Account is not active'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    return Response(
        {'error': 'Invalid credentials'},
        status=status.HTTP_401_UNAUTHORIZED
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """User registration endpoint"""
    serializer = UserRegisterSerializer(data=request.data)

    if serializer.is_valid():
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """Logout endpoint"""
    try:
        refresh_token = request.data.get('refresh_token')
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
        return Response({'message': 'Logged out successfully'})
    except Exception:
        return Response({'message': 'Logged out successfully'})


@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_view(request):
    """
    Request password reset by email (public endpoint)
    User enters their email and receives a reset link
    """
    email = request.data.get('email')
    
    if not email:
        return Response(
            {'error': 'Email is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        user = User.objects.get(email=email)
        
        # Generate token
        token = get_random_string(length=64)
        expires_at = timezone.now() + timedelta(hours=24)  # Token valid for 24 hours
        
        # Create or update reset token
        reset_token, created = PasswordResetToken.objects.update_or_create(
            user=user,
            used=False,
            defaults={
                'token': token,
                'expires_at': expires_at,
                'used': False,
            }
        )
        
        # Generate reset URL
        frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
        reset_url = f"{frontend_url}/reset-password?token={token}&email={user.email}"
        
        # Send email
        try:
            send_mail(
                subject='Réinitialisation de votre mot de passe - VTCBuilder',
                message=f'''
Bonjour {user.get_full_name() or user.email},

Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.

Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valable 24 heures) :
{reset_url}

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

Cordialement,
L'équipe VTCBuilder
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour {user.get_full_name() or user.email},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte VTCBuilder.</p>
                    <p>
                        <a href="{reset_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Réinitialiser mon mot de passe
                        </a>
                    </p>
                    <p>Ou copiez ce lien dans votre navigateur :</p>
                    <p style="word-break: break-all; color: #666;">{reset_url}</p>
                    <p><small>Ce lien est valable pendant 24 heures.</small></p>
                    <p>Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                recipient_list=[user.email],
                fail_silently=False,
            )
            
            # Always return success (security best practice - don't reveal if email exists)
            return Response({
                'status': 'success',
                'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending password reset email: {str(e)}")
            # Still return success for security
            return Response({
                'status': 'success',
                'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
            })
            
    except User.DoesNotExist:
        # Don't reveal if email exists (security best practice)
        return Response({
            'status': 'success',
            'message': 'Si un compte existe avec cet email, vous recevrez un lien de réinitialisation.'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    Reset password using token from email
    """
    token = request.data.get('token')
    email = request.data.get('email')
    new_password = request.data.get('password')

    if not token or not email or not new_password:
        return Response(
            {'error': 'Token, email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        reset_token = PasswordResetToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        if not reset_token.is_valid():
            return Response(
                {'error': 'Token expired or already used'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set new password
        user.set_password(new_password)
        user.save()

        # Mark token as used
        reset_token.mark_as_used()

        return Response({'status': 'Password reset successfully'})

    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except PasswordResetToken.DoesNotExist:
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_reset_token_view(request):
    """
    Verify if a reset token is valid (without resetting password)
    """
    token = request.data.get('token')
    email = request.data.get('email')

    if not token or not email:
        return Response(
            {'error': 'Token and email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        reset_token = PasswordResetToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        is_valid = reset_token.is_valid()
        return Response({
            'valid': is_valid,
            'expires_at': reset_token.expires_at.isoformat() if is_valid else None
        })

    except (User.DoesNotExist, PasswordResetToken.DoesNotExist):
        return Response({'valid': False})


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_invitation_token_view(request):
    """
    Verify if an invitation token is valid
    """
    token = request.data.get('token')
    email = request.data.get('email')

    if not token or not email:
        return Response(
            {'error': 'Token and email are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        invitation_token = InvitationToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        is_valid = invitation_token.is_valid()
        return Response({
            'valid': is_valid,
            'expires_at': invitation_token.expires_at.isoformat() if is_valid else None,
            'tenant': {
                'id': invitation_token.tenant.id,
                'name': invitation_token.tenant.name,
                'slug': invitation_token.tenant.slug,
            } if is_valid else None
        })

    except (User.DoesNotExist, InvitationToken.DoesNotExist):
        return Response({'valid': False})


@api_view(['POST'])
@permission_classes([AllowAny])
def complete_invitation_view(request):
    """
    Complete invitation setup by setting password
    """
    token = request.data.get('token')
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')

    if not token or not email or not password:
        return Response(
            {'error': 'Token, email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if len(password) < 8:
        return Response(
            {'error': 'Password must be at least 8 characters'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        user = User.objects.get(email=email)
        invitation_token = InvitationToken.objects.get(
            user=user,
            token=token,
            used=False
        )

        if not invitation_token.is_valid():
            return Response(
                {'error': 'Invitation expired or already used'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Set password and update user info
        user.set_password(password)
        user.first_name = first_name
        user.last_name = last_name
        user.status = 'active'  # Activate user after setup
        user.save()

        # Mark invitation as used
        invitation_token.mark_as_used()

        # Generate tokens for immediate login
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'status': 'Account setup completed successfully',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'User not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except InvitationToken.DoesNotExist:
        return Response(
            {'error': 'Invalid invitation token'},
            status=status.HTTP_400_BAD_REQUEST
        )
