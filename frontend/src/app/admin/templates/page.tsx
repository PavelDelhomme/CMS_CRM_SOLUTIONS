'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import templateService, { Template } from '@/services/template.service'
import ResponsiveTable from '@/components/ResponsiveTable'
import toast from 'react-hot-toast'

export default function AdminTemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    category: 'vtc' as 'vtc' | 'business' | 'minimal' | 'modern' | 'classic',
    is_premium: false,
    price: 0,
    is_active: true,
    preview_url: '',
    html_content: '',
    css_content: '',
  })
  const [activeTab, setActiveTab] = useState<'info' | 'html' | 'css'>('info')
  const [htmlFile, setHtmlFile] = useState<File | null>(null)
  const [cssFile, setCssFile] = useState<File | null>(null)

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadTemplates()
  }, [router])

  const loadTemplates = async () => {
    try {
      setLoading(true)
      const data = await templateService.getAll({})
      const templatesArray = Array.isArray(data) ? data : (data?.results || data?.data || [])
      setTemplates(templatesArray)
    } catch (error: any) {
      // Ne pas logger les erreurs attendues (500, etc.)
      if (!error.response || error.response?.status !== 500) {
        console.error('Erreur chargement templates:', error)
      }
      // Ne pas afficher de toast pour les erreurs 500 (endpoint peut être en cours de développement)
      if (!error.response || error.response?.status !== 500) {
        toast.error('Erreur lors du chargement des templates')
      }
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingTemplate) {
        await templateService.update(editingTemplate.id, formData)
        toast.success('Template mis à jour avec succès !')
      } else {
        await templateService.create(formData)
        toast.success('Template créé avec succès !')
      }
      setShowForm(false)
      setEditingTemplate(null)
      resetForm()
      loadTemplates()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la sauvegarde')
    }
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      slug: template.slug,
      description: template.description || '',
      category: template.category,
      is_premium: template.is_premium,
      price: parseFloat(template.price?.toString() || '0'),
      is_active: template.is_active,
      preview_url: template.preview_url || '',
      html_content: template.html_content || '',
      css_content: template.css_content || '',
    })
    setShowForm(true)
    setActiveTab('info')
  }

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le template "${name}" ?`)) return
    try {
      await templateService.delete(id)
      toast.success('Template supprimé avec succès !')
      loadTemplates()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleToggleActive = async (template: Template) => {
    try {
      await templateService.update(template.id, { is_active: !template.is_active })
      toast.success(`Template ${!template.is_active ? 'activé' : 'désactivé'} avec succès !`)
      loadTemplates()
    } catch (error: any) {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      category: 'vtc',
      is_premium: false,
      price: 0,
      is_active: true,
      preview_url: '',
      html_content: '',
      css_content: '',
    })
    setActiveTab('info')
    setHtmlFile(null)
    setCssFile(null)
  }

  const handleHtmlFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.html')) {
      toast.error('Veuillez sélectionner un fichier HTML')
      return
    }
    
    setHtmlFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFormData({ ...formData, html_content: content })
      toast.success('Fichier HTML chargé avec succès')
    }
    reader.readAsText(file)
  }

  const handleCssFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.name.endsWith('.css')) {
      toast.error('Veuillez sélectionner un fichier CSS')
      return
    }
    
    setCssFile(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setFormData({ ...formData, css_content: content })
      toast.success('Fichier CSS chargé avec succès')
    }
    reader.readAsText(file)
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      vtc: 'bg-blue-100 text-blue-800',
      business: 'bg-purple-100 text-purple-800',
      classic: 'bg-green-100 text-green-800',
      minimal: 'bg-gray-100 text-gray-800',
      modern: 'bg-indigo-100 text-indigo-800',
    }
    return badges[category] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vtc: 'VTC',
      business: 'Business',
      classic: 'Classique',
      minimal: 'Minimaliste',
      modern: 'Moderne',
    }
    return labels[category] || category
  }

  if (loading) {
    return (
      <AdminLayout title="Gestion des Templates">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Gestion des Templates"
      subtitle="Créez et gérez les templates disponibles pour tous les tenants"
      headerActions={
        <button
          onClick={() => {
            resetForm()
            setEditingTemplate(null)
            setShowForm(true)
          }}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center text-sm"
        >
          <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Template
        </button>
      }
    >
      {/* Form */}
      {showForm && (
        <div className="bg-white shadow rounded-lg p-4 sm:p-6 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">
            {editingTemplate ? 'Modifier le Template' : 'Créer un Nouveau Template'}
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
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Informations
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('html')}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'html'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  HTML
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('css')}
                  className={`py-2 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'css'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  CSS
                </button>
              </nav>
            </div>

            {/* Info Tab */}
            {activeTab === 'info' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slug *
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="ex: modern-vtc"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Catégorie *
                </label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="vtc">VTC</option>
                  <option value="business">Business</option>
                  <option value="modern">Moderne</option>
                  <option value="classic">Classique</option>
                  <option value="minimal">Minimaliste</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL de prévisualisation
                </label>
                <input
                  type="url"
                  value={formData.preview_url}
                  onChange={(e) => setFormData({ ...formData, preview_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Premium
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_premium}
                    onChange={(e) => setFormData({ ...formData, is_premium: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Template premium</span>
                </label>
              </div>
              {formData.is_premium && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prix (€)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Statut
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-600">Actif</span>
                </label>
              </div>
            </div>
            )}

            {/* HTML Tab */}
            {activeTab === 'html' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contenu HTML
                    </label>
                    <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Uploader un fichier HTML
                      <input
                        type="file"
                        accept=".html"
                        onChange={handleHtmlFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {htmlFile && (
                    <p className="text-sm text-gray-600 mb-2">Fichier: {htmlFile.name}</p>
                  )}
                  <textarea
                    value={formData.html_content}
                    onChange={(e) => setFormData({ ...formData, html_content: e.target.value })}
                    rows={15}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                    placeholder="<!-- Entrez votre code HTML ici -->"
                  />
                </div>
              </div>
            )}

            {/* CSS Tab */}
            {activeTab === 'css' && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Contenu CSS
                    </label>
                    <label className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      Uploader un fichier CSS
                      <input
                        type="file"
                        accept=".css"
                        onChange={handleCssFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                  {cssFile && (
                    <p className="text-sm text-gray-600 mb-2">Fichier: {cssFile.name}</p>
                  )}
                  <textarea
                    value={formData.css_content}
                    onChange={(e) => setFormData({ ...formData, css_content: e.target.value })}
                    rows={15}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-xs sm:text-sm"
                    placeholder="/* Entrez votre code CSS ici */"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingTemplate(null)
                  resetForm()
                }}
                className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingTemplate ? 'Mettre à jour' : 'Créer'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <ResponsiveTable
          headers={['Nom', 'Slug', 'Catégorie', 'Type', 'Prix', 'Statut', 'Utilisations', 'Actions']}
          emptyMessage="Aucun template pour le moment"
        >
          {templates.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                Aucun template pour le moment. Créez-en un nouveau !
              </td>
            </tr>
          ) : (
            templates.map((template) => (
              <tr key={template.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{template.name}</div>
                  {template.description && (
                    <div className="text-xs text-gray-500 mt-1">{template.description}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4">
                  <code className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded break-all">{template.slug}</code>
                </td>
                <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getCategoryBadge(template.category)}`}>
                    {getCategoryLabel(template.category)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {template.is_premium ? (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                      Premium
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                      Gratuit
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {template.is_premium ? `${template.price}€` : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleToggleActive(template)}
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      template.is_active
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.is_active ? 'Actif' : 'Inactif'}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {template.usage_count || 0}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end items-center space-x-2">
                    {template.preview_url && (
                      <a
                        href={template.preview_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                        title="Aperçu"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                    )}
                    <button
                      onClick={() => handleEdit(template)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50"
                      title="Modifier"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(template.id, template.name)}
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

