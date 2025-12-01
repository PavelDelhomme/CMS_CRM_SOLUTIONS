"""
Management command to setup complete test environment:
- Remove AnonymousUser
- Keep super admin
- Create tenants with subscriptions for each plan
- Create test users for each tenant
- Create test invoices and payments (without real payment)
- Initialize payment methods
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from tenants.models import User, Tenant
from billing.models import PricingPlan, Subscription, Invoice, Payment, PaymentMethod
from django.contrib.auth.hashers import make_password
import uuid


class Command(BaseCommand):
    help = 'Setup complete test environment with tenants, subscriptions, invoices and payments'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete all test data before creating new ones',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Configuration de l\'environnement de test...\n'))

        # 1. Supprimer AnonymousUser
        self.stdout.write('1️⃣  Nettoyage des utilisateurs...')
        anonymous_deleted = User.objects.filter(username='AnonymousUser', email__isnull=True).delete()[0]
        if anonymous_deleted > 0:
            self.stdout.write(self.style.SUCCESS(f'   ✅ Utilisateur AnonymousUser supprimé ({anonymous_deleted})'))
        else:
            self.stdout.write('   ℹ️  Aucun utilisateur AnonymousUser trouvé')
        
        # Vérifier que le super admin existe
        super_admin = User.objects.filter(role='super-admin').first()
        if super_admin:
            self.stdout.write(self.style.SUCCESS(f'   ✅ Super admin conservé: {super_admin.email}'))
        else:
            self.stdout.write(self.style.WARNING('   ⚠️  Aucun super admin trouvé. Créez-en un avec: python manage.py createsuperuser'))

        # 2. Supprimer les données de test si --reset
        if options['reset']:
            self.stdout.write('\n🗑️  Suppression des données de test existantes...')
            try:
                # Supprimer dans l'ordre inverse des dépendances
                Payment.objects.filter(tenant__slug__startswith='test-').delete()
                Invoice.objects.filter(tenant__slug__startswith='test-').delete()
                Subscription.objects.filter(tenant__slug__startswith='test-').delete()
                User.objects.filter(email__endswith='@vtcbuilder.test').delete()
                
                # Supprimer les tenants (peut échouer si les schémas n'existent pas)
                test_tenants = Tenant.objects.filter(slug__startswith='test-')
                for tenant in test_tenants:
                    try:
                        tenant.delete(force_drop=True)
                    except Exception as e:
                        # Si le schéma n'existe pas, supprimer juste l'enregistrement
                        tenant.delete()
                
                self.stdout.write(self.style.WARNING('   ✅ Données de test supprimées'))
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'   ⚠️  Erreur lors de la suppression (peut être normal): {e}'))
                # Continuer quand même

        # 3. Initialiser les méthodes de paiement
        self.stdout.write('\n2️⃣  Initialisation des méthodes de paiement...')
        self.init_payment_methods()

        # 4. Récupérer les plans tarifaires
        plans = PricingPlan.objects.filter(is_active=True).order_by('price_monthly')
        if not plans.exists():
            self.stdout.write(self.style.WARNING('⚠️  Aucun plan tarifaire trouvé. Créez d\'abord les plans avec: python manage.py init_pricing_plans'))
            return

        # 5. Créer les tenants, abonnements, factures et paiements
        self.stdout.write('\n3️⃣  Création des tenants de test avec abonnements...')
        created_tenants = 0
        created_subscriptions = 0
        created_invoices = 0
        created_payments = 0

        for plan in plans:
            self.stdout.write(f'\n📦 Plan: {plan.name}')
            
            # Créer le tenant
            tenant_slug = f'test-{plan.slug}'
            tenant, tenant_created = Tenant.objects.get_or_create(
                slug=tenant_slug,
                defaults={
                    'name': f'Test {plan.name}',
                    'plan': plan.slug,
                    'status': 'active',
                    'email': f'test-{plan.slug}@vtcbuilder.test',
                }
            )
            
            if tenant_created:
                created_tenants += 1
                self.stdout.write(self.style.SUCCESS(f'   ✅ Tenant créé: {tenant.name}'))
            else:
                self.stdout.write(f'   ℹ️  Tenant existant: {tenant.name}')

            # Créer l'utilisateur admin pour ce tenant
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
            
            if not user_created:
                user.tenant = tenant
                user.role = 'tenant-admin'
                user.status = 'active'
                user.password = make_password(test_password)
                user.save()
            
            self.stdout.write(f'   👤 Utilisateur: {test_email} / {test_password}')

            # Créer l'abonnement
            now = timezone.now()
            subscription, sub_created = Subscription.objects.get_or_create(
                tenant=tenant,
                defaults={
                    'plan': plan,
                    'status': 'active',
                    'billing_cycle': 'monthly',
                    'current_period_start': now,
                    'current_period_end': now + timedelta(days=30),
                    'trial_start': now - timedelta(days=7),
                    'trial_end': now,
                }
            )
            
            if not sub_created:
                subscription.plan = plan
                subscription.status = 'active'
                subscription.billing_cycle = 'monthly'
                subscription.current_period_start = now
                subscription.current_period_end = now + timedelta(days=30)
                subscription.save()
            
            if sub_created:
                created_subscriptions += 1
            self.stdout.write(self.style.SUCCESS(f'   ✅ Abonnement: {subscription.status} ({subscription.billing_cycle})'))

            # Créer une facture de test
            invoice_number = f'INV-{tenant.slug.upper()}-{now.strftime("%Y%m%d")}-{str(uuid.uuid4())[:8].upper()}'
            invoice_amount = plan.price_monthly
            
            invoice, invoice_created = Invoice.objects.get_or_create(
                invoice_number=invoice_number,
                defaults={
                    'subscription': subscription,
                    'tenant': tenant,
                    'status': 'paid',
                    'subtotal': invoice_amount,
                    'tax': Decimal('0.00'),
                    'total': invoice_amount,
                    'currency': 'EUR',
                    'issue_date': now - timedelta(days=5),
                    'due_date': now - timedelta(days=2),
                    'paid_at': now - timedelta(days=2),
                }
            )
            
            if invoice_created:
                created_invoices += 1
                self.stdout.write(self.style.SUCCESS(f'   ✅ Facture créée: {invoice_number} - {invoice_amount}€'))

            # Créer un paiement de test (sans paiement réel)
            # Utiliser "Virement bancaire" comme méthode de test (validation manuelle)
            test_payment_method = PaymentMethod.objects.filter(
                method_type='bank_transfer',
                is_active=True
            ).first()
            
            if test_payment_method:
                payment, payment_created = Payment.objects.get_or_create(
                    invoice=invoice,
                    defaults={
                        'tenant': tenant,
                        'amount': invoice_amount,
                        'currency': 'EUR',
                        'status': 'succeeded',  # Paiement réussi (simulé)
                        'method': 'bank_transfer',
                        'paid_at': now - timedelta(days=2),
                    }
                )
                
                if payment_created:
                    created_payments += 1
                    self.stdout.write(self.style.SUCCESS(f'   ✅ Paiement créé: {invoice_amount}€ (simulé - statut: succeeded)'))

        # Résumé
        self.stdout.write('\n' + '=' * 60)
        self.stdout.write(self.style.SUCCESS('✅ ENVIRONNEMENT DE TEST CONFIGURÉ !'))
        self.stdout.write('=' * 60)
        self.stdout.write(f'\n📊 RÉSUMÉ :')
        self.stdout.write(f'   ✅ {created_tenants} tenant(s) créé(s)')
        self.stdout.write(f'   ✅ {created_subscriptions} abonnement(s) créé(s)')
        self.stdout.write(f'   ✅ {created_invoices} facture(s) créée(s)')
        self.stdout.write(f'   ✅ {created_payments} paiement(s) créé(s)')
        
        self.stdout.write(f'\n👤 COMPTES DE TEST :')
        for plan in plans:
            self.stdout.write(f'   📧 test-{plan.slug}@vtcbuilder.test / test123')
        
        self.stdout.write(f'\n💡 NOTE :')
        self.stdout.write(f'   • Les paiements sont simulés (statut: succeeded)')
        self.stdout.write(f'   • Aucun paiement réel n\'a été effectué')
        self.stdout.write(f'   • Vous pouvez tester toutes les fonctionnalités sans payer')
        self.stdout.write('=' * 60)

    def init_payment_methods(self):
        """Initialiser les méthodes de paiement"""
        methods_data = [
            {
                'name': 'Carte bancaire (Test)',
                'method_type': 'card',
                'description': 'Paiement par carte bancaire - MODE TEST (pas de paiement réel)',
                'is_active': True,
                'is_enabled': True,
                'requires_validation': False,
                'icon': '💳',
                'order': 1,
                'fee_percentage': 0,  # Pas de frais en mode test
                'fee_fixed': 0,
                'settings': {
                    'provider': 'test',
                    'test_mode': True,
                }
            },
            {
                'name': 'Virement bancaire (Test)',
                'method_type': 'bank_transfer',
                'description': 'Paiement par virement - MODE TEST (simulation)',
                'is_active': True,
                'is_enabled': True,
                'requires_validation': False,  # En test, pas besoin de validation
                'icon': '🏦',
                'order': 2,
                'fee_percentage': 0,
                'fee_fixed': 0,
                'settings': {
                    'provider': 'test',
                    'test_mode': True,
                }
            },
        ]

        for method_data in methods_data:
            method, created = PaymentMethod.objects.update_or_create(
                name=method_data['name'],
                defaults=method_data
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'   ✅ Méthode "{method.name}" créée'))
            else:
                self.stdout.write(f'   ℹ️  Méthode "{method.name}" existe déjà')

