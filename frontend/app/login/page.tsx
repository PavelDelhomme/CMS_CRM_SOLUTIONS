'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('http://localhost:9193/api/auth/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erreur de connexion')
      }

      // Stocker les tokens et l'utilisateur
      if (data.tokens) {
        localStorage.setItem('token', data.tokens.access)
        localStorage.setItem('refresh_token', data.tokens.refresh)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      // Rediriger selon le rôle
      const user = data.user
      if (user?.roles?.some((role: any) => role === 'super-admin' || role?.name === 'super-admin')) {
        router.push('/admin/dashboard')
      } else {
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '28rem', width: '100%', background: 'white', padding: '2.5rem', borderRadius: '0.75rem', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            CMS_CRM_SOLUTIONS
          </h2>
          <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            Connectez-vous à votre plateforme
          </p>
        </div>

        {error && (
          <div style={{ background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', padding: '0.75rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', background: 'white', color: '#111827' }}
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', color: '#374151', marginBottom: '0.5rem' }}>
              Mot de passe
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', border: '1px solid #d1d5db', borderRadius: '0.5rem', fontSize: '1rem', background: 'white', color: '#111827' }}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <Link href="/register" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Créer un compte
            </Link>
            <Link href="/forgot-password" style={{ color: '#2563eb', textDecoration: 'none' }}>
              Mot de passe oublié ?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: loading ? '#9ca3af' : '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '500',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid #e5e7eb' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginBottom: '0.5rem' }}>
            Comptes de test :
          </p>
          <div style={{ background: '#f9fafb', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
            <p style={{ marginBottom: '0.25rem' }}>
              <strong>Super Admin:</strong> <code style={{ color: '#2563eb' }}>admin@cms-crm-solutions.com</code> / <code style={{ color: '#2563eb' }}>admin123</code>
            </p>
            <p>
              <strong>Tenant Test:</strong> <code style={{ color: '#2563eb' }}>test@example.com</code> / <code style={{ color: '#2563eb' }}>admin123</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

