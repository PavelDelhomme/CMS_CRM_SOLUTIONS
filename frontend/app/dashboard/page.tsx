'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import pageService from '@/services/page.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function TenantDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalPages: 0,
    publishedPages: 0,
    draftPages: 0,
    totalUsers: 1,
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const currentUser = authService.getStoredUser()
        if (currentUser) {
          setUser(currentUser)
        }

        // Charger les statistiques des pages
        try {
          const pages = await pageService.getAll()
          setStats({
            totalPages: pages.length,
            publishedPages: pages.filter((p: any) => p.status === 'published').length,
            draftPages: pages.filter((p: any) => p.status === 'draft').length,
            totalUsers: 1, // TODO: Charger depuis l'API
          })
        } catch (error: any) {
          // Ne pas logger les erreurs réseau si le backend n'est pas disponible
          if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED') {
            console.error('Erreur chargement stats:', error)
          }
        }
      } catch (error: any) {
        // Ne pas logger les erreurs réseau si le backend n'est pas disponible
        if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED') {
          console.error('Erreur chargement dashboard:', error)
        }
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  if (loading || !user) {
    return (
      <TenantLayout title="Dashboard">
        <PageLoader text="Chargement du dashboard..." />
      </TenantLayout>
    )
  }

  const quickActions = [
    {
      title: 'Gérer les Pages',
      description: 'Créer et modifier vos pages',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/pages',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
      textColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Paramètres',
      description: 'Configuration du site',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      href: '/dashboard/settings',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      textColor: 'text-gray-600 dark:text-gray-400',
    },
    {
      title: 'Médias',
      description: 'Images et fichiers',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/dashboard/media',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      textColor: 'text-yellow-600 dark:text-yellow-400',
    },
    {
      title: 'Utilisateurs',
      description: 'Gérer l\'équipe',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      href: '/dashboard/users',
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
      textColor: 'text-pink-600 dark:text-pink-400',
    },
  ]

  const menuItems = [
    {
      title: 'Services',
      description: 'Mes prestations',
      href: '/dashboard/services',
      icon: '🏢',
      color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    },
    {
      title: 'Réservations',
      description: 'Mes courses',
      href: '/dashboard/bookings',
      icon: '📅',
      color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    },
    {
      title: 'Templates',
      description: 'Design du site',
      href: '/dashboard/templates',
      icon: '🎨',
      color: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: 'Facturation',
      description: 'Abonnements & paiements',
      href: '/dashboard/billing',
      icon: '💳',
      color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    },
  ]

  return (
    <TenantLayout 
      title="Tableau de bord" 
      subtitle={`Bonjour ${user?.name || user?.email?.split('@')[0] || 'Utilisateur'} ! Bienvenue sur votre espace de gestion.`}
    >
      <Toaster position="top-right" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6 lg:mb-8 mt-4 sm:mt-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Total Pages</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalPages}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Publiées</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.publishedPages}</p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Brouillons</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.draftPages}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 lg:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Utilisateurs</p>
              <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-gray-100">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-xl">
              <svg className="w-6 h-6 lg:w-7 lg:h-7 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions - Actions Rapides */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6">Actions Rapides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => router.push(action.href)}
              className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300 overflow-hidden text-left"
            >
              <div className="p-5 lg:p-6">
                <div className={`inline-flex p-3 lg:p-4 rounded-xl mb-4 ${action.bgColor} ${action.textColor} group-hover:scale-110 transition-transform duration-200`}>
                  {action.icon}
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{action.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
              </div>
              <div className={`h-1 bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items - Autres Sections */}
      <div>
        <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4 lg:mb-6">Autres Sections</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {menuItems.map((item, index) => (
            <button
              key={index}
              onClick={() => router.push(item.href)}
              className="group bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-200 p-4 sm:p-5 lg:p-6 text-left"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <div className={`text-2xl sm:text-3xl lg:text-4xl ${item.color} p-2.5 sm:p-3 rounded-lg sm:rounded-xl group-hover:scale-110 transition-transform duration-200`}>
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-0.5 sm:mb-1">{item.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{item.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </TenantLayout>
  )
}

