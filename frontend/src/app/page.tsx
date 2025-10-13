'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    if (authService.isAuthenticated()) {
      if (authService.isSuperAdmin()) {
        router.push('/admin/dashboard')
      } else if (authService.isTenantAdmin()) {
        router.push('/dashboard')
      }
    } else {
      router.push('/login')
    }
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-4">VTCBuilder</h1>
        <p className="text-2xl mb-8">Le WordPress des Chauffeurs VTC</p>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  )
}

