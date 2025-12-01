"""
Django management command to create a demo tenant
"""
from django.core.management.base import BaseCommand
from django.utils.text import slugify
from tenants.models import Client, User
from ...permissions import assign_role_permissions


class Command(BaseCommand):
    help = 'Create a demo tenant with admin user'

    def add_arguments(self, parser):
        parser.add_argument(
            '--name',
            default='Demo VTC Company',
            help='Name of the demo tenant',
        )
        parser.add_argument(
            '--email',
            default='demo@vtccompany.com',
            help='Email for the tenant',
        )
        parser.add_argument(
            '--admin-email',
            default='admin@demo-vtc-company.com',
            help='Email for the tenant admin user',
        )

    def handle(self, *args, **options):
        name = options['name']
        email = options['email']
        admin_email = options['admin_email']

        self.stdout.write(
            self.style.SUCCESS(f'🏢 Creating demo tenant: {name}')
        )

        # Create tenant
        tenant, created = Client.objects.get_or_create(
            email=email,
            defaults={
                'name': name,
                'slug': slugify(name),
                'plan': 'business',
                'status': 'active',
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'✅ Tenant created: {tenant.name}')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️  Tenant already exists: {tenant.name}')
            )

        # Create tenant admin
        try:
            # Create admin user in tenant context
            username = admin_email.split('@')[0]
            from django_tenants.utils import tenant_context

            # Use schema context to create the user in the correct schema
            with tenant_context(tenant):
                tenant_admin = User.objects.create_user(
                    username=username,
                    email=admin_email,
                    password='admin123',
                    first_name='Tenant',
                    last_name='Admin',
                    tenant=tenant,
                    role='tenant-admin'
                )

                # Assign permissions
                assign_role_permissions(tenant_admin, 'tenant-admin')

            self.stdout.write(
                self.style.SUCCESS(f'✅ Tenant admin created: {admin_email}')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error creating tenant admin: {e}')
            )

        self.stdout.write(
            self.style.SUCCESS('\n📋 Demo tenant information:')
        )
        self.stdout.write(f'  Tenant: {tenant.name}')
        self.stdout.write(f'  Email: {tenant.email}')
        self.stdout.write(f'  Admin Email: {admin_email}')
        self.stdout.write(f'  Password: admin123')

        self.stdout.write(
            self.style.SUCCESS('\n✅ Demo tenant setup complete!')
        )
