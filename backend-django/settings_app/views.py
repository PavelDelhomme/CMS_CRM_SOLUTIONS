"""
Views for System Settings
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import SystemSettings
from .serializers import SystemSettingsSerializer


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
        return SystemSettings.get_settings()
    
    def list(self, request, *args, **kwargs):
        """Return the singleton settings instance as a list"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can view system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response(serializer.data)
    
    def retrieve(self, request, *args, **kwargs):
        """Get settings instance"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can view system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().retrieve(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Update existing settings instead of creating new"""
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
    
    def update(self, request, *args, **kwargs):
        """Update system settings"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can manage system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)
    
    def partial_update(self, request, *args, **kwargs):
        """Partially update system settings"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can manage system settings'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().partial_update(request, *args, **kwargs)
    
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

