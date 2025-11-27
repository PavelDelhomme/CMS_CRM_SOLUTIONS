'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'
import pageService from '@/services/page.service'
import toast from 'react-hot-toast'

export default function NewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [isHomepage, setIsHomepage] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('Le titre est requis')
      return
    }

    setSaving(true)
    try {
      // Ensure blocks is always an array
      const pageData: any = {
        title: title.trim(),
        blocks: Array.isArray(blocks) ? blocks : [],
        status,
        is_homepage: isHomepage,
      }

      // Only include optional fields if they have values
      if (metaTitle.trim()) {
        pageData.meta_title = metaTitle.trim()
      }
      if (metaDescription.trim()) {
        pageData.meta_description = metaDescription.trim()
      }

      await pageService.create(pageData)
      toast.success('Page créée avec succès !')
      router.push('/dashboard/pages')
    } catch (error: any) {
      console.error('Erreur création page:', error)
      
      // Handle validation errors with details
      if (error.response?.data?.fields) {
        const fields = error.response.data.fields
        const errorMessages = Object.entries(fields)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages : [messages]
            return `${field}: ${msgs.join(', ')}`
          })
          .join('\n')
        toast.error(`Erreurs de validation:\n${errorMessages}`)
      } else if (error.response?.data?.details) {
        const details = Array.isArray(error.response.data.details) 
          ? error.response.data.details 
          : [error.response.data.details]
        toast.error(`Erreurs:\n${details.join('\n')}`)
      } else {
        const errorMessage = error.response?.data?.error || 
                            error.response?.data?.message ||
                            error.message ||
                            'Erreur lors de la création de la page'
        toast.error(errorMessage)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TenantLayout title="Nouvelle Page">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </TenantLayout>
    )
  }

  return (
    <TenantLayout
      title="Nouvelle Page"
      subtitle="Créez votre page avec l'éditeur visuel"
      headerActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/dashboard/pages')}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 dark:text-gray-300 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Création...' : 'Créer la page'}
          </button>
        </div>
      }
    >
      <div className="h-[calc(100vh-200px)] bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
        {/* Page Title */}
        <div className="border-b border-gray-200 p-4 bg-gray-50 dark:bg-gray-900">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-xl font-bold"
            placeholder="Titre de la page *"
            required
          />
        </div>

        {/* Block Editor */}
        <div className="flex-1 overflow-hidden">
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>

        {/* SEO Panel (Collapsible) */}
        <div className="border-t border-gray-200 p-4 bg-gray-50 dark:bg-gray-900">
          <details className="cursor-pointer">
            <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-300">Réglages SEO et page</summary>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Titre SEO</label>
                <input
                  type="text"
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="Titre pour les moteurs de recherche"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Description SEO</label>
                <input
                  type="text"
                  value={metaDescription}
                  onChange={(e) => setMetaDescription(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                  placeholder="Description pour les moteurs de recherche"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300 mb-1">Statut</label>
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
                <label htmlFor="is_homepage" className="ml-2 block text-xs text-gray-900 dark:text-gray-100 dark:text-gray-100">
                  Définir comme page d'accueil
                </label>
              </div>
            </div>
          </details>
        </div>
      </div>
    </TenantLayout>
  )
}

