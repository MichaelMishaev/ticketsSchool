/**
 * Cancellation Tests
 *
 * Tests for the cancellation system including:
 * - Deadline enforcement (can't cancel within deadline)
 * - Token validation (expired, invalid)
 * - Table freeing (table-based events)
 * - Counter decrement (capacity-based events)
 * - Successful cancellation flow
 */

// Load environment variables BEFORE importing Prisma
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '@/lib/prisma'
import { cancelReservation } from '@/lib/cancellation'
import jwt from 'jsonwebtoken'

describe('Cancellation System', () => {
  let testSchool: any
  let futureEvent: any
  let soonEvent: any
  let tableBasedEvent: any
  let capacityBasedEvent: any

  beforeAll(async () => {
    // Create test school
    testSchool = await prisma.school.create({
      data: {
        name: 'Test School',
        slug: `test-school-${Date.now()}`,
      },
    })

    // Create event 48 hours in future (can cancel)
    futureEvent = await prisma.event.create({
      data: {
        title: 'Future Event',
        slug: `future-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        capacity: 100,
        eventType: 'CAPACITY_BASED',
        maxSpotsPerPerson: 5,
        allowCancellation: true,
        cancellationDeadlineHours: 2, // Can cancel up to 2 hours before
        requireCancellationReason: false,
      },
    })

    // Create event 1 hour in future (cannot cancel - within deadline)
    soonEvent = await prisma.event.create({
      data: {
        title: 'Soon Event',
        slug: `soon-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        capacity: 100,
        eventType: 'CAPACITY_BASED',
        maxSpotsPerPerson: 5,
        allowCancellation: true,
        cancellationDeadlineHours: 2, // Can cancel up to 2 hours before
        requireCancellationReason: true,
      },
    })

    // Create table-based event
    tableBasedEvent = await prisma.event.create({
      data: {
        title: 'Table Based Event',
        slug: `table-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 1,
        allowCancellation: true,
        cancellationDeadlineHours: 2,
      },
    })

    // Create table for table-based event
    await prisma.table.create({
      data: {
        eventId: tableBasedEvent.id,
        tableNumber: '1',
        capacity: 4,
        minOrder: 2,
        tableOrder: 1,
      },
    })

    // Create capacity-based event for counter test
    capacityBasedEvent = await prisma.event.create({
      data: {
        title: 'Capacity Event',
        slug: `capacity-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        capacity: 100,
        spotsReserved: 0,
        eventType: 'CAPACITY_BASED',
        maxSpotsPerPerson: 5,
        allowCancellation: true,
        cancellationDeadlineHours: 2,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({ where: { eventId: { in: [futureEvent.id, soonEvent.id, tableBasedEvent.id, capacityBasedEvent.id] } } })
    await prisma.table.deleteMany({ where: { eventId: tableBasedEvent.id } })
    await prisma.event.deleteMany({ where: { id: { in: [futureEvent.id, soonEvent.id, tableBasedEvent.id, capacityBasedEvent.id] } } })
    await prisma.school.delete({ where: { id: testSchool.id } })
    await prisma.$disconnect()
  })

  describe('Deadline Enforcement', () => {
    test('allows cancellation before deadline (48 hours before event, deadline is 2 hours)', async () => {
      // Create registration
      const registration = await prisma.registration.create({
        data: {
          eventId: futureEvent.id,
          spotsCount: 2,
          status: 'CONFIRMED',
          confirmationCode: 'TEST001',
          phoneNumber: '0501111111',
          data: { name: 'Test User' },
        },
      })

      // Generate valid token
      const token = jwt.sign(
        { eventId: futureEvent.id, phone: '0501111111' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Should succeed
      const result = await cancelReservation(token)
      expect(result.success).toBe(true)

      // Verify registration is cancelled
      const updatedReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(updatedReg?.status).toBe('CANCELLED')
      expect(updatedReg?.cancelledAt).toBeTruthy()
    })

    test('rejects cancellation within deadline (1 hour before event, deadline is 2 hours)', async () => {
      // Create registration
      await prisma.registration.create({
        data: {
          eventId: soonEvent.id,
          spotsCount: 2,
          status: 'CONFIRMED',
          confirmationCode: 'TEST002',
          phoneNumber: '0502222222',
          data: { name: 'Test User 2' },
        },
      })

      // Generate valid token
      const token = jwt.sign(
        { eventId: soonEvent.id, phone: '0502222222' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Should fail with deadline error
      await expect(cancelReservation(token)).rejects.toThrow(
        /Cannot cancel less than 2 hours before event/
      )
    })
  })

  describe('Token Validation', () => {
    test('rejects invalid token signature', async () => {
      const invalidToken = 'invalid.token.here'

      await expect(cancelReservation(invalidToken)).rejects.toThrow(
        /Invalid or expired cancellation link/
      )
    })

    test('rejects expired token', async () => {
      // Create token that expired 1 second ago
      const expiredToken = jwt.sign(
        { eventId: futureEvent.id, phone: '0503333333' },
        process.env.JWT_SECRET!,
        { expiresIn: '-1s' } // Already expired
      )

      await expect(cancelReservation(expiredToken)).rejects.toThrow(
        /Invalid or expired cancellation link/
      )
    })

    test('rejects token for non-existent registration', async () => {
      const token = jwt.sign(
        { eventId: futureEvent.id, phone: '0509999999' }, // Phone not registered
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      await expect(cancelReservation(token)).rejects.toThrow(
        /Registration not found or already cancelled/
      )
    })

    test('rejects token for already cancelled registration', async () => {
      // Create already cancelled registration
      await prisma.registration.create({
        data: {
          eventId: futureEvent.id,
          spotsCount: 1,
          status: 'CANCELLED',
          confirmationCode: 'TEST004',
          phoneNumber: '0504444444',
          data: { name: 'Test User 4' },
        },
      })

      const token = jwt.sign(
        { eventId: futureEvent.id, phone: '0504444444' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      await expect(cancelReservation(token)).rejects.toThrow(
        /Registration not found or already cancelled/
      )
    })
  })

  describe('Table-Based Event Cancellation', () => {
    test('frees table when cancelling table-based reservation', async () => {
      // Import table assignment
      const { reserveTableForGuests } = await import('@/lib/table-assignment')

      // Book table
      const booking = await reserveTableForGuests(tableBasedEvent.id, 4, {
        phoneNumber: '0505555555',
        data: { name: 'Table Guest' },
      })

      expect(booking.status).toBe('CONFIRMED')
      expect(booking.table).toBeTruthy()

      // Verify table is RESERVED
      const tableBefore = await prisma.table.findUnique({
        where: { id: booking.table!.id },
      })
      expect(tableBefore?.status).toBe('RESERVED')

      // Generate cancellation token
      const token = jwt.sign(
        { eventId: tableBasedEvent.id, phone: '0505555555' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Cancel
      const result = await cancelReservation(token)
      expect(result.success).toBe(true)

      // Verify table is AVAILABLE
      const tableAfter = await prisma.table.findUnique({
        where: { id: booking.table!.id },
      })
      expect(tableAfter?.status).toBe('AVAILABLE')
      expect(tableAfter?.reservedById).toBeNull()
    })
  })

  describe('Capacity-Based Event Cancellation', () => {
    test('decrements spotsReserved counter when cancelling', async () => {
      // Create registration
      await prisma.registration.create({
        data: {
          eventId: capacityBasedEvent.id,
          spotsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: 'TEST006',
          phoneNumber: '0506666666',
          data: { name: 'Capacity User' },
        },
      })

      // Manually increment counter (simulating what registration API does)
      await prisma.event.update({
        where: { id: capacityBasedEvent.id },
        data: { spotsReserved: { increment: 3 } },
      })

      // Verify counter is 3
      const eventBefore = await prisma.event.findUnique({
        where: { id: capacityBasedEvent.id },
      })
      expect(eventBefore?.spotsReserved).toBe(3)

      // Generate cancellation token
      const token = jwt.sign(
        { eventId: capacityBasedEvent.id, phone: '0506666666' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Cancel
      const result = await cancelReservation(token)
      expect(result.success).toBe(true)

      // Verify counter is decremented to 0
      const eventAfter = await prisma.event.findUnique({
        where: { id: capacityBasedEvent.id },
      })
      expect(eventAfter?.spotsReserved).toBe(0)
    })
  })

  describe('Cancellation Reason', () => {
    test('stores cancellation reason when provided', async () => {
      // Create registration
      const registration = await prisma.registration.create({
        data: {
          eventId: futureEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'TEST007',
          phoneNumber: '0507777777',
          data: { name: 'Test User 7' },
        },
      })

      // Generate token
      const token = jwt.sign(
        { eventId: futureEvent.id, phone: '0507777777' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Cancel with reason
      const reason = 'Can no longer attend'
      await cancelReservation(token, reason)

      // Verify reason is stored
      const updatedReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(updatedReg?.cancellationReason).toBe(reason)
      expect(updatedReg?.cancelledBy).toBe('CUSTOMER')
    })
  })

  describe('Waitlist Cancellation', () => {
    test('allows cancelling waitlist registration', async () => {
      // Create waitlist registration
      const registration = await prisma.registration.create({
        data: {
          eventId: futureEvent.id,
          spotsCount: 1,
          status: 'WAITLIST',
          waitlistPriority: 1,
          confirmationCode: 'TEST008',
          phoneNumber: '0508888888',
          data: { name: 'Waitlist User' },
        },
      })

      // Generate token
      const token = jwt.sign(
        { eventId: futureEvent.id, phone: '0508888888' },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      )

      // Cancel
      const result = await cancelReservation(token)
      expect(result.success).toBe(true)

      // Verify status is CANCELLED
      const updatedReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(updatedReg?.status).toBe('CANCELLED')
    })
  })
})
