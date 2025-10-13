"""
Serializers for booking models
"""
from rest_framework import serializers
from .models import Booking


class BookingSerializer(serializers.ModelSerializer):
    """Serializer for Booking model"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'tenant', 'tenant_name', 'service', 'service_name',
            'customer_name', 'customer_email', 'customer_phone',
            'pickup_address', 'pickup_lat', 'pickup_lng',
            'dropoff_address', 'dropoff_lat', 'dropoff_lng',
            'pickup_datetime', 'estimated_duration', 'estimated_distance',
            'estimated_price', 'final_price', 'currency',
            'payment_status', 'payment_method', 'stripe_payment_id',
            'status', 'notes', 'cancellation_reason',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BookingCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating bookings"""

    class Meta:
        model = Booking
        fields = [
            'service', 'customer_name', 'customer_email', 'customer_phone',
            'pickup_address', 'pickup_lat', 'pickup_lng',
            'dropoff_address', 'dropoff_lat', 'dropoff_lng',
            'pickup_datetime', 'estimated_price', 'currency', 'notes'
        ]


class BookingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating booking status"""

    class Meta:
        model = Booking
        fields = [
            'status', 'estimated_duration', 'estimated_distance',
            'final_price', 'payment_status', 'notes', 'cancellation_reason'
        ]


class BookingListSerializer(serializers.ModelSerializer):
    """Simplified serializer for booking listings"""
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    service_name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model = Booking
        fields = [
            'id', 'tenant', 'tenant_name', 'service', 'service_name',
            'customer_name', 'customer_email', 'pickup_datetime',
            'estimated_price', 'status', 'created_at'
        ]


class BookingStatusSerializer(serializers.ModelSerializer):
    """Serializer for booking status updates"""

    class Meta:
        model = Booking
        fields = ['id', 'status', 'estimated_duration', 'final_price']
        read_only_fields = ['id']
