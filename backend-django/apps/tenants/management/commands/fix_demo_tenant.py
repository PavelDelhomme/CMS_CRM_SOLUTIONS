"""
Management command to create or fix the demo tenant with its admin user
"""
from django.core.management.base import BaseCommand
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from tenants.models import Client, User, Domain, InvitationToken
from tenants.permissions import assign_role_permissions


class Command(BaseCommand):
    help = 'Create or fix the demo tenant with admin@demo-vtc-company.com'

    def add_arguments(self, parser):
        parser.add_argument(
            '--password',
            type=str,
            help='Password for the admin user (if not provided, will use invitation)',
        )

    def handle(self, *args, **options):
        tenant_slug = 'demo-vtc-company'
        tenant_name = 'Demo VTC Company'
        admin_email = 'admin@demo-vtc-company.com'
        password = options.get('password')

        self.stdout.write(f'🔧 Création/correction du tenant "{tenant_name}"...')

        # Get or create tenant
        tenant, created = Client.objects.get_or_create(
            slug=tenant_slug,
            defaults={
                'name': tenant_name,
                'email': admin_email,
                'status': 'active',
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'✅ Tenant "{tenant_name}" créé'))
        else:
            # Update email if it's different
            if tenant.email != admin_email:
                tenant.email = admin_email
                tenant.status = 'active'
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

        # Check if admin user exists
        admin_user = User.objects.filter(email=admin_email).first()

        if admin_user:
            # Update existing user
            admin_user.tenant = tenant
            admin_user.role = 'tenant-admin'
            admin_user.first_name = 'Admin'
            admin_user.last_name = 'Demo VTC Company'
            
            # Set password if provided
            if password:
                admin_user.set_password(password)
                admin_user.status = 'active'
                self.stdout.write(self.style.SUCCESS('✅ Mot de passe défini pour l\'utilisateur admin'))
            else:
                admin_user.status = 'pending'
            
            admin_user.save()
            self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur "{admin_email}" mis à jour'))
        else:
            # Create new admin user
            username = 'admin_demo_vtc_company'
            
            if password:
                admin_user = User.objects.create_user(
                    username=username,
                    email=admin_email,
                    password=password,
                    first_name='Admin',
                    last_name='Demo VTC Company',
                    tenant=tenant,
                    role='tenant-admin',
                    status='active'
                )
                self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur "{admin_email}" créé avec mot de passe'))
            else:
                random_password = get_random_string(length=32)
                admin_user = User.objects.create_user(
                    username=username,
                    email=admin_email,
                    password=random_password,
                    first_name='Admin',
                    last_name='Demo VTC Company',
                    tenant=tenant,
                    role='tenant-admin',
                    status='pending'
                )
                
                # Create invitation token
                invitation_token = get_random_string(length=64)
                expires_at = timezone.now() + timedelta(days=30)
                
                InvitationToken.objects.create(
                    user=admin_user,
                    tenant=tenant,
                    token=invitation_token,
                    expires_at=expires_at
                )
                
                self.stdout.write(self.style.SUCCESS(f'✅ Utilisateur "{admin_email}" créé avec invitation'))
                self.stdout.write(f'   Token d\'invitation: {invitation_token}')

        # Assign permissions
        try:
            assign_role_permissions(admin_user, 'tenant-admin')
            self.stdout.write(self.style.SUCCESS('✅ Permissions assignées'))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'⚠️  Erreur assignation permissions: {e}'))

        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('✅ Configuration terminée !'))
        self.stdout.write('')
        self.stdout.write(f'Tenant: {tenant_name}')
        self.stdout.write(f'Slug: {tenant_slug}')
        self.stdout.write(f'Email: {admin_email}')
        self.stdout.write(f'Domaine: {domain_name}')
        
        if password:
            self.stdout.write(f'Mot de passe: {password}')
        else:
            self.stdout.write('Statut: En attente de configuration (invitation envoyée)')
        
        self.stdout.write('')
        self.stdout.write(f'Pour se connecter: http://localhost:9494/login')
        self.stdout.write(self.style.SUCCESS('=' * 50))

