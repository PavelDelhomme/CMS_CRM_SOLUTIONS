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

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

