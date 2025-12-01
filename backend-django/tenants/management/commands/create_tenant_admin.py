"""
Management command to create admin user for existing tenants without admin
"""
from django.core.management.base import BaseCommand
from tenants.models import Tenant, User
from django.utils.crypto import get_random_string
from django.utils import timezone
from datetime import timedelta
from django.core.mail import send_mail
from django.conf import settings


class Command(BaseCommand):
    help = 'Create admin user for tenants that do not have one'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=int,
            help='Specific tenant ID to create admin for',
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Create admin for all tenants without admin',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        all_tenants = options.get('all')

        if tenant_id:
            tenants = Tenant.objects.filter(id=tenant_id)
        elif all_tenants:
            tenants = Tenant.objects.filter(deleted_at__isnull=True)
        else:
            self.stdout.write(self.style.ERROR('Please specify --tenant-id or --all'))
            return

        for tenant in tenants:
            # Check if tenant already has an admin user
            admin_users = User.objects.filter(
                tenant=tenant,
                role='tenant-admin'
            )
            
            if admin_users.exists():
                self.stdout.write(
                    self.style.WARNING(f'⚠️  Tenant "{tenant.name}" already has admin users: {[u.email for u in admin_users]}')
                )
                continue

            # Get tenant email or generate default
            admin_email = tenant.email
            if not admin_email:
                # Generate default email based on tenant slug
                admin_email = f"admin@{tenant.slug}.vtcbuilder.local"
                tenant.email = admin_email
                tenant.save(update_fields=['email'])

            # Generate username from email
            username_base = admin_email.split('@')[0].replace('.', '_').replace('-', '_')
            tenant_slug = tenant.slug.replace('-', '_').replace('.', '_')
            username = f"{username_base}_{tenant_slug}"[:30]  # Max 30 chars

            # Generate a random password
            random_password = get_random_string(length=32)

            try:
                # Create admin user
                admin_user = User.objects.create_user(
                    username=username,
                    email=admin_email,
                    password=random_password,
                    first_name='Admin',
                    last_name=tenant.name[:30],
                    tenant=tenant,
                    role='tenant-admin',
                    status='pending'  # Pending until they complete setup
                )

                # Assign permissions if function exists
                try:
                    from tenants.permissions import assign_role_permissions
                    assign_role_permissions(admin_user, 'tenant-admin')
                except ImportError:
                    pass  # Permissions system optional

                # Create invitation token (valid for 30 days)
                from tenants.models import InvitationToken
                invitation_token = get_random_string(length=64)
                expires_at = timezone.now() + timedelta(days=30)

                InvitationToken.objects.create(
                    user=admin_user,
                    tenant=tenant,
                    token=invitation_token,
                    expires_at=expires_at
                )

                # Generate setup URL
                frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
                setup_url = f"{frontend_url}/setup?token={invitation_token}&email={admin_email}"

                # Send invitation email
                try:
                    send_mail(
                        subject=f'Configuration de votre compte VTCBuilder - {tenant.name}',
                        message=f'''
Bonjour,

Un compte administrateur a été créé pour votre tenant "{tenant.name}".

Cliquez sur le lien suivant pour définir votre mot de passe et accéder à votre espace d'administration (lien valable 30 jours) :
{setup_url}

Email de connexion: {admin_email}

Cordialement,
L'équipe VTCBuilder
                        ''',
                        html_message=f'''
                        <html>
                        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                            <h2>Configuration de votre compte VTCBuilder</h2>
                            <p>Bonjour,</p>
                            <p>Un compte administrateur a été créé pour votre tenant <strong>{tenant.name}</strong>.</p>
                            <p>
                                <a href="{setup_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                    Configurer mon compte
                                </a>
                            </p>
                            <p>Ou copiez ce lien dans votre navigateur :</p>
                            <p style="word-break: break-all; color: #666;">{setup_url}</p>
                            <p><strong>Email de connexion:</strong> {admin_email}</p>
                            <p><small>Ce lien est valable pendant 30 jours.</small></p>
                            <hr>
                            <p style="color: #666; font-size: 12px;">Cordialement,<br>L'équipe VTCBuilder</p>
                        </body>
                        </html>
                        ''',
                        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@vtcbuilder.com'),
                        recipient_list=[admin_email],
                        fail_silently=False,
                    )
                    self.stdout.write(self.style.SUCCESS(f'✅ Email envoyé à {admin_email}'))
                except Exception as e:
                    self.stdout.write(
                        self.style.WARNING(f'⚠️  Email non envoyé (mais utilisateur créé): {e}')
                    )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Admin créé pour tenant "{tenant.name}":\n'
                        f'   Email: {admin_email}\n'
                        f'   Username: {username}\n'
                        f'   Setup URL: {setup_url}'
                    )
                )

            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erreur création admin pour "{tenant.name}": {e}')
                )

