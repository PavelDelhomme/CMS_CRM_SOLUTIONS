"""
Management command to initialize pricing plans for VTCBuilder
Creates realistic pricing plans adapted for VTC companies
"""
from django.core.management.base import BaseCommand
from billing.models import PricingPlan


class Command(BaseCommand):
    help = 'Initialize pricing plans for VTCBuilder'

    def add_arguments(self, parser):
        parser.add_argument(
            '--reset',
            action='store_true',
            help='Delete existing plans before creating new ones',
        )

    def handle(self, *args, **options):
        if options['reset']:
            PricingPlan.objects.all().delete()
            self.stdout.write(self.style.WARNING('⚠️  Tous les plans existants ont été supprimés'))

        self.stdout.write('📦 Création des plans tarifaires...')

        plans_data = [
            {
                'name': 'Starter',
                'slug': 'starter',
                'description': 'Parfait pour débuter votre activité VTC. Tout ce qu\'il faut pour lancer votre site.',
                'price_monthly': 29.90,
                'price_yearly': 299.00,  # Économie d'environ 2 mois
                'max_sites': 1,
                'max_users': 1,  # L'admin seulement - pas besoin de plus pour un starter
                'max_storage_gb': 5,
                'features': [
                    '1 site VTC',
                    'Gestion des services VTC',
                    'Système de réservation',
                    'Gestion des médias (5 Go)',
                    'Templates de base',
                    'Support par email',
                ],
                'is_active': True,
                'is_featured': False,
            },
            {
                'name': 'Business',
                'slug': 'business',
                'description': 'Pour les professionnels VTC qui veulent développer leur activité. Fonctionnalités avancées incluses.',
                'price_monthly': 59.90,
                'price_yearly': 599.00,  # Économie d'environ 2 mois
                'max_sites': 1,
                'max_users': 3,  # Admin + 2 collaborateurs (drivers/opérateurs)
                'max_storage_gb': 20,
                'features': [
                    '1 site VTC',
                    'Gestion des services VTC illimités',
                    'Système de réservation avancé',
                    'Gestion des médias (20 Go)',
                    'Templates premium',
                    'Jusqu\'à 3 utilisateurs',
                    'Statistiques détaillées',
                    'Support prioritaire',
                ],
                'is_active': True,
                'is_featured': True,  # Plan populaire/recommandé
            },
            {
                'name': 'Entreprise',
                'slug': 'enterprise',
                'description': 'Pour les grandes entreprises VTC. Tout ce dont vous avez besoin pour gérer une flotte importante.',
                'price_monthly': 129.90,
                'price_yearly': 1299.00,  # Économie d'environ 2 mois
                'max_sites': 3,
                'max_users': 10,  # Admin + équipe
                'max_storage_gb': 100,
                'features': [
                    'Jusqu\'à 3 sites VTC',
                    'Services VTC illimités',
                    'Système de réservation avancé',
                    'Gestion des médias (100 Go)',
                    'Templates premium + personnalisation',
                    'Jusqu\'à 10 utilisateurs',
                    'Statistiques avancées',
                    'API personnalisée',
                    'Support dédié 24/7',
                    'Gestion multi-flotte',
                ],
                'is_active': True,
                'is_featured': False,
            },
        ]

        created_count = 0
        updated_count = 0

        for plan_data in plans_data:
            plan, created = PricingPlan.objects.update_or_create(
                slug=plan_data['slug'],
                defaults={
                    'name': plan_data['name'],
                    'description': plan_data['description'],
                    'price_monthly': plan_data['price_monthly'],
                    'price_yearly': plan_data['price_yearly'],
                    'max_sites': plan_data['max_sites'],
                    'max_users': plan_data['max_users'],
                    'max_storage_gb': plan_data['max_storage_gb'],
                    'features': plan_data['features'],
                    'is_active': plan_data['is_active'],
                    'is_featured': plan_data['is_featured'],
                }
            )

            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✅ Plan "{plan.name}" créé'))
            else:
                updated_count += 1
                self.stdout.write(self.style.SUCCESS(f'  🔄 Plan "{plan.name}" mis à jour'))

            # Afficher les détails
            featured = '⭐ POPULAIRE' if plan.is_featured else ''
            self.stdout.write(f'     Prix: {plan.price_monthly}€/mois ou {plan.price_yearly}€/an')
            self.stdout.write(f'     Utilisateurs: {plan.max_users} | Stockage: {plan.max_storage_gb} Go {featured}')

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'✅ {created_count} plan(s) créé(s), {updated_count} plan(s) mis à jour'))
        self.stdout.write('')
        self.stdout.write('Plans disponibles:')
        for plan in PricingPlan.objects.filter(is_active=True).order_by('price_monthly'):
            featured = '⭐ POPULAIRE' if plan.is_featured else ''
            self.stdout.write(f'  • {plan.name}: {plan.price_monthly}€/mois {featured}')
        self.stdout.write(self.style.SUCCESS('=' * 60))

