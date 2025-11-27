'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import pageService, { Page } from '@/services/page.service'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'
import toast from 'react-hot-toast'

export default function VisualPageEditor() {
  const router = useRouter()
  const params = useParams()
  const pageId = params?.id ? parseInt(params.id as string) : null
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [isHomepage, setIsHomepage] = useState(false)

  useEffect(() => {
    if (pageId) {
      loadPage()
    } else {
      setLoading(false)
    }
  }, [pageId])

  const loadPage = async () => {
    try {
      setLoading(true)
      const data = await pageService.getById(pageId!)
      setPage(data)
      setTitle(data.title || '')
      setBlocks(Array.isArray(data.blocks) ? data.blocks : [])
      setMetaTitle(data.meta_title || '')
      setMetaDescription(data.meta_description || '')
      setStatus(data.status || 'draft')
      setIsHomepage(data.is_homepage || false)
    } catch (error) {
      console.error('Erreur chargement page:', error)
      toast.error('Erreur lors du chargement de la page')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    setSaving(true)
    try {
      await pageService.update(pageId!, {
        title,
        blocks,
        meta_title: metaTitle,
        meta_description: metaDescription,
        status,
        is_homepage: isHomepage,
      })
      toast.success('Page sauvegardée !')
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async () => {
    try {
      await pageService.publish(pageId!)
      toast.success('Page publiée !')
      loadPage()
    } catch (error) {
      toast.error('Erreur lors de la publication')
    }
  }

  if (loading) {
    return (
      <TenantLayout title="Éditeur visuel">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </TenantLayout>
    )
  }

  if (!page) {
    return (
      <TenantLayout title="Page non trouvée">
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Page non trouvée</p>
        </div>
      </TenantLayout>
    )
  }

  return (
    <TenantLayout
      title="Éditeur visuel"
      subtitle={`Édition de: ${page.title}`}
      headerActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/pages')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
          >
            Retour
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          {status !== 'published' && (
            <button
              onClick={handlePublish}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Publier
            </button>
          )}
        </div>
      }
    >
      <div 
        className="fixed top-[64px] lg:top-[73px] bottom-0 bg-white dark:bg-gray-800 flex flex-col z-10 overflow-hidden" 
        style={{ 
          width: '100vw',
          left: '0',
          right: '0',
          marginLeft: '0',
          marginRight: '0'
        }}
      >
        {/* Page Title & SEO - Compact Header */}
        <div className="border-b border-gray-200 bg-gray-50 dark:bg-gray-900 flex-shrink-0 w-full">
          <div className="px-4 lg:px-6 xl:px-8 py-3 lg:py-4 w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 text-base sm:text-lg lg:text-xl border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-bold bg-white dark:bg-gray-800"
              placeholder="Titre de la page"
            />
          </div>

        {/* SEO Panel (Collapsible) - Compact in header */}
        <div className="px-4 lg:px-6 xl:px-8 pb-2 bg-gray-50 dark:bg-gray-900 flex-shrink-0 w-full">
          <details className="cursor-pointer">
            <summary className="text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">⚙️ Réglages SEO et page</summary>
            <div className="mt-3 pb-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Titre SEO</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="Titre pour les moteurs de recherche"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description SEO</label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="Description pour les moteurs de recherche"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Statut</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'scheduled')}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                >
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="scheduled">Programmé</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_homepage"
                  checked={isHomepage}
                  onChange={(e) => setIsHomepage(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="is_homepage" className="ml-2 block text-xs text-gray-900 dark:text-gray-100">
                  Définir comme page d'accueil
                </label>
              </div>
            </div>
          </details>
        </div>

        {/* Block Editor - Full Width Split View */}
        <div className="flex-1 overflow-hidden w-full max-w-full">
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>
      </div>
    </TenantLayout>
  )
}

