"""
Modèles génériques pour la gestion multi-tenant
"""
from django.db import models
from django_tenants.models import TenantMixin, DomainMixin
from django.utils.translation import gettext_lazy as _


class Client(TenantMixin):
    """
    Modèle générique pour les clients/tenants
    """
    name = models.CharField(max_length=100, verbose_name=_("Nom"))
    description = models.TextField(blank=True, verbose_name=_("Description"))
    created_on = models.DateField(auto_now_add=True, verbose_name=_("Créé le"))
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

