'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'
import blocksService, { BlockType } from '@/services/blocks.service'
import PageLoader from '@/components/PageLoader'
import { useAutoSave } from '@/hooks/useAutoSave'

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
  const [blockTypes, setBlockTypes] = useState<BlockType[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')

  // Sauvegarde automatique
  const { isSaving: isAutoSaving, lastSaved } = useAutoSave({
    data: { blocks, metaTitle, metaDescription },
    onSave: async (data) => {
      await api.patch('/system-settings/', {
        public_homepage_blocks: data.blocks,
        public_homepage_meta_title: data.metaTitle,
        public_homepage_meta_description: data.metaDescription,
      })
    },
    debounceMs: 2000,
    enabled: true,
  })

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load homepage data and block types in parallel
      const [homepageResponse, blockTypesData] = await Promise.all([
        api.get('/system-settings/'),
        blocksService.getBlockTypes()
      ])
      
      const data = homepageResponse.data
      
      setBlocks(data.public_homepage_blocks || [])
      setMetaTitle(data.public_homepage_meta_title || 'VTCBuilder - Le WordPress des chauffeurs VTC')
      setMetaDescription(data.public_homepage_meta_description || 'Plateforme complète pour créer et gérer votre site VTC professionnel')
      setBlockTypes(blockTypesData)
    } catch (error: any) {
      console.error('Erreur chargement:', error)
      toast.error('Erreur lors du chargement des données')
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
      console.error('Erreur sauvegarde:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [blocks, metaTitle, metaDescription])

  if (loading) {
    return (
      <AdminLayout title="Éditeur Site Publique" subtitle="Chargement...">
        <PageLoader />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Éditeur Site Publique"
      subtitle="Créez et personnalisez votre site public avec l'éditeur de blocs complet"
      headerActions={
        <div className="flex gap-2 flex-wrap">
          {/* External Preview */}
          <button
            onClick={() => window.open('/', '_blank')}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Voir le site
          </button>

          {/* Auto-save indicator */}
          {isAutoSaving && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 dark:border-blue-400"></div>
              <span>Sauvegarde automatique...</span>
            </div>
          )}
          {!isAutoSaving && lastSaved && (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving || isAutoSaving}
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
      <div className="flex flex-col h-[calc(100vh-180px)]">
        {/* SEO Settings Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex gap-4 items-center flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="meta_title" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Titre SEO
            </label>
            <input
              id="meta_title"
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Titre pour les moteurs de recherche"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="meta_description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description SEO
            </label>
            <input
              id="meta_description"
              type="text"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Description pour les moteurs de recherche"
            />
          </div>
        </div>

        {/* Main Editor Area - Full Width */}
        <div className="flex-1 overflow-hidden">
          <BlockEditor 
            blocks={blocks} 
            onChange={setBlocks}
            availableBlockTypes={blockTypes}
          />
        </div>
      </div>
    </AdminLayout>
  )
}
