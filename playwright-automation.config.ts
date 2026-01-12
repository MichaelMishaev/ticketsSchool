import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Test Automation Suite
 * Dedicated configuration for comprehensive automation tests
 */
export default defineConfig({
  testDir: './tests-automation',
  fullyParallel: false, // Run tests sequentially to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2,

  // Enhanced reporting
  reporter: [
    ['html', {
      outputFolder: 'playwright-automation-report',
      open: 'never'
    }],
    ['json', {
      outputFile: 'playwright-automation-report/results.json'
    }],
    ['list'],
  ],

  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Slower actions for more reliable tests
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: 'Desktop Safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet',
      use: { ...devices['iPad Pro'] },
    },
  ],

  // Assume dev server is already running
  // If not, start it with: npm run dev
  webServer: {
    command: 'echo "Dev server should already be running on port 9000"',
    url: 'http://localhost:9000',
    reuseExistingServer: true,
    timeout: 5000,
  },
});
