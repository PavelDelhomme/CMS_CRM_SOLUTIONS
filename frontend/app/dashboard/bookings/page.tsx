'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function BookingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState<any[]>([])

  useEffect(() => {
    setTimeout(() => {
      setBookings([])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <TenantLayout title="Réservations" subtitle="Gérez vos réservations">
        <PageLoader text="Chargement des réservations..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Réservations" 
      subtitle="Gérez vos réservations"
      headerActions={
        <button
          onClick={() => router.push('/dashboard/bookings/new')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          + Nouvelle réservation
        </button>
      }
    >
      <Toaster position="top-right" />

      {bookings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">Aucune réservation</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">Commencez par créer votre première réservation</p>
          <button
            onClick={() => router.push('/dashboard/bookings/new')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Créer une réservation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Liste des réservations */}
        </div>
      )}
    </TenantLayout>
  )
}

