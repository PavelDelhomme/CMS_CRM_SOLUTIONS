import axios from 'axios';

// Déclaration pour les flags globaux
declare global {
  interface Window {
    __hasLoggedBlockedError?: boolean;
    __hasLoggedNetworkError?: boolean;
  }
}

/**
 * Détermine dynamiquement l'URL de l'API selon l'environnement
 * - En production : utilise l'URL configurée
 * - En développement : détecte automatiquement selon le hostname
 *   - Sur localhost : http://localhost:9495
 *   - Sur sous-domaine tenant : http://localhost:9495 (même backend)
 */
function getApiUrl(): string {
  // Si l'URL est définie via env, l'utiliser
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  
  // En développement, toujours utiliser localhost:9193
  // car le backend Django écoute sur ce port quel que soit le sous-domaine
  if (typeof window !== 'undefined') {
    // Détecte si on est sur un sous-domaine tenant ou localhost
    const hostname = window.location.hostname;
    
    // Le backend Django est toujours accessible sur localhost:9193
    // même si le frontend est sur un sous-domaine tenant
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // Utilise le port 9193 pour le backend
      return `http://localhost:9193`;
    }
  }
  
  // Fallback par défaut
  return 'http://localhost:9193';
}

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000, // 30 secondes timeout
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Liste des endpoints où les erreurs 404/500 sont attendues (ne pas les logger)
const SILENT_ERROR_ENDPOINTS = [
  '/payment-methods/',
  '/system-settings/',
  '/billing/unpaid-items/',
  '/templates/',
  '/pricing-plans/', // Peut être en erreur temporaire
];

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const status = error.response?.status;
    
    // ERR_BLOCKED_BY_CLIENT est généralement causé par un bloqueur de publicité
    // Ne pas logger ces erreurs comme des erreurs critiques pour certains endpoints
    const silentEndpoints = ['/tenants/features/', '/auth/login/']
    const isSilentEndpoint = silentEndpoints.some(endpoint => url.includes(endpoint))
    
    // Gérer les erreurs bloquées par le client (bloqueur de pub)
    if (error.code === 'ERR_BLOCKED_BY_CLIENT' || error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      // Pour les endpoints silencieux, ne rien logger (géré dans FeaturesContext)
      // Pour les autres, logger une seule fois
      if (!isSilentEndpoint) {
        // Utiliser un flag pour éviter les logs répétés
        if (!window.__hasLoggedBlockedError) {
          console.warn(`⚠️ Requête bloquée (probablement par un bloqueur de publicité): ${url}`);
          console.warn('💡 Solution: Désactivez temporairement votre bloqueur de publicité pour localhost:9495');
          window.__hasLoggedBlockedError = true;
        }
      }
    } else if (error.code === 'ERR_NETWORK') {
      // Erreurs réseau normales
      if (!isSilentEndpoint && !window.__hasLoggedNetworkError) {
        console.warn(`⚠️ Erreur réseau: ${url}`);
        window.__hasLoggedNetworkError = true;
      }
    }
    
    // Ne pas logger les erreurs attendues pour certains endpoints
    const isSilentError = SILENT_ERROR_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    // Liste des routes publiques où on ne doit PAS rediriger vers /login
    const publicRoutes = ['/', '/templates', '/pricing', '/about', '/contact'];
    const isPublicRoute = typeof window !== 'undefined' && publicRoutes.some(route => 
      window.location.pathname === route || window.location.pathname.startsWith(route + '/')
    );
    
    if (status === 401) {
      // Ne rediriger vers /login que si on n'est pas sur une page publique
      // et qu'il y a un token (ce qui signifie qu'il a expiré)
      const hasToken = localStorage.getItem('token');
      if (hasToken && !isPublicRoute) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
      // Si pas de token et page publique, c'est normal, ne pas rediriger
    } else if (!isSilentError && status) {
      // Ne logger que les erreurs non attendues
      // (Les erreurs attendues sont gérées gracieusement dans les composants)
    }
    
    return Promise.reject(error);
  }
);

export default api;

