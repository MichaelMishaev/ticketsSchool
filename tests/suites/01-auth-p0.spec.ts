import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { SignupPage } from '../page-objects/SignupPage'
import { createAdmin, createSchool, cleanupTestData } from '../fixtures/test-data'
import { generateEmail } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Authentication & Authorization Tests
 * Ref: tests/scenarios/01-authentication-authorization.md
 */

test.describe('Authentication P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[01.1.1] Complete Signup Flow', () => {
    test('new user can signup successfully', async ({ page }) => {
      const signupPage = new SignupPage(page)
      const email = generateEmail('signup')

      await signupPage.goto()

      await signupPage.signup({
        email,
        password: 'TestPassword123!',
        name: 'Test User',
        schoolName: 'Test School',
        schoolSlug: `test-school-${Date.now()}`,
      })

      // Should show success or verification message
      await expect(
        page.locator('text=/הצלחה|success|אימות|verif/i')
      ).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('[01.2.1] Successful Login', () => {
    test('admin can login with valid credentials', async ({ page }) => {
      // Setup: Create test school and admin
      const school = await createSchool()
        .withName('Login Test School')
        .create()

      const admin = await createAdmin()
        .withEmail(generateEmail('login'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()

      await loginPage.login(admin.email, 'TestPassword123!')

      // Should redirect to dashboard
      await expect(page).toHaveURL(/\/admin/, { timeout: 10000 })
    })
  })

  test.describe('[01.2.2] Invalid Credentials', () => {
    test('login fails with wrong password', async ({ page }) => {
      const school = await createSchool().withName('Wrong Password Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('wrong-pwd'))
        .withPassword('CorrectPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()

      await loginPage.fillEmail(admin.email)
      await loginPage.fillPassword('WrongPassword123!')
      await loginPage.submit()

      // Should show error
      await loginPage.expectLoginError()
    })

    test('login fails with non-existent email', async ({ page }) => {
      const loginPage = new LoginPage(page)
      await loginPage.goto()

      await loginPage.fillEmail('nonexistent@test.com')
      await loginPage.fillPassword('SomePassword123!')
      await loginPage.submit()

      await loginPage.expectLoginError()
    })
  })

  test.describe('[01.4.1-4.4] Session Management', () => {
    test('session persists across page reloads', async ({ page }) => {
      const school = await createSchool().withName('Session Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('session'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await expect(page).toHaveURL(/\/admin/)

      // Reload page
      await page.reload()

      // Should still be authenticated
      await expect(page).toHaveURL(/\/admin/)
      await expect(page.locator('text=/התנתק|logout/i')).toBeVisible()
    })

    test('session cookie contains required fields', async ({ page }) => {
      const school = await createSchool().withName('Cookie Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('cookie'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Get cookies
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      expect(sessionCookie).toBeDefined()
      expect(sessionCookie?.httpOnly).toBe(true) // Security: HTTP-only
      expect(sessionCookie?.sameSite).toBe('Lax') // CSRF protection
    })
  })

  test.describe('[01.5.1] Logout', () => {
    test('user can logout successfully', async ({ page }) => {
      const school = await createSchool().withName('Logout Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('logout'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Login first
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Logout
      await page.click('text=/התנתק|logout/i')

      // Should redirect to login or homepage
      await expect(page).toHaveURL(/\/(login|$)/, { timeout: 5000 })

      // Try to access protected route
      await page.goto('/admin/events')

      // Should redirect to login
      await expect(page).toHaveURL(/\/admin\/login/)
    })
  })

  test.describe('[01.6.1-6.6] Role-Based Access Control', () => {
    test('SUPER_ADMIN can access super admin routes', async ({ page, request }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      // Try to access super admin route
      await page.goto('/admin/super/schools')

      // Should not redirect or show error
      await expect(page).not.toHaveURL(/\/login/)

      // Should see schools list or admin interface
      await expect(page.locator('body')).toContainText(/schools|בתי ספר/i)
    })

    test('ADMIN cannot access super admin routes', async ({ page }) => {
      const school = await createSchool().withName('RBAC Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('admin'))
        .withPassword('AdminPassword123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'AdminPassword123!')

      // Try to access super admin route
      await page.goto('/admin/super/schools')

      // Should show 403 or redirect
      await expect(page.locator('text=/403|לא מורשה|forbidden/i')).toBeVisible()
    })

    test('VIEWER cannot create events', async ({ page, request }) => {
      const school = await createSchool().withName('Viewer Test').create()
      const viewer = await createAdmin()
        .withEmail(generateEmail('viewer'))
        .withPassword('ViewerPassword123!')
        .withRole('VIEWER')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(viewer.email, 'ViewerPassword123!')

      // Navigate to events
      await page.goto('/admin/events')

      // Create event button should be hidden or disabled
      const createButton = page.locator('text=/צור אירוע|create event/i')
      const isVisible = await createButton.isVisible().catch(() => false)

      if (isVisible) {
        // If button visible, clicking should show error
        await createButton.click()
        await expect(page.locator('text=/לא מורשה|forbidden/i')).toBeVisible()
      } else {
        // Button should not be visible
        expect(isVisible).toBe(false)
      }
    })
  })

  test.describe('[01.7.3] Middleware Protection', () => {
    test('unauthenticated user cannot access /admin routes', async ({ page }) => {
      await page.goto('/admin/events')

      // Should redirect to login
      await expect(page).toHaveURL(/\/admin\/login/, { timeout: 5000 })
    })

    test('unauthenticated API requests return 401', async ({ request }) => {
      const response = await request.get('/api/events')

      expect(response.status()).toBe(401)
    })
  })

  test.describe('[01.9.1-9.3] Security - XSS & CSRF', () => {
    test('session cookie is HTTP-only (XSS prevention)', async ({ page }) => {
      const school = await createSchool().withName('XSS Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('xss'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Try to access cookie via JavaScript
      const canAccessCookie = await page.evaluate(() => {
        return document.cookie.includes('admin_session')
      })

      // HTTP-only cookies should NOT be accessible via JavaScript
      expect(canAccessCookie).toBe(false)
    })

    test('session cookie has SameSite attribute (CSRF prevention)', async ({ page }) => {
      const school = await createSchool().withName('CSRF Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('csrf'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      expect(sessionCookie?.sameSite).toBeTruthy()
      expect(['Lax', 'Strict']).toContain(sessionCookie?.sameSite)
    })
  })
})
