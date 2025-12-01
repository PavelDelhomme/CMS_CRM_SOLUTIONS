"""
Django management command to create tenants for all pricing plans
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
from tenants.models import Tenant, User
from billing.models import PricingPlan, Subscription
from ...permissions import assign_role_permissions


class Command(BaseCommand):
    help = 'Create tenants for all pricing plans with subscriptions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force creation even if tenants already exist',
        )

    def handle(self, *args, **options):
        force = options.get('force', False)
        
        self.stdout.write(
            self.style.SUCCESS('🏢 Création de tenants pour tous les plans tarifaires...\n')
        )

        # Get all active pricing plans
        plans = PricingPlan.objects.filter(is_active=True).order_by('order', 'price_monthly')
        
        if not plans.exists():
            self.stdout.write(
                self.style.ERROR('❌ Aucun plan tarifaire actif trouvé. Créez d\'abord des plans tarifaires.')
            )
            return

        created_count = 0
        updated_count = 0

        for plan in plans:
            self.stdout.write(f'\n📦 Plan: {plan.name} ({plan.slug})')
            
            # Create tenant slug based on plan
            tenant_slug = f'demo-{plan.slug}'
            tenant_name = f'Demo {plan.name} Tenant'
            tenant_email = f'{plan.slug}@demo-vtc.com'
            admin_email = f'admin@{plan.slug}-demo.com'
            
            # Check if tenant already exists
            tenant = Tenant.objects.filter(slug=tenant_slug).first()
            
            if tenant and not force:
                self.stdout.write(
                    self.style.WARNING(f'  ⚠️  Tenant existe déjà: {tenant.name}')
                )
                updated_count += 1
            else:
                # Create or update tenant
                tenant, created = Tenant.objects.get_or_create(
                    slug=tenant_slug,
                    defaults={
                        'name': tenant_name,
                        'email': tenant_email,
                        'plan': plan.slug if plan.slug in ['starter', 'business', 'enterprise'] else 'starter',
                        'status': 'active',
                    }
                )
                
                if not created:
                    # Update existing tenant
                    tenant.name = tenant_name
                    tenant.email = tenant_email
                    tenant.status = 'active'
                    tenant.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Tenant mis à jour: {tenant.name}')
                    )
                    updated_count += 1
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Tenant créé: {tenant.name}')
                    )
                    created_count += 1

            # Create tenant admin user
            try:
                from django_tenants.utils import tenant_context
                
                with tenant_context(tenant):
                    username = admin_email.split('@')[0]
                    tenant_admin, admin_created = User.objects.get_or_create(
                        email=admin_email,
                        defaults={
                            'username': username,
                            'password': 'admin123',
                            'first_name': plan.name,
                            'last_name': 'Admin',
                            'tenant': tenant,
                            'role': 'tenant-admin',
                            'status': 'active',
                        }
                    )
                    
                    if not admin_created:
                        # Update existing admin
                        tenant_admin.set_password('admin123')
                        tenant_admin.role = 'tenant-admin'
                        tenant_admin.status = 'active'
                        tenant_admin.save()
                    
                    # Assign permissions
                    assign_role_permissions(tenant_admin, 'tenant-admin')
                    
                    if admin_created:
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✅ Admin créé: {admin_email}')
                        )
                    else:
                        self.stdout.write(
                            self.style.SUCCESS(f'  ✅ Admin mis à jour: {admin_email}')
                        )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur création admin: {e}')
                )

            # Create subscription for this tenant
            try:
                subscription, sub_created = Subscription.objects.get_or_create(
                    tenant=tenant,
                    defaults={
                        'plan': plan,
                        'status': 'active',
                        'billing_cycle': 'monthly',
                        'current_period_start': timezone.now(),
                        'current_period_end': timezone.now() + timedelta(days=30),
                    }
                )
                
                if not sub_created:
                    # Update existing subscription
                    subscription.plan = plan
                    subscription.status = 'active'
                    subscription.save()
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Abonnement mis à jour: {plan.name}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(f'  ✅ Abonnement créé: {plan.name}')
                    )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ❌ Erreur création abonnement: {e}')
                )

        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS(f'✅ Résumé:')
        )
        self.stdout.write(f'  - Tenants créés: {created_count}')
        self.stdout.write(f'  - Tenants mis à jour: {updated_count}')
        self.stdout.write(f'  - Plans traités: {plans.count()}')
        self.stdout.write('='*60)
        self.stdout.write('\n📋 Informations de connexion:')
        self.stdout.write('  Tous les admins utilisent le mot de passe: admin123')
        self.stdout.write('  Format email admin: admin@{plan-slug}-demo.com')
        self.stdout.write('\n✅ Terminé !')

