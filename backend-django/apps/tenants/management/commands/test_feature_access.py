"""
Management command to test feature access for all test tenants
"""
from django.core.management.base import BaseCommand
from apps.tenants.models import Client, User, Feature
from apps.billing.models import PricingPlan, Subscription


class Command(BaseCommand):
    help = 'Test feature access for all test tenants based on their subscription plans'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🧪 Test d\'accès aux fonctionnalités par plan\n'))
        self.stdout.write('=' * 70)
        
        # Récupérer tous les plans
        plans = PricingPlan.objects.filter(is_active=True).order_by('price_monthly')
        
        if not plans.exists():
            self.stdout.write(self.style.ERROR('❌ Aucun plan tarifaire trouvé'))
            return
        
        # Récupérer toutes les fonctionnalités
        features = Feature.objects.filter(is_active=True).order_by('category', 'order')
        
        if not features.exists():
            self.stdout.write(self.style.ERROR('❌ Aucune fonctionnalité trouvée. Exécutez: python manage.py init_features'))
            return
        
        self.stdout.write(f'\n📦 Plans disponibles: {plans.count()}')
        self.stdout.write(f'🎯 Fonctionnalités disponibles: {features.count()}\n')
        
        # Afficher le résumé des fonctionnalités par plan
        self.stdout.write(self.style.SUCCESS('📋 RÉSUMÉ DES FONCTIONNALITÉS PAR PLAN:\n'))
        for plan in plans:
            self.stdout.write(f'  {plan.name.upper()} ({plan.price_monthly}€/mois):')
            plan_features = [f for f in features if f.is_available_for_plan(plan)]
            if plan_features:
                for feature in plan_features:
                    self.stdout.write(f'    ✅ {feature.label}')
            else:
                self.stdout.write(f'    ⚠️  Aucune fonctionnalité spécifique')
            self.stdout.write('')
        
        # Tester pour chaque tenant de test
        self.stdout.write(self.style.SUCCESS('🧪 TEST D\'ACCÈS PAR TENANT:\n'))
        
        for plan in plans:
            tenant_slug = f'test-{plan.slug}'
            try:
                tenant = Client.objects.get(slug=tenant_slug)
                user = User.objects.filter(tenant=tenant, email__endswith='@vtcbuilder.test').first()
                subscription = Subscription.objects.filter(tenant=tenant).first()
                
                if not user:
                    self.stdout.write(self.style.WARNING(f'⚠️  {plan.name}: Aucun utilisateur trouvé'))
                    continue
                
                if not subscription:
                    self.stdout.write(self.style.WARNING(f'⚠️  {plan.name}: Aucun abonnement trouvé'))
                    continue
                
                self.stdout.write(f'\n📦 {plan.name.upper()} - Tenant: {tenant.name}')
                self.stdout.write(f'   👤 Utilisateur: {user.email}')
                self.stdout.write(f'   💳 Abonnement: {subscription.status} ({subscription.plan.name})')
                self.stdout.write(f'   🎯 Fonctionnalités accessibles:')
                
                accessible_count = 0
                restricted_count = 0
                
                for feature in features:
                    can_access = user.can_use_feature(feature)
                    if can_access:
                        accessible_count += 1
                        # Vérifier si c'est une fonctionnalité restreinte
                        if feature.available_plans.exists():
                            plan_names = ', '.join([p.name for p in feature.available_plans.all()])
                            self.stdout.write(f'      ✅ {feature.label} (Plans: {plan_names})')
                        else:
                            self.stdout.write(f'      ✅ {feature.label} (Tous les plans)')
                    else:
                        restricted_count += 1
                        plan_names = ', '.join([p.name for p in feature.available_plans.all()]) if feature.available_plans.exists() else 'Aucun'
                        self.stdout.write(f'      ❌ {feature.label} (Restreint à: {plan_names})')
                
                self.stdout.write(f'\n   📊 Résumé: {accessible_count} accessibles, {restricted_count} restreintes')
                
            except Client.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'❌ {plan.name}: Tenant {tenant_slug} n\'existe pas'))
                self.stdout.write(f'   💡 Créez-le avec: python manage.py setup_test_environment')
        
        # Test du super admin
        self.stdout.write(f'\n{self.style.SUCCESS("=" * 70)}')
        self.stdout.write(self.style.SUCCESS('👑 TEST SUPER ADMIN:\n'))
        super_admin = User.objects.filter(role='super-admin').first()
        if super_admin:
            self.stdout.write(f'   👤 Super Admin: {super_admin.email}')
            accessible_count = sum(1 for f in features if super_admin.can_use_feature(f))
            self.stdout.write(f'   ✅ Accès à TOUTES les fonctionnalités: {accessible_count}/{features.count()}')
            for feature in features:
                if super_admin.can_use_feature(feature):
                    self.stdout.write(f'      ✅ {feature.label}')
        else:
            self.stdout.write(self.style.WARNING('   ⚠️  Aucun super admin trouvé'))
        
        self.stdout.write(f'\n{self.style.SUCCESS("=" * 70)}')
        self.stdout.write(self.style.SUCCESS('✅ Test terminé !\n'))
        
        # Recommandations
        self.stdout.write('💡 RECOMMANDATIONS:')
        self.stdout.write('   • Vérifiez que chaque plan a accès aux fonctionnalités appropriées')
        self.stdout.write('   • Les fonctionnalités sans plan associé sont accessibles à tous')
        self.stdout.write('   • Le super admin a toujours accès à toutes les fonctionnalités')
        self.stdout.write('')

