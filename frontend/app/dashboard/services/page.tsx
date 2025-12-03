'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function ServicesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<any[]>([])

  useEffect(() => {
    setTimeout(() => {
      setServices([])
      setLoading(false)
    }, 500)
  }, [])

  if (loading) {
    return (
      <TenantLayout title="Services" subtitle="Gérez vos prestations">
        <PageLoader text="Chargement des services..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Services" 
      subtitle="Gérez vos prestations"
      headerActions={
        <button
          onClick={() => router.push('/dashboard/services/new')}
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
        >
          + Nouveau service
        </button>
      }
    >
      <Toaster position="top-right" />

      {services.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <svg className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <p className="text-gray-600 dark:text-gray-400 text-lg font-medium mb-2">Aucun service</p>
          <p className="text-gray-500 dark:text-gray-500 text-sm mb-4">Commencez par créer votre premier service</p>
          <button
            onClick={() => router.push('/dashboard/services/new')}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Créer un service
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Liste des services */}
        </div>
      )}
    </TenantLayout>
  )
}

