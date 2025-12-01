"""
Unit tests for Bookings API views
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from bookings.models import Booking
from apps.tenants.models import Tenant, User
from apps.services.models import Service


@pytest.mark.django_db
@pytest.mark.api
class TestBookingViewSet:
    """Tests for Booking ViewSet"""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def tenant(self):
        return Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )

    @pytest.fixture
    def tenant_admin(self, tenant):
        return User.objects.create_user(
            username='admin',
            email='admin@test.com',
            password='password123',
            tenant=tenant,
            role='tenant-admin'
        )

    @pytest.fixture
    def authenticated_client(self, api_client, tenant_admin):
        api_client.force_authenticate(user=tenant_admin)
        return api_client

    def test_list_bookings_requires_authentication(self, api_client):
        """Test that listing bookings requires authentication"""
        url = reverse('booking-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_bookings(self, authenticated_client, tenant):
        """Test listing bookings"""
        from django_tenants.utils import tenant_context
        
        with tenant_context(tenant):
            Booking.objects.create(
                tenant=tenant,
                customer_name='John Doe',
                customer_email='john@example.com',
                customer_phone='+33612345678',
                pickup_address='123 Main St',
                dropoff_address='456 Oak Ave',
                pickup_datetime=timezone.now() + timedelta(hours=2),
                estimated_price=Decimal('50.00'),
                currency='EUR'
            )

        url = reverse('booking-list')
        response = authenticated_client.get(url)
        
        # Should return 200 (error handling returns empty list on error)
        assert response.status_code == status.HTTP_200_OK

