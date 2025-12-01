"""
Django management command to sync tenant features with their subscription plans
"""
from django.core.management.base import BaseCommand
from tenants.models import Client
from apps.billing.models import Subscription
from tenants.utils import sync_tenant_features


class Command(BaseCommand):
    help = 'Synchronise les fonctionnalités de tous les tenants avec leurs plans d\'abonnement'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant-id',
            type=int,
            help='ID du tenant spécifique à synchroniser (optionnel)',
        )

    def handle(self, *args, **options):
        tenant_id = options.get('tenant_id')
        
        self.stdout.write(
            self.style.SUCCESS('🔄 Synchronisation des fonctionnalités des tenants...\n')
        )
        
        if tenant_id:
            # Synchroniser un tenant spécifique
            try:
                tenant = Client.objects.get(id=tenant_id)
                self.stdout.write(f'📦 Tenant: {tenant.name} (ID: {tenant.id})\n')
                result = sync_tenant_features(tenant)
                
                if 'error' in result:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ Erreur: {result["error"]}')
                    )
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ Synchronisé: {result["enabled"]} activées, '
                            f'{result["disabled"]} désactivées, '
                            f'{result["features_count"]} features disponibles'
                        )
                    )
            except Client.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ Tenant avec ID {tenant_id} non trouvé')
                )
        else:
            # Synchroniser tous les tenants actifs
            tenants = Client.objects.filter(
                deleted_at__isnull=True,
                status__in=['active', 'trial']
            )
            
            total_enabled = 0
            total_disabled = 0
            processed = 0
            errors = 0
            
            for tenant in tenants:
                self.stdout.write(f'\n📦 Tenant: {tenant.name} (ID: {tenant.id})')
                result = sync_tenant_features(tenant)
                
                if 'error' in result:
                    self.stdout.write(
                        self.style.ERROR(f'  ❌ Erreur: {result["error"]}')
                    )
                    errors += 1
                else:
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ {result["enabled"]} activées, '
                            f'{result["disabled"]} désactivées'
                        )
                    )
                    total_enabled += result.get('enabled', 0)
                    total_disabled += result.get('disabled', 0)
                    processed += 1
            
            self.stdout.write('\n' + '='*60)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Résumé:')
            )
            self.stdout.write(f'  - Tenants traités: {processed}')
            self.stdout.write(f'  - Fonctionnalités activées: {total_enabled}')
            self.stdout.write(f'  - Fonctionnalités désactivées: {total_disabled}')
            if errors > 0:
                self.stdout.write(
                    self.style.WARNING(f'  - Erreurs: {errors}')
                )
            self.stdout.write('='*60)
            self.stdout.write('\n✅ Terminé !')

