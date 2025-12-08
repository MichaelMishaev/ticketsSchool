import { Page, BrowserContext } from '@playwright/test'
import { TestAdmin } from '../fixtures/test-data'

/**
 * Get session cookie from page context
 */
export async function getSessionCookie(context: BrowserContext): Promise<string | null> {
  const cookies = await context.cookies()
  const sessionCookie = cookies.find(c => c.name === 'admin_session')
  return sessionCookie?.value || null
}

/**
 * Login via UI and return session cookie
 */
export async function loginViaUI(page: Page, email: string, password: string): Promise<string | null> {
  await page.goto('/admin/login')
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await page.click('button[type="submit"]')

  await page.waitForURL(/\/admin/, { timeout: 10000 })

  return await getSessionCookie(page.context())
}

/**
 * Login via API (faster for setup)
 */
export async function loginViaAPI(context: BrowserContext, email: string, password: string): Promise<boolean> {
  const response = await context.request.post('/api/admin/login', {
    data: {
      email,
      password,
    },
  })

  return response.ok()
}

/**
 * Create authenticated context with admin user
 */
export async function createAuthenticatedContext(
  context: BrowserContext,
  admin: TestAdmin
): Promise<void> {
  await loginViaAPI(context, admin.email, admin.password)
}

/**
 * Logout
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/admin/logout')
  await page.waitForURL(/\/(login|$)/, { timeout: 5000 })
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const url = page.url()
  return url.includes('/admin') && !url.includes('/login')
}

/**
 * Wait for authentication redirect
 */
export async function waitForAuthRedirect(page: Page, timeout = 10000): Promise<void> {
  await page.waitForURL(/\/admin/, { timeout })
}

/**
 * Expect unauthenticated (should redirect to login)
 */
export async function expectUnauthenticated(page: Page): Promise<void> {
  const url = page.url()
  if (!url.includes('/login') && !url.includes('/signup')) {
    await page.waitForURL(/\/(login|signup)/, { timeout: 5000 })
  }
}

/**
 * Create test admin session storage
 */
export function createSessionStorage(admin: TestAdmin) {
  return {
    adminId: admin.id,
    email: admin.email,
    role: admin.role,
    schoolId: admin.schoolId,
  }
}
