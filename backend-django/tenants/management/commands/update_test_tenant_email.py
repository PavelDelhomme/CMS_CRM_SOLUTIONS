"""
Management command to update test tenant admin email to test@delhomme.ovh
"""
from django.core.management.base import BaseCommand
from tenants.models import Tenant, User
from tenants.permissions import assign_role_permissions


class Command(BaseCommand):
    help = 'Update test tenant admin email to test@delhomme.ovh'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password for the admin user (default: admin123)',
        )

    def handle(self, *args, **options):
        tenant_slug = 'ma-societe-vtc'
        new_admin_email = 'test@delhomme.ovh'
        password = options.get('password', 'admin123')

        self.stdout.write(f'🔧 Mise à jour du tenant "{tenant_slug}"...')

        try:
            tenant = Tenant.objects.get(slug=tenant_slug)
        except Tenant.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'❌ Tenant "{tenant_slug}" non trouvé'))
            return

        # Mettre à jour l'email du tenant
        tenant.email = new_admin_email
        tenant.save(update_fields=['email'])
        self.stdout.write(self.style.SUCCESS(f'✅ Email du tenant mis à jour: {new_admin_email}'))

        # Trouver l'admin existant
        old_admin = User.objects.filter(tenant=tenant, role='tenant-admin').first()

        if old_admin:
            # Mettre à jour l'admin existant
            old_admin.email = new_admin_email
            old_admin.username = 'test_delhomme_ovh'[:30]  # Max 30 chars
            old_admin.set_password(password)
            old_admin.status = 'active'
            old_admin.is_active = True
            old_admin.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur admin mis à jour: {new_admin_email}'))
            admin_user = old_admin
        else:
            # Créer un nouvel admin
            username = 'test_delhomme_ovh'[:30]
            admin_user = User.objects.create_user(
                username=username,
                email=new_admin_email,
                password=password,
                first_name='Test',
                last_name='Delhomme',
                tenant=tenant,
                role='tenant-admin',
                status='active',
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur admin créé: {new_admin_email}'))

        # Assigner les permissions
        try:
            assign_role_permissions(admin_user, 'tenant-admin')
            self.stdout.write(self.style.SUCCESS('✅ Permissions assignées'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  Erreur assignation permissions: {e}'))

        # Vérification
        from django.contrib.auth import authenticate
        result = authenticate(username=new_admin_email, password=password)
        
        if result:
            self.stdout.write(self.style.SUCCESS('✅ Authentification testée: OK'))
        else:
            self.stdout.write(self.style.ERROR('❌ Authentification testée: ÉCHEC'))

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Configuration terminée !'))
        self.stdout.write('')
        self.stdout.write(f'Tenant: {tenant.name}')
        self.stdout.write(f'Slug: {tenant_slug}')
        self.stdout.write(f'Email admin: {new_admin_email}')
        self.stdout.write(f'Mot de passe: {password}')
        self.stdout.write(f'Statut: {tenant.status}')
        self.stdout.write('')
        self.stdout.write(f'Pour se connecter: http://localhost:9494/login')
        self.stdout.write(f'Interface admin tenant: http://localhost:9494/dashboard')
        self.stdout.write(self.style.SUCCESS('=' * 60))

