"""
Django management command to test trial subscriptions
Allows creating, expiring, and managing trial subscriptions for testing
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from apps.billing.models import Subscription, PricingPlan
from apps.tenants.models import Client
from decimal import Decimal


class Command(BaseCommand):
    help = 'Test trial subscriptions - create, expire, or convert to active'

    def add_arguments(self, parser):
        parser.add_argument(
            '--action',
            type=str,
            choices=['create', 'expire', 'activate', 'status', 'advance-time'],
            default='status',
            help='Action to perform: create, expire, activate, status, or advance-time'
        )
        parser.add_argument(
            '--tenant-id',
            type=int,
            help='Tenant ID for the subscription'
        )
        parser.add_argument(
            '--plan-id',
            type=int,
            help='Pricing plan ID for the subscription'
        )
        parser.add_argument(
            '--trial-days',
            type=int,
            default=14,
            help='Number of days for trial period (default: 14)'
        )
        parser.add_argument(
            '--days-advance',
            type=int,
            help='Number of days to advance time (for testing expiration)'
        )
        parser.add_argument(
            '--all',
            action='store_true',
            help='Apply action to all trial subscriptions'
        )

    def handle(self, *args, **options):
        action = options['action']
        
        if action == 'create':
            self.create_trial_subscription(options)
        elif action == 'expire':
            self.expire_trial(options)
        elif action == 'activate':
            self.activate_trial(options)
        elif action == 'status':
            self.show_status(options)
        elif action == 'advance-time':
            self.advance_time(options)

    def create_trial_subscription(self, options):
        """Create a trial subscription for a tenant"""
        tenant_id = options.get('tenant_id')
        plan_id = options.get('plan_id')
        trial_days = options.get('trial_days', 14)
        
        if not tenant_id:
            self.stdout.write(
                self.style.ERROR('❌ --tenant-id is required for creating a trial subscription')
            )
            # List available tenants
            tenants = Client.objects.filter(deleted_at__isnull=True)[:10]
            if tenants:
                self.stdout.write('\n📋 Available tenants:')
                for tenant in tenants:
                    self.stdout.write(f'  • ID: {tenant.id} - {tenant.name} ({tenant.email})')
            return
        
        if not plan_id:
            self.stdout.write(
                self.style.ERROR('❌ --plan-id is required for creating a trial subscription')
            )
            # List available plans
            plans = PricingPlan.objects.all()[:10]
            if plans:
                self.stdout.write('\n📋 Available pricing plans:')
                for plan in plans:
                    self.stdout.write(f'  • ID: {plan.id} - {plan.name} ({plan.price_monthly}€/mois)')
            return
        
        try:
            tenant = Client.objects.get(id=tenant_id, deleted_at__isnull=True)
        except Client.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Tenant with ID {tenant_id} not found')
            )
            return
        
        try:
            plan = PricingPlan.objects.get(id=plan_id)
        except PricingPlan.DoesNotExist:
            self.stdout.write(
                self.style.ERROR(f'❌ Pricing plan with ID {plan_id} not found')
            )
            return
        
        # Check if tenant already has a subscription
        existing_sub = Subscription.objects.filter(tenant=tenant).first()
        if existing_sub:
            self.stdout.write(
                self.style.WARNING(
                    f'⚠️  Tenant {tenant.name} already has a subscription:'
                )
            )
            self.stdout.write(
                f'   Status: {existing_sub.status} | '
                f'Plan: {existing_sub.plan.name} | '
                f'Created: {existing_sub.created_at}'
            )
            response = input('Do you want to delete it and create a new trial? (yes/no): ')
            if response.lower() != 'yes':
                return
            existing_sub.delete()
            self.stdout.write(self.style.SUCCESS('   ✅ Old subscription deleted'))
        
        # Create trial subscription
        now = timezone.now()
        trial_start = now
        trial_end = now + timedelta(days=trial_days)
        
        subscription = Subscription.objects.create(
            tenant=tenant,
            plan=plan,
            status='trial',
            billing_cycle='monthly',
            trial_start=trial_start,
            trial_end=trial_end,
            current_period_start=trial_start,
            current_period_end=trial_end,
        )
        
        self.stdout.write(self.style.SUCCESS('✅ Trial subscription created!'))
        self.stdout.write(f'\n📋 Subscription details:')
        self.stdout.write(f'   Tenant: {tenant.name} ({tenant.email})')
        self.stdout.write(f'   Plan: {plan.name} ({plan.price_monthly}€/mois)')
        self.stdout.write(f'   Status: {subscription.status}')
        self.stdout.write(f'   Trial Start: {trial_start.strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'   Trial End: {trial_end.strftime("%Y-%m-%d %H:%M:%S")}')
        self.stdout.write(f'   Days remaining: {trial_days} days')
        self.stdout.write(f'\n💡 To test expiration, use:')
        self.stdout.write(f'   python manage.py test_trial --action=advance-time --days-advance={trial_days + 1}')
        self.stdout.write(f'💡 To activate now, use:')
        self.stdout.write(f'   python manage.py test_trial --action=activate --tenant-id={tenant_id}')

    def expire_trial(self, options):
        """Expire trial subscriptions"""
        tenant_id = options.get('tenant_id')
        all_trials = options.get('all', False)
        
        if not tenant_id and not all_trials:
            self.stdout.write(
                self.style.ERROR('❌ Either --tenant-id or --all is required')
            )
            return
        
        if all_trials:
            trials = Subscription.objects.filter(status='trial')
            self.stdout.write(f'⏰ Expiring {trials.count()} trial subscription(s)...')
            for sub in trials:
                sub.status = 'expired'
                sub.save(update_fields=['status'])
                self.stdout.write(
                    self.style.SUCCESS(f'   ✅ Expired: {sub.tenant.name} - {sub.plan.name}')
                )
        else:
            try:
                subscription = Subscription.objects.get(
                    tenant_id=tenant_id,
                    status='trial'
                )
                subscription.status = 'expired'
                subscription.save(update_fields=['status'])
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Expired trial for tenant {subscription.tenant.name}')
                )
            except Subscription.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ No trial subscription found for tenant ID {tenant_id}')
                )

    def activate_trial(self, options):
        """Convert trial subscription to active"""
        tenant_id = options.get('tenant_id')
        all_trials = options.get('all', False)
        
        if not tenant_id and not all_trials:
            self.stdout.write(
                self.style.ERROR('❌ Either --tenant-id or --all is required')
            )
            return
        
        if all_trials:
            trials = Subscription.objects.filter(status='trial')
            self.stdout.write(f'🔄 Activating {trials.count()} trial subscription(s)...')
            for sub in trials:
                now = timezone.now()
                sub.status = 'active'
                sub.trial_end = None
                sub.current_period_start = now
                if sub.billing_cycle == 'monthly':
                    sub.current_period_end = now + timedelta(days=30)
                else:
                    sub.current_period_end = now + timedelta(days=365)
                sub.save(update_fields=['status', 'trial_end', 'current_period_start', 'current_period_end'])
                self.stdout.write(
                    self.style.SUCCESS(f'   ✅ Activated: {sub.tenant.name} - {sub.plan.name}')
                )
        else:
            try:
                subscription = Subscription.objects.get(
                    tenant_id=tenant_id,
                    status='trial'
                )
                now = timezone.now()
                subscription.status = 'active'
                subscription.trial_end = None
                subscription.current_period_start = now
                if subscription.billing_cycle == 'monthly':
                    subscription.current_period_end = now + timedelta(days=30)
                else:
                    subscription.current_period_end = now + timedelta(days=365)
                subscription.save(update_fields=['status', 'trial_end', 'current_period_start', 'current_period_end'])
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✅ Activated trial for tenant {subscription.tenant.name}\n'
                        f'   New period: {subscription.current_period_start.strftime("%Y-%m-%d")} to '
                        f'{subscription.current_period_end.strftime("%Y-%m-%d")}'
                    )
                )
            except Subscription.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'❌ No trial subscription found for tenant ID {tenant_id}')
                )

    def advance_time(self, options):
        """Advance time for trial subscriptions (simulate expiration)"""
        days_advance = options.get('days_advance')
        if not days_advance:
            self.stdout.write(
                self.style.ERROR('❌ --days-advance is required')
            )
            return
        
        self.stdout.write(
            self.style.WARNING(f'⏰ Advancing time by {days_advance} days for trial subscriptions...')
        )
        
        trials = Subscription.objects.filter(status='trial')
        expired_count = 0
        
        for sub in trials:
            if sub.trial_end:
                # Check if trial would expire after advancing time
                new_trial_end = sub.trial_end - timedelta(days=days_advance)
                if new_trial_end <= timezone.now():
                    sub.status = 'expired'
                    sub.save(update_fields=['status'])
                    expired_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'   ✅ Expired: {sub.tenant.name} - {sub.plan.name} '
                            f'(was ending on {sub.trial_end.strftime("%Y-%m-%d")})'
                        )
                    )
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'   ⏳ Still active: {sub.tenant.name} - '
                            f'{new_trial_end.strftime("%Y-%m-%d")} remaining'
                        )
                    )
        
        if expired_count == 0:
            self.stdout.write(self.style.WARNING('   ℹ️  No trials expired with this time advance'))
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ {expired_count} trial(s) expired')
            )

    def show_status(self, options):
        """Show status of all trial subscriptions"""
        trials = Subscription.objects.filter(status='trial').select_related('tenant', 'plan')
        
        if not trials.exists():
            self.stdout.write(
                self.style.WARNING('⚠️  No trial subscriptions found')
            )
            return
        
        self.stdout.write(self.style.SUCCESS(f'\n📊 Found {trials.count()} trial subscription(s):\n'))
        
        now = timezone.now()
        for sub in trials:
            tenant = sub.tenant
            plan = sub.plan
            
            if sub.trial_end:
                days_remaining = (sub.trial_end - now).days
                if days_remaining < 0:
                    status_icon = '❌'
                    status_text = f'EXPIRED ({abs(days_remaining)} days ago)'
                elif days_remaining == 0:
                    status_icon = '⚠️'
                    status_text = 'EXPIRES TODAY'
                elif days_remaining <= 3:
                    status_icon = '🔴'
                    status_text = f'{days_remaining} days remaining'
                elif days_remaining <= 7:
                    status_icon = '🟡'
                    status_text = f'{days_remaining} days remaining'
                else:
                    status_icon = '🟢'
                    status_text = f'{days_remaining} days remaining'
            else:
                status_icon = '❓'
                status_text = 'No trial end date'
            
            self.stdout.write(
                f'{status_icon} {tenant.name} ({tenant.email})'
            )
            self.stdout.write(
                f'   Plan: {plan.name} ({plan.price_monthly}€/mois)'
            )
            if sub.trial_start:
                self.stdout.write(
                    f'   Trial Start: {sub.trial_start.strftime("%Y-%m-%d %H:%M:%S")}'
                )
            if sub.trial_end:
                self.stdout.write(
                    f'   Trial End: {sub.trial_end.strftime("%Y-%m-%d %H:%M:%S")} - {status_text}'
                )
            self.stdout.write(
                f'   ID: {sub.id} | Tenant ID: {tenant.id} | Plan ID: {plan.id}'
            )
            self.stdout.write('')
        
        self.stdout.write(self.style.SUCCESS('\n💡 Useful commands:'))
        self.stdout.write('   python manage.py test_trial --action=activate --tenant-id=<ID>')
        self.stdout.write('   python manage.py test_trial --action=expire --tenant-id=<ID>')
        self.stdout.write('   python manage.py test_trial --action=advance-time --days-advance=<DAYS>')

