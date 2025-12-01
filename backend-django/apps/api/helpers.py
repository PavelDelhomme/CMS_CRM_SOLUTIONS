"""
Helper functions for API views
"""
from django.utils import timezone
from datetime import timedelta
from apps.tenants.models import Client, User
import logging

logger = logging.getLogger(__name__)


def get_super_admin_stats():
    """Get statistics for super admin"""
    stats = {
        'total_tenants': 0,
        'active_tenants': 0,
        'trial_tenants': 0,
        'total_users': 0,
        'monthly_revenue': 0,
        'trials_expiring_soon': 0,
        'trials_expiring_soon_list': [],
    }
    
    try:
        now = timezone.now()
        trial_tenants = Client.objects.filter(status='trial', deleted_at__isnull=True)
        
        stats.update({
            'total_tenants': Client.objects.filter(deleted_at__isnull=True).count(),
            'active_tenants': Client.objects.filter(status='active', deleted_at__isnull=True).count(),
            'trial_tenants': trial_tenants.count(),
            'total_users': User.objects.count(),
        })
        
        # Count trials expiring soon
        stats.update(_get_expiring_trials_stats(now, trial_tenants))
        
        # Calculate monthly revenue
        stats['monthly_revenue'] = _calculate_monthly_revenue()
        
    except Exception as e:
        logger.error(f"Error fetching super admin stats: {e}", exc_info=True)
    
    return stats


def _get_expiring_trials_stats(now, trial_tenants):
    """Get statistics about expiring trials"""
    stats = {
        'trials_expiring_soon': 0,
        'trials_expiring_soon_list': [],
    }
    
    try:
        from apps.billing.models import Subscription
        expiring_trials = Subscription.objects.filter(
            status='trial',
            trial_end__lte=now + timedelta(days=7),
            trial_end__gt=now
        ).select_related('tenant', 'plan')
        stats['trials_expiring_soon'] = expiring_trials.count()
        
        # Add list of trials expiring soon with details
        trials_expiring_soon_list = []
        for sub in expiring_trials[:10]:  # Limit to 10
            days_remaining = (sub.trial_end - now).days
            trials_expiring_soon_list.append({
                'tenant_id': sub.tenant.id,
                'tenant_name': sub.tenant.name,
                'plan_name': sub.plan.name,
                'trial_end': sub.trial_end.isoformat(),
                'days_remaining': days_remaining,
            })
        stats['trials_expiring_soon_list'] = trials_expiring_soon_list
    except ImportError:
        # Count from tenant trial_ends_at if billing not available
        expiring_tenants = trial_tenants.filter(
            trial_ends_at__lte=now + timedelta(days=7),
            trial_ends_at__gt=now
        )
        stats['trials_expiring_soon'] = expiring_tenants.count()
        
        # Add list from tenants
        trials_expiring_soon_list = []
        for tenant in expiring_tenants[:10]:
            days_remaining = (tenant.trial_ends_at - now).days
            trials_expiring_soon_list.append({
                'tenant_id': tenant.id,
                'tenant_name': tenant.name,
                'plan_name': tenant.plan,
                'trial_end': tenant.trial_ends_at.isoformat(),
                'days_remaining': days_remaining,
            })
        stats['trials_expiring_soon_list'] = trials_expiring_soon_list
    except Exception as e:
        logger.warning(f"Error counting expiring trials: {e}")
        stats['trials_expiring_soon'] = 0
        stats['trials_expiring_soon_list'] = []
    
    return stats


def _calculate_monthly_revenue():
    """Calculate monthly revenue from invoices"""
    try:
        from apps.billing.models import Invoice
        from django.db.models import Sum
        monthly_revenue = Invoice.objects.filter(
            status='paid',
            created_at__month=timezone.now().month,
            created_at__year=timezone.now().year
        ).aggregate(total=Sum('total'))['total'] or 0
        return float(monthly_revenue)
    except ImportError:
        return 0
    except Exception as e:
        logger.warning(f"Error calculating monthly revenue: {e}")
        return 0


def get_tenant_stats(tenant):
    """Get statistics for a specific tenant"""
    stats = {
        'total_pages': 0,
        'total_services': 0,
        'total_bookings': 0,
    }
    
    try:
        from django_tenants.utils import tenant_context
        from apps.pages.models import Page
        from apps.services.models import Service
        from apps.bookings.models import Booking
        
        with tenant_context(tenant):
            stats.update({
                'total_pages': Page.objects.count(),
                'total_services': Service.objects.count(),
                'total_bookings': Booking.objects.count(),
            })
    except Exception as e:
        logger.error(f"Error fetching tenant stats: {e}", exc_info=True)
    
    return stats

