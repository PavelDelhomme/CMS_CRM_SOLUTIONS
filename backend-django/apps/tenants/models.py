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
    slug = models.SlugField(max_length=100, unique=True, blank=True, null=True, verbose_name=_("Slug"))
    email = models.EmailField(max_length=255, blank=True, null=True, verbose_name=_("Email"))
    plan = models.CharField(max_length=50, blank=True, null=True, default='free', verbose_name=_("Plan"))
    status = models.CharField(max_length=50, blank=True, null=True, default='active', verbose_name=_("Statut"))
    primary_color = models.CharField(max_length=7, blank=True, null=True, default='#3B82F6', verbose_name=_("Couleur primaire"))
    secondary_color = models.CharField(max_length=7, blank=True, null=True, default='#6B7280', verbose_name=_("Couleur secondaire"))
    settings = models.JSONField(default=dict, blank=True, verbose_name=_("Paramètres"))
    metadata = models.JSONField(default=dict, blank=True, verbose_name=_("Métadonnées"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    # created_at est requis par la base de données (NOT NULL)
    # TenantMixin peut ne pas le définir automatiquement, donc on l'ajoute explicitement
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Date de création"))
    is_active = models.BooleanField(default=True, verbose_name=_("Actif"))
    
    # Configuration
    auto_create_schema = True
    auto_drop_schema = False
    
    class Meta:
        verbose_name = _("Client")
        verbose_name_plural = _("Clients")
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        """Auto-generate slug from name if not provided"""
        from django.utils.text import slugify
        from django.utils import timezone
        
        if not self.slug and self.name:
            self.slug = slugify(self.name)
            # Ensure uniqueness
            base_slug = self.slug
            counter = 1
            while Client.objects.filter(slug=self.slug).exclude(pk=self.pk).exists():
                self.slug = f"{base_slug}-{counter}"
                counter += 1
        # Set default values for required fields if not provided
        if not self.plan:
            self.plan = 'free'
        if not self.status:
            self.status = 'active'
        if not self.primary_color:
            self.primary_color = '#3B82F6'  # Blue
        if not self.secondary_color:
            self.secondary_color = '#6B7280'  # Gray
        if not self.settings:
            self.settings = {}  # Empty dict as default
        if not self.metadata:
            self.metadata = {}  # Empty dict as default
        
        # Set created_at if not set and this is a new object (pk is None)
        # created_at is required (NOT NULL) in the database, so we ensure it's set
        if self.pk is None and getattr(self, 'created_at', None) is None:
            self.created_at = timezone.now()
        
        super().save(*args, **kwargs)


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

