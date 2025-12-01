"""
Serializers module for tenants app - Main entry point

This module re-exports all serializers from the organized submodules:
- serializers/client.py: Client and Domain serializers
- serializers/user.py: User serializers
- serializers/feature.py: Feature serializers
"""
from .serializers import (
    ClientSerializer,
    DomainSerializer,
    TenantSerializer,  # Alias
    UserSerializer,
    UserRegisterSerializer,
    UserProfileSerializer,
    FeatureSerializer,
    UserFeatureSerializer,
)

__all__ = [
    'ClientSerializer',
    'DomainSerializer',
    'TenantSerializer',
    'UserSerializer',
    'UserRegisterSerializer',
    'UserProfileSerializer',
    'FeatureSerializer',
    'UserFeatureSerializer',
]

