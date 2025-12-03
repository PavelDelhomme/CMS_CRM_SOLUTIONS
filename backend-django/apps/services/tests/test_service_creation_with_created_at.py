"""
Tests spécifiques pour vérifier que created_at est toujours défini lors de la création de services
"""
import pytest
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_tenants.utils import schema_context, tenant_context
from apps.tenants.models import Client, Domain
from apps.services.models import Service
from apps.services.views import ServiceViewSet
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request

User = get_user_model()


@pytest.mark.django_db
class TestServiceCreationCreatedAt:
    """Tests pour vérifier que created_at est toujours défini"""

    def test_create_service_creates_tenant_with_created_at(self):
        """
        Test que la création d'un service par un super admin sans tenant
        crée un tenant avec created_at défini
        """
        # Créer un super admin sans tenant
        super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@test.com',
            password='testpass123',
            is_superuser=True,
            is_staff=True,
        )
        
        # Simuler la création d'un service via l'API
        factory = APIRequestFactory()
        request = factory.post('/api/services/', {
            'name': 'Test Service',
            'description': 'Test Description',
            'base_price': 100.00,
            'is_active': True,
        }, format='json')
        request.user = super_admin
        
        viewset = ServiceViewSet()
        viewset.request = Request(request)
        viewset.format_kwarg = None
        
        # Créer le service
        response = viewset.create(request)
        
        # Vérifier que le service a été créé sans erreur
        assert response.status_code == 201, f"Erreur: {response.data if hasattr(response, 'data') else 'Unknown error'}"
        
        # Vérifier qu'un tenant par défaut a été créé avec created_at
        tenant = Client.objects.filter(is_active=True).exclude(schema_name='public').first()
        assert tenant is not None, "Un tenant par défaut devrait être créé"
        
        # Vérifier que created_at est défini et n'est pas None
        assert hasattr(tenant, 'created_at'), "Le tenant devrait avoir un champ created_at"
        assert tenant.created_at is not None, "created_at ne doit pas être None - cela cause une erreur de contrainte NOT NULL"
        assert isinstance(tenant.created_at, timezone.datetime.__class__) or hasattr(tenant.created_at, 'year'), "created_at doit être un datetime"

    def test_client_create_without_created_at_sets_it_automatically(self):
        """
        Test que la création d'un Client sans created_at le définit automatiquement
        """
        # Créer un client sans created_at explicite
        client = Client(
            name='Test Client',
            slug='test-client-created-at',
            email='test@test.com',
            schema_name='test_client_created_at',
        )
        client.save()
        
        # Vérifier que created_at est défini
        assert hasattr(client, 'created_at'), "Le client devrait avoir un champ created_at"
        assert client.created_at is not None, "created_at ne doit pas être None après save()"
        
        # Vérifier que created_at est une date récente (dans les dernières secondes)
        now = timezone.now()
        time_diff = abs((now - client.created_at).total_seconds())
        assert time_diff < 5, f"created_at devrait être proche de maintenant (diff: {time_diff}s)"

    def test_client_create_with_explicit_created_at_uses_it(self):
        """
        Test que si created_at est explicitement défini, il est utilisé
        """
        explicit_time = timezone.now()
        client = Client.objects.create(
            name='Test Client Explicit',
            slug='test-client-explicit',
            email='test@test.com',
            schema_name='test_client_explicit',
            created_at=explicit_time
        )
        
        # Vérifier que created_at est celui que nous avons défini
        assert client.created_at is not None
        # La différence devrait être très petite (moins d'une seconde)
        time_diff = abs((explicit_time - client.created_at).total_seconds())
        assert time_diff < 1, f"created_at devrait être celui défini explicitement (diff: {time_diff}s)"

