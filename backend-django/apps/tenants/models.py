"""
Modèles génériques pour la gestion multi-tenant
"""
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from django.utils.translation import gettext_lazy as _
from django.contrib.auth import get_user_model
from django.conf import settings

User = get_user_model()


class Client(TenantMixin):
    """
    Modèle générique pour les clients/tenants
    """
    name = models.CharField(max_length=100, verbose_name=_("Nom"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    # Note: created_on est géré par TenantMixin qui utilise created_at
    is_active = models.BooleanField(default=True, verbose_name=_("Actif"))
    
    # Configuration
    auto_create_schema = True
    auto_drop_schema = False
    
    class Meta:
        verbose_name = _("Client")
        verbose_name_plural = _("Clients")
    
    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Modèle pour les domaines des tenants
    """
    pass


class PasswordResetToken(models.Model):
    """Token pour la réinitialisation de mot de passe"""
    token = models.CharField(max_length=255, unique=True, db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='password_reset_tokens'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'password_reset_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"PasswordResetToken for {self.user.email}"


class InvitationToken(models.Model):
    """Token pour l'invitation d'utilisateurs"""
    token = models.CharField(max_length=255, unique=True, db_index=True)
    tenant = models.ForeignKey(
        Client,
        on_delete=models.CASCADE,
        related_name='invitations'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='invitation_tokens'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'invitation_tokens'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"InvitationToken for {self.user.email}"


class Feature(models.Model):
    """Fonctionnalités disponibles pour les tenants"""
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True, blank=True, null=True)  # Temporairement nullable pour migration
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        """Auto-générer le slug à partir du nom si vide"""
        if not self.slug and self.name:
            from django.utils.text import slugify
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    class Meta:
        db_table = 'features'
        ordering = ['name']
    
    def __str__(self):
        return self.name


class UserFeature(models.Model):
    """Association entre utilisateurs et fonctionnalités"""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='user_features'
    )
    feature = models.ForeignKey(
        Feature,
        on_delete=models.CASCADE,
        related_name='user_features'
    )
    granted_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)  # Temporairement nullable pour migration
    
    class Meta:
        db_table = 'user_features'
        unique_together = ['user', 'feature']
    
    def __str__(self):
        return f"{self.user.email} - {self.feature.name}"

