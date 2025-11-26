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
from decimal import Decimal
from .models import PricingPlan, Subscription, Invoice, Payment, PaymentMethod
from .serializers import (
    PricingPlanSerializer, SubscriptionSerializer,
    InvoiceSerializer, PaymentSerializer, PaymentMethodSerializer
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
        
        return queryset.order_by('order', 'price_monthly')

    def create(self, request, *args, **kwargs):
        """Only super admin can create pricing plans"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can create pricing plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Only super admin can update pricing plans"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can update pricing plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only super admin can delete pricing plans"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can delete pricing plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def move_up(self, request, pk=None):
        """Move plan up in order"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can reorder plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plan = self.get_object()
        previous_plan = PricingPlan.objects.filter(order__lt=plan.order).order_by('-order').first()
        
        if previous_plan:
            temp_order = plan.order
            plan.order = previous_plan.order
            previous_plan.order = temp_order
            plan.save(update_fields=['order'])
            previous_plan.save(update_fields=['order'])
        
        return Response({
            'status': 'Plan moved up',
            'plan': PricingPlanSerializer(plan).data
        })

    @action(detail=True, methods=['post'])
    def move_down(self, request, pk=None):
        """Move plan down in order"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can reorder plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plan = self.get_object()
        next_plan = PricingPlan.objects.filter(order__gt=plan.order).order_by('order').first()
        
        if next_plan:
            temp_order = plan.order
            plan.order = next_plan.order
            next_plan.order = temp_order
            plan.save(update_fields=['order'])
            next_plan.save(update_fields=['order'])
        
        return Response({
            'status': 'Plan moved down',
            'plan': PricingPlanSerializer(plan).data
        })


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

    def create(self, request, *args, **kwargs):
        """Create a new subscription with automatic date handling"""
        # Only super admin can create subscriptions
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can create subscriptions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        tenant_id = serializer.validated_data.get('tenant')
        if isinstance(tenant_id, dict):
            tenant_id = tenant_id.get('id')
        elif hasattr(tenant_id, 'id'):
            tenant_id = tenant_id.id
        
        # Get tenant object
        try:
            tenant = Tenant.objects.get(id=tenant_id)
        except Tenant.DoesNotExist:
            return Response(
                {'error': 'Tenant not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if tenant already has a subscription
        if Subscription.objects.filter(tenant=tenant).exists():
            return Response(
                {'error': 'This tenant already has a subscription. Please update or cancel the existing one.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get plan
        plan = serializer.validated_data.get('plan')
        if not plan:
            return Response(
                {'error': 'Plan is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Calculate dates
        now = timezone.now()
        billing_cycle = serializer.validated_data.get('billing_cycle', 'monthly')
        status_value = serializer.validated_data.get('status', 'trial')
        
        # Set trial dates if status is trial
        trial_start = None
        trial_end = None
        current_period_start = now
        current_period_end = now
        
        if status_value == 'trial':
            trial_start = now
            trial_end = now + timedelta(days=14)
            current_period_start = trial_start
            current_period_end = trial_end
        else:
            # Set billing period based on cycle
            if billing_cycle == 'monthly':
                current_period_end = now + timedelta(days=30)
            else:  # yearly
                current_period_end = now + timedelta(days=365)
        
        # Create subscription with calculated dates
        subscription = Subscription.objects.create(
            tenant=tenant,
            plan=plan,
            status=status_value,
            billing_cycle=billing_cycle,
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=current_period_start,
            current_period_end=current_period_end,
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            SubscriptionSerializer(subscription).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )

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

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a subscription (trial -> active)"""
        subscription = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can activate subscriptions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if subscription.status == 'active':
            return Response(
                {'error': 'Subscription is already active'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        old_status = subscription.status
        subscription.status = 'active'
        subscription.cancelled_at = None
        
        # Update period dates if coming from trial
        if old_status == 'trial' and subscription.trial_end:
            subscription.current_period_start = timezone.now()
            if subscription.billing_cycle == 'monthly':
                subscription.current_period_end = timezone.now() + timedelta(days=30)
            else:
                subscription.current_period_end = timezone.now() + timedelta(days=365)
            subscription.save(update_fields=['status', 'cancelled_at', 'current_period_start', 'current_period_end'])
        else:
            subscription.save(update_fields=['status', 'cancelled_at'])
        
        return Response({
            'status': 'Subscription activated',
            'subscription': SubscriptionSerializer(subscription).data
        })

    @action(detail=True, methods=['post'])
    def suspend(self, request, pk=None):
        """Suspend a subscription (active -> past_due)"""
        subscription = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can suspend subscriptions'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if subscription.status != 'active':
            return Response(
                {'error': 'Only active subscriptions can be suspended'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription.status = 'past_due'
        subscription.save(update_fields=['status'])
        
        return Response({
            'status': 'Subscription suspended',
            'subscription': SubscriptionSerializer(subscription).data
        })

    @action(detail=True, methods=['post'])
    def update_plan(self, request, pk=None):
        """Update subscription plan"""
        subscription = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can update subscription plans'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        plan_id = request.data.get('plan_id')
        if not plan_id:
            return Response(
                {'error': 'plan_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            new_plan = PricingPlan.objects.get(id=plan_id)
        except PricingPlan.DoesNotExist:
            return Response(
                {'error': 'Plan not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        subscription.plan = new_plan
        subscription.save(update_fields=['plan'])
        
        return Response({
            'status': 'Subscription plan updated',
            'subscription': SubscriptionSerializer(subscription).data
        })

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """Update subscription status (admin only)"""
        subscription = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can update subscription status'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if not new_status or new_status not in ['trial', 'active', 'past_due', 'cancelled', 'expired']:
            return Response(
                {'error': 'Invalid status'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        subscription.status = new_status
        if new_status == 'cancelled':
            subscription.cancelled_at = timezone.now()
        elif new_status == 'active':
            subscription.cancelled_at = None
        
        subscription.save(update_fields=['status', 'cancelled_at'])
        
        return Response({
            'status': 'Subscription status updated',
            'subscription': SubscriptionSerializer(subscription).data
        })

    @action(detail=True, methods=['get'])
    def details(self, request, pk=None):
        """Get detailed subscription information including invoices and payments"""
        subscription = self.get_object()
        
        # Check permissions
        user = request.user
        if not user.is_super_admin():
            if not user.is_tenant_admin() or user.tenant != subscription.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission d\'accéder à ces détails'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Get related invoices
        invoices = subscription.invoices.all().order_by('-created_at')
        invoice_serializer = InvoiceSerializer(invoices, many=True)
        
        # Get related payments
        payments = Payment.objects.filter(invoice__subscription=subscription).order_by('-created_at')
        payment_serializer = PaymentSerializer(payments, many=True)
        
        # Calculate summary
        from django.db.models import Sum
        total_invoiced = invoices.aggregate(Sum('total'))['total__sum'] or 0
        total_paid = invoices.filter(status='paid').aggregate(Sum('total'))['total__sum'] or 0
        unpaid_amount = invoices.filter(status__in=['open', 'draft']).aggregate(Sum('total'))['total__sum'] or 0
        
        return Response({
            'subscription': SubscriptionSerializer(subscription).data,
            'invoices': invoice_serializer.data,
            'payments': payment_serializer.data,
            'summary': {
                'total_invoiced': float(total_invoiced),
                'total_paid': float(total_paid),
                'unpaid_amount': float(unpaid_amount),
                'invoices_count': invoices.count(),
                'paid_invoices_count': invoices.filter(status='paid').count(),
                'unpaid_invoices_count': invoices.filter(status__in=['open', 'draft']).count(),
            }
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

    @action(detail=True, methods=['post'])
    def send_reminder(self, request, pk=None):
        """Send payment reminder email for unpaid invoice"""
        invoice = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can send payment reminders'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        if invoice.status == 'paid':
            return Response(
                {'error': 'Invoice is already paid'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            from django.core.mail import send_mail
            from django.conf import settings
            
            # Send reminder email
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
            invoice_url = f"{frontend_url}/dashboard/billing/invoices/{invoice.id}"
            
            send_mail(
                subject=f'Rappel de paiement - Facture {invoice.invoice_number}',
                message=f'''
Bonjour,

Nous vous rappelons que votre facture {invoice.invoice_number} d'un montant de {invoice.total}€ est en attente de paiement.

Date d'échéance : {invoice.due_date.strftime('%d/%m/%Y')}

Vous pouvez accéder à votre facture et effectuer le paiement en cliquant sur le lien suivant :
{invoice_url}

Pour toute question, n'hésitez pas à nous contacter.

Cordialement,
L'équipe VTCBuilder
                ''',
                html_message=f'''
                <html>
                <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2>Rappel de paiement</h2>
                    <p>Bonjour,</p>
                    <p>Nous vous rappelons que votre <strong>facture {invoice.invoice_number}</strong> d'un montant de <strong>{invoice.total}€</strong> est en attente de paiement.</p>
                    <p><strong>Date d'échéance :</strong> {invoice.due_date.strftime('%d/%m/%Y')}</p>
                    <p>
                        <a href="{invoice_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Accéder à ma facture
                        </a>
                    </p>
                    <p>Pour toute question, n'hésitez pas à nous contacter.</p>
                    <hr>
                    <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                </body>
                </html>
                ''',
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                recipient_list=[invoice.tenant.email],
                fail_silently=False,
            )
            
            return Response({
                'status': 'Reminder email sent successfully',
                'message': f'Email de rappel envoyé à {invoice.tenant.email}'
            })
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Error sending reminder email: {str(e)}")
            return Response(
                {'error': f'Erreur lors de l\'envoi de l\'email: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Generate and download invoice PDF as HTML (printable)"""
        from django.http import HttpResponse
        from django.template.loader import render_to_string
        
        invoice = self.get_object()
        
        # Check permissions
        user = request.user
        if not user.is_super_admin():
            if not user.is_tenant_admin() or user.tenant != invoice.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission d\'accéder à cette facture'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Generate HTML invoice (can be printed as PDF by browser)
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Facture {invoice.invoice_number}</title>
    <style>
        @media print {{
            @page {{
                size: A4;
                margin: 2cm;
            }}
            .no-print {{
                display: none;
            }}
        }}
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }}
        .header {{
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 2px solid #333;
        }}
        .invoice-title {{
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 10px;
        }}
        .invoice-number {{
            font-size: 18px;
            font-weight: bold;
        }}
        .status-badge {{
            display: inline-block;
            padding: 5px 15px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 10px;
        }}
        .info-section {{
            margin-bottom: 40px;
        }}
        .info-row {{
            display: flex;
            margin-bottom: 10px;
        }}
        .info-label {{
            font-weight: bold;
            width: 200px;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
        }}
        th, td {{
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }}
        th {{
            background-color: #f3f4f6;
            font-weight: bold;
        }}
        .total-row {{
            font-weight: bold;
            font-size: 18px;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            font-size: 12px;
            color: #666;
        }}
    </style>
</head>
<body>
    <div class="header">
        <div>
            <div class="invoice-title">FACTURE</div>
            <div>VTCBuilder</div>
        </div>
        <div>
            <div class="invoice-number">N° {invoice.invoice_number}</div>
            <div class="status-badge" style="background-color: {'#10b981' if invoice.status == 'paid' else '#f59e0b'}; color: white;">
                {dict(Invoice.STATUS_CHOICES).get(invoice.status, invoice.status)}
            </div>
        </div>
    </div>
    
    <div class="info-section">
        <h3>Informations Client</h3>
        <div class="info-row">
            <div class="info-label">Nom:</div>
            <div>{invoice.tenant.name}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Email:</div>
            <div>{invoice.tenant.email}</div>
        </div>
    </div>
    
    <div class="info-section">
        <h3>Détails de la facture</h3>
        <div class="info-row">
            <div class="info-label">Date d'émission:</div>
            <div>{invoice.issue_date.strftime('%d/%m/%Y')}</div>
        </div>
        <div class="info-row">
            <div class="info-label">Date d'échéance:</div>
            <div>{invoice.due_date.strftime('%d/%m/%Y')}</div>
        </div>
        {f"<div class='info-row'><div class='info-label'>Date de paiement:</div><div>{invoice.paid_at.strftime('%d/%m/%Y')}</div></div>" if invoice.paid_at else ""}
    </div>
    
    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th style="text-align: right;">Sous-total</th>
                <th style="text-align: right;">TVA</th>
                <th style="text-align: right;">Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{invoice.subscription.plan.name if invoice.subscription else 'Abonnement'}</td>
                <td style="text-align: right;">{invoice.subtotal} {invoice.currency}</td>
                <td style="text-align: right;">{invoice.tax} {invoice.currency}</td>
                <td style="text-align: right;">{invoice.total} {invoice.currency}</td>
            </tr>
        </tbody>
        <tfoot>
            <tr>
                <td colspan="3" style="text-align: right; font-weight: bold;">TOTAL TTC:</td>
                <td style="text-align: right; font-weight: bold; font-size: 18px;">{invoice.total} {invoice.currency}</td>
            </tr>
        </tfoot>
    </table>
    
    <div class="footer">
        <p>Merci de votre confiance !</p>
        <p>Pour toute question concernant cette facture, contactez-nous à support@vtcbuilder.com</p>
    </div>
</body>
</html>
        """
        
        response = HttpResponse(html_content, content_type='text/html')
        response['Content-Disposition'] = f'inline; filename="facture-{invoice.invoice_number}.html"'
        return response

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate a new invoice for a subscription"""
        from django.utils.crypto import get_random_string
        
        subscription_id = request.data.get('subscription_id')
        
        if not subscription_id:
            return Response(
                {'error': 'subscription_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            subscription = Subscription.objects.get(id=subscription_id)
        except Subscription.DoesNotExist:
            return Response(
                {'error': 'Subscription not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check permissions
        user = request.user
        if not user.is_super_admin():
            if not user.is_tenant_admin() or user.tenant != subscription.tenant:
                return Response(
                    {'error': 'Vous n\'avez pas la permission de générer une facture pour cet abonnement'},
                    status=status.HTTP_403_FORBIDDEN
                )
        
        # Generate invoice number
        invoice_number = f"INV-{subscription.tenant.slug.upper()}-{timezone.now().strftime('%Y%m%d')}-{get_random_string(length=6, allowed_chars='0123456789').upper()}"
        
        # Calculate amounts
        if subscription.billing_cycle == 'monthly':
            subtotal = subscription.plan.price_monthly
        else:
            subtotal = subscription.plan.price_yearly if subscription.plan.price_yearly else subscription.plan.price_monthly * 12
        
        tax = subtotal * Decimal('0.20')  # 20% TVA
        total = subtotal + tax
        
        # Calculate dates
        now = timezone.now()
        due_date = now + timedelta(days=30)  # 30 days payment term
        
        # Create invoice
        invoice = Invoice.objects.create(
            subscription=subscription,
            tenant=subscription.tenant,
            invoice_number=invoice_number,
            status='open',
            subtotal=subtotal,
            tax=tax,
            total=total,
            currency='EUR',
            issue_date=now,
            due_date=due_date,
        )
        
        return Response({
            'message': 'Facture générée avec succès',
            'invoice': InvoiceSerializer(invoice).data
        }, status=status.HTTP_201_CREATED)


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


class PaymentMethodViewSet(viewsets.ModelViewSet):
    """ViewSet for managing payment methods"""
    queryset = PaymentMethod.objects.all()
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter payment methods based on user role"""
        user = self.request.user
        
        # Super admin can see all payment methods
        if user.is_super_admin():
            return PaymentMethod.objects.all()
        
        # Tenant users see only enabled payment methods
        return PaymentMethod.objects.filter(is_active=True, is_enabled=True)
    
    def list(self, request, *args, **kwargs):
        """Override list to always return empty list instead of 404"""
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def create(self, request, *args, **kwargs):
        """Only super admin can create payment methods"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can create payment methods'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)

    def update(self, request, *args, **kwargs):
        """Only super admin can update payment methods"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can update payment methods'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        """Only super admin can delete payment methods"""
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can delete payment methods'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().destroy(request, *args, **kwargs)

    @action(detail=True, methods=['post'])
    def toggle_enabled(self, request, pk=None):
        """Toggle payment method enabled status"""
        payment_method = self.get_object()
        
        if not request.user.is_super_admin():
            return Response(
                {'error': 'Only super admin can toggle payment methods'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        payment_method.is_enabled = not payment_method.is_enabled
        payment_method.save(update_fields=['is_enabled'])
        
        return Response({
            'status': 'Payment method updated',
            'payment_method': PaymentMethodSerializer(payment_method).data
        })


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
    
    # Past due subscriptions
    past_due_subscriptions = Subscription.objects.filter(status='past_due').count()
    
    # Total unpaid amount
    unpaid_amount = Invoice.objects.filter(
        status__in=['open', 'draft']
    ).aggregate(total=Sum('total'))['total'] or 0
    
    return Response({
        'total_revenue': float(total_revenue),
        'monthly_revenue': float(monthly_revenue),
        'active_subscriptions': active_subscriptions,
        'pending_payments': pending_payments,
        'unpaid_invoices': unpaid_invoices,
        'past_due_subscriptions': past_due_subscriptions,
        'unpaid_amount': float(unpaid_amount),
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def unpaid_items(request):
    """Get all unpaid items (subscriptions and invoices) - super admin only"""
    if not request.user.is_super_admin():
        return Response(
            {'error': 'Only super admin can view unpaid items'},
            status=status.HTTP_403_FORBIDDEN
        )
    
    # Past due subscriptions
    past_due_subscriptions = Subscription.objects.filter(status='past_due').select_related('tenant', 'plan')
    
    # Unpaid invoices (open or draft)
    unpaid_invoices = Invoice.objects.filter(
        status__in=['open', 'draft']
    ).select_related('tenant', 'subscription', 'subscription__plan').order_by('-due_date')
    
    # Overdue invoices (past due_date)
    now = timezone.now()
    overdue_invoices = Invoice.objects.filter(
        status__in=['open', 'draft'],
        due_date__lt=now
    ).select_related('tenant', 'subscription', 'subscription__plan').order_by('-due_date')
    
    from .serializers import SubscriptionSerializer, InvoiceSerializer
    
    return Response({
        'past_due_subscriptions': [
            SubscriptionSerializer(sub).data for sub in past_due_subscriptions
        ],
        'unpaid_invoices': [
            InvoiceSerializer(inv).data for inv in unpaid_invoices
        ],
        'overdue_invoices': [
            InvoiceSerializer(inv).data for inv in overdue_invoices
        ],
        'stats': {
            'past_due_count': past_due_subscriptions.count(),
            'unpaid_invoices_count': unpaid_invoices.count(),
            'overdue_invoices_count': overdue_invoices.count(),
            'total_unpaid_amount': float(
                unpaid_invoices.aggregate(Sum('total'))['total__sum'] or 0
            ),
            'total_overdue_amount': float(
                overdue_invoices.aggregate(Sum('total'))['total__sum'] or 0
            ),
        }
    })

