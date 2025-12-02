'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_tenants: 0,
    active_tenants: 0,
    total_users: 0,
  })

  useEffect(() => {
    // Vérifier l'authentification et le rôle
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (!token || !storedUser) {
      router.push('/login')
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)

      // Vérifier si super admin
      const isSuperAdmin = userData?.roles?.some((role: any) => role === 'super-admin' || role?.name === 'super-admin')
      if (!isSuperAdmin) {
        router.push('/dashboard')
        return
      }

      // Charger les statistiques
      loadStats()
    } catch (e) {
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  const loadStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:9193/api/stats/dashboard/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.stats) {
          setStats(data.stats)
        }
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    router.push('/login')
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid #e5e7eb', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827' }}>CMS_CRM_SOLUTIONS - Administration</h1>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <span style={{ color: '#6b7280' }}>{user?.email}</span>
            <button
              onClick={handleLogout}
              style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer' }}
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1rem' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>
            Tableau de bord Administrateur
          </h2>
          <p style={{ color: '#6b7280' }}>
            Vue d'ensemble de la plateforme
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Tenants</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{stats.total_tenants}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Tenants Actifs</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{stats.active_tenants}</p>
          </div>
          <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '0.5rem' }}>Total Utilisateurs</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#111827' }}>{stats.total_users}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '1rem' }}>
            Actions rapides
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <Link
              href="/admin/tenants"
              style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}
            >
              👥 Gérer les tenants
            </Link>
            <Link
              href="/admin/users"
              style={{ padding: '0.75rem 1.5rem', background: '#2563eb', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}
            >
              👤 Gérer les utilisateurs
            </Link>
            <Link
              href="/admin/settings"
              style={{ padding: '0.75rem 1.5rem', background: '#6b7280', color: 'white', borderRadius: '0.5rem', textDecoration: 'none' }}
            >
              ⚙️ Paramètres
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

