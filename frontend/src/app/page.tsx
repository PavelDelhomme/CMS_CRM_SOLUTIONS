// Version ultra-simplifiée - Pas de 'use client' pour forcer le SSR
import Link from 'next/link'

export default function HomePage() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, #3b82f6, #9333ea, #ec4899)' }}>
      {/* Header Simple */}
      <header style={{ background: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)', padding: '1rem 0' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'white' }}>CMS_CRM_SOLUTIONS</h1>
          <nav style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <Link href="/login" style={{ color: 'white', textDecoration: 'none' }}>Connexion</Link>
            <Link href="/register" style={{ padding: '0.5rem 1rem', background: 'white', color: '#2563eb', borderRadius: '0.5rem', textDecoration: 'none' }}>Créer un compte</Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '5rem 1rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>
          CMS_CRM_SOLUTIONS
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem', maxWidth: '768px', margin: '0 auto 2rem' }}>
          Plateforme générique CMS/CRM multi-tenant. Créez et gérez vos sites web, contenu, utilisateurs et facturation en toute simplicité.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{ padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', background: 'white', color: '#2563eb', textDecoration: 'none', display: 'inline-block' }}
          >
            🔐 Se connecter
          </Link>
          <Link
            href="/register"
            style={{ padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', background: 'rgba(255, 255, 255, 0.2)', color: 'white', textDecoration: 'none', display: 'inline-block', border: '1px solid rgba(255, 255, 255, 0.3)' }}
          >
            🚀 Créer un compte
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ background: 'white', padding: '5rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '3rem' }}>
            Tout ce dont vous avez besoin
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { icon: '🎨', title: 'CMS Complet', description: 'Gestion de contenu moderne et intuitive. Créez et gérez vos pages sans coder.' },
              { icon: '👥', title: 'Multi-tenant', description: 'Architecture multi-tenant sécurisée. Chaque client a son propre espace isolé.' },
              { icon: '💳', title: 'Facturation Intégrée', description: 'Système de facturation complet avec plans tarifaires et abonnements.' },
              { icon: '📱', title: 'Responsive Design', description: 'Votre site s\'adapte automatiquement aux smartphones et tablettes.' },
              { icon: '📊', title: 'Analytics & Reporting', description: 'Suivez vos performances, utilisateurs et revenus en temps réel.' },
              { icon: '🔒', title: 'Sécurisé & Rapide', description: 'Hébergement sécurisé, sauvegardes automatiques, SSL inclus.' },
            ].map((feature, index) => (
              <div key={index} style={{ textAlign: 'center', padding: '1.5rem', borderRadius: '0.5rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{feature.icon}</div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#111827', marginBottom: '0.5rem' }}>{feature.title}</h3>
                <p style={{ color: '#4b5563' }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ background: '#f9fafb', padding: '5rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', textAlign: 'center', color: '#111827', marginBottom: '1rem' }}>
            Tarifs Transparents
          </h2>
          <p style={{ textAlign: 'center', color: '#4b5563', marginBottom: '3rem', maxWidth: '672px', margin: '0 auto 3rem' }}>
            Choisissez le plan adapté à vos besoins. Pas d'engagement, changez de plan à tout moment.
          </p>
          <div style={{ textAlign: 'center', padding: '3rem 0' }}>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', fontSize: '1.125rem' }}>
              Les plans tarifaires seront disponibles prochainement.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
              <Link
                href="/register"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', background: '#2563eb', color: 'white', textDecoration: 'none', display: 'inline-block' }}
              >
                Créer un compte gratuitement
              </Link>
              <Link
                href="/login"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.5rem', fontWeight: '500', background: '#e5e7eb', color: '#111827', textDecoration: 'none', display: 'inline-block' }}
              >
                Se connecter
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{ background: 'linear-gradient(to right, #2563eb, #9333ea)', padding: '5rem 1rem' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '2.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1rem' }}>
            Prêt à démarrer ?
          </h2>
          <p style={{ fontSize: '1.25rem', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '2rem' }}>
            Créez votre plateforme CMS/CRM dès aujourd'hui. Essai gratuit disponible.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', alignItems: 'center' }}>
            <Link
              href="/login"
              style={{ padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', background: 'white', color: '#2563eb', textDecoration: 'none', display: 'inline-block' }}
            >
              🔐 Se connecter
            </Link>
            <Link
              href="/register"
              style={{ padding: '1rem 2rem', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1.125rem', background: 'white', color: '#2563eb', textDecoration: 'none', display: 'inline-block' }}
            >
              🚀 Créer un compte
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#111827', color: 'white', padding: '3rem 1rem' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
          <p>&copy; {new Date().getFullYear()} CMS_CRM_SOLUTIONS. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
