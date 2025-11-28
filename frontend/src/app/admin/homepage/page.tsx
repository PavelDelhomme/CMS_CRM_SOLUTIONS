'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'
import BlockPreview from '@/components/editor/BlockPreview'
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
  const [showPreview, setShowPreview] = useState(true)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [showSeoExpanded, setShowSeoExpanded] = useState(false)
  // SEO avancé
  const [ogTitle, setOgTitle] = useState('')
  const [ogDescription, setOgDescription] = useState('')
  const [ogImage, setOgImage] = useState('')
  const [twitterCardType, setTwitterCardType] = useState('summary')
  const [twitterImage, setTwitterImage] = useState('')
  const [metaKeywords, setMetaKeywords] = useState('')
  const [canonicalUrl, setCanonicalUrl] = useState('')
  const [robots, setRobots] = useState('index, follow')

  // Sauvegarde automatique
  const { isSaving: isAutoSaving, lastSaved, updateLastSaved } = useAutoSave({
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
      // Mettre à jour le timestamp de dernière sauvegarde
      updateLastSaved()
      toast.success('Page d\'accueil sauvegardée avec succès !')
    } catch (error: any) {
      console.error('Erreur sauvegarde:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }, [blocks, metaTitle, metaDescription, updateLastSaved])

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
          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              showPreview 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-gray-100 dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            {showPreview ? 'Masquer' : 'Afficher'} Prévisualisation
          </button>

          {/* Preview Mode Selector */}
          {showPreview && (
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 rounded-lg p-1">
              <button
                onClick={() => setPreviewMode('desktop')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  previewMode === 'desktop'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                title="Desktop"
              >
                💻
              </button>
              <button
                onClick={() => setPreviewMode('tablet')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  previewMode === 'tablet'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                title="Tablette"
              >
                📱
              </button>
              <button
                onClick={() => setPreviewMode('mobile')}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  previewMode === 'mobile'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800'
                }`}
                title="Mobile"
              >
                📱
              </button>
            </div>
          )}

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
          {isAutoSaving ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent"></div>
              <span>Sauvegarde...</span>
            </div>
          ) : lastSaved ? (
            <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span>Sauvegardé {lastSaved.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          ) : null}

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
        {/* Page Selector - Quick Navigation */}
        <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Page:</span>
            <select
              value="home"
              onChange={(e) => {
                if (e.target.value !== 'home') {
                  router.push(`/admin/pages-public/${e.target.value}/edit`)
                }
              }}
              className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="home">Page d'accueil</option>
              <option value="docs">Documentation</option>
              <option value="contact">Contact</option>
              <option value="faq">FAQ</option>
            </select>
            <button
              onClick={() => router.push('/admin/pages-public')}
              className="ml-auto px-3 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Gérer toutes les pages →
            </button>
          </div>
        </div>
        {/* SEO Settings Bar - Expandable */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="p-4">
            <button
              onClick={() => setShowSeoExpanded(!showSeoExpanded)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="font-semibold text-gray-900 dark:text-gray-100">Paramètres SEO</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  ({metaTitle.length}/60 caractères)
                </span>
              </div>
              <svg className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${showSeoExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {showSeoExpanded && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
              {/* Basic SEO */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="meta_title" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Titre SEO <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="meta_title"
                    type="text"
                    value={metaTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaTitle(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Titre pour les moteurs de recherche (50-60 caractères)"
                    maxLength={60}
                  />
                  <p className="text-xs text-gray-500 mt-1">{metaTitle.length}/60 caractères</p>
                </div>
                <div>
                  <label htmlFor="meta_description" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description SEO
                  </label>
                  <textarea
                    id="meta_description"
                    value={metaDescription}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setMetaDescription(e.target.value)}
                    className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Description pour les moteurs de recherche (150-160 caractères)"
                    rows={2}
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">{metaDescription.length}/160 caractères</p>
                </div>
              </div>

              {/* Open Graph */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Open Graph (Réseaux sociaux)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      OG Title
                    </label>
                    <input
                      type="text"
                      value={ogTitle || metaTitle}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOgTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Titre pour Facebook, LinkedIn..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      OG Image URL
                    </label>
                    <input
                      type="url"
                      value={ogImage || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOgImage(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      OG Description
                    </label>
                    <textarea
                      value={ogDescription || metaDescription}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOgDescription(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="Description pour les réseaux sociaux"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              {/* Twitter Cards */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Twitter Cards</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type de carte
                    </label>
                    <select
                      value={twitterCardType || 'summary'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTwitterCardType(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <option value="summary">Summary</option>
                      <option value="summary_large_image">Summary Large Image</option>
                      <option value="app">App</option>
                      <option value="player">Player</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Twitter Image URL
                    </label>
                    <input
                      type="url"
                      value={twitterImage || ogImage || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTwitterImage(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </div>

              {/* Additional Meta */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Méta tags supplémentaires</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Mots-clés (séparés par des virgules)
                    </label>
                    <input
                      type="text"
                      value={metaKeywords || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMetaKeywords(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="vtc, chauffeur, transport..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Canonical URL
                    </label>
                    <input
                      type="url"
                      value={canonicalUrl || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCanonicalUrl(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Robots (indexation)
                    </label>
                    <select
                      value={robots || 'index, follow'}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setRobots(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg"
                    >
                      <option value="index, follow">Indexer et suivre</option>
                      <option value="noindex, follow">Ne pas indexer, suivre</option>
                      <option value="index, nofollow">Indexer, ne pas suivre</option>
                      <option value="noindex, nofollow">Ne pas indexer, ne pas suivre</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Editor Area with Split View */}
        <div className="flex-1 flex overflow-hidden">
          {/* Editor Section */}
          <div className={`${showPreview ? 'w-1/2' : 'w-full'} border-r border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300`}>
            <div className="flex-1 overflow-hidden">
              <BlockEditor 
                blocks={blocks} 
                onChange={setBlocks}
                availableBlockTypes={blockTypes}
              />
            </div>
          </div>

          {/* Preview Section */}
          {showPreview && (
            <div className={`w-1/2 border-l border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col transition-all duration-300 ${
              previewMode === 'tablet' ? 'max-w-2xl mx-auto' : previewMode === 'mobile' ? 'max-w-md mx-auto' : ''
            }`}>
              <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-2 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Prévisualisation en direct
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-500">
                  {previewMode === 'desktop' ? '💻 Desktop' : previewMode === 'tablet' ? '📱 Tablette' : '📱 Mobile'}
                </span>
              </div>
              <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 overflow-auto ${
                  previewMode === 'tablet' ? 'px-4' : previewMode === 'mobile' ? 'px-2' : ''
                }`}>
                  <div className={`h-full ${
                    previewMode === 'tablet' ? 'max-w-[768px] mx-auto' : 
                    previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : 
                    'w-full'
                  }`}>
                    <BlockPreview blocks={blocks} blockTypes={blockTypes} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
