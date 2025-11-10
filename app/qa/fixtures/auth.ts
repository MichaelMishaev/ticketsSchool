import { test as base, Page } from '@playwright/test'

/**
 * Authentication helper functions for tests
 */

export interface AuthFixtures {
  authenticatedPage: Page
  superAdminPage: Page
  schoolAdminPage: Page
}

/**
 * Login as a specific admin user
 */
export async function loginAsAdmin(page: Page, email: string, password: string) {
  await page.goto('/admin/login')
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.click('button[type="submit"]')

  // Wait for navigation to dashboard
  await page.waitForURL(/\/admin/, { timeout: 10000 })
}

/**
 * Login as super admin (admin@beeri.com)
 */
export async function loginAsSuperAdmin(page: Page) {
  await loginAsAdmin(page, 'admin@beeri.com', 'beeri123')
}

/**
 * Login as school admin
 */
export async function loginAsSchoolAdmin(page: Page, email: string, password: string) {
  await loginAsAdmin(page, email, password)
}

/**
 * Logout current user
 */
export async function logout(page: Page) {
  await page.goto('/admin')
  // Look for logout button/link and click it
  const logoutButton = page.locator('text=התנתק').or(page.locator('text=Logout'))
  if (await logoutButton.isVisible()) {
    await logoutButton.click()
  }
}

/**
 * Extended test with authentication fixtures
 */
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAsAdmin(page, 'admin@beeri.com', 'beeri123')
    await use(page)
    await context.close()
  },

  superAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    await loginAsSuperAdmin(page)
    await use(page)
    await context.close()
  },

  schoolAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext()
    const page = await context.newPage()
    // This will be configured per test with specific school admin credentials
    await use(page)
    await context.close()
  }
})

export { expect } from '@playwright/test'
