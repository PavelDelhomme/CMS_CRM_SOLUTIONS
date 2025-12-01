#!/usr/bin/env python
"""
Script pour créer manuellement un tenant de démonstration
"""
import os
import sys
import django

# Configuration Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')
django.setup()

from tenants.models import Client, User

def create_demo_tenant():
    """Créer un tenant de démonstration avec admin"""

    # Créer le super admin
    try:
        super_admin = User.objects.get(email='admin@vtcbuilder.com')
        print('✅ Super admin existe déjà')
    except User.DoesNotExist:
        super_admin = User.objects.create_superuser(
            username='superadmin',
            email='admin@vtcbuilder.com',
            password='admin123',
            first_name='Super',
            last_name='Admin',
            role='super-admin'
        )
        print('✅ Super admin créé')

    # Créer le tenant
    tenant, created = Client.objects.get_or_create(
        email='demo@vtccompany.com',
        defaults={
            'name': 'Demo VTC Company',
            'slug': 'demo-vtc-company',
            'plan': 'business',
            'status': 'active',
        }
    )

    if created:
        print(f'✅ Tenant créé: {tenant.name}')
    else:
        print(f'✅ Tenant existe déjà: {tenant.name}')

    # Créer l'admin du tenant
    try:
        tenant_admin = User.objects.get(email='admin@demo-vtc-company.com')
        print('✅ Admin du tenant existe déjà')
    except User.DoesNotExist:
        tenant_admin = User.objects.create_user(
            username='tenantadmin',
            email='admin@demo-vtc-company.com',
            password='admin123',
            first_name='Tenant',
            last_name='Admin',
            tenant=tenant,
            role='tenant-admin'
        )
        print('✅ Admin du tenant créé')

    # Assigner les permissions
    from tenants.permissions import assign_role_permissions
    assign_role_permissions(tenant_admin, 'tenant-admin')
    print('✅ Permissions assignées à l\'admin du tenant')

    print("\n🎉 Configuration terminée !")
    print("\n📋 Informations de connexion :")
    print("   Super Admin: admin@vtcbuilder.com / admin123")
    print("   Demo Tenant: admin@demo-vtc-company.com / admin123")

if __name__ == '__main__':
    create_demo_tenant()
