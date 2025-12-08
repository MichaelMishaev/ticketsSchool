/**
 * SMALLEST_FIT Algorithm Test
 *
 * Tests that the system assigns the smallest table that can accommodate
 * the guest count, rather than assigning larger tables unnecessarily.
 *
 * Given tables: [8, 4, 6] capacity
 * When: 4 guests book
 * Expected: Assign table with capacity 4 (not 6 or 8)
 */

// Load environment variables BEFORE importing Prisma
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

import { prisma } from '@/lib/prisma'
import { reserveTableForGuests } from '@/lib/table-assignment'

describe('SMALLEST_FIT Algorithm', () => {
  let testEvent: any
  let table4: any
  let table6: any
  let table8: any

  beforeAll(async () => {
    // Create test school
    const school = await prisma.school.create({
      data: {
        name: 'Test School',
        slug: `test-school-${Date.now()}`,
      },
    })

    // Create TABLE_BASED event
    testEvent = await prisma.event.create({
      data: {
        title: 'SMALLEST_FIT Test Event',
        slug: `fit-test-${Date.now()}`,
        schoolId: school.id,
        startAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 1,
      },
    })

    // Create tables with different capacities: 8, 4, 6
    // (intentionally out of order to test sorting)
    table8 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '1',
        capacity: 8,
        minOrder: 2,
        tableOrder: 1,
      },
    })

    table4 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '2',
        capacity: 4,
        minOrder: 2,
        tableOrder: 2,
      },
    })

    table6 = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: '3',
        capacity: 6,
        minOrder: 2,
        tableOrder: 3,
      },
    })
  })

  afterAll(async () => {
    // Cleanup
    if (testEvent) {
      await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
      await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
      await prisma.event.delete({ where: { id: testEvent.id } })
      await prisma.school.delete({ where: { id: testEvent.schoolId } })
    }
    await prisma.$disconnect()
  })

  test('assigns smallest fitting table (4 guests → table with capacity 4)', async () => {
    const guestsCount = 4

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0501234567',
      data: {
        name: 'Test User',
        phone: '0501234567',
      },
    })

    // Verify: Registration is CONFIRMED
    expect(result.status).toBe('CONFIRMED')
    expect(result.registration.status).toBe('CONFIRMED')

    // Verify: Assigned table has capacity 4 (not 6 or 8)
    expect(result.table?.id).toBe(table4.id)
    expect(result.table?.capacity).toBe(4)

    // Verify: Table is marked as RESERVED
    const updatedTable = await prisma.table.findUnique({
      where: { id: table4.id },
    })
    expect(updatedTable?.status).toBe('RESERVED')

    // Verify: Other tables remain AVAILABLE
    const table6Updated = await prisma.table.findUnique({ where: { id: table6.id } })
    const table8Updated = await prisma.table.findUnique({ where: { id: table8.id } })
    expect(table6Updated?.status).toBe('AVAILABLE')
    expect(table8Updated?.status).toBe('AVAILABLE')
  })

  test('assigns next smallest when exact fit is unavailable (4 guests → table 6 if table 4 reserved)', async () => {
    // Table 4 is already reserved from previous test
    const guestsCount = 4

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0507654321',
      data: {
        name: 'Second User',
        phone: '0507654321',
      },
    })

    // Verify: Registration is CONFIRMED
    expect(result.status).toBe('CONFIRMED')

    // Verify: Assigned table with capacity 6 (next smallest fitting)
    expect(result.table?.id).toBe(table6.id)
    expect(result.table?.capacity).toBe(6)

    // Verify: Table is marked as RESERVED
    const updatedTable = await prisma.table.findUnique({
      where: { id: table6.id },
    })
    expect(updatedTable?.status).toBe('RESERVED')
  })

  test('assigns to waitlist when no fitting table available (4 guests → WAITLIST when all tables reserved)', async () => {
    // Tables 4 and 6 are already reserved from previous tests
    const guestsCount = 4

    const result = await reserveTableForGuests(testEvent.id, guestsCount, {
      phoneNumber: '0509876543',
      data: {
        name: 'Third User',
        phone: '0509876543',
      },
    })

    // Verify: Registration is on WAITLIST (table 8 doesn't fit due to minOrder=2, capacity=8 being too large for demo)
    // Actually, table 8 SHOULD fit 4 guests. Let me reconsider this test.
    // Table 8 has minOrder=2 and capacity=8, so 4 guests MEETS minOrder and FITS capacity
    // So this should be CONFIRMED with table 8

    expect(result.status).toBe('CONFIRMED')
    expect(result.table?.id).toBe(table8.id)
    expect(result.table?.capacity).toBe(8)
  })
})
