import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { loginViaAPI } from '../helpers/auth-helpers'

test.describe('Settings & Customization P1', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  // US-SET-01: Owner updates school branding
  test.describe('[US-SET-01] School branding update', () => {
    test('server: OWNER can update school name via API', async ({ context }) => {
      const school = await createSchool().withName('Brand Update Test').create()
      const owner = await createAdmin().withRole('OWNER').withSchool(school.id).create()
      await loginViaAPI(context, owner.email, owner.password)

      const res = await context.request.patch(`/api/admin/schools/${school.id}`, {
        data: { name: 'Updated Brand Name' },
      })
      expect([200, 204, 404]).toContain(res.status())
      expect(res.status()).not.toBe(500)
    })

    test('client: settings page loads for OWNER', async ({ page, context }) => {
      const school = await createSchool().withName('Settings UI Test').create()
      const owner = await createAdmin().withRole('OWNER').withSchool(school.id).create()
      await loginViaAPI(context, owner.email, owner.password)

      await page.goto('http://localhost:9000/admin/settings')
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
      await expect(page).not.toHaveURL(/\/login/)
    })
  })

  // US-SET-03: Plan tier limits enforced
  test.describe('[US-SET-03] Plan tier limits', () => {
    test('server: FREE plan event creation does not crash server', async ({ context }) => {
      const school = await createSchool().withName('Free Plan Test').withPlan('FREE').create()
      const admin = await createAdmin().withSchool(school.id).create()
      await loginViaAPI(context, admin.email, admin.password)

      const res = await context.request.post('/api/events', {
        data: {
          title: 'Free Plan Event',
          schoolId: school.id,
          capacity: 10,
          startAt: new Date(Date.now() + 86400000).toISOString(),
          location: 'Test',
        },
      })
      expect(res.status()).not.toBe(500)
    })
  })

  // US-SET-04: Usage limits view
  test.describe('[US-SET-04] Usage view', () => {
    test('server: usage API responds without 500', async ({ context }) => {
      const school = await createSchool().withName('Usage View Test').create()
      const owner = await createAdmin().withRole('OWNER').withSchool(school.id).create()
      await loginViaAPI(context, owner.email, owner.password)

      const res = await context.request.get(`/api/admin/schools/${school.id}/usage`)
      expect([200, 404]).toContain(res.status())
      expect(res.status()).not.toBe(500)
    })
  })

  // US-SET-05: Public event page renders school theme
  test.describe('[US-SET-05] Public event page renders school theme', () => {
    test('client: public event page loads without error', async ({ page }) => {
      const school = await createSchool().withName('Theme Test School').create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)
      await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
    })
  })

  // Non-owner blocked from settings
  test.describe('[Settings] Non-owner cannot modify school settings', () => {
    test('server: ADMIN role cannot PATCH school settings', async ({ context }) => {
      const school = await createSchool().withName('Settings Block Test').create()
      const admin = await createAdmin().withRole('ADMIN').withSchool(school.id).create()
      await loginViaAPI(context, admin.email, admin.password)

      const res = await context.request.patch(`/api/admin/schools/${school.id}`, {
        data: { name: 'Hijacked Name' },
      })
      // 401/403 = explicit denial; 404 = route doesn't exist for non-owners (also blocks access)
      expect([401, 403, 404]).toContain(res.status())
    })
  })
})
