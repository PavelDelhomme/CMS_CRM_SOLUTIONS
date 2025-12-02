'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import pageService from '@/services/page.service'
import type { Page } from '@/services/page.service'
import Link from 'next/link'

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const pageId = params?.id ? parseInt(params.id as string) : null
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [metaTitle, setMetaTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [status, setStatus] = useState<'draft' | 'published' | 'scheduled'>('draft')

  useEffect(() => {
    if (pageId) {
      loadPage()
    }
  }, [pageId])

  const loadPage = async () => {
    try {
      setLoading(true)
      const data = await pageService.getById(pageId!)
      setPage(data)
      setTitle(data.title)
      setContent(data.content || '')
      setMetaTitle(data.meta_title || '')
      setMetaDescription(data.meta_description || '')
      setStatus(data.status)
    } catch (error) {
      console.error('Erreur de chargement:', error)
      alert('Erreur lors du chargement de la page')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Le titre est requis')
      return
    }

    setSaving(true)
    try {
      await pageService.update(pageId!, {
        title: title.trim(),
        content: content.trim(),
        meta_title: metaTitle.trim() || undefined,
        meta_description: metaDescription.trim() || undefined,
        status,
      })
      alert('Page mise à jour avec succès !')
      router.push('/dashboard/pages')
    } catch (error: any) {
      console.error('Erreur mise à jour:', error)
      alert(error.response?.data?.error || 'Erreur lors de la mise à jour')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  if (!page) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Page non trouvée</p>
          <Link href="/dashboard/pages" style={{ color: '#2563eb', textDecoration: 'none' }}>
            Retour à la liste
          </Link>
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
            <Link href="/dashboard" style={{ color: '#6b7280', textDecoration: 'none' }}>Dashboard</Link>
            <Link href="/dashboard/pages" style={{ color: '#6b7280', textDecoration: 'none' }}>Pages</Link>
            <Link href="/login" style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}>
              Déconnexion
            </Link>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
              Éditer la page
            </h2>
            <p style={{ color: '#6b7280' }}>
              Modifiez le contenu de votre page
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Link
              href={`/dashboard/pages/${pageId}/edit-visual`}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#10b981',
                color: 'white',
                borderRadius: '0.5rem',
                textDecoration: 'none',
              }}
            >
              Éditeur visuel
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '0.75rem 1.5rem',
                background: saving ? '#9ca3af' : '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {saving ? 'Sauvegarde...' : 'Enregistrer'}
            </button>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '2rem' }}>
          {/* Title */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Titre de la page *
            </label>
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
              placeholder="Titre de la page"
            />
          </div>

          {/* Content Editor */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Contenu
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '0.375rem',
                fontSize: '1rem',
                background: 'white',
                color: '#111827',
                fontFamily: 'monospace',
              }}
              placeholder="Contenu de la page (HTML possible)"
            />
            <p style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#6b7280' }}>
              Vous pouvez utiliser du HTML pour formater le contenu
            </p>
          </div>

          {/* SEO Settings */}
          <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '1rem' }}>
              Réglages SEO
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
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
          </div>
        </div>
      </div>
    </div>
  )
}

