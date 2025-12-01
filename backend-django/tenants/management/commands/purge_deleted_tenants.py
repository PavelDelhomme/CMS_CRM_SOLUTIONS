"""
Command to permanently delete tenants that have been soft deleted for more than 1 month
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from django.db import connection, transaction
from tenants.models import Tenant, User, InvitationToken, PasswordResetToken, Domain
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Permanently delete tenants that have been soft deleted for more than 1 month'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be deleted without actually deleting',
        )
        parser.add_argument(
            '--days',
            type=int,
            default=30,
            help='Number of days after which to permanently delete (default: 30)',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        days = options['days']
        
        cutoff_date = timezone.now() - timedelta(days=days)
        
        # Find tenants soft deleted more than 'days' ago
        deleted_tenants = Tenant.objects.filter(
            deleted_at__isnull=False,
            deleted_at__lte=cutoff_date
        )
        
        count = deleted_tenants.count()
        
        if count == 0:
            self.stdout.write(
                self.style.SUCCESS(f'✅ No tenants to purge (deleted for more than {days} days)')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'⚠️  Found {count} tenant(s) to purge permanently')
        )
        
        if dry_run:
            self.stdout.write(self.style.WARNING('🔍 DRY RUN MODE - No deletions will be performed'))
            for tenant in deleted_tenants:
                self.stdout.write(f'  - {tenant.name} (ID: {tenant.id}) - Deleted: {tenant.deleted_at}')
            return
        
        # Confirm
        self.stdout.write(
            self.style.ERROR(
                f'⚠️  WARNING: This will permanently delete {count} tenant(s) and all associated data!'
            )
        )
        
        deleted_count = 0
        errors = []
        
        for tenant in deleted_tenants:
            try:
                with transaction.atomic():
                    schema_name = tenant.schema_name
                    tenant_id = tenant.id
                    tenant_name = tenant.name
                    
                    self.stdout.write(f'🗑️  Purging tenant: {tenant_name} (ID: {tenant_id})...')
                    
                    # Get tenant users first
                    tenant_users = list(User.objects.filter(tenant=tenant).values_list('id', flat=True))
                    
                    # Delete invitation tokens
                    InvitationToken.objects.filter(tenant=tenant).delete()
                    
                    # Delete password reset tokens
                    if tenant_users:
                        PasswordResetToken.objects.filter(user_id__in=tenant_users).delete()
                    
                    # Delete users
                    for user_id in tenant_users:
                        try:
                            User.objects.filter(id=user_id).delete()
                        except Exception as e:
                            logger.warning(f"Could not delete user {user_id}: {str(e)}")
                    
                    # Delete Domain objects
                    Domain.objects.filter(tenant=tenant).delete()
                    
                    # Drop schema via SQL
                    if schema_name:
                        try:
                            with connection.cursor() as cursor:
                                cursor.execute(f'DROP SCHEMA IF EXISTS "{schema_name}" CASCADE;')
                                logger.info(f"Dropped schema {schema_name} for tenant {tenant_id}")
                        except Exception as schema_error:
                            logger.warning(f"Could not drop schema {schema_name}: {str(schema_error)}")
                    
                    # Delete tenant record
                    Tenant.objects.filter(id=tenant_id).delete()
                    
                    deleted_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(f'✅ Tenant {tenant_name} purged successfully')
                    )
            except Exception as e:
                error_msg = f'❌ Error purging tenant {tenant.name}: {str(e)}'
                errors.append(error_msg)
                logger.error(error_msg, exc_info=True)
                self.stdout.write(self.style.ERROR(error_msg))
        
        # Summary
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✅ Successfully purged {deleted_count} tenant(s)'))
        if errors:
            self.stdout.write(self.style.ERROR(f'❌ {len(errors)} error(s) occurred'))
            for error in errors:
                self.stdout.write(self.style.ERROR(f'  - {error}'))

