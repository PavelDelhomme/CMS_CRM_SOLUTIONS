'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import authService from '@/services/auth.service'

export default function PublicHeader() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    if (typeof window !== 'undefined') {
      setIsAuthenticated(authService.isAuthenticated())
      setIsSuperAdmin(authService.isSuperAdmin())
    }
  }, [])

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold text-white">VTCBuilder</h1>
            <span className="text-xs text-white/80">Beta</span>
          </Link>
          <div className="flex items-center space-x-4">
            {!isMounted ? (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-blue-100 font-medium"
                  suppressHydrationWarning
                >
                  Connexion
                </Link>
              </>
            ) : isAuthenticated ? (
              <>
                {isSuperAdmin ? (
                  <Link
                    href="/admin/dashboard"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Administration
                  </Link>
                ) : (
                  <Link
                    href="/dashboard"
                    className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                  >
                    Mon Dashboard
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-white hover:text-blue-100 font-medium"
                >
                  Connexion
                </Link>
                <Link
                  href="/register"
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

