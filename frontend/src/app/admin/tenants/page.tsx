'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from '@/components/AdminSidebar'
import tenantService, { Tenant } from '@/services/tenant.service'

export default function TenantsPage() {
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadTenants()
  }, [router])

  const loadTenants = async () => {
    try {
      const response = await tenantService.getAll()
      setTenants(response.results || response || [])
    } catch (error) {
      console.error('Erreur chargement tenants:', error)
      setTenants([])
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir suspendre ce tenant ?')) return
    try {
      await tenantService.suspend(id)
      loadTenants()
    } catch (error) {
      console.error('Erreur suspension:', error)
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await tenantService.activate(id)
      loadTenants()
    } catch (error) {
      console.error('Erreur activation:', error)
    }
  }

  const handleDelete = async (id: number, tenantName: string) => {
    const confirmMessage = `⚠️ SUPPRESSION TEMPORAIRE ⚠️\n\nVous êtes sur le point de marquer le tenant "${tenantName}" comme supprimé.\n\nCette action va :\n- Marquer le tenant comme supprimé (soft delete)\n- Le tenant sera définitivement supprimé après 1 mois\n- Vous pouvez le restaurer avant ce délai\n- Si le tenant a un abonnement actif, les utilisateurs seront désactivés au lieu d'être supprimés\n\nTapez "SUPPRIMER" pour confirmer :`
    
    const userInput = prompt(confirmMessage)
    if (userInput !== 'SUPPRIMER') {
      return
    }
    
    try {
      const result = await tenantService.delete(id)
      alert(result.message || 'Tenant marqué comme supprimé. Il sera définitivement supprimé après 1 mois. Vous pouvez le restaurer avant ce délai.')
      loadTenants()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert(error.response?.data?.error || 'Erreur lors de la suppression du tenant')
    }
  }

  const handleRestore = async (id: number, tenantName: string) => {
    if (!confirm(`Restaurer le tenant "${tenantName}" ?`)) return
    
    try {
      const result = await tenantService.restore(id)
      alert(result.message || 'Tenant restauré avec succès')
      loadTenants()
    } catch (error: any) {
      console.error('Erreur restauration:', error)
      alert(error.response?.data?.error || 'Erreur lors de la restauration du tenant')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800',
      trial: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-gray-100 text-gray-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getPlanBadge = (plan: string) => {
    const badges = {
      starter: 'bg-blue-100 text-blue-800',
      business: 'bg-purple-100 text-purple-800',
      enterprise: 'bg-indigo-100 text-indigo-800',
    }
    return badges[plan as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(search.toLowerCase()) ||
    tenant.email.toLowerCase().includes(search.toLowerCase())
  )

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

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestion des Tenants</h1>
              <p className="text-sm text-gray-600 mt-1">Gérez tous vos clients et leurs sites</p>
            </div>
            <button
              onClick={() => router.push('/admin/tenants/new')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
            >
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouveau Tenant
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher un tenant..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tenants List */}
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Créé le
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTenants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {search ? 'Aucun tenant trouvé' : 'Aucun tenant pour le moment'}
                    </td>
                  </tr>
                ) : (
                  filteredTenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{tenant.name}</div>
                            {tenant.slug && (
                              <div className="text-sm text-gray-500">/{tenant.slug}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPlanBadge(tenant.plan)}`}>
                          {tenant.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(tenant.status)}`}>
                          {tenant.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {tenant.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Voir détails"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                          {tenant.deleted_at ? (
                            // Tenant is soft deleted - show restore button
                            <button
                              onClick={() => handleRestore(tenant.id, tenant.name)}
                              className="text-green-600 hover:text-green-900"
                              title="Restaurer le tenant"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          ) : (
                            <>
                              {tenant.status === 'active' ? (
                                <button
                                  onClick={() => handleSuspend(tenant.id)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="Suspendre"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleActivate(tenant.id)}
                                  className="text-green-600 hover:text-green-900"
                                  title="Activer"
                                >
                                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                                  </svg>
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(tenant.id, tenant.name)}
                                className="text-red-600 hover:text-red-900"
                                title="Marquer comme supprimé (récupérable pendant 1 mois)"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  )
}

