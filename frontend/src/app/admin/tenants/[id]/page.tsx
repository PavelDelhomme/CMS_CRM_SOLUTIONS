'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from '@/components/AdminSidebar'
import tenantService, { Tenant } from '@/services/tenant.service'

type Tab = 'overview' | 'users' | 'billing' | 'site' | 'settings'

export default function TenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id ? parseInt(params.id as string) : null
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    if (tenantId) {
      loadTenant()
    }
  }, [router, tenantId])

  const loadTenant = async () => {
    try {
      const data = await tenantService.getById(tenantId!)
      setTenant(data)
    } catch (error) {
      console.error('Erreur chargement tenant:', error)
      router.push('/admin/tenants')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return null
  }

  const tabs = [
    { id: 'overview' as Tab, name: 'Vue d\'ensemble', icon: '📊' },
    { id: 'users' as Tab, name: 'Utilisateurs', icon: '👥' },
    { id: 'billing' as Tab, name: 'Facturation', icon: '💳' },
    { id: 'site' as Tab, name: 'Site Web', icon: '🌐' },
    { id: 'settings' as Tab, name: 'Paramètres', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/tenants')}
                  className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
                >
                  <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour aux tenants
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                <p className="text-sm text-gray-600 mt-1">{tenant.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                  tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                  tenant.plan === 'business' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.plan}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Informations du Tenant</h2>
              <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Nom</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Slug</dt>
                  <dd className="mt-1 text-sm text-gray-900">/{tenant.slug}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.plan}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Statut</dt>
                  <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                  </dd>
                </div>
              </dl>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Utilisateurs</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Ajouter un utilisateur
                </button>
              </div>
              <p className="text-gray-600">Liste des utilisateurs de ce tenant (à implémenter)</p>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Facturation</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Nouvel abonnement
                </button>
              </div>
              <p className="text-gray-600">Gestion des abonnements et factures (à implémenter)</p>
            </div>
          )}

          {activeTab === 'site' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestion du Site Web</h2>
                <a
                  href={`http://${tenant.slug}.localhost:9494`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Voir le site
                </a>
              </div>
              <p className="text-gray-600">Interface de gestion du site (éditeur WordPress-style à implémenter)</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
              <p className="text-gray-600">Paramètres du tenant (à implémenter)</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

