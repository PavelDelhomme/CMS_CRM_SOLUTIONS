'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import blocksService, { BlockType } from '@/services/blocks.service'
import ResponsiveTable from '@/components/ResponsiveTable'
import toast from 'react-hot-toast'
import PageLoader from '@/components/PageLoader'

export default function AdminBlocksPage() {
  const router = useRouter()
  const [blocks, setBlocks] = useState<BlockType[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingBlock, setEditingBlock] = useState<BlockType | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    label: '',
    icon: '📦',
    category: 'content' as 'content' | 'layout' | 'media' | 'custom',
    description: '',
    schema: '{}',
    default_styles: '{}',
    is_active: true,
    requires_premium: false,
    order: 0,
  })
  const [activeTab, setActiveTab] = useState<'info' | 'schema' | 'styles' | 'preview'>('info')
  const [previewData, setPreviewData] = useState<Record<string, any>>({})
  const [schemaError, setSchemaError] = useState<string | null>(null)
  const [stylesError, setStylesError] = useState<string | null>(null)

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadBlocks()
  }, [router])

  const loadBlocks = async () => {
    try {
      setLoading(true)
      const data = await blocksService.getBlockTypes()
      setBlocks(Array.isArray(data) ? data : [])
    } catch (error: any) {
      console.error('Erreur chargement blocs:', error)
      toast.error('Erreur lors du chargement des blocs')
      setBlocks([])
    } finally {
      setLoading(false)
    }
  }

  const validateJSON = (jsonString: string): { valid: boolean; data?: any; error?: string } => {
    try {
      const parsed = JSON.parse(jsonString)
      return { valid: true, data: parsed }
    } catch (error: any) {
      return { valid: false, error: error.message }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate JSON fields
    const schemaValidation = validateJSON(formData.schema)
    if (!schemaValidation.valid) {
      setSchemaError(schemaValidation.error || 'JSON invalide')
      toast.error('Le schéma JSON est invalide')
      return
    }
    setSchemaError(null)

    const stylesValidation = validateJSON(formData.default_styles)
    if (!stylesValidation.valid) {
      setStylesError(stylesValidation.error || 'JSON invalide')
      toast.error('Les styles JSON sont invalides')
      return
    }
    setStylesError(null)

    try {
      const dataToSend = {
        name: formData.name,
        label: formData.label,
        icon: formData.icon,
        category: formData.category,
        description: formData.description || '',
        schema: schemaValidation.data,
        default_styles: stylesValidation.data,
        is_active: formData.is_active,
        requires_premium: formData.requires_premium,
        order: formData.order,
      }

      if (editingBlock) {
        await blocksService.updateBlockType(editingBlock.id, dataToSend)
        toast.success('Bloc mis à jour avec succès !')
      } else {
        await blocksService.createBlockType(dataToSend)
        toast.success('Bloc créé avec succès !')
      }
      setShowForm(false)
      setEditingBlock(null)
      resetForm()
      loadBlocks()
    } catch (error: any) {
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (block: BlockType) => {
    setEditingBlock(block)
    setFormData({
      name: block.name,
      label: block.label,
      icon: block.icon || '📦',
      category: block.category,
      description: block.description || '',
      schema: JSON.stringify(block.schema || {}, null, 2),
      default_styles: JSON.stringify(block.default_styles || {}, null, 2),
      is_active: block.is_active,
      requires_premium: block.requires_premium,
      order: block.order,
    })
    setPreviewData(block.schema || {})
    setShowForm(true)
    setActiveTab('info')
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le bloc "${name}" ?`)) return
    try {
      await blocksService.deleteBlockType(id)
      toast.success('Bloc supprimé avec succès !')
      loadBlocks()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (block: BlockType) => {
    try {
      await blocksService.updateBlockType(block.id, { is_active: !block.is_active })
      toast.success(`Bloc ${!block.is_active ? 'activé' : 'désactivé'} avec succès !`)
      loadBlocks()
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      label: '',
      icon: '📦',
      category: 'content',
      description: '',
      schema: '{}',
      default_styles: '{}',
      is_active: true,
      requires_premium: false,
      order: 0,
    })
    setActiveTab('info')
    setPreviewData({})
    setSchemaError(null)
    setStylesError(null)
  }

  const updatePreview = () => {
    const schemaValidation = validateJSON(formData.schema)
    if (schemaValidation.valid) {
      setPreviewData(schemaValidation.data || {})
      setSchemaError(null)
    } else {
      setSchemaError(schemaValidation.error || 'JSON invalide')
    }
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      content: 'bg-blue-100 text-blue-800',
      layout: 'bg-purple-100 text-purple-800',
      media: 'bg-green-100 text-green-800',
      custom: 'bg-orange-100 text-orange-800',
    }
    return badges[category] || 'bg-gray-100 dark:bg-gray-900 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      content: 'Contenu',
      layout: 'Mise en page',
      media: 'Médias',
      custom: 'Personnalisé',
    }
    return labels[category] || category
  }

  // Render preview based on schema
  const renderPreview = () => {
    if (!previewData || Object.keys(previewData).length === 0) {
      return (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>Entrez un schéma JSON valide pour voir la prévisualisation</p>
        </div>
      )
    }

    try {
      // Simple preview renderer based on schema structure
      return (
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Aperçu du bloc</h3>
            <div className="space-y-2">
              {Object.entries(previewData).map(([key, value]: [string, any]) => {
                if (typeof value === 'object' && value !== null) {
                  return (
                    <div key={key} className="border-l-2 border-blue-500 pl-3">
                      <div className="font-medium text-sm text-gray-700 dark:text-gray-300">{key}:</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        {JSON.stringify(value, null, 2)}
                      </div>
                    </div>
                  )
                }
                return (
                  <div key={key} className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-700 dark:text-gray-300 w-24">{key}:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">{String(value)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    } catch (error) {
      return (
        <div className="p-8 text-center text-red-500">
          <p>Erreur lors du rendu de la prévisualisation</p>
        </div>
      )
    }
  }

  if (loading) {
    return (
      <AdminLayout title="Gestion des Blocs">
        <PageLoader text="Chargement des blocs..." />
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Gestion des Blocs"
      subtitle="Créez et gérez les types de blocs disponibles dans l'éditeur"
      headerActions={
        <button
          onClick={() => {
            resetForm()
            setEditingBlock(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Bloc
        </button>
      }
    >
      {/* Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {editingBlock ? 'Modifier le Bloc' : 'Créer un Nouveau Bloc'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
              <nav className="-mb-px flex space-x-4 sm:space-x-8">
                <button
                  type="button"
                  onClick={() => setActiveTab('info')}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'info'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Informations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('schema')}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'schema'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Schéma JSON
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('styles')}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'styles'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Styles par défaut
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('preview')
                    updatePreview()
                  }}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'preview'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  Prévisualisation
                </button>
              </nav>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom (identifiant) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: custom-text"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Identifiant unique (minuscules, tirets)
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Label (nom affiché) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="ex: Bloc Texte Personnalisé"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Icône (emoji ou nom) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.icon}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="📝 ou text"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Catégorie *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="content">Contenu</option>
                    <option value="layout">Mise en page</option>
                    <option value="media">Médias</option>
                    <option value="custom">Personnalisé</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Ordre d'affichage
                  </label>
                  <input
                    type="number"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Premium
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requires_premium}
                      onChange={(e) => setFormData({ ...formData, requires_premium: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Nécessite un plan premium</span>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Statut
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Actif</span>
                  </label>
                </div>
              </div>
            )}

            {/* Schema Tab */}
            {activeTab === 'schema' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Schéma JSON (structure des données du bloc)
                    </label>
                    <button
                      type="button"
                      onClick={updatePreview}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Mettre à jour la prévisualisation
                    </button>
                  </div>
                  {schemaError && (
                    <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                      Erreur JSON: {schemaError}
                    </div>
                  )}
                  <textarea
                    value={formData.schema}
                    onChange={(e) => {
                      setFormData({ ...formData, schema: e.target.value })
                      setSchemaError(null)
                    }}
                    rows={20}
                    className="w-full px-3 sm:px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                    placeholder='{"content": {"type": "string", "label": "Contenu", "default": ""}}'
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    💡 Définissez la structure des données que ce bloc peut contenir
                  </p>
                </div>
              </div>
            )}

            {/* Styles Tab */}
            {activeTab === 'styles' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Styles par défaut (JSON)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const validation = validateJSON(formData.default_styles)
                        if (!validation.valid) {
                          setStylesError(validation.error || 'JSON invalide')
                        } else {
                          setStylesError(null)
                        }
                      }}
                      className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Valider JSON
                    </button>
                  </div>
                  {stylesError && (
                    <div className="mb-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                      Erreur JSON: {stylesError}
                    </div>
                  )}
                  <textarea
                    value={formData.default_styles}
                    onChange={(e) => {
                      setFormData({ ...formData, default_styles: e.target.value })
                      setStylesError(null)
                    }}
                    rows={20}
                    className="w-full px-3 sm:px-4 py-2 border dark:bg-gray-700 dark:text-gray-100 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                    placeholder='{"color": "#000000", "fontSize": "16px", "padding": "10px"}'
                  />
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    💡 Définissez les styles CSS par défaut pour ce bloc
                  </p>
                </div>
              </div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <div className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Prévisualisation en directe
                  </h4>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                    Aperçu basé sur le schéma JSON défini. Cliquez sur "Mettre à jour la prévisualisation" dans l'onglet Schéma pour actualiser.
                  </p>
                </div>
                {renderPreview()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingBlock(null)
                  resetForm()
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingBlock ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Blocks List */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <ResponsiveTable
          headers={['Nom', 'Label', 'Catégorie', 'Icône', 'Premium', 'Statut', 'Ordre', 'Actions']}
          emptyMessage="Aucun bloc pour le moment"
        >
          {blocks.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-3 sm:px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                Aucun bloc pour le moment. Créez-en un nouveau !
              </td>
            </tr>
          ) : (
            blocks.map((block) => (
              <tr key={block.id} className="hover:bg-gray-50 dark:bg-gray-900">
                <td className="px-3 sm:px-6 py-4">
                  <code className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded break-all">
                    {block.name}
                  </code>
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{block.icon}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{block.label}</div>
                      {block.description && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1">
                          {block.description}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(block.category)}`}>
                    {getCategoryLabel(block.category)}
                  </span>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-2xl">
                  {block.icon}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  {block.requires_premium ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Gratuit
                    </span>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(block)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      block.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 dark:bg-gray-900 text-gray-800'
                    }`}
                  >
                    {block.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {block.order}
                </td>
                <td className="px-3 sm:px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end items-center flex-wrap gap-1 sm:gap-2">
                    <button
                      onClick={() => handleEdit(block)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                      title="Modifier"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(block.id, block.label)}
                      className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50"
                      title="Supprimer"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </ResponsiveTable>
      </div>
    </AdminLayout>
  )
}

