'use client'

import Link from 'next/link'

export default function PublicFooter() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">CMS_CRM_SOLUTIONS</h3>
            <p className="text-gray-400">
              Plateforme générique CMS/CRM multi-tenant pour créer et gérer vos sites web professionnels.
            </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Produit</h4>
            <ul className="space-y-2 text-gray-400">
              <li><Link href="/#pricing" className="hover:text-white">Tarifs</Link></li>
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
          <p>&copy; 2025 CMS_CRM_SOLUTIONS. Tous droits réservés.</p>
          <p className="mt-2 text-sm">Plateforme générique CMS/CRM multi-tenant - Développé avec ❤️</p>
        </div>
      </div>
    </footer>
  )
}

