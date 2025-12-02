'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import billingService, { PricingPlan } from '@/services/billing.service'
import PublicHeader from '@/components/PublicHeader'
import PublicFooter from '@/components/PublicFooter'
import { useTheme } from '@/contexts/ThemeContext'

interface PublicHomePageProps {
  initialPricingPlans?: PricingPlan[]
}

export default function PublicHomePage({ initialPricingPlans = [] }: PublicHomePageProps) {
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(initialPricingPlans)
  const [loading, setLoading] = useState(false)
  const [isMounted, setIsMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    // Charger les pricing plans si pas déjà chargés
    if (pricingPlans.length === 0) {
      loadPricingPlans()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPricingPlans = async () => {
    try {
      setLoading(true)
      const plans = await billingService.getPricingPlans()
      setPricingPlans(Array.isArray(plans) ? plans : [])
    } catch (error) {
      console.error('Erreur chargement plans:', error)
      setPricingPlans([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  // Utiliser un thème par défaut si pas encore monté
  const theme = isMounted ? resolvedTheme : 'light'

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      theme === 'dark' 
        ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' 
        : 'bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500'
    }`}>
      <PublicHeader showThemeToggle={true} />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-white">
          CMS_CRM_SOLUTIONS
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
          Plateforme générique CMS/CRM multi-tenant. Créez et gérez vos sites web, contenu, utilisateurs et facturation en toute simplicité.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-xl ${
              theme === 'dark'
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'bg-white text-blue-600 hover:bg-blue-50'
            }`}
          >
            🔐 Se connecter
          </Link>
          <Link
            href="/admin"
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800/80 backdrop-blur-md text-white hover:bg-gray-800 border border-gray-700'
                : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30'
            }`}
          >
            ⚙️ Administration
          </Link>
          <Link
            href="/register"
            className={`px-8 py-4 rounded-lg font-bold text-lg transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800/80 backdrop-blur-md text-white hover:bg-gray-800 border border-gray-700'
                : 'bg-white/20 backdrop-blur-md text-white hover:bg-white/30 border border-white/30'
            }`}
          >
            🚀 Créer un compte
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white dark:bg-gray-800 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'CMS Complet',
                description: 'Gestion de contenu moderne et intuitive. Créez et gérez vos pages sans coder.',
              },
              {
                icon: '👥',
                title: 'Multi-tenant',
                description: 'Architecture multi-tenant sécurisée. Chaque client a son propre espace isolé.',
              },
              {
                icon: '💳',
                title: 'Facturation Intégrée',
                description: 'Système de facturation complet avec plans tarifaires et abonnements.',
              },
              {
                icon: '📱',
                title: 'Responsive Design',
                description: 'Votre site s\'adapte automatiquement aux smartphones et tablettes.',
              },
              {
                icon: '📊',
                title: 'Analytics & Reporting',
                description: 'Suivez vos performances, utilisateurs et revenus en temps réel.',
              },
              {
                icon: '🔒',
                title: 'Sécurisé & Rapide',
                description: 'Hébergement sécurisé, sauvegardes automatiques, SSL inclus.',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 dark:bg-gray-900 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
            Tarifs Transparents
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            Choisissez le plan adapté à vos besoins. Pas d'engagement, changez de plan à tout moment.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des plans tarifaires...</p>
            </div>
          ) : pricingPlans.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
                Aucun plan tarifaire disponible pour le moment.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  Créer un compte gratuitement
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-3 rounded-lg font-medium bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Se connecter
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans
                .filter(plan => plan.is_active)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 relative ${
                    plan.is_featured ? 'ring-4 ring-blue-500 scale-105' : ''
                  }`}
                >
                  {plan.is_featured && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                        POPULAIRE
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900 dark:text-gray-100">
                      {formatPrice(plan.price_monthly)}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/mois</span>
                    {plan.price_yearly && (
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        ou {formatPrice(plan.price_yearly)}/an (-{Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{plan.max_sites} site{plan.max_sites > 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''} max</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700 dark:text-gray-300">{plan.max_storage_gb} GB de stockage</span>
                    </li>
                    {plan.features && plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${plan.slug}`}
                    className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                      plan.is_featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    Choisir {plan.name}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Prêt à démarrer ?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Créez votre plateforme CMS/CRM dès aujourd'hui. Essai gratuit disponible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className={`inline-block px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-xl ${
                theme === 'dark'
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              🔐 Se connecter
            </Link>
            <Link
              href="/register"
              className={`inline-block px-8 py-4 rounded-lg font-bold text-lg transition-colors shadow-xl ${
                theme === 'dark'
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : 'bg-white text-blue-600 hover:bg-blue-50'
              }`}
            >
              🚀 Créer un compte
            </Link>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}

