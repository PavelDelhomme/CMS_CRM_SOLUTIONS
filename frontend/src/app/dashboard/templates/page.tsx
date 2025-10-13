'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Template {
  id: number
  name: string
  slug: string
  description: string
  category: string
  is_premium: boolean
  price: number
  thumbnail?: string
}

export default function TemplatesPage() {
  const router = useRouter()
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<number | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await api.get('/templates')
      setTemplates(response.data)
    } catch (error) {
      toast.error('Erreur de chargement des templates')
    } finally {
      setLoading(false)
    }
  }

  const handleApplyTemplate = async (templateId: number) => {
    setApplying(templateId)
    try {
      await api.post(`/templates/${templateId}/apply`)
      toast.success('Template appliqué avec succès !')
      
      // Générer le site
      await api.post('/site/generate')
      toast.success('Site généré !')
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'application')
    } finally {
      setApplying(null)
    }
  }

  const getCategoryBadge = (category: string) => {
    const badges: Record<string, string> = {
      modern: 'bg-blue-100 text-blue-800',
      luxury: 'bg-purple-100 text-purple-800',
      classic: 'bg-green-100 text-green-800',
      minimal: 'bg-gray-100 text-gray-800',
    }
    return badges[category] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return <div className="p-8">Chargement...</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center"
          >
            ← Retour au dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Choisir un Template</h1>
          <p className="text-gray-600 mt-1">Sélectionnez le design de votre site VTC</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="card overflow-hidden">
              {/* Preview Image */}
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 relative">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-2xl font-bold">
                    {template.name}
                  </div>
                )}
                
                {/* Badges */}
                <div className="absolute top-2 right-2 flex gap-2">
                  <span className={`badge ${getCategoryBadge(template.category)}`}>
                    {template.category}
                  </span>
                  {template.is_premium && (
                    <span className="badge bg-yellow-100 text-yellow-800">
                      Premium {template.price}€
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {template.description}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleApplyTemplate(template.id)}
                    disabled={applying === template.id}
                    className="flex-1 btn btn-primary"
                  >
                    {applying === template.id ? 'Application...' : 'Appliquer'}
                  </button>
                  <button
                    onClick={() => router.push(`/dashboard/templates/${template.id}/preview`)}
                    className="btn btn-secondary"
                  >
                    👁️ Preview
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="card text-center py-12">
            <p className="text-gray-500">Aucun template disponible</p>
          </div>
        )}
      </main>
    </div>
  )
}

