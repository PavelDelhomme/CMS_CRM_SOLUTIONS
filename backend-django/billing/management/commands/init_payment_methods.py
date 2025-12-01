"""
Management command to initialize payment methods
"""
from django.core.management.base import BaseCommand
from billing.models import PaymentMethod


class Command(BaseCommand):
    help = 'Initialize default payment methods'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing payment methods before creating new ones',
        )

    def handle(self, *args, **options):
        if options['reset']:
            PaymentMethod.objects.all().delete()
            self.stdout.write(self.style.WARNING('⚠️  Toutes les méthodes de paiement existantes ont été supprimées'))

        self.stdout.write('💳 Création des méthodes de paiement...')

        methods_data = [
            {
                'name': 'Carte bancaire (Stripe)',
                'method_type': 'stripe',
                'description': 'Paiement par carte bancaire via Stripe (Visa, Mastercard, American Express)',
                'is_active': True,
                'is_enabled': True,
                'requires_validation': False,
                'icon': '💳',
                'order': 1,
                'fee_percentage': 1.4,  # 1.4% + 0.25€ par transaction Stripe
                'fee_fixed': 0.25,
                'min_amount': 0.50,
                'max_amount': None,
                'settings': {
                    'provider': 'stripe',
                    'requires_api_key': True,
                }
            },
            {
                'name': 'Virement bancaire',
                'method_type': 'bank_transfer',
                'description': 'Paiement par virement bancaire SEPA',
                'is_active': True,
                'is_enabled': True,
                'requires_validation': True,  # Nécessite validation manuelle
                'icon': '🏦',
                'order': 2,
                'fee_percentage': 0,
                'fee_fixed': 0,
                'min_amount': 10.00,
                'max_amount': None,
                'settings': {
                    'provider': 'manual',
                    'iban_required': True,
                }
            },
            {
                'name': 'PayPal',
                'method_type': 'paypal',
                'description': 'Paiement via PayPal',
                'is_active': True,
                'is_enabled': False,  # Désactivé par défaut (nécessite configuration)
                'requires_validation': False,
                'icon': '🅿️',
                'order': 3,
                'fee_percentage': 2.9,
                'fee_fixed': 0.30,
                'min_amount': 1.00,
                'max_amount': 10000.00,
                'settings': {
                    'provider': 'paypal',
                    'requires_api_key': True,
                }
            },
            {
                'name': 'Chèque',
                'method_type': 'check',
                'description': 'Paiement par chèque (validation manuelle requise)',
                'is_active': True,
                'is_enabled': True,
                'requires_validation': True,
                'icon': '📝',
                'order': 4,
                'fee_percentage': 0,
                'fee_fixed': 0,
                'min_amount': 10.00,
                'max_amount': 5000.00,
                'settings': {
                    'provider': 'manual',
                    'processing_days': 14,  # Délai de traitement
                }
            },
        ]

        created_count = 0
        updated_count = 0

        for method_data in methods_data:
            method, created = PaymentMethod.objects.update_or_create(
                name=method_data['name'],
                defaults=method_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'  ✅ Méthode "{method.name}" créée')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'  🔄 Méthode "{method.name}" mise à jour')
                )

            # Afficher les détails
            enabled = '✅ Activée' if method.is_enabled else '❌ Désactivée'
            validation = '⚠️  Validation manuelle requise' if method.requires_validation else '✅ Automatique'
            self.stdout.write(f'     {enabled} | {validation}')
            if method.fee_percentage > 0 or method.fee_fixed > 0:
                fees = f'{method.fee_percentage}%'
                if method.fee_fixed > 0:
                    fees += f' + {method.fee_fixed}€'
                self.stdout.write(f'     Frais: {fees}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'✅ {created_count} méthode(s) créée(s), {updated_count} méthode(s) mise(s) à jour'))
        self.stdout.write('')
        self.stdout.write('Méthodes disponibles:')
        for method in PaymentMethod.objects.filter(is_active=True, is_enabled=True).order_by('order'):
            self.stdout.write(f'  • {method.icon} {method.name}')
        self.stdout.write(self.style.SUCCESS('=' * 60))

