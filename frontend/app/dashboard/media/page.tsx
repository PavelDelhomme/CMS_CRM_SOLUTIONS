'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mediaService from '@/services/media.service'
import type { Media } from '@/services/media.service'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function MediaManagement() {
  const router = useRouter()
  const [media, setMedia] = useState<Media[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedCollection, setSelectedCollection] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const collections = [
    { value: 'all', label: 'Tous' },
    { value: 'images', label: 'Images' },
    { value: 'videos', label: 'Vidéos' },
    { value: 'documents', label: 'Documents' },
    { value: 'audio', label: 'Audio' },
    { value: 'other', label: 'Autres' },
  ]

  useEffect(() => {
    loadMedia()
  }, [selectedCollection])

  const loadMedia = async () => {
    try {
      const params: any = {}
      if (selectedCollection !== 'all') {
        params.collection = selectedCollection
      }
      if (searchQuery) {
        params.search = searchQuery
      }
      const data = await mediaService.getAll(params)
      setMedia(data)
    } catch (error) {
      console.error('Erreur de chargement des médias:', error)
      toast.error('Erreur lors du chargement des médias')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        await mediaService.upload(file, {
          collection: selectedCollection !== 'all' ? selectedCollection : undefined,
        })
      }
      toast.success(`${files.length} fichier(s) uploadé(s) avec succès`)
      loadMedia()
    } catch (error: any) {
      console.error('Erreur lors de l\'upload:', error)
      toast.error(error?.response?.data?.error || 'Erreur lors de l\'upload')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleDelete = async (mediaId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce fichier ?')) return

    try {
      await mediaService.delete(mediaId)
      toast.success('Fichier supprimé avec succès')
      loadMedia()
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Erreur lors de la suppression')
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadMedia()
  }

  const filteredMedia = media.filter((item) => {
    if (searchQuery) {
      return item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             item.file_name.toLowerCase().includes(searchQuery.toLowerCase())
    }
    return true
  })

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement des médias...</p>
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
              Bibliothèque de Médias
            </h2>
            <p style={{ color: '#6b7280' }}>
              Gérez vos images, vidéos et documents
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              style={{
                padding: '0.75rem 1.5rem',
                background: uploading ? '#9ca3af' : '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              {uploading ? 'Upload en cours...' : '+ Uploader des fichiers'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>Collection:</label>
              <select
                value={selectedCollection}
                onChange={(e) => setSelectedCollection(e.target.value)}
                style={{
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              >
                {collections.map((col) => (
                  <option key={col.value} value={col.value}>
                    {col.label}
                  </option>
                ))}
              </select>
            </div>
            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '400px' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un fichier..."
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                }}
              />
              <button
                type="submit"
                style={{
                  padding: '0.5rem 1rem',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                }}
              >
                Rechercher
              </button>
            </form>
          </div>
        </div>

        {/* Media Grid */}
        {filteredMedia.length === 0 ? (
          <div style={{ background: 'white', padding: '3rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center' }}>
            <p style={{ fontSize: '3rem', marginBottom: '1rem' }}>📁</p>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>Aucun fichier</h3>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>Commencez par uploader vos premiers fichiers.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#2563eb',
                color: 'white',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
              }}
            >
              + Uploader des fichiers
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
            {filteredMedia.map((item) => (
              <div
                key={item.id}
                style={{
                  background: 'white',
                  borderRadius: '0.5rem',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Preview */}
                <div style={{ width: '100%', aspectRatio: '1', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  {item.is_image && item.url ? (
                    <img
                      src={item.url}
                      alt={item.alt_text || item.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                      <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
                        {item.collection === 'videos' ? '🎥' : item.collection === 'audio' ? '🎵' : item.collection === 'documents' ? '📄' : '📁'}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#6b7280', wordBreak: 'break-word' }}>{item.file_extension.toUpperCase()}</p>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(item.id)}
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      background: 'rgba(239, 68, 68, 0.9)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                    }}
                  >
                    🗑️
                  </button>
                </div>

                {/* Info */}
                <div style={{ padding: '0.75rem' }}>
                  <p style={{ fontSize: '0.875rem', fontWeight: '500', color: '#111827', marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.name}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {(item.size / 1024).toFixed(1)} KB
                  </p>
                  {item.url && (
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(item.url || '')
                        toast.success('URL copiée dans le presse-papier')
                      }}
                      style={{
                        marginTop: '0.5rem',
                        width: '100%',
                        padding: '0.25rem',
                        background: '#f3f4f6',
                        color: '#374151',
                        border: '1px solid #d1d5db',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                      }}
                    >
                      Copier l'URL
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

