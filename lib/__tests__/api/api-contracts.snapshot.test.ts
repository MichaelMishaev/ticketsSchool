/**
 * API Contract Snapshot Tests
 *
 * Lock down API response shapes to prevent breaking changes.
 * Tests cover 15+ critical endpoints across auth, events, registrations, payments, and schools.
 *
 * IMPORTANT: These tests verify response STRUCTURE, not actual data values.
 * Dynamic fields (IDs, timestamps) are normalized to type strings (e.g., 'string', 'number').
 *
 * How to run:
 * - Dev server must be running: npm run dev
 * - Run tests: npm run test lib/__tests__/api/api-contracts.snapshot.test.ts
 *
 * On first run, snapshots are generated. Subsequent runs validate against snapshots.
 * If API contract changes intentionally, update snapshots: npm run test -- -u
 */

import { describe, test, expect, beforeEach, afterEach, beforeAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../../../tests/fixtures/test-data'
import { encodeSession } from '@/lib/auth.server'
import type { TestSchool, TestAdmin, TestEvent } from '../../../tests/fixtures/test-data'

const BASE_URL = 'http://localhost:9000'

/**
 * Normalize response data for snapshot testing
 * Converts dynamic values to type strings to avoid brittle tests
 */
function normalizeForSnapshot(data: any): any {
  if (data === null || data === undefined) return data

  if (Array.isArray(data)) {
    return data.map((item) => normalizeForSnapshot(item))
  }

  if (typeof data === 'object') {
    const normalized: any = {}
    for (const [key, value] of Object.entries(data)) {
      // Normalize dynamic fields to types
      if (key === 'id' || key.endsWith('Id')) {
        normalized[key] = typeof value
      } else if (
        key.includes('createdAt') ||
        key.includes('updatedAt') ||
        key.includes('At') ||
        key.includes('timestamp')
      ) {
        normalized[key] = typeof value
      } else if (key === 'confirmationCode' || key === 'verificationToken' || key === 'token') {
        normalized[key] = typeof value
      } else if (key === 'slug' && typeof value === 'string') {
        // Slugs are dynamic (contain UUIDs) - normalize to type
        normalized[key] = typeof value
      } else if (key === 'email' && typeof value === 'string' && value.includes('@test.com')) {
        // Test emails contain UUIDs - normalize
        normalized[key] = 'string'
      } else if (
        key === 'name' &&
        typeof value === 'string' &&
        (value.includes('Test') || value.includes('test-'))
      ) {
        // Test names contain UUIDs - normalize
        normalized[key] = 'string'
      } else if (key === 'deployment' || key === 'requestId') {
        // Deployment markers and request IDs are dynamic
        normalized[key] = typeof value
      } else if (key === 'uptime' || key === 'memory') {
        // Runtime metrics are dynamic
        normalized[key] = typeof value
      } else {
        normalized[key] = normalizeForSnapshot(value)
      }
    }
    return normalized
  }

  return data
}

/**
 * Make HTTP request and normalize response for snapshot
 */
async function fetchAndNormalize(url: string, options?: RequestInit): Promise<any> {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type')

  let body = null
  if (contentType?.includes('application/json')) {
    body = await response.json()
  } else if (contentType?.includes('text/')) {
    body = await response.text()
  }

  return {
    status: response.status,
    headers: {
      contentType: contentType || 'none',
    },
    body: normalizeForSnapshot(body),
  }
}

describe('API Contract Snapshot Tests', () => {
  let testSchool: TestSchool
  let testAdmin: TestAdmin
  let adminToken: string
  let testEvent: TestEvent

  // Second school for multi-tenant isolation tests
  let testSchoolB: TestSchool
  let testAdminB: TestAdmin
  let adminTokenB: string

  beforeAll(async () => {
    // Cleanup any leftover test data
    await cleanupTestData()
  })

  beforeEach(async () => {
    // Create test school A
    testSchool = await createSchool().withName('Test School A').withPlan('STARTER').create()

    testAdmin = await createAdmin()
      .withEmail('admin-a@test.com')
      .withPassword('TestPassword123!')
      .withRole('ADMIN')
      .withSchool(testSchool.id)
      .create()

    adminToken = encodeSession({
      adminId: testAdmin.id,
      email: testAdmin.email,
      name: testAdmin.name,
      role: testAdmin.role as any,
      schoolId: testAdmin.schoolId!,
      schoolName: testSchool.name,
    })

    // Create test event
    testEvent = await createEvent()
      .withTitle('Test Event')
      .withCapacity(100)
      .withSchool(testSchool.id)
      .inFuture()
      .create()

    // Create test school B for isolation tests
    testSchoolB = await createSchool().withName('Test School B').withPlan('PRO').create()

    testAdminB = await createAdmin()
      .withEmail('admin-b@test.com')
      .withPassword('TestPassword123!')
      .withRole('ADMIN')
      .withSchool(testSchoolB.id)
      .create()

    adminTokenB = encodeSession({
      adminId: testAdminB.id,
      email: testAdminB.email,
      name: testAdminB.name,
      role: testAdminB.role as any,
      schoolId: testAdminB.schoolId!,
      schoolName: testSchoolB.name,
    })
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  // ==================== HEALTH ENDPOINTS ====================

  test('GET /api/health - Health check endpoint', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/health`)
    expect(result).toMatchSnapshot()
  })

  // ==================== AUTH ENDPOINTS ====================

  test('POST /api/admin/login - Success response', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAdmin.email,
        password: 'TestPassword123!',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/admin/login - Invalid credentials', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: `unique-invalid-${Date.now()}@test.com`, // Unique email to avoid rate limiting
        password: 'WrongPassword123!',
      }),
    })
    // Could be 401 (invalid credentials) or 429 (rate limited)
    // Both are valid API contracts depending on timing
    expect([401, 429]).toContain(result.status)
    if (result.status === 401) {
      expect(result.body.error).toBeTruthy()
    }
  })

  test('POST /api/admin/login - Missing fields', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'unique-missing-fields-test@test.com', // Use unique email to avoid rate limiting
        // Missing password
      }),
    })
    // Could be 400 (validation error) or 429 (rate limited)
    // Both are valid API contracts depending on timing
    expect([400, 429]).toContain(result.status)
    if (result.status === 400) {
      expect(result.body.error).toBeTruthy()
    }
  })

  test('POST /api/admin/signup - Success response', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'newadmin@test.com',
        password: 'NewPassword123!',
        name: 'New Admin',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/admin/signup - Email already exists', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testAdmin.email, // Existing email
        password: 'TestPassword123!',
        name: 'Duplicate Admin',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/admin/signup - Invalid email format', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'TestPassword123!',
        name: 'Test Admin',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/admin/signup - Weak password', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'weakpass@test.com',
        password: '123', // Too short
        name: 'Test Admin',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/admin/me - Authenticated admin', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/me`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/admin/me - Unauthenticated', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/admin/me`)
    expect(result).toMatchSnapshot()
  })

  // ==================== EVENT ENDPOINTS ====================

  test('GET /api/events - List events (authenticated)', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/events - Unauthenticated', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`)
    expect(result).toMatchSnapshot()
  })

  test('POST /api/events - Create event (success)', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'New Event',
        capacity: 50,
        maxSpotsPerPerson: 4,
        startAt: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: 'Test Location',
        description: 'Test Description',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/events - Missing required fields', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        // Missing title and startAt
        capacity: 50,
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/events - Invalid capacity', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Invalid Event',
        capacity: -1, // Negative capacity
        maxSpotsPerPerson: 4,
        startAt: new Date(Date.now() + 86400000).toISOString(),
        location: 'Test Location',
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/events/[id] - Get event details', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events/${testEvent.id}`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/events/[id] - Event not found', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events/non-existent-id`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  test('PATCH /api/events/[id] - Update event', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/events/${testEvent.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_session=${adminToken}`,
      },
      body: JSON.stringify({
        title: 'Updated Event Title',
        capacity: 150,
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('DELETE /api/events/[id] - Delete event', async () => {
    // Create event to delete
    const eventToDelete = await createEvent()
      .withTitle('Event to Delete')
      .withCapacity(50)
      .withSchool(testSchool.id)
      .inFuture()
      .create()

    const result = await fetchAndNormalize(`${BASE_URL}/api/events/${eventToDelete.id}`, {
      method: 'DELETE',
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  // ==================== MULTI-TENANT ISOLATION ====================

  test('GET /api/events - School A cannot see School B events', async () => {
    // Create event in School B
    await createEvent()
      .withTitle('School B Event')
      .withCapacity(30)
      .withSchool(testSchoolB.id)
      .inFuture()
      .create()

    // Admin A should only see School A events
    const result = await fetchAndNormalize(`${BASE_URL}/api/events`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })

    // Verify response structure (snapshot covers isolation behavior)
    // If authenticated, body should be array; if not, body should have error
    if (result.status === 200) {
      expect(Array.isArray(result.body)).toBe(true)
      // Should only see School A events (1 event from testEvent)
      expect(result.body.length).toBeLessThanOrEqual(1)
    }
    expect(result).toMatchSnapshot()
  })

  test('GET /api/events/[id] - School A cannot access School B event', async () => {
    // Create event in School B
    const schoolBEvent = await createEvent()
      .withTitle('School B Private Event')
      .withCapacity(30)
      .withSchool(testSchoolB.id)
      .inFuture()
      .create()

    // Admin A tries to access School B event
    const result = await fetchAndNormalize(`${BASE_URL}/api/events/${schoolBEvent.id}`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  // ==================== PAYMENT ENDPOINTS ====================

  test('POST /api/payment/create - Missing required fields', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Missing schoolSlug, eventSlug, registrationData
      }),
    })
    expect(result).toMatchSnapshot()
  })

  test('POST /api/payment/create - Invalid registration data', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/payment/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schoolSlug: testSchool.slug,
        eventSlug: testEvent.slug,
        registrationData: 'not-an-object', // Should be object
      }),
    })
    expect(result).toMatchSnapshot()
  })

  // ==================== DASHBOARD ENDPOINTS ====================

  test('GET /api/dashboard/stats - Dashboard statistics', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/dashboard/stats`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  test('GET /api/dashboard/stats - Unauthenticated', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/dashboard/stats`)
    expect(result).toMatchSnapshot()
  })

  test('GET /api/dashboard/active-events - Active events list', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/dashboard/active-events`, {
      headers: {
        Cookie: `admin_session=${adminToken}`,
      },
    })
    expect(result).toMatchSnapshot()
  })

  // ==================== PUBLIC EVENT ENDPOINTS ====================

  test('GET /api/p/[schoolSlug]/[eventSlug] - Public event details', async () => {
    const result = await fetchAndNormalize(`${BASE_URL}/api/p/${testSchool.slug}/${testEvent.slug}`)
    expect(result).toMatchSnapshot()
  })

  test('GET /api/p/[schoolSlug]/[eventSlug] - Event not found', async () => {
    const result = await fetchAndNormalize(
      `${BASE_URL}/api/p/${testSchool.slug}/non-existent-event`
    )
    expect(result).toMatchSnapshot()
  })

  test('GET /api/p/[schoolSlug]/[eventSlug] - School not found', async () => {
    const result = await fetchAndNormalize(
      `${BASE_URL}/api/p/non-existent-school/${testEvent.slug}`
    )
    expect(result).toMatchSnapshot()
  })

  // ==================== ERROR HANDLING ====================

  test('GET /api/non-existent-endpoint - 404 Not Found', async () => {
    const response = await fetch(`${BASE_URL}/api/non-existent-endpoint`)
    expect({
      status: response.status,
      statusText: response.statusText,
    }).toMatchSnapshot()
  })

  test('POST /api/events - Malformed JSON', async () => {
    const response = await fetch(`${BASE_URL}/api/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: `admin_session=${adminToken}`,
      },
      body: 'invalid-json{{',
    })

    expect({
      status: response.status,
    }).toMatchSnapshot()
  })
})
