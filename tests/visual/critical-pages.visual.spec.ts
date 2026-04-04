/**
 * Critical Pages Visual Regression Testing
 *
 * Comprehensive visual regression tests following VISUAL_REGRESSION_SETUP.md guide.
 * Tests critical user journeys across public pages, admin pages, payment flow, and error states.
 *
 * Testing approach:
 * - Hybrid: Playwright built-in (local) + Percy.io (PR reviews)
 * - Hebrew RTL layout testing
 * - Mobile and desktop viewports
 * - Critical pages only (10+ snapshots)
 *
 * Usage:
 * - Generate baselines: npx playwright test tests/visual/critical-pages.visual.spec.ts --update-snapshots
 * - Run visual tests: npx playwright test tests/visual/critical-pages.visual.spec.ts
 * - Review diffs: Check test-results/ directory for visual differences
 *
 * Configuration:
 * - maxDiffPixels: 100 (handles minor rendering variations)
 * - threshold: 0.2 (20% acceptable difference for dynamic content)
 * - animations: disabled (consistent screenshots)
 */

import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import {
  createSchool,
  createAdmin,
  createEvent,
  cleanupTestData,
  prisma,
} from '../fixtures/test-data'

test.describe('Critical Pages Visual Regression', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Public Pages', () => {
    test('homepage desktop matches baseline', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Hide dynamic content (dates, timestamps)
      await page.evaluate(() => {
        const dateElements = document.querySelectorAll(
          '[data-testid="current-date"], [data-testid="timestamp"]'
        )
        dateElements.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))
      })

      await expect(page).toHaveScreenshot('homepage-desktop.png', {
        fullPage: true,
      })
    })

    test('homepage mobile 375x667 matches baseline', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto('/')
      await page.waitForLoadState('networkidle')

      // Hide dynamic content
      await page.evaluate(() => {
        const dateElements = document.querySelectorAll(
          '[data-testid="current-date"], [data-testid="timestamp"]'
        )
        dateElements.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))
      })

      await expect(page).toHaveScreenshot('homepage-mobile-375x667.png', {
        fullPage: true,
      })
    })

    test('event registration page desktop matches baseline', async ({ page }) => {
      // Create test school and event
      const school = await createSchool()
        .withName('Visual Regression School')
        .withSlug('visual-regression-school')
        .create()

      const event = await createEvent()
        .withTitle('Visual Test Event')
        .withSlug('visual-test-event')
        .withSchool(school.id)
        .withCapacity(100)
        .inFuture()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Wait for critical elements
      await page.waitForSelector('text=רישום לאירוע', { timeout: 10000 })

      await expect(page).toHaveScreenshot('event-registration-desktop.png', {
        fullPage: true,
      })
    })

    test('event registration page mobile Hebrew RTL matches baseline', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      // Create test school and event
      const school = await createSchool()
        .withName('Visual RTL School')
        .withSlug('visual-rtl-school')
        .create()

      const event = await createEvent()
        .withTitle('אירוע בדיקה ויזואלית')
        .withSlug('visual-rtl-event')
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Wait for Hebrew text to render
      await page.waitForSelector('text=רישום לאירוע', { timeout: 10000 })

      // Verify RTL layout
      const bodyDir = await page.locator('body').getAttribute('dir')
      expect(bodyDir).toBe('rtl')

      await expect(page).toHaveScreenshot('event-registration-mobile-rtl.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Admin Pages', () => {
    test('admin login page matches baseline', async ({ page }) => {
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')

      // Wait for critical elements
      await page.waitForSelector('input[name="email"]', { timeout: 10000 })
      await page.waitForSelector('input[type="password"]', { timeout: 10000 })

      await expect(page).toHaveScreenshot('admin-login-page.png')
    })

    test('admin dashboard desktop matches baseline', async ({ page }) => {
      // Create test school and admin
      const school = await createSchool()
        .withName('Dashboard Test School')
        .withSlug('dashboard-test')
        .create()

      const admin = await createAdmin()
        .withEmail('dashboard-test@test.com')
        .withPassword('Password123!')
        .withSchool(school.id)
        .withRole('ADMIN')
        .emailVerified(true)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'Password123!')

      // Wait for dashboard to load
      await page.waitForURL(/\/admin(?:\/dashboard)?$/, { timeout: 45000 })
      await page.waitForLoadState('networkidle')

      // Hide dynamic stats
      await page.evaluate(() => {
        const statElements = document.querySelectorAll(
          '[data-testid*="stat-value"], [data-testid*="stat-number"]'
        )
        statElements.forEach((el) => {
          ;(el as HTMLElement).textContent = '0'
        })
      })

      await expect(page).toHaveScreenshot('admin-dashboard-desktop.png', {
        fullPage: true,
      })
    })

    test('event list empty state matches baseline', async ({ page }) => {
      // Create test school and admin (no events)
      const school = await createSchool()
        .withName('Empty Events School')
        .withSlug('empty-events')
        .create()

      const admin = await createAdmin()
        .withEmail('empty-events@test.com')
        .withPassword('Password123!')
        .withSchool(school.id)
        .withRole('ADMIN')
        .emailVerified(true)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'Password123!')

      // Navigate to events page
      await page.goto('/admin/events')
      await page.waitForLoadState('networkidle')

      // Wait for empty state message
      await page.waitForSelector('text=אין אירועים', { timeout: 10000 }).catch(() => {
        // Might say "No events" in English
        return page.waitForSelector('text=/no events/i', { timeout: 10000 })
      })

      await expect(page).toHaveScreenshot('event-list-empty-state.png', {
        fullPage: true,
      })
    })

    test('event creation form matches baseline', async ({ page }) => {
      // Create test school and admin
      const school = await createSchool()
        .withName('Create Event School')
        .withSlug('create-event')
        .create()

      const admin = await createAdmin()
        .withEmail('create-event@test.com')
        .withPassword('Password123!')
        .withSchool(school.id)
        .withRole('ADMIN')
        .emailVerified(true)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'Password123!')

      // Navigate to create event page
      await page.goto('/admin/events/new')
      await page.waitForLoadState('networkidle')

      // Wait for form to load
      await page.waitForSelector('input[name="title"]', { timeout: 10000 })

      await expect(page).toHaveScreenshot('event-creation-form.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Payment Flow', () => {
    test('payment form desktop with YAADPAY_MOCK_MODE matches baseline', async ({ page }) => {
      // Note: This test assumes YAADPAY_MOCK_MODE="true" in .env for local testing

      // Create test school and event with payment
      const school = await createSchool()
        .withName('Payment Test School')
        .withSlug('payment-test')
        .create()

      const event = await createEvent()
        .withTitle('Paid Event')
        .withSlug('paid-event')
        .withSchool(school.id)
        .withCapacity(50)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100, 'ILS')
        .inFuture()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Fill registration form
      await page.fill('input[name="name"]', 'Test User Payment')
      await page.fill('input[name="email"]', 'payment-test@example.com')
      await page.fill('input[name="phone"]', '0501234567')

      // Submit to payment page
      await page.click('button[type="submit"]')

      // Wait for payment form or mock screen
      await page.waitForTimeout(2000) // Allow form submission processing

      // If mock mode is enabled, we'll see the green mock screen
      // Otherwise, we'll see the YaadPay form
      const isMockMode = await page
        .locator('text=MOCK MODE')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (isMockMode) {
        await expect(page).toHaveScreenshot('payment-form-mock-mode.png')
      } else {
        // Wait for payment form elements
        await page.waitForSelector('form', { timeout: 10000 })
        await expect(page).toHaveScreenshot('payment-form-desktop.png')
      }
    })

    test('payment success page matches baseline', async ({ page }) => {
      // Create test school and event
      const school = await createSchool()
        .withName('Payment Success School')
        .withSlug('payment-success')
        .create()

      const event = await createEvent()
        .withTitle('Success Event')
        .withSlug('success-event')
        .withSchool(school.id)
        .withCapacity(50)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100, 'ILS')
        .inFuture()
        .create()

      // Create a registration with completed payment
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          phoneNumber: '0501234567',
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'ABC123',
          paymentStatus: 'COMPLETED',
          amountPaid: 100,
          data: {
            name: 'Test User Success',
            email: 'success@example.com',
          },
        },
      })

      // Navigate to success page
      await page.goto(`/payment/success?code=${registration.confirmationCode}`)
      await page.waitForLoadState('networkidle')

      // Wait for success message
      await page.waitForSelector(
        'text=/הרישום הושלם בהצלחה|Registration completed successfully/i',
        { timeout: 10000 }
      )

      await expect(page).toHaveScreenshot('payment-success-page.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Error States', () => {
    test('404 page not found matches baseline', async ({ page }) => {
      // Navigate to non-existent page
      const response = await page.goto('/this-page-does-not-exist-123456')

      // Verify 404 status
      expect(response?.status()).toBe(404)

      await page.waitForLoadState('networkidle')

      // Wait for 404 message
      await page.waitForSelector('text=/404|not found|לא נמצא/i', { timeout: 10000 })

      await expect(page).toHaveScreenshot('404-page-not-found.png', {
        fullPage: true,
      })
    })
  })
})
