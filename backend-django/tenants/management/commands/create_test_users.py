"""
Management command to create test users for each pricing plan
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from tenants.models import User, Tenant
from billing.models import PricingPlan, Subscription
from django.contrib.auth.hashers import make_password
from django_tenants.utils import schema_context


class Command(BaseCommand):
    help = 'Create test users for each pricing plan with restricted features'

    def handle(self, *args, **options):
        # Supprimer l'utilisateur AnonymousUser s'il existe
        User.objects.filter(username='AnonymousUser', email__isnull=True).delete()
        self.stdout.write(self.style.SUCCESS('✅ Utilisateur AnonymousUser supprimé (s\'il existait)'))

        # Récupérer tous les plans tarifaires
        plans = PricingPlan.objects.all()
        
        if not plans.exists():
            self.stdout.write(self.style.WARNING('⚠️ Aucun plan tarifaire trouvé. Créez d\'abord les plans tarifaires.'))
            return

        created_count = 0
        updated_count = 0

        for plan in plans:
            # Créer un tenant de test pour ce plan s'il n'existe pas
            tenant_slug = f'test-{plan.slug}'
            try:
                tenant = Tenant.objects.get(slug=tenant_slug)
                tenant_created = False
            except Tenant.DoesNotExist:
                # Créer le tenant sans accéder aux tables du schéma
                tenant = Tenant(
                    name=f'Test {plan.name}',
                    slug=tenant_slug,
                    plan=plan.slug,
                    status='active',
                    email=f'test-{plan.slug}@vtcbuilder.test',
                )
                tenant.save()
                tenant_created = True
            
            if tenant_created:
                self.stdout.write(self.style.SUCCESS(f'✅ Tenant créé: {tenant.name}'))
            
            # Créer un utilisateur de test pour ce tenant
            test_email = f'test-{plan.slug}@vtcbuilder.test'
            test_password = 'test123'
            
            user, user_created = User.objects.get_or_create(
                email=test_email,
                defaults={
                    'username': f'test_{plan.slug}',
                    'first_name': 'Test',
                    'last_name': plan.name,
                    'role': 'tenant-admin',
                    'status': 'active',
                    'tenant': tenant,
                    'password': make_password(test_password),
                }
            )
            
            if user_created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Utilisateur créé: {test_email} (mot de passe: {test_password}) - Plan: {plan.name}'
                    )
                )
            else:
                # Mettre à jour l'utilisateur existant
                user.tenant = tenant
                user.role = 'tenant-admin'
                user.status = 'active'
                user.password = make_password(test_password)
                user.save()
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(
                        f'🔄 Utilisateur mis à jour: {test_email} (mot de passe: {test_password}) - Plan: {plan.name}'
                    )
                )
            
            # Créer ou mettre à jour l'abonnement pour ce tenant
            now = timezone.now()
            subscription, sub_created = Subscription.objects.get_or_create(
                tenant=tenant,
                defaults={
                    'plan': plan,
                    'status': 'active',
                    'billing_cycle': 'monthly',
                    'current_period_start': now,
                    'current_period_end': now + timedelta(days=30),
                    'trial_start': now - timedelta(days=7),  # Essai de 7 jours (déjà passé)
                    'trial_end': now,
                }
            )
            
            if not sub_created:
                # Mettre à jour l'abonnement existant
                subscription.plan = plan
                subscription.status = 'active'
                subscription.billing_cycle = 'monthly'
                subscription.current_period_start = now
                subscription.current_period_end = now + timedelta(days=30)
                subscription.save()
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Abonnement mis à jour: {plan.name} (Status: active)')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Abonnement créé: {plan.name} (Status: active)')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Terminé: {created_count} utilisateurs créés, {updated_count} mis à jour'
            )
        )
        self.stdout.write(
            self.style.SUCCESS(
                f'✅ Abonnements créés/mis à jour pour tous les tenants de test'
            )
        )

