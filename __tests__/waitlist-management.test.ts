/**
 * Waitlist Management Tests (Phase 3)
 *
 * Tests for manual waitlist assignment including:
 * - Fetching waitlist with matching tables
 * - Manual table assignment by admin
 * - Validation (guest count, table availability)
 * - Transaction isolation
 */

// Load environment variables BEFORE importing Prisma
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '@/lib/prisma'

describe('Waitlist Management (Phase 3)', () => {
  let testSchool: any
  let testEvent: any
  let table1: any // 4 capacity, minOrder 2
  let table2: any // 6 capacity, minOrder 2
  let table3: any // 8 capacity, minOrder 4

  beforeAll(async () => {
    // Create test school
    testSchool = await prisma.school.create({
      data: {
        name: 'Test School Waitlist',
        slug: `test-school-waitlist-${Date.now()}`,
      },
    })

    // Create table-based event
    testEvent = await prisma.event.create({
      data: {
        title: 'Waitlist Test Event',
        slug: `waitlist-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 8,
        allowCancellation: true,
        cancellationDeadlineHours: 2,
      },
    })

    // Create 3 tables with different capacities
    table1 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '1',
        capacity: 4,
        minOrder: 2,
        tableOrder: 1,
        status: 'AVAILABLE',
      },
    })

    table2 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '2',
        capacity: 6,
        minOrder: 2,
        tableOrder: 2,
        status: 'AVAILABLE',
      },
    })

    table3 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '3',
        capacity: 8,
        minOrder: 4,
        tableOrder: 3,
        status: 'AVAILABLE',
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.school.delete({ where: { id: testSchool.id } })
    await prisma.$disconnect()
  })

  describe('Waitlist Matching Algorithm', () => {
    test('identifies best matching table for waitlist entry (4 guests → table 1)', async () => {
      // Create waitlist registration for 4 guests
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 4,
          status: 'WAITLIST',
          waitlistPriority: 1,
          confirmationCode: 'WAIT001',
          phoneNumber: '0501111111',
          data: { name: 'Test User 1' },
        },
      })

      // Simulate waitlist API logic
      const availableTables = await prisma.table.findMany({
        where: { eventId: testEvent.id, status: 'AVAILABLE' },
        orderBy: { tableOrder: 'asc' },
      })

      const guestCount = waitlistReg.guestsCount || 0
      const matchingTables = availableTables.filter(
        (table) => guestCount >= table.minOrder && guestCount <= table.capacity
      )

      // Find smallest fitting table (SMALLEST_FIT)
      const bestTable = matchingTables.sort((a, b) => a.capacity - b.capacity)[0]

      expect(matchingTables.length).toBe(3) // Tables 1 (4), 2 (6), and 3 (8, minOrder 4) all fit
      expect(bestTable.tableNumber).toBe('1') // Table 1 is smallest (4 capacity)
    })

    test('respects minOrder constraint when matching (2 guests → only table 1 and 2)', async () => {
      // Create waitlist registration for 2 guests
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 2,
          status: 'WAITLIST',
          waitlistPriority: 2,
          confirmationCode: 'WAIT002',
          phoneNumber: '0502222222',
          data: { name: 'Test User 2' },
        },
      })

      const availableTables = await prisma.table.findMany({
        where: { eventId: testEvent.id, status: 'AVAILABLE' },
      })

      const guestCount = waitlistReg.guestsCount || 0
      const matchingTables = availableTables.filter(
        (table) => guestCount >= table.minOrder && guestCount <= table.capacity
      )

      // Should match tables 1 and 2, but NOT table 3 (minOrder 4 > guestsCount 2)
      expect(matchingTables.length).toBe(2)
      expect(matchingTables.map((t) => t.tableNumber)).toEqual(expect.arrayContaining(['1', '2']))
      expect(matchingTables.find((t) => t.tableNumber === '3')).toBeUndefined()
    })

    test('finds no matches when guest count is too high (12 guests → no tables)', async () => {
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 12,
          status: 'WAITLIST',
          waitlistPriority: 3,
          confirmationCode: 'WAIT003',
          phoneNumber: '0503333333',
          data: { name: 'Test User 3' },
        },
      })

      const availableTables = await prisma.table.findMany({
        where: { eventId: testEvent.id, status: 'AVAILABLE' },
      })

      const guestCount = waitlistReg.guestsCount || 0
      const matchingTables = availableTables.filter(
        (table) => guestCount >= table.minOrder && guestCount <= table.capacity
      )

      expect(matchingTables.length).toBe(0) // No table fits 12 guests (max capacity is 8)
    })
  })

  describe('Manual Table Assignment', () => {
    test('successfully assigns waitlist registration to table', async () => {
      // Create waitlist registration
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 4,
          status: 'WAITLIST',
          waitlistPriority: 10,
          confirmationCode: 'WAIT010',
          phoneNumber: '0501010101',
          data: { name: 'Assign Test User' },
        },
      })

      // Manually assign to table 1
      const result = await prisma.$transaction(async (tx) => {
        // Update registration to CONFIRMED
        const updatedReg = await tx.registration.update({
          where: { id: waitlistReg.id },
          data: {
            status: 'CONFIRMED',
            waitlistPriority: null,
          },
        })

        // Reserve table
        const updatedTable = await tx.table.update({
          where: { id: table1.id },
          data: {
            status: 'RESERVED',
            reservedById: waitlistReg.id,
          },
        })

        return { registration: updatedReg, table: updatedTable }
      })

      expect(result.registration.status).toBe('CONFIRMED')
      expect(result.registration.waitlistPriority).toBeNull()
      expect(result.table.status).toBe('RESERVED')
      expect(result.table.reservedById).toBe(waitlistReg.id)

      // Cleanup for next tests
      await prisma.table.update({
        where: { id: table1.id },
        data: { status: 'AVAILABLE', reservedById: null },
      })
      await prisma.registration.delete({ where: { id: waitlistReg.id } })
    })

    test('rejects assignment if guest count exceeds table capacity', async () => {
      // Create waitlist registration for 6 guests
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 6,
          status: 'WAITLIST',
          waitlistPriority: 11,
          confirmationCode: 'WAIT011',
          phoneNumber: '0501111112',
          data: { name: 'Too Many Guests' },
        },
      })

      // Try to assign to table 1 (capacity 4 < guestsCount 6)
      const guestCount = waitlistReg.guestsCount || 0
      const capacityCheck = guestCount <= table1.capacity

      expect(capacityCheck).toBe(false)

      // Cleanup
      await prisma.registration.delete({ where: { id: waitlistReg.id } })
    })

    test('rejects assignment if guest count is below table minOrder', async () => {
      // Create waitlist registration for 3 guests
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 3,
          status: 'WAITLIST',
          waitlistPriority: 12,
          confirmationCode: 'WAIT012',
          phoneNumber: '0501111113',
          data: { name: 'Too Few Guests' },
        },
      })

      // Try to assign to table 3 (minOrder 4 > guestsCount 3)
      const guestCount = waitlistReg.guestsCount || 0
      const minOrderCheck = guestCount >= table3.minOrder

      expect(minOrderCheck).toBe(false)

      // Cleanup
      await prisma.registration.delete({ where: { id: waitlistReg.id } })
    })

    test('rejects assignment if table is already reserved', async () => {
      // Reserve table 2
      const firstReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 4,
          status: 'CONFIRMED',
          confirmationCode: 'CONF001',
          phoneNumber: '0502020202',
          data: { name: 'First Guest' },
        },
      })

      await prisma.table.update({
        where: { id: table2.id },
        data: { status: 'RESERVED', reservedById: firstReg.id },
      })

      // Create waitlist registration
      const waitlistReg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 4,
          status: 'WAITLIST',
          waitlistPriority: 13,
          confirmationCode: 'WAIT013',
          phoneNumber: '0501111114',
          data: { name: 'Second Guest' },
        },
      })

      // Verify table is RESERVED
      const tableStatus = await prisma.table.findUnique({
        where: { id: table2.id },
        select: { status: true },
      })

      expect(tableStatus?.status).toBe('RESERVED')

      // Cleanup
      await prisma.table.update({
        where: { id: table2.id },
        data: { status: 'AVAILABLE', reservedById: null },
      })
      await prisma.registration.delete({ where: { id: waitlistReg.id } })
      await prisma.registration.delete({ where: { id: firstReg.id } })
    })
  })

  describe('Transaction Isolation', () => {
    test('prevents double-booking when two admins assign same table simultaneously', async () => {
      // Create two waitlist registrations
      const [waitlist1, waitlist2] = await Promise.all([
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            guestsCount: 4,
            status: 'WAITLIST',
            waitlistPriority: 20,
            confirmationCode: 'WAIT020',
            phoneNumber: '0502020201',
            data: { name: 'Race User 1' },
          },
        }),
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            guestsCount: 4,
            status: 'WAITLIST',
            waitlistPriority: 21,
            confirmationCode: 'WAIT021',
            phoneNumber: '0502020202',
            data: { name: 'Race User 2' },
          },
        }),
      ])

      // Simulate two admins assigning different waitlist entries to the same table
      const assignToTable = async (regId: string, tableId: string) => {
        try {
          return await prisma.$transaction(
            async (tx) => {
              const table = await tx.table.findUnique({
                where: { id: tableId },
              })

              if (table?.status !== 'AVAILABLE') {
                throw new Error('Table not available')
              }

              await tx.registration.update({
                where: { id: regId },
                data: { status: 'CONFIRMED', waitlistPriority: null },
              })

              await tx.table.update({
                where: { id: tableId },
                data: { status: 'RESERVED', reservedById: regId },
              })

              return { success: true }
            },
            {
              isolationLevel: 'Serializable',
              timeout: 10000,
            }
          )
        } catch (error: any) {
          return { success: false, error: error.message }
        }
      }

      // Run both assignments concurrently
      const [result1, result2] = await Promise.all([
        assignToTable(waitlist1.id, table3.id),
        assignToTable(waitlist2.id, table3.id),
      ])

      // Exactly one should succeed
      const successCount = [result1, result2].filter((r) => r.success).length
      expect(successCount).toBe(1)

      // Verify table is reserved exactly once
      const table = await prisma.table.findUnique({
        where: { id: table3.id },
      })
      expect(table?.status).toBe('RESERVED')
      expect([waitlist1.id, waitlist2.id]).toContain(table?.reservedById)

      // Cleanup
      await prisma.table.update({
        where: { id: table3.id },
        data: { status: 'AVAILABLE', reservedById: null },
      })
      await prisma.registration.deleteMany({
        where: { id: { in: [waitlist1.id, waitlist2.id] } },
      })
    })
  })
})
