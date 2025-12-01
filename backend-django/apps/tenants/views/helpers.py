"""
Helper functions and utility views for tenants
"""
import logging
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
from ..serializers import UserProfileSerializer

logger = logging.getLogger(__name__)


def add_cors_headers(response, request):
    """Helper function to add CORS headers to a response"""
    try:
        origin = request.META.get('HTTP_ORIGIN')
        if origin:
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
        logger.warning(f"Error adding CORS headers: {e}")


class UserProfileView(generics.RetrieveUpdateAPIView):
    """View for user profile management"""
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
