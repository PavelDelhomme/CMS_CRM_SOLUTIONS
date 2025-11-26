"""
Views for System Settings
"""
import logging
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SystemSettings
from .serializers import SystemSettingsSerializer

logger = logging.getLogger(__name__)


@api_view(['GET', 'POST', 'PATCH', 'PUT'])
@permission_classes([IsAuthenticated])
def system_settings_view(request):
    """Get, create or update system settings (singleton)"""
    if not request.user.is_super_admin():
        return Response(
            {'error': 'Only super admin can manage system settings'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    try:
        # GET - Retrieve settings
        if request.method == 'GET':
            instance = SystemSettings.get_settings()
            serializer = SystemSettingsSerializer(instance)
            return Response(serializer.data)
        
        # POST/PATCH/PUT - Create or update settings
        else:
            # Try to get existing instance
            try:
                instance = SystemSettings.get_settings()
                # Update existing
                is_partial = request.method == 'PATCH'
                serializer = SystemSettingsSerializer(instance, data=request.data, partial=is_partial)
            except Exception:
                # Create new if doesn't exist
                instance = SystemSettings()
                serializer = SystemSettingsSerializer(instance, data=request.data)
            
            serializer.is_valid(raise_exception=True)
            serializer.save()
            
            status_code = status.HTTP_200_OK if instance.pk else status.HTTP_201_CREATED
            return Response(serializer.data, status=status_code)
            
    except Exception as e:
        logger.error(f"Error in system_settings_view ({request.method}): {e}", exc_info=True)
        if request.method == 'GET':
            # Try to create default instance on GET error
            try:
                instance = SystemSettings()
                instance.save()
                serializer = SystemSettingsSerializer(instance)
                return Response(serializer.data)
            except Exception as create_error:
                logger.error(f"Error creating default system settings: {create_error}", exc_info=True)
                return Response(
                    {'error': f'Erreur lors de la récupération des paramètres système: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        else:
            return Response(
                {'error': f'Erreur lors de la sauvegarde des paramètres: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def system_settings_test_email_view(request):
    """Test email configuration - send test email to specified recipient"""
    if not request.user.is_super_admin():
        return Response(
            {'error': 'Only super admin can test email configuration'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Get recipient email from request body
    recipient_email = request.data.get('email', '').strip()
    
    if not recipient_email or '@' not in recipient_email:
        return Response(
            {
                'status': 'error',
                'message': 'Veuillez fournir une adresse email valide'
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Use Django default email settings from .env (already configured in settings.py)
        from django.core.mail import send_mail
        from django.conf import settings as django_settings
        
        # Email from address - use env var or default
        from decouple import config
        email_from = config('DEFAULT_FROM_EMAIL', default='noreply@vtcbuilder.com')
        
        # Send test email using Django's configured email backend
        send_mail(
            subject='Test Email - VTCBuilder',
            message='Ceci est un email de test depuis VTCBuilder.\n\nSi vous recevez ce message, la configuration email fonctionne correctement.\n\nLes emails automatiques (réinitialisation de mot de passe, activation de compte, factures) seront envoyés depuis noreply@vtcbuilder.com.',
            from_email=email_from,
            recipient_list=[recipient_email],
            fail_silently=False,
        )
        
        logger.info(f"Test email sent successfully to {recipient_email} from {email_from}")
        
        return Response({
            'status': 'success',
            'message': f'Email de test envoyé avec succès à {recipient_email} !'
        })
    except Exception as e:
        logger.error(f"Error sending test email to {recipient_email}: {e}", exc_info=True)
        return Response(
            {
                'status': 'error',
                'message': f'Erreur lors de l\'envoi de l\'email de test: {str(e)}'
            },
            status=status.HTTP_400_BAD_REQUEST
        )


class SystemSettingsViewSet(viewsets.ModelViewSet):
    """ViewSet for managing system settings"""
    queryset = SystemSettings.objects.all()
    serializer_class = SystemSettingsSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ['get', 'put', 'patch', 'options', 'head']
    
    def get_queryset(self):
        """Return singleton instance"""
        return SystemSettings.objects.all()
    
    def get_object(self):
        """Get or create the singleton settings instance"""
        try:
            return SystemSettings.get_settings()
        except Exception:
            # If get_or_create fails, create a new instance
            instance = SystemSettings()
            instance.save()
            return instance
    
    def list(self, request, *args, **kwargs):
        """Return the singleton settings instance"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can view system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        try:
            # get_or_create will create if doesn't exist
            instance = SystemSettings.get_settings()
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error getting system settings: {e}", exc_info=True)
            # Try to create default instance
            try:
                instance = SystemSettings()
                instance.save()
                serializer = self.get_serializer(instance)
                return Response(serializer.data)
            except Exception as create_error:
                logger.error(f"Error creating default system settings: {create_error}", exc_info=True)
                # Return error details for debugging
                return Response(
                    {'error': f'Erreur lors de la récupération des paramètres système: {str(e)}'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
    
    def retrieve(self, request, *args, **kwargs):
        """Get settings instance"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can view system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Create or update system settings (singleton pattern)"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can manage system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            instance = self.get_object()
        except:
            # Create new instance if it doesn't exist
            instance = SystemSettings()
        
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED if not instance.pk else status.HTTP_200_OK)
    
    def update(self, request, *args, **kwargs):
        """Update system settings"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can manage system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partially update system settings"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can manage system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def test_email(self, request):
        """Test email configuration"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can test email configuration'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        settings = self.get_object()
        
        try:
            from django.core.mail import send_mail
            from django.conf import settings as django_settings
            
            # Temporarily update Django email settings
            django_settings.EMAIL_HOST = settings.email_host
            django_settings.EMAIL_PORT = settings.email_port
            django_settings.EMAIL_USE_TLS = settings.email_use_tls
            django_settings.EMAIL_USE_SSL = settings.email_use_ssl
            django_settings.EMAIL_HOST_USER = settings.email_host_user
            django_settings.EMAIL_HOST_PASSWORD = settings.email_host_password
            django_settings.EMAIL_FROM = settings.email_from
            
            # Send test email
            send_mail(
                subject='Test Email - VTCBuilder',
                message='Ceci est un email de test depuis VTCBuilder.',
                from_email=settings.email_from,
                recipient_list=[request.user.email],
                fail_silently=False,
            )
            
            return Response({
                'status': 'success',
                'message': 'Email de test envoyé avec succès !'
            })
        except Exception as e:
            return Response(
                {
                    'status': 'error',
                    'message': f'Erreur lors de l\'envoi de l\'email de test: {str(e)}'
                },
                status=status.HTTP_400_BAD_REQUEST
            )

