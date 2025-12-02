'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pageService from '@/services/page.service'
import type { Page } from '@/services/page.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function PagesManagement() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const data = await pageService.getAll()
      setPages(data)
    } catch (error) {
      toast.error('Erreur de chargement des pages')
      console.error('Erreur de chargement des pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (pageId: number) => {
    try {
      await pageService.publish(pageId)
      toast.success('Page publiée avec succès !')
      loadPages()
    } catch (error) {
      toast.error('Erreur lors de la publication')
      console.error('Erreur lors de la publication:', error)
    }
  }

  const handleDuplicate = async (pageId: number) => {
    try {
      await pageService.duplicate(pageId)
      toast.success('Page dupliquée avec succès !')
      loadPages()
    } catch (error) {
      toast.error('Erreur lors de la duplication')
      console.error('Erreur lors de la duplication:', error)
    }
  }

  const handleDelete = async (pageId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ? Cette action est irréversible.')) return

    try {
      await pageService.delete(pageId)
      toast.success('Page supprimée avec succès')
      loadPages()
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error('Erreur lors de la suppression:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: {
        label: 'Brouillon',
        className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800',
        icon: '📝'
      },
      published: {
        label: 'Publié',
        className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
        icon: '✅'
      },
      scheduled: {
        label: 'Programmé',
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
        icon: '📅'
      }
    }
    return statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
  }

  // Filter pages
  const filteredPages = pages.filter(page => {
    const matchesSearch = page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         page.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         page.meta_description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || page.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const headerActions = (
    <button
      onClick={() => router.push('/dashboard/pages/new')}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Nouvelle Page
    </button>
  )

  if (loading) {
    return (
      <TenantLayout title="Gestion des Pages" subtitle="Chargement...">
        <PageLoader text="Chargement des pages..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Gestion des Pages" 
      subtitle="Créez et gérez les pages de votre site web"
      headerActions={headerActions}
    >
      <Toaster position="top-right" />

      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher une page..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'draft', 'published', 'scheduled'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'Toutes' : status === 'draft' ? 'Brouillons' : status === 'published' ? 'Publiées' : 'Programmées'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{pages.length}</p>
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Publiées</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {pages.filter(p => p.status === 'published').length}
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
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Brouillons</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                {pages.filter(p => p.status === 'draft').length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Résultats</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{filteredPages.length}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Pages Grid */}
      {filteredPages.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {pages.length === 0 ? 'Aucune page créée' : 'Aucune page trouvée'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {pages.length === 0 
                ? 'Commencez par créer votre première page pour votre site web.'
                : 'Essayez de modifier vos critères de recherche ou de filtre.'}
            </p>
            {pages.length === 0 && (
              <button
                onClick={() => router.push('/dashboard/pages/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer ma première page
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredPages.map((page) => {
            const statusConfig = getStatusBadge(page.status)
            return (
              <div
                key={page.id}
                className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                {/* Header with Status */}
                <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate mb-1">
                        {page.title || 'Sans titre'}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                        /{page.slug || 'sans-slug'}
                      </p>
                    </div>
                    {page.is_homepage && (
                      <span className="ml-2 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                        🏠 Accueil
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border ${statusConfig.className}`}>
                      <span>{statusConfig.icon}</span>
                      {statusConfig.label}
                    </span>
                  </div>
                </div>

                {/* Content */}
                {page.meta_description && (
                  <div className="p-4 sm:p-6 pt-0 sm:pt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {page.meta_description}
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="p-4 sm:p-6 pt-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-center gap-2 flex-wrap">
                    {page.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(page.id)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="hidden sm:inline">Publier</span>
                      </button>
                    )}
                    <button
                      onClick={() => router.push(`/dashboard/pages/${page.id}/edit`)}
                      className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span className="hidden sm:inline">Éditer</span>
                    </button>
                    <button
                      onClick={() => handleDuplicate(page.id)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-gray-600 hover:bg-gray-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                      title="Dupliquer"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      className="px-3 sm:px-4 py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors"
                      title="Supprimer"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </TenantLayout>
  )
}
