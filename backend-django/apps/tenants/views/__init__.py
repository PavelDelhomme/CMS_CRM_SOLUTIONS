"""
Views module for tenants app - organized by functionality
"""
from .helpers import add_cors_headers, UserProfileView
from .viewsets import TenantViewSet, UserViewSet, FeatureViewSet, UserFeatureViewSet
from .auth import (
    login_view,
    register_view,
    register_with_plan_view,
    logout_view,
)
from .tokens import (
    request_password_reset_view,
    reset_password_view,
    verify_reset_token_view,
    verify_invitation_token_view,
    complete_invitation_view,
)

__all__ = [
    # Helpers
    'add_cors_headers',
    'UserProfileView',
    # ViewSets
    'TenantViewSet',
    'UserViewSet',
    'FeatureViewSet',
    'UserFeatureViewSet',
    # Auth
    'login_view',
    'register_view',
    'register_with_plan_view',
    'logout_view',
    # Tokens
    'request_password_reset_view',
    'reset_password_view',
    'verify_reset_token_view',
    'verify_invitation_token_view',
    'complete_invitation_view',
]

