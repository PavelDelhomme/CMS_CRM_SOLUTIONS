'use client'

// Layout dashboard temporairement simplifié pour éviter les boucles infinies
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TEMPORAIRE : Désactivation complète de la vérification auth pour tester
  // TODO: Réactiver avec une meilleure logique
  return <>{children}</>
}

