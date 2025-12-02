'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import pageService from '@/services/page.service'
import type { Page } from '@/services/page.service'
import Link from 'next/link'

export default function PagesManagement() {
  const router = useRouter()
  const [pages, setPages] = useState<Page[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPages()
  }, [])

  const loadPages = async () => {
    try {
      const data = await pageService.getAll()
      setPages(data)
    } catch (error) {
      console.error('Erreur de chargement des pages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (pageId: number) => {
    try {
      await pageService.publish(pageId)
      loadPages()
    } catch (error) {
      console.error('Erreur lors de la publication:', error)
    }
  }

  const handleDuplicate = async (pageId: number) => {
    try {
      await pageService.duplicate(pageId)
      loadPages()
    } catch (error) {
      console.error('Erreur lors de la duplication:', error)
    }
  }

  const handleDelete = async (pageId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette page ?')) return

    try {
      await pageService.delete(pageId)
      loadPages()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement des pages...</p>
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
              Gestion des Pages
            </h2>
            <p style={{ color: '#6b7280' }}>
              Créez et gérez les pages de votre site
            </p>
          </div>
          <Link
            href="/dashboard/pages/new"
            style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}
          >
            + Nouvelle Page
          </Link>
        </div>

        {pages.length === 0 ? (
          <div style={{ background: 'white', padding: '3rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Aucune page</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Commencez par créer votre première page.</p>
            <Link
              href="/dashboard/pages/new"
              style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', display: 'inline-block' }}
            >
              + Créer une page
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pages.map((page) => (
              <div key={page.id} style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827' }}>{page.title || 'Sans titre'}</h3>
                      <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', background: page.status === 'published' ? '#d1fae5' : '#fef3c7', color: page.status === 'published' ? '#065f46' : '#92400e' }}>
                        {page.status === 'draft' && 'Brouillon'}
                        {page.status === 'published' && 'Publié'}
                        {page.status === 'scheduled' && 'Programmé'}
                      </span>
                      {page.is_homepage && (
                        <span style={{ padding: '0.25rem 0.75rem', borderRadius: '0.25rem', fontSize: '0.875rem', background: '#dbeafe', color: '#1e40af' }}>
                          Homepage
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                      /{page.slug || 'sans-slug'}
                    </p>
                    {page.meta_description && (
                      <p style={{ fontSize: '0.875rem', color: '#4b5563' }}>{page.meta_description}</p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {page.status === 'draft' && (
                      <button
                        onClick={() => handlePublish(page.id)}
                        style={{ padding: '0.5rem 1rem', background: '#10b981', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                      >
                        Publier
                      </button>
                    )}
                    <Link
                      href={`/dashboard/pages/${page.id}/edit`}
                      style={{ padding: '0.5rem 1rem', background: '#2563eb', color: 'white', borderRadius: '0.375rem', textDecoration: 'none', fontSize: '0.875rem' }}
                    >
                      ✏️ Éditer
                    </Link>
                    <button
                      onClick={() => handleDuplicate(page.id)}
                      style={{ padding: '0.5rem 1rem', background: '#6b7280', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      📋 Dupliquer
                    </button>
                    <button
                      onClick={() => handleDelete(page.id)}
                      style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
                    >
                      🗑️ Supprimer
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
