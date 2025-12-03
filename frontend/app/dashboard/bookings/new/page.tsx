'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import bookingService from '@/services/booking.service'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function NewBookingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service: '',
    date: '',
    time: '',
    duration: '',
    location: '',
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const bookingData = {
        client_name: formData.client_name,
        client_email: formData.client_email,
        client_phone: formData.client_phone || null,
        service: formData.service,
        date: formData.date,
        time: formData.time,
        duration: formData.duration ? parseInt(formData.duration) : undefined,
        location: formData.location || undefined,
        notes: formData.notes || undefined,
      }
      
      await bookingService.create(bookingData)
      toast.success('Réservation créée avec succès !')
      router.push('/dashboard/bookings')
    } catch (error: any) {
      console.error('Erreur création réservation:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la création de la réservation')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <TenantLayout 
      title="Nouvelle Réservation" 
      subtitle="Créez une nouvelle réservation pour un client"
    >
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations de la Réservation</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Remplissez les informations nécessaires pour créer une nouvelle réservation</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Informations Client */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informations Client</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="client_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom du Client *
                    </label>
                    <input
                      id="client_name"
                      name="client_name"
                      type="text"
                      value={formData.client_name}
                      onChange={handleChange}
                      required
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="client_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email du Client *
                    </label>
                    <input
                      id="client_email"
                      name="client_email"
                      type="email"
                      value={formData.client_email}
                      onChange={handleChange}
                      required
                      placeholder="jean.dupont@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="client_phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone
                    </label>
                    <input
                      id="client_phone"
                      name="client_phone"
                      type="tel"
                      value={formData.client_phone}
                      onChange={handleChange}
                      placeholder="+33 6 12 34 56 78"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Détails de la Réservation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Détails de la Réservation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Service *
                    </label>
                    <input
                      id="service"
                      name="service"
                      type="text"
                      value={formData.service}
                      onChange={handleChange}
                      required
                      placeholder="Service à réserver"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="date" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date *
                    </label>
                    <input
                      id="date"
                      name="date"
                      type="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="time" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Heure *
                    </label>
                    <input
                      id="time"
                      name="time"
                      type="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
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
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Lieu
                    </label>
                    <input
                      id="location"
                      name="location"
                      type="text"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="Adresse ou lieu de rendez-vous"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notes
                    </label>
                    <textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Notes supplémentaires sur la réservation..."
                    />
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
                {loading ? 'Création...' : 'Créer la Réservation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TenantLayout>
  )
}
