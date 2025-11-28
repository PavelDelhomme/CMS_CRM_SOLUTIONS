'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import authService from '@/services/auth.service'
import api from '@/lib/api'

export interface Feature {
  id: string
  name: string
  description?: string
  requires_premium: boolean
  required_plan?: string[]
}

export interface TenantFeatures {
  can_use_premium_blocks: boolean
  can_use_custom_domain: boolean
  can_use_advanced_seo: boolean
  can_use_analytics: boolean
  can_use_multiple_sites: boolean
  can_use_white_label: boolean
  can_use_advanced_styling: boolean // Z-index, position, transform, etc.
  can_use_custom_code: boolean // CSS/JS personnalisé
  can_use_ai_content: boolean // Génération de contenu IA
  can_use_advanced_forms: boolean // Formulaires avancés avec logique conditionnelle
  can_use_ecommerce: boolean // Intégration e-commerce
  can_use_membership: boolean // Système de membres
  can_use_booking_system: boolean // Système de réservation avancé
  can_use_email_marketing: boolean // Marketing email intégré
  can_use_social_integration: boolean // Intégrations réseaux sociaux
  can_use_api_access: boolean // Accès API
  max_pages: number
  max_storage_gb: number
  max_users: number
  available_block_types: string[]
}

interface FeaturesContextType {
  features: TenantFeatures | null
  loading: boolean
  hasFeature: (featureId: keyof TenantFeatures) => boolean
  canUseBlockType: (blockType: string, requiresPremium: boolean) => boolean
  refreshFeatures: () => Promise<void>
}

const FeaturesContext = createContext<FeaturesContextType | undefined>(undefined)

export function FeaturesProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<TenantFeatures | null>(null)
  const [loading, setLoading] = useState(true)

  const loadFeatures = async () => {
    try {
      // Pour les super admins, toutes les features sont disponibles
      const isSuperAdmin = authService.isSuperAdmin()
      if (isSuperAdmin) {
        setFeatures({
          can_use_premium_blocks: true,
          can_use_custom_domain: true,
          can_use_advanced_seo: true,
          can_use_analytics: true,
          can_use_multiple_sites: true,
          can_use_white_label: true,
          can_use_advanced_styling: true,
          can_use_custom_code: true,
          can_use_ai_content: true,
          can_use_advanced_forms: true,
          can_use_ecommerce: true,
          can_use_membership: true,
          can_use_booking_system: true,
          can_use_email_marketing: true,
          can_use_social_integration: true,
          can_use_api_access: true,
          max_pages: -1, // Illimité
          max_storage_gb: -1, // Illimité
          max_users: -1, // Illimité
          available_block_types: ['*'], // Tous les blocs
        })
        setLoading(false)
        return
      }

      // Pour les tenants, charger depuis l'API
      try {
        const response = await api.get('/tenant/features/')
        setFeatures(response.data)
      } catch (error: any) {
        // Si l'endpoint n'existe pas encore, utiliser des valeurs par défaut
        console.warn('Features endpoint not available, using defaults')
        setFeatures({
          can_use_premium_blocks: false,
          can_use_custom_domain: false,
          can_use_advanced_seo: false,
          can_use_analytics: false,
          can_use_multiple_sites: false,
          can_use_white_label: false,
          can_use_advanced_styling: false,
          can_use_custom_code: false,
          can_use_ai_content: false,
          can_use_advanced_forms: false,
          can_use_ecommerce: false,
          can_use_membership: false,
          can_use_booking_system: false,
          can_use_email_marketing: false,
          can_use_social_integration: false,
          can_use_api_access: false,
          max_pages: 10,
          max_storage_gb: 1,
          max_users: 1,
          available_block_types: ['heading', 'text', 'image', 'button', 'video', 'spacer', 'divider'],
        })
      }
    } catch (error) {
      console.error('Error loading features:', error)
      // Valeurs par défaut en cas d'erreur
      setFeatures({
        can_use_premium_blocks: false,
        can_use_custom_domain: false,
        can_use_advanced_seo: false,
        can_use_analytics: false,
        can_use_multiple_sites: false,
        can_use_white_label: false,
        max_pages: 10,
        max_storage_gb: 1,
        max_users: 1,
        available_block_types: ['heading', 'text', 'image', 'button', 'video', 'spacer', 'divider'],
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeatures()
  }, [])

  const hasFeature = (featureId: keyof TenantFeatures): boolean => {
    if (!features) return false
    return features[featureId] === true || (typeof features[featureId] === 'number' && features[featureId] > 0)
  }

  const canUseBlockType = (blockType: string, requiresPremium: boolean): boolean => {
    if (!features) return true // Par défaut, autoriser si features non chargées
    
    // Si le bloc nécessite premium et que l'utilisateur n'a pas accès
    if (requiresPremium && !features.can_use_premium_blocks) {
      return false
    }

    // Vérifier si le type de bloc est dans la liste disponible
    if (features.available_block_types.includes('*')) {
      return true // Tous les blocs sont disponibles
    }

    return features.available_block_types.includes(blockType)
  }

  const refreshFeatures = async () => {
    setLoading(true)
    await loadFeatures()
  }

  return (
    <FeaturesContext.Provider value={{ features, loading, hasFeature, canUseBlockType, refreshFeatures }}>
      {children}
    </FeaturesContext.Provider>
  )
}

export function useFeatures() {
  const context = useContext(FeaturesContext)
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeaturesProvider')
  }
  return context
}

