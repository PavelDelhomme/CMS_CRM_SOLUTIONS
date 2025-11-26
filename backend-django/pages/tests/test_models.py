"""
Unit tests for Page model
"""
import pytest
from django.utils.text import slugify
from pages.models import Page
from tenants.models import Tenant


@pytest.mark.django_db
@pytest.mark.model
class TestPage:
    """Tests for Page model"""

    @pytest.fixture
    def tenant(self):
        """Create a test tenant"""
        return Tenant.objects.create(
            name='Test Tenant',
            email='test@tenant.com',
            slug='test-tenant'
        )

    def test_create_page(self, tenant):
        """Test creating a page"""
        page = Page.objects.create(
            tenant=tenant,
            title='Test Page',
            slug='test-page',
            content='<p>Test content</p>',
            status='draft',
            order=0,
            is_homepage=False
        )
        assert page.title == 'Test Page'
        assert page.slug == 'test-page'
        assert page.tenant == tenant
        assert page.status == 'draft'

    def test_page_auto_slug_generation(self, tenant):
        """Test automatic slug generation from title"""
        page = Page.objects.create(
            tenant=tenant,
            title='My Test Page',
            content='Content'
        )
        assert page.slug == slugify('My Test Page')

    def test_page_str(self, tenant):
        """Test string representation"""
        page = Page.objects.create(
            tenant=tenant,
            title='About Us',
            slug='about-us'
        )
        assert str(page) == 'About Us'

    def test_page_ordering(self, tenant):
        """Test page ordering"""
        page1 = Page.objects.create(
            tenant=tenant,
            title='Page 1',
            order=2
        )
        page2 = Page.objects.create(
            tenant=tenant,
            title='Page 2',
            order=1
        )
        pages = list(Page.objects.all())
        assert pages[0] == page2  # Lower order first

