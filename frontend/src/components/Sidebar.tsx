'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import authService from '@/services/auth.service'
import tenantService from '@/services/tenant.service'
import { isFeatureEnabled } from '@/lib/tenant-features'

interface MenuItem {
  name: string
  href: string
  icon: React.ReactNode
  featureId?: string // Feature ID required to show/hide this menu item
}

interface SidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ isOpen: externalIsOpen, onClose }: SidebarProps = {}) {
  const router = useRouter()
  const pathname = usePathname()
  const user = authService.getStoredUser()
  const [isOpen, setIsOpen] = useState(false)
  const [enabledFeatures, setEnabledFeatures] = useState<string[]>([])

  // Use external control if provided, otherwise use internal state
  const sidebarOpen = externalIsOpen !== undefined ? externalIsOpen : isOpen
  const handleClose = onClose || (() => setIsOpen(false))

  // Load enabled features for the tenant
  useEffect(() => {
    const loadEnabledFeatures = async () => {
      try {
        if (user?.tenant_id) {
          const tenant = await tenantService.getById(user.tenant_id)
          const features = tenant?.settings?.enabled_features || []
          // If no features configured, enable all by default (backward compatibility)
          setEnabledFeatures(features.length > 0 ? features : ['pages', 'media', 'services', 'bookings', 'users', 'templates', 'billing'])
        } else {
          // No tenant, enable all features (for super admin viewing tenant interface)
          setEnabledFeatures(['pages', 'media', 'services', 'bookings', 'users', 'templates', 'billing'])
        }
      } catch (error) {
        console.error('Error loading enabled features:', error)
        // On error, enable all features by default
        setEnabledFeatures(['pages', 'media', 'services', 'bookings', 'users', 'templates', 'billing'])
      }
    }

    if (user) {
      loadEnabledFeatures()
    }
  }, [user])

  const menuItems: MenuItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      // Dashboard is always visible
    },
    {
      name: 'Pages',
      href: '/dashboard/pages',
      featureId: 'pages',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Services VTC',
      href: '/dashboard/services',
      featureId: 'services',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
    },
    {
      name: 'Réservations',
      href: '/dashboard/bookings',
      featureId: 'bookings',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Médias',
      href: '/dashboard/media',
      featureId: 'media',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: 'Templates',
      href: '/dashboard/templates',
      featureId: 'templates',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
    },
    {
      name: 'Utilisateurs',
      href: '/dashboard/users',
      featureId: 'users',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: 'Facturation',
      href: '/dashboard/billing',
      // Billing is always visible (payments feature controls payment methods)
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      name: 'Paramètres',
      href: '/dashboard/settings',
      // Settings is always visible
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ]

  // Filter menu items based on enabled features
  const visibleMenuItems = menuItems.filter(item => {
    // Always show items without featureId (Dashboard, Settings, Billing)
    if (!item.featureId) {
      return true
    }
    // Show item only if feature is enabled
    return isFeatureEnabled(item.featureId, enabledFeatures)
  })

  const handleItemClick = (href: string) => {
    router.push(href)
    handleClose() // Close sidebar on mobile after navigation
  }

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={handleClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 border-b flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-blue-600">VTCBuilder</h2>
            <p className="text-xs text-gray-500">Le WordPress des VTC</p>
          </div>
          {/* Close button for mobile */}
          <button
            onClick={handleClose}
            className="lg:hidden text-gray-500 hover:text-gray-700"
            aria-label="Fermer le menu"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 mt-6 overflow-y-auto">
          {visibleMenuItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            
            return (
              <button
                key={item.href}
                onClick={() => handleItemClick(item.href)}
                className={clsx(
                  'w-full flex items-center px-6 py-3 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <span className={clsx(isActive ? 'text-blue-700' : 'text-gray-400')}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.name}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-6 border-t">
          <div className="flex items-center justify-between">
            <div suppressHydrationWarning>
              <p className="text-sm font-medium text-gray-900">
                {typeof window !== 'undefined' ? (user?.name || 'Utilisateur') : 'Utilisateur'}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-[180px]">
                {typeof window !== 'undefined' ? (user?.email || '') : ''}
              </p>
            </div>
            <button
              onClick={() => {
                authService.logout()
                router.push('/login')
              }}
              className="text-gray-400 hover:text-gray-600"
              title="Déconnexion"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

