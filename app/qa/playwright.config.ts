import { defineConfig, devices } from '@playwright/test'

/**
 * QA Test Configuration for Multi-School Features
 *
 * This config is specifically for testing:
 * - Multi-school isolation
 * - Team invitation flow
 * - Super admin access
 */
export default defineConfig({
  testDir: './',
  fullyParallel: false, // Run tests sequentially for data consistency
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker to avoid race conditions
  reporter: [
    ['html', { outputFolder: 'playwright-report-qa' }],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Use existing dev server
  timeout: 30000,
  expect: {
    timeout: 5000
  }
})
