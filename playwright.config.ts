import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testIgnore: '**/archived-e2e/**', // Exclude archived E2E tests from migration
  fullyParallel: false, // Changed from true - tests interfere with each other
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Changed from undefined - use 1 worker to prevent test interference
  reporter: 'html',
  timeout: 45000, // 45 seconds per test (admin layout can be slow to load)
  expect: {
    timeout: 10000, // 10 seconds for assertions
    // Screenshot comparison configuration for visual regression testing
    toHaveScreenshot: {
      maxDiffPixels: 100, // Allow up to 100 pixels difference (handles minor rendering variations)
      threshold: 0.2, // 20% threshold for acceptable difference (handles dynamic content like dates)
      animations: 'disabled', // Disable CSS animations for consistent screenshots
    },
  },
  use: {
    baseURL: 'http://localhost:9000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 15000, // 15 seconds for actions like click, fill
    navigationTimeout: 20000, // 20 seconds for page navigation
    // Inject CSS to hide Next.js dev overlay that blocks clicks in tests
    extraHTTPHeaders: {
      'X-Disable-Next-Dev-Overlay': 'true',
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
      retries: 2, // Mobile Safari has flaky login timeouts under sustained load - retry automatically
    },
  ],

  // webServer commented out - using existing dev server on port 9000
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:2900',
  //   reuseExistingServer: !process.env.CI,
  // },
})
