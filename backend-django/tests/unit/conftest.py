"""
Configuration pytest pour les tests
"""
import pytest
from django.test import Client
from django_tenants.test.cases import TenantTestCase


@pytest.fixture
def api_client():
    """Client API pour les tests"""
    return Client()


@pytest.fixture
def tenant():
    """Créer un tenant de test"""
    from tenants.models import Client, Domain
    
    client = Client.objects.create(
        name="Test Client",
        schema_name="test_client",
        is_active=True
    )
    
    Domain.objects.create(
        domain="test.example.com",
        tenant=client,
        is_primary=True
    )
    
    return client

