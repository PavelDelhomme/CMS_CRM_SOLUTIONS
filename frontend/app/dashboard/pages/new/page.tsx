'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BlockEditor, { Block } from '@/components/editor/BlockEditor'
import pageService from '@/services/page.service'

// Templates de pages prédéfinis
const PAGE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Page vide',
    description: 'Commencer avec une page vide',
    icon: '📄',
    blocks: []
  },
  {
    id: 'hero',
    name: 'Page avec Hero',
    description: 'Page avec bannière hero et sections',
    icon: '🎯',
    blocks: [
      {
        id: `hero-${Date.now()}`,
        type: 'hero',
        data: {
          title: 'Bienvenue',
          subtitle: 'Ajoutez votre message ici',
          button_text: 'En savoir plus',
          button_url: '#'
        }
      }
    ]
  },
  {
    id: 'about',
    name: 'Page À propos',
    description: 'Page type "À propos" avec titre, texte et image',
    icon: '👥',
    blocks: [
      {
        id: `heading-${Date.now()}`,
        type: 'heading',
        data: {
          text: 'À propos de nous',
          level: 'h1',
          align: 'center'
        }
      },
      {
        id: `text-${Date.now() + 1}`,
        type: 'text',
        data: {
          content: 'Rédigez votre texte ici...'
        }
      }
    ]
  },
  {
    id: 'contact',
    name: 'Page Contact',
    description: 'Page de contact avec formulaire',
    icon: '📧',
    blocks: [
      {
        id: `heading-${Date.now()}`,
        type: 'heading',
        data: {
          text: 'Contactez-nous',
          level: 'h1',
          align: 'center'
        }
      },
      {
        id: `text-${Date.now() + 1}`,
        type: 'text',
        data: {
          content: 'Utilisez le formulaire ci-dessous pour nous contacter.'
        }
      }
    ]
  },
  {
    id: 'services',
    name: 'Page Services',
    description: 'Page de présentation des services',
    icon: '⚙️',
    blocks: [
      {
        id: `heading-${Date.now()}`,
        type: 'heading',
        data: {
          text: 'Nos services',
          level: 'h1',
          align: 'center'
        }
      }
    ]
  }
]

export default function NewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [blocks, setBlocks] = useState<Block[]>([])
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')
  const [isHomepage, setIsHomepage] = useState(false)

  useEffect(() => {
    setLoading(false)
  }, [])

  const handleTemplateSelect = (templateId: string) => {
    const template = PAGE_TEMPLATES.find(t => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setBlocks(template.blocks.map(block => ({
        ...block,
        id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      })))
      if (template.id !== 'blank' && !title) {
        setTitle(template.name)
      }
      setShowTemplateSelector(false)
      // Template appliqué
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Le titre est requis')
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
      alert('Page créée avec succès !')
      router.push('/dashboard/pages')
    } catch (error: any) {
      console.error('Erreur création page:', error)
      
      // Handle validation errors with details
      let errorMessage = 'Erreur lors de la création de la page'
      if (error.response?.data?.fields) {
        const fields = error.response.data.fields
        const errorMessages = Object.entries(fields)
          .map(([field, messages]: [string, any]) => {
            const msgs = Array.isArray(messages) ? messages : [messages]
            return `${field}: ${msgs.join(', ')}`
          })
          .join('\n')
        errorMessage = `Erreurs de validation:\n${errorMessages}`
      } else if (error.response?.data?.details) {
        const details = Array.isArray(error.response.data.details) 
          ? error.response.data.details 
          : [error.response.data.details]
        errorMessage = `Erreurs:\n${details.join('\n')}`
      } else {
        errorMessage = error.response?.data?.error || 
                            error.response?.data?.message ||
                            error.message ||
                            'Erreur lors de la création de la page'
      }
      alert(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>CMS_CRM_SOLUTIONS</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <a href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Dashboard</a>
            <a href="/dashboard/pages" style={{ color: '#6b7280', textDecoration: 'none' }}>Pages</a>
            <a href="/login" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}>
              Déconnexion
            </a>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        {showTemplateSelector ? (
          /* Template Selector */
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Choisissez un template</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>Sélectionnez un template pour démarrer rapidement ou commencez avec une page vide</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {PAGE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template.id)}
                  style={{
                    padding: '1.5rem',
                    border: selectedTemplate === template.id ? '2px solid #2563eb' : '2px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    background: selectedTemplate === template.id ? '#eff6ff' : 'white',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    if (selectedTemplate !== template.id) {
                      e.currentTarget.style.borderColor = '#93c5fd'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedTemplate !== template.id) {
                      e.currentTarget.style.borderColor = '#e5e7eb'
                    }
                  }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{template.icon}</div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.5rem' }}>{template.name}</h3>
                  <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>{template.description}</p>
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => router.push('/dashboard/pages')}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.5rem',
                  background: 'white',
                  color: '#374151',
                  cursor: 'pointer',
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem', background: '#f9fafb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <button
                  onClick={() => {
                    setShowTemplateSelector(true)
                    setSelectedTemplate(null)
                    setBlocks([])
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Changer de template
                </button>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => router.push('/dashboard/pages')}
                  style={{
                    padding: '0.5rem 1rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    background: 'white',
                    color: '#374151',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: saving ? '#9ca3af' : '#2563eb',
                    color: 'white',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                  }}
                >
                  {saving ? 'Création...' : 'Créer la page'}
                </button>
              </div>
            </div>

            {/* Page Title */}
            <div style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem', background: '#f9fafb' }}>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  background: 'white',
                  color: '#111827',
                }}
                placeholder="Titre de la page *"
                required
              />
            </div>

            {/* Block Editor */}
            <div style={{ minHeight: '500px', padding: '1rem' }}>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </div>

            {/* SEO Settings */}
            <details style={{ borderTop: '1px solid #e5e7eb', padding: '1rem', background: '#f9fafb' }}>
              <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#374151', marginBottom: '1rem' }}>
                Réglages SEO et page
              </summary>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginTop: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Titre SEO
                  </label>
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      color: '#111827',
                    }}
                    placeholder="Titre pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Description SEO
                  </label>
                  <input
                    type="text"
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      color: '#111827',
                    }}
                    placeholder="Description pour les moteurs de recherche"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
                    Statut
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'draft' | 'published' | 'scheduled')}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      background: 'white',
                      color: '#111827',
                    }}
                  >
                    <option value="draft">Brouillon</option>
                    <option value="published">Publié</option>
                    <option value="scheduled">Programmé</option>
                  </select>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', paddingTop: '1.75rem' }}>
                  <input
                    type="checkbox"
                    id="is_homepage"
                    checked={isHomepage}
                    onChange={(e) => setIsHomepage(e.target.checked)}
                    style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }}
                  />
                  <label htmlFor="is_homepage" style={{ fontSize: '0.875rem', color: '#374151', cursor: 'pointer' }}>
                    Définir comme page d'accueil
                  </label>
                </div>
              </div>
            </details>
          </div>
        )}
      </div>
    </div>
  )
}

