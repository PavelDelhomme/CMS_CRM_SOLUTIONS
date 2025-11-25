'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import billingService, { Subscription, Invoice, Payment, PricingPlan } from '@/services/billing.service'
import ResponsiveTable from '@/components/ResponsiveTable'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'subscriptions' | 'invoices' | 'payments' | 'plans'>('overview')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadBillingData()
  }, [router])

  const loadBillingData = async () => {
    try {
      const [statsData, subs, invs, pays, plans] = await Promise.all([
        billingService.getBillingStats(),
        billingService.getSubscriptions(),
        billingService.getInvoices(),
        billingService.getPayments(),
        billingService.getPricingPlans(),
      ])
      
      setStats(statsData)
      setSubscriptions(subs)
      setInvoices(invs)
      setPayments(pays)
      setPricingPlans(plans)
    } catch (error) {
      console.error('Erreur chargement facturation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkInvoicePaid = async (id: number) => {
    if (!confirm('Marquer cette facture comme payée ?')) return
    
    try {
      await billingService.markInvoicePaid(id)
      loadBillingData()
      alert('Facture marquée comme payée')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
      paid: 'bg-green-100 text-green-800',
      open: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      succeeded: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <AdminLayout title="Facturation">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Facturation"
      subtitle="Gestion complète de la facturation et des paiements"
    >
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Vue d'ensemble
          </button>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'subscriptions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Abonnements ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'invoices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Factures ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'payments'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Paiements ({payments.length})
          </button>
          <button
            onClick={() => setActiveTab('plans')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'plans'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Plans Tarifaires ({pricingPlans.length})
          </button>
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Revenus Totaux</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total_revenue?.toFixed(2) || '0.00'}€</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Revenus Mensuels</p>
            <p className="text-3xl font-bold text-green-600">{stats.monthly_revenue?.toFixed(2) || '0.00'}€</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Abonnements Actifs</p>
            <p className="text-3xl font-bold text-blue-600">{stats.active_subscriptions || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-2">Factures Impayées</p>
            <p className="text-3xl font-bold text-red-600">{stats.unpaid_invoices || 0}</p>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ResponsiveTable
            headers={['Tenant', 'Plan', 'Statut', 'Cycle', 'Période', 'Actions']}
            emptyMessage="Aucun abonnement"
          >
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Aucun abonnement
                </td>
              </tr>
            ) : (
              subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {sub.tenant?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {sub.plan.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(sub.status)}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {sub.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(sub.current_period_start).toLocaleDateString('fr-FR')} - {new Date(sub.current_period_end).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {sub.status === 'cancelled' && (
                      <button
                        onClick={async () => {
                          try {
                            await billingService.reactivateSubscription(sub.id)
                            loadBillingData()
                            alert('Abonnement réactivé')
                          } catch (error: any) {
                            alert(error.response?.data?.error || 'Erreur')
                          }
                        }}
                        className="text-green-600 hover:text-green-900 mr-2"
                      >
                        Réactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </ResponsiveTable>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ResponsiveTable
            headers={['N° Facture', 'Tenant', 'Date', 'Montant', 'Statut', 'Actions']}
            emptyMessage="Aucune facture"
          >
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  Aucune facture
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {invoice.tenant?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {invoice.total} {invoice.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(invoice.status)}`}>
                      {invoice.status === 'paid' ? 'Payée' : invoice.status === 'open' ? 'En attente' : invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {invoice.status !== 'paid' && (
                      <button
                        onClick={() => handleMarkInvoicePaid(invoice.id)}
                        className="text-green-600 hover:text-green-900"
                      >
                        Marquer payée
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </ResponsiveTable>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ResponsiveTable
            headers={['Date', 'Tenant', 'Montant', 'Méthode', 'Statut']}
            emptyMessage="Aucun paiement"
          >
            {payments.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Aucun paiement
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('fr-FR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.tenant?.name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {payment.amount} {payment.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                    {payment.method === 'card' ? 'Carte bancaire' : payment.method}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                      {payment.status === 'succeeded' ? 'Réussi' : payment.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </ResponsiveTable>
        </div>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Plans Tarifaires</h2>
            <button
              onClick={() => alert('Fonctionnalité à venir : Créer un nouveau plan')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              + Nouveau Plan
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => (
              <div key={plan.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  {plan.is_featured && (
                    <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Populaire</span>
                  )}
                </div>
                <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">{plan.price_monthly}€</span>
                  <span className="text-gray-600">/mois</span>
                </div>
                <ul className="space-y-2 mb-4 text-sm text-gray-600">
                  <li>• {plan.max_sites} site{plan.max_sites > 1 ? 's' : ''}</li>
                  <li>• {plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''}</li>
                  <li>• {plan.max_storage_gb} Go de stockage</li>
                </ul>
                <button
                  onClick={() => alert('Fonctionnalité à venir : Modifier le plan')}
                  className="w-full bg-gray-100 text-gray-900 py-2 rounded-lg hover:bg-gray-200"
                >
                  Modifier
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

