"""
Unit tests for Tenant serializers
"""
import pytest
from django.utils import timezone
from apps.tenants.serializers import ClientSerializer, UserSerializer
from apps.tenants.models import Client, User


@pytest.mark.django_db
@pytest.mark.model
class TestTenantSerializer:
    """Tests for TenantSerializer"""

    def test_serialize_tenant(self):
        """Test serializing a tenant"""
        tenant = Client.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant',
            plan='starter',
            status='active'
        )
        serializer = TenantSerializer(tenant)
        data = serializer.data
        
        assert data['name'] == 'Test Tenant'
        assert data['email'] == 'test@tenant.com'
        assert data['slug'] == 'test-tenant'
        assert data['plan'] == 'starter'
        assert data['status'] == 'active'

    def test_deserialize_tenant(self):
        """Test deserializing tenant data"""
        data = {
            'name': 'New Tenant',
            'email': 'new@tenant.com',
            'plan': 'business',
            'status': 'trial'
        }
        serializer = TenantSerializer(data=data)
        assert serializer.is_valid() is True
        
        tenant = serializer.save()
        assert tenant.name == 'New Tenant'
        assert tenant.email == 'new@tenant.com'

    def test_update_tenant_merges_settings(self):
        """Test that updating tenant merges settings JSON"""
        tenant = Client.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant',
            settings={'key1': 'value1', 'key2': 'value2'}
        )
        
        serializer = TenantSerializer(
            tenant,
            data={'settings': {'key3': 'value3'}},
            partial=True
        )
        assert serializer.is_valid() is True
        
        updated_tenant = serializer.save()
        assert 'key1' in updated_tenant.settings
        assert 'key2' in updated_tenant.settings
        assert 'key3' in updated_tenant.settings


@pytest.mark.django_db
@pytest.mark.model
class TestUserSerializer:
    """Tests for UserSerializer"""

    @pytest.fixture
    def tenant(self):
        return Client.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )

    def test_serialize_user(self, tenant):
        """Test serializing a user"""
        user = User.objects.create_user(
            username='testuser',
            email='user@test.com',
            password='password123',
            tenant=tenant,
            role='operator'
        )
        serializer = UserSerializer(user)
        data = serializer.data
        
        assert data['email'] == 'user@test.com'
        assert data['role'] == 'operator'

