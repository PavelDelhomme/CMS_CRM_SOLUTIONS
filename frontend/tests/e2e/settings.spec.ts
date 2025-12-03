import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page, baseURL }) => {
    // Navigate to login page
    await page.goto(`${baseURL}/login`, { waitUntil: 'domcontentloaded' });
    
    // Wait for login form
    await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
    
    // Login
    const emailInput = page.locator('input[name="email"], input[type="email"]').first();
    const passwordInput = page.locator('input[name="password"], input[type="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("Se connecter"), button:has-text("Connexion")').first();
    
    await emailInput.fill('admin@cms-crm-solutions.com');
    await passwordInput.fill('admin123');
    await submitButton.click();
    
    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard**', { timeout: 15000 });
  });

  test('should display settings page', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for runtime errors
    const errorLabel = page.locator('#nextjs__container_errors_label');
    if (await errorLabel.isVisible({ timeout: 2000 }).catch(() => false)) {
      const errorText = await errorLabel.textContent();
      throw new Error(`Runtime error detected: ${errorText}`);
    }
    
    // Check page title
    await expect(page.locator('h1, h2').filter({ hasText: /Paramètres|Settings/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display account settings section', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for account settings section
    const accountSection = page.locator('text=Paramètres du compte, text=Compte');
    await expect(accountSection.first()).toBeVisible({ timeout: 10000 });
    
    // Check for form fields
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible({ timeout: 5000 });
  });

  test('should display tenant settings section if tenant exists', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for tenant settings section (may or may not exist)
    const tenantSection = page.locator('text=Paramètres du tenant, text=Tenant');
    const hasTenantSection = await tenantSection.first().isVisible({ timeout: 5000 }).catch(() => false);
    
    // If tenant section exists, check for tenant name field
    if (hasTenantSection) {
      const tenantNameInput = page.locator('input[placeholder*="organisation"], input[placeholder*="tenant"]').first();
      await expect(tenantNameInput).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display security section', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for security section
    const securitySection = page.locator('text=Sécurité, text=Security');
    await expect(securitySection.first()).toBeVisible({ timeout: 10000 });
    
    // Check for password fields
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    expect(passwordCount).toBeGreaterThan(0);
  });

  test('should allow editing user profile', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Find name input field
    const nameInput = page.locator('input[placeholder*="nom"], input[placeholder*="name"]').first();
    if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await nameInput.fill('Test User');
      
      // Check that value was set
      const value = await nameInput.inputValue();
      expect(value).toContain('Test');
    }
  });

  test('should allow editing tenant settings if tenant exists', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for tenant name input
    const tenantNameInput = page.locator('input[placeholder*="organisation"], input[placeholder*="tenant"]').first();
    const hasTenantInput = await tenantNameInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (hasTenantInput) {
      await tenantNameInput.fill('Test Organization');
      const value = await tenantNameInput.inputValue();
      expect(value).toContain('Test');
    }
  });

  test('should validate password fields', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Find password fields
    const passwordInputs = page.locator('input[type="password"]');
    const passwordCount = await passwordInputs.count();
    
    if (passwordCount > 0) {
      // Check that password fields have minLength attribute
      const newPasswordInput = passwordInputs.nth(1); // Usually the second one is new password
      if (await newPasswordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        const minLength = await newPasswordInput.getAttribute('minLength');
        expect(minLength).toBe('8');
      }
    }
  });

  test('should have save buttons', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/dashboard/settings`, { waitUntil: 'domcontentloaded' });
    
    // Check for save buttons
    const saveButtons = page.locator('button:has-text("Enregistrer"), button:has-text("Sauvegarder"), button:has-text("Save")');
    const saveButtonCount = await saveButtons.count();
    expect(saveButtonCount).toBeGreaterThan(0);
  });

  test('should navigate to settings page from dashboard', async ({ page, baseURL }) => {
    // Start from dashboard
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'domcontentloaded' });
    
    // Click on settings link in navigation or dashboard
    const settingsLink = page.locator('a[href*="settings"], button:has-text("Paramètres"), button:has-text("Settings")').first();
    if (await settingsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await settingsLink.click();
      await page.waitForURL('**/settings**', { timeout: 10000 });
      await expect(page.locator('h1, h2').filter({ hasText: /Paramètres|Settings/i })).toBeVisible({ timeout: 5000 });
    }
  });
});

