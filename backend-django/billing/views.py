"""
Views for billing models
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta
from .models import PricingPlan, Subscription, Invoice, Payment
from .serializers import (
    PricingPlanSerializer, SubscriptionSerializer,
    InvoiceSerializer, PaymentSerializer
)
from tenants.models import Tenant


class PricingPlanViewSet(viewsets.ModelViewSet):
    """ViewSet for managing pricing plans"""
    queryset = PricingPlan.objects.all()
    serializer_class = PricingPlanSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter plans based on user role"""
        user = self.request.user
        queryset = PricingPlan.objects.filter(is_active=True)
        
        # Super admin can see all plans (including inactive)
        if user.is_super_admin():
            queryset = PricingPlan.objects.all()
        
        return queryset.order_by('price_monthly')


class SubscriptionViewSet(viewsets.ModelViewSet):
    """ViewSet for managing subscriptions"""
    queryset = Subscription.objects.all()
    serializer_class = SubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter subscriptions based on user role"""
        user = self.request.user
        
        if user.is_super_admin():
            return Subscription.objects.all()
        elif user.is_tenant_admin() and user.tenant:
            return Subscription.objects.filter(tenant=user.tenant)
        
        return Subscription.objects.none()

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel a subscription"""
        subscription = self.get_object()
        
        # Check permissions
        if not request.user.is_super_admin():
            if not request.user.is_tenant_admin() or request.user.tenant != subscription.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission d\'annuler cet abonnement'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        subscription.status = 'cancelled'
        subscription.cancelled_at = timezone.now()
        subscription.save(update_fields=['status', 'cancelled_at'])
        
        return Response({
            'status': 'Subscription cancelled',
            'subscription': SubscriptionSerializer(subscription).data
        })

    @action(detail=True, methods=['post'])
    def reactivate(self, request, pk=None):
        """Reactivate a cancelled subscription"""
        subscription = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can reactivate subscriptions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        subscription.status = 'active'
        subscription.cancelled_at = None
        subscription.save(update_fields=['status', 'cancelled_at'])
        
        return Response({
            'status': 'Subscription reactivated',
            'subscription': SubscriptionSerializer(subscription).data
        })


class InvoiceViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing invoices (read-only, created automatically)"""
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter invoices based on user role"""
        user = self.request.user
        
        if user.is_super_admin():
            return Invoice.objects.all()
        elif user.is_tenant_admin() and user.tenant:
            return Invoice.objects.filter(tenant=user.tenant)
        
        return Invoice.objects.none()

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark an invoice as paid (admin only)"""
        invoice = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can mark invoices as paid'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        invoice.status = 'paid'
        invoice.paid_at = timezone.now()
        invoice.save(update_fields=['status', 'paid_at'])
        
        return Response({
            'status': 'Invoice marked as paid',
            'invoice': InvoiceSerializer(invoice).data
        })


class PaymentViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing payments"""
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter payments based on user role"""
        user = self.request.user
        
        if user.is_super_admin():
            return Payment.objects.all()
        elif user.is_tenant_admin() and user.tenant:
            return Payment.objects.filter(tenant=user.tenant)
        
        return Payment.objects.none()


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def billing_stats(request):
    """Get billing statistics (super admin only)"""
    if not request.user.is_super_admin():
        return Response(
            {'error': 'Only super admin can view billing stats'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Total revenue
    total_revenue = Payment.objects.filter(
        status='succeeded'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Monthly revenue
    this_month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    monthly_revenue = Payment.objects.filter(
        status='succeeded',
        paid_at__gte=this_month_start
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Active subscriptions
    active_subscriptions = Subscription.objects.filter(status='active').count()
    
    # Pending payments
    pending_payments = Payment.objects.filter(status='pending').count()
    
    # Unpaid invoices
    unpaid_invoices = Invoice.objects.filter(
        status__in=['open', 'draft']
    ).count()
    
    return Response({
        'total_revenue': float(total_revenue),
        'monthly_revenue': float(monthly_revenue),
        'active_subscriptions': active_subscriptions,
        'pending_payments': pending_payments,
        'unpaid_invoices': unpaid_invoices,
    })

