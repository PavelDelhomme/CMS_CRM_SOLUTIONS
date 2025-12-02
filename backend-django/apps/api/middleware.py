"""
Middleware pour ajouter les en-têtes CORS même en cas d'erreur 404
"""
from django.conf import settings
from django.http import JsonResponse


class CORSResponseMiddleware:
    """
    Middleware pour ajouter les en-têtes CORS à toutes les réponses,
    y compris les erreurs 404
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Intercepter les requêtes OPTIONS avant le routing
        if request.method == 'OPTIONS' and request.path.startswith('/api/'):
            origin = request.META.get('HTTP_ORIGIN')
            if origin:
                allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
                allow_all = getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)
                
                if allow_all or origin in allowed_origins or (settings.DEBUG and origin.startswith('http://localhost')):
                    allowed_methods = getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
                    allowed_headers = getattr(settings, 'CORS_ALLOW_HEADERS', ['content-type', 'authorization'])
                    
                    response = JsonResponse({}, status=200)
                    response['Access-Control-Allow-Origin'] = origin
                    response['Access-Control-Allow-Credentials'] = 'true'
                    response['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
                    response['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
                    response['Access-Control-Max-Age'] = '86400'
                    return response
        
        response = self.get_response(request)
        return self.add_cors_headers(response, request)

    def add_cors_headers(self, response, request):
        """Ajouter les en-têtes CORS à la réponse"""
        origin = request.META.get('HTTP_ORIGIN')
        
        if origin:
            # Vérifier si l'origine est autorisée
            allowed_origins = getattr(settings, 'CORS_ALLOWED_ORIGINS', [])
            allow_all = getattr(settings, 'CORS_ALLOW_ALL_ORIGINS', False)
            
            if allow_all or origin in allowed_origins or (settings.DEBUG and origin.startswith('http://localhost')):
                response['Access-Control-Allow-Origin'] = origin
                response['Access-Control-Allow-Credentials'] = 'true'
                
                # Pour les requêtes preflight OPTIONS
                if request.method == 'OPTIONS':
                    allowed_methods = getattr(settings, 'CORS_ALLOW_METHODS', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])
                    allowed_headers = getattr(settings, 'CORS_ALLOW_HEADERS', ['content-type', 'authorization'])
                    
                    response['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
                    response['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
                    response['Access-Control-Max-Age'] = '86400'
                    
                    # Répondre immédiatement aux requêtes OPTIONS
                    if request.method == 'OPTIONS' and request.path.startswith('/api/'):
                        response = JsonResponse({}, status=200)
                        response['Access-Control-Allow-Origin'] = origin
                        response['Access-Control-Allow-Credentials'] = 'true'
                        response['Access-Control-Allow-Methods'] = ', '.join(allowed_methods)
                        response['Access-Control-Allow-Headers'] = ', '.join(allowed_headers)
                        response['Access-Control-Max-Age'] = '86400'
                        return response
        
        return response

