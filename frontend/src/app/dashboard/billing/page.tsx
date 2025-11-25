'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import TenantLayout from '@/components/TenantLayout'
import billingService, { Subscription, Invoice, Payment, PricingPlan } from '@/services/billing.service'
import ResponsiveTable from '@/components/ResponsiveTable'

export default function TenantBillingPage() {
  const router = useRouter()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'subscription' | 'invoices' | 'payments' | 'plans'>('subscription')

  useEffect(() => {
    const currentUser = authService.getStoredUser()
    if (!currentUser || authService.isSuperAdmin()) {
      router.push('/admin/dashboard')
      return
    }
    loadBillingData()
  }, [router])

  const loadBillingData = async () => {
    try {
      const [subs, invs, pays, plans] = await Promise.all([
        billingService.getSubscriptions(),
        billingService.getInvoices(),
        billingService.getPayments(),
        billingService.getPricingPlans(),
      ])
      
      setSubscription(subs[0] || null)
      setInvoices(invs)
      setPayments(pays)
      setPricingPlans(plans)
    } catch (error) {
      console.error('Erreur chargement facturation:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgradePlan = async (planId: number) => {
    if (!confirm('Voulez-vous vraiment changer de plan ?')) return
    
    try {
      if (subscription) {
        // Update existing subscription
        await billingService.createSubscription({
          plan_id: planId,
          tenant_id: authService.getStoredUser()?.tenant_id,
        })
      } else {
        // Create new subscription
        await billingService.createSubscription({
          plan_id: planId,
          tenant_id: authService.getStoredUser()?.tenant_id,
        })
      }
      loadBillingData()
      alert('Plan mis à jour avec succès !')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de la mise à jour du plan')
    }
  }

  const handleCancelSubscription = async () => {
    if (!subscription) return
    
    if (!confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) return
    
    try {
      await billingService.cancelSubscription(subscription.id)
      loadBillingData()
      alert('Abonnement annulé')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erreur lors de l\'annulation')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      expired: 'bg-gray-100 text-gray-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getInvoiceStatusBadge = (status: string) => {
    const badges = {
      paid: 'bg-green-100 text-green-800',
      open: 'bg-yellow-100 text-yellow-800',
      draft: 'bg-gray-100 text-gray-800',
      void: 'bg-red-100 text-red-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <TenantLayout title="Facturation">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Facturation" 
      subtitle="Gérez votre abonnement et vos paiements"
    >
      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab('subscription')}
            className={`py-2 px-4 border-b-2 font-medium text-sm whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Mon Abonnement
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
            Plans Disponibles
          </button>
        </nav>
      </div>

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {subscription ? (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{subscription.plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{subscription.plan.description}</p>
                </div>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadge(subscription.status)}`}>
                  {subscription.status}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div>
                  <p className="text-sm text-gray-600">Prix</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {subscription.billing_cycle === 'monthly' 
                      ? `${subscription.plan.price_monthly}€/mois`
                      : `${subscription.plan.price_yearly}€/an`
                    }
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Période actuelle</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(subscription.current_period_start).toLocaleDateString('fr-FR')} - {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cycle de facturation</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">
                    {subscription.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </p>
                </div>
              </div>

              {subscription.status === 'active' && (
                <div className="mt-6">
                  <button
                    onClick={handleCancelSubscription}
                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                  >
                    Annuler l'abonnement
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">Vous n'avez pas d'abonnement actif.</p>
              <button
                onClick={() => setActiveTab('plans')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Choisir un plan
              </button>
            </div>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <ResponsiveTable
            headers={['N° Facture', 'Date', 'Montant', 'Statut', 'Actions']}
            emptyMessage="Aucune facture pour le moment"
          >
            {invoices.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  Aucune facture pour le moment
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {invoice.invoice_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(invoice.issue_date).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                    {invoice.total} {invoice.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getInvoiceStatusBadge(invoice.status)}`}>
                      {invoice.status === 'paid' ? 'Payée' : invoice.status === 'open' ? 'En attente' : invoice.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {invoice.pdf_url && (
                      <a
                        href={invoice.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Télécharger PDF
                      </a>
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
            headers={['Date', 'Montant', 'Méthode', 'Statut']}
            emptyMessage="Aucun paiement pour le moment"
          >
            {payments.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                  Aucun paiement pour le moment
                </td>
              </tr>
            ) : (
              payments.map((payment) => (
                <tr key={payment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {payment.paid_at ? new Date(payment.paid_at).toLocaleDateString('fr-FR') : '-'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {pricingPlans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-lg shadow-lg p-6 ${
                plan.is_featured ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              {plan.is_featured && (
                <div className="text-center mb-4">
                  <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                    Populaire
                  </span>
                </div>
              )}
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-4 text-sm">{plan.description}</p>
              
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">{plan.price_monthly}€</span>
                <span className="text-gray-600">/mois</span>
                {plan.price_yearly && (
                  <p className="text-sm text-gray-500 mt-1">
                    ou {plan.price_yearly}€/an (économisez {((plan.price_monthly * 12) - plan.price_yearly).toFixed(2)}€)
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.max_sites} site{plan.max_sites > 1 ? 's' : ''}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''}
                </li>
                <li className="flex items-center text-sm text-gray-600">
                  <svg className="h-5 w-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {plan.max_storage_gb} Go de stockage
                </li>
              </ul>

              <button
                onClick={() => handleUpgradePlan(plan.id)}
                className={`w-full py-2 px-4 rounded-lg font-medium transition ${
                  plan.is_featured
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
              >
                {subscription?.plan.id === plan.id ? 'Plan actuel' : 'Choisir ce plan'}
              </button>
            </div>
          ))}
        </div>
      )}
    </TenantLayout>
  )
}

