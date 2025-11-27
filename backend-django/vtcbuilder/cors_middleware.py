"""
Middleware pour garantir que les headers CORS sont toujours envoyés, même en cas d'erreur
"""
from django.utils.deprecation import MiddlewareMixin
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class CORSAlwaysMiddleware(MiddlewareMixin):
    """
    Middleware qui garantit que les headers CORS sont toujours ajoutés,
    même si une exception est levée avant que corsheaders ne puisse les ajouter
    """
    
    def _add_cors_headers(self, response, request):
        """Ajouter les headers CORS à une réponse"""
        origin = request.META.get('HTTP_ORIGIN')
        
        # Si pas d'origin, pas besoin de CORS
        if not origin:
            return response
        
        # Vérifier si l'origin est autorisé
        allowed = False
        
        if settings.DEBUG:
            # En développement, autoriser tous les localhost
            if origin.startswith('http://localhost') or origin.startswith('http://127.0.0.1'):
                allowed = True
        else:
            # En production, vérifier les origines autorisées
            if hasattr(settings, 'CORS_ALLOWED_ORIGINS'):
                allowed = origin in settings.CORS_ALLOWED_ORIGINS
        
        if allowed:
            # Ajouter les headers CORS
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'accept, accept-encoding, authorization, content-type, dnt, origin, user-agent, x-csrftoken, x-requested-with'
        
        return response
    
    def process_response(self, request, response):
        """Ajouter les headers CORS à toutes les réponses"""
        return self._add_cors_headers(response, request)
    
    def process_exception(self, request, exception):
        """
        Si une exception est levée, retourner une réponse avec headers CORS
        """
        from django.http import JsonResponse
        
        logger.error(f"Exception in CORSAlwaysMiddleware: {exception}", exc_info=True)
        
        # Créer une réponse d'erreur avec headers CORS
        error_response = JsonResponse({
            'error': 'Internal server error',
            'message': str(exception) if settings.DEBUG else 'An error occurred'
        }, status=500)
        
        return self._add_cors_headers(error_response, request)
