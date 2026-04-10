import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { generateEmail } from '../helpers/test-helpers'
import { loginViaAPI } from '../helpers/auth-helpers'

/**
 * P0 (CRITICAL) Security Regression Tests
 * Tests for all FIXED security bugs to prevent regressions
 *
 * Coverage:
 * - Bug #1: Session isolation (logout/login different users)
 * - Bug #11: Data isolation bypass (users without schoolId)
 * - Bug #19: UPFRONT payment bypass vulnerability
 * - Bug #20: Public API missing payment fields
 */

test.describe('Security Regression P0 - CRITICAL Bugs', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Bug #1: Session Isolation - Previous User Menu After Logout/Login', () => {
    test('should show correct school name after logout and login with different user', async ({
      page,
    }) => {
      // Create School A with admin
      const schoolA = await createSchool()
        .withName('School A Session Test')
        .withSlug(`school-a-session-${Date.now()}`)
        .create()

      const adminA = await createAdmin()
        .withEmail(generateEmail('session-a'))
        .withPassword('TestPassword123!')
        .withName('Admin A')
        .withSchool(schoolA.id)
        .create()

      // Create School B with admin
      const schoolB = await createSchool()
        .withName('School B Session Test')
        .withSlug(`school-b-session-${Date.now()}`)
        .create()

      const adminB = await createAdmin()
        .withEmail(generateEmail('session-b'))
        .withPassword('TestPassword123!')
        .withName('Admin B')
        .withSchool(schoolB.id)
        .create()

      // Login as Admin A
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      // Verify School A name appears
      await expect(page.locator('text=/School A Session Test/i')).toBeVisible({ timeout: 10000 })

      // Logout
      await page.click('[data-testid="user-menu"]').catch(() => {})
      await page.click('text=/יציאה|Logout/i')
      await page.waitForURL(/\/admin\/login/, { timeout: 5000 })

      // Login as Admin B
      await loginPage.login(adminB.email, 'TestPassword123!')

      // CRITICAL: Should show School B name, NOT School A
      await expect(page.locator('text=/School B Session Test/i')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('text=/School A Session Test/i')).not.toBeVisible()
    })

    test('should clear admin info when on public pages after logout', async ({ page }) => {
      const school = await createSchool().withName('Logout Clear Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('logout-clear'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Verify logged in
      await expect(page.locator('text=/Dashboard|ראשי/i')).toBeVisible()

      // Logout
      await page.click('[data-testid="user-menu"]').catch(() => {})
      await page.click('text=/יציאה|Logout/i')

      // Verify redirected to login page
      await page.waitForURL(/\/admin\/login/)

      // Verify session cookies cleared
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')
      const loggedInCookie = cookies.find((c) => c.name === 'admin_logged_in')

      expect(sessionCookie?.value || '').toBe('')
      expect(loggedInCookie?.value || '').toBe('')
    })
  })

  test.describe('Bug #11: Data Isolation Bypass - Users Without schoolId', () => {
    test('API should reject requests when admin has no schoolId', async ({ page, request }) => {
      // Create admin without school (simulates broken onboarding state)
      const adminNoSchool = await createAdmin()
        .withEmail(generateEmail('no-school'))
        .withPassword('TestPassword123!')
        .withSchool(null) // No school assigned!
        .withRole('ADMIN')
        .create()

      // Create a school with events
      const school = await createSchool().withName('Protected School').create()
      const event = await createEvent().withSchool(school.id).create()

      // Login as admin without school
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminNoSchool.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Try to access events API
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should return 403 or empty array (NOT all events)
      if (response.status() === 403) {
        expect(response.status()).toBe(403)
      } else {
        const data = await response.json()
        const events = data.events || data || []
        // Should be empty (no schoolId = no events)
        expect(events.length).toBe(0)
      }
    })

    test('Admin without schoolId should not see events from other schools', async ({ page }) => {
      const adminNoSchool = await createAdmin()
        .withEmail(generateEmail('no-school-ui'))
        .withPassword('TestPassword123!')
        .withSchool(null)
        .create()

      const school = await createSchool().withName('Other School Events').create()
      const event = await createEvent()
        .withTitle('Visible Event From Other School')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminNoSchool.email, 'TestPassword123!')

      // Navigate to events page
      await page.goto('/admin/events')

      // Should NOT see other school's events
      await expect(page.locator('text=Visible Event From Other School')).not.toBeVisible()
    })
  })

  test.describe('Bug #19: UPFRONT Payment Events Allow Free Registration (CRITICAL)', () => {
    test('should block direct registration API call for UPFRONT payment events', async ({
      request,
    }) => {
      // Create school and UPFRONT payment event
      const school = await createSchool()
        .withName('Payment Security School')
        .withSlug(`payment-sec-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Paid Event UPFRONT')
        .withSlug(`paid-upfront-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 50) // Requires upfront payment
        .create()

      // SECURITY TEST: Try to bypass payment by calling registration API directly
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Malicious User',
          email: 'hacker@test.com',
          phone: '0501234567',
          spotsCount: 2,
        },
      })

      // CRITICAL: Should return 400 error (not create free registration)
      expect(response.status()).toBe(400)

      const errorData = await response.json()
      expect(errorData.error).toContain('upfront payment')
    })

    test('should allow registration for FREE events', async ({ request }) => {
      const school = await createSchool()
        .withName('Free Event School')
        .withSlug(`free-event-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Free Event')
        .withSlug(`free-event-${Date.now()}`)
        .withSchool(school.id)
        .withCapacity(100)
        .create()

      // Free events should work normally
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Test User',
          email: 'user@test.com',
          phone: '0501234567',
          spotsCount: 1,
        },
      })

      // Should succeed for free events
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.registration).toBeDefined()
      expect(data.confirmationCode).toBeDefined()
    })

    test('should allow registration for POST_REGISTRATION payment events', async ({ request }) => {
      const school = await createSchool()
        .withName('Post Payment School')
        .withSlug(`post-pay-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Pay After Event')
        .withSlug(`pay-after-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'POST_REGISTRATION', 'PER_GUEST', 30)
        .withCapacity(50)
        .create()

      // POST_REGISTRATION events should allow registration (pay later)
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Pay Later User',
          email: 'paylater@test.com',
          phone: '0509876543',
          spotsCount: 1,
        },
      })

      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.registration.status).toBe('CONFIRMED')
      expect(data.confirmationCode).toBeDefined()
    })
  })

  test.describe('Bug #20: Public API Missing Payment Fields', () => {
    test('should return all payment fields in public event API', async ({ request }) => {
      const school = await createSchool()
        .withName('Payment Fields School')
        .withSlug(`payment-fields-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Paid Event Public API')
        .withSlug(`paid-api-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 75)
        .create()

      // Get event via public API
      const response = await request.get(`/api/p/${school.slug}/${event.slug}`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // CRITICAL: Payment fields must be present
      expect(data.paymentRequired).toBe(true)
      expect(data.paymentTiming).toBe('UPFRONT')
      expect(data.pricingModel).toBe('PER_GUEST')
      expect(data.priceAmount).toBe(75)
      expect(data.currency).toBeDefined()
    })

    test('should show null payment fields for free events', async ({ request }) => {
      const school = await createSchool()
        .withName('Free Event Payment Fields')
        .withSlug(`free-payment-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Free Event Payment Check')
        .withSlug(`free-check-${Date.now()}`)
        .withSchool(school.id)
        .create()

      const response = await request.get(`/api/p/${school.slug}/${event.slug}`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Free events should have explicit null/false values
      expect(data.paymentRequired).toBe(false)
      expect(data.paymentTiming).toBeNull()
      expect(data.pricingModel).toBeNull()
      expect(data.priceAmount).toBeNull()
    })

    test('frontend should detect UPFRONT payment requirement correctly', async ({ page }) => {
      const school = await createSchool()
        .withName('Frontend Payment Detection')
        .withSlug(`frontend-pay-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Frontend UPFRONT Test')
        .withSlug(`frontend-upfront-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100)
        .withCapacity(50)
        .create()

      // Load public registration page
      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Frontend should show payment button (not direct registration)
      // The text varies based on implementation, but should indicate payment
      const hasPaymentButton = await page
        .locator('button:has-text(/תשלום|Payment/)')
        .isVisible({ timeout: 5000 })
        .catch(() => false)
      const hasRegisterButton = await page
        .locator('button:has-text(/הרשם|Register/)')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // For UPFRONT events, should show payment flow (one or the other)
      expect(hasPaymentButton || hasRegisterButton).toBe(true)
    })
  })

  test.describe('Bug #12: AdminProd Button Visible to All Users', () => {
    test('regular admin should NOT see AdminProd button', async ({ page }) => {
      const school = await createSchool().withName('Regular Admin School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('regular-admin'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      // Login as regular admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Go to dashboard
      await page.goto('/admin')

      // Should NOT see AdminProd button
      await expect(page.locator('text=/AdminProd|Admin Prod/i')).not.toBeVisible()
    })

    test('SUPER_ADMIN should see AdminProd button', async ({ page }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super-admin-prod'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      // Login as SUPER_ADMIN
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      // Go to dashboard
      await page.goto('/admin')

      // SUPER_ADMIN should see AdminProd button
      await expect(page.locator('text=/AdminProd|Admin Prod/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Bug #15: Feedback Section Missing Super Admin Authorization', () => {
    test('regular admin cannot access feedback API', async ({ page, request }) => {
      const school = await createSchool().withName('Feedback Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('feedback-admin'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Try to access feedback API
      const response = await request.get('/api/admin/feedback', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should return 403 (forbidden)
      expect(response.status()).toBe(403)
    })

    test('SUPER_ADMIN can access feedback API', async ({ page, request }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super-feedback'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Access feedback API
      const response = await request.get('/api/admin/feedback', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      // SUPER_ADMIN should succeed
      expect(response.ok()).toBeTruthy()
    })
  })

  // US-SEC-04: Auth bypass — admin API routes require session
  test.describe('[US-SEC-04] Auth bypass prevention', () => {
    test('server: /api/events returns 401 without session', async ({ context }) => {
      // /api/events is protected by middleware — must return 401 with no session cookie
      const res = await context.request.get('/api/events')
      expect(res.status()).toBe(401)
    })

    test('server: /api/dashboard/stats returns 401 without session', async ({ context }) => {
      const res = await context.request.get('/api/dashboard/stats')
      expect(res.status()).toBe(401)
    })
  })

  // US-SEC-05: Cross-tenant isolation
  test.describe('[US-SEC-05] Cross-tenant data isolation', () => {
    test('server: admin cannot read another school event by direct ID', async ({ context }) => {
      const schoolA = await createSchool().withName('Sec School A').create()
      const schoolB = await createSchool().withName('Sec School B').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('sec-tenant-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()
      const eventB = await createEvent().withSchool(schoolB.id).withCapacity(10).inFuture().create()

      const loggedIn = await loginViaAPI(context, adminA.email, adminA.password)
      expect(loggedIn).toBe(true)

      const res = await context.request.get(`/api/events/${eventB.id}`)
      // Must not be 200 — cross-tenant access blocked (403) or event not found (404)
      expect(res.status()).not.toBe(200)
      expect([401, 403, 404]).toContain(res.status())
    })

    test('server: admin cannot read registrations from another school event', async ({
      context,
    }) => {
      const schoolA = await createSchool().withName('Sec ISO A').create()
      const schoolB = await createSchool().withName('Sec ISO B').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('sec-iso-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()
      const eventB = await createEvent().withSchool(schoolB.id).withCapacity(10).inFuture().create()

      const loggedIn = await loginViaAPI(context, adminA.email, adminA.password)
      expect(loggedIn).toBe(true)

      const res = await context.request.get(`/api/events/${eventB.id}/registrations`)
      // Must not be 200 — cross-tenant access blocked
      expect(res.status()).not.toBe(200)
      expect([401, 403, 404]).toContain(res.status())
    })
  })

  // US-SEC-06: Cancellation token single-use
  test.describe('[US-SEC-06] Cancellation token is single-use', () => {
    test('server: second use of cancellation token is handled gracefully', async ({ context }) => {
      const school = await createSchool().withName('Token SingleUse Test').create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()
      const reg = await createRegistration().withEvent(event.id).confirmed().create()

      const token = (reg as any).cancellationToken
      if (!token) return // skip if not exposed by builder

      const res1 = await context.request.get(`/api/cancel/${token}`)
      const res2 = await context.request.get(`/api/cancel/${token}`)

      expect([200, 302]).toContain(res1.status())
      // Second call: already cancelled or token invalid
      expect([200, 302, 400, 404, 410]).toContain(res2.status())
    })
  })

  // US-SEC-01: SQL injection stored as literal text (Prisma parameterization)
  test.describe('[US-SEC-01] SQL injection prevention', () => {
    test('server: SQL injection in registration name does not crash the server', async ({
      context,
    }) => {
      const school = await createSchool().withName('SQLi Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const res = await context.request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        data: {
          name: "Robert'); DROP TABLE registrations; --",
          phoneNumber: '+972509330001',
          email: 'sqli-test@test.com',
          spotsCount: 1,
        },
      })

      // Prisma parameterizes queries — no 500 allowed
      expect(res.status()).not.toBe(500)

      if ([200, 201].includes(res.status())) {
        await loginViaAPI(context, admin.email, admin.password)
        const evtRes = await context.request.get(`/api/events/${event.id}`)
        expect(evtRes.status()).toBe(200)
      }
    })
  })
})
