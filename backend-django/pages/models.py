"""
Modèles génériques pour la gestion de pages CMS
"""
from django.db import models
from django.utils.translation import gettext_lazy as _
from django.urls import reverse


class Page(models.Model):
    """
    Modèle générique pour les pages du CMS
    """
    title = models.CharField(max_length=200, verbose_name=_("Titre"))
    slug = models.SlugField(unique=True, verbose_name=_("Slug"))
    content = models.TextField(blank=True, verbose_name=_("Contenu"))
    meta_description = models.CharField(max_length=255, blank=True, verbose_name=_("Meta description"))
    meta_keywords = models.CharField(max_length=255, blank=True, verbose_name=_("Meta keywords"))
    
    # Statut
    is_published = models.BooleanField(default=False, verbose_name=_("Publié"))
    is_homepage = models.BooleanField(default=False, verbose_name=_("Page d'accueil"))
    
    # Dates
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Créé le"))
    updated_at = models.DateTimeField(auto_now=True, verbose_name=_("Modifié le"))
    published_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Publié le"))
    
    # Ordre
    order = models.IntegerField(default=0, verbose_name=_("Ordre"))
    
    class Meta:
        verbose_name = _("Page")
        verbose_name_plural = _("Pages")
        ordering = ['order', 'title']
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        if self.is_homepage:
            return reverse('home')
        return reverse('page', kwargs={'slug': self.slug})

