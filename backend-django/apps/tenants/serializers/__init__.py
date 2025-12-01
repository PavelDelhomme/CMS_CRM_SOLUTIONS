"""
Serializers module for tenants app - organized by resource type
"""
from .client import ClientSerializer, DomainSerializer
from .user import UserSerializer, UserRegisterSerializer, UserProfileSerializer
from .feature import FeatureSerializer, UserFeatureSerializer

# Alias pour compatibilité
TenantSerializer = ClientSerializer

__all__ = [
    # Client/Domain
    'ClientSerializer',
    'DomainSerializer',
    'TenantSerializer',  # Alias
    # User
    'UserSerializer',
    'UserRegisterSerializer',
    'UserProfileSerializer',
    # Feature
    'FeatureSerializer',
    'UserFeatureSerializer',
]

