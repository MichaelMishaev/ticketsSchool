import { test, expect } from '@playwright/test'

/**
 * Golden Path Canary - Admin Authentication & Dashboard
 *
 * CRITICAL: This test runs hourly against production to detect outages.
 * It verifies admin login and dashboard are functional.
 *
 * Expectations:
 * - Completes in <5 seconds
 * - Login page loads
 * - Can authenticate with canary admin account
 * - Dashboard loads after login
 *
 * This is a READ-ONLY test - no mutations in production.
 *
 * Required Environment Variables:
 * - CANARY_ADMIN_EMAIL: Email of dedicated canary admin account
 * - CANARY_ADMIN_PASSWORD: Password for canary admin account
 */

test.describe('Golden Path Canary - Admin Login & Dashboard', () => {
  test.setTimeout(5000) // Must complete in <5 seconds

  const canaryEmail = process.env.CANARY_ADMIN_EMAIL
  const canaryPassword = process.env.CANARY_ADMIN_PASSWORD

  test.beforeEach(() => {
    if (!canaryEmail || !canaryPassword) {
      throw new Error('❌ CANARY CONFIG ERROR: CANARY_ADMIN_EMAIL and CANARY_ADMIN_PASSWORD must be set')
    }
  })

  test('admin login page loads successfully', async ({ page }) => {
    const startTime = Date.now()

    const response = await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    })

    const loadTime = Date.now() - startTime

    // Verify successful response
    expect(response?.status()).toBe(200)

    // Verify login form exists
    await expect(page.locator('input[name="email"]')).toBeVisible({ timeout: 1000 })
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 1000 })
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 1000 })

    console.log(`✅ ADMIN LOGIN PAGE: Loaded in ${loadTime}ms`)
  })

  test('canary admin can authenticate successfully', async ({ page }) => {
    // Navigate to login
    await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    })

    // Fill credentials
    await page.fill('input[name="email"]', canaryEmail!)
    await page.fill('input[type="password"]', canaryPassword!)

    // Submit login
    const loginStartTime = Date.now()
    await page.click('button[type="submit"]')

    // Wait for redirect to admin dashboard
    await page.waitForURL(/\/admin/, { timeout: 3000 })

    const loginTime = Date.now() - loginStartTime

    // Verify we're on an admin page (not redirected to login)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/admin/)
    expect(currentUrl).not.toMatch(/\/admin\/login/)

    console.log(`✅ ADMIN LOGIN: Authenticated in ${loginTime}ms`)
  })

  test('admin dashboard loads after login', async ({ page }) => {
    // Login
    await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    })

    await page.fill('input[name="email"]', canaryEmail!)
    await page.fill('input[type="password"]', canaryPassword!)
    await page.click('button[type="submit"]')

    // Wait for redirect
    await page.waitForURL(/\/admin/, { timeout: 3000 })

    // Dashboard should load (look for logout button as indicator)
    await expect(
      page.locator('text=/התנתק|logout/i')
    ).toBeVisible({ timeout: 2000 })

    console.log('✅ ADMIN DASHBOARD: Loaded successfully with authenticated session')
  })

  test('complete admin golden path completes in <5 seconds', async ({ page }) => {
    const startTime = Date.now()

    // 1. Load login page
    await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    })

    // 2. Login
    await page.fill('input[name="email"]', canaryEmail!)
    await page.fill('input[type="password"]', canaryPassword!)
    await page.click('button[type="submit"]')

    // 3. Wait for dashboard
    await page.waitForURL(/\/admin/, { timeout: 3000 })

    // 4. Verify session
    await expect(
      page.locator('text=/התנתק|logout/i')
    ).toBeVisible({ timeout: 2000 })

    const totalTime = Date.now() - startTime

    // CRITICAL: Must complete in under 5 seconds
    expect(totalTime).toBeLessThan(5000)

    console.log(`✅ ADMIN GOLDEN PATH: Complete flow took ${totalTime}ms`)

    // Alert if slow but not failing
    if (totalTime > 3000) {
      console.warn(`⚠️  WARNING: Admin golden path took ${totalTime}ms (>3s, but <5s threshold)`)
    }
  })

  test('admin session persists across page navigation', async ({ page }) => {
    // Login
    await page.goto('/admin/login', {
      waitUntil: 'domcontentloaded',
      timeout: 3000
    })

    await page.fill('input[name="email"]', canaryEmail!)
    await page.fill('input[type="password"]', canaryPassword!)
    await page.click('button[type="submit"]')

    await page.waitForURL(/\/admin/, { timeout: 3000 })

    // Navigate to events page
    await page.goto('/admin/events', {
      waitUntil: 'domcontentloaded',
      timeout: 2000
    })

    // Should still be authenticated (not redirected to login)
    const currentUrl = page.url()
    expect(currentUrl).toMatch(/\/admin\/events/)

    // Logout button should still be visible
    await expect(
      page.locator('text=/התנתק|logout/i')
    ).toBeVisible({ timeout: 1000 })

    console.log('✅ ADMIN SESSION: Persists across navigation')
  })
})
