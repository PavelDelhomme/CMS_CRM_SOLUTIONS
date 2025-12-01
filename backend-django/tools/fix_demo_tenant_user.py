#!/usr/bin/env python
"""
Script pour activer et configurer l'utilisateur admin du tenant Demo VTC Company
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'vtcbuilder.settings')
django.setup()

from tenants.models import Client, User

# Trouver le tenant Demo VTC Company
tenant = Client.objects.filter(name__icontains="Demo VTC").first()

if not tenant:
    print("❌ Tenant Demo VTC Company non trouvé")
    exit(1)

print(f"✅ Tenant trouvé: {tenant.name} (ID: {tenant.id})")
print(f"   Email tenant: {tenant.email}")

# Chercher l'utilisateur admin
user = User.objects.filter(tenant=tenant).first()

if not user:
    print(f"❌ Aucun utilisateur trouvé pour ce tenant")
    print(f"   Création d'un utilisateur admin...")
    
    # Créer l'utilisateur
    email = tenant.email or f"admin@demo-vtc-company.com"
    username = email.split('@')[0]
    
    user = User.objects.create_user(
        username=username,
        email=email,
        password='admin123',
        first_name='Admin',
        last_name='Demo',
        tenant=tenant,
        role='tenant-admin',
        status='active',
        is_active=True
    )
    print(f"✅ Utilisateur créé: {user.email}")
else:
    print(f"✅ Utilisateur trouvé: {user.email}")
    
    # Activer l'utilisateur
    user.status = 'active'
    user.is_active = True
    user.set_password('admin123')
    user.save()
    print(f"✅ Utilisateur activé et mot de passe défini")

print(f"\n{'='*60}")
print(f"📋 INFORMATIONS DE CONNEXION")
print(f"{'='*60}")
print(f"Tenant: {tenant.name}")
print(f"Email: {user.email}")
print(f"Mot de passe: admin123")
print(f"Status: {user.status}")
print(f"Is Active: {user.is_active}")
print(f"Role: {user.role}")
print(f"{'='*60}")
print(f"\n✅ L'utilisateur peut maintenant se connecter !")

