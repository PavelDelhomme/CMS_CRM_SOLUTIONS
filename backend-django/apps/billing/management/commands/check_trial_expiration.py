"""
Management command to check and update expired trials
Amélioré pour gérer les notifications et le passage automatique à expired/active
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from billing.models import Subscription
from apps.tenants.models import Client
from apps.settings_app.models import SystemSettings
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Vérifie et met à jour les trials expirés, envoie des notifications'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Affiche les changements sans les appliquer',
        )
        parser.add_argument(
            '--send-notifications',
            action='store_true',
            default=True,
            help='Envoie des notifications avant expiration (par défaut: True)',
        )
        parser.add_argument(
            '--no-notifications',
            action='store_true',
            help='Ne pas envoyer de notifications',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        send_notifications = options['send_notifications'] and not options['no_notifications']
        
        self.stdout.write(self.style.SUCCESS('🔄 Vérification des trials expirés...'))
        
        # Récupérer les paramètres système
        system_settings = SystemSettings.get_settings()
        notification_days = system_settings.trial_notification_days or [7, 3, 1, 0]
        auto_expire = system_settings.trial_auto_expire
        
        now = timezone.now()
        expired_count = 0
        activated_count = 0
        expiring_soon_count = 0
        notifications_sent = 0
        
        # 1. Vérifier les subscriptions expirées
        expired_subscriptions = Subscription.objects.filter(
            status='trial',
            trial_end__lt=now
        ).select_related('tenant', 'plan')
        
        for subscription in expired_subscriptions:
            tenant = subscription.tenant
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠️  Trial expiré: {tenant.name} (Subscription ID: {subscription.id})'
                    )
                )
            else:
                # Vérifier si le tenant a payé (a une souscription active)
                has_active_payment = Subscription.objects.filter(
                    tenant=tenant,
                    status='active'
                ).exclude(id=subscription.id).exists()
                
                if has_active_payment:
                    # Le tenant a une souscription active, passer celle-ci à cancelled
                    subscription.status = 'cancelled'
                    subscription.save(update_fields=['status'])
                    activated_count += 1
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ Subscription trial annulée (souscription active trouvée): {tenant.name}'
                        )
                    )
                elif auto_expire:
                    # Passer à expired
                    subscription.status = 'expired'
                    subscription.save(update_fields=['status'])
                    
                    # Mettre à jour le statut du tenant si nécessaire
                    if tenant.status == 'trial':
                        tenant.status = 'expired'
                        tenant.save(update_fields=['status'])
                    
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'  ✅ Trial expiré mis à jour: {tenant.name}'
                        )
                    )
                    expired_count += 1
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⚠️  Trial expiré mais auto_expire désactivé: {tenant.name}'
                        )
                    )
        
        # 2. Vérifier les tenants avec trial_ends_at expiré (sans subscription)
        expired_tenants = Client.objects.filter(
            status='trial',
            trial_ends_at__lt=now,
            deleted_at__isnull=True
        )
        
        for tenant in expired_tenants:
            # Vérifier si le tenant a une subscription
            if hasattr(tenant, 'subscription'):
                # Subscription status should already be updated above
                continue
            
            if dry_run:
                self.stdout.write(
                    self.style.WARNING(
                        f'  ⚠️  Tenant trial expiré: {tenant.name} (Tenant ID: {tenant.id})'
                    )
                )
            elif auto_expire:
                tenant.status = 'expired'
                tenant.save(update_fields=['status'])
                
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✅ Tenant trial expiré mis à jour: {tenant.name}'
                    )
                )
                expired_count += 1
        
        # 3. Envoyer les notifications avant expiration
        if send_notifications:
            self.stdout.write(self.style.SUCCESS('\n📧 Vérification des notifications...'))
            
            # Récupérer toutes les subscriptions en trial qui expirent bientôt
            max_notification_days = max(notification_days) if notification_days else 7
            expiring_soon_subscriptions = Subscription.objects.filter(
                status='trial',
                trial_end__gte=now,
                trial_end__lte=now + timedelta(days=max_notification_days)
            ).select_related('tenant', 'plan')
            
            for subscription in expiring_soon_subscriptions:
                tenant = subscription.tenant
                days_remaining = (subscription.trial_end - now).days
                
                # Vérifier si on doit envoyer une notification pour ce nombre de jours
                if days_remaining in notification_days:
                    try:
                        self._send_notification(tenant, subscription, days_remaining, system_settings)
                        notifications_sent += 1
                        expiring_soon_count += 1
                    except Exception as e:
                        logger.error(f"Error sending notification to {tenant.email}: {e}", exc_info=True)
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ❌ Erreur envoi notification à {tenant.email}: {e}'
                            )
                        )
            
            # Vérifier aussi les tenants sans subscription
            expiring_tenants = Client.objects.filter(
                status='trial',
                trial_ends_at__gte=now,
                trial_ends_at__lte=now + timedelta(days=max_notification_days),
                deleted_at__isnull=True
            )
            
            for tenant in expiring_tenants:
                if hasattr(tenant, 'subscription'):
                    continue  # Déjà traité ci-dessus
                
                days_remaining = (tenant.trial_ends_at - now).days
                if days_remaining in notification_days:
                    try:
                        self._send_notification_tenant(tenant, days_remaining, system_settings)
                        notifications_sent += 1
                        expiring_soon_count += 1
                    except Exception as e:
                        logger.error(f"Error sending notification to {tenant.email}: {e}", exc_info=True)
                        self.stdout.write(
                            self.style.ERROR(
                                f'  ❌ Erreur envoi notification à {tenant.email}: {e}'
                            )
                        )
        
        # Résumé
        self.stdout.write(self.style.SUCCESS(f'\n✅ Vérification terminée !'))
        self.stdout.write(f'  - Trials expirés: {expired_count}')
        self.stdout.write(f'  - Trials activés: {activated_count}')
        if send_notifications:
            self.stdout.write(f'  - Trials expirant bientôt: {expiring_soon_count}')
            self.stdout.write(f'  - Notifications envoyées: {notifications_sent}')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\n⚠️  Mode dry-run: aucun changement appliqué')
            )

    def _send_notification(self, tenant, subscription, days_remaining, system_settings):
        """Send notification email to tenant about trial expiration"""
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
            billing_url = f"{frontend_url}/dashboard/billing"
            
            if days_remaining == 0:
                subject = f'Votre période d\'essai expire aujourd\'hui - {tenant.name}'
                urgency = 'immédiatement'
                days_text = "aujourd'hui"
            elif days_remaining == 1:
                subject = f'Votre période d\'essai expire demain - {tenant.name}'
                urgency = 'dès maintenant'
                days_text = "demain"
            elif days_remaining <= 3:
                subject = f'Votre période d\'essai expire dans {days_remaining} jours - {tenant.name}'
                urgency = 'bientôt'
                days_text = f"dans {days_remaining} jours"
            else:
                subject = f'Votre période d\'essai expire dans {days_remaining} jours - {tenant.name}'
                urgency = 'prochainement'
                days_text = f"dans {days_remaining} jours"
            
            trial_end_date = subscription.trial_end.strftime('%d/%m/%Y à %H:%M')
            
            message = f'''
Bonjour,

Votre période d'essai pour VTCBuilder expire {days_text} ({trial_end_date}).

Pour continuer à utiliser nos services, veuillez souscrire à un plan d'abonnement {urgency}.

Plan actuel: {subscription.plan.name}
Prix: {subscription.plan.price_monthly}€/mois

Accédez à votre espace de facturation pour souscrire:
{billing_url}

Cordialement,
L'équipe VTCBuilder
            '''
            
            html_message = f'''
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Votre période d'essai expire {days_text}</h2>
                <p>Bonjour,</p>
                <p>Votre période d'essai pour VTCBuilder expire <strong>{days_text}</strong> ({trial_end_date}).</p>
                <p>Pour continuer à utiliser nos services, veuillez souscrire à un plan d'abonnement {urgency}.</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Plan actuel:</strong> {subscription.plan.name}</p>
                    <p><strong>Prix:</strong> {subscription.plan.price_monthly}€/mois</p>
                </div>
                <p><a href="{billing_url}" style="background-color: #3B82F6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Accéder à la facturation</a></p>
                <p>Cordialement,<br>L'équipe VTCBuilder</p>
            </body>
            </html>
            '''
            
            send_mail(
                subject=subject,
                message=message,
                from_email=system_settings.email_from,
                recipient_list=[tenant.email],
                html_message=html_message,
                fail_silently=False,
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'  📧 Notification envoyée à {tenant.email} ({days_remaining} jours restants)'
                )
            )
        except Exception as e:
            logger.error(f"Error sending trial expiration notification to {tenant.email}: {e}", exc_info=True)
            raise

    def _send_notification_tenant(self, tenant, days_remaining, system_settings):
        """Send notification email to tenant without subscription"""
        try:
            frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:9494')
            billing_url = f"{frontend_url}/dashboard/billing"
            
            if days_remaining == 0:
                subject = f'Votre période d\'essai expire aujourd\'hui - {tenant.name}'
                urgency = 'immédiatement'
                days_text = "aujourd'hui"
            elif days_remaining == 1:
                subject = f'Votre période d\'essai expire demain - {tenant.name}'
                urgency = 'dès maintenant'
                days_text = "demain"
            else:
                subject = f'Votre période d\'essai expire dans {days_remaining} jours - {tenant.name}'
                urgency = 'bientôt'
                days_text = f"dans {days_remaining} jours"
            
            trial_end_date = tenant.trial_ends_at.strftime('%d/%m/%Y à %H:%M')
            
            message = f'''
Bonjour,

Votre période d'essai pour VTCBuilder expire {days_text} ({trial_end_date}).

Pour continuer à utiliser nos services, veuillez souscrire à un plan d'abonnement {urgency}.

Accédez à votre espace de facturation pour souscrire:
{billing_url}

Cordialement,
L'équipe VTCBuilder
            '''
            
            send_mail(
                subject=subject,
                message=message,
                from_email=system_settings.email_from,
                recipient_list=[tenant.email],
                fail_silently=False,
            )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'  📧 Notification envoyée à {tenant.email} ({days_remaining} jours restants)'
                )
            )
        except Exception as e:
            logger.error(f"Error sending trial expiration notification to {tenant.email}: {e}", exc_info=True)
            raise
