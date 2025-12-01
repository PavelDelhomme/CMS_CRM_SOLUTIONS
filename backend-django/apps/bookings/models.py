"""
Booking models for VTC reservations
"""
from django.db import models
from apps.services.models import Service
from apps.tenants.models import Client


class Booking(models.Model):
    """
    Booking/Reservation model
    """
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('failed', 'Failed'),
        ('refunded', 'Refunded'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]

    tenant = models.ForeignKey(Client, on_delete=models.CASCADE)
    service = models.ForeignKey(Service, on_delete=models.SET_NULL, null=True, blank=True)
    
    # Customer Info
    customer_name = models.CharField(max_length=255)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=20)
    
    # Trip Info
    pickup_address = models.CharField(max_length=500)
    pickup_lat = models.CharField(max_length=50, blank=True, null=True)
    pickup_lng = models.CharField(max_length=50, blank=True, null=True)
    dropoff_address = models.CharField(max_length=500)
    dropoff_lat = models.CharField(max_length=50, blank=True, null=True)
    dropoff_lng = models.CharField(max_length=50, blank=True, null=True)
    
    # Date & Time
    pickup_datetime = models.DateTimeField()
    estimated_duration = models.IntegerField(null=True, blank=True)  # minutes
    estimated_distance = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # km
    
    # Pricing
    estimated_price = models.DecimalField(max_digits=10, decimal_places=2)
    final_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=3, default='EUR')
    
    # Payment
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    payment_method = models.CharField(max_length=50, blank=True, null=True)
    stripe_payment_id = models.CharField(max_length=255, blank=True, null=True)
    
    # Status
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    notes = models.TextField(blank=True, null=True)
    cancellation_reason = models.TextField(blank=True, null=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'bookings'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Booking #{self.id} - {self.customer_name}"

