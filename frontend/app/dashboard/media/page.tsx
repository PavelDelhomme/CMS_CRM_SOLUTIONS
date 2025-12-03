'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import mediaService from '@/services/media.service'
import type { Media } from '@/services/media.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

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
    } catch (error: any) {
      // Ne pas logger les erreurs réseau si le backend n'est pas disponible
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED' && error.code !== 'ERR_CONNECTION_RESET') {
        console.error('Erreur de chargement des médias:', error)
      }
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
      <TenantLayout title="Médias" subtitle="Gérez vos fichiers">
        <PageLoader text="Chargement des médias..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Bibliothèque de Médias" 
      subtitle="Gérez vos images, vidéos et documents"
      headerActions={
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Upload en cours...' : '+ Uploader des fichiers'}
        </button>
      }
    >
      <Toaster position="top-right" />

      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
      />

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Collection:</label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {collections.map((col) => (
                <option key={col.value} value={col.value}>
                  {col.label}
                </option>
              ))}
            </select>
          </div>
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un fichier..."
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Rechercher
            </button>
          </form>
        </div>
      </div>

      {/* Media Grid */}
      {filteredMedia.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <div className="text-6xl mb-4">📁</div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Aucun fichier</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Commencez par uploader vos premiers fichiers.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            + Uploader des fichiers
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow group"
            >
              {/* Preview */}
              <div className="w-full aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden">
                {item.is_image && item.url ? (
                  <img
                    src={item.url}
                    alt={item.alt_text || item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <div className="text-4xl mb-2">
                      {item.collection === 'videos' ? '🎥' : item.collection === 'audio' ? '🎵' : item.collection === 'documents' ? '📄' : '📁'}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 break-words">
                      {item.file_extension?.toUpperCase() || 'FILE'}
                    </p>
                  </div>
                )}
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded px-2 py-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  🗑️
                </button>
              </div>

              {/* Info */}
              <div className="p-3">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 truncate" title={item.name}>
                  {item.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A'}
                </p>
                {item.url && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(item.url || '')
                      toast.success('URL copiée dans le presse-papier')
                    }}
                    className="w-full px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded text-xs transition-colors"
                  >
                    Copier l'URL
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </TenantLayout>
  )
}
