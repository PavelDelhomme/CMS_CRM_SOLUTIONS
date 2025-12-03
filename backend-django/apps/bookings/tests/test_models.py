"""
Unit tests for Booking model
"""
import pytest
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta
from django_tenants.utils import tenant_context
from apps.bookings.models import Booking
from apps.tenants.models import Client, Domain
from apps.services.models import Service


@pytest.mark.django_db
@pytest.mark.model
class TestBooking:
    """Tests for Booking model"""

    @pytest.fixture
    def tenant(self):
        """Create a test tenant"""
        tenant = Client.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )
        # Create domain for tenant
        Domain.objects.create(tenant=tenant, domain='test-tenant.localhost', is_primary=True)
        return tenant

    @pytest.fixture
    def service(self, tenant):
        """Create a test service"""
        with tenant_context(tenant):
            return Service.objects.create(
                tenant=tenant,
                name='Berline',
                slug='berline'
            )

    def test_create_booking(self, tenant, service):
        """Test creating a booking"""
        pickup_time = timezone.now() + timedelta(hours=2)
        with tenant_context(tenant):
            booking = Booking.objects.create(
                tenant=tenant,
                service=service,
                customer_name='John Doe',
                customer_email='john@example.com',
                customer_phone='+33612345678',
                pickup_address='123 Main St, Paris',
                dropoff_address='456 Oak Ave, Paris',
                pickup_datetime=pickup_time,
                estimated_duration=30,
                estimated_distance=Decimal('15.5'),
                estimated_price=Decimal('45.00'),
                currency='EUR',
                payment_status='pending',
                status='pending'
            )
            assert booking.customer_name == 'John Doe'
            assert booking.tenant == tenant
            assert booking.service == service
            assert booking.status == 'pending'
            assert booking.payment_status == 'pending'

    def test_booking_str(self, tenant, service):
        """Test string representation"""
        pickup_time = timezone.now() + timedelta(hours=1)
        with tenant_context(tenant):
            booking = Booking.objects.create(
                tenant=tenant,
                service=service,
                customer_name='Jane Doe',
                customer_email='jane@example.com',
                customer_phone='+33612345679',
                pickup_address='123 Main St',
                dropoff_address='456 Oak Ave',
                pickup_datetime=pickup_time,
                estimated_price=Decimal('50.00'),
                currency='EUR'
            )
            assert 'Jane Doe' in str(booking)

