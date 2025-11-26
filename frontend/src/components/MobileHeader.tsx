'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import authService from '@/services/auth.service'
import AdminSidebar from './AdminSidebar'

interface MobileHeaderProps {
  title: string
  subtitle?: string
  onMenuClick?: () => void
}

export default function MobileHeader({ title, subtitle, onMenuClick }: MobileHeaderProps) {
  return (
    <header className="lg:hidden bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="flex items-center justify-between px-4 py-3">
        <button
          onClick={onMenuClick}
          className="text-gray-600 hover:text-gray-900 p-1 rounded-lg hover:bg-gray-100"
          aria-label="Ouvrir le menu"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" suppressHydrationWarning>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
        
        <div className="w-6" /> {/* Spacer for balance */}
      </div>
    </header>
  )
}

