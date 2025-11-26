'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import authService from '@/services/auth.service'
import toast from 'react-hot-toast'

const loginSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Mot de passe requis'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    try {
      const response = await authService.login(data)
      
      // Vérifier si l'utilisateur est authentifié
      if (authService.isAuthenticated()) {
        const user = authService.getStoredUser()
        if (user?.roles?.some((role: any) => role === 'super-admin' || role.name === 'super-admin')) {
          router.push('/admin/dashboard')
        } else {
          router.push('/dashboard')
        }
        toast.success('Connexion réussie !')
      } else {
        toast.error('Erreur de connexion')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      // Gérer les erreurs de réseau spécifiquement
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
        toast.error(
          'Erreur de connexion au serveur. Vérifiez que :\n' +
          '1. Les extensions de navigateur (bloqueurs de pub) ne bloquent pas les requêtes\n' +
          '2. Le backend est bien démarré\n' +
          '3. L\'URL de l\'API est correcte',
          { duration: 6000 }
        )
        console.error('Network error - possibly blocked by browser extension:', error)
      } else if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Email ou mot de passe incorrect'
        toast.error(errorMessage)
      } else {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Erreur de connexion'
        toast.error(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-2xl">
        <div>
          <h2 className="mt-6 text-center text-4xl font-extrabold text-gray-900">
            VTCBuilder
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Le WordPress des Chauffeurs VTC
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="input mt-1"
                placeholder="votre@email.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="input mt-1"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm">
              <a href="/register" className="font-medium text-primary-600 hover:text-primary-500">
                Créer un compte
              </a>
            </div>
            <div className="text-sm">
              <a href="/forgot-password" className="font-medium text-primary-600 hover:text-primary-500">
                Mot de passe oublié ?
              </a>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-lg"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Comptes de test
              </span>
            </div>
          </div>
          
          <div className="mt-4 text-xs text-gray-600 space-y-2">
            <p className="font-semibold text-gray-700 mb-1">Comptes de test :</p>
            <div className="bg-gray-50 rounded p-3 space-y-1">
              <p><strong>Super Admin:</strong> <code className="text-blue-600">admin@vtcbuilder.com</code> / <code className="text-blue-600">admin123</code></p>
              <p><strong>Tenant Test:</strong> <code className="text-blue-600">admin@masociete-vtc.com</code> / <code className="text-blue-600">admin123</code></p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Le tenant de test est <strong>ma-societe-vtc</strong> (Ma Société VTC)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

