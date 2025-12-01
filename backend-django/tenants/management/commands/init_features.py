"""
Management command to initialize default features
"""
from django.core.management.base import BaseCommand
from tenants.models import Feature
from billing.models import PricingPlan


class Command(BaseCommand):
    help = 'Initialize default features with pricing plan associations'

    def handle(self, *args, **options):
        # Récupérer les plans tarifaires
        try:
            starter_plan = PricingPlan.objects.get(slug='starter')
            business_plan = PricingPlan.objects.get(slug='business')
            enterprise_plan = PricingPlan.objects.get(slug='enterprise')
        except PricingPlan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR('❌ Les plans tarifaires n\'existent pas. Exécutez d\'abord: python manage.py init_pricing_plans')
            )
            return
        
        # Définir les features avec leurs plans associés
        # Si available_plans est vide, la feature est accessible à tous
        # Si available_plans contient des plans, seuls ces plans y ont accès
        features = [
            {
                'name': 'blocks-editor',
                'label': 'Éditeur de Blocs',
                'description': 'Éditeur visuel de blocs pour créer des pages',
                'status': 'stable',
                'available_plans': [],  # Accessible à tous
                'requires_setup': False,
                'category': 'editor',
                'order': 1,
            },
            {
                'name': 'media-library',
                'label': 'Bibliothèque Média',
                'description': 'Gestion de la bibliothèque de médias (images, vidéos, etc.)',
                'status': 'beta',
                'available_plans': [],  # Accessible à tous
                'requires_setup': False,
                'category': 'media',
                'order': 2,
            },
            {
                'name': 'blog-articles',
                'label': 'Articles de Blog',
                'description': 'Gestion des articles de blog avec publication/dépublication',
                'status': 'development',
                'available_plans': [],  # Accessible à tous
                'requires_setup': False,
                'category': 'content',
                'order': 3,
            },
            {
                'name': 'themes',
                'label': 'Thèmes WordPress-like',
                'description': 'Système de thèmes similaires à WordPress',
                'status': 'development',
                'available_plans': [],  # Accessible à tous
                'requires_setup': False,
                'category': 'design',
                'order': 4,
            },
            {
                'name': 'analytics',
                'label': 'Analytics',
                'description': 'Statistiques d\'utilisation des blocs et pages',
                'status': 'beta',
                'available_plans': [business_plan, enterprise_plan],  # Business et Enterprise
                'requires_setup': False,
                'category': 'analytics',
                'order': 5,
            },
            {
                'name': 'advanced-blocks',
                'label': 'Blocs Avancés',
                'description': 'Blocs premium (graphiques, calendriers, etc.)',
                'status': 'beta',
                'available_plans': [business_plan, enterprise_plan],  # Business et Enterprise
                'requires_setup': False,
                'category': 'blocks',
                'order': 6,
            },
            {
                'name': 'custom-templates',
                'label': 'Templates Personnalisés',
                'description': 'Création et gestion de templates personnalisés',
                'status': 'stable',
                'available_plans': [],  # Accessible à tous
                'requires_setup': False,
                'category': 'templates',
                'order': 7,
            },
            {
                'name': 'seo-tools',
                'label': 'Outils SEO',
                'description': 'Optimisation SEO des pages (meta tags, sitemap, etc.)',
                'status': 'development',
                'available_plans': [business_plan, enterprise_plan],  # Business et Enterprise
                'requires_setup': False,
                'category': 'seo',
                'order': 8,
            },
            {
                'name': 'email-marketing',
                'label': 'Email Marketing',
                'description': 'Envoi d\'emails marketing et newsletters',
                'status': 'development',
                'available_plans': [enterprise_plan],  # Enterprise uniquement
                'requires_setup': True,
                'category': 'marketing',
                'order': 9,
            },
            {
                'name': 'multi-language',
                'label': 'Multi-langue',
                'description': 'Gestion de plusieurs langues pour le site',
                'status': 'development',
                'available_plans': [enterprise_plan],  # Enterprise uniquement
                'requires_setup': False,
                'category': 'localization',
                'order': 10,
            },
        ]
        
        created_count = 0
        updated_count = 0
        
        for feature_data in features:
            available_plans = feature_data.pop('available_plans', [])
            feature, created = Feature.objects.update_or_create(
                name=feature_data['name'],
                defaults=feature_data
            )
            
            # Associer les plans
            if available_plans:
                feature.available_plans.set(available_plans)
                plan_names = ', '.join([p.name for p in available_plans])
                self.stdout.write(f'     Plans: {plan_names}')
            else:
                feature.available_plans.clear()
                self.stdout.write(f'     Plans: Tous les plans')
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Créé: {feature.label}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'🔄 Mis à jour: {feature.label}')
                )
        
        self.stdout.write(
            self.style.SUCCESS(
                f'\n✅ Terminé: {created_count} créées, {updated_count} mises à jour'
            )
        )

