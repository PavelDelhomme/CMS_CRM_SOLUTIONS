#!/bin/bash

# Script simple pour créer un tenant de démonstration
# Utilise les commandes Django directement

set -e

echo "🏢 Création d'un tenant de démonstration..."

# Étape 1: Créer le super admin d'abord
echo "👤 Création du super admin..."
docker exec cms_crm_backend python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Créer le super admin s'il n'existe pas
try:
    super_admin = User.objects.get(email='admin@vtcbuilder.com')
    print('Super admin existe déjà')
except User.DoesNotExist:
    super_admin = User.objects.create_superuser(
        username='superadmin',
        email='admin@vtcbuilder.com',
        password='admin123',
        first_name='Super',
        last_name='Admin',
        role='super-admin'
    )
    print('Super admin créé')
"

# Étape 2: Créer le tenant de démonstration
echo "🏢 Création du tenant de démonstration..."
docker exec cms_crm_backend python manage.py shell -c "
from tenants.models import Tenant
from django.utils.text import slugify

# Créer le tenant
tenant, created = Tenant.objects.get_or_create(
    email='demo@vtccompany.com',
    defaults={
        'name': 'Demo Entreprise',
        'slug': slugify('Demo Entreprise'),
        'plan': 'business',
        'status': 'active',
    }
)

if created:
    print(f'Tenant créé: {tenant.name}')
else:
    print(f'Tenant existe déjà: {tenant.name}')
"

# Étape 3: Créer l'admin du tenant
echo "👨‍💼 Création de l'admin du tenant..."
docker exec cms_crm_backend python manage.py shell -c "
from django.contrib.auth import get_user_model
from tenants.models import Tenant
User = get_user_model()

# Récupérer le tenant
tenant = Tenant.objects.get(email='demo@vtccompany.com')

# Créer l'admin du tenant
try:
    tenant_admin = User.objects.get(email='admin@demo-vtc-company.com')
    print('Admin du tenant existe déjà')
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
    print('Admin du tenant créé')

# Assigner les permissions
from tenants.permissions import assign_role_permissions
assign_role_permissions(tenant_admin, 'tenant-admin')
print('Permissions assignées à l\\'admin du tenant')
"

echo "✅ Tenant et admin créés avec succès !"

echo ""
echo "📋 Informations du tenant de démonstration :"
echo "  Tenant: Demo Entreprise"
echo "  Email: demo@vtccompany.com"
echo "  Admin Email: admin@demo-vtc-company.com"
echo "  Admin Password: admin123"
echo "  Super Admin Email: admin@vtcbuilder.com"
echo "  Super Admin Password: admin123"
echo ""
echo "💡 Vous pouvez maintenant utiliser ces comptes pour tester l'application !"
