/**
 * Visual Regression Testing - Baseline Screenshots
 *
 * This suite captures screenshots of critical pages for visual regression testing.
 * Screenshots are compared against baseline images to detect unintended UI changes.
 *
 * Usage:
 * - Generate baselines: npx playwright test tests/visual/ --update-snapshots
 * - Run visual tests: npx playwright test tests/visual/
 * - Review diffs: Check test-results/ directory for visual differences
 *
 * Note: Screenshots are device-specific (Desktop Chrome, Mobile Chrome, Mobile Safari)
 */

import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

test.describe('Visual Regression Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Public Pages', () => {
    test('landing page matches baseline', async ({ page }) => {
      await page.goto('/')

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')

      // Hide dynamic content (if any)
      await page.evaluate(() => {
        // Hide any elements with current date/time
        const dateElements = document.querySelectorAll('[data-testid="current-date"]')
        dateElements.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))
      })

      await expect(page).toHaveScreenshot('landing-page.png', {
        fullPage: true,
      })
    })

    test('login page matches baseline', async ({ page }) => {
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-login-page.png')
    })

    test('signup page matches baseline', async ({ page }) => {
      await page.goto('/admin/signup')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-signup-page.png')
    })

    test('forgot password page matches baseline', async ({ page }) => {
      await page.goto('/admin/forgot-password')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('forgot-password-page.png')
    })

    test('help page matches baseline', async ({ page }) => {
      await page.goto('/admin/help')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('help-page.png', {
        fullPage: true,
      })
    })

    test('privacy policy page matches baseline', async ({ page }) => {
      await page.goto('/privacy')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('privacy-page.png', {
        fullPage: true,
      })
    })

    test('terms of service page matches baseline', async ({ page }) => {
      await page.goto('/terms')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('terms-page.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Authenticated Admin Pages', () => {
    let school: any
    let admin: any

    test.beforeAll(async () => {
      // Create test school and admin
      school = await createSchool().withName('Visual Test School').withSlug('visual-test').create()

      admin = await createAdmin()
        .withEmail('visual-test@test.com')
        .withPassword('Password123!')
        .withSchool(school.id)
        .withRole('ADMIN')
        .verified()
        .create()
    })

    test('admin dashboard matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-test@test.com', 'Password123!')

      // Wait for dashboard to load
      await page.waitForURL(/\/admin(?:\/dashboard)?$/)
      await page.waitForLoadState('networkidle')

      // Hide dynamic content (stats numbers may change)
      await page.evaluate(() => {
        // Hide stat numbers but keep labels
        const statNumbers = document.querySelectorAll('[data-testid*="stat-value"]')
        statNumbers.forEach((el) => ((el as HTMLElement).textContent = '0'))
      })

      await expect(page).toHaveScreenshot('admin-dashboard.png', {
        fullPage: true,
      })
    })

    test('events page (empty state) matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-test@test.com', 'Password123!')

      await page.goto('/admin/events')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-events-empty.png', {
        fullPage: true,
      })
    })

    test('create event page matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-test@test.com', 'Password123!')

      await page.goto('/admin/events/new')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-create-event.png', {
        fullPage: true,
      })
    })

    test('settings page matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-test@test.com', 'Password123!')

      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-settings.png', {
        fullPage: true,
      })
    })

    test('team management page matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-test@test.com', 'Password123!')

      await page.goto('/admin/team')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-team.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Event Management Pages', () => {
    let school: any
    let admin: any
    let event: any

    test.beforeAll(async () => {
      school = await createSchool()
        .withName('Visual Event School')
        .withSlug('visual-event')
        .create()

      admin = await createAdmin()
        .withEmail('visual-event@test.com')
        .withPassword('Password123!')
        .withSchool(school.id)
        .withRole('ADMIN')
        .verified()
        .create()

      event = await createEvent()
        .withTitle('Soccer Match')
        .withSlug('soccer-match')
        .withSchool(school.id)
        .withCapacity(100)
        .future()
        .create()
    })

    test('event details page matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-event@test.com', 'Password123!')

      await page.goto(`/admin/events/${event.id}`)
      await page.waitForLoadState('networkidle')

      // Hide dynamic dates
      await page.evaluate(() => {
        const dateElements = document.querySelectorAll('[data-testid*="date"]')
        dateElements.forEach((el) => ((el as HTMLElement).textContent = '2024-12-31 18:00'))
      })

      await expect(page).toHaveScreenshot('admin-event-details.png', {
        fullPage: true,
      })
    })

    test('edit event page matches baseline', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login('visual-event@test.com', 'Password123!')

      await page.goto(`/admin/events/${event.id}/edit`)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('admin-edit-event.png', {
        fullPage: true,
      })
    })

    test('public registration form matches baseline', async ({ page }) => {
      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('public-registration-form.png', {
        fullPage: true,
      })
    })
  })

  test.describe('Form States', () => {
    test('registration form with validation errors', async ({ page }) => {
      const school = await createSchool()
        .withName('Form Test School')
        .withSlug('form-test')
        .create()

      const event = await createEvent()
        .withTitle('Form Test Event')
        .withSlug('form-test-event')
        .withSchool(school.id)
        .withCapacity(50)
        .future()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Click submit without filling form to trigger validation errors
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Wait for error messages to appear
      await page.waitForSelector('text=נא למלא את כל השדות החובה', { timeout: 5000 })

      await expect(page).toHaveScreenshot('registration-form-validation-errors.png')
    })

    test('registration form success state', async ({ page }) => {
      const school = await createSchool()
        .withName('Success Test School')
        .withSlug('success-test')
        .create()

      const event = await createEvent()
        .withTitle('Success Test Event')
        .withSlug('success-test-event')
        .withSchool(school.id)
        .withCapacity(50)
        .future()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Fill and submit form
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="email"]', 'test@example.com')
      await page.fill('input[name="phone"]', '0501234567')
      await page.click('button:has-text("הוסף אורח")')
      await page.click('button[type="submit"]')

      // Wait for success message
      await page.waitForSelector('text=נרשמת בהצלחה', { timeout: 10000 })

      await expect(page).toHaveScreenshot('registration-form-success.png')
    })
  })

  test.describe('Mobile Responsive Layouts', () => {
    test.use({ viewport: { width: 375, height: 667 } }) // iPhone SE size

    test('mobile landing page matches baseline', async ({ page }) => {
      await page.goto('/')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('mobile-landing-page.png', {
        fullPage: true,
      })
    })

    test('mobile login page matches baseline', async ({ page }) => {
      await page.goto('/admin/login')
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('mobile-login-page.png')
    })

    test('mobile registration form matches baseline', async ({ page }) => {
      const school = await createSchool()
        .withName('Mobile Test School')
        .withSlug('mobile-test')
        .create()

      const event = await createEvent()
        .withTitle('Mobile Test Event')
        .withSlug('mobile-test-event')
        .withSchool(school.id)
        .withCapacity(50)
        .future()
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      await expect(page).toHaveScreenshot('mobile-registration-form.png', {
        fullPage: true,
      })
    })
  })
})
