"""
Unit tests for user status management (suspend, activate, deactivate)
and middleware blocking access
"""
import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from tenants.models import Tenant, User
from tenants.middleware import UserStatusMiddleware
from django.http import HttpRequest, JsonResponse
from unittest.mock import Mock, patch


@pytest.mark.django_db
@pytest.mark.api
class TestUserStatusActions:
    """Tests for user status actions (suspend, activate, deactivate)"""

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
            status='active',
            tenant=None
        )

    @pytest.fixture
    def tenant(self):
        """Create a test tenant"""
        from tenants.models import Domain
        from django.utils.text import slugify
        
        tenant = Tenant.objects.create(
            name='Test Tenant',
            schema_name='test_tenant',
            email='test@tenant.com'
        )
        Domain.objects.create(
            domain='test-tenant.localhost',
            tenant=tenant,
            is_primary=True
        )
        return tenant

    @pytest.fixture
    def tenant_user(self, tenant):
        """Create a tenant user"""
        return User.objects.create_user(
            username='tenantuser',
            email='user@tenant.com',
            password='password123',
            role='tenant-admin',
            status='active',
            tenant=tenant
        )

    @pytest.fixture
    def authenticated_client(self, api_client, super_admin):
        """Create authenticated API client"""
        api_client.force_authenticate(user=super_admin)
        return api_client

    def test_activate_user(self, authenticated_client, tenant_user):
        """Test activating a user"""
        # Set user to inactive
        tenant_user.status = 'inactive'
        tenant_user.save()

        url = reverse('user-activate', kwargs={'pk': tenant_user.id})
        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'User activated'
        
        tenant_user.refresh_from_db()
        assert tenant_user.status == 'active'

    def test_deactivate_user(self, authenticated_client, tenant_user):
        """Test deactivating a user"""
        assert tenant_user.status == 'active'

        url = reverse('user-deactivate', kwargs={'pk': tenant_user.id})
        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'User deactivated'
        
        tenant_user.refresh_from_db()
        assert tenant_user.status == 'inactive'

    def test_suspend_user(self, authenticated_client, tenant_user):
        """Test suspending a user"""
        assert tenant_user.status == 'active'

        url = reverse('user-suspend', kwargs={'pk': tenant_user.id})
        response = authenticated_client.post(url)

        assert response.status_code == status.HTTP_200_OK
        assert response.data['status'] == 'User suspended'
        
        tenant_user.refresh_from_db()
        assert tenant_user.status == 'suspended'

    def test_suspend_user_requires_authentication(self, api_client, tenant_user):
        """Test that suspending requires authentication"""
        url = reverse('user-suspend', kwargs={'pk': tenant_user.id})
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_activate_user_requires_authentication(self, api_client, tenant_user):
        """Test that activating requires authentication"""
        tenant_user.status = 'inactive'
        tenant_user.save()

        url = reverse('user-activate', kwargs={'pk': tenant_user.id})
        response = api_client.post(url)
        assert response.status_code == status.HTTP_401_UNAUTHORIZED

    def test_login_blocked_for_suspended_user(self, api_client, tenant_user):
        """Test that suspended users cannot login"""
        tenant_user.status = 'suspended'
        tenant_user.save()

        url = reverse('login-slash')
        response = api_client.post(url, {
            'email': 'user@tenant.com',
            'password': 'password123'
        })

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['error'] == 'Compte suspendu'
        assert response.data['status'] == 'suspended'

    def test_login_blocked_for_inactive_user(self, api_client, tenant_user):
        """Test that inactive users cannot login"""
        tenant_user.status = 'inactive'
        tenant_user.save()

        url = reverse('login-slash')
        response = api_client.post(url, {
            'email': 'user@tenant.com',
            'password': 'password123'
        })

        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert response.data['error'] == 'Compte désactivé'
        assert response.data['status'] == 'inactive'

    def test_login_allowed_for_active_user(self, api_client, tenant_user):
        """Test that active users can login"""
        assert tenant_user.status == 'active'

        url = reverse('login-slash')
        response = api_client.post(url, {
            'email': 'user@tenant.com',
            'password': 'password123'
        })

        assert response.status_code == status.HTTP_200_OK
        assert 'tokens' in response.data
        assert 'user' in response.data


@pytest.mark.django_db
class TestUserStatusMiddleware:
    """Tests for UserStatusMiddleware blocking API access"""

    @pytest.fixture
    def middleware(self):
        """Create middleware instance"""
        def get_response(request):
            return JsonResponse({'success': True})
        return UserStatusMiddleware(get_response)

    @pytest.fixture
    def tenant(self):
        """Create a test tenant"""
        from tenants.models import Domain
        
        tenant = Tenant.objects.create(
            name='Test Tenant',
            schema_name='test_tenant',
            email='test@tenant.com'
        )
        Domain.objects.create(
            domain='test-tenant.localhost',
            tenant=tenant,
            is_primary=True
        )
        return tenant

    @pytest.fixture
    def active_user(self, tenant):
        """Create an active user"""
        return User.objects.create_user(
            username='activeuser',
            email='active@tenant.com',
            password='password123',
            role='tenant-admin',
            status='active',
            tenant=tenant
        )

    @pytest.fixture
    def suspended_user(self, tenant):
        """Create a suspended user"""
        return User.objects.create_user(
            username='suspendeduser',
            email='suspended@tenant.com',
            password='password123',
            role='tenant-admin',
            status='suspended',
            tenant=tenant
        )

    @pytest.fixture
    def inactive_user(self, tenant):
        """Create an inactive user"""
        return User.objects.create_user(
            username='inactiveuser',
            email='inactive@tenant.com',
            password='password123',
            role='tenant-admin',
            status='inactive',
            tenant=tenant
        )

    def test_middleware_allows_public_paths(self, middleware):
        """Test that middleware allows public paths"""
        request = Mock(spec=HttpRequest)
        request.path = '/api/auth/login/'
        
        response = middleware(request)
        
        assert response.status_code == 200
        assert response.data['success'] is True

    def test_middleware_blocks_non_api_paths(self, middleware):
        """Test that middleware doesn't interfere with non-API paths"""
        request = Mock(spec=HttpRequest)
        request.path = '/dashboard/'
        
        response = middleware(request)
        
        assert response.status_code == 200
        assert response.data['success'] is True

    def test_middleware_blocks_suspended_user(self, middleware, suspended_user):
        """Test that middleware blocks suspended users"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(suspended_user)
        access_token = str(refresh.access_token)

        request = Mock(spec=HttpRequest)
        request.path = '/api/pages/'
        request.META = {
            'HTTP_AUTHORIZATION': f'Bearer {access_token}'
        }
        
        # Mock JWTAuthentication
        with patch('tenants.middleware.JWTAuthentication') as mock_jwt:
            mock_auth = Mock()
            mock_auth.get_header.return_value = f'Bearer {access_token}'.encode()
            mock_auth.get_raw_token.return_value = access_token
            mock_auth.get_validated_token.return_value = refresh
            mock_auth.get_user.return_value = suspended_user
            mock_jwt.return_value = mock_auth

            response = middleware(request)
            
            assert response.status_code == 403
            assert 'Compte suspendu' in response.content.decode()

    def test_middleware_blocks_inactive_user(self, middleware, inactive_user):
        """Test that middleware blocks inactive users"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(inactive_user)
        access_token = str(refresh.access_token)

        request = Mock(spec=HttpRequest)
        request.path = '/api/pages/'
        request.META = {
            'HTTP_AUTHORIZATION': f'Bearer {access_token}'
        }
        
        # Mock JWTAuthentication
        with patch('tenants.middleware.JWTAuthentication') as mock_jwt:
            mock_auth = Mock()
            mock_auth.get_header.return_value = f'Bearer {access_token}'.encode()
            mock_auth.get_raw_token.return_value = access_token
            mock_auth.get_validated_token.return_value = refresh
            mock_auth.get_user.return_value = inactive_user
            mock_jwt.return_value = mock_auth

            response = middleware(request)
            
            assert response.status_code == 403
            assert 'Compte désactivé' in response.content.decode()

    def test_middleware_allows_active_user(self, middleware, active_user):
        """Test that middleware allows active users"""
        from rest_framework_simplejwt.tokens import RefreshToken
        
        refresh = RefreshToken.for_user(active_user)
        access_token = str(refresh.access_token)

        request = Mock(spec=HttpRequest)
        request.path = '/api/pages/'
        request.META = {
            'HTTP_AUTHORIZATION': f'Bearer {access_token}'
        }
        
        # Mock JWTAuthentication
        with patch('tenants.middleware.JWTAuthentication') as mock_jwt:
            mock_auth = Mock()
            mock_auth.get_header.return_value = f'Bearer {access_token}'.encode()
            mock_auth.get_raw_token.return_value = access_token
            mock_auth.get_validated_token.return_value = refresh
            mock_auth.get_user.return_value = active_user
            mock_jwt.return_value = mock_auth

            response = middleware(request)
            
            # Should pass through (status 200 from get_response)
            assert response.status_code == 200
            assert response.data['success'] is True

    def test_middleware_allows_super_admin(self, middleware):
        """Test that middleware allows super admin even if status is not active"""
        super_admin = User.objects.create_user(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            role='super-admin',
            status='suspended',  # Even if suspended
            tenant=None
        )
        
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(super_admin)
        access_token = str(refresh.access_token)

        request = Mock(spec=HttpRequest)
        request.path = '/api/pages/'
        request.META = {
            'HTTP_AUTHORIZATION': f'Bearer {access_token}'
        }
        
        # Mock JWTAuthentication
        with patch('tenants.middleware.JWTAuthentication') as mock_jwt:
            mock_auth = Mock()
            mock_auth.get_header.return_value = f'Bearer {access_token}'.encode()
            mock_auth.get_raw_token.return_value = access_token
            mock_auth.get_validated_token.return_value = refresh
            mock_auth.get_user.return_value = super_admin
            mock_jwt.return_value = mock_auth

            response = middleware(request)
            
            # Super admin should bypass check
            assert response.status_code == 200
            assert response.data['success'] is True

