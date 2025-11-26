"""
General API views
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import connection
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta
from tenants.models import Tenant, User


class DashboardView(APIView):
    """Dashboard view with basic statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get dashboard statistics"""
        user = request.user

        # Base stats with all required fields
        stats = {
            'total_tenants': 0,
            'active_tenants': 0,
            'trial_tenants': 0,
            'total_users': 0,
            'total_pages': 0,
            'total_services': 0,
            'total_bookings': 0,
            'monthly_revenue': 0,
        }

        if user.is_super_admin():
            # Super admin sees all stats (exclude soft-deleted tenants)
            stats.update({
                'total_tenants': Tenant.objects.filter(deleted_at__isnull=True).count(),
                'active_tenants': Tenant.objects.filter(status='active', deleted_at__isnull=True).count(),
                'trial_tenants': Tenant.objects.filter(status='trial', deleted_at__isnull=True).count(),
                'total_users': User.objects.count(),
            })
        elif hasattr(user, 'tenant') and user.tenant:
            # Tenant admin sees tenant-specific stats
            tenant = user.tenant

            # Count related objects for this tenant
            try:
                # Switch to tenant context for counting
                from django_tenants.utils import tenant_context
                from pages.models import Page
                from services.models import Service
                from bookings.models import Booking
                
                with tenant_context(tenant):
                    stats.update({
                        'total_users': User.objects.filter(tenant=tenant).count(),
                        'total_pages': Page.objects.count(),
                        'total_services': Service.objects.count(),
                        'total_bookings': Booking.objects.count(),
                    })
            except Exception as e:
                # If tenant context fails, just return base stats
                pass

        return Response({'stats': stats})


class DetailedStatsView(APIView):
    """Detailed statistics view for super admin with comprehensive monitoring"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get detailed statistics with alerts and monitoring"""
        user = request.user
        
        if not user.is_super_admin():
            return Response(
                {'error': 'Only super admin can access detailed statistics'},
                status=403
            )
        
        # Exclude soft-deleted tenants
        tenants_qs = Tenant.objects.filter(deleted_at__isnull=True)
        now = timezone.now()
        today = now.date()
        week_ago = now - timedelta(days=7)
        month_ago = now - timedelta(days=30)
        twelve_months_ago = now - timedelta(days=365)
        
        # Basic counts
        total_tenants = tenants_qs.count()
        active_tenants = tenants_qs.filter(status='active').count()
        trial_tenants = tenants_qs.filter(status='trial').count()
        suspended_tenants = tenants_qs.filter(status='suspended').count()
        cancelled_tenants = tenants_qs.filter(status='cancelled').count()
        total_users = User.objects.count()
        
        # Users by status
        users_by_status = User.objects.values('status').annotate(count=Count('id'))
        
        # Users by role
        users_by_role = User.objects.values('role').annotate(count=Count('id'))
        
        # Tenants by plan
        tenants_by_plan = tenants_qs.values('plan').annotate(count=Count('id'))
        
        # Tenants by status
        tenants_by_status = tenants_qs.values('status').annotate(count=Count('id'))
        
        # Inscriptions récentes (aujourd'hui, cette semaine, ce mois)
        users_today = User.objects.filter(created_at__date=today).count()
        users_this_week = User.objects.filter(created_at__gte=week_ago).count()
        users_this_month = User.objects.filter(created_at__gte=month_ago).count()
        
        # Tenants créés récemment
        tenants_today = tenants_qs.filter(created_at__date=today).count()
        tenants_this_week = tenants_qs.filter(created_at__gte=week_ago).count()
        tenants_this_month = tenants_qs.filter(created_at__gte=month_ago).count()
        
        # Tenants created over time (last 12 months)
        tenants_by_month = tenants_qs.filter(
            created_at__gte=twelve_months_ago
        ).extra(
            select={'month': "DATE_TRUNC('month', created_at)"}
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Users created over time (last 12 months)
        users_by_month = User.objects.filter(
            created_at__gte=twelve_months_ago
        ).extra(
            select={'month': "DATE_TRUNC('month', created_at)"}
        ).values('month').annotate(count=Count('id')).order_by('month')
        
        # Users created by day (last 7 days) for trend
        users_by_day = User.objects.filter(
            created_at__gte=week_ago
        ).extra(
            select={'day': "DATE(created_at)"}
        ).values('day').annotate(count=Count('id')).order_by('day')
        
        # Tenants created by day (last 7 days)
        tenants_by_day = tenants_qs.filter(
            created_at__gte=week_ago
        ).extra(
            select={'day': "DATE(created_at)"}
        ).values('day').annotate(count=Count('id')).order_by('day')
        
        # Revenue stats (from billing)
        monthly_revenue = 0
        total_revenue = 0
        try:
            from billing.models import Invoice, Payment, Subscription
            
            # Get current month revenue
            current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            monthly_revenue = Payment.objects.filter(
                status='succeeded',
                paid_at__gte=current_month_start
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Total revenue
            total_revenue = Payment.objects.filter(
                status='succeeded'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            # Active subscriptions
            active_subscriptions = Subscription.objects.filter(status='active').count()
            trial_subscriptions = Subscription.objects.filter(status='trial').count()
            past_due_subscriptions = Subscription.objects.filter(status='past_due').count()
            cancelled_subscriptions = Subscription.objects.filter(status='cancelled').count()
            
            # Revenue by month (last 12 months)
            revenue_by_month = Payment.objects.filter(
                status='succeeded',
                paid_at__gte=twelve_months_ago
            ).extra(
                select={'month': "DATE_TRUNC('month', paid_at)"}
            ).values('month').annotate(total=Sum('amount')).order_by('month')
            
            # Subscriptions expiring soon (next 7 days)
            expiring_soon = Subscription.objects.filter(
                status__in=['active', 'trial'],
                current_period_end__lte=now + timedelta(days=7),
                current_period_end__gte=now
            ).count()
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not load billing stats: {str(e)}")
            active_subscriptions = 0
            trial_subscriptions = 0
            past_due_subscriptions = 0
            cancelled_subscriptions = 0
            expiring_soon = 0
            revenue_by_month = []
        
        # Demandes d'inscription (InvitationToken non utilisées)
        try:
            from tenants.models import InvitationToken, PasswordResetToken
            
            pending_invitations = InvitationToken.objects.filter(
                used=False,
                expires_at__gte=now
            ).count()
            
            expired_invitations = InvitationToken.objects.filter(
                used=False,
                expires_at__lt=now
            ).count()
            
            # Password reset requests (last 7 days)
            password_resets_last_week = PasswordResetToken.objects.filter(
                created_at__gte=week_ago
            ).count()
            
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Could not load invitation stats: {str(e)}")
            pending_invitations = 0
            expired_invitations = 0
            password_resets_last_week = 0
        
        # Problèmes et alertes
        alerts = []
        
        # Tenants sans utilisateurs actifs
        tenants_without_active_users = []
        for tenant in tenants_qs.filter(status__in=['active', 'trial'])[:20]:  # Limiter pour performance
            active_user_count = User.objects.filter(tenant=tenant, status='active').count()
            if active_user_count == 0:
                tenants_without_active_users.append({
                    'id': tenant.id,
                    'name': tenant.name,
                    'email': tenant.email,
                    'status': tenant.status,
                })
        
        if tenants_without_active_users:
            alerts.append({
                'type': 'warning',
                'severity': 'medium',
                'title': f'{len(tenants_without_active_users)} tenant(s) sans utilisateurs actifs',
                'description': 'Ces tenants n\'ont aucun utilisateur actif. Ils pourraient avoir besoin d\'aide.',
                'count': len(tenants_without_active_users),
                'items': tenants_without_active_users[:5],  # Limiter à 5 pour l'affichage
            })
        
        # Tenants suspendus
        if suspended_tenants > 0:
            alerts.append({
                'type': 'error',
                'severity': 'high',
                'title': f'{suspended_tenants} tenant(s) suspendu(s)',
                'description': 'Des tenants ont été suspendus. Vérifiez la raison.',
                'count': suspended_tenants,
            })
        
        # Tenants annulés
        if cancelled_tenants > 0:
            alerts.append({
                'type': 'warning',
                'severity': 'medium',
                'title': f'{cancelled_tenants} tenant(s) annulé(s)',
                'description': 'Des tenants ont annulé leur abonnement.',
                'count': cancelled_tenants,
            })
        
        # Abonnements en retard
        if past_due_subscriptions > 0:
            alerts.append({
                'type': 'error',
                'severity': 'high',
                'title': f'{past_due_subscriptions} abonnement(s) en retard de paiement',
                'description': 'Des abonnements nécessitent une attention pour le paiement.',
                'count': past_due_subscriptions,
            })
        
        # Abonnements expirant bientôt
        if expiring_soon > 0:
            alerts.append({
                'type': 'warning',
                'severity': 'medium',
                'title': f'{expiring_soon} abonnement(s) expire(nt) dans les 7 prochains jours',
                'description': 'Ces abonnements vont expirer bientôt.',
                'count': expiring_soon,
            })
        
        # Invitations expirées
        if expired_invitations > 0:
            alerts.append({
                'type': 'info',
                'severity': 'low',
                'title': f'{expired_invitations} invitation(s) expirée(s)',
                'description': 'Des invitations n\'ont pas été utilisées et ont expiré.',
                'count': expired_invitations,
            })
        
        # Utilisateurs en attente (pending) depuis plus de 7 jours
        users_pending_old = User.objects.filter(
            status='pending',
            created_at__lt=week_ago
        ).count()
        if users_pending_old > 0:
            alerts.append({
                'type': 'warning',
                'severity': 'medium',
                'title': f'{users_pending_old} utilisateur(s) en attente depuis plus de 7 jours',
                'description': 'Ces utilisateurs n\'ont pas complété leur inscription.',
                'count': users_pending_old,
            })
        
        # Activity stats (recent activity)
        recent_tenants = tenants_qs.order_by('-created_at')[:10]
        recent_users = User.objects.order_by('-created_at')[:10]
        
        # Utilisateurs récemment suspendus/inactifs
        recently_suspended_users = User.objects.filter(
            status__in=['suspended', 'inactive'],
            updated_at__gte=week_ago
        ).count()
        
        stats = {
            'overview': {
                'total_tenants': total_tenants,
                'active_tenants': active_tenants,
                'trial_tenants': trial_tenants,
                'suspended_tenants': suspended_tenants,
                'cancelled_tenants': cancelled_tenants,
                'total_users': total_users,
                'active_subscriptions': active_subscriptions,
                'trial_subscriptions': trial_subscriptions,
                'past_due_subscriptions': past_due_subscriptions,
                'cancelled_subscriptions': cancelled_subscriptions,
                'expiring_soon_subscriptions': expiring_soon,
            },
            'activity': {
                'users_today': users_today,
                'users_this_week': users_this_week,
                'users_this_month': users_this_month,
                'tenants_today': tenants_today,
                'tenants_this_week': tenants_this_week,
                'tenants_this_month': tenants_this_month,
                'recently_suspended_users': recently_suspended_users,
                'password_resets_last_week': password_resets_last_week,
            },
            'registrations': {
                'pending_invitations': pending_invitations,
                'expired_invitations': expired_invitations,
                'users_by_day': [{'day': str(r['day']), 'count': r['count']} for r in users_by_day],
                'tenants_by_day': [{'day': str(r['day']), 'count': r['count']} for r in tenants_by_day],
            },
            'users_by_role': list(users_by_role),
            'users_by_status': list(users_by_status),
            'tenants_by_plan': list(tenants_by_plan),
            'tenants_by_status': list(tenants_by_status),
            'tenants_by_month': list(tenants_by_month),
            'users_by_month': list(users_by_month),
            'revenue': {
                'monthly': float(monthly_revenue),
                'total': float(total_revenue),
                'by_month': [{'month': r['month'], 'total': float(r['total'])} for r in revenue_by_month],
            },
            'alerts': alerts,
            'recent_tenants': [
                {
                    'id': t.id,
                    'name': t.name,
                    'email': t.email,
                    'status': t.status,
                    'plan': t.plan,
                    'created_at': t.created_at.isoformat(),
                }
                for t in recent_tenants
            ],
            'recent_users': [
                {
                    'id': u.id,
                    'name': u.get_full_name() or u.username,
                    'email': u.email,
                    'role': u.role,
                    'status': u.status,
                    'tenant_name': u.tenant.name if u.tenant else None,
                    'created_at': u.created_at.isoformat(),
                }
                for u in recent_users
            ],
        }
        
        return Response(stats)
