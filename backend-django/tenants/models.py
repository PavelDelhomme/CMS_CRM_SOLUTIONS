"""
Tenant models for VTCBuilder multi-tenant system
"""
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils import timezone
from datetime import timedelta
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
        ('deleted', 'Deleted'),  # Soft deleted status
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
    deleted_at = models.DateTimeField(null=True, blank=True, help_text="Date de suppression (soft delete)")
    
    # Required for django-tenants
    auto_create_schema = True
    auto_drop_schema = True  # Automatically drop schema when tenant is deleted
    
    def is_deleted(self):
        """Check if tenant is soft deleted"""
        return self.deleted_at is not None
    
    def soft_delete(self):
        """Soft delete the tenant"""
        from django.utils import timezone
        self.deleted_at = timezone.now()
        self.status = 'cancelled'
        self.save(update_fields=['deleted_at', 'status'])
    
    def restore(self):
        """Restore a soft deleted tenant"""
        self.deleted_at = None
        self.status = 'trial'  # Restore as trial by default
        self.save(update_fields=['deleted_at', 'status'])
    
    class Meta:
        db_table = 'tenants'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Override save to generate a valid schema_name from slug"""
        # Generate a valid schema_name from slug (no hyphens, lowercase, max 63 chars)
        if not self.schema_name and self.slug:
            # Remove hyphens and convert to lowercase
            schema_name = self.slug.replace('-', '_').lower()[:63]
            # Ensure it doesn't start with a number
            if schema_name and schema_name[0].isdigit():
                schema_name = 't_' + schema_name
            self.schema_name = schema_name
        elif not self.schema_name:
            # Fallback: use name if slug is not set
            import re
            schema_name = re.sub(r'[^a-z0-9_]', '', self.name.lower())[:63]
            if not schema_name or schema_name[0].isdigit():
                schema_name = 'tenant_' + schema_name
            self.schema_name = schema_name[:63]
        
        # Ensure schema_name is valid (no hyphens, only lowercase alphanumeric and underscore)
        if self.schema_name:
            import re
            self.schema_name = re.sub(r'[^a-z0-9_]', '', self.schema_name.lower())[:63]
            if not self.schema_name or self.schema_name[0].isdigit():
                self.schema_name = 't_' + self.schema_name[:61]
        
        super().save(*args, **kwargs)
    
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
        ordering = ['-created_at']  # Fix pagination warning

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


class PasswordResetToken(models.Model):
    """
    Password reset token model with expiration
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_tokens')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Password reset for {self.user.email}"
    
    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        self.save(update_fields=['used'])


class InvitationToken(models.Model):
    """
    Invitation token for new tenant admins to set up their account
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='invitation_tokens')
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='invitations')
    token = models.CharField(max_length=255, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'invitation_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invitation for {self.user.email} - {self.tenant.name}"
    
    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def mark_as_used(self):
        """Mark token as used"""
        self.used = True
        self.save(update_fields=['used'])


class Domain(DomainMixin):
    """
    Domain model for tenant routing
    """
    class Meta:
        db_table = 'domains'
    
    def __str__(self):
        return self.domain
