import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CMS_CRM_SOLUTIONS - Plateforme générique CMS/CRM multi-tenant',
  description: 'Plateforme générique CMS/CRM multi-tenant pour créer et gérer vos sites web',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
