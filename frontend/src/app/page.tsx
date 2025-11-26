'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import authService from '@/services/auth.service'
import billingService, { PricingPlan } from '@/services/billing.service'

export default function HomePage() {
  const router = useRouter()
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Si utilisateur connecté, rediriger vers le dashboard approprié
    if (authService.isAuthenticated()) {
      if (authService.isSuperAdmin()) {
        router.push('/admin/dashboard')
        return
      } else if (authService.isTenantAdmin()) {
        router.push('/dashboard')
        return
      }
    }
    
    // Charger les plans tarifaires
    loadPricingPlans()
  }, [router])

  const loadPricingPlans = async () => {
    try {
      const plans = await billingService.getPricingPlans()
      setPricingPlans(Array.isArray(plans) ? plans : [])
    } catch (error) {
      console.error('Erreur chargement plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  // Afficher la page vitrine seulement si non connecté
  if (authService.isAuthenticated()) {
    return null // Sera redirigé
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold text-white">VTCBuilder</h1>
              <span className="text-xs text-white/80">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/login"
                className="text-white hover:text-blue-100 font-medium"
              >
                Connexion
              </Link>
              <Link
                href="/register"
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Créer un compte
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
          Le WordPress des Chauffeurs VTC
        </h1>
        <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
          Créez votre site VTC professionnel en quelques minutes. Gestion complète, réservations, paiements, tout inclus.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            🚀 Démarrer gratuitement
          </Link>
          <Link
            href="#pricing"
            className="bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/30 transition-colors border border-white/30"
          >
            Voir les tarifs
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
            Tout ce dont vous avez besoin
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: '🎨',
                title: 'Site Professionnel',
                description: 'Designs modernes et responsive. Personnalisez votre site sans coder.',
              },
              {
                icon: '📅',
                title: 'Réservations en Ligne',
                description: 'Système de réservation complet avec calendrier et notifications.',
              },
              {
                icon: '💳',
                title: 'Paiements Intégrés',
                description: 'Acceptez les paiements en ligne. Cartes bancaires, virement, tout est possible.',
              },
              {
                icon: '📱',
                title: 'Mobile First',
                description: 'Votre site s\'adapte automatiquement aux smartphones et tablettes.',
              },
              {
                icon: '📊',
                title: 'Analytics Inclus',
                description: 'Suivez vos performances, réservations, revenus en temps réel.',
              },
              {
                icon: '🔒',
                title: 'Sécurisé & Rapide',
                description: 'Hébergement sécurisé, sauvegardes automatiques, SSL inclus.',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-4">
            Tarifs Transparents
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Choisissez le plan adapté à vos besoins. Pas d'engagement, changez de plan à tout moment.
          </p>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {pricingPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`bg-white rounded-xl shadow-lg p-8 relative ${
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
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-gray-600 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-gray-900">
                      {formatPrice(plan.price_monthly)}
                    </span>
                    <span className="text-gray-600">/mois</span>
                    {plan.price_yearly && (
                      <div className="text-sm text-gray-500 mt-1">
                        ou {formatPrice(plan.price_yearly)}/an (-{Math.round((1 - (plan.price_yearly / (plan.price_monthly * 12))) * 100)}%)
                      </div>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{plan.max_sites} site{plan.max_sites > 1 ? 's' : ''}</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{plan.max_users} utilisateur{plan.max_users > 1 ? 's' : ''} max</span>
                    </li>
                    <li className="flex items-center">
                      <span className="text-green-500 mr-2">✓</span>
                      <span className="text-gray-700">{plan.max_storage_gb} GB de stockage</span>
                    </li>
                    {plan.features && plan.features.map((feature: string, idx: number) => (
                      <li key={idx} className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={`/register?plan=${plan.slug}`}
                    className={`block w-full text-center py-3 rounded-lg font-bold transition-colors ${
                      plan.is_featured
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
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
            Créez votre site VTC professionnel dès aujourd'hui. Essai gratuit de 14 jours.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-xl"
          >
            🚀 Créer mon compte gratuitement
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">VTCBuilder</h3>
              <p className="text-gray-400">
                La plateforme SaaS complète pour créer et gérer votre site VTC professionnel.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Produit</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="#pricing" className="hover:text-white">Tarifs</Link></li>
                <li><Link href="/features" className="hover:text-white">Fonctionnalités</Link></li>
                <li><Link href="/templates" className="hover:text-white">Templates</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/docs" className="hover:text-white">Documentation</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Légal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/legal/terms" className="hover:text-white">CGV</Link></li>
                <li><Link href="/legal/privacy" className="hover:text-white">Confidentialité</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 VTCBuilder. Tous droits réservés.</p>
            <p className="mt-2 text-sm">vtcbuilder.com - Développé avec ❤️ en France</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
