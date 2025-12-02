"""
Page models for CMS functionality
"""
from django.db import models
from django.utils.text import slugify
from apps.tenants.models import Client


class Page(models.Model):
    """
    Page model for tenant CMS
    """
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('published', 'Published'),
        ('scheduled', 'Scheduled'),
    ]

    tenant = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='pages')
    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    content = models.TextField(blank=True, null=True)
    blocks = models.JSONField(default=list, blank=True)
    
    # SEO
    meta_title = models.CharField(max_length=255, blank=True, null=True)
    meta_description = models.TextField(blank=True, null=True)
    featured_image = models.CharField(max_length=500, blank=True, null=True)
    
    # Publishing
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    published_at = models.DateTimeField(blank=True, null=True)
    
    # Order & Homepage
    order = models.IntegerField(default=0)
    is_homepage = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'pages'
        ordering = ['order', '-created_at']
        unique_together = [['tenant', 'slug']]  # Slug unique par tenant
    
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
