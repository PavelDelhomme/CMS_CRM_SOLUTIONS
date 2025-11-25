"""
General API views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from tenants.models import Tenant, User


class DashboardView(APIView):
    """Dashboard view with basic statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get dashboard statistics"""
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
            # Super admin sees all stats
            stats.update({
                'total_tenants': Tenant.objects.count(),
                'active_tenants': Tenant.objects.filter(status='active').count(),
                'trial_tenants': Tenant.objects.filter(status='trial').count(),
                'total_users': User.objects.count(),
            })
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
                        'total_users': User.objects.filter(tenant=tenant).count(),
                        'total_pages': Page.objects.count(),
                        'total_services': Service.objects.count(),
                        'total_bookings': Booking.objects.count(),
                    })
            except Exception as e:
                # If tenant context fails, just return base stats
                pass

        return Response({'stats': stats})
