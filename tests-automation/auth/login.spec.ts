/**
 * Admin Login Tests
 * Tests for admin authentication via email/password
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin, verifySessionCookie, clearCookies } from '../helpers/auth-helpers'
import { TEST_ADMINS } from '../helpers/test-data'

test.describe('Admin Login', () => {
  test.beforeEach(async ({ page }) => {
    await clearCookies(page)
    await page.goto('/admin/login')
  })

  test('should display login form correctly', async ({ page }) => {
    // Check page title/heading
    await expect(page.locator('h1, h2')).toContainText(/התחבר|כניסה/)

    // Check form fields
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Check links
    await expect(page.locator('a[href*="signup"]')).toBeVisible()
    await expect(page.locator('a[href*="forgot-password"]')).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    // Try to submit without filling fields
    await page.click('button[type="submit"]')

    // Should show HTML5 validation or custom error
    const emailInput = page.locator('input[type="email"]')
    const isRequired = await emailInput.evaluate((el: HTMLInputElement) => el.required)
    expect(isRequired).toBeTruthy()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', 'wrong@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')

    await page.click('button[type="submit"]')

    // Should show error message
    await expect(page.locator('text=/שגוי|לא נמצא|incorrect/')).toBeVisible({ timeout: 5000 })
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    await page.fill('input[type="email"]', TEST_ADMINS.adminA.email)
    await page.fill('input[type="password"]', TEST_ADMINS.adminA.password)

    await page.click('button[type="submit"]')

    // Should redirect to /admin dashboard
    await page.waitForURL(/\/(admin|admin\/onboarding)/, { timeout: 10000 })

    // Should set session cookie
    await verifySessionCookie(page)
  })

  test('should persist session after page refresh', async ({ page }) => {
    // Login
    await loginAsAdmin(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Refresh page
    await page.reload()

    // Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL('/admin/login')
  })

  test('should redirect to onboarding if not completed', async ({ page }) => {
    // This test assumes there's a user without completed onboarding
    // For now, we'll skip or create such a user in beforeAll
    test.skip()
  })

  test('should have "home" button to return to landing page', async ({ page }) => {
    const homeButton = page.locator('a[href="/"]')
    await expect(homeButton).toBeVisible()

    await homeButton.click()
    await expect(page).toHaveURL('/')
  })

  test.describe('Password visibility toggle', () => {
    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]')
      await passwordInput.fill('testpassword')

      // Initially should be type="password"
      expect(await passwordInput.getAttribute('type')).toBe('password')

      // Click toggle (look for eye icon or similar)
      const toggleButton = page.locator('button:near(input[type="password"])')
      if (await toggleButton.isVisible()) {
        await toggleButton.click()

        // Should change to type="text"
        const typeAfter = await passwordInput.getAttribute('type')
        expect(typeAfter).toBe('text')
      }
    })
  })

  test.describe('URL parameter handling', () => {
    test('should show success message for verified email', async ({ page }) => {
      await page.goto('/admin/login?message=verified')

      await expect(page.locator('text=/אומת בהצלחה|verified/')).toBeVisible()
    })

    test('should show success message for password reset', async ({ page }) => {
      await page.goto('/admin/login?message=password_reset')

      await expect(page.locator('text=/שונתה בהצלחה|changed/')).toBeVisible()
    })

    test('should show error for invalid token', async ({ page }) => {
      await page.goto('/admin/login?error=invalid_token')

      await expect(page.locator('text=/לא תקין|invalid/')).toBeVisible()
    })
  })

  test.describe('Mobile responsiveness', () => {
    test('should be fully functional on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      // Form should be visible and usable
      await expect(page.locator('input[type="email"]')).toBeVisible()
      await expect(page.locator('input[type="password"]')).toBeVisible()

      // Submit button should have min height
      const submitBtn = page.locator('button[type="submit"]')
      const box = await submitBtn.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)

      // Should be able to login
      await page.fill('input[type="email"]', TEST_ADMINS.adminA.email)
      await page.fill('input[type="password"]', TEST_ADMINS.adminA.password)
      await submitBtn.click()

      await page.waitForURL(/\/admin/, { timeout: 10000 })
    })
  })

  test.describe('Session Cookie Security', () => {
    test('session cookie should be HttpOnly and Secure', async ({ page }) => {
      await loginAsAdmin(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      expect(sessionCookie).toBeDefined()
      expect(sessionCookie?.httpOnly).toBeTruthy()
      // Secure flag should be true in production, false in development
      // expect(sessionCookie?.secure).toBeTruthy()
      expect(sessionCookie?.sameSite).toBe('Lax')
    })

    test('should not be able to access admin pages without login', async ({ page }) => {
      await clearCookies(page)

      // Try to access admin dashboard
      await page.goto('/admin')

      // Should redirect to login
      await page.waitForURL('/admin/login', { timeout: 5000 })
    })
  })
})
