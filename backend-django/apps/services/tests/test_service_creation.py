"""
Tests pour la création de services, notamment pour les super admins
"""
import pytest
from django.contrib.auth import get_user_model
from django_tenants.utils import schema_context, tenant_context
from apps.tenants.models import Client, Domain
from apps.services.models import Service

User = get_user_model()


@pytest.mark.django_db
class TestServiceCreationForSuperAdmin:
    """Tests pour la création de services par un super admin"""

    def test_create_service_as_super_admin_without_tenant(self):
        """
        Test que la création d'un service par un super admin sans tenant
        crée automatiquement un tenant par défaut avec tous les champs requis
        """
        # Créer un super admin sans tenant
        super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@test.com',
            password='testpass123',
            is_superuser=True,
            is_staff=True,
        )
        
        # Vérifier qu'il n'y a pas de tenant actif
        assert Client.objects.filter(is_active=True).exclude(schema_name='public').count() == 0
        
        # Simuler la création d'un service (via l'API)
        from apps.services.views import ServiceViewSet
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        
        factory = APIRequestFactory()
        request = factory.post('/api/services/', {
            'name': 'Test Service',
            'description': 'Test Description',
            'base_price': 100.00,
            'is_active': True,
        })
        request.user = super_admin
        
        viewset = ServiceViewSet()
        viewset.request = Request(request)
        viewset.format_kwarg = None
        
        # Créer le service
        response = viewset.create(request)
        
        # Vérifier que le service a été créé
        assert response.status_code == 201
        
        # Vérifier qu'un tenant par défaut a été créé
        tenant = Client.objects.filter(is_active=True).exclude(schema_name='public').first()
        assert tenant is not None
        assert tenant.name == 'Tenant par défaut'
        assert tenant.slug is not None
        assert tenant.email is not None
        assert tenant.plan == 'free'
        assert tenant.status == 'active'
        assert tenant.primary_color == '#3B82F6'
        assert tenant.secondary_color == '#6B7280'
        assert tenant.settings == {}
        assert tenant.metadata == {}
        assert tenant.is_active is True
        # Vérifier que created_at est défini (important pour éviter les erreurs de contrainte)
        assert hasattr(tenant, 'created_at') or hasattr(tenant, 'created_on')
        if hasattr(tenant, 'created_at'):
            assert tenant.created_at is not None, "created_at ne doit pas être None"
        
        # Vérifier qu'un domaine a été créé
        domain = Domain.objects.filter(tenant=tenant).first()
        assert domain is not None
        assert domain.is_primary is True

    def test_create_service_as_super_admin_with_existing_tenant(self):
        """
        Test que la création d'un service par un super admin avec un tenant existant
        utilise le tenant existant
        """
        # Créer un tenant avec created_at explicite
        from django.utils import timezone
        tenant = Client.objects.create(
            name='Existing Tenant',
            slug='existing-tenant',
            email='admin@existing.localhost',
            plan='free',
            status='active',
            primary_color='#3B82F6',
            secondary_color='#6B7280',
            settings={},
            metadata={},
            schema_name='existing_tenant',
            is_active=True,
            created_at=timezone.now()  # Explicitly set created_at
        )
        Domain.objects.create(
            domain='existing-tenant.localhost',
            tenant=tenant,
            is_primary=True
        )
        
        # Créer un super admin
        super_admin = User.objects.create_user(
            username='superadmin',
            email='superadmin@test.com',
            password='testpass123',
            is_superuser=True,
            is_staff=True,
        )
        
        # Compter les tenants avant
        tenant_count_before = Client.objects.filter(is_active=True).exclude(schema_name='public').count()
        
        # Simuler la création d'un service
        from apps.services.views import ServiceViewSet
        from rest_framework.test import APIRequestFactory
        from rest_framework.request import Request
        
        factory = APIRequestFactory()
        request = factory.post('/api/services/', {
            'name': 'Test Service',
            'description': 'Test Description',
            'base_price': 100.00,
            'is_active': True,
        })
        request.user = super_admin
        
        viewset = ServiceViewSet()
        viewset.request = Request(request)
        viewset.format_kwarg = None
        
        # Créer le service
        response = viewset.create(request)
        
        # Vérifier que le service a été créé
        assert response.status_code == 201
        
        # Vérifier qu'aucun nouveau tenant n'a été créé
        tenant_count_after = Client.objects.filter(is_active=True).exclude(schema_name='public').count()
        assert tenant_count_after == tenant_count_before

    def test_client_model_has_all_required_fields(self):
        """
        Test que le modèle Client a tous les champs requis avec des valeurs par défaut
        """
        # Créer un client avec seulement les champs obligatoires
        client = Client.objects.create(
            name='Test Client',
            slug='test-client',
            email='test@test.com',
            schema_name='test_client',
        )
        
        # Vérifier que tous les champs requis ont des valeurs
        assert client.name == 'Test Client'
        assert client.slug == 'test-client'
        assert client.email == 'test@test.com'
        assert client.plan == 'free'
        assert client.status == 'active'
        assert client.primary_color == '#3B82F6'
        assert client.secondary_color == '#6B7280'
        assert client.settings == {}
        assert client.metadata == {}
        assert client.is_active is True

    def test_client_save_auto_generates_defaults(self):
        """
        Test que la méthode save() génère automatiquement les valeurs par défaut
        """
        # Créer un client sans valeurs pour les champs optionnels
        client = Client(
            name='Test Client',
            schema_name='test_client',
        )
        client.save()
        
        # Vérifier que les valeurs par défaut ont été générées
        assert client.slug is not None
        assert client.plan == 'free'
        assert client.status == 'active'
        assert client.primary_color == '#3B82F6'
        assert client.secondary_color == '#6B7280'
        assert client.settings == {}
        assert client.metadata == {}
        assert client.is_active is True
        # Vérifier que created_at est défini (important pour éviter les erreurs de contrainte)
        if hasattr(client, 'created_at'):
            assert client.created_at is not None, "created_at ne doit pas être None"

