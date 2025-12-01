"""
Exception handlers for DRF to ensure CORS headers are always included
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that ensures CORS headers are always present
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is None:
        # If DRF doesn't handle it, create a 500 response
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        response = Response({
            'error': 'Internal server error',
            'message': str(exc) if settings.DEBUG else 'An error occurred'
        }, status=500)
    
    # Add CORS headers to error responses
    request = context.get('request')
    if request:
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
    
    return response

