"""
Quota management utilities for tenants
"""
from django.core.exceptions import ValidationError
from billing.models import Subscription


def get_tenant_quota(tenant):
    """
    Get quota limits for a tenant based on their subscription plan
    
    Returns a dict with:
    - max_users: maximum number of users allowed
    - max_sites: maximum number of sites allowed
    - max_storage_gb: maximum storage in GB
    """
    try:
        subscription = Subscription.objects.filter(tenant=tenant).first()
        
        if subscription and subscription.plan:
            return {
                'max_users': subscription.plan.max_users,
                'max_sites': subscription.plan.max_sites,
                'max_storage_gb': subscription.plan.max_storage_gb,
            }
    except Exception:
        pass
    
    # Default quotas if no subscription (trial mode)
    return {
        'max_users': 1,  # Only admin user
        'max_sites': 1,
        'max_storage_gb': 1,
    }


def check_user_quota(tenant):
    """
    Check if tenant can add more users
    
    Returns:
    - (can_add: bool, current_count: int, max_users: int, error_message: str)
    """
    quota = get_tenant_quota(tenant)
    max_users = quota['max_users']
    
    # Count active users for this tenant (excluding super-admin)
    from .models import User
    current_count = User.objects.filter(
        tenant=tenant,
        role__in=['tenant-admin', 'driver', 'operator']
    ).count()
    
    if current_count >= max_users:
        return (
            False,
            current_count,
            max_users,
            f'Quota d\'utilisateurs atteint ({current_count}/{max_users}). Veuillez passer à un plan supérieur pour ajouter plus d\'utilisateurs.'
        )
    
    return True, current_count, max_users, None


def check_storage_quota(tenant, size_bytes):
    """
    Check if tenant can add more storage
    
    Returns:
    - (can_add: bool, current_usage_gb: float, max_storage_gb: int, error_message: str)
    """
    quota = get_tenant_quota(tenant)
    max_storage_gb = quota['max_storage_gb']
    
    # TODO: Implement actual storage calculation from media files
    # For now, return True with placeholder values
    current_usage_gb = 0.0
    
    size_gb = size_bytes / (1024 ** 3)
    if current_usage_gb + size_gb > max_storage_gb:
        return (
            False,
            current_usage_gb,
            max_storage_gb,
            f'Quota de stockage atteint ({current_usage_gb:.2f}/{max_storage_gb} Go). Veuillez passer à un plan supérieur pour ajouter plus de contenu.'
        )
    
    return True, current_usage_gb, max_storage_gb, None

