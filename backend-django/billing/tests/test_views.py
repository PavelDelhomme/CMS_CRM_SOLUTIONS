"""
Unit tests for Billing API views
"""
import pytest
from rest_framework.test import APIClient
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from billing.models import PricingPlan, Subscription, Invoice
from tenants.models import Tenant, User


@pytest.mark.django_db
@pytest.mark.api
class TestPricingPlanViewSet:
    """Tests for PricingPlan ViewSet"""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def super_admin(self):
        return User.objects.create_user(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            role='super-admin',
            tenant=None
        )

    @pytest.fixture
    def authenticated_client(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        return api_client

    def test_list_pricing_plans(self, authenticated_client):
        """Test listing pricing plans"""
        PricingPlan.objects.create(
            name='Starter',
            slug='starter',
            price_monthly=Decimal('19.99'),
            order=1
        )
        PricingPlan.objects.create(
            name='Business',
            slug='business',
            price_monthly=Decimal('49.99'),
            order=2
        )

        url = reverse('pricingplan-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        # Handle paginated or list response
        data = response.data.get('results', response.data) if isinstance(response.data, dict) else response.data
        assert len(data) >= 2

    def test_create_pricing_plan_as_super_admin(self, authenticated_client):
        """Test creating a pricing plan as super admin"""
        url = reverse('pricingplan-list')
        data = {
            'name': 'Enterprise',
            'slug': 'enterprise',
            'price_monthly': '99.99',
            'order': 3
        }
        response = authenticated_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'Enterprise'
        assert PricingPlan.objects.filter(name='Enterprise').exists()

    def test_update_pricing_plan(self, authenticated_client):
        """Test updating a pricing plan"""
        plan = PricingPlan.objects.create(
            name='Original Plan',
            slug='original',
            price_monthly=Decimal('29.99')
        )
        url = reverse('pricingplan-detail', kwargs={'pk': plan.pk})
        data = {'price_monthly': '39.99'}
        response = authenticated_client.patch(url, data, format='json')
        
        assert response.status_code == status.HTTP_200_OK
        plan.refresh_from_db()
        assert plan.price_monthly == Decimal('39.99')


@pytest.mark.django_db
@pytest.mark.api
class TestSubscriptionViewSet:
    """Tests for Subscription ViewSet"""

    @pytest.fixture
    def api_client(self):
        return APIClient()

    @pytest.fixture
    def super_admin(self):
        return User.objects.create_user(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            role='super-admin',
            tenant=None
        )

    @pytest.fixture
    def tenant(self):
        return Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )

    @pytest.fixture
    def plan(self):
        return PricingPlan.objects.create(
            name='Starter',
            slug='starter',
            price_monthly=Decimal('19.99')
        )

    @pytest.fixture
    def authenticated_client(self, api_client, super_admin):
        api_client.force_authenticate(user=super_admin)
        return api_client

    def test_list_subscriptions(self, authenticated_client, tenant, plan):
        """Test listing subscriptions"""
        now = timezone.now()
        Subscription.objects.create(
            tenant=tenant,
            plan=plan,
            current_period_start=now,
            current_period_end=now + timedelta(days=30)
        )

        url = reverse('subscription-list')
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1

    def test_get_subscription_details(self, authenticated_client, tenant, plan):
        """Test getting subscription details"""
        now = timezone.now()
        subscription = Subscription.objects.create(
            tenant=tenant,
            plan=plan,
            current_period_start=now,
            current_period_end=now + timedelta(days=30)
        )

        url = reverse('subscription-details', kwargs={'pk': subscription.pk})
        response = authenticated_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK

