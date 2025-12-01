"""
General API views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.db import connection
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from tenants.models import Tenant, User
from api.utils import add_cors_headers
import logging

logger = logging.getLogger(__name__)


class DashboardView(APIView):
    """Dashboard view with basic statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get dashboard statistics"""
        try:
            # Handle OPTIONS request for CORS preflight
            if request.method == 'OPTIONS':
                response = Response()
                add_cors_headers(response, request)
                return response
            
            user = request.user

            # Base stats with all required fields
            stats = {
                'total_tenants': 0,
                'active_tenants': 0,
                'trial_tenants': 0,
                'total_users': 0,
                'total_pages': 0,
                'total_services': 0,
                'total_bookings': 0,
                'monthly_revenue': 0,
            }

            if user.is_super_admin():
                # Super admin sees all stats (exclude soft-deleted tenants)
                try:
                    stats.update({
                        'total_tenants': Tenant.objects.filter(deleted_at__isnull=True).count(),
                        'active_tenants': Tenant.objects.filter(status='active', deleted_at__isnull=True).count(),
                        'trial_tenants': Tenant.objects.filter(status='trial', deleted_at__isnull=True).count(),
                        'total_users': User.objects.count(),
                    })
                except Exception as e:
                    logger.error(f"Error fetching super admin stats: {e}", exc_info=True)

            elif hasattr(user, 'tenant') and user.tenant:
                # Tenant admin sees tenant-specific stats
                tenant = user.tenant

                # Count related objects for this tenant
                try:
                    # Switch to tenant context for counting
                    from django_tenants.utils import tenant_context
                    from pages.models import Page
                    from services.models import Service
                    from bookings.models import Booking
                    
                    with tenant_context(tenant):
                        stats.update({
                            'total_pages': Page.objects.count(),
                            'total_services': Service.objects.count(),
                            'total_bookings': Booking.objects.count(),
                        })
                except Exception as e:
                    logger.error(f"Error fetching tenant stats: {e}", exc_info=True)

            response = Response(stats)
            add_cors_headers(response, request)
            return response
        except Exception as e:
            logger.error(f"Error in DashboardView: {e}", exc_info=True)
            error_response = Response({
                'error': 'An error occurred while fetching dashboard statistics'
            }, status=500)
            add_cors_headers(error_response, request)
            return error_response


class DetailedStatsView(APIView):
    """Detailed statistics view for super admin"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get detailed statistics"""
        try:
            # Handle OPTIONS request for CORS preflight
            if request.method == 'OPTIONS':
                response = Response()
                add_cors_headers(response, request)
                return response
            
            user = request.user
            
            if not user.is_super_admin():
                error_response = Response({
                    'error': 'Only super admin can access detailed statistics'
                }, status=403)
                add_cors_headers(error_response, request)
                return error_response
            
            # Get detailed stats
            stats = {
                'tenants': {
                    'total': Tenant.objects.filter(deleted_at__isnull=True).count(),
                    'active': Tenant.objects.filter(status='active', deleted_at__isnull=True).count(),
                    'suspended': Tenant.objects.filter(status='suspended', deleted_at__isnull=True).count(),
                    'trial': Tenant.objects.filter(status='trial', deleted_at__isnull=True).count(),
                },
                'users': {
                    'total': User.objects.count(),
                    'active': User.objects.filter(status='active').count(),
                    'suspended': User.objects.filter(status='suspended').count(),
                    'inactive': User.objects.filter(status='inactive').count(),
                },
                'activity': {
                    'today': {
                        'new_tenants': Tenant.objects.filter(
                            created_at__date=timezone.now().date(),
                            deleted_at__isnull=True
                        ).count(),
                        'new_users': User.objects.filter(
                            created_at__date=timezone.now().date()
                        ).count(),
                    },
                    'this_week': {
                        'new_tenants': Tenant.objects.filter(
                            created_at__gte=timezone.now() - timedelta(days=7),
                            deleted_at__isnull=True
                        ).count(),
                        'new_users': User.objects.filter(
                            created_at__gte=timezone.now() - timedelta(days=7)
                        ).count(),
                    },
                },
            }
            
            # Try to get revenue stats if billing is available
            try:
                from billing.models import Subscription, Invoice
                from django.db.models import Sum
                
                active_subscriptions = Subscription.objects.filter(status='active')
                stats['revenue'] = {
                    'monthly': Invoice.objects.filter(
                        status='paid',
                        created_at__month=timezone.now().month,
                        created_at__year=timezone.now().year
                    ).aggregate(total=Sum('total'))['total'] or 0,
                    'total': Invoice.objects.filter(
                        status='paid'
                    ).aggregate(total=Sum('total'))['total'] or 0,
                    'active_subscriptions': active_subscriptions.count(),
                    'trial_subscriptions': Subscription.objects.filter(status='trial').count(),
                }
            except ImportError:
                stats['revenue'] = {
                    'monthly': 0,
                    'total': 0,
                    'active_subscriptions': 0,
                    'trial_subscriptions': 0,
                }
            
            response = Response(stats)
            add_cors_headers(response, request)
            return response
        except Exception as e:
            logger.error(f"Error in DetailedStatsView: {e}", exc_info=True)
            error_response = Response({
                'error': 'An error occurred while fetching detailed statistics'
            }, status=500)
            add_cors_headers(error_response, request)
            return error_response


@api_view(['POST', 'OPTIONS'])
@permission_classes([AllowAny])  # Allow tracking even without auth for analytics
def block_usage_tracking_view(request):
    """
    Endpoint to track block usage for analytics
    Accepts a list of block usage events
    """
    try:
        # Handle OPTIONS request for CORS preflight
        if request.method == 'OPTIONS':
            response = Response()
            add_cors_headers(response, request)
            return response
        
        usages = request.data.get('usages', [])
        
        if not isinstance(usages, list):
            error_response = Response({
                'error': 'usages must be a list'
            }, status=400)
            add_cors_headers(error_response, request)
            return error_response
        
        # For now, just log the usage (can be extended to store in DB later)
        logger.info(f"Block usage tracked: {len(usages)} events")
        
        # Optional: Store in database if needed
        # from analytics.models import BlockUsage
        # for usage in usages:
        #     BlockUsage.objects.create(**usage)
        
        response = Response({
            'success': True,
            'tracked': len(usages)
        })
        add_cors_headers(response, request)
        return response
    except Exception as e:
        logger.error(f"Error tracking block usage: {e}", exc_info=True)
        error_response = Response({
            'error': 'An error occurred while tracking block usage'
        }, status=500)
        add_cors_headers(error_response, request)
        return error_response
