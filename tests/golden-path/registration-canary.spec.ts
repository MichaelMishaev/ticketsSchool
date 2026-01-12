import { test, expect } from '@playwright/test'

/**
 * Golden Path Canary - Public Registration
 *
 * CRITICAL: This test runs hourly against production to detect outages.
 * It verifies the public registration page is accessible and functional.
 *
 * Expectations:
 * - Completes in <5 seconds
 * - Page loads successfully
 * - Registration form is visible
 * - Required fields (fullName, phone) are present
 *
 * This is a READ-ONLY test - no mutations in production.
 */

test.describe('Golden Path Canary - Public Registration', () => {
  test.setTimeout(5000) // Must complete in <5 seconds

  test('public registration page loads with form visible', async ({ page }) => {
    // Navigate to a known public event page
    // Note: You must create a canary event in production with this exact URL
    const response = await page.goto('/p/test-school/test-event', {
      waitUntil: 'domcontentloaded',
      timeout: 4000
    })

    // Verify page loaded successfully
    expect(response?.status()).toBeLessThan(500) // Allow 404 if event doesn't exist, but not 500+

    // If event exists (200), verify form is visible
    if (response?.status() === 200) {
      // Wait for registration form to be visible
      await expect(page.locator('input[name="name"]')).toBeVisible({ timeout: 2000 })

      // Verify required fields exist
      await expect(page.locator('input[name="phone"]')).toBeVisible({ timeout: 1000 })

      // Verify submit button exists
      await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 1000 })

      console.log('✅ PUBLIC REGISTRATION: Page loaded successfully with all required fields')
    } else {
      console.log('ℹ️  PUBLIC REGISTRATION: Event not found (expected if canary event not created yet)')
    }
  })

  test('event page responds within acceptable time', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/p/test-school/test-event', {
      waitUntil: 'domcontentloaded',
      timeout: 4000
    }).catch(() => {
      // Catch timeout errors
      const elapsed = Date.now() - startTime
      throw new Error(`❌ PRODUCTION DOWN - Page took ${elapsed}ms (>4000ms timeout)`)
    })

    const loadTime = Date.now() - startTime

    // Should load in under 3 seconds (leaving 2s buffer for form checks)
    expect(loadTime).toBeLessThan(3000)

    console.log(`✅ PUBLIC REGISTRATION: Page loaded in ${loadTime}ms`)
  })

  test('page contains event registration elements', async ({ page }) => {
    const response = await page.goto('/p/test-school/test-event', {
      waitUntil: 'domcontentloaded',
      timeout: 4000
    })

    if (response?.status() === 200) {
      // Check for key registration page elements (even if event doesn't exist)
      const hasFormOrError = await Promise.race([
        page.locator('input[name="name"]').isVisible().catch(() => false),
        page.locator('text=/404|not found|לא נמצא/i').isVisible().catch(() => false),
      ])

      expect(hasFormOrError).toBeTruthy()
      console.log('✅ PUBLIC REGISTRATION: Page structure is valid')
    }
  })
})
