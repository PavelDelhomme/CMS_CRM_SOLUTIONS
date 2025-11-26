'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminLayout from '@/components/AdminLayout'
import ResponsiveTable from '@/components/ResponsiveTable'
import userService, { User } from '@/services/user.service'


export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    loadUsers()
  }, [router])

  const loadUsers = async () => {
    try {
      const data = await userService.getAll()
      setUsers(data)
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleActivate = async (id: number) => {
    try {
      await userService.activate(id)
      loadUsers()
    } catch (error) {
      console.error('Erreur activation:', error)
      alert('Erreur lors de l\'activation')
    }
  }

  const handleDeactivate = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) return
    try {
      await userService.deactivate(id)
      loadUsers()
    } catch (error) {
      console.error('Erreur désactivation:', error)
      alert('Erreur lors de la désactivation')
    }
  }

  const handleSuspend = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir suspendre cet utilisateur ?')) return
    try {
      await userService.suspend(id)
      loadUsers()
    } catch (error) {
      console.error('Erreur suspension:', error)
      alert('Erreur lors de la suspension')
    }
  }

  const handlePasswordReset = async (id: number, email: string) => {
    if (!confirm(`Envoyer un email de réinitialisation de mot de passe à ${email} ?`)) return
    try {
      const result = await userService.sendPasswordReset(id)
      alert(result.message || 'Email de réinitialisation envoyé avec succès !')
    } catch (error: any) {
      console.error('Erreur envoi reset password:', error)
      alert(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email')
    }
  }

  const handleImpersonate = async (id: number, email: string) => {
    if (!confirm(`Impersonner l'utilisateur ${email} ?\n\nVous serez connecté en tant que cet utilisateur pour gérer ses problèmes.`)) {
      return
    }
    
    try {
      const result = await userService.impersonate(id)
      
      // Update tokens in localStorage
      if (result.tokens?.access) {
        localStorage.setItem('token', result.tokens.access)
        localStorage.setItem('refresh_token', result.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(result.target_user))
      }
      
      alert(result.message || 'Impersonnification démarrée')
      
      // Redirect to appropriate dashboard
      if (result.target_user?.role === 'tenant-admin') {
        router.push('/dashboard')
      } else {
        router.push('/dashboard')
      }
      
      // Reload page to refresh user context
      window.location.reload()
    } catch (error: any) {
      console.error('Erreur impersonnification:', error)
      alert(error.response?.data?.error || 'Erreur lors de l\'impersonnification')
    }
  }

  const handleDelete = async (id: number, email: string, userName: string, role: string) => {
    // Prevent deletion of super-admin
    if (role === 'super-admin') {
      alert('Impossible de supprimer un super-admin')
      return
    }

    const confirmMessage = `⚠️ ATTENTION ⚠️\n\nVous êtes sur le point de supprimer définitivement l'utilisateur "${userName || email}".\n\nCette action est IRRÉVERSIBLE.\n\nTapez "SUPPRIMER" pour confirmer :`
    
    const userInput = prompt(confirmMessage)
    if (userInput !== 'SUPPRIMER') {
      return
    }
    
    try {
      await userService.delete(id)
      alert('Utilisateur supprimé avec succès')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur suppression:', error)
      alert(error.response?.data?.error || 'Erreur lors de la suppression. Impossible de supprimer un super-admin.')
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadge = (role: string) => {
    const badges = {
      'super-admin': 'bg-purple-100 text-purple-800',
      'tenant-admin': 'bg-blue-100 text-blue-800',
      'driver': 'bg-green-100 text-green-800',
      'operator': 'bg-gray-100 text-gray-800',
    }
    return badges[role as keyof typeof badges] || 'bg-gray-100 text-gray-800'
  }

  const filteredUsers = users.filter(user => {
    const searchLower = search.toLowerCase()
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.tenant_name && user.tenant_name.toLowerCase().includes(searchLower))
    )
  })

  if (loading) {
    return (
      <AdminLayout title="Gestion des Utilisateurs" subtitle="Chargement...">
        <p>Chargement...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title="Gestion des Utilisateurs"
      subtitle="Gérez tous les utilisateurs de la plateforme"
    >
          <div className="mb-6">
            <input
              type="text"
              placeholder="Rechercher un utilisateur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <ResponsiveTable
            headers={['Utilisateur', 'Rôle', 'Tenant', 'Status', 'Créé le', 'Actions']}
            emptyMessage={search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur pour le moment'}
          >
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 sm:px-6 py-12 text-center text-gray-500">
                      {search ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur pour le moment'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{user.name || user.email}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.tenant_name || user.tenant?.name || '-'}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(user.created_at).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2 flex-wrap gap-2">
                          <button
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Modifier l'utilisateur"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {user.role !== 'super-admin' && (
                            <button
                              onClick={() => handleImpersonate(user.id, user.email)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Impersonner cet utilisateur"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </button>
                          )}
                          <button
                            onClick={() => handlePasswordReset(user.id, user.email)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Réinitialiser le mot de passe"
                          >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                            </svg>
                          </button>
                          {user.status === 'active' ? (
                            <>
                              <button
                                onClick={() => handleDeactivate(user.id)}
                                className="text-yellow-600 hover:text-yellow-900"
                                title="Désactiver"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleSuspend(user.id)}
                                className="text-red-600 hover:text-red-900"
                                title="Suspendre"
                              >
                                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                </svg>
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => handleActivate(user.id)}
                              className="text-green-600 hover:text-green-900"
                              title="Activer"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                              </svg>
                            </button>
                          )}
                          {user.role !== 'super-admin' && (
                            <button
                              onClick={() => handleDelete(user.id, user.email, user.name, user.role)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer définitivement"
                            >
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
          </ResponsiveTable>
    </AdminLayout>
  )
}

