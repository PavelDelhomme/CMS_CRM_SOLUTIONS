"""
Modèles pour la gestion des plugins et templates
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class InstalledPlugin(models.Model):
    """
    Plugin installé dans le système
    """
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Nom"))
    version = models.CharField(max_length=20, verbose_name=_("Version"))
    enabled = models.BooleanField(default=False, verbose_name=_("Activé"))
    installed_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Installé le"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Mis à jour le"))
    settings = models.JSONField(default=dict, blank=True, verbose_name=_("Paramètres"))
    metadata = models.JSONField(default=dict, blank=True, verbose_name=_("Métadonnées"))
    
    class Meta:
        verbose_name = _("Plugin installé")
        verbose_name_plural = _("Plugins installés")
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} v{self.version}"


class Template(models.Model):
    """
    Template disponible dans la marketplace ou installé
    """
    TEMPLATE_TYPES = [
        ('page', _('Page')),
        ('site', _('Site complet')),
        ('block', _('Bloc')),
        ('email', _('Email')),
    ]
    
    STATUS_CHOICES = [
        ('draft', _('Brouillon')),
        ('published', _('Pubublié')),
        ('archived', _('Archivé')),
    ]
    
    name = models.CharField(max_length=200, verbose_name=_("Nom"))
    slug = models.SlugField(unique=True, verbose_name=_("Slug"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    template_type = models.CharField(max_length=20, choices=TEMPLATE_TYPES, verbose_name=_("Type"))
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft', verbose_name=_("Statut"))
    
    # Marketplace
    is_marketplace = models.BooleanField(default=False, verbose_name=_("Disponible sur marketplace"))
    price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name=_("Prix"))
    is_free = models.BooleanField(default=True, verbose_name=_("Gratuit"))
    author = models.CharField(max_length=100, blank=True, verbose_name=_("Auteur"))
    author_url = models.URLField(blank=True, verbose_name=_("URL auteur"))
    
    # Fichiers
    preview_image = models.ImageField(upload_to='templates/previews/', blank=True, verbose_name=_("Image de prévisualisation"))
    template_file = models.FileField(upload_to='templates/files/', blank=True, verbose_name=_("Fichier template"))
    template_data = models.JSONField(default=dict, blank=True, verbose_name=_("Données template"))
    
    # Métadonnées
    version = models.CharField(max_length=20, default='1.0.0', verbose_name=_("Version"))
    tags = models.CharField(max_length=500, blank=True, help_text=_("Tags séparés par des virgules"))
    downloads = models.IntegerField(default=0, verbose_name=_("Téléchargements"))
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name=_("Note"))
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Créé le"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Mis à jour le"))
    
    class Meta:
        verbose_name = _("Template")
        verbose_name_plural = _("Templates")
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name


class InstalledTemplate(models.Model):
    """
    Template installé pour un tenant
    """
    tenant = models.ForeignKey(
        'tenants.Client',
        on_delete=models.CASCADE,
        related_name='installed_templates',
        verbose_name=_("Tenant")
    )
    template = models.ForeignKey(
        Template,
        on_delete=models.CASCADE,
        related_name='installations',
        verbose_name=_("Template")
    )
    installed_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Installé le"))
    is_active = models.BooleanField(default=True, verbose_name=_("Actif"))
    customizations = models.JSONField(default=dict, blank=True, verbose_name=_("Personnalisations"))
    
    class Meta:
        verbose_name = _("Template installé")
        verbose_name_plural = _("Templates installés")
        unique_together = ['tenant', 'template']
        ordering = ['-installed_at']
    
    def __str__(self):
        return f"{self.template.name} - {self.tenant.name}"

