"""
Management command to delete orphan users (users linked to deleted tenants)
"""
from django.core.management.base import BaseCommand
from tenants.models import Tenant, User


class Command(BaseCommand):
    help = 'Delete orphan users (users linked to deleted tenants)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required)',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.ERROR('⚠️  Cette commande va supprimer les utilisateurs orphelins.'))
            self.stdout.write(self.style.ERROR('⚠️  Utilisez --confirm pour confirmer la suppression.'))
            return

        self.stdout.write('🧹 Nettoyage des utilisateurs orphelins...')

        # Trouver les utilisateurs liés à des tenants supprimés
        all_users = User.objects.all()
        orphan_users = []
        
        for user in all_users:
            if user.tenant and user.tenant.deleted_at is not None:
                # Utilisateur lié à un tenant soft deleted
                orphan_users.append(user)
                self.stdout.write(f'   Utilisateur orphelin trouvé: {user.email} (tenant: {user.tenant.name})')

        if not orphan_users:
            self.stdout.write(self.style.SUCCESS('✅ Aucun utilisateur orphelin trouvé'))
            return

        # Supprimer les utilisateurs orphelins (sauf super-admin)
        deleted_count = 0
        for user in orphan_users:
            if user.role != 'super-admin':  # Ne jamais supprimer les super-admins
                try:
                    self.stdout.write(f'   Suppression: {user.email}')
                    user.delete()
                    deleted_count += 1
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f'   ⚠️  Erreur suppression {user.email}: {e}'))

        if deleted_count > 0:
            self.stdout.write(self.style.SUCCESS(f'✅ {deleted_count} utilisateur(s) orphelin(s) supprimé(s)'))
        else:
            self.stdout.write(self.style.WARNING('⚠️  Aucun utilisateur orphelin supprimé'))

        # Afficher les utilisateurs restants
        remaining_users = User.objects.all().count()
        self.stdout.write('')
        self.stdout.write(f'📊 Utilisateurs restants: {remaining_users}')

