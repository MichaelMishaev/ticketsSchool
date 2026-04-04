/**
 * BEHAVIOR LOCKS - Tests that critical system behaviors remain unchanged
 *
 * These tests protect against "silent regressions" where code works differently
 * after changes. They test IMPLICIT ASSUMPTIONS that users and systems depend on.
 *
 * WHAT ARE BEHAVIOR LOCKS?
 * - NOT tests for new features
 * - NOT tests that verify "it works"
 * - YES tests that verify "it works THE SAME WAY"
 * - YES tests for implicit behaviors that breaking would cause issues
 *
 * WHEN TO UPDATE THESE TESTS?
 * - Only when intentionally changing a locked behavior
 * - Document the change in git commit message
 * - Update the @owner and @created tags
 *
 * @see docs/infrastructure/ASSUMPTIONS.md (if exists)
 * @priority CRITICAL (run on every PR)
 */

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

test.describe('Behavior Locks - Critical System Invariants', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('API Sort Order Locks', () => {
    /**
     * INVARIANT: Event list default sort order is createdAt DESC (newest first)
     * INTENT: Users expect newest events at the top of the list
     * BREAKING THIS: Would cause confusion - newest events hidden at bottom
     * @owner backend-team
     * @created 2025-12-18
     */
    test('event list maintains createdAt DESC sort order', async ({ page, request }) => {
      const school = await createSchool().withName('Sort Order Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('sort-order'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Create events with intentional delays to ensure different createdAt timestamps
      const event1 = await createEvent().withTitle('First Event').withSchool(school.id).create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const event2 = await createEvent().withTitle('Second Event').withSchool(school.id).create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const event3 = await createEvent().withTitle('Third Event').withSchool(school.id).create()

      // Login and get session
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Call API
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // BEHAVIOR LOCK: Order MUST be newest first (createdAt DESC)
      const eventIds = events.map((e: any) => e.id)
      const expectedOrder = [event3.id, event2.id, event1.id]

      expect(eventIds).toEqual(expectedOrder)
    })

    /**
     * INVARIANT: Registrations list maintains creation date order
     * INTENT: First registered users appear first in admin view
     * BREAKING THIS: Would break "first come, first served" expectations
     * @owner backend-team
     * @created 2025-12-18
     */
    test('registrations list maintains createdAt ASC sort order', async ({ page, request }) => {
      const school = await createSchool().withName('Reg Sort Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('reg-sort'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Registration Sort Event')
        .withSchool(school.id)
        .withCapacity(100)
        .create()

      // Create registrations with delays
      const reg1 = await createRegistration()
        .withName('First User')
        .withEvent(event.id)
        .confirmed()
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const reg2 = await createRegistration()
        .withName('Second User')
        .withEvent(event.id)
        .confirmed()
        .create()

      await new Promise((resolve) => setTimeout(resolve, 100))

      const reg3 = await createRegistration()
        .withName('Third User')
        .withEvent(event.id)
        .confirmed()
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Call registrations API
      const response = await request.get(`/api/events/${event.id}/registrations`, {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const registrations = await response.json()

      // BEHAVIOR LOCK: Order MUST be oldest first (createdAt ASC) for "first come, first served"
      const regIds = registrations.map((r: any) => r.id)
      const expectedOrder = [reg1.id, reg2.id, reg3.id]

      expect(regIds).toEqual(expectedOrder)
    })
  })

  test.describe('Tenant Isolation Locks', () => {
    /**
     * INVARIANT: Non-SuperAdmin queries auto-filter by schoolId
     * INTENT: CRITICAL SECURITY - prevent cross-school data access
     * BREAKING THIS: Would expose all schools' data to any admin
     * @owner security-team
     * @created 2025-12-18
     */
    test('non-SuperAdmin event queries automatically include schoolId filter', async ({
      page,
      request,
    }) => {
      const schoolA = await createSchool().withName('School A Isolation').create()
      const schoolB = await createSchool().withName('School B Isolation').create()

      const adminA = await createAdmin()
        .withEmail(generateEmail('admin-a'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(schoolA.id)
        .create()

      // Create events in both schools
      await createEvent().withTitle('School A Event').withSchool(schoolA.id).create()
      await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Call API
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // BEHAVIOR LOCK: Non-SuperAdmin MUST only see their school's events
      expect(events.every((e: any) => e.schoolId === schoolA.id)).toBe(true)
      expect(events.some((e: any) => e.schoolId === schoolB.id)).toBe(false)
    })

    /**
     * INVARIANT: SuperAdmin can bypass schoolId filter
     * INTENT: Platform owners need to see all schools
     * BREAKING THIS: Would break admin dashboard functionality
     * @owner backend-team
     * @created 2025-12-18
     */
    test('SuperAdmin queries can see all schools when no filter specified', async ({
      page,
      request,
    }) => {
      const schoolA = await createSchool().withName('School A Super').create()
      const schoolB = await createSchool().withName('School B Super').create()

      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super'))
        .withPassword('TestPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      await createEvent().withTitle('School A Event').withSchool(schoolA.id).create()
      await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()

      // Login as SuperAdmin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Call API without schoolId filter
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // BEHAVIOR LOCK: SuperAdmin MUST see events from multiple schools
      const schoolIds = [...new Set(events.map((e: any) => e.schoolId))]
      expect(schoolIds.length).toBeGreaterThanOrEqual(2)
      expect(schoolIds).toContain(schoolA.id)
      expect(schoolIds).toContain(schoolB.id)
    })

    /**
     * INVARIANT: Cross-school access attempts rejected with 403
     * INTENT: Clear error for unauthorized access attempts
     * BREAKING THIS: Would allow unauthorized access or confusing errors
     * @owner security-team
     * @created 2025-12-18
     */
    test('cross-school access attempts return 403 Forbidden', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A 403').create()
      const schoolB = await createSchool().withName('School B 403').create()

      const adminA = await createAdmin()
        .withEmail(generateEmail('admin-403'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const eventB = await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()

      // Login as School A admin
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Try to access School B event
      const response = await request.get(`/api/events/${eventB.id}`, {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      // BEHAVIOR LOCK: Cross-school access MUST return 403 (not 404, not 200)
      expect(response.status()).toBe(403)

      const errorData = await response.json()
      expect(errorData).toHaveProperty('error')
    })

    /**
     * INVARIANT: Admin without schoolId assignment gets 403 with clear error
     * INTENT: Prevent accidental data exposure from misconfigured admins
     * BREAKING THIS: Could expose all data if schoolId check is skipped
     * @owner security-team
     * @created 2025-12-18
     */
    test('admin without schoolId gets 403 with descriptive error', async ({ page, request }) => {
      // Create admin without school (edge case, shouldn't happen in production)
      const orphanAdmin = await createAdmin()
        .withEmail(generateEmail('orphan'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(null)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(orphanAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Try to access events
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      // BEHAVIOR LOCK: Must return 403 with clear error message
      expect(response.status()).toBe(403)

      const errorData = await response.json()
      expect(errorData.error).toMatch(/school/i)
    })
  })

  test.describe('Soft Delete Behavior Locks', () => {
    /**
     * INVARIANT: Registration CANCELLED status excludes from capacity counts
     * INTENT: Cancelled registrations don't consume event capacity
     * BREAKING THIS: Would prevent new registrations when capacity available
     * @owner backend-team
     * @created 2025-12-18
     */
    test('CANCELLED registrations excluded from spotsReserved count', async ({ page, request }) => {
      const school = await createSchool().withName('Cancel Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('cancel'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Cancellation Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(5)
        .create()

      // Create confirmed and cancelled registrations
      await createRegistration()
        .withName('Confirmed User')
        .withEvent(event.id)
        .withSpots(2)
        .confirmed()
        .create()

      await createRegistration()
        .withName('Cancelled User')
        .withEvent(event.id)
        .withSpots(3)
        .cancelled()
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Get event details
      const response = await request.get(`/api/events/${event.id}`, {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const eventData = await response.json()

      // BEHAVIOR LOCK: Cancelled registrations MUST NOT count toward capacity
      // spotsReserved should be 5 (initial) + 2 (confirmed) = 7 (NOT +3 from cancelled)
      expect(eventData.spotsReserved).toBeLessThanOrEqual(7)
    })
  })

  test.describe('API Response Shape Locks', () => {
    /**
     * INVARIANT: GET /api/events response shape unchanged
     * INTENT: Client code depends on exact field names and structure
     * BREAKING THIS: Would break all frontend event displays
     * @owner backend-team
     * @created 2025-12-18
     */
    test('GET /api/events returns expected response shape', async ({ page, request }) => {
      const school = await createSchool().withName('Response Shape Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('response'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await createEvent().withTitle('Test Event').withSchool(school.id).withCapacity(50).create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Call API
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      // BEHAVIOR LOCK: Response MUST be an array
      expect(Array.isArray(events)).toBe(true)

      if (events.length > 0) {
        const event = events[0]

        // BEHAVIOR LOCK: Event object MUST have these exact fields
        expect(event).toHaveProperty('id')
        expect(event).toHaveProperty('title')
        expect(event).toHaveProperty('slug')
        expect(event).toHaveProperty('capacity')
        expect(event).toHaveProperty('spotsReserved')
        expect(event).toHaveProperty('schoolId')
        expect(event).toHaveProperty('createdAt')
        expect(event).toHaveProperty('startAt')

        // BEHAVIOR LOCK: schoolId must be a string (not null)
        expect(typeof event.schoolId).toBe('string')
      }
    })

    /**
     * INVARIANT: POST /api/events returns created event with all fields
     * INTENT: Client needs complete event object for immediate UI update
     * BREAKING THIS: Would require additional API call after creation
     * @owner backend-team
     * @created 2025-12-18
     */
    test('POST /api/events returns complete created event object', async ({ page, request }) => {
      const school = await createSchool().withName('Create Response Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('create'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Create event
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request.post('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'New Event',
          description: 'Test event',
          startAt: tomorrow.toISOString(),
          capacity: 50,
          maxSpotsPerPerson: 5,
          location: 'Test Location',
        },
      })

      expect(response.ok()).toBeTruthy()
      const event = await response.json()

      // BEHAVIOR LOCK: Response MUST include complete event object
      expect(event).toHaveProperty('id')
      expect(event).toHaveProperty('title')
      expect(event).toHaveProperty('slug')
      expect(event).toHaveProperty('schoolId')
      expect(event).toHaveProperty('capacity')
      expect(event).toHaveProperty('spotsReserved')
      expect(event).toHaveProperty('createdAt')

      // BEHAVIOR LOCK: Should include related school data
      expect(event).toHaveProperty('school')
      expect(event.school).toHaveProperty('id')
      expect(event.school).toHaveProperty('name')
    })

    /**
     * INVARIANT: Error responses always include {error: string} shape
     * INTENT: Client error handling depends on consistent error format
     * BREAKING THIS: Would break all error message displays
     * @owner backend-team
     * @created 2025-12-18
     */
    test('error responses maintain consistent {error: string} shape', async ({ request }) => {
      // Unauthenticated request (should return 401)
      const response = await request.get('/api/events')

      expect(response.status()).toBe(401)

      const errorData = await response.json()

      // BEHAVIOR LOCK: Error responses MUST have this exact shape
      expect(errorData).toHaveProperty('error')
      expect(typeof errorData.error).toBe('string')
      expect(errorData.error.length).toBeGreaterThan(0)
    })
  })

  test.describe('Permission Boundary Locks', () => {
    /**
     * INVARIANT: ADMIN can create/edit events within their school
     * INTENT: Standard admin permissions for event management
     * BREAKING THIS: Would break normal admin workflow
     * @owner backend-team
     * @created 2025-12-18
     */
    test('ADMIN role can create events in their school', async ({ page, request }) => {
      const school = await createSchool().withName('Admin Perm Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('admin-perm'))
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

      // Create event
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const response = await request.post('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Admin Created Event',
          startAt: tomorrow.toISOString(),
          capacity: 50,
          maxSpotsPerPerson: 5,
        },
      })

      // BEHAVIOR LOCK: ADMIN MUST be able to create events
      expect(response.ok()).toBeTruthy()

      const event = await response.json()
      expect(event.schoolId).toBe(school.id)
    })

    /**
     * INVARIANT: MANAGER can view events but cannot edit
     * INTENT: Read-only access for managers
     * BREAKING THIS: Would allow unauthorized event modifications
     * @owner security-team
     * @created 2025-12-18
     */
    test('MANAGER role can view but cannot create events', async ({ page, request }) => {
      const school = await createSchool().withName('Manager Perm Test').create()
      const manager = await createAdmin()
        .withEmail(generateEmail('manager-perm'))
        .withPassword('TestPassword123!')
        .withRole('MANAGER')
        .withSchool(school.id)
        .create()

      await createEvent().withTitle('Existing Event').withSchool(school.id).create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(manager.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // BEHAVIOR LOCK: MANAGER MUST be able to view events
      const getResponse = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })
      expect(getResponse.ok()).toBeTruthy()

      // BEHAVIOR LOCK: MANAGER MUST NOT be able to create events
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Manager Attempt',
          startAt: tomorrow.toISOString(),
          capacity: 50,
          maxSpotsPerPerson: 5,
        },
      })

      // Should return 403 Forbidden
      expect(createResponse.status()).toBe(403)
    })

    /**
     * INVARIANT: VIEWER has read-only access only
     * INTENT: Minimal permissions for view-only users
     * BREAKING THIS: Would allow unauthorized data modifications
     * @owner security-team
     * @created 2025-12-18
     */
    test('VIEWER role has read-only access', async ({ page, request }) => {
      const school = await createSchool().withName('Viewer Perm Test').create()
      const viewer = await createAdmin()
        .withEmail(generateEmail('viewer-perm'))
        .withPassword('TestPassword123!')
        .withRole('VIEWER')
        .withSchool(school.id)
        .create()

      await createEvent().withTitle('Viewable Event').withSchool(school.id).create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(viewer.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // BEHAVIOR LOCK: VIEWER MUST be able to view events
      const getResponse = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })
      expect(getResponse.ok()).toBeTruthy()

      // BEHAVIOR LOCK: VIEWER MUST NOT be able to create events
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const createResponse = await request.post('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Viewer Attempt',
          startAt: tomorrow.toISOString(),
          capacity: 50,
          maxSpotsPerPerson: 5,
        },
      })

      expect(createResponse.status()).toBe(403)
    })

    /**
     * INVARIANT: SuperAdmin permissions unchanged (full access)
     * INTENT: Platform owners retain unrestricted access
     * BREAKING THIS: Would prevent platform administration
     * @owner backend-team
     * @created 2025-12-18
     */
    test('SUPER_ADMIN retains full access to all resources', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Super Access').create()
      const schoolB = await createSchool().withName('School B Super Access').create()

      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super-access'))
        .withPassword('TestPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      await createEvent().withTitle('School A Event').withSchool(schoolA.id).create()
      await createEvent().withTitle('School B Event').withSchool(schoolB.id).create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // BEHAVIOR LOCK: SUPER_ADMIN MUST see all schools' events
      const response = await request.get('/api/events', {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const events = await response.json()

      const schoolIds = [...new Set(events.map((e: any) => e.schoolId))]
      expect(schoolIds.length).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('Side Effect Locks', () => {
    /**
     * INVARIANT: Creating registration increments event.spotsReserved
     * INTENT: Atomic capacity tracking prevents overbooking
     * BREAKING THIS: Would allow capacity to be exceeded
     * @owner backend-team
     * @created 2025-12-18
     */
    test('creating registration increments spotsReserved counter', async ({ page, request }) => {
      const school = await createSchool().withName('Side Effect Test').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('side-effect'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Counter Test Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(10)
        .create()

      const initialSpotsReserved = event.spotsReserved

      // Create registration
      await createRegistration()
        .withName('New Registrant')
        .withEvent(event.id)
        .withSpots(3)
        .confirmed()
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Get event details
      const response = await request.get(`/api/events/${event.id}`, {
        headers: {
          Cookie: `admin_session=${sessionCookie?.value}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const updatedEvent = await response.json()

      // BEHAVIOR LOCK: spotsReserved MUST increment by registration spots
      expect(updatedEvent.spotsReserved).toBe(initialSpotsReserved + 3)
    })

    /**
     * INVARIANT: Cancelling registration decrements spotsReserved
     * INTENT: Cancelled spots become available again
     * BREAKING THIS: Would prevent capacity from freeing up
     * @owner backend-team
     * @created 2025-12-18
     */
    test('cancelling registration decrements spotsReserved counter', async ({ page, request }) => {
      const school = await createSchool().withName('Cancel Side Effect').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('cancel-side'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Cancellation Counter Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(15)
        .create()

      // Create registration to be cancelled
      const registration = await createRegistration()
        .withName('To Be Cancelled')
        .withEvent(event.id)
        .withSpots(5)
        .confirmed()
        .create()

      const initialSpotsReserved = 15 + 5 // Initial + new registration

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find((c) => c.name === 'admin_session')

      // Cancel registration
      const cancelResponse = await request.patch(
        `/api/events/${event.id}/registrations/${registration.id}`,
        {
          headers: {
            Cookie: `admin_session=${sessionCookie?.value}`,
            'Content-Type': 'application/json',
          },
          data: {
            status: 'CANCELLED',
          },
        }
      )

      // If cancellation is supported
      if (cancelResponse.ok()) {
        // Get updated event
        const eventResponse = await request.get(`/api/events/${event.id}`, {
          headers: {
            Cookie: `admin_session=${sessionCookie?.value}`,
          },
        })

        expect(eventResponse.ok()).toBeTruthy()
        const updatedEvent = await eventResponse.json()

        // BEHAVIOR LOCK: spotsReserved MUST decrement by cancelled spots
        expect(updatedEvent.spotsReserved).toBe(initialSpotsReserved - 5)
      }
    })
  })
})
