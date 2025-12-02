'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import pageService from '@/services/page.service'
import type { Page } from '@/services/page.service'
import BlockRenderer from '@/components/blocks/BlockRenderer'

export default function PublicPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [page, setPage] = useState<Page | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (slug) {
      loadPage()
    }
  }, [slug])

  const loadPage = async () => {
    try {
      setLoading(true)
      setError(null)
      // Récupérer la page publiée par slug
      const data = await pageService.getBySlug(slug)
      setPage(data)
    } catch (err: any) {
      console.error('Erreur de chargement de la page:', err)
      if (err?.response?.status === 404) {
        setError('Page non trouvée')
      } else {
        setError('Erreur lors du chargement de la page')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
          <p style={{ color: '#6b7280' }}>Chargement de la page...</p>
        </div>
      </div>
    )
  }

  if (error || !page) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f9fafb' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>404</div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Page non trouvée
          </h1>
          <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
            {error || 'La page que vous recherchez n\'existe pas ou n\'est pas publiée.'}
          </p>
          <a
            href="/"
            style={{
              padding: '0.75rem 1.5rem',
              background: '#2563eb',
              color: 'white',
              borderRadius: '0.5rem',
              textDecoration: 'none',
              display: 'inline-block',
            }}
          >
            Retour à l'accueil
          </a>
        </div>
      </div>
    )
  }

  return (
    <>

      <div style={{ minHeight: '100vh', background: '#ffffff' }}>
        {/* Header simple */}
        <header style={{ borderBottom: '1px solid #e5e7eb', padding: '1rem 0', background: 'white' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
            <a href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', textDecoration: 'none' }}>
              CMS_CRM_SOLUTIONS
            </a>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
          {/* Page Title */}
          {page.title && (
            <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
              {page.title}
            </h1>
          )}

          {/* Featured Image */}
          {page.featured_image && (
            <div style={{ marginBottom: '2rem' }}>
              <img
                src={page.featured_image}
                alt={page.title}
                style={{ width: '100%', maxHeight: '400px', objectFit: 'cover', borderRadius: '0.5rem' }}
              />
            </div>
          )}

          {/* Blocks Content */}
          {page.blocks && Array.isArray(page.blocks) && page.blocks.length > 0 ? (
            <div>
              {page.blocks.map((block: any, index: number) => (
                <BlockRenderer key={block.id || index} block={block} />
              ))}
            </div>
          ) : page.content ? (
            <div
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75',
                color: '#374151',
              }}
              dangerouslySetInnerHTML={{ __html: page.content }}
            />
          ) : (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <p>Cette page ne contient pas encore de contenu.</p>
            </div>
          )}

          {/* Metadata */}
          {page.published_at && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid #e5e7eb', fontSize: '0.875rem', color: '#6b7280' }}>
              Publié le {new Date(page.published_at).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </main>

        {/* Footer simple */}
        <footer style={{ marginTop: '4rem', borderTop: '1px solid #e5e7eb', padding: '2rem 0', background: '#f9fafb' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', textAlign: 'center', color: '#6b7280' }}>
            <p>&copy; {new Date().getFullYear()} CMS_CRM_SOLUTIONS. Tous droits réservés.</p>
          </div>
        </footer>
      </div>
    </>
  )
}

