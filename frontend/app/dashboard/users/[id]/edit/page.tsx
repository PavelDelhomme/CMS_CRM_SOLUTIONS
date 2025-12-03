'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import TenantLayout from '@/components/TenantLayout'
import PageLoader from '@/components/PageLoader'
import userService from '@/services/user.service'
import type { User } from '@/services/user.service'
import toast from 'react-hot-toast'
import { Toaster } from 'react-hot-toast'

export default function EditUserPage() {
  const router = useRouter()
  const params = useParams()
  const userId = parseInt(params.id as string)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    first_name: '',
    last_name: '',
    password: '',
    password_confirm: '',
    is_staff: false,
    is_active: true,
  })

  useEffect(() => {
    if (userId) {
      loadUser()
    }
  }, [userId])

  const loadUser = async () => {
    try {
      const userData = await userService.getById(userId)
      setUser(userData)
      setFormData({
        email: userData.email || '',
        username: userData.username || '',
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        password: '',
        password_confirm: '',
        is_staff: userData.is_staff || false,
        is_active: userData.is_active !== false,
      })
    } catch (error: any) {
      console.error('Erreur chargement utilisateur:', error)
      toast.error('Erreur lors du chargement de l\'utilisateur')
      router.push('/dashboard/users')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password && formData.password !== formData.password_confirm) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }

    if (formData.password && formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setSaving(true)

    try {
      const userData: any = {
        email: formData.email,
        username: formData.username,
        first_name: formData.first_name,
        last_name: formData.last_name,
        is_staff: formData.is_staff,
        is_active: formData.is_active,
      }
      
      // Ne mettre à jour le mot de passe que s'il est fourni
      if (formData.password) {
        userData.password = formData.password
      }
      
      await userService.update(userId, userData)
      toast.success('Utilisateur modifié avec succès !')
      router.push('/dashboard/users')
    } catch (error: any) {
      console.error('Erreur modification utilisateur:', error)
      toast.error(error.response?.data?.error || 'Erreur lors de la modification de l\'utilisateur')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
    setFormData({
      ...formData,
      [e.target.name]: value,
    })
  }

  if (loading) {
    return (
      <TenantLayout title="Modifier l'Utilisateur" subtitle="Chargement...">
        <PageLoader text="Chargement de l'utilisateur..." />
      </TenantLayout>
    )
  }

  if (!user) {
    return null
  }

  return (
    <TenantLayout 
      title="Modifier l'Utilisateur" 
      subtitle={`Modifiez les informations de ${user.name || user.email}`}
    >
      <Toaster position="top-right" />

      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informations de l'Utilisateur</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Modifiez les informations de l'utilisateur</p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="p-6 space-y-6">
              {/* Informations de Base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Informations de Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      placeholder="utilisateur@example.com"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom d'utilisateur
                    </label>
                    <input
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="nom_utilisateur"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Prénom
                    </label>
                    <input
                      id="first_name"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom
                    </label>
                    <input
                      id="last_name"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      placeholder="Dupont"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Mot de Passe (optionnel) */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Mot de Passe</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Laissez vide pour ne pas modifier le mot de passe</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nouveau mot de passe
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Minimum 8 caractères"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="password_confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Confirmer le mot de passe
                    </label>
                    <input
                      id="password_confirm"
                      name="password_confirm"
                      type="password"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      minLength={8}
                      placeholder="Répétez le mot de passe"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Permissions */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Permissions</h3>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      id="is_staff"
                      name="is_staff"
                      type="checkbox"
                      checked={formData.is_staff}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_staff" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Administrateur (accès au panneau d'administration)
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="is_active"
                      name="is_active"
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={handleChange}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                      Compte actif (l'utilisateur peut se connecter)
                    </label>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
              >
                {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TenantLayout>
  )
}
