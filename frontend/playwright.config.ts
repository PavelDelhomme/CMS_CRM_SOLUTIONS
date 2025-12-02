import { defineConfig, devices } from '@playwright/test';

/**
 * Configuration Playwright pour les tests E2E
 * 
 * URLs configurées :
 * - Frontend : http://localhost:9194
 * - Backend API : http://localhost:9193/api
 */
export default defineConfig({
  testDir: './tests/e2e',
  
  /* Maximum time one test can run for. */
  timeout: 60 * 1000, // 60 secondes pour permettre aux tests lents (Mobile Safari) de se terminer
  
  expect: {
    /**
     * Maximum time expect() should wait for the condition to be met.
     */
    timeout: 5000
  },
  
  /* Run tests in files in parallel */
  fullyParallel: true,
  
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Maximum time each action such as `click()` can take. Defaults to 0 (no limit). */
    actionTimeout: 0,
    
    /* Base URL to use in actions like `await page.goto('/')`. */
    /* In Docker, use service names; locally, use localhost */
    baseURL: process.env.BASE_URL || (process.env.CI ? 'http://frontend:3000' : 'http://localhost:9194'),
    
    /* API URL for direct API calls in tests - stored in extraHTTPHeaders for access in tests */
    extraHTTPHeaders: {
      'X-API-BASE-URL': process.env.API_URL || (process.env.CI ? 'http://backend:8000/api' : 'http://localhost:9193/api'),
    },
    
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    
    /* Screenshot on failure */
    screenshot: 'only-on-failure',
    
    /* Video on failure */
    video: 'retain-on-failure',
  },

    /* Configure projects for major browsers */
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] },
      },

      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },

      // WebKit/Safari désactivé (pas disponible sur le système)
      // Pour l'activer, installer les dépendances avec: sudo npx playwright install-deps
      // {
      //   name: 'webkit',
      //   use: { ...devices['Desktop Safari'] },
      // },

      /* Test against mobile viewports. */
      {
        name: 'Mobile Chrome',
        use: { ...devices['Pixel 5'] },
      },
      // Mobile Safari désactivé (pas disponible sur le système)
      // {
      //   name: 'Mobile Safari',
      //   use: { ...devices['iPhone 12'] },
      // },
    ],

  /* Run your local dev server before starting the tests */
  /* Disabled in Docker - services are managed by docker-compose */
  webServer: (process.env.CI || process.env.BASE_URL) ? undefined : {
    command: 'echo "Frontend should be running. Use: make start"',
    url: 'http://localhost:9194',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});

