/**
 * Table Sharing Tests — Many-to-One FK (Phase: table_registrations_many_to_one)
 *
 * These tests exercise the sharing-aware flows introduced when we flipped the
 * Table↔Registration relation from 1:1 to many-to-one.
 *
 * Scenarios:
 *   1. Adding a waitlist reg to a partially-occupied table is allowed when
 *      remaining seats are enough.
 *   2. `minOrder` is NOT enforced when the table already has CONFIRMED regs
 *      (it's an "open the table" gate, not a per-reg rule).
 *   3. Cancelling one of two shared regs keeps the table RESERVED and leaves
 *      the other reg untouched.
 *   4. Cancelling the last remaining reg flips the table back to AVAILABLE.
 *   5. Two concurrent assigns racing for the last seat → exactly one wins.
 *
 * These all hit the real database via Prisma, mirroring production flows.
 */

// Load env before Prisma import
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// IMPORTANT: Use a RAW PrismaClient instead of `@/lib/prisma`. The project's
// exported client wraps Prisma with `applyPrismaGuards`, which throws on
// `deleteMany` against Registration/Event/School (soft-delete invariant).
// Integration tests need real hard deletes for teardown — the cascade from
// School → Event → Registration only fires on actual DELETEs, not status
// updates — so we bypass the guards here.
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

import {
  canAddRegistrationToTable,
  isTableEmpty,
  tableOccupiedSpots,
  tableRemainingSpots,
  type TableRegistration,
} from '@/components/admin/table-helpers'

describe('Table Sharing — many-to-one FK', () => {
  let testSchool: any
  let testEvent: any
  let sharedTable: any // capacity 4, minOrder 2

  beforeAll(async () => {
    testSchool = await prisma.school.create({
      data: {
        name: 'Test School Sharing',
        slug: `test-school-sharing-${Date.now()}`,
      },
    })

    testEvent = await prisma.event.create({
      data: {
        title: 'Sharing Test Event',
        slug: `sharing-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 8,
        allowCancellation: true,
        cancellationDeadlineHours: 2,
      },
    })

    sharedTable = await prisma.table.create({
      data: {
        eventId: testEvent.id,
        tableNumber: 'S1',
        capacity: 4,
        minOrder: 2,
        tableOrder: 1,
        status: 'AVAILABLE',
      },
    })
  })

  afterAll(async () => {
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.school.delete({ where: { id: testSchool.id } })
    await prisma.$disconnect()
  })

  // Reset shared table state between test blocks so each describe is independent.
  async function resetTableState() {
    await prisma.registration.updateMany({
      where: { eventId: testEvent.id },
      data: { tableId: null },
    })
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.table.update({
      where: { id: sharedTable.id },
      data: { status: 'AVAILABLE' },
    })
  }

  describe('canAddRegistrationToTable() — policy gate', () => {
    // Helper: build a Table-shaped object from the real row for the helper.
    const buildTableView = (capacity: number, minOrder: number, regs: TableRegistration[]) => ({
      id: 'x',
      tableNumber: 'S1',
      capacity,
      minOrder,
      status: 'AVAILABLE' as const,
      registrations: regs,
    })

    test('empty table: minOrder IS enforced (2 guests OK for minOrder=2)', () => {
      const view = buildTableView(4, 2, [])
      expect(isTableEmpty(view)).toBe(true)
      expect(canAddRegistrationToTable(view, 2)).toEqual({ ok: true })
    })

    test('empty table: minOrder IS enforced (1 guest REJECTED for minOrder=2)', () => {
      const view = buildTableView(4, 2, [])
      const result = canAddRegistrationToTable(view, 1)
      expect(result.ok).toBe(false)
      // Helpful signal for debugging failures
      if (!result.ok) expect(result.reason).toMatch(/מינימום/)
    })

    test('partially-occupied table: minOrder is NOT enforced', () => {
      // Table already has a 3-guest reg — remaining capacity = 1.
      // Now try to squeeze in a solo guest even though minOrder=2.
      const view = buildTableView(4, 2, [
        {
          id: 'r1',
          confirmationCode: 'ABC',
          guestsCount: 3,
          phoneNumber: '0501111111',
          data: null,
          createdAt: new Date(),
        },
      ])
      expect(isTableEmpty(view)).toBe(false)
      expect(tableOccupiedSpots(view)).toBe(3)
      expect(tableRemainingSpots(view)).toBe(1)
      expect(canAddRegistrationToTable(view, 1)).toEqual({ ok: true })
    })

    test('partially-occupied table: incoming too big is REJECTED', () => {
      const view = buildTableView(4, 2, [
        {
          id: 'r1',
          confirmationCode: 'ABC',
          guestsCount: 3,
          phoneNumber: '0501111111',
          data: null,
          createdAt: new Date(),
        },
      ])
      // Only 1 seat remains, but we're asking for 2.
      const result = canAddRegistrationToTable(view, 2)
      expect(result.ok).toBe(false)
      if (!result.ok) expect(result.reason).toMatch(/מקומות/)
    })

    test('INACTIVE (admin hold) is never assignable', () => {
      const view = { ...buildTableView(4, 2, []), status: 'INACTIVE' as const }
      const result = canAddRegistrationToTable(view, 2)
      expect(result.ok).toBe(false)
    })

    test('zero-guest reg is always rejected', () => {
      const view = buildTableView(4, 2, [])
      const result = canAddRegistrationToTable(view, 0)
      expect(result.ok).toBe(false)
    })
  })

  describe('Sharing at the DB level', () => {
    beforeEach(resetTableState)

    test('multiple CONFIRMED regs can point at the same table', async () => {
      // Open the table with a 3-guest reg (passes minOrder=2 gate).
      const reg1 = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: 'SHARE01',
          phoneNumber: '0501000001',
          data: { name: 'Host' },
          tableId: sharedTable.id,
        },
      })
      await prisma.table.update({
        where: { id: sharedTable.id },
        data: { status: 'RESERVED' },
      })

      // Now add a solo guest (minOrder bypassed because table is non-empty).
      const reg2 = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'SHARE02',
          phoneNumber: '0501000002',
          data: { name: 'Solo' },
          tableId: sharedTable.id,
        },
      })

      const tableWithRegs = await prisma.table.findUnique({
        where: { id: sharedTable.id },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true, guestsCount: true },
          },
        },
      })

      expect(tableWithRegs?.status).toBe('RESERVED')
      expect(tableWithRegs?.registrations).toHaveLength(2)
      const ids = tableWithRegs?.registrations.map((r) => r.id) ?? []
      expect(ids).toContain(reg1.id)
      expect(ids).toContain(reg2.id)
      const total = tableWithRegs?.registrations.reduce((s, r) => s + (r.guestsCount ?? 0), 0)
      expect(total).toBe(4)
    })

    test('cancel one of two shared regs → table stays RESERVED', async () => {
      // Seed two shared regs (3 + 1 on a capacity-4 table).
      const reg1 = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: 'STAY01',
          phoneNumber: '0501000003',
          data: { name: 'Staying Group' },
          tableId: sharedTable.id,
        },
      })
      const reg2 = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: 'STAY02',
          phoneNumber: '0501000004',
          data: { name: 'Leaving Guest' },
          tableId: sharedTable.id,
        },
      })
      await prisma.table.update({
        where: { id: sharedTable.id },
        data: { status: 'RESERVED' },
      })

      // Cancel reg2 with the exact conditional-release pattern from prod.
      await prisma.registration.update({
        where: { id: reg2.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          tableId: null,
        },
      })
      const remaining = await prisma.registration.count({
        where: { tableId: sharedTable.id, status: 'CONFIRMED' },
      })
      if (remaining === 0) {
        await prisma.table.update({
          where: { id: sharedTable.id },
          data: { status: 'AVAILABLE' },
        })
      }

      const tableAfter = await prisma.table.findUnique({
        where: { id: sharedTable.id },
      })
      expect(tableAfter?.status).toBe('RESERVED') // critical: still occupied
      expect(remaining).toBe(1)

      // Verify the OTHER reg is untouched.
      const reg1After = await prisma.registration.findUnique({
        where: { id: reg1.id },
      })
      expect(reg1After?.status).toBe('CONFIRMED')
      expect(reg1After?.tableId).toBe(sharedTable.id)
    })

    test('cancel the last reg → table flips back to AVAILABLE', async () => {
      // Single occupant.
      const reg = await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 2,
          status: 'CONFIRMED',
          confirmationCode: 'LONE01',
          phoneNumber: '0501000005',
          data: { name: 'Lone Party' },
          tableId: sharedTable.id,
        },
      })
      await prisma.table.update({
        where: { id: sharedTable.id },
        data: { status: 'RESERVED' },
      })

      // Conditional release.
      await prisma.registration.update({
        where: { id: reg.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'ADMIN',
          tableId: null,
        },
      })
      const remaining = await prisma.registration.count({
        where: { tableId: sharedTable.id, status: 'CONFIRMED' },
      })
      if (remaining === 0) {
        await prisma.table.update({
          where: { id: sharedTable.id },
          data: { status: 'AVAILABLE' },
        })
      }

      const tableAfter = await prisma.table.findUnique({
        where: { id: sharedTable.id },
      })
      expect(tableAfter?.status).toBe('AVAILABLE')
      expect(remaining).toBe(0)
    })
  })

  describe('Concurrent assigns race for the last seat', () => {
    beforeEach(resetTableState)

    test('two concurrent assigns → exactly one wins', async () => {
      // Open the table with a 3-guest reg so exactly 1 seat remains.
      await prisma.registration.create({
        data: {
          eventId: testEvent.id,
          guestsCount: 3,
          status: 'CONFIRMED',
          confirmationCode: 'OPENR1',
          phoneNumber: '0502000001',
          data: { name: 'Opener' },
          tableId: sharedTable.id,
        },
      })
      await prisma.table.update({
        where: { id: sharedTable.id },
        data: { status: 'RESERVED' },
      })

      // Seed two WAITLIST regs both asking for the single remaining seat.
      const [wait1, wait2] = await Promise.all([
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            guestsCount: 1,
            status: 'WAITLIST',
            waitlistPriority: 1,
            confirmationCode: 'RACE01',
            phoneNumber: '0502000002',
            data: { name: 'Racer 1' },
          },
        }),
        prisma.registration.create({
          data: {
            eventId: testEvent.id,
            guestsCount: 1,
            status: 'WAITLIST',
            waitlistPriority: 2,
            confirmationCode: 'RACE02',
            phoneNumber: '0502000003',
            data: { name: 'Racer 2' },
          },
        }),
      ])

      // Each "admin" runs a Serializable transaction that:
      //   1) loads the target with its CONFIRMED regs
      //   2) computes occupied + incoming and rejects if it exceeds capacity
      //   3) updates the reg to CONFIRMED + sets tableId
      //
      // This matches what POST /waitlist/[regId]/assign does in production.
      const assign = async (regId: string) => {
        try {
          return await prisma.$transaction(
            async (tx) => {
              const target = await tx.table.findUnique({
                where: { id: sharedTable.id },
                include: {
                  registrations: {
                    where: { status: 'CONFIRMED' },
                    select: { guestsCount: true },
                  },
                },
              })
              const incoming = 1
              const occupied = (target?.registrations ?? []).reduce(
                (s, r) => s + (r.guestsCount ?? 0),
                0
              )
              if (!target || occupied + incoming > target.capacity) {
                throw new Error('Not enough remaining seats on target table')
              }

              await tx.registration.update({
                where: { id: regId },
                data: {
                  status: 'CONFIRMED',
                  waitlistPriority: null,
                  tableId: sharedTable.id,
                },
              })
              return { success: true as const }
            },
            { isolationLevel: 'Serializable', timeout: 10000 }
          )
        } catch (e: any) {
          return { success: false as const, error: e.message as string }
        }
      }

      const [r1, r2] = await Promise.all([assign(wait1.id), assign(wait2.id)])

      // Exactly one must have succeeded.
      const winners = [r1, r2].filter((r) => r.success)
      const losers = [r1, r2].filter((r) => !r.success)
      expect(winners).toHaveLength(1)
      expect(losers).toHaveLength(1)

      // And the loser's error must describe seat exhaustion, not some unrelated crash.
      const loser = losers[0]
      if (!loser.success) {
        expect(loser.error).toMatch(/seats|serializ/i)
      }

      // DB state check: the table should have exactly 2 CONFIRMED regs, totalling 4 guests.
      const tableAfter = await prisma.table.findUnique({
        where: { id: sharedTable.id },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true, guestsCount: true },
          },
        },
      })
      expect(tableAfter?.registrations).toHaveLength(2)
      const total = tableAfter?.registrations.reduce((s, r) => s + (r.guestsCount ?? 0), 0)
      expect(total).toBe(4)
    })
  })
})
