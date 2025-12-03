'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import serviceService from '@/services/service.service'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function NewServicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    duration: '',
    category: '',
    is_active: true,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const serviceData = {
        name: formData.name,
        description: formData.description || '',
          base_price: formData.price ? parseFloat(formData.price) : undefined,
        is_active: formData.is_active,
        max_passengers: 4, // Valeur par défaut
        max_luggage: 2, // Valeur par défaut
        features: [], // Valeur par défaut
        order: 0, // Valeur par défaut
        // Les autres champs (price_per_km, price_per_minute, etc.) peuvent être ajoutés plus tard
      }
      
      await serviceService.create(serviceData)
      toast.success('Service créé avec succès !')
      router.push('/dashboard/services')
    } catch (error: any) {
      console.error('Erreur création service:', error)
      console.error('Response data:', error.response?.data)
      // Afficher les détails de validation si disponibles
      if (error.response?.data?.details) {
        const details = error.response.data.details
        const errorMessages = Object.entries(details).map(([field, messages]: [string, any]) => {
          const fieldName = field === 'name' ? 'Nom' : field === 'base_price' ? 'Prix' : field
          return `${fieldName}: ${Array.isArray(messages) ? messages.join(', ') : messages}`
        }).join('\n')
        toast.error(`Erreur de validation:\n${errorMessages}`, { duration: 5000 })
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error, { duration: 5000 })
      } else {
        toast.error('Erreur lors de la création du service. Vérifiez la console pour plus de détails.', { duration: 5000 })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  return (
    <TenantLayout 
      title="Nouveau Service" 
      subtitle="Créez un nouveau service pour votre entreprise"
    >
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations du Service</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remplissez les informations nécessaires pour créer un nouveau service</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Informations de Base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informations de Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom du Service *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Consultation stratégique"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Description détaillée du service..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prix (€) *
                    </label>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={handleChange}
                      required
                      placeholder="150.00"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Durée (minutes)
                    </label>
                    <input
                      id="duration"
                      name="duration"
                      type="number"
                      value={formData.duration}
                      onChange={handleChange}
                      placeholder="60"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Catégorie
                    </label>
                    <input
                      id="category"
                      name="category"
                      type="text"
                      value={formData.category}
                      onChange={handleChange}
                      placeholder="Consultation, Formation, etc."
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Service actif
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le Service'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TenantLayout>
  )
}
