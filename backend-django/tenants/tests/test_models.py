"""
Unit tests for Tenant and User models
"""
import pytest
from django.utils import timezone
from datetime import timedelta
from django_tenants.utils import schema_context
from tenants.models import Tenant, User, PasswordResetToken, InvitationToken, Domain


@pytest.mark.django_db
@pytest.mark.model
class TestTenantModel:
    """Tests for Tenant model"""

    def test_create_tenant(self):
        """Test creating a tenant"""
        tenant = Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            plan='starter',
            status='active'
        )
        assert tenant.name == 'Test Tenant'
        assert tenant.email == 'test@tenant.com'
        assert tenant.plan == 'starter'
        assert tenant.status == 'active'
        assert tenant.slug is not None

    def test_tenant_slug_auto_generation(self):
        """Test that slug is auto-generated from name"""
        tenant = Tenant.objects.create(
            name='My Test Company',
            email='test@company.com'
        )
        assert tenant.slug == 'my-test-company'

    def test_tenant_is_active(self):
        """Test is_active property"""
        active_tenant = Tenant.objects.create(
            name='Active Tenant',
            email='active@test.com',
            status='active'
        )
        assert active_tenant.is_active() is True

        inactive_tenant = Tenant.objects.create(
            name='Inactive Tenant',
            email='inactive@test.com',
            status='suspended'
        )
        assert inactive_tenant.is_active() is False

    def test_tenant_is_trial(self):
        """Test is_trial property"""
        trial_tenant = Tenant.objects.create(
            name='Trial Tenant',
            email='trial@test.com',
            status='trial',
            trial_ends_at=timezone.now() + timedelta(days=7)
        )
        assert trial_tenant.is_trial() is True

        active_tenant = Tenant.objects.create(
            name='Active Tenant',
            email='active@test.com',
            status='active'
        )
        assert active_tenant.is_trial() is False

    def test_tenant_soft_delete(self):
        """Test soft delete functionality"""
        tenant = Tenant.objects.create(
            name='To Delete',
            email='delete@test.com'
        )
        tenant_id = tenant.id

        tenant.delete()  # Soft delete
        tenant.refresh_from_db()
        assert tenant.deleted_at is not None

        # Should not appear in default queryset
        assert Tenant.objects.filter(id=tenant_id).count() == 0
        assert Tenant.objects.filter(deleted_at__isnull=False, id=tenant_id).count() == 1


@pytest.mark.django_db
@pytest.mark.model
class TestUserModel:
    """Tests for User model"""

    def test_create_user(self):
        """Test creating a user"""
        tenant = Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com'
        )

        user = User.objects.create_user(
            username='testuser',
            email='user@test.com',
            password='password123',
            tenant=tenant,
            role='operator'
        )
        assert user.username == 'testuser'
        assert user.email == 'user@test.com'
        assert user.tenant == tenant
        assert user.role == 'operator'
        assert user.check_password('password123') is True

    def test_user_is_active(self):
        """Test is_active property"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        active_user = User.objects.create_user(
            username='active',
            email='active@test.com',
            password='pass',
            tenant=tenant,
            status='active'
        )
        assert active_user.is_active() is True

        inactive_user = User.objects.create_user(
            username='inactive',
            email='inactive@test.com',
            password='pass',
            tenant=tenant,
            status='suspended'
        )
        assert inactive_user.is_active() is False

    def test_user_is_super_admin(self):
        """Test is_super_admin method"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        super_admin = User.objects.create_user(
            username='super',
            email='super@test.com',
            password='pass',
            tenant=None,
            role='super-admin'
        )
        assert super_admin.is_super_admin() is True

        regular_user = User.objects.create_user(
            username='regular',
            email='regular@test.com',
            password='pass',
            tenant=tenant,
            role='operator'
        )
        assert regular_user.is_super_admin() is False


@pytest.mark.django_db
@pytest.mark.model
class TestPasswordResetToken:
    """Tests for PasswordResetToken model"""

    def test_create_reset_token(self):
        """Test creating a password reset token"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        user = User.objects.create_user(
            username='test',
            email='test@test.com',
            password='pass',
            tenant=tenant
        )

        token = PasswordResetToken.objects.create(user=user)
        assert token.user == user
        assert token.token is not None
        assert len(token.token) == 64  # SHA256 hex length
        assert token.expires_at > timezone.now()

    def test_token_expiration(self):
        """Test token expiration"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        user = User.objects.create_user(
            username='test',
            email='test@test.com',
            password='pass',
            tenant=tenant
        )

        token = PasswordResetToken.objects.create(user=user)
        assert token.is_expired() is False

        # Set token as expired
        token.expires_at = timezone.now() - timedelta(minutes=1)
        token.save()
        assert token.is_expired() is True


@pytest.mark.django_db
@pytest.mark.model
class TestInvitationToken:
    """Tests for InvitationToken model"""

    def test_create_invitation_token(self):
        """Test creating an invitation token"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        token = InvitationToken.objects.create(
            tenant=tenant,
            email='invite@test.com',
            role='operator'
        )
        assert token.tenant == tenant
        assert token.email == 'invite@test.com'
        assert token.role == 'operator'
        assert token.token is not None
        assert token.used is False

    def test_token_usage(self):
        """Test marking token as used"""
        tenant = Tenant.objects.create(name='Test', email='test@test.com')
        token = InvitationToken.objects.create(
            tenant=tenant,
            email='invite@test.com'
        )
        assert token.used is False

        token.used = True
        token.save()
        assert token.used is True

