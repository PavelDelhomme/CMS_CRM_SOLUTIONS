"""
Stripe webhooks handler
"""
import stripe
import json
import logging
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST
from django.http import HttpResponse, JsonResponse
from django.utils import timezone
from .models import Subscription, Invoice, Payment
from tenants.models import Tenant

logger = logging.getLogger(__name__)
stripe.api_key = getattr(settings, 'STRIPE_SECRET_KEY', '')


@csrf_exempt
@require_POST
def stripe_webhook(request):
    """
    Handle Stripe webhook events
    """
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = getattr(settings, 'STRIPE_WEBHOOK_SECRET', '')
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        logger.error(f"Invalid payload: {e}")
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid signature: {e}")
        return HttpResponse(status=400)
    
    # Handle the event
    event_type = event['type']
    event_data = event['data']['object']
    
    try:
        if event_type == 'customer.subscription.created':
            handle_subscription_created(event_data)
        elif event_type == 'customer.subscription.updated':
            handle_subscription_updated(event_data)
        elif event_type == 'customer.subscription.deleted':
            handle_subscription_deleted(event_data)
        elif event_type == 'invoice.paid':
            handle_invoice_paid(event_data)
        elif event_type == 'invoice.payment_failed':
            handle_invoice_payment_failed(event_data)
        elif event_type == 'payment_intent.succeeded':
            handle_payment_intent_succeeded(event_data)
        elif event_type == 'payment_intent.payment_failed':
            handle_payment_intent_failed(event_data)
        else:
            logger.info(f"Unhandled event type: {event_type}")
        
        return JsonResponse({'status': 'success'})
    except Exception as e:
        logger.error(f"Error handling webhook {event_type}: {e}", exc_info=True)
        return JsonResponse({'error': str(e)}, status=500)


def handle_subscription_created(stripe_subscription):
    """Handle subscription.created event"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription['id']
        )
        subscription.status = map_stripe_status_to_model(stripe_subscription['status'])
        subscription.stripe_customer_id = stripe_subscription['customer']
        subscription.save()
        logger.info(f"Subscription {subscription.id} created via webhook")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for Stripe ID: {stripe_subscription['id']}")


def handle_subscription_updated(stripe_subscription):
    """Handle subscription.updated event"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription['id']
        )
        subscription.status = map_stripe_status_to_model(stripe_subscription['status'])
        
        # Update period dates
        if stripe_subscription.get('current_period_start'):
            subscription.current_period_start = timezone.datetime.fromtimestamp(
                stripe_subscription['current_period_start'],
                tz=timezone.utc
            )
        if stripe_subscription.get('current_period_end'):
            subscription.current_period_end = timezone.datetime.fromtimestamp(
                stripe_subscription['current_period_end'],
                tz=timezone.utc
            )
        
        subscription.save()
        
        # Update tenant status based on subscription
        tenant = subscription.tenant
        if subscription.status == 'active':
            tenant.status = 'active'
        elif subscription.status == 'past_due':
            tenant.status = 'suspended'
        tenant.save()
        
        logger.info(f"Subscription {subscription.id} updated via webhook")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for Stripe ID: {stripe_subscription['id']}")


def handle_subscription_deleted(stripe_subscription):
    """Handle subscription.deleted event"""
    try:
        subscription = Subscription.objects.get(
            stripe_subscription_id=stripe_subscription['id']
        )
        subscription.status = 'cancelled'
        subscription.cancelled_at = timezone.now()
        subscription.save()
        
        # Update tenant status
        tenant = subscription.tenant
        tenant.status = 'cancelled'
        tenant.save()
        
        logger.info(f"Subscription {subscription.id} cancelled via webhook")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for Stripe ID: {stripe_subscription['id']}")


def handle_invoice_paid(stripe_invoice):
    """Handle invoice.paid event"""
    try:
        subscription_id = stripe_invoice.get('subscription')
        if not subscription_id:
            return
        
        subscription = Subscription.objects.get(stripe_subscription_id=subscription_id)
        
        # Create or update invoice
        invoice, created = Invoice.objects.get_or_create(
            stripe_invoice_id=stripe_invoice['id'],
            defaults={
                'subscription': subscription,
                'tenant': subscription.tenant,
                'invoice_number': stripe_invoice.get('number', f"INV-{stripe_invoice['id'][:8]}"),
                'status': 'paid',
                'subtotal': Decimal(stripe_invoice['subtotal']) / 100,
                'tax': Decimal(stripe_invoice.get('tax', 0)) / 100,
                'total': Decimal(stripe_invoice['total']) / 100,
                'currency': stripe_invoice['currency'].upper(),
                'issue_date': timezone.datetime.fromtimestamp(
                    stripe_invoice['created'],
                    tz=timezone.utc
                ),
                'due_date': timezone.datetime.fromtimestamp(
                    stripe_invoice['due_date'] or stripe_invoice['created'],
                    tz=timezone.utc
                ),
                'paid_at': timezone.datetime.fromtimestamp(
                    stripe_invoice['status_transitions']['paid_at'] or stripe_invoice['created'],
                    tz=timezone.utc
                ),
            }
        )
        
        if not created:
            invoice.status = 'paid'
            invoice.paid_at = timezone.datetime.fromtimestamp(
                stripe_invoice['status_transitions'].get('paid_at', stripe_invoice['created']),
                tz=timezone.utc
            )
            invoice.save()
        
        # Create payment record
        if stripe_invoice.get('payment_intent'):
            Payment.objects.get_or_create(
                stripe_payment_intent_id=stripe_invoice['payment_intent'],
                defaults={
                    'invoice': invoice,
                    'tenant': subscription.tenant,
                    'amount': invoice.total,
                    'currency': invoice.currency,
                    'status': 'succeeded',
                    'method': 'card',
                    'paid_at': invoice.paid_at,
                }
            )
        
        logger.info(f"Invoice {invoice.id} paid via webhook")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for Stripe subscription: {subscription_id}")


def handle_invoice_payment_failed(stripe_invoice):
    """Handle invoice.payment_failed event"""
    try:
        subscription_id = stripe_invoice.get('subscription')
        if not subscription_id:
            return
        
        subscription = Subscription.objects.get(stripe_subscription_id=subscription_id)
        
        # Update invoice status
        try:
            invoice = Invoice.objects.get(stripe_invoice_id=stripe_invoice['id'])
            invoice.status = 'open'
            invoice.save()
        except Invoice.DoesNotExist:
            pass
        
        # Update subscription status
        subscription.status = 'past_due'
        subscription.save()
        
        # Update tenant status
        tenant = subscription.tenant
        tenant.status = 'suspended'
        tenant.save()
        
        logger.warning(f"Invoice payment failed for subscription {subscription.id}")
    except Subscription.DoesNotExist:
        logger.warning(f"Subscription not found for Stripe subscription: {subscription_id}")


def handle_payment_intent_succeeded(stripe_payment_intent):
    """Handle payment_intent.succeeded event"""
    try:
        payment = Payment.objects.get(
            stripe_payment_intent_id=stripe_payment_intent['id']
        )
        payment.status = 'succeeded'
        payment.paid_at = timezone.now()
        payment.save()
        
        # Update invoice if linked
        if payment.invoice:
            payment.invoice.status = 'paid'
            payment.invoice.paid_at = payment.paid_at
            payment.invoice.save()
        
        logger.info(f"Payment {payment.id} succeeded via webhook")
    except Payment.DoesNotExist:
        logger.warning(f"Payment not found for Stripe payment intent: {stripe_payment_intent['id']}")


def handle_payment_intent_failed(stripe_payment_intent):
    """Handle payment_intent.payment_failed event"""
    try:
        payment = Payment.objects.get(
            stripe_payment_intent_id=stripe_payment_intent['id']
        )
        payment.status = 'failed'
        payment.save()
        logger.warning(f"Payment {payment.id} failed via webhook")
    except Payment.DoesNotExist:
        logger.warning(f"Payment not found for Stripe payment intent: {stripe_payment_intent['id']}")


def map_stripe_status_to_model(stripe_status: str) -> str:
    """Map Stripe subscription status to our model status"""
    mapping = {
        'active': 'active',
        'trialing': 'trial',
        'past_due': 'past_due',
        'canceled': 'cancelled',
        'unpaid': 'past_due',
        'incomplete': 'trial',
        'incomplete_expired': 'cancelled',
    }
    return mapping.get(stripe_status, 'trial')

