'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import api from '@/lib/api'

interface DetailedStats {
  overview: {
    total_tenants: number
    active_tenants: number
    trial_tenants: number
    suspended_tenants: number
    cancelled_tenants: number
    total_users: number
    active_subscriptions: number
    trial_subscriptions: number
    past_due_subscriptions: number
    cancelled_subscriptions: number
    expiring_soon_subscriptions: number
  }
  activity: {
    users_today: number
    users_this_week: number
    users_this_month: number
    tenants_today: number
    tenants_this_week: number
    tenants_this_month: number
    recently_suspended_users: number
    password_resets_last_week: number
  }
  registrations: {
    pending_invitations: number
    expired_invitations: number
    users_by_day: Array<{ day: string; count: number }>
    tenants_by_day: Array<{ day: string; count: number }>
  }
  users_by_role: Array<{ role: string; count: number }>
  users_by_status: Array<{ status: string; count: number }>
  tenants_by_plan: Array<{ plan: string; count: number }>
  tenants_by_status: Array<{ status: string; count: number }>
  tenants_by_month: Array<{ month: string; count: number }>
  users_by_month: Array<{ month: string; count: number }>
  revenue: {
    monthly: number
    total: number
    by_month: Array<{ month: string; total: number }>
  }
  alerts: Array<{
    type: 'error' | 'warning' | 'info'
    severity: 'high' | 'medium' | 'low'
    title: string
    description: string
    count: number
    items?: Array<{ id: number; name: string; email?: string; status?: string }>
  }>
  recent_tenants: Array<{
    id: number
    name: string
    email: string
    status: string
    plan: string
    created_at: string
  }>
  recent_users: Array<{
    id: number
    name: string
    email: string
    role: string
    status: string
    tenant_name: string | null
    created_at: string
  }>
}

export default function StatsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DetailedStats | null>(null)

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadStats()
  }, [router])

  const loadStats = async () => {
    try {
      const response = await api.get('/stats/detailed/')
      setStats(response.data)
    } catch (error: any) {
      console.error('Erreur chargement statistiques:', error)
      // Si 404, l'endpoint n'est pas disponible - probablement backend non redémarré
      if (error.response?.status === 404) {
        console.warn('⚠️ Endpoint /api/stats/detailed/ non disponible (404). Veuillez redémarrer le backend Django.')
        // Initialiser avec des valeurs vides pour éviter les erreurs d'affichage
        setStats({
          overview: {
            total_tenants: 0,
            active_tenants: 0,
            trial_tenants: 0,
            suspended_tenants: 0,
            cancelled_tenants: 0,
            total_users: 0,
            active_subscriptions: 0,
            trial_subscriptions: 0,
            past_due_subscriptions: 0,
            cancelled_subscriptions: 0,
            expiring_soon_subscriptions: 0,
          },
          activity: {},
          registrations: {
            pending_invitations: 0,
            expired_invitations: 0,
            users_by_day: [],
            tenants_by_day: [],
          },
          users_by_role: [],
          users_by_status: [],
          tenants_by_plan: [],
          tenants_by_status: [],
          tenants_by_month: [],
          users_by_month: [],
          revenue: { monthly: 0, total: 0, by_month: [] },
          alerts: [],
        } as DetailedStats)
      }
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', { 
      month: 'short', 
      year: 'numeric' 
    }).format(date)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', { 
      style: 'currency', 
      currency: 'EUR' 
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num)
  }

  if (loading) {
    return (
      <AdminLayout title="Statistiques Détaillées" subtitle="Chargement...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des statistiques...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!stats) {
    return (
      <AdminLayout title="Statistiques Détaillées" subtitle="Erreur">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-800">Erreur lors du chargement des statistiques.</p>
        </div>
      </AdminLayout>
    )
  }

  const formatDay = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', { 
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }).format(date)
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'warning':
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const getAlertColor = (type: string, severity: string) => {
    if (type === 'error' || severity === 'high') {
      return 'bg-red-50 border-red-200 text-red-800'
    }
    if (type === 'warning' || severity === 'medium') {
      return 'bg-yellow-50 border-yellow-200 text-yellow-800'
    }
    return 'bg-blue-50 border-blue-200 text-blue-800'
  }

  return (
    <AdminLayout 
      title="Statistiques Détaillées" 
      subtitle="Analyses et métriques de la plateforme avec monitoring complet"
    >
      <div className="space-y-6">
        {/* Alertes et Problèmes */}
        {stats.alerts && stats.alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="h-6 w-6 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Alertes et Problèmes ({stats.alerts.length})
            </h2>
            <div className="space-y-3">
              {stats.alerts.map((alert, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-4 ${getAlertColor(alert.type, alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="mt-0.5">{getAlertIcon(alert.type)}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{alert.title}</h3>
                        <p className="text-sm opacity-90">{alert.description}</p>
                        {alert.items && alert.items.length > 0 && (
                          <div className="mt-3 space-y-1">
                            {alert.items.map((item) => (
                              <div key={item.id} className="text-sm opacity-75 flex items-center space-x-2">
                                <span>• {item.name}</span>
                                {item.email && <span className="text-xs">({item.email})</span>}
                                {item.status && (
                                  <span className="text-xs px-2 py-0.5 bg-white/50 rounded">{item.status}</span>
                                )}
                              </div>
                            ))}
                            {alert.count > alert.items.length && (
                              <p className="text-xs italic opacity-75">
                                + {alert.count - alert.items.length} autre(s)
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-2xl font-bold ml-4">{alert.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activité Récente */}
        {stats && stats.activity && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Activité Récente</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.activity.users_today}</p>
                <p className="text-xs text-gray-600 mt-1">Utilisateurs<br />Aujourd'hui</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{stats.activity.users_this_week}</p>
                <p className="text-xs text-gray-600 mt-1">Utilisateurs<br />Cette semaine</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-2xl font-bold text-purple-600">{stats.activity.users_this_month}</p>
                <p className="text-xs text-gray-600 mt-1">Utilisateurs<br />Ce mois</p>
              </div>
              <div className="text-center p-4 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-600">{stats.activity.tenants_today}</p>
                <p className="text-xs text-gray-600 mt-1">Tenants<br />Aujourd'hui</p>
              </div>
              <div className="text-center p-4 bg-pink-50 rounded-lg">
                <p className="text-2xl font-bold text-pink-600">{stats.activity.tenants_this_week}</p>
                <p className="text-xs text-gray-600 mt-1">Tenants<br />Cette semaine</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{stats.activity.tenants_this_month}</p>
                <p className="text-xs text-gray-600 mt-1">Tenants<br />Ce mois</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{stats.activity.password_resets_last_week}</p>
                <p className="text-xs text-gray-600 mt-1">Reset mot de passe<br />7 derniers jours</p>
              </div>
            </div>
          </div>
        )}

        {/* Demandes d'inscription */}
        {stats && stats.registrations && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Demandes d'Inscription</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{stats.registrations.pending_invitations}</p>
                <p className="text-sm text-gray-600 mt-1">Invitations en attente</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-600">{stats.registrations.expired_invitations}</p>
                <p className="text-sm text-gray-600 mt-1">Invitations expirées</p>
              </div>
              {stats.activity.recently_suspended_users > 0 && (
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{stats.activity.recently_suspended_users}</p>
                  <p className="text-sm text-gray-600 mt-1">Utilisateurs suspendus (7j)</p>
                </div>
              )}
            </div>
            {/* Graphique des inscriptions par jour */}
            {stats.registrations && stats.registrations.users_by_day && stats.registrations.tenants_by_day && 
             (stats.registrations.users_by_day.length > 0 || stats.registrations.tenants_by_day.length > 0) && (
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Inscriptions par jour (7 derniers jours)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Utilisateurs par jour */}
                  {stats.registrations.users_by_day.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Utilisateurs</h4>
                      <div className="space-y-2">
                        {stats.registrations.users_by_day.map((item) => (
                          <div key={item.day}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">{formatDay(item.day)}</span>
                              <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-green-500 h-2 rounded-full"
                                style={{
                                  width: `${(item.count / Math.max(...stats.registrations.users_by_day.map(d => d.count), 1)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Tenants par jour */}
                  {stats.registrations.tenants_by_day.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Tenants</h4>
                      <div className="space-y-2">
                        {stats.registrations.tenants_by_day.map((item) => (
                          <div key={item.day}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs text-gray-600">{formatDay(item.day)}</span>
                              <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full"
                                style={{
                                  width: `${(item.count / Math.max(...stats.registrations.tenants_by_day.map(d => d.count), 1)) * 100}%`
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Tenants</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.overview.total_tenants)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 font-medium">{stats.overview.active_tenants} actifs</span>
              <span className="text-gray-400 mx-2">•</span>
              <span className="text-yellow-600">{stats.overview.trial_tenants} en trial</span>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Utilisateurs</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.overview.total_users)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenu Mensuel</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatCurrency(stats.revenue.monthly)}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <svg className="h-8 w-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm text-gray-600">Total: {formatCurrency(stats.revenue.total)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Abonnements</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{formatNumber(stats.overview.active_subscriptions)}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <p className="text-sm text-gray-600">{stats.overview.trial_subscriptions} en trial</p>
              {stats.overview.past_due_subscriptions > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  ⚠️ {stats.overview.past_due_subscriptions} en retard
                </p>
              )}
              {stats.overview.expiring_soon_subscriptions > 0 && (
                <p className="text-sm text-yellow-600 font-medium">
                  ⚠️ {stats.overview.expiring_soon_subscriptions} expire(nt) bientôt
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Cartes supplémentaires pour les statuts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.overview.suspended_tenants > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Tenants Suspendus</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{formatNumber(stats.overview.suspended_tenants)}</p>
                </div>
                <div className="p-3 bg-red-100 rounded-full">
                  <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          {stats.overview.cancelled_tenants > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Tenants Annulés</p>
                  <p className="text-3xl font-bold text-yellow-900 mt-2">{formatNumber(stats.overview.cancelled_tenants)}</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-full">
                  <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          {stats.registrations && stats.registrations.pending_invitations > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Invitations en Attente</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{formatNumber(stats.registrations.pending_invitations)}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tenants by Plan */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenants par Plan</h3>
            <div className="space-y-4">
              {stats.tenants_by_plan && stats.tenants_by_plan.length > 0 ? (
                stats.tenants_by_plan.map((item) => (
                  <div key={item.plan}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">{item.plan}</span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / stats.overview.total_tenants) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun plan trouvé</p>
              )}
            </div>
          </div>

          {/* Users by Role */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs par Rôle</h3>
            <div className="space-y-4">
              {stats.users_by_role && stats.users_by_role.length > 0 ? (
                stats.users_by_role.map((item) => (
                  <div key={item.role}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{item.role}</span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{
                          width: `${(item.count / stats.overview.total_users) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun utilisateur trouvé</p>
              )}
            </div>
          </div>

          {/* Users by Status */}
          {stats.users_by_status && stats.users_by_status.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs par Statut</h3>
              <div className="space-y-4">
                {stats.users_by_status.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.status === 'active' ? 'Actif' : 
                         item.status === 'inactive' ? 'Inactif' : 
                         item.status === 'suspended' ? 'Suspendu' : 
                         item.status === 'pending' ? 'En attente' : item.status}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === 'active' ? 'bg-green-600' :
                          item.status === 'suspended' ? 'bg-red-600' :
                          item.status === 'pending' ? 'bg-yellow-600' :
                          'bg-gray-600'
                        }`}
                        style={{
                          width: `${(item.count / stats.overview.total_users) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenants by Status */}
          {stats.tenants_by_status && stats.tenants_by_status.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenants par Statut</h3>
              <div className="space-y-4">
                {stats.tenants_by_status.map((item) => (
                  <div key={item.status}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 capitalize">
                        {item.status === 'active' ? 'Actif' : 
                         item.status === 'trial' ? 'En trial' : 
                         item.status === 'suspended' ? 'Suspendu' : 
                         item.status === 'cancelled' ? 'Annulé' : item.status}
                      </span>
                      <span className="text-sm font-bold text-gray-900">{item.count}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          item.status === 'active' ? 'bg-green-600' :
                          item.status === 'trial' ? 'bg-yellow-600' :
                          item.status === 'suspended' ? 'bg-red-600' :
                          item.status === 'cancelled' ? 'bg-gray-600' :
                          'bg-blue-600'
                        }`}
                        style={{
                          width: `${(item.count / stats.overview.total_tenants) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Tenants */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tenants Récemment Créés</h3>
            <div className="space-y-4">
              {stats.recent_tenants.map((tenant) => (
                <div key={tenant.id} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{tenant.name}</p>
                    <p className="text-xs text-gray-500">{tenant.email}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDate(tenant.created_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                      tenant.status === 'trial' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {tenant.status}
                    </span>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                      {tenant.plan}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Utilisateurs Récemment Inscrits</h3>
            <div className="space-y-4">
              {stats.recent_users && stats.recent_users.length > 0 ? (
                stats.recent_users.map((user) => (
                  <div key={user.id} className="flex items-center justify-between pb-4 border-b border-gray-200 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{user.name || user.email}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      {user.tenant_name && (
                        <p className="text-xs text-gray-400 mt-1">{user.tenant_name}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        {user.status && (
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            user.status === 'active' ? 'bg-green-100 text-green-800' :
                            user.status === 'suspended' ? 'bg-red-100 text-red-800' :
                            user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.status === 'active' ? 'Actif' : 
                             user.status === 'suspended' ? 'Suspendu' : 
                             user.status === 'pending' ? 'En attente' : 
                             user.status === 'inactive' ? 'Inactif' : user.status}
                          </span>
                        )}
                        <span className="text-xs text-gray-400">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800">
                      {user.role}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">Aucun utilisateur récent</p>
              )}
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        {stats.revenue.by_month.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenu par Mois (12 derniers mois)</h3>
            <div className="space-y-4">
              {stats.revenue.by_month.map((item) => (
                <div key={item.month}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{formatDate(item.month)}</span>
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(item.total)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full"
                      style={{
                        width: `${(item.total / Math.max(...stats.revenue.by_month.map(r => r.total))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
