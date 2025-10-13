#!/bin/bash

# Script pour créer un tenant de démonstration
# Évite les problèmes de django-tenants en créant les éléments étape par étape

set -e

echo "🏢 Création d'un tenant de démonstration..."

# Étape 1: Créer le tenant dans le schéma public
echo "📝 Création du tenant dans le schéma public..."
docker exec vtcbuilder_backend python manage.py shell -c "
from tenants.models import Tenant, User
from django.utils.text import slugify

# Créer le tenant
tenant, created = Tenant.objects.get_or_create(
    email='demo@vtccompany.com',
    defaults={
        'name': 'Demo VTC Company',
        'slug': slugify('Demo VTC Company'),
        'plan': 'business',
        'status': 'active',
    }
)

if created:
    print(f'Tenant créé: {tenant.name}')
else:
    print(f'Tenant existe déjà: {tenant.name}')

# Créer l'admin du tenant dans le schéma public d'abord
admin_user, admin_created = User.objects.get_or_create(
    email='admin@demo-vtc-company.com',
    defaults={
        'username': 'admin',
        'first_name': 'Tenant',
        'last_name': 'Admin',
        'role': 'tenant-admin',
        'status': 'active',
        'tenant': tenant,
    }
)

if admin_created:
    admin_user.set_password('admin123')
    admin_user.save()
    print(f'Admin créé: {admin_user.email}')
else:
    print(f'Admin existe déjà: {admin_user.email}')
"

echo "✅ Tenant et admin créés avec succès !"

echo ""
echo "📋 Informations du tenant de démonstration :"
echo "  Tenant: Demo VTC Company"
echo "  Email: demo@vtccompany.com"
echo "  Admin Email: admin@demo-vtc-company.com"
echo "  Admin Password: admin123"
echo ""
echo "💡 Vous pouvez maintenant utiliser ces comptes pour tester l'application !"
