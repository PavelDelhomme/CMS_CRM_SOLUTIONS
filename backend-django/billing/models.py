"""
Billing models for VTCBuilder
"""
from django.db import models
from django.core.validators import MinValueValidator
from decimal import Decimal
from tenants.models import Tenant


class PricingPlan(models.Model):
    """
    Pricing plan model (Starter, Business, Enterprise)
    """
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    
    # Pricing
    price_monthly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    price_yearly = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        null=True,
        blank=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    currency = models.CharField(max_length=3, default='EUR')
    
    # Features
    max_sites = models.IntegerField(default=1)
    max_users = models.IntegerField(default=1)
    max_storage_gb = models.IntegerField(default=1)
    features = models.JSONField(default=list, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    
    # Display order
    order = models.IntegerField(default=0, help_text="Ordre d'affichage sur le site public")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pricing_plans'
        ordering = ['order', 'price_monthly']
    
    def __str__(self):
        return self.name


class Subscription(models.Model):
    """
    Subscription model for tenant billing
    """
    STATUS_CHOICES = [
        ('trial', 'Trial'),
        ('active', 'Active'),
        ('past_due', 'Past Due'),
        ('cancelled', 'Cancelled'),
        ('expired', 'Expired'),
    ]
    
    BILLING_CYCLE_CHOICES = [
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]
    
    tenant = models.OneToOneField(Tenant, on_delete=models.CASCADE, related_name='subscription')
    plan = models.ForeignKey(PricingPlan, on_delete=models.PROTECT, related_name='subscriptions')
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    billing_cycle = models.CharField(max_length=20, choices=BILLING_CYCLE_CHOICES, default='monthly')
    
    # Dates
    trial_start = models.DateTimeField(null=True, blank=True)
    trial_end = models.DateTimeField(null=True, blank=True)
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancelled_at = models.DateTimeField(null=True, blank=True)
    
    # Stripe
    stripe_subscription_id = models.CharField(max_length=255, blank=True, null=True)
    stripe_customer_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'subscriptions'
    
    def __str__(self):
        return f"{self.tenant.name} - {self.plan.name}"
    
    def is_active(self):
        return self.status == 'active'
    
    def is_trial(self):
        return self.status == 'trial'


class Invoice(models.Model):
    """
    Invoice model
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('open', 'Open'),
        ('paid', 'Paid'),
        ('void', 'Void'),
        ('uncollectible', 'Uncollectible'),
    ]
    
    subscription = models.ForeignKey(Subscription, on_delete=models.CASCADE, related_name='invoices')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invoices')
    
    # Invoice details
    invoice_number = models.CharField(max_length=50, unique=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    
    # Dates
    issue_date = models.DateTimeField()
    due_date = models.DateTimeField()
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Stripe
    stripe_invoice_id = models.CharField(max_length=255, blank=True, null=True)
    
    # PDF
    pdf_url = models.URLField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number} - {self.tenant.name}"


class Payment(models.Model):
    """
    Payment model
    """
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('succeeded', 'Succeeded'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]
    
    METHOD_CHOICES = [
        ('card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('other', 'Other'),
    ]
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='payments')
    
    # Payment details
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='EUR')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES, default='card')
    
    # Stripe
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Timestamps
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Payment {self.id} - {self.amount} {self.currency}"


class PaymentMethod(models.Model):
    """
    Payment Method model for managing available payment methods
    """
    METHOD_TYPE_CHOICES = [
        ('card', 'Carte bancaire'),
        ('bank_transfer', 'Virement bancaire'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('check', 'Chèque'),
        ('cash', 'Espèces'),
        ('other', 'Autre'),
    ]
    
    # Basic info
    name = models.CharField(max_length=100, unique=True)
    method_type = models.CharField(max_length=20, choices=METHOD_TYPE_CHOICES)
    description = models.TextField(blank=True, null=True)
    
    # Configuration
    is_active = models.BooleanField(default=True)
    is_enabled = models.BooleanField(default=True, help_text="Disponible pour les tenants")
    requires_validation = models.BooleanField(default=False, help_text="Nécessite validation manuelle")
    
    # Settings (JSON field for flexible configuration)
    settings = models.JSONField(default=dict, blank=True, help_text="Configuration spécifique (clés API, etc.)")
    
    # Display
    icon = models.CharField(max_length=50, blank=True, null=True, help_text="Icône ou emoji")
    order = models.IntegerField(default=0, help_text="Ordre d'affichage")
    
    # Fees
    fee_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0, help_text="Commission en %")
    fee_fixed = models.DecimalField(max_digits=10, decimal_places=2, default=0, help_text="Commission fixe")
    
    # Limits
    min_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Montant minimum")
    max_amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Montant maximum")
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payment_methods'
        ordering = ['order', 'name']
        verbose_name = 'Mode de paiement'
        verbose_name_plural = 'Modes de paiement'
    
    def __str__(self):
        return self.name
    
    def is_available(self):
        """Check if payment method is available"""
        return self.is_active and self.is_enabled

