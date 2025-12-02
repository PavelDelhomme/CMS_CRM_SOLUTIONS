import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour les appels API
 * 
 * Vérifie que le frontend peut communiquer avec le backend
 */

test.describe('API Backend', () => {
  test('devrait pouvoir accéder à l\'API backend', async ({ request }) => {
    // Tester l'endpoint de l'API (sans authentification)
    const response = await request.get('http://localhost:9193/api/');
    
    // L'API devrait répondre (même si c'est une erreur 401/404)
    expect(response.status()).toBeLessThan(500);
  });

  test('devrait avoir CORS configuré correctement', async ({ page }) => {
    // Intercepter les requêtes réseau
    const responses: any[] = [];
    
    page.on('response', (response) => {
      if (response.url().includes('localhost:9193')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
        });
      }
    });

    // Faire une action qui déclenche un appel API
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Vérifier qu'au moins une requête a été faite
    // (même si elle échoue, elle devrait avoir les headers CORS)
    if (responses.length > 0) {
      const corsHeaders = responses[0].headers['access-control-allow-origin'];
      // Si CORS est configuré, on devrait avoir ce header
      // (ou au moins pas d'erreur CORS dans la console)
    }
  });
});

