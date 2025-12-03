/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['localhost'],
  },
  env: {
    // URL de base sans /api (sera ajouté dans api.ts)
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:9193',
  },
  // Configuration pour le développement
  experimental: {
    // Désactiver le cache pour éviter les problèmes de fichiers statiques
    isrMemoryCacheSize: 0,
  },
  // Configuration pour les fichiers statiques
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  // Désactiver la compression pour le développement
  compress: false,
}

module.exports = nextConfig

