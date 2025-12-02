import { test, expect } from '@playwright/test';

/**
 * Tests E2E d'exemple pour CMS_CRM_SOLUTIONS
 * 
 * Ces tests vérifient les fonctionnalités de base de la plateforme
 */

test.describe('Page d\'accueil', () => {
  test('devrait afficher le titre CMS_CRM_SOLUTIONS', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier que le titre est présent
    await expect(page.locator('h1')).toContainText('CMS_CRM_SOLUTIONS');
  });

  test('devrait avoir des liens de navigation', async ({ page }) => {
    await page.goto('/');
    
    // Vérifier les liens principaux
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await expect(page.locator('a[href="/register"]')).toBeVisible();
  });
});

test.describe('Page de connexion', () => {
  test('devrait afficher le formulaire de connexion', async ({ page }) => {
    await page.goto('/login');
    
    // Vérifier la présence des champs
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('devrait afficher une erreur avec des identifiants invalides', async ({ page }) => {
    await page.goto('/login');
    
    // Remplir le formulaire avec des données invalides
    await page.fill('input[type="email"], input[name="email"]', 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Attendre un message d'erreur (peut prendre du temps)
    await page.waitForTimeout(2000);
    
    // Vérifier qu'on n'est pas redirigé vers le dashboard
    expect(page.url()).toContain('/login');
  });
});

test.describe('Page d\'inscription', () => {
  test('devrait afficher le formulaire d\'inscription', async ({ page }) => {
    await page.goto('/register');
    
    // Vérifier la présence des champs
    await expect(page.locator('input[type="email"], input[name="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"], input[name="password"]')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('devrait naviguer entre les pages publiques', async ({ page }) => {
    await page.goto('/');
    
    // Cliquer sur le lien de connexion
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/.*\/login/);
    
    // Retour à l'accueil
    await page.goto('/');
    await expect(page).toHaveURL('/');
  });
});

