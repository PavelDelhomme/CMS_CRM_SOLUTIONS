"""
Tenant models for VTCBuilder multi-tenant system
"""
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from django.contrib.auth.models import AbstractUser
from guardian.mixins import GuardianUserMixin


class Tenant(TenantMixin):
    """
    Tenant model representing a VTC driver/company
    """
    PLAN_CHOICES = [
        ('starter', 'Starter'),
        ('business', 'Business'),
        ('enterprise', 'Enterprise'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('suspended', 'Suspended'),
        ('trial', 'Trial'),
        ('cancelled', 'Cancelled'),
    ]
    
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    email = models.EmailField(unique=True)
    
    # Plan & Billing
    plan = models.CharField(max_length=20, choices=PLAN_CHOICES, default='starter')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='trial')
    trial_ends_at = models.DateTimeField(null=True, blank=True)
    subscribed_at = models.DateTimeField(null=True, blank=True)
    
    # Branding
    logo = models.ImageField(upload_to='logos/', null=True, blank=True)
    primary_color = models.CharField(max_length=7, default='#3B82F6')
    secondary_color = models.CharField(max_length=7, default='#10B981')
    
    # Settings
    settings = models.JSONField(default=dict, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Required for django-tenants
    auto_create_schema = True
    
    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name

    def is_active(self):
        return self.status == 'active'

    def is_trial(self):
        return self.status == 'trial'


class User(GuardianUserMixin, AbstractUser):
    """
    Custom User model for VTCBuilder with tenant support and roles
    """
    ROLE_CHOICES = [
        ('super-admin', 'Super Admin'),
        ('tenant-admin', 'Tenant Admin'),
        ('driver', 'Driver'),
        ('operator', 'Operator'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('suspended', 'Suspended'),
        ('pending', 'Pending'),
    ]

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, null=True, blank=True)

    # Profile
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    # Role & Status
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='operator')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')

    # Verification
    email_verified_at = models.DateTimeField(null=True, blank=True)

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'

    def __str__(self):
        return f"{self.get_full_name()} ({self.get_role_display()})"

    def is_super_admin(self):
        return self.role == 'super-admin'

    def is_tenant_admin(self):
        return self.role == 'tenant-admin'

    def is_driver(self):
        return self.role == 'driver'

    def is_operator(self):
        return self.role == 'operator'

    def is_active_user(self):
        return self.status == 'active'


class Domain(DomainMixin):
    """
    Domain model for tenant routing
    """
    class Meta:
        db_table = 'domains'
    
    def __str__(self):
        return self.domain

