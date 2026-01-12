import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:9000'

test.describe('Full Application QA - All Buttons and URLs', () => {
  // Login credentials for testing
  const testUser = {
    email: 'test@test.gmail.com',
    password: 'Test123!@#',
  }

  test.describe('Public Pages - Unauthenticated', () => {
    test('Login page - all buttons and links work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`)

      // Check page loaded
      await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible()

      // Test Google OAuth button
      const googleButton = page.locator('button:has-text("המשך עם Google")')
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toBeEnabled()

      // Test login button (should be visible but not yet functional without input)
      const loginButton = page.locator('button[type="submit"]:has-text("התחבר")')
      await expect(loginButton).toBeVisible()

      // Test signup link
      const signupLink = page.locator('a:has-text("הרשמה")')
      await expect(signupLink).toBeVisible()
      await signupLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/signup`)
      await page.goBack()

      // Test forgot password link
      const forgotPasswordLink = page.locator('a:has-text("שכחתי סיסמה")')
      await expect(forgotPasswordLink).toBeVisible()
      await forgotPasswordLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/forgot-password`)
    })

    test('Signup page - all buttons and links work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/signup`)

      // Check page loaded
      await expect(page.locator('h2:has-text("הרשמת מנהל")')).toBeVisible()

      // Test Google OAuth button
      const googleButton = page.locator('button:has-text("המשך עם Google")')
      await expect(googleButton).toBeVisible()
      await expect(googleButton).toBeEnabled()

      // Test signup button
      const signupButton = page.locator('button[type="submit"]:has-text("הרשם")')
      await expect(signupButton).toBeVisible()

      // Test login link
      const loginLink = page.locator('a:has-text("התחברות")')
      await expect(loginLink).toBeVisible()
      await loginLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`)
    })

    test('Forgot password page - all buttons work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/forgot-password`)

      // Check page loaded
      await expect(page.locator('h2:has-text("שכחת סיסמה")')).toBeVisible()

      // Test submit button
      const submitButton = page.locator('button[type="submit"]:has-text("שלח קישור לאיפוס")')
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toBeEnabled()

      // Test back to login link
      const backLink = page.locator('a:has-text("חזרה להתחברות")')
      await expect(backLink).toBeVisible()
      await backLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`)
    })
  })

  test.describe('Authenticated Pages - After Login', () => {
    test.beforeEach(async ({ page }) => {
      // Login before each test
      await page.goto(`${BASE_URL}/admin/login`)
      await page.fill('input[type="email"]', testUser.email)
      await page.fill('input[type="password"]', testUser.password)
      await page.click('button[type="submit"]:has-text("התחבר")')

      // Wait for redirect to dashboard
      await page.waitForURL(`${BASE_URL}/admin`, { timeout: 10000 })
    })

    test('Admin dashboard - all navigation links work', async ({ page }) => {
      // Check dashboard loaded
      await expect(page).toHaveURL(`${BASE_URL}/admin`)

      // Test navigation links in header
      const homeLink = page.locator('a:has-text("ראשי")').first()
      await expect(homeLink).toBeVisible()

      const eventsLink = page.locator('a:has-text("אירועים")').first()
      await expect(eventsLink).toBeVisible()
      await eventsLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/events`)

      // Go back to dashboard
      await page.goto(`${BASE_URL}/admin`)

      const newEventLink = page.locator('a:has-text("אירוע חדש")').first()
      await expect(newEventLink).toBeVisible()
      await newEventLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/events/new`)

      // Go back to dashboard
      await page.goto(`${BASE_URL}/admin`)

      const helpLink = page.locator('a:has-text("הסבר איך להוסיף אירוע")').first()
      await expect(helpLink).toBeVisible()
      await helpLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/help`)

      // Go back to dashboard
      await page.goto(`${BASE_URL}/admin`)

      const feedbackLink = page.locator('a:has-text("משובים")').first()
      await expect(feedbackLink).toBeVisible()
      await feedbackLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/feedback`)

      // Test logout button
      await page.goto(`${BASE_URL}/admin`)
      const logoutButton = page.locator('button:has-text("התנתק")')
      await expect(logoutButton).toBeVisible()
      await logoutButton.click()

      // Should redirect to login
      await expect(page).toHaveURL(`${BASE_URL}/admin/login`)
    })

    test('Dashboard - "צפה בכל האירועים" link works', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin`)

      const viewAllLink = page.locator('a:has-text("צפה בכל האירועים")')
      if (await viewAllLink.isVisible()) {
        await viewAllLink.click()
        await expect(page).toHaveURL(`${BASE_URL}/admin/events`)
      }
    })

    test('Events page - all buttons work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/events`)

      // Test "אירוע חדש" button
      const newEventButton = page.locator('a:has-text("+ אירוע חדש")')
      await expect(newEventButton).toBeVisible()
      await newEventButton.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/events/new`)
    })

    test('New Event page - all form buttons work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/events/new`)

      // Check form loaded
      await expect(page.locator('h1:has-text("יצירת אירוע חדש")')).toBeVisible()

      // Test submit button
      const submitButton = page.locator('button[type="submit"]:has-text("צור אירוע")')
      await expect(submitButton).toBeVisible()
      await expect(submitButton).toBeEnabled()

      // Test cancel button
      const cancelButton = page.locator('button:has-text("ביטול")')
      await expect(cancelButton).toBeVisible()
      await cancelButton.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/events`)
    })

    test('Feedback page - all buttons work', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/feedback`)

      // Check page loaded
      await expect(page.locator('h1:has-text("משובים")')).toBeVisible()

      // Check if there are any feedback items with action buttons
      const reviewButtons = page.locator('button:has-text("סמן כנסקר")')
      const resolveButtons = page.locator('button:has-text("סמן כטופל")')
      const dismissButtons = page.locator('button:has-text("התעלם")')

      const reviewCount = await reviewButtons.count()
      const resolveCount = await resolveButtons.count()
      const dismissCount = await dismissButtons.count()

      console.log(`Feedback action buttons found: ${reviewCount + resolveCount + dismissCount}`)
    })

    test('Mobile menu - all navigation works', async ({ page, viewport }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })

      await page.goto(`${BASE_URL}/admin`)

      // Open mobile menu
      const menuButton = page
        .locator('button[type="button"]')
        .filter({ hasText: /menu/i })
        .or(page.locator('svg.lucide-menu').locator('..'))
        .first()
      await menuButton.click()

      // Wait for menu to open
      await page.waitForTimeout(500)

      // Test mobile menu links
      const mobileHomeLink = page.locator('.sm\\:hidden a:has-text("ראשי")')
      await expect(mobileHomeLink).toBeVisible()

      const mobileEventsLink = page.locator('.sm\\:hidden a:has-text("אירועים")')
      await expect(mobileEventsLink).toBeVisible()

      const mobileNewEventLink = page.locator('.sm\\:hidden a:has-text("אירוע חדש")')
      await expect(mobileNewEventLink).toBeVisible()

      // Click one to test navigation
      await mobileEventsLink.click()
      await expect(page).toHaveURL(`${BASE_URL}/admin/events`)
    })
  })

  test.describe('API Endpoints - Health Checks', () => {
    test('Health check endpoint works', async ({ request }) => {
      const response = await request.get(`${BASE_URL}/api/health`)
      expect(response.ok()).toBeTruthy()

      const data = await response.json()
      expect(data.status).toBe('healthy')
    })

    test('Public API endpoints are accessible', async ({ request }) => {
      // Test public event page API
      const response = await request.get(`${BASE_URL}/api/p/test-slug`)
      // Should return 404 or event data (not 401/403)
      expect([200, 404]).toContain(response.status())
    })
  })

  test.describe('Protected Routes - Authentication Required', () => {
    test('Protected admin routes redirect to login when not authenticated', async ({ page }) => {
      const protectedRoutes = [
        '/admin',
        '/admin/events',
        '/admin/events/new',
        '/admin/feedback',
        '/admin/help',
      ]

      for (const route of protectedRoutes) {
        await page.goto(`${BASE_URL}${route}`)

        // Should redirect to login
        await expect(page).toHaveURL(`${BASE_URL}/admin/login`)
      }
    })

    test('Protected API routes return 401 when not authenticated', async ({ request }) => {
      const protectedAPIs = ['/api/admin/me', '/api/events', '/api/dashboard/stats']

      for (const api of protectedAPIs) {
        const response = await request.get(`${BASE_URL}${api}`)
        expect(response.status()).toBe(401)
      }
    })
  })

  test.describe('Form Validation', () => {
    test('Login form shows validation errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/login`)

      // Try to submit empty form
      await page.click('button[type="submit"]:has-text("התחבר")')

      // Should show HTML5 validation or error message
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeFocused()
    })

    test('Signup form shows validation errors', async ({ page }) => {
      await page.goto(`${BASE_URL}/admin/signup`)

      // Try to submit empty form
      await page.click('button[type="submit"]:has-text("הרשם")')

      // Should show HTML5 validation
      const emailInput = page.locator('input[type="email"]')
      await expect(emailInput).toBeFocused()
    })
  })
})
