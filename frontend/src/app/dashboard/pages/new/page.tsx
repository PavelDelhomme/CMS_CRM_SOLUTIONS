'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import pageService from '@/services/page.service'
import toast from 'react-hot-toast'

const pageSchema = z.object({
  title: z.string().min(1, 'Titre requis'),
  content: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  status: z.enum(['draft', 'published', 'scheduled']),
  is_homepage: z.boolean().optional(),
})

type PageForm = z.infer<typeof pageSchema>

export default function NewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PageForm>({
    resolver: zodResolver(pageSchema),
    defaultValues: {
      status: 'draft',
      is_homepage: false,
    },
  })

  const onSubmit = async (data: PageForm) => {
    setLoading(true)
    try {
      await pageService.create(data)
      toast.success('Page créée avec succès !')
      router.push('/dashboard/pages')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <button
            onClick={() => router.push('/dashboard/pages')}
            className="text-sm text-gray-600 hover:text-gray-900 mb-2 flex items-center"
          >
            ← Retour aux pages
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Nouvelle Page</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold mb-4">Informations de la Page</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de la page *
                </label>
                <input
                  {...register('title')}
                  type="text"
                  className="input"
                  placeholder="À propos de nous"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contenu
                </label>
                <textarea
                  {...register('content')}
                  rows={10}
                  className="input"
                  placeholder="Contenu de votre page..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre SEO
                </label>
                <input
                  {...register('meta_title')}
                  type="text"
                  className="input"
                  placeholder="Titre pour les moteurs de recherche"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description SEO
                </label>
                <textarea
                  {...register('meta_description')}
                  rows={3}
                  className="input"
                  placeholder="Description pour les moteurs de recherche"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Statut
                </label>
                <select {...register('status')} className="input">
                  <option value="draft">Brouillon</option>
                  <option value="published">Publié</option>
                  <option value="scheduled">Programmé</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  {...register('is_homepage')}
                  type="checkbox"
                  id="is_homepage"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="is_homepage" className="ml-2 block text-sm text-gray-900">
                  Définir comme page d'accueil
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/pages')}
              className="btn btn-secondary"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Création...' : 'Créer la page'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}

