"""
Serializers for billing models
"""
from rest_framework import serializers
from .models import PricingPlan, Subscription, Invoice, Payment
from tenants.serializers import TenantSerializer


class PricingPlanSerializer(serializers.ModelSerializer):
    """Serializer for PricingPlan"""
    
    class Meta:
        model = PricingPlan
        fields = [
            'id', 'name', 'slug', 'description',
            'price_monthly', 'price_yearly', 'currency',
            'max_sites', 'max_users', 'max_storage_gb', 'features',
            'is_active', 'is_featured',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionSerializer(serializers.ModelSerializer):
    """Serializer for Subscription"""
    plan = PricingPlanSerializer(read_only=True)
    plan_id = serializers.PrimaryKeyRelatedField(
        queryset=PricingPlan.objects.all(),
        source='plan',
        write_only=True,
        required=False
    )
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = Subscription
        fields = [
            'id', 'tenant', 'plan', 'plan_id',
            'status', 'billing_cycle',
            'trial_start', 'trial_end',
            'current_period_start', 'current_period_end',
            'cancelled_at',
            'stripe_subscription_id', 'stripe_customer_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class InvoiceSerializer(serializers.ModelSerializer):
    """Serializer for Invoice"""
    subscription = SubscriptionSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'subscription', 'tenant',
            'invoice_number', 'status',
            'subtotal', 'tax', 'total', 'currency',
            'issue_date', 'due_date', 'paid_at',
            'stripe_invoice_id', 'pdf_url',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class PaymentSerializer(serializers.ModelSerializer):
    """Serializer for Payment"""
    invoice = InvoiceSerializer(read_only=True)
    tenant = TenantSerializer(read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'invoice', 'tenant',
            'amount', 'currency', 'status', 'method',
            'stripe_payment_intent_id',
            'paid_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

