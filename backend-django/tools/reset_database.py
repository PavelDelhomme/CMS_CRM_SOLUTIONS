#!/usr/bin/env python
"""
Script pour réinitialiser complètement la base de données
Ne garde que : 1 super admin + 1 tenant avec son admin
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.core.settings')
django.setup()

from django.db import connection
from django_tenants.utils import schema_context
from tenants.models import Client, User, Domain, PasswordResetToken, InvitationToken
from billing.models import Subscription, Invoice, Payment, PricingPlan
from django.contrib.auth import get_user_model

def reset_database():
    """Réinitialise complètement la base de données"""
    
    print("🗑️  Suppression de toutes les données...")
    
    # 1. Supprimer tous les tokens
    print("   - Suppression des tokens...")
    PasswordResetToken.objects.all().delete()
    InvitationToken.objects.all().delete()
    
    # 2. Supprimer tous les utilisateurs (sauf ceux qu'on va garder)
    print("   - Suppression des utilisateurs...")
    User.objects.all().delete()
    
    # 3. Supprimer toutes les données de billing
    print("   - Suppression des données de facturation...")
    Payment.objects.all().delete()
    Invoice.objects.all().delete()
    Subscription.objects.all().delete()
    
    # 4. Supprimer tous les domains
    print("   - Suppression des domains...")
    Domain.objects.all().delete()
    
    # 5. Supprimer tous les tenants et leurs schémas
    print("   - Suppression des tenants et schémas...")
    tenants = Client.objects.all()
    for tenant in tenants:
        try:
            # Supprimer le schéma PostgreSQL
            with connection.cursor() as cursor:
                schema_name = tenant.schema_name
                cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE;")
                print(f"     ✓ Schéma {schema_name} supprimé")
        except Exception as e:
            print(f"     ⚠️  Erreur suppression schéma {tenant.schema_name}: {e}")
    
    # Supprimer les tenants de la base
    Client.objects.all().delete()
    
    print("✅ Base de données vidée !\n")
    
    # 6. Créer le super admin
    print("👤 Création du super admin...")
    super_admin_email = "admin@cms-crm-solutions.com"
    super_admin_password = "admin123"
    
    try:
        super_admin = User.objects.create_user(
            username='superadmin',
            email=super_admin_email,
            password=super_admin_password,
            first_name='Super',
            last_name='Admin',
            tenant=None,  # Super admin n'a pas de tenant
            role='super-admin',
            status='active',
            is_active=True,
            is_staff=True,
            is_superuser=True
        )
        print(f"   ✅ Super admin créé : {super_admin_email}")
        print(f"      Mot de passe : {super_admin_password}\n")
    except Exception as e:
        print(f"   ❌ Erreur création super admin : {e}\n")
        # Essayer de le récupérer s'il existe déjà
        try:
            super_admin = User.objects.get(email=super_admin_email)
            super_admin.set_password(super_admin_password)
            super_admin.role = 'super-admin'
            super_admin.status = 'active'
            super_admin.is_active = True
            super_admin.is_staff = True
            super_admin.is_superuser = True
            super_admin.save()
            print(f"   ✅ Super admin mis à jour : {super_admin_email}\n")
        except:
            pass
    
    # 7. Créer un tenant de démo avec son admin
    print("🏢 Création d'un tenant de démo...")
    tenant_name = "Mon Entreprise"
    tenant_email = "admin@masociete-vtc.com"
    tenant_slug = "ma-societe-vtc"
    
    try:
        # Créer le tenant
        tenant = Client.objects.create(
            name=tenant_name,
            slug=tenant_slug,
            email=tenant_email,
            plan='business',
            status='trial'
        )
        
        # Créer le domaine
        domain = Domain.objects.create(
            domain=f"{tenant_slug}.localhost",
            tenant=tenant,
            is_primary=True
        )
        
        print(f"   ✅ Tenant créé : {tenant_name}")
        print(f"      Email : {tenant_email}")
        print(f"      Domaine : {domain.domain}\n")
        
        # Créer l'admin du tenant
        print("👤 Création de l'admin du tenant...")
        tenant_admin_password = "admin123"
        
        tenant_admin = User.objects.create_user(
            username='admin_masociete',
            email=tenant_email,
            password=tenant_admin_password,
            first_name='Admin',
            last_name=tenant_name,
            tenant=tenant,
            role='tenant-admin',
            status='active',
            is_active=True
        )
        
        # Assigner les permissions
        try:
            from tenants.permissions import assign_role_permissions
            assign_role_permissions(tenant_admin, 'tenant-admin')
        except ImportError:
            pass
        
        print(f"   ✅ Admin tenant créé : {tenant_email}")
        print(f"      Mot de passe : {tenant_admin_password}\n")
        
    except Exception as e:
        print(f"   ❌ Erreur création tenant : {e}\n")
    
    # 8. Créer des plans tarifaires de base (optionnel)
    print("💳 Création des plans tarifaires de base...")
    
    plans = [
        {
            'name': 'Starter',
            'slug': 'starter',
            'description': 'Parfait pour démarrer',
            'price_monthly': 29.99,
            'price_yearly': 299.99,
            'max_sites': 1,
            'max_users': 2,
            'max_storage_gb': 5,
            'features': ['Site web', 'Réservations', 'Support email']
        },
        {
            'name': 'Business',
            'slug': 'business',
            'description': 'Pour les professionnels',
            'price_monthly': 79.99,
            'price_yearly': 799.99,
            'max_sites': 3,
            'max_users': 10,
            'max_storage_gb': 50,
            'features': ['Site web', 'Réservations', 'Multi-sites', 'Support prioritaire'],
            'is_featured': True
        },
        {
            'name': 'Entreprise',
            'slug': 'enterprise',
            'description': 'Pour les grandes entreprises',
            'price_monthly': 199.99,
            'price_yearly': 1999.99,
            'max_sites': 10,
            'max_users': 50,
            'max_storage_gb': 500,
            'features': ['Site web', 'Réservations', 'Multi-sites', 'API', 'Support dédié']
        }
    ]
    
    for plan_data in plans:
        try:
            plan, created = PricingPlan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            if created:
                print(f"   ✅ Plan créé : {plan.name}")
            else:
                print(f"   ℹ️  Plan existe déjà : {plan.name}")
        except Exception as e:
            print(f"   ⚠️  Erreur création plan {plan_data['name']}: {e}")
    
    print("\n" + "="*60)
    print("✅ RÉINITIALISATION TERMINÉE !")
    print("="*60)
    print("\n📋 COMPTES CRÉÉS :\n")
    print("1. SUPER ADMIN :")
    print(f"   Email : {super_admin_email}")
    print(f"   Mot de passe : {super_admin_password}")
    print(f"   Interface : http://localhost:9494/admin/dashboard\n")
    
    print("2. TENANT ADMIN :")
    print(f"   Tenant : {tenant_name}")
    print(f"   Email : {tenant_email}")
    print(f"   Mot de passe : {tenant_admin_password}")
    print(f"   Interface : http://localhost:9494/dashboard\n")
    print("="*60)

if __name__ == '__main__':
    confirmation = input("⚠️  ATTENTION : Cette action va SUPPRIMER TOUTES les données !\nVoulez-vous continuer ? (tapez 'OUI' pour confirmer) : ")
    
    if confirmation == 'OUI':
        reset_database()
    else:
        print("❌ Opération annulée")

