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

        # Base stats
        stats = {
            'total_tenants': 0,
            'total_users': 0,
            'total_pages': 0,
            'total_services': 0,
            'total_bookings': 0,
        }

        if user.is_super_admin():
            # Super admin sees all stats
            stats.update({
                'total_tenants': Tenant.objects.count(),
                'total_users': User.objects.count(),
            })
        elif hasattr(user, 'tenant') and user.tenant:
            # Tenant admin sees tenant-specific stats
            tenant = user.tenant

            # Count related objects for this tenant
            try:
                # Switch to tenant context for counting
                from django_tenants.utils import tenant_context
                with tenant_context(tenant):
                    stats.update({
                        'total_users': User.objects.filter(tenant=tenant).count(),
                    })
            except:
                pass

        return Response(stats)
