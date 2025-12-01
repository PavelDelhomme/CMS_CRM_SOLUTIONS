'use client'

import { useEffect, useState } from 'react'
import pageService, { Page } from '@/services/page.service'
import ResponsiveTable from '@/components/ResponsiveTable'
import toast from 'react-hot-toast'
import { getTenantSlug } from '@/lib/tenant-utils'

interface TenantSiteTabProps {
  tenantId: number
  tenantName: string
  tenantSlug: string
}

export default function TenantSiteTab({ tenantId, tenantName, tenantSlug }: TenantSiteTabProps) {
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const tenantDomain = `${tenantSlug}.localhost:9494`

  useEffect(() => {
    loadPages()
  }, [tenantId])

  const loadPages = async () => {
    try {
      setLoading(true)
      // Super admin: load pages for specific tenant via tenant_id parameter
      const data = await pageService.getAll({ tenant_id: tenantId })
      const pagesArray = Array.isArray(data) ? data : (data?.results || data?.data || [])
      setPages(pagesArray)
    } catch (error) {
      console.error('Erreur chargement pages:', error)
      toast.error('Erreur lors du chargement des pages')
      setPages([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePage = () => {
    window.open(`http://${tenantDomain}/dashboard/pages/new`, '_blank')
  }

  const handleViewSite = () => {
    window.open(`http://${tenantDomain}`, '_blank')
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      draft: 'bg-yellow-100 text-yellow-800',
      published: 'bg-green-100 text-green-800',
      scheduled: 'bg-blue-100 text-blue-800',
    }
    return badges[status] || 'bg-gray-100 dark:bg-gray-900 text-gray-800'
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des pages...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Site Info */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Site Web de {tenantName}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              URL publique: <a href={`http://${tenantDomain}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-mono">{tenantDomain}</a>
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleViewSite}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🌐 Voir le site
            </button>
            <button
              onClick={handleCreatePage}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + Nouvelle page
            </button>
          </div>
        </div>
      </div>

      {/* Pages List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Pages du site</h3>
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune page trouvée pour ce tenant</p>
            <button
              onClick={handleCreatePage}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Créer une page →
            </button>
          </div>
        ) : (
          <ResponsiveTable
            headers={['Titre', 'Slug', 'Statut', 'Homepage', 'Créé le', 'Actions']}
            emptyMessage="Aucune page"
          >
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-gray-50 dark:bg-gray-900">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{page.title}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400 font-mono">/{page.slug}</div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(page.status)}`}>
                    {page.status === 'draft' ? 'Brouillon' : page.status === 'published' ? 'Publié' : 'Programmé'}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  {page.is_homepage ? (
                    <span className="text-blue-600 font-semibold">✓ Oui</span>
                  ) : (
                    <span className="text-gray-400">Non</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(page.created_at).toLocaleDateString('fr-FR')}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={`http://${tenantDomain}/dashboard/pages/${page.id}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-900"
                    title="Éditer la page"
                  >
                    ✏️ Éditer
                  </a>
                  {page.status === 'published' && (
                    <a
                      href={`http://${tenantDomain}/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-green-600 hover:text-green-900 ml-3"
                      title="Voir la page"
                    >
                      👁️ Voir
                    </a>
                  )}
                </td>
              </tr>
            ))}
          </ResponsiveTable>
        )}
      </div>

      {/* Quick Actions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h4 className="font-semibold text-blue-900 mb-3">💡 Accès rapide</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href={`http://${tenantDomain}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-blue-200"
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">📊 Dashboard Tenant</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Gérer le site complet</div>
          </a>
          <a
            href={`http://${tenantDomain}/dashboard/pages`}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-white dark:bg-gray-800 rounded-lg hover:shadow-md transition-shadow border border-blue-200"
          >
            <div className="font-semibold text-gray-900 dark:text-gray-100">📄 Gestion des Pages</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Créer et éditer les pages</div>
          </a>
        </div>
      </div>
    </div>
  )
}

