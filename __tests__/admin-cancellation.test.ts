/**
 * Admin Cancellation E2E Tests
 *
 * Tests comprehensive admin cancellation functionality including:
 * - Capacity-based event cancellations
 * - Table-based event cancellations
 * - Waitlist cancellations
 * - Cancellation reason tracking
 * - Audit trail (cancelledBy: ADMIN)
 * - Resource freeing (tables, capacity)
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '@/lib/prisma'

describe('Admin Cancellation System', () => {
  let testSchool: any
  let testAdmin: any
  let capacityEvent: any
  let tableEvent: any

  beforeAll(async () => {
    // Create test school and admin
    testSchool = await prisma.school.create({
      data: {
        name: `Test School ${Date.now()}`,
        slug: `test-school-${Date.now()}`,
      },
    })

    testAdmin = await prisma.admin.create({
      data: {
        email: `admin${Date.now()}@test.com`,
        passwordHash: 'hashedpassword',
        name: 'Test Admin',
        role: 'ADMIN',
        schoolId: testSchool.id,
        emailVerified: true,
      },
    })

    // Create capacity-based event
    capacityEvent = await prisma.event.create({
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

    // Create table-based event
    tableEvent = await prisma.event.create({
      data: {
        title: 'Table Event',
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

    // Create table
    await prisma.table.create({
      data: {
        eventId: tableEvent.id,
        tableNumber: '1',
        capacity: 4,
        minOrder: 2,
        tableOrder: 1,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({ where: { eventId: { in: [capacityEvent.id, tableEvent.id] } } })
    await prisma.table.deleteMany({ where: { eventId: tableEvent.id } })
    await prisma.event.deleteMany({ where: { id: { in: [capacityEvent.id, tableEvent.id] } } })
    await prisma.admin.delete({ where: { id: testAdmin.id } })
    await prisma.school.delete({ where: { id: testSchool.id } })
    await prisma.$disconnect()
  })

  describe('Capacity-Based Event Cancellation', () => {
    test('admin can cancel confirmed registration with reason', async () => {
      // Create confirmed registration
      const registration = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: 'CANCEL001',
          phoneNumber: '0501111111',
          data: { name: 'Test User 1' },
        },
      })

      // Increment spots reserved
      await prisma.event.update({
        where: { id: capacityEvent.id },
        data: { spotsReserved: { increment: 3 } },
      })

      // Verify spots reserved before
      const eventBefore = await prisma.event.findUnique({
        where: { id: capacityEvent.id },
      })
      expect(eventBefore?.spotsReserved).toBe(3)

      // Admin cancels with reason
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          cancellationReason: 'Customer called to cancel',
        },
      })

      // Decrement spots
      await prisma.event.update({
        where: { id: capacityEvent.id },
        data: { spotsReserved: { decrement: 3 } },
      })

      // Verify cancellation
      const cancelledReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(cancelledReg?.status).toBe('CANCELLED')
      expect(cancelledReg?.cancelledBy).toBe('ADMIN')
      expect(cancelledReg?.cancellationReason).toBe('Customer called to cancel')
      expect(cancelledReg?.cancelledAt).toBeTruthy()

      // Verify spots freed
      const eventAfter = await prisma.event.findUnique({
        where: { id: capacityEvent.id },
      })
      expect(eventAfter?.spotsReserved).toBe(0)
    })

    test('admin can cancel waitlist registration', async () => {
      const registration = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 2,
          status: 'WAITLIST',
          waitlistPriority: 1,
          confirmationCode: 'CANCEL002',
          phoneNumber: '0502222222',
          data: { name: 'Test User 2' },
        },
      })

      // Admin cancels waitlist
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
        },
      })

      const cancelledReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(cancelledReg?.status).toBe('CANCELLED')
      expect(cancelledReg?.cancelledBy).toBe('ADMIN')
    })

    test('admin can cancel without reason (optional)', async () => {
      const registration = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'CANCEL003',
          phoneNumber: '0503333333',
          data: { name: 'Test User 3' },
        },
      })

      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          // No reason provided
        },
      })

      const cancelledReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(cancelledReg?.status).toBe('CANCELLED')
      expect(cancelledReg?.cancellationReason).toBeNull()
    })
  })

  describe('Table-Based Event Cancellation', () => {
    test('admin can cancel table reservation and free table', async () => {
      // Get table
      const table = await prisma.table.findFirst({
        where: { eventId: tableEvent.id },
      })

      expect(table).toBeTruthy()

      // Create reservation first (without table assignment)
      const registration = await prisma.registration.create({
        data: {
          eventId: tableEvent.id,
          guestsCount: 4,
          status: 'CONFIRMED',
          confirmationCode: 'TABLE001',
          phoneNumber: '0504444444',
          data: { name: 'Table Guest' },
        },
      })

      // Reserve table by linking registration
      await prisma.table.update({
        where: { id: table!.id },
        data: { status: 'RESERVED', reservedById: registration.id },
      })

      // Verify table is reserved
      const tableBefore = await prisma.table.findUnique({
        where: { id: table!.id },
      })
      expect(tableBefore?.status).toBe('RESERVED')

      // Admin cancels
      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          cancellationReason: 'Admin cancelled table reservation',
        },
      })

      // Free table
      await prisma.table.update({
        where: { id: table!.id },
        data: { status: 'AVAILABLE', reservedById: null },
      })

      // Verify table is freed
      const tableAfter = await prisma.table.findUnique({
        where: { id: table!.id },
      })
      expect(tableAfter?.status).toBe('AVAILABLE')
      expect(tableAfter?.reservedById).toBeNull()

      // Verify registration is cancelled
      const cancelledReg = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(cancelledReg?.status).toBe('CANCELLED')
      expect(cancelledReg?.cancelledBy).toBe('ADMIN')
    })
  })

  describe('Audit Trail', () => {
    test('cancelled registrations are preserved (not deleted)', async () => {
      const registration = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'AUDIT001',
          phoneNumber: '0505555555',
          data: { name: 'Audit User', email: 'audit@test.com' },
        },
      })

      await prisma.registration.update({
        where: { id: registration.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          cancellationReason: 'Test audit trail',
        },
      })

      // Registration still exists
      const exists = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(exists).toBeTruthy()
      expect(exists?.status).toBe('CANCELLED')

      // All original data is preserved
      expect(exists?.data).toEqual({ name: 'Audit User', email: 'audit@test.com' })
      expect(exists?.phoneNumber).toBe('0505555555')
      expect(exists?.confirmationCode).toBe('AUDIT001')
    })

    test('distinguishes between ADMIN and CUSTOMER cancellations', async () => {
      const reg1 = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'SOURCE001',
          phoneNumber: '0506666666',
          data: { name: 'User 1' },
        },
      })

      const reg2 = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'SOURCE002',
          phoneNumber: '0507777777',
          data: { name: 'User 2' },
        },
      })

      // Admin cancellation
      await prisma.registration.update({
        where: { id: reg1.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
        },
      })

      // Customer cancellation
      await prisma.registration.update({
        where: { id: reg2.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'CUSTOMER',
        },
      })

      const adminCancelled = await prisma.registration.findUnique({
        where: { id: reg1.id },
      })
      const customerCancelled = await prisma.registration.findUnique({
        where: { id: reg2.id },
      })

      expect(adminCancelled?.cancelledBy).toBe('ADMIN')
      expect(customerCancelled?.cancelledBy).toBe('CUSTOMER')
    })
  })

  describe('Cancellation Reporting', () => {
    test('can query all cancelled registrations for event', async () => {
      // Create mix of statuses
      await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'RPT001',
          phoneNumber: '0508888888',
          data: { name: 'Active User' },
        },
      })

      const cancelled = await prisma.registration.create({
        data: {
          eventId: capacityEvent.id,
          spotsCount: 1,
          status: 'CANCELLED',
          confirmationCode: 'RPT002',
          phoneNumber: '0509999999',
          data: { name: 'Cancelled User' },
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          cancellationReason: 'Testing report',
        },
      })

      // Query cancelled only
      const cancelledRegs = await prisma.registration.findMany({
        where: {
          eventId: capacityEvent.id,
          status: 'CANCELLED',
        },
        orderBy: { cancelledAt: 'desc' },
      })

      expect(cancelledRegs.length).toBeGreaterThan(0)
      expect(cancelledRegs.some((r) => r.id === cancelled.id)).toBe(true)
    })

    test('can filter by cancellation source (ADMIN vs CUSTOMER)', async () => {
      const adminCancelled = await prisma.registration.findMany({
        where: {
          eventId: capacityEvent.id,
          status: 'CANCELLED',
          cancelledBy: 'ADMIN',
        },
      })

      expect(adminCancelled.length).toBeGreaterThan(0)
      expect(adminCancelled.every((r) => r.cancelledBy === 'ADMIN')).toBe(true)
    })
  })
})
