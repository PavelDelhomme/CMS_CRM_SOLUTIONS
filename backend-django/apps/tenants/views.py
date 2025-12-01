"""
Views module for tenants app - Main entry point

This module re-exports all views from the organized submodules:
- views/helpers.py: Utility functions
- views/viewsets.py: ViewSets (TenantViewSet, UserViewSet, etc.)
- views/auth.py: Authentication endpoints
- views/tokens.py: Token management endpoints
"""
from .views import (
    # Helpers
    add_cors_headers,
    UserProfileView,
    # ViewSets
    TenantViewSet,
    UserViewSet,
    FeatureViewSet,
    UserFeatureViewSet,
    # Auth
    login_view,
    register_view,
    register_with_plan_view,
    logout_view,
    # Tokens
    request_password_reset_view,
    reset_password_view,
    verify_reset_token_view,
    verify_invitation_token_view,
    complete_invitation_view,
)

__all__ = [
    'add_cors_headers',
    'UserProfileView',
    'TenantViewSet',
    'UserViewSet',
    'FeatureViewSet',
    'UserFeatureViewSet',
    'login_view',
    'register_view',
    'register_with_plan_view',
    'logout_view',
    'request_password_reset_view',
    'reset_password_view',
    'verify_reset_token_view',
    'verify_invitation_token_view',
    'complete_invitation_view',
]

