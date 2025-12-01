import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { FeaturesProvider } from '@/contexts/FeaturesContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CMS_CRM_SOLUTIONS - Plateforme générique CMS/CRM multi-tenant',
  description: 'Plateforme générique CMS/CRM multi-tenant pour créer et gérer vos sites web',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <FeaturesProvider>
            {children}
          </FeaturesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}

