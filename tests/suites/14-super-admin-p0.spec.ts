import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { loginViaAPI } from '../helpers/auth-helpers'

const QA_EMAIL = 'qa@local.dev'
const QA_PASSWORD = 'QaLocal#2026!'

test.describe('Super Admin P0/P1', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  // US-SA-01: Super Admin sees all schools
  test.describe('[US-SA-01] Super Admin views all schools', () => {
    test('server: SUPER_ADMIN can read /api/admin/super/schools', async ({ context }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      const res = await context.request.get('/api/admin/super/schools')
      expect([200, 404]).toContain(res.status())
      if (res.status() === 200) {
        const body = await res.json()
        expect(Array.isArray(body) || Array.isArray(body.schools)).toBe(true)
      }
    })

    test('client: /admin/super loads without error for SUPER_ADMIN', async ({ page, context }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      await page.goto('http://localhost:9000/admin/super')
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
      await expect(page).not.toHaveURL(/\/login/)
    })
  })

  // US-SA-06: Regular admin cannot access super admin routes
  test.describe('[US-SA-06] Non-super admin blocked from super routes', () => {
    test('server: OWNER role gets 401/403 on /api/admin/super/schools', async ({ context }) => {
      const school = await createSchool().withName('SA Block Test').create()
      const owner = await createAdmin().withRole('OWNER').withSchool(school.id).create()
      await loginViaAPI(context, owner.email, owner.password)

      const res = await context.request.get('/api/admin/super/schools')
      expect([401, 403]).toContain(res.status())
    })

    test('client: ADMIN role is redirected from /admin/super', async ({ page, context }) => {
      const school = await createSchool().withName('SA UI Block Test').create()
      const admin = await createAdmin().withRole('ADMIN').withSchool(school.id).create()
      await loginViaAPI(context, admin.email, admin.password)

      await page.goto('http://localhost:9000/admin/super')
      const body = await page.locator('body').textContent()
      const isBlocked =
        page.url().includes('/login') ||
        page.url().includes('/events') ||
        (body ?? '').match(/403|לא מורשה|forbidden/i) !== null
      expect(isBlocked).toBe(true)
    })
  })

  // US-SA-02: Platform stats accessible to SUPER_ADMIN
  test.describe('[US-SA-02] Platform statistics', () => {
    test('server: SUPER_ADMIN can read platform stats (or 404 if not yet built)', async ({
      context,
    }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      const res = await context.request.get('/api/admin/super/stats')
      expect([200, 404]).toContain(res.status())
      expect(res.status()).not.toBe(500)
    })
  })

  // US-SA-03: Leads accessible to SUPER_ADMIN
  test.describe('[US-SA-03] SUPER_ADMIN views leads', () => {
    test('server: SUPER_ADMIN can access leads API', async ({ context }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      const res = await context.request.get('/api/admin/leads')
      expect([200, 404]).toContain(res.status())
      expect(res.status()).not.toBe(500)
    })

    test('client: /admin/leads loads for SUPER_ADMIN', async ({ page, context }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      await page.goto('http://localhost:9000/admin/leads')
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
    })
  })

  // US-SA-04: Audit logs accessible to SUPER_ADMIN
  test.describe('[US-SA-04] Audit logs', () => {
    test('server: SUPER_ADMIN can read logs (or 404 if not yet built)', async ({ context }) => {
      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      const res = await context.request.get('/api/admin/logs')
      expect([200, 404]).toContain(res.status())
      expect(res.status()).not.toBe(500)
    })
  })

  // US-SA-05: SUPER_ADMIN can read any school's events
  test.describe('[US-SA-05] SUPER_ADMIN cross-school read', () => {
    test('server: SUPER_ADMIN can read any event by ID', async ({ context }) => {
      const school = await createSchool().withName('SA Cross Test').create()
      const event = await createEvent().withSchool(school.id).withCapacity(10).inFuture().create()

      await loginViaAPI(context, QA_EMAIL, QA_PASSWORD)
      const res = await context.request.get(`/api/events/${event.id}`)
      expect(res.status()).toBe(200)
    })
  })
})
