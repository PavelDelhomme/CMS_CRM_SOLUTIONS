"""
Utility functions for tenant management - organized by functionality
"""
from .features import enable_features_for_tenant, sync_tenant_features
from django.contrib.auth import get_user_model

User = get_user_model()


def is_super_admin(user):
    """
    Check if user is super admin
    Uses is_superuser flag from Django User model
    """
    if not user or not user.is_authenticated:
        return False
    return user.is_superuser


__all__ = [
    'enable_features_for_tenant',
    'sync_tenant_features',
    'is_super_admin',
]

