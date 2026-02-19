"""
User ViewSet - Management of user resources
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.crypto import get_random_string
from django.conf import settings
from django.core.mail import send_mail
from datetime import timedelta
import logging

from ..models import Client, PasswordResetToken, InvitationToken
from ..serializers import UserSerializer, UserRegisterSerializer
from ..utils import is_super_admin
from .helpers import add_cors_headers

User = get_user_model()
logger = logging.getLogger(__name__)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for managing users"""
    queryset = User.objects.all().order_by('-date_joined')  # Fix pagination warning
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter users based on tenant context"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            user = self.request.user
            queryset = User.objects.all().order_by('-date_joined')
            
            # Super admin can filter by tenant_id parameter or see all users
            try:
                if is_super_admin(user):
                    tenant_id = self.request.query_params.get('tenant_id')
                    if tenant_id:
                        try:
                            tenant_id = int(tenant_id)
                            # Filter by tenant_id - only users belonging to this tenant
                            queryset = queryset.filter(tenant_id=tenant_id)
                        except (ValueError, TypeError):
                            # Invalid tenant_id, return all users
                            logger.warning(f"Invalid tenant_id parameter: {tenant_id}")
                            pass
                    # Return queryset (filtered or all)
                    return queryset
                elif hasattr(user, 'tenant') and user.tenant:
                    # Tenant admin only sees users from their tenant
                    return queryset.filter(tenant=user.tenant)
            except Exception as e:
                logger.error(f"Error checking user permissions in get_queryset: {e}", exc_info=True)
                # Return empty queryset on error
                return User.objects.none()
            
            return User.objects.none()
        except Exception as e:
            logger.error(f"Error in UserViewSet.get_queryset: {e}", exc_info=True)
            # Return empty queryset on error
            return User.objects.none()

    def list(self, request, *args, **kwargs):
        """List users with error handling"""
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error in UserViewSet.list: {e}", exc_info=True)
            return Response({
                'error': 'An error occurred while fetching users',
                'message': str(e) if settings.DEBUG else 'Unable to load users'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return UserRegisterSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        """Create user with quota check"""
        # Get tenant from request user or request data
        tenant = None
        if request.user.tenant:
            tenant = request.user.tenant
        elif request.data.get('tenant'):
            try:
                from .models import Tenant
                tenant = Client.objects.get(id=request.data.get('tenant'))
            except Client.DoesNotExist:
                pass
        
        # Check quota before creating user
        if tenant:
            from .quota import check_user_quota
            can_add, current_count, max_users, error_message = check_user_quota(tenant)
            
            if not can_add:
                return Response(
                    {
                        'error': error_message,
                        'quota': {
                            'current': current_count,
                            'max': max_users,
                        }
                    },
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Update user with permission checks"""
        user = self.get_object()
        request_user = request.user
        
        # Check permissions
        if not is_super_admin(request_user):
            # Tenant admin can only update users in their tenant
            if not request_user.is_tenant_admin() or request_user.tenant != user.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission de modifier cet utilisateur'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Prevent changing super-admin role unless you're super-admin
        if 'role' in request.data and request.data['role'] != 'super-admin':
            if is_super_admin(user) and not is_super_admin(request_user):
                return Response(
                    {'error': 'Seul un super admin peut modifier le rôle d\'un super admin'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Handle tenant assignment - check for tenant_id in data
        if 'tenant_id' in request.data or 'tenant' in request.data:
            tenant_id = request.data.get('tenant_id') or request.data.get('tenant')
            if tenant_id:
                try:
                    from .models import Tenant
                    tenant = Client.objects.get(id=tenant_id)
                    request.data['tenant'] = tenant.id
                except (Client.DoesNotExist, ValueError):
                    return Response(
                        {'error': 'Tenant non trouvé'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
            elif tenant_id is None:
                # If tenant_id is explicitly null, remove tenant assignment
                request.data['tenant'] = None
            
            # Remove tenant_id if present (we use 'tenant' for the actual field)
            if 'tenant_id' in request.data:
                request.data.pop('tenant_id')
        
        # If role is super-admin, ensure tenant is None
        if request.data.get('role') == 'super-admin':
            request.data['tenant'] = None
        
        # Use partial update to allow updating only specific fields (like password)
        kwargs['partial'] = True
        return super().update(request, *args, **kwargs)

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
        if is_super_admin(user):
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
    def impersonate(self, request, pk=None):
        """
        Super admin action to impersonate a user
        Creates a temporary token for the target user and stores the original admin ID
        """
        if not is_super_admin(request.user):
            return Response(
                {'error': 'Seul un super admin peut impersonner un utilisateur'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        target_user = self.get_object()
        
        # Cannot impersonate another super admin
        if is_super_admin(target_user):
            return Response(
                {'error': 'Impossible d\'impersonner un autre super admin'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create JWT token for target user
        refresh = RefreshToken.for_user(target_user)
        
        # Store impersonation info in session (for backend tracking)
        request.session['impersonating_user_id'] = target_user.id
        request.session['original_admin_id'] = request.user.id
        request.session.save()
        
        return Response({
            'status': 'Impersonation started',
            'message': f'Vous êtes maintenant connecté en tant que {target_user.email}',
            'target_user': UserSerializer(target_user).data,
            'original_admin': {
                'id': request.user.id,
                'email': request.user.email,
            },
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    @action(detail=False, methods=['post'], url_path='stop-impersonating')
    def stop_impersonating(self, request):
        """
        Stop impersonating and return to original admin account
        """
        original_admin_id = request.session.get('original_admin_id')
        if not original_admin_id:
            return Response(
                {'error': 'Vous n\'êtes pas en mode impersonnification'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get original admin
        try:
            original_admin = User.objects.get(id=original_admin_id)
        except User.DoesNotExist:
            return Response(
                {'error': 'Admin original non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Clear impersonation session
        request.session.pop('impersonating_user_id', None)
        request.session.pop('original_admin_id', None)
        request.session.save()
        
        # Create new token for original admin
        refresh = RefreshToken.for_user(original_admin)
        
        return Response({
            'status': 'Impersonation stopped',
            'message': f'Retour au compte {original_admin.email}',
            'user': UserSerializer(original_admin).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        })

    @action(detail=False, methods=['get', 'options'], url_path='impersonation-status')
    def impersonation_status(self, request):
        """
        Check if currently impersonating a user
        """
        import logging
        logger = logging.getLogger(__name__)
        
        try:
            # Handle OPTIONS request for CORS preflight
            if request.method == 'OPTIONS':
                response = Response()
                self._add_cors_headers(response, request)
                return response
            
            # Check authentication
            if not request.user or not request.user.is_authenticated:
                response = Response({
                    'is_impersonating': False,
                    'impersonating': False,  # Alias for compatibility
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
                self._add_cors_headers(response, request)
                return response
            
            # Safely access session
            try:
                impersonating_user_id = request.session.get('impersonating_user_id')
                original_admin_id = request.session.get('original_admin_id')
            except Exception as session_error:
                logger.warning(f"Error accessing session in impersonation_status: {session_error}")
                # Return default response if session is not available
                response = Response({
                    'is_impersonating': False,
                    'impersonating': False,  # Alias for compatibility
                })
                # Ensure CORS headers are added manually
                self._add_cors_headers(response, request)
                return response
            
            if impersonating_user_id and original_admin_id:
                try:
                    target_user = User.objects.get(id=impersonating_user_id)
                    original_admin = User.objects.get(id=original_admin_id)
                    response = Response({
                        'is_impersonating': True,
                        'impersonating': True,  # Alias for compatibility
                        'target_user': UserSerializer(target_user).data,
                        'original_admin': {
                            'id': original_admin.id,
                            'email': original_admin.email,
                        },
                        'impersonated_by': original_admin.email,  # Alias for compatibility
                    })
                    # Ensure CORS headers are added
                    self._add_cors_headers(response, request)
                    return response
                except User.DoesNotExist:
                    # Clear invalid session
                    try:
                        request.session.pop('impersonating_user_id', None)
                        request.session.pop('original_admin_id', None)
                        request.session.save()
                    except Exception:
                        pass  # Ignore session save errors
            
            response = Response({
                'is_impersonating': False,
                'impersonating': False,  # Alias for compatibility
            })
            # Ensure CORS headers are added
            self._add_cors_headers(response, request)
            return response
        except Exception as e:
            logger.error(f"Error in impersonation_status: {e}", exc_info=True)
            response = Response({
                'is_impersonating': False,
                'impersonating': False,
                'error': 'An error occurred while checking impersonation status'
            }, status=500)
            # Ensure CORS headers are added to error response
            self._add_cors_headers(response, request)
            return response
    
    def _add_cors_headers(self, response, request=None):
        """Helper method to add CORS headers to a response"""
        try:
            # Use request from parameter or self.request
            if request is None:
                request = getattr(self, 'request', None)
            if request:
                origin = request.META.get('HTTP_ORIGIN')
                if origin:
                    from django.conf import settings
                    if settings.DEBUG:
                        # En développement, autoriser tous les localhost, 127.0.0.1 et 192.168.1.134
                        if (origin.startswith('http://localhost') or 
                            origin.startswith('http://127.0.0.1') or
                            origin.startswith('http://192.168.1.134') or
                            origin.startswith('https://localhost') or
                            origin.startswith('https://127.0.0.1') or
                            origin.startswith('https://192.168.1.134')):
                            response['Access-Control-Allow-Origin'] = origin
                            response['Access-Control-Allow-Credentials'] = 'true'
                            response['Access-Control-Allow-Methods'] = ', '.join(settings.CORS_ALLOW_METHODS)
                            response['Access-Control-Allow-Headers'] = ', '.join(settings.CORS_ALLOW_HEADERS)
                    else:
                        if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and origin in settings.CORS_ALLOWED_ORIGINS:
                            response['Access-Control-Allow-Origin'] = origin
                            response['Access-Control-Allow-Credentials'] = 'true'
        except Exception as e:
            import logging
            logging.getLogger(__name__).warning(f"Error adding CORS headers: {e}")

    @action(detail=True, methods=['post'])
    def send_password_reset(self, request, pk=None):
        """
        Admin action to send password reset email to a user
        Super admin OR tenant admin for their own users can do this
        """
        user_to_reset = self.get_object()
        request_user = request.user
        
        # Check permissions
        if not is_super_admin(request_user):
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
                subject='Réinitialisation de votre mot de passe - CMS CRM Solutions',
                message=f'''
Bonjour {user.get_full_name() or user.email},

Vous avez demandé à réinitialiser votre mot de passe pour votre compte CMS CRM Solutions.

Cliquez sur le lien suivant pour réinitialiser votre mot de passe (valable 24 heures) :
{reset_url}

Si vous n'avez pas demandé cette réinitialisation, vous pouvez ignorer cet email.

Cordialement,
L'équipe CMS CRM Solutions
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Réinitialisation de votre mot de passe</h2>
                    <p>Bonjour {user.get_full_name() or user.email},</p>
                    <p>Vous avez demandé à réinitialiser votre mot de passe pour votre compte CMS CRM Solutions.</p>
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
                    <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe CMS CRM Solutions</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@cms-crm-solutions.com'),
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


