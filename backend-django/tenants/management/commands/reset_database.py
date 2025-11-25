"""
Management command to reset database completely
Only keeps: 1 super admin + 1 tenant with its admin
"""
from django.core.management.base import BaseCommand
from django.db import connection
from tenants.models import Tenant, User, Domain, PasswordResetToken, InvitationToken
from billing.models import Subscription, Invoice, Payment, PricingPlan


class Command(BaseCommand):
    help = 'Reset database completely - keeps only 1 super admin + 1 tenant with admin'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm reset without prompt',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(
                self.style.WARNING(
                    '⚠️  ATTENTION : Cette action va SUPPRIMER TOUTES les données !'
                )
            )
            self.stdout.write(
                self.style.WARNING(
                    'Utilisez --confirm pour exécuter sans confirmation interactive'
                )
            )
            return

        self.stdout.write(self.style.WARNING("🗑️  Suppression de toutes les données..."))

        # 1. Supprimer tous les tokens
        self.stdout.write("   - Suppression des tokens...")
        PasswordResetToken.objects.all().delete()
        InvitationToken.objects.all().delete()

        # 2. Supprimer tous les utilisateurs
        self.stdout.write("   - Suppression des utilisateurs...")
        User.objects.all().delete()

        # 3. Supprimer toutes les données de billing
        self.stdout.write("   - Suppression des données de facturation...")
        Payment.objects.all().delete()
        Invoice.objects.all().delete()
        Subscription.objects.all().delete()
        PricingPlan.objects.all().delete()

        # 4. Supprimer tous les domains
        self.stdout.write("   - Suppression des domains...")
        Domain.objects.all().delete()

        # 5. Supprimer tous les tenants et leurs schémas
        self.stdout.write("   - Suppression des tenants et schémas...")
        
        # Récupérer tous les tenants avant suppression
        try:
            tenant_schemas = list(Tenant.objects.values_list('schema_name', flat=True))
            tenant_table = Tenant._meta.db_table
            
            # Supprimer les schémas PostgreSQL directement
            with connection.cursor() as cursor:
                for schema_name in tenant_schemas:
                    try:
                        cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE;")
                        self.stdout.write(f"     ✓ Schéma {schema_name} supprimé")
                    except Exception as e:
                        self.stdout.write(
                            self.style.WARNING(f"     ⚠️  Erreur suppression schéma {schema_name}: {e}")
                        )
            
            # Supprimer les tenants directement via SQL pour éviter les relations cassées
            with connection.cursor() as cursor:
                cursor.execute(f"DELETE FROM {tenant_table};")
                self.stdout.write("     ✓ Tenants supprimés de la base")
        except Exception as e:
            self.stdout.write(
                self.style.WARNING(f"     ⚠️  Erreur lors de la suppression des tenants: {e}")
            )
            # Essayer de supprimer tous les schémas trouvés dans la base
            try:
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT schema_name 
                        FROM information_schema.schemata 
                        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'public')
                        AND schema_name NOT LIKE 'pg_%';
                    """)
                    schemas = cursor.fetchall()
                    for (schema_name,) in schemas:
                        try:
                            cursor.execute(f"DROP SCHEMA IF EXISTS {schema_name} CASCADE;")
                            self.stdout.write(f"     ✓ Schéma {schema_name} supprimé")
                        except:
                            pass
            except:
                pass

        self.stdout.write(self.style.SUCCESS("✅ Base de données vidée !\n"))

        # 6. Créer le super admin
        self.stdout.write("👤 Création du super admin...")
        super_admin_email = "admin@vtcbuilder.com"
        super_admin_password = "admin123"

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

        # Assigner les permissions
        try:
            from tenants.permissions import assign_role_permissions
            assign_role_permissions(super_admin, 'super-admin')
        except ImportError:
            pass

        self.stdout.write(self.style.SUCCESS(f"   ✅ Super admin créé : {super_admin_email}"))
        self.stdout.write(f"      Mot de passe : {super_admin_password}\n")

        # 7. Créer un tenant de démo avec son admin
        self.stdout.write("🏢 Création d'un tenant de démo...")
        tenant_name = "Ma Société VTC"
        tenant_email = "admin@masociete-vtc.com"
        tenant_slug = "ma-societe-vtc"

        # Créer le tenant
        tenant = Tenant.objects.create(
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

        self.stdout.write(self.style.SUCCESS(f"   ✅ Tenant créé : {tenant_name}"))
        self.stdout.write(f"      Email : {tenant_email}")
        self.stdout.write(f"      Domaine : {domain.domain}\n")

        # Créer l'admin du tenant
        self.stdout.write("👤 Création de l'admin du tenant...")
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

        self.stdout.write(self.style.SUCCESS(f"   ✅ Admin tenant créé : {tenant_email}"))
        self.stdout.write(f"      Mot de passe : {tenant_admin_password}\n")

        # 8. Créer des plans tarifaires de base
        self.stdout.write("💳 Création des plans tarifaires de base...")

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
                'name': 'Enterprise',
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
            plan, created = PricingPlan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"   ✅ Plan créé : {plan.name}"))

        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("✅ RÉINITIALISATION TERMINÉE !"))
        self.stdout.write("="*60)
        self.stdout.write("\n📋 COMPTES CRÉÉS :\n")
        self.stdout.write("1. SUPER ADMIN :")
        self.stdout.write(f"   Email : {super_admin_email}")
        self.stdout.write(f"   Mot de passe : {super_admin_password}")
        self.stdout.write(f"   Interface : http://localhost:9494/admin/dashboard\n")

        self.stdout.write("2. TENANT ADMIN :")
        self.stdout.write(f"   Tenant : {tenant_name}")
        self.stdout.write(f"   Email : {tenant_email}")
        self.stdout.write(f"   Mot de passe : {tenant_admin_password}")
        self.stdout.write(f"   Interface : http://localhost:9494/dashboard\n")
        self.stdout.write("="*60)

