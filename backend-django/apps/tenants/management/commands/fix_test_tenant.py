"""
Management command to create or fix the test tenant "Ma Société VTC" with its admin user
"""
from django.core.management.base import BaseCommand
from tenants.models import Client, User, Domain
from tenants.permissions import assign_role_permissions


class Command(BaseCommand):
    help = 'Create or fix the test tenant "Ma Société VTC" with admin@masociete-vtc.com'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            default='admin123',
            help='Password for the admin user (default: admin123)',
        )

    def handle(self, *args, **options):
        tenant_slug = 'ma-societe-vtc'
        tenant_name = 'Ma Société VTC'
        admin_email = 'test@delhomme.ovh'
        password = options.get('password', 'admin123')

        self.stdout.write(f'🔧 Création/correction du tenant "{tenant_name}"...')

        # Get or create tenant
        tenant, created = Client.objects.get_or_create(
            slug=tenant_slug,
            defaults={
                'name': tenant_name,
                'email': admin_email,
                'status': 'active',
                'plan': 'business',
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Tenant "{tenant_name}" créé'))
        else:
            # Update email and status if different
            updated = False
            if tenant.email != admin_email:
                tenant.email = admin_email
                updated = True
            if tenant.status != 'active':
                tenant.status = 'active'
                updated = True
            if updated:
                tenant.save(update_fields=['email', 'status'])
                self.stdout.write(self.style.SUCCESS(f'✅ Tenant "{tenant_name}" mis à jour'))
            else:
                self.stdout.write(f'ℹ️  Tenant "{tenant_name}" existe déjà')

        # Create or update domain
        domain_name = f'{tenant_slug}.localhost'
        domain, domain_created = Domain.objects.get_or_create(
            domain=domain_name,
            defaults={'tenant': tenant, 'is_primary': True}
        )
        if domain_created:
            self.stdout.write(self.style.SUCCESS(f'✅ Domaine "{domain_name}" créé'))
        else:
            # Update domain if tenant changed
            if domain.tenant != tenant:
                domain.tenant = tenant
                domain.save()
                self.stdout.write(self.style.SUCCESS(f'✅ Domaine "{domain_name}" mis à jour'))

        # Check if admin user exists
        admin_user = User.objects.filter(email=admin_email).first()

        if admin_user:
            # Update existing user
            admin_user.tenant = tenant
            admin_user.role = 'tenant-admin'
            admin_user.first_name = 'Admin'
            admin_user.last_name = 'Ma Société VTC'
            admin_user.set_password(password)
            admin_user.status = 'active'
            admin_user.is_active = True
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur "{admin_email}" mis à jour avec mot de passe'))
        else:
            # Create new admin user
            username = 'admin_masociete_vtc'
            
            admin_user = User.objects.create_user(
                username=username,
                email=admin_email,
                password=password,
                first_name='Admin',
                last_name='Ma Société VTC',
                tenant=tenant,
                role='tenant-admin',
                status='active',
                is_active=True
            )
            self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur "{admin_email}" créé avec mot de passe'))

        # Assign permissions
        try:
            assign_role_permissions(admin_user, 'tenant-admin')
            self.stdout.write(self.style.SUCCESS('✅ Permissions assignées'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  Erreur assignation permissions: {e}'))

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('✅ Configuration terminée !'))
        self.stdout.write('')
        self.stdout.write(f'Tenant: {tenant_name}')
        self.stdout.write(f'Slug: {tenant_slug}')
        self.stdout.write(f'Email admin: {admin_email}')
        self.stdout.write(f'Mot de passe: {password}')
        self.stdout.write(f'Domaine: {domain_name}')
        self.stdout.write(f'Statut: {tenant.status}')
        self.stdout.write('')
        self.stdout.write(f'Pour se connecter: http://localhost:9494/login')
        self.stdout.write(f'Interface admin tenant: http://localhost:9494/dashboard')
        self.stdout.write(self.style.SUCCESS('=' * 60))

