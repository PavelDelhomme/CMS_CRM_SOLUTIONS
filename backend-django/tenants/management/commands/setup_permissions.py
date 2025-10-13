"""
Django management command to setup permissions and roles
"""
from django.core.management.base import BaseCommand
from ...permissions import setup_permissions, create_super_admin, ROLES


class Command(BaseCommand):
    help = 'Setup permissions and create default roles'

    def add_arguments(self, parser):
        parser.add_argument(
            '--super-admin',
            action='store_true',
            help='Create super admin user',
        )

    def handle(self, *args, **options):
        self.stdout.write(
            self.style.SUCCESS('🔧 Setting up permissions and roles...')
        )

        # Setup permissions
        setup_permissions()

        # Display available roles
        self.stdout.write(
            self.style.SUCCESS('\n📋 Available roles:')
        )
        for role_name, role_config in ROLES.items():
            self.stdout.write(
                f"  • {role_name}: {role_config['name']} - {role_config['description']}"
            )

        # Create super admin if requested
        if options['super_admin']:
            self.stdout.write(
                self.style.SUCCESS('\n👤 Creating super admin...')
            )
            create_super_admin()
            self.stdout.write(
                self.style.SUCCESS('✅ Super admin created!')
            )

        self.stdout.write(
            self.style.SUCCESS('\n✅ Permissions setup complete!')
        )
