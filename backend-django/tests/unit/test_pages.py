"""
Tests pour l'app pages
"""
import pytest
from django.urls import reverse
from apps.pages.models import Page


@pytest.mark.django_db
def test_create_page(tenant):
    """Test de création d'une page"""
    page = Page.objects.create(
        title="Test Page",
        slug="test-page",
        content="Test content",
        is_published=True
    )
    
    assert page.title == "Test Page"
    assert page.slug == "test-page"
    assert page.is_published is True


@pytest.mark.django_db
def test_page_str(tenant):
    """Test de la représentation string d'une page"""
    page = Page.objects.create(
        title="Test Page",
        slug="test-page"
    )
    
    assert str(page) == "Test Page"


@pytest.mark.django_db
def test_page_ordering(tenant):
    """Test de l'ordre des pages"""
    page1 = Page.objects.create(title="Page 1", slug="page-1", order=2)
    page2 = Page.objects.create(title="Page 2", slug="page-2", order=1)
    
    pages = list(Page.objects.all())
    assert pages[0] == page2  # Order 1 en premier
    assert pages[1] == page1  # Order 2 en second

