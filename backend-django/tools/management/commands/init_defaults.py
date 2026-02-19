"""
Management command to initialize default blocks and templates
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command


class Command(BaseCommand):
    help = 'Initialize default blocks and templates for CMS CRM Solutions'

    def add_arguments(self, parser):
        parser.add_argument(
            '--blocks-only',
            action='store_true',
            help='Only create default blocks',
        )
        parser.add_argument(
            '--templates-only',
            action='store_true',
            help='Only create default templates',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('🚀 Initialisation des données par défaut...\n'))

        blocks_only = options.get('blocks_only', False)
        templates_only = options.get('templates_only', False)

        if not templates_only:
            self.stdout.write('1️⃣  Création des blocs de base...')
            try:
                call_command('create_default_block_types')
                self.stdout.write(self.style.SUCCESS('   ✅ Blocs créés avec succès\n'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Erreur lors de la création des blocs: {e}\n'))

        if not blocks_only:
            self.stdout.write('2️⃣  Création des templates de base...')
            try:
                call_command('create_default_templates')
                self.stdout.write(self.style.SUCCESS('   ✅ Templates créés avec succès\n'))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'   ❌ Erreur lors de la création des templates: {e}\n'))

        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Initialisation terminée !'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('')
        self.stdout.write('💡 Les blocs et templates sont maintenant disponibles dans l\'interface d\'administration.')
        self.stdout.write('   • Blocs: localhost:9494/admin/blocks')
        self.stdout.write('   • Templates: localhost:9494/admin/templates')
        self.stdout.write('')

