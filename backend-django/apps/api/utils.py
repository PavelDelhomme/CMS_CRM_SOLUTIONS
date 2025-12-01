"""
Utility functions for API views, including CORS headers management
"""
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def add_cors_headers(response, request):
    """
    Helper function to add CORS headers to a response.
    This ensures consistent CORS header application across all API endpoints.
    """
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
                # En production, vérifier les origines autorisées
                if hasattr(settings, 'CORS_ALLOWED_ORIGINS') and origin in settings.CORS_ALLOWED_ORIGINS:
                    response['Access-Control-Allow-Origin'] = origin
                    response['Access-Control-Allow-Credentials'] = 'true'
                    response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
                    response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
    except Exception as e:
        logger.warning(f"Error adding CORS headers: {e}")

