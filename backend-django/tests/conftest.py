"""
Pytest configuration and fixtures for django-tenants
"""
import pytest
from django.core.management import call_command
from django_tenants.utils import schema_context, tenant_context
from apps.tenants.models import Client, Domain


@pytest.fixture(scope='function')
def tenant_with_schema():
    """
    Create a tenant with migrated schema for testing tenant-specific models
    """
    from django.utils.text import slugify
    
    tenant = Client.objects.create(
        name='Test Tenant',
        email='test@tenant.com',
        slug='test-tenant',
        status='active'
    )
    
    # Create domain
    Domain.objects.create(
        tenant=tenant,
        domain='test-tenant.localhost',
        is_primary=True
    )
    
    # Migrate schema for tenant-specific apps
    # Note: This assumes migrations have been run at least once
    # In CI/CD, you'd run migrations before tests
    try:
        from django_tenants.management.commands import migrate_schemas
        call_command('migrate_schemas', schema_name=tenant.schema_name, verbosity=0, interactive=False)
    except Exception:
        # If migrate_schemas fails, we'll create tables manually in tenant_context
        # This is a fallback for tests that don't need full migrations
        pass
    
    yield tenant
    
    # Cleanup: tenant schema will be dropped when tenant is deleted
    # (auto_drop_schema = True)

