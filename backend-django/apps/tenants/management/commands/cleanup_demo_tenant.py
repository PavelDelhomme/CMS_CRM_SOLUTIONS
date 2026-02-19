"""
Management command to delete the Demo Entreprise tenant and keep only Mon Entreprise
"""
from django.core.management.base import BaseCommand
from tenants.models import Client, User
from apps.billing.models import Subscription


class Command(BaseCommand):
    help = 'Delete Demo Entreprise tenant and keep only Mon Entreprise'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required)',
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.ERROR('⚠️  Cette commande va supprimer le tenant "Demo Entreprise".'))
            self.stdout.write(self.style.ERROR('⚠️  Utilisez --confirm pour confirmer la suppression.'))
            return

        self.stdout.write('🧹 Nettoyage des tenants...')

        # Trouver le tenant Demo Entreprise
        demo_tenant = Client.objects.filter(slug='demo-vtc-company').first()
        ma_societe = Client.objects.filter(slug='ma-societe-vtc').first()

        if demo_tenant:
            self.stdout.write(f'🗑️  Suppression du tenant "Demo Entreprise" (ID: {demo_tenant.id})...')
            
            # Supprimer les utilisateurs associés au tenant demo
            demo_users = User.objects.filter(tenant=demo_tenant)
            deleted_users_count = 0
            for user in demo_users:
                if user.role != 'super-admin':  # Ne pas supprimer les super-admins
                    self.stdout.write(f'   Suppression utilisateur: {user.email}')
                    try:
                        user.delete()
                        deleted_users_count += 1
                    except Exception as e:
                        self.stdout.write(self.style.WARNING(f'   ⚠️  Erreur suppression utilisateur {user.email}: {e}'))
            
            if deleted_users_count > 0:
                self.stdout.write(self.style.SUCCESS(f'   ✅ {deleted_users_count} utilisateur(s) supprimé(s)'))
            
            # Supprimer les subscriptions
            subscriptions = Subscription.objects.filter(tenant=demo_tenant)
            for sub in subscriptions:
                self.stdout.write(f'   Suppression subscription: {sub.id}')
                sub.delete()
            
            # Supprimer le tenant (soft delete ou hard delete selon votre préférence)
            # Ici on fait un soft delete pour pouvoir restaurer si besoin
            try:
                demo_tenant.soft_delete()
                self.stdout.write(self.style.SUCCESS('✅ Tenant "Demo Entreprise" supprimé (soft delete)'))
            except Exception as e:
                # Si soft delete échoue, on fait une suppression directe
                self.stdout.write(self.style.WARNING(f'⚠️  Soft delete échoué: {e}'))
                self.stdout.write('   Tentative de suppression directe...')
                try:
                    demo_tenant.delete()
                    self.stdout.write(self.style.SUCCESS('✅ Tenant "Demo Entreprise" supprimé'))
                except Exception as e2:
                    self.stdout.write(self.style.ERROR(f'❌ Erreur suppression: {e2}'))
        else:
            self.stdout.write(self.style.WARNING('ℹ️  Tenant "Demo Entreprise" non trouvé'))

        # Vérifier Mon Entreprise
        if ma_societe:
            self.stdout.write('')
            self.stdout.write(f'✅ Tenant "Mon Entreprise" conservé (ID: {ma_societe.id})')
            self.stdout.write(f'   Email: {ma_societe.email}')
            self.stdout.write(f'   Plan: {ma_societe.plan}')
            self.stdout.write(f'   Status: {ma_societe.status}')
            
            # S'assurer qu'il a le plan business
            if ma_societe.plan != 'business':
                ma_societe.plan = 'business'
                ma_societe.save(update_fields=['plan'])
                self.stdout.write(self.style.SUCCESS('   ✅ Plan mis à jour vers "business"'))
            
            # Vérifier la subscription
            subscription = Subscription.objects.filter(tenant=ma_societe).first()
            if subscription:
                self.stdout.write(f'   Subscription: {subscription.plan.name} - Status: {subscription.status}')
            else:
                self.stdout.write(self.style.WARNING('   ⚠️  Pas de subscription trouvée'))
            
            # Vérifier l'admin
            admin = User.objects.filter(tenant=ma_societe, role='tenant-admin').first()
            if admin:
                self.stdout.write(f'   Admin: {admin.email}')
            else:
                self.stdout.write(self.style.WARNING('   ⚠️  Pas d\'admin trouvé'))
        else:
            self.stdout.write(self.style.ERROR('❌ Tenant "Mon Entreprise" non trouvé !'))

        # Résumé
        remaining_tenants = Client.objects.filter(deleted_at__isnull=True).exclude(slug='public').count()
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(f'✅ Nettoyage terminé !')
        self.stdout.write(f'   Tenants restants (non supprimés): {remaining_tenants}')
        self.stdout.write(self.style.SUCCESS('=' * 60))

