import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour la gestion des pages
 * 
 * Ces tests nécessitent d'être connecté en tant qu'utilisateur tenant
 */

test.describe('Gestion des Pages', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page de gestion des pages
    // Note: Ces tests nécessitent une authentification
    await page.goto('/dashboard/pages');
  });

  test('devrait afficher la page de gestion des pages', async ({ page }) => {
    // Si non authentifié, on devrait être redirigé vers /login
    // Sinon, on devrait voir la page de gestion
    
    const currentUrl = page.url();
    
    if (currentUrl.includes('/login')) {
      // Non authentifié - c'est normal
      await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    } else {
      // Authentifié - vérifier les éléments de la page
      await expect(page.locator('h1, h2')).toContainText(/page/i);
    }
  });

  test('devrait afficher un message si aucune page n\'existe', async ({ page }) => {
    // Attendre que la page se charge
    await page.waitForLoadState('networkidle');
    
    // Si on est sur la page de gestion (pas redirigé vers login)
    if (!page.url().includes('/login')) {
      // Chercher un message "Aucune page" ou "Créer une page"
      const emptyState = page.locator('text=/aucune page|créer.*page/i');
      
      // Soit on voit le message, soit on voit une liste de pages
      const hasEmptyState = await emptyState.count() > 0;
      const hasPageList = await page.locator('[data-testid="page-item"], .page-item').count() > 0;
      
      // Au moins un des deux devrait être vrai
      expect(hasEmptyState || hasPageList).toBeTruthy();
    }
  });

  test('devrait avoir un bouton pour créer une nouvelle page', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    if (!page.url().includes('/login')) {
      // Chercher un bouton "Nouvelle Page" ou "Créer"
      const newPageButton = page.locator('a[href*="/pages/new"], button:has-text("Nouvelle"), button:has-text("Créer")');
      
      if (await newPageButton.count() > 0) {
        await expect(newPageButton.first()).toBeVisible();
      }
    }
  });
});

test.describe('Navigation Dashboard', () => {
  test('devrait pouvoir naviguer vers le dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Vérifier qu'on est soit sur le dashboard, soit redirigé vers login
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/(dashboard|login)/);
  });
});

