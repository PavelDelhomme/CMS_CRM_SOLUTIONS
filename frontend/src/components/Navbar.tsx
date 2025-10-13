'use client'

import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'

interface NavbarProps {
  title: string
  subtitle?: string
}

export default function Navbar({ title, subtitle }: NavbarProps) {
  const router = useRouter()
  const user = authService.getStoredUser()

  return (
    <header className="bg-white shadow">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-700">{user?.name}</span>
          <button
            onClick={() => {
              authService.logout()
              router.push('/login')
            }}
            className="btn btn-secondary text-sm"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  )
}

