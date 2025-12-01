"""
Management command to create default block types
"""
from django.core.management.base import BaseCommand
from blocks.models import BlockType
from billing.models import PricingPlan


class Command(BaseCommand):
    help = 'Create default block types for the page builder'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating default block types...'))

        # Get pricing plans
        try:
            starter_plan = PricingPlan.objects.filter(slug='starter').first()
            business_plan = PricingPlan.objects.filter(slug='business').first()
            enterprise_plan = PricingPlan.objects.filter(slug='enterprise').first()
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  Could not load pricing plans: {e}'))
            starter_plan = None
            business_plan = None
            enterprise_plan = None

        default_blocks = [
            {
                'name': 'heading',
                'label': 'Titre',
                'icon': '📝',
                'category': 'content',
                'description': 'Bloc de titre (H1, H2, H3, etc.)',
                'schema': {
                    'text': {'type': 'text', 'label': 'Texte du titre', 'required': True},
                    'level': {'type': 'select', 'label': 'Niveau', 'options': ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'], 'default': 'h2'},
                    'align': {'type': 'select', 'label': 'Alignement', 'options': ['left', 'center', 'right'], 'default': 'left'},
                },
                'default_styles': {
                    'font_size': '2rem',
                    'font_weight': 'bold',
                    'margin_bottom': '1rem',
                },
                'order': 1,
            },
            {
                'name': 'text',
                'label': 'Texte',
                'icon': '📄',
                'category': 'content',
                'description': 'Bloc de texte avec formatage',
                'schema': {
                    'content': {'type': 'textarea', 'label': 'Contenu', 'required': True},
                },
                'default_styles': {
                    'font_size': '1rem',
                    'line_height': '1.6',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 2,
            },
            {
                'name': 'image',
                'label': 'Image',
                'icon': '🖼️',
                'category': 'media',
                'description': 'Bloc image avec légende',
                'schema': {
                    'src': {'type': 'url', 'label': 'URL de l\'image', 'required': True},
                    'alt': {'type': 'text', 'label': 'Texte alternatif'},
                    'caption': {'type': 'text', 'label': 'Légende'},
                    'align': {'type': 'select', 'label': 'Alignement', 'options': ['left', 'center', 'right'], 'default': 'center'},
                },
                'default_styles': {
                    'max_width': '100%',
                    'height': 'auto',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 3,
            },
            {
                'name': 'button',
                'label': 'Bouton',
                'icon': '🔘',
                'category': 'content',
                'description': 'Bouton avec lien',
                'schema': {
                    'text': {'type': 'text', 'label': 'Texte du bouton', 'required': True},
                    'url': {'type': 'url', 'label': 'URL', 'required': True},
                    'style': {'type': 'select', 'label': 'Style', 'options': ['primary', 'secondary', 'outline'], 'default': 'primary'},
                    'size': {'type': 'select', 'label': 'Taille', 'options': ['small', 'medium', 'large'], 'default': 'medium'},
                },
                'default_styles': {
                    'padding': '0.75rem 1.5rem',
                    'border_radius': '0.5rem',
                },
                'call_to_action': {
                    'enabled': True,
                    'type': 'button',
                    'default_text': 'Cliquez ici',
                    'default_url': '#',
                    'styles': {
                        'primary': {'background': '#3B82F6', 'color': '#FFFFFF'},
                        'secondary': {'background': '#6B7280', 'color': '#FFFFFF'},
                        'outline': {'border': '2px solid #3B82F6', 'color': '#3B82F6'},
                    },
                },
                'available_plans': [],  # Gratuit
                'order': 4,
            },
            {
                'name': 'columns',
                'label': 'Colonnes',
                'icon': '📊',
                'category': 'layout',
                'description': 'Bloc de colonnes (mise en page)',
                'schema': {
                    'columns_count': {'type': 'number', 'label': 'Nombre de colonnes', 'min': 2, 'max': 4, 'default': 2},
                },
                'default_styles': {
                    'display': 'grid',
                    'gap': '1rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 5,
            },
            {
                'name': 'video',
                'label': 'Vidéo',
                'icon': '🎥',
                'category': 'media',
                'description': 'Bloc vidéo (YouTube, Vimeo, etc.)',
                'schema': {
                    'url': {'type': 'url', 'label': 'URL de la vidéo', 'required': True},
                    'autoplay': {'type': 'boolean', 'label': 'Lecture automatique', 'default': False},
                    'controls': {'type': 'boolean', 'label': 'Contrôles', 'default': True},
                },
                'default_styles': {
                    'width': '100%',
                    'aspect_ratio': '16/9',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 6,
            },
            {
                'name': 'spacer',
                'label': 'Espaceur',
                'icon': '↕️',
                'category': 'layout',
                'description': 'Espace vertical',
                'schema': {
                    'height': {'type': 'number', 'label': 'Hauteur (px)', 'min': 10, 'max': 200, 'default': 40},
                },
                'default_styles': {
                    'display': 'block',
                    'height': '40px',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 7,
            },
            {
                'name': 'divider',
                'label': 'Séparateur',
                'icon': '➖',
                'category': 'layout',
                'description': 'Ligne de séparation horizontale',
                'schema': {
                    'style': {'type': 'select', 'label': 'Style', 'options': ['solid', 'dashed', 'dotted'], 'default': 'solid'},
                    'width': {'type': 'select', 'label': 'Largeur', 'options': ['full', 'half', 'third'], 'default': 'full'},
                },
                'default_styles': {
                    'border_top': '1px solid #e5e7eb',
                    'margin': '2rem 0',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 8,
            },
            {
                'name': 'form',
                'label': 'Formulaire',
                'icon': '📋',
                'category': 'content',
                'description': 'Formulaire de contact',
                'schema': {
                    'fields': {'type': 'json', 'label': 'Champs du formulaire'},
                    'submit_text': {'type': 'text', 'label': 'Texte du bouton', 'default': 'Envoyer'},
                },
                'default_styles': {},
                'call_to_action': {
                    'enabled': True,
                    'type': 'submit',
                    'default_text': 'Envoyer',
                    'action': 'submit_form',
                },
                'available_plans': ['starter'],  # Nécessite au moins Starter
                'order': 9,
            },
            {
                'name': 'map',
                'label': 'Carte',
                'icon': '🗺️',
                'category': 'media',
                'description': 'Carte Google Maps ou OpenStreetMap',
                'schema': {
                    'address': {'type': 'text', 'label': 'Adresse', 'required': True},
                    'zoom': {'type': 'number', 'label': 'Niveau de zoom', 'min': 1, 'max': 20, 'default': 15},
                },
                'default_styles': {
                    'width': '100%',
                    'height': '400px',
                },
                'call_to_action': {
                    'enabled': False,  # Pas de CTA pour une carte
                },
                'available_plans': ['business'],  # Nécessite au moins Business
                'order': 10,
            },
            {
                'name': 'gallery',
                'label': 'Galerie d\'images',
                'icon': '🖼️',
                'category': 'media',
                'description': 'Galerie d\'images avec grille',
                'schema': {
                    'images': {'type': 'json', 'label': 'Liste des images (array d\'URLs)'},
                    'columns': {'type': 'number', 'label': 'Nombre de colonnes', 'min': 2, 'max': 6, 'default': 3},
                    'gap': {'type': 'number', 'label': 'Espacement (px)', 'min': 0, 'max': 50, 'default': 10},
                },
                'default_styles': {
                    'display': 'grid',
                    'gap': '1rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 11,
            },
            {
                'name': 'list',
                'label': 'Liste',
                'icon': '📋',
                'category': 'content',
                'description': 'Liste à puces ou numérotée',
                'schema': {
                    'items': {'type': 'textarea', 'label': 'Éléments (un par ligne)', 'required': True},
                    'type': {'type': 'select', 'label': 'Type', 'options': ['unordered', 'ordered'], 'default': 'unordered'},
                    'icon': {'type': 'select', 'label': 'Icône', 'options': ['disc', 'circle', 'square', 'decimal', 'lower-alpha'], 'default': 'disc'},
                },
                'default_styles': {
                    'padding_left': '1.5rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 12,
            },
            {
                'name': 'quote',
                'label': 'Citation',
                'icon': '💬',
                'category': 'content',
                'description': 'Bloc de citation',
                'schema': {
                    'text': {'type': 'textarea', 'label': 'Texte de la citation', 'required': True},
                    'author': {'type': 'text', 'label': 'Auteur'},
                    'source': {'type': 'text', 'label': 'Source'},
                },
                'default_styles': {
                    'font_style': 'italic',
                    'border_left': '4px solid #3B82F6',
                    'padding_left': '1rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 13,
            },
            {
                'name': 'accordion',
                'label': 'Accordéon',
                'icon': '📑',
                'category': 'content',
                'description': 'Bloc accordéon (FAQ, etc.)',
                'schema': {
                    'items': {'type': 'json', 'label': 'Éléments (array avec title et content)'},
                },
                'default_styles': {},
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 14,
            },
            {
                'name': 'table',
                'label': 'Tableau',
                'icon': '📊',
                'category': 'content',
                'description': 'Tableau de données',
                'schema': {
                    'headers': {'type': 'json', 'label': 'En-têtes (array)'},
                    'rows': {'type': 'json', 'label': 'Lignes (array de arrays)'},
                    'striped': {'type': 'boolean', 'label': 'Lignes alternées', 'default': True},
                },
                'default_styles': {
                    'border': '1px solid #e5e7eb',
                    'border_collapse': 'collapse',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 15,
            },
            {
                'name': 'alert',
                'label': 'Alerte',
                'icon': '⚠️',
                'category': 'content',
                'description': 'Message d\'alerte ou d\'information',
                'schema': {
                    'text': {'type': 'textarea', 'label': 'Message', 'required': True},
                    'type': {'type': 'select', 'label': 'Type', 'options': ['info', 'success', 'warning', 'error'], 'default': 'info'},
                    'dismissible': {'type': 'boolean', 'label': 'Fermable', 'default': False},
                },
                'default_styles': {
                    'padding': '1rem',
                    'border_radius': '0.5rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 16,
            },
            {
                'name': 'code',
                'label': 'Code',
                'icon': '💻',
                'category': 'content',
                'description': 'Bloc de code',
                'schema': {
                    'code': {'type': 'textarea', 'label': 'Code', 'required': True},
                    'language': {'type': 'text', 'label': 'Langage (html, css, js, etc.)'},
                },
                'default_styles': {
                    'font_family': 'monospace',
                    'background': '#f3f4f6',
                    'padding': '1rem',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 17,
            },
            {
                'name': 'embed',
                'label': 'Intégration',
                'icon': '🔗',
                'category': 'media',
                'description': 'Intégrer du contenu externe (iframe)',
                'schema': {
                    'url': {'type': 'url', 'label': 'URL à intégrer', 'required': True},
                    'height': {'type': 'number', 'label': 'Hauteur (px)', 'min': 100, 'max': 1200, 'default': 400},
                },
                'default_styles': {
                    'width': '100%',
                    'border': 'none',
                },
                'call_to_action': {
                    'enabled': False,
                },
                'available_plans': [],  # Gratuit
                'order': 18,
            },
            {
                'name': 'hero',
                'label': 'Hero (Bannière)',
                'icon': '🎯',
                'category': 'layout',
                'description': 'Section hero avec titre, sous-titre et CTA',
                'schema': {
                    'title': {'type': 'text', 'label': 'Titre principal', 'required': True},
                    'subtitle': {'type': 'textarea', 'label': 'Sous-titre'},
                    'button_text': {'type': 'text', 'label': 'Texte du bouton'},
                    'button_url': {'type': 'url', 'label': 'URL du bouton'},
                    'background_image': {'type': 'url', 'label': 'Image de fond'},
                    'overlay': {'type': 'boolean', 'label': 'Overlay sombre', 'default': True},
                },
                'default_styles': {
                    'padding': '4rem 2rem',
                    'text_align': 'center',
                },
                'call_to_action': {
                    'enabled': True,
                    'type': 'button',
                    'default_text': 'Découvrir',
                    'default_url': '#',
                    'position': 'center',
                    'styles': {
                        'primary': {'background': '#3B82F6', 'color': '#FFFFFF', 'size': 'large'},
                    },
                },
                'available_plans': [],  # Gratuit
                'order': 0,
            },
        ]

        created_count = 0
        updated_count = 0

        for block_data in default_blocks:
            # Extract available_plans slugs
            plan_slugs = block_data.get('available_plans', [])
            call_to_action = block_data.get('call_to_action', {})
            
            # Remove these from defaults dict
            defaults = {
                'label': block_data['label'],
                'icon': block_data['icon'],
                'category': block_data['category'],
                'description': block_data.get('description', ''),
                'schema': block_data.get('schema', {}),
                'default_styles': block_data.get('default_styles', {}),
                'call_to_action': call_to_action,
                'order': block_data.get('order', 0),
                'is_active': True,
            }
            
            block_type, created = BlockType.objects.update_or_create(
                name=block_data['name'],
                defaults=defaults
            )
            
            # Set available plans
            if plan_slugs:
                plans_to_add = []
                for slug in plan_slugs:
                    if slug == 'starter' and starter_plan:
                        plans_to_add.append(starter_plan)
                    elif slug == 'business' and business_plan:
                        plans_to_add.append(business_plan)
                    elif slug == 'enterprise' and enterprise_plan:
                        plans_to_add.append(enterprise_plan)
                
                if plans_to_add:
                    block_type.available_plans.set(plans_to_add)
                    plan_names = ', '.join([p.name for p in plans_to_add])
                    self.stdout.write(f'    📋 Plans associés: {plan_names}')
                else:
                    self.stdout.write(self.style.WARNING(f'    ⚠️  Plans non trouvés pour: {", ".join(plan_slugs)}'))
            else:
                # Si aucun plan, c'est gratuit - on s'assure que la liste est vide
                block_type.available_plans.clear()
            
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'  ✅ Created: {block_type.label}'))
            else:
                updated_count += 1
                self.stdout.write(self.style.WARNING(f'  🔄 Updated: {block_type.label}'))

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Block types created: {created_count}, updated: {updated_count}'
        ))

