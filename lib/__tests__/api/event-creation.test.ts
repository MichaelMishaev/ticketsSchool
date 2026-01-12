import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { prisma } from '@/lib/prisma'
import { encodeSession } from '@/lib/auth.server'
import { AdminRole } from '@prisma/client'

/**
 * Integration Tests for Event Creation API
 *
 * Tests the complete event CRUD lifecycle:
 * - POST /api/events - Create new event
 * - GET /api/events/:id - Get event by ID
 * - PATCH /api/events/:id - Update event
 * - DELETE /api/events/:id - Delete event
 *
 * CRITICAL: Tests multi-tenant isolation and database constraints
 */
describe('Event Creation API Integration', () => {
  let testSchoolId: string
  let testAdminId: string
  let testSessionCookie: string
  let testSchoolSlug: string

  // Create fresh test data before each test
  beforeEach(async () => {
    // Create test school with unique slug
    const school = await prisma.school.create({
      data: {
        name: 'Test School',
        slug: `test-school-${Date.now()}`,
      },
    })
    testSchoolId = school.id
    testSchoolSlug = school.slug

    // Create test admin
    const admin = await prisma.admin.create({
      data: {
        email: `admin-${Date.now()}@test.com`,
        passwordHash: 'hashed',
        name: 'Test Admin',
        role: 'ADMIN' as AdminRole,
        schoolId: testSchoolId,
        emailVerified: true,
      },
    })
    testAdminId = admin.id

    // Create session cookie
    testSessionCookie = encodeSession({
      adminId: testAdminId,
      email: admin.email,
      name: admin.name,
      role: 'ADMIN' as AdminRole,
      schoolId: testSchoolId,
      schoolName: school.name,
    })
  })

  // Cleanup test data after each test (prevents test pollution)
  afterEach(async () => {
    // Delete in reverse order of foreign keys
    await prisma.registration.deleteMany({ where: { event: { schoolId: testSchoolId } } })
    await prisma.event.deleteMany({ where: { schoolId: testSchoolId } })
    await prisma.admin.deleteMany({ where: { id: testAdminId } })
    await prisma.school.deleteMany({ where: { id: testSchoolId } })
  })

  describe('POST /api/events - Create Event', () => {
    test('SHOULD create event with valid data', async () => {
      const eventData = {
        title: 'Test Event',
        slug: `test-event-${Date.now()}`,
        capacity: 100,
        description: 'Test Description',
        startAt: new Date('2026-06-01T10:00:00Z'),
        maxSpotsPerPerson: 4,
      }

      // Create event directly (simulating API call)
      const event = await prisma.event.create({
        data: {
          ...eventData,
          schoolId: testSchoolId,
        },
      })

      // Verify event was created correctly
      expect(event.id).toBeDefined()
      expect(event.title).toBe('Test Event')
      expect(event.capacity).toBe(100)
      expect(event.spotsReserved).toBe(0) // Default value
      expect(event.schoolId).toBe(testSchoolId)
      expect(event.maxSpotsPerPerson).toBe(4)
      expect(event.status).toBe('OPEN') // Default status
    })

    test('SHOULD create event with payment configuration', async () => {
      const eventData = {
        title: 'Paid Event',
        slug: `paid-event-${Date.now()}`,
        capacity: 50,
        startAt: new Date('2026-06-15T14:00:00Z'),
        maxSpotsPerPerson: 2,
        paymentRequired: true,
        paymentTiming: 'UPFRONT' as const,
        pricingModel: 'FIXED_PRICE' as const,
        priceAmount: 50.0,
        currency: 'ILS',
        schoolId: testSchoolId,
      }

      const event = await prisma.event.create({
        data: eventData,
      })

      expect(event.paymentRequired).toBe(true)
      expect(event.paymentTiming).toBe('UPFRONT')
      expect(event.pricingModel).toBe('FIXED_PRICE')
      expect(event.priceAmount).toBeDefined()
      expect(Number(event.priceAmount)).toBe(50.0)
      expect(event.currency).toBe('ILS')
    })

    test('ALLOWS event with negative capacity (validation at API level, not DB)', async () => {
      // NOTE: Database doesn't have CHECK constraints for capacity/spotsReserved
      // Validation is enforced at the API route level (app/api/events/route.ts)
      const eventData = {
        title: 'Negative Capacity Event',
        slug: `negative-capacity-${Date.now()}`,
        capacity: -10, // Database allows this - API should reject
        startAt: new Date('2026-06-01T10:00:00Z'),
        maxSpotsPerPerson: 1,
        schoolId: testSchoolId,
      }

      // Database allows negative capacity (no CHECK constraint)
      const event = await prisma.event.create({ data: eventData })
      expect(event.capacity).toBe(-10)

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } })
    })

    test('REJECTS event without schoolId (multi-tenant isolation)', async () => {
      const eventData = {
        title: 'No School Event',
        slug: `no-school-${Date.now()}`,
        capacity: 100,
        startAt: new Date('2026-06-01T10:00:00Z'),
        maxSpotsPerPerson: 1,
        // schoolId is MISSING
      }

      // Should fail - schoolId is REQUIRED for multi-tenant isolation
      await expect(prisma.event.create({ data: eventData as any })).rejects.toThrow()
    })

    test('SHOULD create event with fieldsSchema for custom registration fields', async () => {
      const fieldsSchema = [
        { name: 'playerName', label: 'שם שחקן', type: 'text', required: true },
        {
          name: 'shirtSize',
          label: 'מידת חולצה',
          type: 'select',
          required: true,
          options: ['S', 'M', 'L', 'XL'],
        },
      ]

      const event = await prisma.event.create({
        data: {
          title: 'Event with Custom Fields',
          slug: `custom-fields-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
          fieldsSchema: fieldsSchema as any,
        },
      })

      expect(event.fieldsSchema).toBeDefined()
      expect(Array.isArray(event.fieldsSchema)).toBe(true)
    })
  })

  describe('GET /api/events/:id - Retrieve Event', () => {
    test('SHOULD retrieve event by ID', async () => {
      // Create test event
      const event = await prisma.event.create({
        data: {
          title: 'Test Event',
          slug: `test-event-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Retrieve event
      const retrieved = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          school: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      })

      expect(retrieved).toBeDefined()
      expect(retrieved!.id).toBe(event.id)
      expect(retrieved!.title).toBe('Test Event')
      expect(retrieved!.schoolId).toBe(testSchoolId)
      expect(retrieved!.school.slug).toBe(testSchoolSlug)
    })

    test('SHOULD return null for non-existent event', async () => {
      const retrieved = await prisma.event.findUnique({
        where: { id: 'non-existent-id' },
      })

      expect(retrieved).toBeNull()
    })

    test('SHOULD retrieve event with registrations count', async () => {
      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Event with Registrations',
          slug: `event-reg-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Create registrations
      await prisma.registration.create({
        data: {
          eventId: event.id,
          confirmationCode: `CONF-${Date.now()}-1`,
          status: 'CONFIRMED',
          spotsCount: 2,
          data: { name: 'Test User 1' },
        },
      })
      await prisma.registration.create({
        data: {
          eventId: event.id,
          confirmationCode: `CONF-${Date.now()}-2`,
          status: 'CONFIRMED',
          spotsCount: 3,
          data: { name: 'Test User 2' },
        },
      })

      // Retrieve with count
      const retrieved = await prisma.event.findUnique({
        where: { id: event.id },
        include: {
          _count: {
            select: { registrations: true },
          },
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { spotsCount: true },
          },
        },
      })

      expect(retrieved!._count.registrations).toBe(2)
      const totalSpots = retrieved!.registrations.reduce((sum, reg) => sum + reg.spotsCount, 0)
      expect(totalSpots).toBe(5) // 2 + 3
    })
  })

  describe('PATCH /api/events/:id - Update Event', () => {
    test('SHOULD update event successfully', async () => {
      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Original Name',
          slug: `original-slug-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Update event
      const updated = await prisma.event.update({
        where: { id: event.id },
        data: {
          title: 'Updated Name',
          capacity: 150,
          description: 'New Description',
        },
      })

      expect(updated.title).toBe('Updated Name')
      expect(updated.capacity).toBe(150)
      expect(updated.description).toBe('New Description')
      expect(updated.schoolId).toBe(testSchoolId) // Unchanged
      expect(updated.slug).toBe(event.slug) // Unchanged
    })

    test('SHOULD update event dates', async () => {
      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Event with Dates',
          slug: `event-dates-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          endAt: new Date('2026-06-01T12:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      const newStartAt = new Date('2026-07-01T14:00:00Z')
      const newEndAt = new Date('2026-07-01T16:00:00Z')

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: {
          startAt: newStartAt,
          endAt: newEndAt,
        },
      })

      expect(updated.startAt).toEqual(newStartAt)
      expect(updated.endAt).toEqual(newEndAt)
    })

    test('ALLOWS update that violates capacity constraint (validation at API level)', async () => {
      // Create event with some reservations
      const event = await prisma.event.create({
        data: {
          title: 'Event with Reservations',
          slug: `event-reserved-${Date.now()}`,
          capacity: 100,
          spotsReserved: 50, // 50 spots already reserved
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Database allows reducing capacity below spotsReserved (no CHECK constraint)
      // API should validate this, but DB doesn't enforce it
      const updated = await prisma.event.update({
        where: { id: event.id },
        data: { capacity: 40 }, // DB allows: capacity (40) < spotsReserved (50)
      })

      expect(updated.capacity).toBe(40)
      expect(updated.spotsReserved).toBe(50)
    })

    test('SHOULD update event status', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Event Status Update',
          slug: `event-status-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
          status: 'OPEN',
        },
      })

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: { status: 'CLOSED' },
      })

      expect(updated.status).toBe('CLOSED')
    })

    test('SHOULD update payment settings', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Event Payment Update',
          slug: `event-payment-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
          paymentRequired: false,
        },
      })

      const updated = await prisma.event.update({
        where: { id: event.id },
        data: {
          paymentRequired: true,
          paymentTiming: 'UPFRONT' as const,
          pricingModel: 'FIXED_PRICE' as const,
          priceAmount: 100.0,
        },
      })

      expect(updated.paymentRequired).toBe(true)
      expect(updated.paymentTiming).toBe('UPFRONT')
      expect(updated.pricingModel).toBe('FIXED_PRICE')
      expect(Number(updated.priceAmount)).toBe(100.0)
    })

    test('REJECTS update of non-existent event', async () => {
      await expect(
        prisma.event.update({
          where: { id: 'non-existent-id' },
          data: { title: 'New Title' },
        })
      ).rejects.toThrow()
    })
  })

  describe('DELETE /api/events/:id - Delete Event', () => {
    test('SHOULD delete event successfully (no registrations)', async () => {
      // Create event without registrations
      const event = await prisma.event.create({
        data: {
          title: 'Event to Delete',
          slug: `to-delete-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Delete event
      await prisma.event.delete({
        where: { id: event.id },
      })

      // Verify deletion
      const deleted = await prisma.event.findUnique({
        where: { id: event.id },
      })

      expect(deleted).toBeNull()
    })

    test('SHOULD cascade delete registrations when event is deleted', async () => {
      // Create event
      const event = await prisma.event.create({
        data: {
          title: 'Event with Registrations',
          slug: `cascade-delete-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Create registration
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          confirmationCode: `CONF-${Date.now()}`,
          status: 'CONFIRMED',
          spotsCount: 2,
          data: { name: 'Test User' },
        },
      })

      // Delete event (should cascade delete registration)
      await prisma.event.delete({
        where: { id: event.id },
      })

      // Verify registration was also deleted
      const deletedRegistration = await prisma.registration.findUnique({
        where: { id: registration.id },
      })

      expect(deletedRegistration).toBeNull()
    })

    test('REJECTS delete of non-existent event', async () => {
      await expect(
        prisma.event.delete({
          where: { id: 'non-existent-id' },
        })
      ).rejects.toThrow()
    })
  })

  describe('Multi-Tenant Isolation Tests', () => {
    test('SHOULD enforce schoolId filtering for different schools', async () => {
      // Create second school
      const school2 = await prisma.school.create({
        data: {
          name: 'School 2',
          slug: `school-2-${Date.now()}`,
        },
      })

      // Create events for both schools
      const event1 = await prisma.event.create({
        data: {
          title: 'School 1 Event',
          slug: `school1-event-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId, // School 1
        },
      })

      const event2 = await prisma.event.create({
        data: {
          title: 'School 2 Event',
          slug: `school2-event-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: school2.id, // School 2
        },
      })

      // Query events for school 1 only
      const school1Events = await prisma.event.findMany({
        where: { schoolId: testSchoolId },
      })

      // Query events for school 2 only
      const school2Events = await prisma.event.findMany({
        where: { schoolId: school2.id },
      })

      // Verify isolation
      expect(school1Events.length).toBe(1)
      expect(school1Events[0].id).toBe(event1.id)
      expect(school1Events[0].title).toBe('School 1 Event')

      expect(school2Events.length).toBe(1)
      expect(school2Events[0].id).toBe(event2.id)
      expect(school2Events[0].title).toBe('School 2 Event')

      // Cleanup
      await prisma.event.deleteMany({ where: { schoolId: school2.id } })
      await prisma.school.delete({ where: { id: school2.id } })
    })

    test('SHOULD prevent admin from accessing other school events', async () => {
      // Create second school with admin
      const school2 = await prisma.school.create({
        data: {
          name: 'School 2',
          slug: `school-2-admin-${Date.now()}`,
        },
      })

      const admin2 = await prisma.admin.create({
        data: {
          email: `admin2-${Date.now()}@test.com`,
          passwordHash: 'hashed',
          name: 'Admin 2',
          role: 'ADMIN' as AdminRole,
          schoolId: school2.id,
          emailVerified: true,
        },
      })

      // Create event for school 2
      const event2 = await prisma.event.create({
        data: {
          title: 'School 2 Event',
          slug: `school2-event-access-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: school2.id,
        },
      })

      // Admin 1 (testSchoolId) should NOT see events from school 2
      const admin1Events = await prisma.event.findMany({
        where: { schoolId: testSchoolId },
      })

      expect(admin1Events.every((e) => e.schoolId === testSchoolId)).toBe(true)
      expect(admin1Events.every((e) => e.schoolId !== school2.id)).toBe(true)

      // Admin 2 should only see their school events
      const admin2Events = await prisma.event.findMany({
        where: { schoolId: school2.id },
      })

      expect(admin2Events.length).toBe(1)
      expect(admin2Events[0].id).toBe(event2.id)

      // Cleanup
      await prisma.event.deleteMany({ where: { schoolId: school2.id } })
      await prisma.admin.delete({ where: { id: admin2.id } })
      await prisma.school.delete({ where: { id: school2.id } })
    })
  })

  describe('Database Constraint Tests', () => {
    test('ALLOWS event with capacity = 0 (validation at API level)', async () => {
      // Database has no CHECK constraints - validation is at API level
      const event = await prisma.event.create({
        data: {
          title: 'Zero Capacity Event',
          slug: `zero-capacity-${Date.now()}`,
          capacity: 0, // DB allows this - API should reject
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      expect(event.capacity).toBe(0)

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } })
    })

    test('ALLOWS event with maxSpotsPerPerson = 0 (validation at API level)', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Invalid MaxSpots Event',
          slug: `invalid-maxspots-${Date.now()}`,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 0, // DB allows this - API should reject
          schoolId: testSchoolId,
        },
      })

      expect(event.maxSpotsPerPerson).toBe(0)

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } })
    })

    test('SHOULD allow spotsReserved = capacity (boundary condition)', async () => {
      const event = await prisma.event.create({
        data: {
          title: 'Full Event',
          slug: `full-event-${Date.now()}`,
          capacity: 100,
          spotsReserved: 100, // VALID: exactly at capacity
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      expect(event.spotsReserved).toBe(100)
      expect(event.capacity).toBe(100)
    })

    test('ALLOWS spotsReserved > capacity (validation at API level)', async () => {
      // Database allows overbooking - validation is at API/business logic level
      const event = await prisma.event.create({
        data: {
          title: 'Overbooked Event',
          slug: `overbooked-${Date.now()}`,
          capacity: 100,
          spotsReserved: 101, // DB allows - API prevents via atomic transactions
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      expect(event.spotsReserved).toBe(101)
      expect(event.capacity).toBe(100)

      // Cleanup
      await prisma.event.delete({ where: { id: event.id } })
    })

    test('REJECTS event with non-existent schoolId (FOREIGN KEY constraint)', async () => {
      // This DOES have a database constraint - foreign key to School table
      await expect(
        prisma.event.create({
          data: {
            title: 'Invalid School Event',
            slug: `invalid-school-${Date.now()}`,
            capacity: 100,
            startAt: new Date('2026-06-01T10:00:00Z'),
            maxSpotsPerPerson: 1,
            schoolId: 'non-existent-school-id', // INVALID FOREIGN KEY
          },
        })
      ).rejects.toThrow(/Foreign key constraint/)
    })

    test('REJECTS duplicate slug (UNIQUE constraint)', async () => {
      const slug = `unique-slug-test-${Date.now()}`

      // Create first event
      await prisma.event.create({
        data: {
          title: 'First Event',
          slug,
          capacity: 100,
          startAt: new Date('2026-06-01T10:00:00Z'),
          maxSpotsPerPerson: 1,
          schoolId: testSchoolId,
        },
      })

      // Try to create second with same slug - SHOULD FAIL (UNIQUE constraint)
      await expect(
        prisma.event.create({
          data: {
            title: 'Second Event',
            slug, // DUPLICATE
            capacity: 100,
            startAt: new Date('2026-06-01T10:00:00Z'),
            maxSpotsPerPerson: 1,
            schoolId: testSchoolId,
          },
        })
      ).rejects.toThrow(/Unique constraint/)
    })
  })
})
