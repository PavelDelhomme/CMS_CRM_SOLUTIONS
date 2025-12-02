'use client'

import { useState } from 'react'
import Drawer from './Drawer'
import DesktopSidebar from './DesktopSidebar'
import ImpersonationBanner from './ImpersonationBanner'
import ThemeToggle from './ThemeToggle'

interface TenantLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  headerActions?: React.ReactNode
}

export default function TenantLayout({ children, title, subtitle, headerActions }: TenantLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-x-hidden">
      {/* Impersonation Banner */}
      <ImpersonationBanner />
      
      {/* Mobile Header */}
      <header className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700 sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Ouvrir le menu"
            type="button"
          >
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <div className="flex-1 text-center">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate px-2">{title}</h1>
            {subtitle && <p className="text-xs text-gray-500 dark:text-gray-400 truncate px-2">{subtitle}</p>}
          </div>
          
          <ThemeToggle />
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar - Always visible on desktop */}
        <DesktopSidebar />

        {/* Mobile Drawer - Controlled by state */}
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 w-full min-w-0 lg:ml-64">
          {/* Desktop Header */}
          <header className="hidden lg:block bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-20">
            <div className="w-full py-6 px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight truncate">{title}</h1>
                  {subtitle && <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400 mt-1 truncate">{subtitle}</p>}
                </div>
                <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                  <ThemeToggle />
                  {headerActions && <div className="flex-shrink-0">{headerActions}</div>}
                </div>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="w-full py-4 sm:py-6 lg:py-8 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 min-h-[calc(100vh-80px)]">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
