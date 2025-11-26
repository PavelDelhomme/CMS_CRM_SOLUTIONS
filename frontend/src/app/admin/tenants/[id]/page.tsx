'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from '@/components/AdminSidebar'
import tenantService, { Tenant } from '@/services/tenant.service'
import toast from 'react-hot-toast'

function AdminDebugSection({ tenantId }: { tenantId: number }) {
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('admin123')

  useEffect(() => {
    loadAdminInfo()
  }, [tenantId])

  const loadAdminInfo = async () => {
    try {
      setLoading(true)
      const info = await tenantService.getAdminInfo(tenantId)
      setAdminInfo(info)
    } catch (error) {
      console.error('Erreur chargement info admin:', error)
      setAdminInfo({ exists: false })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm(`Réinitialiser le mot de passe de ${adminInfo?.email || 'l\'admin'} en "${password}" ?`)) {
      return
    }

    try {
      setResetting(true)
      const result = await tenantService.resetAdminPassword(tenantId, password)
      setShowPassword(true)
      toast.success('Mot de passe réinitialisé avec succès !')
      loadAdminInfo()
    } catch (error: any) {
      console.error('Erreur réinitialisation mot de passe:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Chargement des informations admin...</p>
      </div>
    )
  }

  if (!adminInfo || !adminInfo.exists) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔐 Informations Admin (Debug)</h3>
        <p className="text-yellow-800">{adminInfo?.message || 'Aucun utilisateur admin trouvé pour ce tenant'}</p>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-900 mb-4">🔐 Informations Admin (Debug)</h3>
      
      <dl className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <dt className="text-sm font-medium text-yellow-800">Email Admin</dt>
          <dd className="mt-1 text-sm text-yellow-900 font-mono">{adminInfo.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-yellow-800">Username</dt>
          <dd className="mt-1 text-sm text-yellow-900 font-mono">{adminInfo.username}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-yellow-800">Statut</dt>
          <dd className="mt-1 text-sm text-yellow-900 capitalize">{adminInfo.status}</dd>
        </div>
      </dl>

      <div className="border-t border-yellow-300 pt-4 mt-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="password" className="block text-sm font-medium text-yellow-800 mb-2">
              Mot de passe à définir
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="admin123"
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={resetting || !password}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? 'Réinitialisation...' : 'Réinitialiser'}
          </button>
        </div>

        {showPassword && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 mb-1">✅ Mot de passe réinitialisé !</p>
            <p className="text-xs text-yellow-800">
              Email: <span className="font-mono font-semibold">{adminInfo.email}</span>
            </p>
            <p className="text-xs text-yellow-800">
              Mot de passe: <span className="font-mono font-semibold">{password}</span>
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Vous pouvez maintenant vous connecter avec ces identifiants sur{' '}
              <a
                href="http://localhost:9494/login"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                http://localhost:9494/login
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

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
            <div className="space-y-6">
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

              <AdminDebugSection tenantId={tenantId!} />
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

