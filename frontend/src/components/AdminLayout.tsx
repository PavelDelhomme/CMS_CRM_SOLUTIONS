'use client'

import { useState } from 'react'
import AdminSidebar from './AdminSidebar'
import MobileHeader from './MobileHeader'
import ImpersonationBanner from './ImpersonationBanner'

interface AdminLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  headerActions?: React.ReactNode
}

export default function AdminLayout({ children, title, subtitle, headerActions }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
      {/* Mobile Header */}
      <MobileHeader 
        title={title} 
        subtitle={subtitle}
        onMenuClick={() => setSidebarOpen(true)}
      />

      <div className="flex">
        {/* Sidebar - Toujours présent mais caché/surpimposé selon la taille d'écran */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 lg:ml-64">
          {/* Desktop Header avec hamburger pour ouvrir/fermer */}
          <header className="hidden lg:block bg-white shadow">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    aria-label="Toggle menu"
                    title={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
                  >
                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                  <div>
                    <h1 className="text-2xl xl:text-3xl font-bold text-gray-900">{title}</h1>
                    {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
                  </div>
                </div>
                {headerActions && <div className="w-full lg:w-auto">{headerActions}</div>}
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="max-w-7xl mx-auto py-4 lg:py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}

