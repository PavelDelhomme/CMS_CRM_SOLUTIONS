import { test, expect } from '@playwright/test';

test.describe('Billing Page', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to login page
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    
    // Wait for login form
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Login (adjust credentials as needed)
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
    
    await emailInput.fill('admin@cms-crm-solutions.com');
    await passwordInput.fill('admin123');
    await submitButton.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('should display billing page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Check for runtime errors
    const errorLabel = page.locator('#nextjs__container_errors_label');
    if (await errorLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await errorLabel.textContent();
      throw new Error(`Runtime error detected: ${errorText}`);
    }
    
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /Facturation|Billing/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display billing statistics', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Wait for stats cards
    await page.waitForSelector('text=Total Facturé, text=Total Payé, text=Impayé, text=Factures', { timeout: 10000 });
    
    // Check that at least one stat card is visible
    const statsCards = page.locator('[class*="rounded-xl"]').filter({ hasText: /Total|Payé|Impayé|Factures/i });
    await expect(statsCards.first()).toBeVisible({ timeout: 5000 });
  });

  test('should display subscription section', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Check for subscription section
    const subscriptionSection = page.locator('text=Abonnement actuel, text=Abonnement');
    await expect(subscriptionSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should display invoices section', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Check for invoices section
    const invoicesSection = page.locator('text=Historique des factures, text=Factures');
    await expect(invoicesSection.first()).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty subscription state', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Check for empty state message (if no subscription)
    const emptyState = page.locator('text=Aucun abonnement actif, text=Choisir un plan');
    const hasEmptyState = await emptyState.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasEmptyState) {
      // Check that "Choisir un plan" button is visible
      const choosePlanButton = page.locator('button:has-text("Choisir un plan")');
      await expect(choosePlanButton).toBeVisible({ timeout: 5000 });
    }
  });

  test('should handle empty invoices state', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/billing`, { waitUntil: 'domcontentloaded' });
    
    // Check for empty invoices message (if no invoices)
    const emptyInvoices = page.locator('text=Aucune facture pour le moment, text=Aucune facture');
    const hasEmptyInvoices = await emptyInvoices.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // If there are invoices, check that the table is visible
    if (!hasEmptyInvoices) {
      const invoicesTable = page.locator('table, [role="table"]');
      await expect(invoicesTable.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should navigate to billing page from dashboard', async ({ page, baseURL }) => {
    // Start from dashboard
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    
    // Click on billing link in navigation or dashboard
    const billingLink = page.locator('a[href*="billing"], button:has-text("Facturation")').first();
    if (await billingLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await billingLink.click();
      await page.waitForURL('**/billing**', { timeout: 10000 });
      await expect(page.locator('h1, h2').filter({ hasText: /Facturation|Billing/i })).toBeVisible({ timeout: 5000 });
    }
  });
});

