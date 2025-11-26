"""
Unit tests for Tenant API views
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django_tenants.utils import schema_context
from tenants.models import Tenant, User


@pytest.mark.django_db
@pytest.mark.api
class TestTenantViewSet:
    """Tests for Tenant ViewSet"""

    @pytest.fixture
    def api_client(self):
        """Create API client"""
        return APIClient()

    @pytest.fixture
    def super_admin(self):
        """Create super admin user"""
        return User.objects.create_user(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            role='super-admin',
            tenant=None
        )

    @pytest.fixture
    def authenticated_client(self, api_client, super_admin):
        """Create authenticated API client"""
        api_client.force_authenticate(user=super_admin)
        return api_client

    def test_list_tenants_requires_authentication(self, api_client):
        """Test that listing tenants requires authentication"""
        url = reverse('tenant-list')
        response = api_client.get(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_list_tenants_as_super_admin(self, authenticated_client):
        """Test listing tenants as super admin"""
        from django.utils.text import slugify
        from tenants.models import Domain
        
        tenant1 = Tenant.objects.create(
            name='Test Tenant 1',
            email='test1@example.com',
            slug='test-tenant-1',
            status='active'
        )
        Domain.objects.create(tenant=tenant1, domain='test-tenant-1.localhost', is_primary=True)
        
        tenant2 = Tenant.objects.create(
            name='Test Tenant 2',
            email='test2@example.com',
            slug='test-tenant-2',
            status='active'
        )
        Domain.objects.create(tenant=tenant2, domain='test-tenant-2.localhost', is_primary=True)

        url = reverse('tenant-list')
        response = authenticated_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data['results']) >= 2

    def test_create_tenant_as_super_admin(self, authenticated_client):
        """Test creating a tenant as super admin"""
        url = reverse('tenant-list')
        data = {
            'name': 'New Tenant',
            'email': 'new@example.com',
            'plan': 'starter',
            'status': 'active'
        }
        response = authenticated_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data['name'] == 'New Tenant'
        assert Tenant.objects.filter(name='New Tenant').exists()

    def test_update_tenant(self, authenticated_client):
        """Test updating a tenant"""
        from tenants.models import Domain
        
        tenant = Tenant.objects.create(
            name='Original Name',
            email='original@example.com',
            slug='original-name'
        )
        Domain.objects.create(tenant=tenant, domain='original-name.localhost', is_primary=True)
        
        url = reverse('tenant-detail', kwargs={'pk': tenant.pk})
        data = {'name': 'Updated Name'}
        response = authenticated_client.patch(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        tenant.refresh_from_db()
        assert tenant.name == 'Updated Name'

    def test_delete_tenant_soft_delete(self, authenticated_client):
        """Test soft deleting a tenant"""
        from tenants.models import Domain
        
        tenant = Tenant.objects.create(
            name='To Delete',
            email='delete@example.com',
            slug='to-delete'
        )
        Domain.objects.create(tenant=tenant, domain='to-delete.localhost', is_primary=True)
        
        url = reverse('tenant-detail', kwargs={'pk': tenant.pk})
        response = authenticated_client.delete(url)
        assert response.status_code == status.HTTP_204_NO_CONTENT
        tenant.refresh_from_db()
        assert tenant.deleted_at is not None

    def test_suspend_tenant(self, authenticated_client):
        """Test suspending a tenant"""
        tenant = Tenant.objects.create(
            name='Test Tenant',
            email='test@example.com',
            status='active'
        )
        url = reverse('tenant-suspend', kwargs={'pk': tenant.pk})
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        tenant.refresh_from_db()
        assert tenant.status == 'suspended'

    def test_activate_tenant(self, authenticated_client):
        """Test activating a tenant"""
        tenant = Tenant.objects.create(
            name='Test Tenant',
            email='test@example.com',
            status='suspended'
        )
        url = reverse('tenant-activate', kwargs={'pk': tenant.pk})
        response = authenticated_client.post(url)
        assert response.status_code == status.HTTP_200_OK
        tenant.refresh_from_db()
        assert tenant.status == 'active'


@pytest.mark.django_db
@pytest.mark.api
class TestLoginView:
    """Tests for login endpoint"""

    @pytest.fixture
    def api_client(self):
        """Create API client"""
        return APIClient()

    @pytest.fixture
    def test_user(self):
        """Create test user"""
        from django_tenants.utils import tenant_context
        from tenants.models import Domain
        
        tenant = Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )
        Domain.objects.create(tenant=tenant, domain='test-tenant.localhost', is_primary=True)
        
        # Create user in tenant context
        with tenant_context(tenant):
            return User.objects.create_user(
                username='testuser',
                email='test@example.com',
                password='password123',
                tenant=tenant,
                status='active'  # Ensure user is active
            )

    def test_login_success(self, api_client, test_user):
        """Test successful login"""
        url = reverse('login')
        data = {
            'email': 'test@example.com',
            'password': 'password123'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert 'access' in response.data
        assert 'refresh' in response.data
        assert 'user' in response.data

    def test_login_invalid_credentials(self, api_client):
        """Test login with invalid credentials"""
        url = reverse('login')
        data = {
            'email': 'wrong@example.com',
            'password': 'wrongpassword'
        }
        response = api_client.post(url, data, format='json')
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

