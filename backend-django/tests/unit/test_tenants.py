"""
Tests pour l'app tenants
"""
import pytest
from apps.tenants.models import Client, Domain


@pytest.mark.django_db
def test_create_client():
    """Test de création d'un client"""
    client = Client.objects.create(
        name="Test Client",
        schema_name="test_client",
        is_active=True
    )
    
    assert client.name == "Test Client"
    assert client.schema_name == "test_client"
    assert client.is_active is True


@pytest.mark.django_db
def test_create_domain():
    """Test de création d'un domaine"""
    client = Client.objects.create(
        name="Test Client",
        schema_name="test_client"
    )
    
    domain = Domain.objects.create(
        domain="test.example.com",
        tenant=client,
        is_primary=True
    )
    
    assert domain.domain == "test.example.com"
    assert domain.tenant == client
    assert domain.is_primary is True


@pytest.mark.django_db
def test_client_str():
    """Test de la représentation string d'un client"""
    client = Client.objects.create(
        name="Test Client",
        schema_name="test_client"
    )
    
    assert str(client) == "Test Client"

