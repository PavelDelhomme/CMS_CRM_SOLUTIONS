'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from '@/components/AdminSidebar'
import tenantService, { Tenant } from '@/services/tenant.service'
import userService, { User } from '@/services/user.service'
import ResponsiveTable from '@/components/ResponsiveTable'
import toast from 'react-hot-toast'

function AdminDebugSection({ tenantId }: { tenantId: number }) {
  const [adminInfo, setAdminInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resetting, setResetting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('admin123')

  useEffect(() => {
    loadAdminInfo()
  }, [tenantId])

  const loadAdminInfo = async () => {
    try {
      setLoading(true)
      const info = await tenantService.getAdminInfo(tenantId)
      setAdminInfo(info)
    } catch (error) {
      console.error('Erreur chargement info admin:', error)
      setAdminInfo({ exists: false })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!confirm(`Réinitialiser le mot de passe de ${adminInfo?.email || 'l\'admin'} en "${password}" ?`)) {
      return
    }

    try {
      setResetting(true)
      const result = await tenantService.resetAdminPassword(tenantId, password)
      setShowPassword(true)
      toast.success('Mot de passe réinitialisé avec succès !')
      loadAdminInfo()
    } catch (error: any) {
      console.error('Erreur réinitialisation mot de passe:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation')
    } finally {
      setResetting(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">Chargement des informations admin...</p>
      </div>
    )
  }

  if (!adminInfo || !adminInfo.exists) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-yellow-900 mb-2">🔐 Informations Admin (Debug)</h3>
        <p className="text-yellow-800">{adminInfo?.message || 'Aucun utilisateur admin trouvé pour ce tenant'}</p>
      </div>
    )
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-yellow-900 mb-4">🔐 Informations Admin (Debug)</h3>
      
      <dl className="grid grid-cols-1 gap-4 mb-4">
        <div>
          <dt className="text-sm font-medium text-yellow-800">Email Admin</dt>
          <dd className="mt-1 text-sm text-yellow-900 font-mono">{adminInfo.email}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-yellow-800">Username</dt>
          <dd className="mt-1 text-sm text-yellow-900 font-mono">{adminInfo.username}</dd>
        </div>
        <div>
          <dt className="text-sm font-medium text-yellow-800">Statut</dt>
          <dd className="mt-1 text-sm text-yellow-900 capitalize">{adminInfo.status}</dd>
        </div>
      </dl>

      <div className="border-t border-yellow-300 pt-4 mt-4">
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label htmlFor="password" className="block text-sm font-medium text-yellow-800 mb-2">
              Mot de passe à définir
            </label>
            <input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="admin123"
            />
          </div>
          <button
            onClick={handleResetPassword}
            disabled={resetting || !password}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resetting ? 'Réinitialisation...' : 'Réinitialiser'}
          </button>
        </div>

        {showPassword && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
            <p className="text-sm font-medium text-yellow-900 mb-1">✅ Mot de passe réinitialisé !</p>
            <p className="text-xs text-yellow-800">
              Email: <span className="font-mono font-semibold">{adminInfo.email}</span>
            </p>
            <p className="text-xs text-yellow-800">
              Mot de passe: <span className="font-mono font-semibold">{password}</span>
            </p>
            <p className="text-xs text-yellow-700 mt-2">
              Vous pouvez maintenant vous connecter avec ces identifiants sur{' '}
              <a
                href="http://localhost:9494/login"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold"
              >
                http://localhost:9494/login
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function TenantUsersTab({ tenantId, tenantName }: { tenantId: number; tenantName: string }) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [editingPassword, setEditingPassword] = useState<number | null>(null)
  const [passwordData, setPasswordData] = useState<{ [key: number]: { new_password: string; confirm_password: string } }>({})
  const [passwordSaving, setPasswordSaving] = useState<{ [key: number]: boolean }>({})

  useEffect(() => {
    loadUsers()
  }, [tenantId])

  const loadUsers = async () => {
    try {
      setLoading(true)
      // Récupérer tous les utilisateurs du tenant spécifié
      console.log('🔍 Chargement utilisateurs pour tenant:', tenantId)
      const data = await userService.getAll({ tenant_id: tenantId })
      console.log('📦 Données reçues:', data)
      
      // Handle different response formats
      let usersArray: User[] = []
      if (Array.isArray(data)) {
        usersArray = data
      } else if (data && typeof data === 'object') {
        usersArray = data.results || data.data || []
      }
      
      console.log('👥 Utilisateurs extraits:', usersArray)
      setUsers(usersArray)
      
      if (usersArray.length === 0) {
        console.warn('⚠️ Aucun utilisateur trouvé pour ce tenant')
      }
    } catch (error) {
      console.error('❌ Erreur chargement utilisateurs:', error)
      toast.error('Erreur lors du chargement des utilisateurs')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (userId: number, userEmail: string) => {
    if (!confirm(`Envoyer un email de réinitialisation de mot de passe à ${userEmail} ?`)) {
      return
    }

    try {
      await userService.sendPasswordReset(userId)
      toast.success('Email de réinitialisation envoyé avec succès !')
    } catch (error: any) {
      console.error('Erreur envoi email reset:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi de l\'email')
    }
  }

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ?`)) {
      return
    }

    try {
      await userService.delete(userId)
      toast.success('Utilisateur supprimé avec succès !')
      loadUsers()
    } catch (error: any) {
      console.error('Erreur suppression utilisateur:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la suppression')
    }
  }

  const handleEditPassword = (userId: number) => {
    setEditingPassword(userId)
    setPasswordData({
      ...passwordData,
      [userId]: { new_password: '', confirm_password: '' }
    })
  }

  const handleCancelEditPassword = (userId: number) => {
    setEditingPassword(null)
    const newPasswordData = { ...passwordData }
    delete newPasswordData[userId]
    setPasswordData(newPasswordData)
  }

  const handleSavePassword = async (userId: number) => {
    const pwdData = passwordData[userId]
    if (!pwdData) return

    if (pwdData.new_password !== pwdData.confirm_password) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (pwdData.new_password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setPasswordSaving({ ...passwordSaving, [userId]: true })

    try {
      await userService.update(userId, {
        password: pwdData.new_password
      })
      toast.success('Mot de passe modifié avec succès !')
      handleCancelEditPassword(userId)
      // Optionnel: forcer reconnexion utilisateur si besoin
    } catch (error: any) {
      console.error('Erreur modification mot de passe:', error)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          (error.response?.data?.username ? `Erreur: ${error.response.data.username.join(', ')}` : null) ||
                          'Erreur lors de la modification du mot de passe'
      toast.error(errorMessage)
      console.error('Détails erreur:', error.response?.data)
    } finally {
      setPasswordSaving({ ...passwordSaving, [userId]: false })
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: string } = {
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      suspended: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getRoleBadge = (role: string) => {
    const badges: { [key: string]: string } = {
      'tenant-admin': 'bg-purple-100 text-purple-800',
      'driver': 'bg-blue-100 text-blue-800',
      'operator': 'bg-indigo-100 text-indigo-800',
    }
    return badges[role] || 'bg-gray-100 text-gray-800'
  }

  const filteredUsers = users.filter(user => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      user.email?.toLowerCase().includes(searchLower) ||
      user.name?.toLowerCase().includes(searchLower) ||
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower)
    )
  })

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des utilisateurs...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-semibold">Utilisateurs de {tenantName}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {users.length} utilisateur{users.length > 1 ? 's' : ''} au total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">
            {search ? 'Aucun utilisateur trouvé pour cette recherche' : 'Aucun utilisateur trouvé pour ce tenant'}
          </p>
          {!search && (
            <p className="text-sm text-gray-500">
              L'utilisateur admin devrait normalement apparaître ici. Vérifiez que le tenant a bien un admin.
            </p>
          )}
        </div>
      ) : (
        <ResponsiveTable
          headers={['Nom', 'Email', 'Rôle', 'Statut', 'Créé le', 'Actions']}
          emptyMessage="Aucun utilisateur"
        >
          {filteredUsers.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-sm font-medium text-gray-700">
                      {user.first_name?.[0] || user.last_name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                    </span>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {user.name || user.email || 'Sans nom'}
                    </div>
                    {user.first_name || user.last_name ? (
                      <div className="text-sm text-gray-500">
                        {user.first_name} {user.last_name}
                      </div>
                    ) : null}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900 font-mono">{user.email}</div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                  {user.role === 'tenant-admin' ? 'Admin Tenant' : user.role}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(user.status)}`}>
                  {user.status === 'active' ? 'Actif' : user.status === 'pending' ? 'En attente' : user.status}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                {editingPassword === user.id ? (
                  <div className="flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                      <input
                        type="password"
                        placeholder="Nouveau mot de passe"
                        value={passwordData[user.id]?.new_password || ''}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          [user.id]: {
                            ...passwordData[user.id],
                            new_password: e.target.value,
                            confirm_password: passwordData[user.id]?.confirm_password || ''
                          }
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-32"
                        minLength={8}
                      />
                      <input
                        type="password"
                        placeholder="Confirmer"
                        value={passwordData[user.id]?.confirm_password || ''}
                        onChange={(e) => setPasswordData({
                          ...passwordData,
                          [user.id]: {
                            ...passwordData[user.id],
                            confirm_password: e.target.value,
                            new_password: passwordData[user.id]?.new_password || ''
                          }
                        })}
                        className="px-2 py-1 border border-gray-300 rounded text-xs w-32"
                        minLength={8}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePassword(user.id)}
                        disabled={passwordSaving[user.id]}
                        className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {passwordSaving[user.id] ? 'Sauvegarde...' : '✅ Sauvegarder'}
                      </button>
                      <button
                        onClick={() => handleCancelEditPassword(user.id)}
                        disabled={passwordSaving[user.id]}
                        className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        ❌ Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditPassword(user.id)}
                      className="text-green-600 hover:text-green-900"
                      title="Modifier le mot de passe directement"
                    >
                      🔒 Modifier MDP
                    </button>
                    <button
                      onClick={() => handleResetPassword(user.id, user.email)}
                      className="text-blue-600 hover:text-blue-900"
                      title="Envoyer un email de réinitialisation"
                    >
                      🔑 Reset Email
                    </button>
                    {user.role !== 'tenant-admin' && (
                      <button
                        onClick={() => handleDeleteUser(user.id, user.email)}
                        className="text-red-600 hover:text-red-900"
                        title="Supprimer l'utilisateur"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </ResponsiveTable>
      )}
    </div>
  )
}

type Tab = 'overview' | 'users' | 'billing' | 'site' | 'settings'

export default function TenantDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tenantId = params?.id ? parseInt(params.id as string) : null
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')

  useEffect(() => {
    if (!authService.isSuperAdmin()) {
      router.push('/dashboard')
      return
    }
    if (tenantId) {
      console.log('🔄 Chargement tenant avec ID:', tenantId)
      loadTenant()
    } else {
      console.warn('⚠️ Aucun tenantId fourni')
      setLoading(false)
    }
  }, [router, tenantId])

  const loadTenant = async () => {
    try {
      const data = await tenantService.getById(tenantId!)
      setTenant(data)
    } catch (error) {
      console.error('Erreur chargement tenant:', error)
      router.push('/admin/tenants')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <AdminSidebar />
        <div className="flex-1 ml-64 p-8">
          <p>Chargement...</p>
        </div>
      </div>
    )
  }

  if (!tenant) {
    return null
  }

  const tabs = [
    { id: 'overview' as Tab, name: 'Vue d\'ensemble', icon: '📊' },
    { id: 'users' as Tab, name: 'Utilisateurs', icon: '👥' },
    { id: 'billing' as Tab, name: 'Facturation', icon: '💳' },
    { id: 'site' as Tab, name: 'Site Web', icon: '🌐' },
    { id: 'settings' as Tab, name: 'Paramètres', icon: '⚙️' },
  ]

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <AdminSidebar />

      <div className="flex-1 ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => router.push('/admin/tenants')}
                  className="text-gray-600 hover:text-gray-900 mb-2 flex items-center"
                >
                  <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Retour aux tenants
                </button>
                <h1 className="text-3xl font-bold text-gray-900">{tenant.name}</h1>
                <p className="text-sm text-gray-600 mt-1">{tenant.email}</p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                  tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {tenant.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tenant.plan === 'enterprise' ? 'bg-purple-100 text-purple-800' :
                  tenant.plan === 'business' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.plan}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">Informations du Tenant</h2>
                <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Nom</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tenant.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Email</dt>
                    <dd className="mt-1 text-sm text-gray-900">{tenant.email}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Slug</dt>
                    <dd className="mt-1 text-sm text-gray-900">/{tenant.slug}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Plan</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.plan}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Statut</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{tenant.status}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Créé le</dt>
                    <dd className="mt-1 text-sm text-gray-900">
                      {new Date(tenant.created_at).toLocaleDateString('fr-FR')}
                    </dd>
                  </div>
                </dl>
              </div>

              <AdminDebugSection tenantId={tenantId!} />
            </div>
          )}

          {activeTab === 'users' && (
            <TenantUsersTab tenantId={tenantId!} tenantName={tenant.name} />
          )}

          {activeTab === 'billing' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Facturation</h2>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                  + Nouvel abonnement
                </button>
              </div>
              <p className="text-gray-600">Gestion des abonnements et factures (à implémenter)</p>
            </div>
          )}

          {activeTab === 'site' && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Gestion du Site Web</h2>
                <a
                  href={`http://${tenant.slug}.localhost:9494`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  Voir le site
                </a>
              </div>
              <p className="text-gray-600">Interface de gestion du site (éditeur WordPress-style à implémenter)</p>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Paramètres</h2>
              <p className="text-gray-600">Paramètres du tenant (à implémenter)</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

