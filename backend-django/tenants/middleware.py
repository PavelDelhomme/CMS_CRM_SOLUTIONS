"""
Middleware to check user status and block access for suspended/inactive users
"""
from django.http import JsonResponse
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication


class UserStatusMiddleware:
    """
    Middleware to check if authenticated user is active/suspended/inactive
    Blocks access to API endpoints for suspended or inactive users
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Skip for non-API paths or public paths
        if not request.path.startswith('/api/'):
            return self.get_response(request)

        # Skip authentication check for public endpoints
        public_paths = [
            '/api/auth/login/',
            '/api/auth/register/',
            '/api/auth/register-with-plan/',
            '/api/auth/logout/',  # Allow logout even if suspended
            '/api/auth/reset-password/request/',
            '/api/auth/reset-password/reset/',
            '/api/auth/reset-password/verify/',
            '/api/auth/invitation/verify/',
            '/api/auth/invitation/complete/',
        ]

        if any(request.path.startswith(path) for path in public_paths):
            return self.get_response(request)

        # Check user status for authenticated requests
        try:
            jwt_auth = JWTAuthentication()
            header = jwt_auth.get_header(request)
            if header:
                raw_token = jwt_auth.get_raw_token(header)
                if raw_token:
                    validated_token = jwt_auth.get_validated_token(raw_token)
                    user = jwt_auth.get_user(validated_token)

                    if user:
                        # Super admin can always access
                        if user.is_super_admin():
                            return self.get_response(request)
                        
                        # Check user status
                        if user.status == 'suspended':
                            return JsonResponse(
                                {
                                    'error': 'Compte suspendu',
                                    'detail': 'Votre compte a été suspendu. Veuillez contacter l\'administrateur.',
                                    'status': 'suspended'
                                },
                                status=403
                            )
                        
                        if user.status == 'inactive':
                            return JsonResponse(
                                {
                                    'error': 'Compte désactivé',
                                    'detail': 'Votre compte a été désactivé. Veuillez contacter l\'administrateur.',
                                    'status': 'inactive'
                                },
                                status=403
                            )

        except (InvalidToken, TokenError, AttributeError, TypeError, KeyError, ValueError):
            # If no valid token or user, let the normal authentication handle it
            pass

        return self.get_response(request)

