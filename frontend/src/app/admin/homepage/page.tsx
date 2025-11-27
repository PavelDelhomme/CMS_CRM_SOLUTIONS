'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'

interface PublicHomepageData {
  public_homepage_blocks: Block[]
  public_homepage_meta_title: string
  public_homepage_meta_description: string
}

export default function HomepageEditorPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadHomepageData()
  }, [router])

  const loadHomepageData = async () => {
    try {
      setLoading(true)
      const response = await api.get('/system-settings/')
      const data = response.data
      
      setBlocks(data.public_homepage_blocks || [])
      setMetaTitle(data.public_homepage_meta_title || 'VTCBuilder - Le WordPress des chauffeurs VTC')
      setMetaDescription(data.public_homepage_meta_description || 'Plateforme complète pour créer et gérer votre site VTC professionnel')
    } catch (error: any) {
      console.error('Erreur chargement page d\'accueil:', error)
      toast.error('Erreur lors du chargement de la page d\'accueil')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      await api.patch('/system-settings/', {
        public_homepage_blocks: blocks,
        public_homepage_meta_title: metaTitle,
        public_homepage_meta_description: metaDescription,
      })
      toast.success('Page d\'accueil sauvegardée avec succès !')
    } catch (error: any) {
      console.error('Erreur sauvegarde page d\'accueil:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [blocks, metaTitle, metaDescription])

  if (loading) {
    return (
      <AdminLayout title="Éditeur Page d'Accueil" subtitle="Chargement...">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Éditeur Page d'Accueil Publique"
      subtitle="Personnalisez la page d'accueil du site public (localhost:9494/)"
      headerActions={
        <div className="flex gap-2">
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Prévisualiser
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sauvegarde...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Sauvegarder
              </>
            )}
          </button>
        </div>
      }
    >
      <div className="flex flex-col lg:flex-row gap-6 h-full">
        {/* Left Sidebar for SEO Settings */}
        <div className="lg:w-1/4 bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-6 overflow-y-auto">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Paramètres SEO</h2>

          <div>
            <label htmlFor="meta_title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre SEO
            </label>
            <input
              id="meta_title"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titre pour les moteurs de recherche"
            />
          </div>

          <div>
            <label htmlFor="meta_description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description SEO
            </label>
            <textarea
              id="meta_description"
              rows={4}
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description pour les moteurs de recherche"
            />
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              💡 <strong>Astuce :</strong> Utilisez l'éditeur de blocs à droite pour créer votre page d'accueil. 
              Les mêmes outils que vos utilisateurs utilisent pour leurs sites.
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              La page d'accueil publique sera visible sur <code className="bg-gray-100 dark:bg-gray-900 px-1 rounded">localhost:9494/</code>
            </p>
          </div>
        </div>

        {/* Main Content Area: Block Editor */}
        <div className="flex-1 h-[calc(100vh-200px)]">
          <BlockEditor blocks={blocks} onChange={setBlocks} />
        </div>
      </div>
    </AdminLayout>
  )
}

