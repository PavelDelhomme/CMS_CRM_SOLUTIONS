'use client'

import { useState, useEffect } from 'react'
import authService from '@/services/auth.service'
import tenantService from '@/services/tenant.service'
import type { User } from '@/services/auth.service'
import type { Tenant } from '@/services/tenant.service'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [tenant, setTenant] = useState<Tenant | null>(null)
  
  // User form data
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    username: '',
    first_name: '',
    last_name: '',
  })
  
  // Tenant form data
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    domain: '',
    subdomain: '',
    primary_color: '#3B82F6',
    secondary_color: '#8B5CF6',
  })
  
  // Password form data
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    password: '',
    password_confirmation: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Load current user
      const currentUser = authService.getStoredUser()
      if (currentUser) {
        setUser(currentUser)
        setUserForm({
          name: currentUser.name || '',
          email: currentUser.email || '',
          username: currentUser.username || '',
          first_name: currentUser.first_name || '',
          last_name: currentUser.last_name || '',
        })
        
        // Load tenant if user has one
        if (currentUser.tenant_id) {
          try {
            const tenantData = await tenantService.getById(currentUser.tenant_id)
            setTenant(tenantData)
            setTenantForm({
              name: tenantData.name || '',
              email: tenantData.email || '',
              domain: tenantData.domain || '',
              subdomain: tenantData.subdomain || '',
              primary_color: tenantData.primary_color || '#3B82F6',
              secondary_color: tenantData.secondary_color || '#8B5CF6',
            })
          } catch (error: any) {
            // Ne pas logger les erreurs réseau si le backend n'est pas disponible
            if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED' && error.code !== 'ERR_CONNECTION_RESET') {
              console.error('Erreur chargement tenant:', error)
            }
          }
        }
      }
    } catch (error: any) {
      // Ne pas logger les erreurs réseau si le backend n'est pas disponible
      if (error.code !== 'ERR_NETWORK' && error.code !== 'ERR_SOCKET_NOT_CONNECTED' && error.code !== 'ERR_CONNECTION_RESET') {
        console.error('Erreur chargement données:', error)
      }
      toast.error('Erreur lors du chargement des paramètres')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const updatedUser = await authService.updateProfile(userForm)
      setUser(updatedUser)
      authService.getStoredUser() // Refresh stored user
      toast.success('Profil mis à jour avec succès !')
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du profil')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTenant = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tenant) {
      toast.error('Aucun tenant associé à votre compte')
      return
    }

    setSaving(true)

    try {
      const updatedTenant = await tenantService.update(tenant.id, tenantForm)
      setTenant(updatedTenant)
      toast.success('Paramètres du tenant mis à jour avec succès !')
    } catch (error: any) {
      console.error('Erreur mise à jour tenant:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la mise à jour du tenant')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordForm.password !== passwordForm.password_confirmation) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (passwordForm.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setSaving(true)

    try {
      await authService.updatePassword({
        current_password: passwordForm.current_password,
        password: passwordForm.password,
        password_confirmation: passwordForm.password_confirmation,
      })
      toast.success('Mot de passe modifié avec succès !')
      setPasswordForm({
        current_password: '',
        password: '',
        password_confirmation: '',
      })
    } catch (error: any) {
      console.error('Erreur changement mot de passe:', error)
      toast.error(error.response?.data?.error || 'Erreur lors du changement de mot de passe')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <TenantLayout title="Paramètres" subtitle="Gérez les paramètres de votre compte et de votre tenant">
        <PageLoader text="Chargement des paramètres..." />
      </TenantLayout>
    )
  }

  return (
    <TenantLayout 
      title="Paramètres" 
      subtitle="Gérez les paramètres de votre compte et de votre tenant"
    >
      <Toaster position="top-right" />

      <div className="space-y-6">
        {/* Section Compte */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Paramètres du compte</h2>
          <form onSubmit={handleUpdateUser}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom complet
                  </label>
                  <input
                    type="text"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre nom complet"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="votre@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom d'utilisateur
                  </label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="nom_utilisateur"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={userForm.first_name}
                    onChange={(e) => setUserForm({ ...userForm, first_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Jean"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nom
                  </label>
                  <input
                    type="text"
                    value={userForm.last_name}
                    onChange={(e) => setUserForm({ ...userForm, last_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dupont"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

        {/* Section Tenant */}
        {tenant && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Paramètres du tenant</h2>
            <form onSubmit={handleUpdateTenant}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nom du tenant
                    </label>
                    <input
                      type="text"
                      value={tenantForm.name}
                      onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Nom de votre organisation"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Email du tenant
                    </label>
                    <input
                      type="email"
                      value={tenantForm.email}
                      onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="contact@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Domaine
                    </label>
                    <input
                      type="text"
                      value={tenantForm.domain}
                      onChange={(e) => setTenantForm({ ...tenantForm, domain: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="votre-domaine.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Sous-domaine
                    </label>
                    <input
                      type="text"
                      value={tenantForm.subdomain}
                      onChange={(e) => setTenantForm({ ...tenantForm, subdomain: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="sous-domaine"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur primaire
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tenantForm.primary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tenantForm.primary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, primary_color: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Couleur secondaire
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={tenantForm.secondary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, secondary_color: e.target.value })}
                        className="w-16 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={tenantForm.secondary_color}
                        onChange={(e) => setTenantForm({ ...tenantForm, secondary_color: e.target.value })}
                        className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="#8B5CF6"
                      />
                    </div>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
                >
                  {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Section Sécurité */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">Sécurité</h2>
          <form onSubmit={handleUpdatePassword}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mot de passe actuel
                </label>
                <input
                  type="password"
                  value={passwordForm.current_password}
                  onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nouveau mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordForm.password}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Minimum 8 caractères</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <input
                    type="password"
                    value={passwordForm.password_confirmation}
                    onChange={(e) => setPasswordForm({ ...passwordForm, password_confirmation: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="••••••••"
                    minLength={8}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors"
              >
                {saving ? 'Changement en cours...' : 'Changer le mot de passe'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TenantLayout>
  )
}
