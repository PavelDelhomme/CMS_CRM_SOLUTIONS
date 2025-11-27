import axios from 'axios';

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
  
  // En développement, toujours utiliser localhost:9495
  // car le backend Django écoute sur ce port quel que soit le sous-domaine
  if (typeof window !== 'undefined') {
    // Détecte si on est sur un sous-domaine tenant ou localhost
    const hostname = window.location.hostname;
    const port = window.location.port;
    
    // Le backend Django est toujours accessible sur localhost:9495
    // même si le frontend est sur un sous-domaine tenant
    if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
      // Utilise le même port pour le backend (9495)
      return `http://localhost:9495`;
    }
  }
  
  // Fallback par défaut
  return 'http://localhost:9495';
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
    if (error.code === 'ERR_NETWORK' || error.message?.includes('ERR_BLOCKED_BY_CLIENT')) {
      console.warn(`⚠️ Requête bloquée (probablement par un bloqueur de publicité): ${url}`);
      console.warn('💡 Solution: Désactivez temporairement votre bloqueur de publicité pour localhost:9495');
    }
    
    // Ne pas logger les erreurs attendues pour certains endpoints
    const isSilentError = SILENT_ERROR_ENDPOINTS.some(endpoint => url.includes(endpoint));
    
    if (status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    } else if (!isSilentError && status) {
      // Ne logger que les erreurs non attendues
      // (Les erreurs attendues sont gérées gracieusement dans les composants)
    }
    
    return Promise.reject(error);
  }
);

export default api;

