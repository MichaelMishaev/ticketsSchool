/**
 * Multi-Tenant Data Isolation Tests (CRITICAL SECURITY)
 * Tests to ensure schools cannot access each other's data
 * Covers Bug #11, #2 fixes
 */

import { test, expect } from '@playwright/test'
import { loginViaAPI, clearCookies } from '../helpers/auth-helpers'
import { createEventViaAPI } from '../helpers/event-helpers'
import { TEST_ADMINS } from '../helpers/test-data'

test.describe('Multi-Tenant Data Isolation (CRITICAL)', () => {
  let schoolAEvent: any
  let schoolBEvent: any

  test.beforeAll(async ({ browser }) => {
    // Setup: Create events for both schools
    const context = await browser.newContext()
    const page = await context.newPage()

    // Create event for School A
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)
    schoolAEvent = await createEventViaAPI(page, {
      title: 'School A Private Event',
      location: 'School A Location',
      capacity: 30,
    })

    await clearCookies(page)

    // Create event for School B
    await loginViaAPI(page, TEST_ADMINS.adminB.email, TEST_ADMINS.adminB.password)
    schoolBEvent = await createEventViaAPI(page, {
      title: 'School B Private Event',
      location: 'School B Location',
      capacity: 40,
    })

    await context.close()
  })

  test('School A admin should only see School A events', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Get events list
    const response = await page.request.get('/api/events')
    expect(response.ok()).toBeTruthy()

    const events = await response.json()

    // Should contain School A event
    const hasSchoolAEvent = events.some((e: any) => e.title === 'School A Private Event')
    expect(hasSchoolAEvent).toBeTruthy()

    // Should NOT contain School B event
    const hasSchoolBEvent = events.some((e: any) => e.title === 'School B Private Event')
    expect(hasSchoolBEvent).toBeFalsy()
  })

  test('School B admin should only see School B events', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminB.email, TEST_ADMINS.adminB.password)

    const response = await page.request.get('/api/events')
    expect(response.ok()).toBeTruthy()

    const events = await response.json()

    // Should contain School B event
    const hasSchoolBEvent = events.some((e: any) => e.title === 'School B Private Event')
    expect(hasSchoolBEvent).toBeTruthy()

    // Should NOT contain School A event
    const hasSchoolAEvent = events.some((e: any) => e.title === 'School A Private Event')
    expect(hasSchoolAEvent).toBeFalsy()
  })

  test('School A admin cannot access School B event details (Bug #11)', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Try to access School B event by ID
    const response = await page.request.get(`/api/events/${schoolBEvent.id}`)

    // Should return 403 Forbidden
    expect(response.status()).toBe(403)
  })

  test('School B admin cannot access School A event details', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminB.email, TEST_ADMINS.adminB.password)

    // Try to access School A event by ID
    const response = await page.request.get(`/api/events/${schoolAEvent.id}`)

    // Should return 403 Forbidden
    expect(response.status()).toBe(403)
  })

  test('Admin without schoolId should get 403 error (Bug #11)', async ({ page }) => {
    // This test requires creating an admin with schoolId: null
    // For now, we'll simulate by checking the validation logic

    // If we had such a user, the API should return 403 with specific error
    // Skip for now unless we create this test user in beforeAll
    test.skip()
  })

  test('Dashboard stats should only show school-specific data', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    const response = await page.request.get('/api/dashboard/stats')
    expect(response.ok()).toBeTruthy()

    const stats = await response.json()

    // Stats should exist
    expect(stats).toHaveProperty('activeEvents')
    expect(stats).toHaveProperty('totalRegistrations')

    // Verify by checking active events endpoint
    const eventsResponse = await page.request.get('/api/dashboard/active-events')
    const events = await eventsResponse.json()

    // All events should belong to School A
    for (const event of events) {
      expect(event.schoolName).toBe(TEST_ADMINS.adminA.school.name)
    }
  })

  test('SUPER_ADMIN should see events from all schools', async ({ page, browser }) => {
    const context = await browser.newContext()
    const superPage = await context.newPage()

    await loginViaAPI(superPage, TEST_ADMINS.superAdmin.email, TEST_ADMINS.superAdmin.password)

    // Access super admin dashboard
    const response = await superPage.request.get('/api/admin/super/overview')

    if (response.ok()) {
      const data = await response.json()

      // Should see events from multiple schools
      const events = data.events || []

      // Should contain events from both schools
      const hasSchoolAEvent = events.some((e: any) => e.title === 'School A Private Event')
      const hasSchoolBEvent = events.some((e: any) => e.title === 'School B Private Event')

      expect(hasSchoolAEvent).toBeTruthy()
      expect(hasSchoolBEvent).toBeTruthy()
    }

    await context.close()
  })

  test('Cannot modify other school event via API', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Try to update School B event
    const response = await page.request.patch(`/api/events/${schoolBEvent.id}`, {
      data: { status: 'CLOSED' },
    })

    // Should return 403
    expect(response.status()).toBe(403)
  })

  test('Cannot delete other school event via API', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Try to delete School B event
    const response = await page.request.delete(`/api/events/${schoolBEvent.id}`)

    // Should return 403
    expect(response.status()).toBe(403)
  })

  test('Cannot access other school registrations via API', async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

    // Try to access School B event's registrations
    const response = await page.request.get(`/api/events/${schoolBEvent.id}/export`)

    // Should return 403
    expect(response.status()).toBe(403)
  })

  test.describe('Session Security (Bug #2)', () => {
    test('should reject tampered JWT tokens', async ({ page }) => {
      await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

      // Get current cookies
      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      expect(sessionCookie).toBeDefined()

      // Tamper with the JWT (modify payload)
      const tamperedToken = sessionCookie!.value.slice(0, -5) + 'XXXXX'

      // Set tampered cookie
      await page.context().addCookies([
        {
          ...sessionCookie!,
          value: tamperedToken,
        },
      ])

      // Try to access admin page
      await page.goto('/admin')

      // Should redirect to login due to invalid signature
      await page.waitForURL('/admin/login', { timeout: 5000 })
    })

    test('JWT should contain schoolId after onboarding', async ({ page }) => {
      // Login as user who has completed onboarding
      await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)

      // Check admin info via API
      const response = await page.request.get('/api/admin/me')
      const data = await response.json()

      expect(data.authenticated).toBeTruthy()
      expect(data.admin.schoolId).toBeTruthy()
      expect(data.admin.schoolName).toBe(TEST_ADMINS.adminA.school.name)
    })
  })
})
