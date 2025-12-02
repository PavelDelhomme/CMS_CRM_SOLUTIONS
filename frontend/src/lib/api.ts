import axios from 'axios';

// Déclaration pour les flags globaux
declare global {
  interface Window {
    __hasLoggedBlockedError?: boolean;
    __hasLoggedNetworkError?: boolean;
  }
}

/**
 * Détermine dynamiquement l'URL de base de l'API (sans /api) selon l'environnement
 * - En production : utilise l'URL configurée (sans /api)
 * - En développement : détecte automatiquement selon le hostname
 *   - Sur localhost : http://localhost:9193
 *   - Sur sous-domaine tenant : http://localhost:9193 (même backend)
 */
function getApiBaseUrl(): string {
  // Si l'URL est définie via env, l'utiliser mais retirer /api si présent
  if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) {
    let url = process.env.NEXT_PUBLIC_API_URL;
    // Retirer /api à la fin si présent
    if (url.endsWith('/api')) {
      url = url.slice(0, -4);
    } else if (url.endsWith('/api/')) {
      url = url.slice(0, -5);
    }
    return url;
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

const API_BASE_URL = getApiBaseUrl();

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
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

// Flag pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Intercepteur pour gérer les erreurs et le refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = error.config?.url || '';
    const status = error.response?.status;
    
    // ERR_BLOCKED_BY_CLIENT est généralement causé par un bloqueur de publicité
    // Ne pas logger ces erreurs comme des erreurs critiques pour certains endpoints
    const silentEndpoints = ['/tenants/features/', '/auth/login/', '/auth/refresh/']
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
    
    // Gérer le refresh token automatique
    if (status === 401 && originalRequest && !originalRequest._retry) {
      if (isRefreshing) {
        // Si on est déjà en train de refresh, mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh/`, {
            refresh: refreshToken
          });
          
          const { access } = response.data;
          localStorage.setItem('token', access);
          
          // Mettre à jour le header de la requête originale
          originalRequest.headers.Authorization = `Bearer ${access}`;
          
          // Traiter la queue
          processQueue(null, access);
          isRefreshing = false;
          
          // Réessayer la requête originale
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh token invalide ou expiré
          processQueue(refreshError, null);
          isRefreshing = false;
          
          // Nettoyer et rediriger vers login
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          if (!isPublicRoute) {
            window.location.href = '/login';
          }
          
          return Promise.reject(refreshError);
        }
      } else {
        // Pas de refresh token
        isRefreshing = false;
        const hasToken = localStorage.getItem('token');
        if (hasToken && !isPublicRoute) {
          localStorage.removeItem('token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    } else if (status === 401 && !isPublicRoute) {
      // 401 sans refresh token possible
      const hasToken = localStorage.getItem('token');
      if (hasToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (!isSilentError && status) {
      // Ne logger que les erreurs non attendues
      // (Les erreurs attendues sont gérées gracieusement dans les composants)
    }
    
    return Promise.reject(error);
  }
);

export default api;

