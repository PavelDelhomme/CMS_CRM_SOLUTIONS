'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import userService from '@/services/user.service'
import type { User } from '@/services/auth.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function UsersPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [users, setUsers] = useState<User[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const params: any = {}
      if (searchQuery) {
        params.search = searchQuery
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      if (roleFilter !== 'all') {
        params.role = roleFilter
      }
      const data = await userService.getAll(params)
      setUsers(data)
    } catch (error: any) {
      // Ne pas logger les erreurs réseau si le backend n'est pas disponible
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED' && error.code !== 'ERR_CONNECTION_RESET') {
        console.error('Erreur de chargement des utilisateurs:', error)
      }
      toast.error('Erreur lors du chargement des utilisateurs')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.')) return

    try {
      await userService.delete(userId)
      toast.success('Utilisateur supprimé avec succès')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleActivate = async (userId: number) => {
    try {
      await userService.activate(userId)
      toast.success('Utilisateur activé avec succès')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur lors de l\'activation:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'activation')
    }
  }

  const handleDeactivate = async (userId: number) => {
    try {
      await userService.deactivate(userId)
      toast.success('Utilisateur désactivé avec succès')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur lors de la désactivation:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la désactivation')
    }
  }

  const handleSendPasswordReset = async (userId: number) => {
    try {
      await userService.sendPasswordReset(userId)
      toast.success('Email de réinitialisation envoyé')
    } catch (error: any) {
      console.error('Erreur lors de l\'envoi:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email')
    }
  }

  const getRoleLabel = (user: User) => {
    if (user.is_superuser) return 'Super Admin'
    if (user.is_staff) return 'Admin'
    if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
      return user.roles[0]
    }
    return 'Utilisateur'
  }

  const getStatusLabel = (user: User) => {
    if (user.is_active === false) return 'Inactif'
    return 'Actif'
  }

  // Filter users
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.username?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && user.is_active !== false) ||
                         (statusFilter === 'inactive' && user.is_active === false)
    const matchesRole = roleFilter === 'all' || getRoleLabel(user).toLowerCase() === roleFilter.toLowerCase()
    return matchesSearch && matchesStatus && matchesRole
  })

  const headerActions = (
    <button
      onClick={() => router.push('/dashboard/users/new')}
      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
      Nouvel Utilisateur
    </button>
  )

  if (loading) {
    return (
      <TenantLayout title="Utilisateurs" subtitle="Gérez les utilisateurs">
        <PageLoader text="Chargement des utilisateurs..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Gestion des Utilisateurs" 
      subtitle="Gérez les utilisateurs de votre plateforme"
      headerActions={headerActions}
    >
      <Toaster position="top-right" />

      {/* Search and Filter Bar */}
      <div className="mb-4 sm:mb-6 bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {['all', 'active', 'inactive'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status === 'all' ? 'Tous' : status === 'active' ? 'Actifs' : 'Inactifs'}
              </button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex gap-2">
            {['all', 'super admin', 'admin', 'utilisateur'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  roleFilter === role
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {role === 'all' ? 'Tous' : role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{users.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Actifs</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {users.filter(u => u.is_active !== false).length}
              </p>
            </div>
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <svg className="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Inactifs</p>
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                {users.filter(u => u.is_active === false).length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Résultats</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{filteredUsers.length}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {users.length === 0 ? 'Aucun utilisateur' : 'Aucun utilisateur trouvé'}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {users.length === 0 
                ? 'Commencez par créer votre premier utilisateur.'
                : 'Essayez de modifier vos critères de recherche ou de filtre.'}
            </p>
            {users.length === 0 && (
              <button
                onClick={() => router.push('/dashboard/users/new')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Créer un Utilisateur
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {user.name || user.username || 'Sans nom'}
                          </div>
                          {user.username && user.username !== user.name && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              @{user.username}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-600 dark:text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                        {getRoleLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        user.is_active !== false
                          ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                          : 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400'
                      }`}>
                        {getStatusLabel(user)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => router.push(`/dashboard/users/${user.id}/edit`)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 px-3 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                          Modifier
                        </button>
                        {user.is_active !== false ? (
                          <button
                            onClick={() => handleDeactivate(user.id)}
                            className="text-amber-600 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-300 px-3 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                          >
                            Désactiver
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivate(user.id)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            Activer
                          </button>
                        )}
                        <button
                          onClick={() => handleSendPasswordReset(user.id)}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-900 dark:hover:text-purple-300 px-3 py-1 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                          title="Envoyer un email de réinitialisation"
                        >
                          🔑
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 px-3 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </TenantLayout>
  )
}
