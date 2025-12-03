'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import billingService from '@/services/billing.service'
import type { Subscription, Invoice, PricingPlan } from '@/services/billing.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [stats, setStats] = useState({
    totalInvoiced: 0,
    totalPaid: 0,
    unpaidAmount: 0,
    invoicesCount: 0,
  })

  useEffect(() => {
    loadBillingData()
  }, [])

  const loadBillingData = async () => {
    try {
      // Charger l'abonnement actuel (gérer silencieusement les 404)
      try {
        const subscriptions = await billingService.getSubscriptions({ status: 'active' })
        if (subscriptions.length > 0) {
          setSubscription(subscriptions[0])
          // Charger les détails avec stats
          try {
            const details = await billingService.getSubscriptionDetails(subscriptions[0].id)
            setSubscription(details)
          } catch (error) {
            // Si l'endpoint details n'existe pas, utiliser les données de base
          }
        }
      } catch (error: any) {
        // 404 est attendu si l'endpoint n'existe pas encore
        if (error.response?.status !== 404 && 
            error.code !== 'ERR_NETWORK' && 
            error.code !== 'ERR_SOCKET_NOT_CONNECTED' && 
            error.code !== 'ERR_CONNECTION_RESET') {
          console.error('Erreur chargement abonnements:', error)
        }
      }

      // Charger les factures (gérer silencieusement les 404)
      let invoicesData: Invoice[] = []
      try {
        invoicesData = await billingService.getInvoices()
        setInvoices(invoicesData)
      } catch (error: any) {
        // 404 est attendu si l'endpoint n'existe pas encore
        if (error.response?.status !== 404 && 
            error.code !== 'ERR_NETWORK' && 
            error.code !== 'ERR_SOCKET_NOT_CONNECTED' && 
            error.code !== 'ERR_CONNECTION_RESET') {
          console.error('Erreur chargement factures:', error)
        }
      }

      // Calculer les stats
      const totalInvoiced = invoicesData.reduce((sum, inv) => sum + (inv.total || 0), 0)
      const totalPaid = invoicesData
        .filter(inv => inv.status === 'paid')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)
      const unpaidAmount = invoicesData
        .filter(inv => inv.status === 'open' || inv.status === 'draft')
        .reduce((sum, inv) => sum + (inv.total || 0), 0)

      setStats({
        totalInvoiced,
        totalPaid,
        unpaidAmount,
        invoicesCount: invoicesData.length,
      })

      // Charger les plans de tarification (gérer silencieusement les 404)
      try {
        const plans = await billingService.getPricingPlans()
        setPricingPlans(plans)
      } catch (error: any) {
        // 404 est attendu si l'endpoint n'existe pas encore
        if (error.response?.status !== 404 && 
            error.code !== 'ERR_NETWORK' && 
            error.code !== 'ERR_SOCKET_NOT_CONNECTED' && 
            error.code !== 'ERR_CONNECTION_RESET') {
          console.error('Erreur chargement plans:', error)
        }
      }
    } catch (error: any) {
      // Ne pas logger les erreurs réseau si le backend n'est pas disponible
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED' && error.code !== 'ERR_CONNECTION_RESET') {
        console.error('Erreur de chargement des données de facturation:', error)
      }
      // Ne pas afficher de toast pour les erreurs 404 (endpoints non implémentés)
      if (error.response?.status !== 404) {
        toast.error('Erreur lors du chargement des informations de facturation')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId: number) => {
    try {
      const blob = await billingService.downloadInvoicePdf(invoiceId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture-${invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Facture téléchargée avec succès')
    } catch (error: any) {
      console.error('Erreur téléchargement facture:', error)
      toast.error(error.response?.data?.error || 'Erreur lors du téléchargement')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      active: {
        label: 'Actif',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      },
      trial: {
        label: 'Essai',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      },
      past_due: {
        label: 'En retard',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      },
      cancelled: {
        label: 'Annulé',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
      expired: {
        label: 'Expiré',
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
      },
      paid: {
        label: 'Payée',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
      },
      open: {
        label: 'En attente',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
      },
      draft: {
        label: 'Brouillon',
        className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
      },
    }
    return statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number, currency: string = 'EUR') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  if (loading) {
    return (
      <TenantLayout title="Facturation" subtitle="Gérez votre abonnement et vos factures">
        <PageLoader text="Chargement des informations de facturation..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Facturation" 
      subtitle="Gérez votre abonnement et vos factures"
    >
      <Toaster position="top-right" />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Facturé</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {formatCurrency(stats.totalInvoiced)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Payé</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(stats.totalPaid)}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Impayé</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {formatCurrency(stats.unpaidAmount)}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Factures</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {stats.invoicesCount}
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Abonnement actuel */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Abonnement actuel</h2>
            {subscription && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(subscription.status).className}`}>
                {getStatusBadge(subscription.status).label}
              </span>
            )}
          </div>
          {subscription ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Plan</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {subscription.plan?.name || 'Plan Standard'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Période de facturation</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 capitalize">
                    {subscription.billing_cycle === 'monthly' ? 'Mensuel' : 'Annuel'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Période actuelle</p>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Montant</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {subscription.billing_cycle === 'monthly' 
                      ? formatCurrency(subscription.plan?.price_monthly || 0, subscription.plan?.currency || 'EUR')
                      : formatCurrency(subscription.plan?.price_yearly || 0, subscription.plan?.currency || 'EUR')
                    } / {subscription.billing_cycle === 'monthly' ? 'mois' : 'an'}
                  </p>
                </div>
              </div>
              {subscription.trial_end && new Date(subscription.trial_end) > new Date() && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Période d'essai</strong> jusqu'au {formatDate(subscription.trial_end)}
                  </p>
                </div>
              )}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => router.push('/dashboard/billing/plans')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                >
                  Changer de plan
                </button>
                {subscription.status === 'active' && (
                  <button
                    onClick={async () => {
                      if (confirm('Êtes-vous sûr de vouloir annuler votre abonnement ?')) {
                        try {
                          await billingService.cancelSubscription(subscription.id)
                          toast.success('Abonnement annulé')
                          loadBillingData()
                        } catch (error: any) {
                          toast.error(error.response?.data?.error || 'Erreur lors de l\'annulation')
                        }
                      }
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Annuler l'abonnement
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun abonnement actif</p>
              <button
                onClick={() => router.push('/dashboard/billing/plans')}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Choisir un plan
              </button>
            </div>
          )}
        </div>

        {/* Historique des factures */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Historique des factures</h2>
          {invoices.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 dark:text-gray-400">Aucune facture pour le moment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Numéro
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {invoices.map((invoice) => {
                    const statusConfig = getStatusBadge(invoice.status)
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {invoice.invoice_number || `#${invoice.id}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(invoice.issue_date)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {formatCurrency(invoice.total, invoice.currency)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusConfig.className}`}>
                            {statusConfig.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDownloadInvoice(invoice.id)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                          >
                            Télécharger
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TenantLayout>
  )
}
