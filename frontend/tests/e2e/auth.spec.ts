import { test, expect } from '@playwright/test';

/**
 * Tests E2E pour l'authentification
 * 
 * Ces tests nécessitent que le backend soit démarré sur http://localhost:9193
 */

test.describe('Authentification', () => {
  test.beforeEach(async ({ page }) => {
    // Aller sur la page de connexion avant chaque test
    await page.goto('/login');
  });

  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    // Vérifier les éléments du formulaire
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('devrait valider les champs requis', async ({ page }) => {
    // Essayer de soumettre sans remplir les champs
    await page.click('button[type="submit"]');
    
    // Attendre un peu pour voir si des erreurs apparaissent
    await page.waitForTimeout(1000);
    
    // Les navigateurs modernes affichent des messages de validation HTML5
    // On vérifie juste que le formulaire n'a pas été soumis
    expect(page.url()).toContain('/login');
  });

  test('devrait permettre de basculer la visibilité du mot de passe', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // Remplir le champ mot de passe
    await passwordInput.fill('testpassword');
    
    // Chercher un bouton toggle (peut être un bouton ou icône)
    const toggleButton = page.locator('button[aria-label*="password"], button[title*="password"], [data-testid*="toggle-password"]').first();
    
    // Si le bouton existe, cliquer dessus
    if (await toggleButton.count() > 0) {
      await toggleButton.click();
      // Le type devrait changer en "text"
      await expect(passwordInput).toHaveAttribute('type', 'text');
    }
  });
});

test.describe('Inscription', () => {
  test('devrait afficher le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/register');
    
    // Vérifier les champs du formulaire
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('devrait valider la confirmation du mot de passe', async ({ page }) => {
    await page.goto('/register');
    
    // Remplir les champs
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const confirmPasswordInput = page.locator('input[type="password"], input[name="confirmPassword"], input[name="password_confirm"]').last();
    
    if (await confirmPasswordInput.count() > 0) {
      await passwordInput.fill('password123');
      await confirmPasswordInput.fill('password456'); // Mot de passe différent
      
      // Soumettre le formulaire
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
      
      // Devrait rester sur la page d'inscription
      expect(page.url()).toContain('/register');
    }
  });
});

