'use client'

import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import authService from '@/services/auth.service'

export default function DesktopSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = authService.getStoredUser()

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
  }

  const handleLogout = () => {
    authService.logout()
    router.push('/login')
  }

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:bg-white lg:dark:bg-gray-800 lg:border-r lg:border-gray-200 lg:dark:border-gray-700 lg:h-screen lg:sticky lg:top-0">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-bold text-blue-600 dark:text-blue-400">CMS_CRM</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">Plateforme CMS/CRM</p>
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
    </aside>
  )
}

