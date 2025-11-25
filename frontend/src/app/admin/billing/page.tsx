'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from '@/components/AdminSidebar'

export default function BillingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-gray-900">Facturation</h1>
            <p className="text-sm text-gray-600 mt-1">Gestion de la facturation et des paiements</p>
          </div>
        </header>

        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Système de facturation en cours de développement</h2>
            <p className="text-gray-600 mb-4">Cette section permettra de :</p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Gérer les abonnements des tenants</li>
              <li>Voir les paiements et factures</li>
              <li>Gérer les plans tarifaires</li>
              <li>Suivre les revenus</li>
            </ul>
          </div>
        </main>
      </div>
    </div>
  )
}

