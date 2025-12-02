'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import authService from '@/services/auth.service'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
}

export default function Drawer({ isOpen, onClose }: DrawerProps) {
  const router = useRouter()
  const pathname = usePathname()
  const user = authService.getStoredUser()

  // Fermer le drawer avec Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Empêcher le scroll du body quand le drawer est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊' },
    { name: 'Pages', href: '/dashboard/pages', icon: '📄' },
    { name: 'Services', href: '/dashboard/services', icon: '⚙️' },
    { name: 'Réservations', href: '/dashboard/bookings', icon: '📅' },
    { name: 'Médias', href: '/dashboard/media', icon: '🖼️' },
    { name: 'Templates', href: '/dashboard/templates', icon: '🎨' },
    { name: 'Utilisateurs', href: '/dashboard/users', icon: '👥' },
    { name: 'Facturation', href: '/dashboard/billing', icon: '💳' },
    { name: 'Paramètres', href: '/dashboard/settings', icon: '⚙️' },
  ]

  const handleItemClick = (href: string) => {
    router.push(href)
    onClose()
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
    onClose()
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={clsx(
          'fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out lg:hidden flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">CMS_CRM</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Plateforme CMS/CRM</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Fermer le menu"
            type="button"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto p-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <button
                key={item.href}
                onClick={() => handleItemClick(item.href)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors mb-1',
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                type="button"
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </button>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {user?.name || user?.email || 'Utilisateur'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email || ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors text-sm font-medium"
            type="button"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Déconnexion
          </button>
        </div>
      </div>
    </>
  )
}

