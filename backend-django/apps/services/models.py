"""
Service models for VTC services
"""
from django.db import models
from django.utils.text import slugify
from apps.tenants.models import Client


class Service(models.Model):
    """
    VTC Service model (e.g., Berline, Van, Luxury)
    """
    tenant = models.ForeignKey(Client, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255)
    description = models.TextField(blank=True, null=True)
    icon = models.CharField(max_length=100, blank=True, null=True)
    image = models.ImageField(upload_to='services/', blank=True, null=True)
    
    # Pricing
    base_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_per_km = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    price_per_minute = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    min_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Characteristics
    max_passengers = models.IntegerField(default=4)
    max_luggage = models.IntegerField(default=2)
    features = models.JSONField(default=list, blank=True)
    
    # Status
    is_active = models.BooleanField(default=True)
    order = models.IntegerField(default=0)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'services'
        ordering = ['order', 'name']
        unique_together = ['slug']
    
    def __str__(self):
        return self.name
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

