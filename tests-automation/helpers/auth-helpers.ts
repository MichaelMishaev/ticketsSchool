/**
 * Authentication Helper Functions
 * Reusable login/signup utilities for tests
 */

import { Page, expect } from '@playwright/test'
import { TEST_ADMINS } from './test-data'

/**
 * Login as admin via UI
 */
export async function loginAsAdmin(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/admin/login')

  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)

  await page.click('button[type="submit"]')

  // Wait for redirect (either to /admin or /admin/onboarding)
  await page.waitForURL(/\/(admin|admin\/onboarding)/, { timeout: 10000 })
}

/**
 * Login via API and set cookies
 */
export async function loginViaAPI(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  const response = await page.request.post('/api/admin/login', {
    data: { email, password },
  })

  expect(response.ok()).toBeTruthy()

  // Cookies are automatically set by the browser
  await page.goto('/admin')
}

/**
 * Signup new user via UI
 */
export async function signupNewUser(
  page: Page,
  {
    email,
    password,
    name,
    schoolName,
    schoolSlug,
  }: {
    email: string
    password: string
    name: string
    schoolName: string
    schoolSlug: string
  }
): Promise<void> {
  await page.goto('/admin/signup')

  // Fill organization info (Step 1)
  await page.fill('input[name="schoolName"]', schoolName)
  await page.fill('input[name="schoolSlug"]', schoolSlug)

  // Fill personal info (Step 2)
  await page.fill('input[name="name"]', name)
  await page.fill('input[name="email"]', email)
  await page.fill('input[name="password"]', password)
  await page.fill('input[name="confirmPassword"]', password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for success screen
  await expect(page.locator('text=נרשמת בהצלחה')).toBeVisible({ timeout: 10000 })
}

/**
 * Complete onboarding flow
 */
export async function completeOnboarding(
  page: Page,
  schoolName: string,
  schoolSlug: string
): Promise<void> {
  // Should be on /admin/onboarding page
  await expect(page).toHaveURL('/admin/onboarding')

  await page.fill('input[placeholder*="שם הארגון"]', schoolName)
  await page.fill('input[placeholder*="קישור"]', schoolSlug)

  await page.click('button:has-text("שמור והמשך")')

  // Should redirect to /admin dashboard
  await page.waitForURL('/admin', { timeout: 10000 })
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const response = await page.request.get('/api/admin/me')
  const data = await response.json()
  return data.authenticated === true
}

/**
 * Get current admin info
 */
export async function getCurrentAdmin(page: Page): Promise<any> {
  const response = await page.request.get('/api/admin/me')
  const data = await response.json()
  return data.admin
}

/**
 * Logout via UI
 */
export async function logout(page: Page): Promise<void> {
  // Click logout button (in mobile menu or desktop nav)
  await page.click('text=יציאה')

  // Should redirect to login
  await page.waitForURL('/admin/login', { timeout: 5000 })
}

/**
 * Logout via API
 */
export async function logoutViaAPI(page: Page): Promise<void> {
  await page.request.post('/api/admin/logout')
  await page.goto('/admin/login')
}

/**
 * Login as specific test admin
 */
export async function loginAsTestAdmin(
  page: Page,
  adminKey: keyof typeof TEST_ADMINS
): Promise<void> {
  const admin = TEST_ADMINS[adminKey]
  await loginViaAPI(page, admin.email, admin.password)
}

/**
 * Verify session cookie exists
 */
export async function verifySessionCookie(page: Page): Promise<void> {
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find((c) => c.name === 'admin_session')

  expect(sessionCookie).toBeDefined()
  expect(sessionCookie?.httpOnly).toBeTruthy()
}

/**
 * Clear all cookies
 */
export async function clearCookies(page: Page): Promise<void> {
  await page.context().clearCookies()
}
