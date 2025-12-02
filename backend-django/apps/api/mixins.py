"""
DRF Mixins for common functionality, including automatic CORS headers
"""
from rest_framework.response import Response
from apps.api.utils import add_cors_headers


class CORSMixin:
    """
    Mixin that automatically adds CORS headers to all responses from a ViewSet.
    This ensures consistent CORS handling across all API endpoints.
    """
    
    def finalize_response(self, request, response, *args, **kwargs):
        """Override finalize_response to add CORS headers to all responses"""
        response = super().finalize_response(request, response, *args, **kwargs)
        add_cors_headers(response, request)
        return response

