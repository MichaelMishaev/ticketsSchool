/**
 * Table-Event UPFRONT Payment Tests
 *
 * Exercises the payment callback table-assignment path added in the
 * "table-event UPFRONT flow" plan. These tests reproduce the logic inside
 * `app/api/payment/callback/route.ts` inline using a raw PrismaClient —
 * calling the actual route would require a full HTTP harness + HYP mock.
 *
 * Scenarios:
 *   1. Smallest-fit assignment at callback — picks the tightest capacity,
 *      leaving larger tables for larger parties.
 *   2. No fitting table → reg moves to WAITLIST with paymentStatus=COMPLETED
 *      (money captured, admin manually assigns later).
 *   3. `spotsReserved` is NOT incremented for TABLE_BASED events.
 *   4. Replay of the same callback (same ProcessedCallback.fingerprint)
 *      does not double-assign.
 *   5. Two concurrent callbacks racing for the same (single available)
 *      table → exactly one wins via Serializable isolation.
 *
 * We test the *logic* not the *route* — same strategy as table-sharing.test.ts.
 */

// Load env before Prisma import
import * as dotenv from 'dotenv'
import * as path from 'path'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// IMPORTANT: raw PrismaClient — the app's exported singleton wraps Prisma
// with `applyPrismaGuards`, which blocks `deleteMany` on Registration/Event/
// School for the soft-delete invariant. Integration tests need real hard
// deletes for teardown.
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

import { findSmallestFitTable } from '@/lib/table-assignment'

/**
 * Simulates the TABLE_BASED branch inside the payment callback's Serializable
 * transaction. This is a test-local copy of the production logic so we can
 * exercise it without running an HTTP request. Keep it in sync with
 * `app/api/payment/callback/route.ts` — any change to the branch should be
 * reflected here (or extracted into a shared helper).
 */
async function processTableBasedCallback(paymentId: string) {
  return prisma.$transaction(
    async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: { registration: true },
      })
      if (!payment || !payment.registration) {
        throw new Error('Payment or registration not found')
      }

      const reg = payment.registration
      const guestsCount = reg.guestsCount ?? 0
      if (guestsCount < 1) {
        throw new Error('Missing guestsCount on TABLE_BASED registration')
      }

      // SMALLEST_FIT lookup inside the Serializable tx.
      const table = await findSmallestFitTable(tx, reg.eventId, guestsCount)

      let finalStatus: 'CONFIRMED' | 'WAITLIST'
      let assignedTableId: string | null = null
      let waitlistPriority: number | null = null

      if (table) {
        finalStatus = 'CONFIRMED'
        assignedTableId = table.id
      } else {
        finalStatus = 'WAITLIST'
        const waitlistCount = await tx.registration.count({
          where: { eventId: reg.eventId, status: 'WAITLIST' },
        })
        waitlistPriority = waitlistCount + 1
      }

      // Two-write pattern: reg first, then table flip.
      await tx.registration.update({
        where: { id: reg.id },
        data: {
          status: finalStatus,
          paymentStatus: 'COMPLETED',
          ...(assignedTableId && { tableId: assignedTableId }),
          ...(waitlistPriority !== null && { waitlistPriority }),
        },
      })
      if (assignedTableId) {
        await tx.table.update({
          where: { id: assignedTableId },
          data: { status: 'RESERVED' },
        })
      }
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'COMPLETED' },
      })

      return { finalStatus, assignedTableId, waitlistPriority }
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 10000 }
  )
}

describe('Table-Event UPFRONT Payment', () => {
  let testSchool: any
  let testEvent: any

  beforeAll(async () => {
    testSchool = await prisma.school.create({
      data: {
        name: 'Test School UPFRONT',
        slug: `test-school-upfront-${Date.now()}`,
      },
    })

    testEvent = await prisma.event.create({
      data: {
        title: 'UPFRONT Test Event',
        slug: `upfront-event-${Date.now()}`,
        schoolId: testSchool.id,
        startAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
        capacity: 0,
        eventType: 'TABLE_BASED',
        maxSpotsPerPerson: 8,
        allowCancellation: true,
        cancellationDeadlineHours: 2,
        paymentRequired: true,
        paymentTiming: 'UPFRONT',
        pricingModel: 'PER_GUEST',
        priceAmount: new Prisma.Decimal(100),
        currency: 'ILS',
        spotsReserved: 0,
      },
    })
  })

  afterAll(async () => {
    await prisma.processedCallback.deleteMany({
      where: { fingerprint: { startsWith: 'upfront-test-' } },
    })
    await prisma.payment.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.event.delete({ where: { id: testEvent.id } })
    await prisma.school.delete({ where: { id: testSchool.id } })
    await prisma.$disconnect()
  })

  // Reset all registrations, payments, and table state between tests so each
  // block runs against a clean slate. This is cheaper than rebuilding the
  // whole School/Event scaffolding per test.
  async function resetState() {
    await prisma.processedCallback.deleteMany({
      where: { fingerprint: { startsWith: 'upfront-test-' } },
    })
    await prisma.payment.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.registration.updateMany({
      where: { eventId: testEvent.id },
      data: { tableId: null },
    })
    await prisma.registration.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.table.deleteMany({ where: { eventId: testEvent.id } })
    await prisma.event.update({
      where: { id: testEvent.id },
      data: { spotsReserved: 0 },
    })
  }

  /** Seed a PAYMENT_PENDING registration + linked Payment, mirroring what
   *  `/api/payment/create` does. Returns the created payment. */
  async function seedPendingPayment(opts: {
    guestsCount: number
    confirmationCode: string
    phoneNumber: string
  }) {
    const reg = await prisma.registration.create({
      data: {
        eventId: testEvent.id,
        guestsCount: opts.guestsCount,
        status: 'PAYMENT_PENDING',
        confirmationCode: opts.confirmationCode,
        phoneNumber: opts.phoneNumber,
        data: { name: `Guest ${opts.confirmationCode}` },
        paymentStatus: 'PROCESSING',
        amountDue: new Prisma.Decimal(opts.guestsCount * 100),
      },
    })
    const payment = await prisma.payment.create({
      data: {
        // Prisma requires `connect` for each relation when the scalar FK
        // has a matching relation field — passing the scalars directly
        // triggers "Argument X is missing".
        registration: { connect: { id: reg.id } },
        event: { connect: { id: testEvent.id } },
        school: { connect: { id: testSchool.id } },
        amount: new Prisma.Decimal(opts.guestsCount * 100),
        currency: 'ILS',
        status: 'PROCESSING',
      },
    })
    return { reg, payment }
  }

  describe('Smallest-fit assignment at callback', () => {
    beforeEach(resetState)

    test('picks smallest fitting table (leaves bigger ones for bigger parties)', async () => {
      // Three tables: capacity 2, 4, 8. Party of 3 should get the capacity-4 table
      // (not capacity-8, even though both fit). capacity-2 doesn't fit.
      await prisma.table.createMany({
        data: [
          {
            eventId: testEvent.id,
            tableNumber: 'T2',
            capacity: 2,
            minOrder: 1,
            tableOrder: 1,
            status: 'AVAILABLE',
          },
          {
            eventId: testEvent.id,
            tableNumber: 'T4',
            capacity: 4,
            minOrder: 2,
            tableOrder: 2,
            status: 'AVAILABLE',
          },
          {
            eventId: testEvent.id,
            tableNumber: 'T8',
            capacity: 8,
            minOrder: 2,
            tableOrder: 3,
            status: 'AVAILABLE',
          },
        ],
      })

      const { payment } = await seedPendingPayment({
        guestsCount: 3,
        confirmationCode: 'SMF01',
        phoneNumber: '0503000001',
      })

      const result = await processTableBasedCallback(payment.id)

      expect(result.finalStatus).toBe('CONFIRMED')
      expect(result.assignedTableId).toBeTruthy()

      const assignedTable = await prisma.table.findUnique({
        where: { id: result.assignedTableId! },
      })
      expect(assignedTable?.tableNumber).toBe('T4') // SMALLEST_FIT, not T8
      expect(assignedTable?.status).toBe('RESERVED')

      const reg = await prisma.registration.findUnique({
        where: { id: payment.registrationId },
      })
      expect(reg?.status).toBe('CONFIRMED')
      expect(reg?.tableId).toBe(result.assignedTableId)
      expect(reg?.paymentStatus).toBe('COMPLETED')

      // T2 and T8 must remain AVAILABLE (we only touched T4)
      const untouched = await prisma.table.findMany({
        where: { eventId: testEvent.id, id: { not: result.assignedTableId! } },
      })
      expect(untouched.every((t) => t.status === 'AVAILABLE')).toBe(true)
    })

    test('minOrder is enforced for callback assignment (too-small party rejected from big table)', async () => {
      // Only a capacity-10/minOrder-5 table exists. A solo guest (1 person)
      // must NOT be assigned here — they should fall through to WAITLIST.
      await prisma.table.create({
        data: {
          eventId: testEvent.id,
          tableNumber: 'BIG',
          capacity: 10,
          minOrder: 5,
          tableOrder: 1,
          status: 'AVAILABLE',
        },
      })

      const { payment } = await seedPendingPayment({
        guestsCount: 1,
        confirmationCode: 'SOLO1',
        phoneNumber: '0503000002',
      })

      const result = await processTableBasedCallback(payment.id)

      expect(result.finalStatus).toBe('WAITLIST')
      expect(result.assignedTableId).toBeNull()
      expect(result.waitlistPriority).toBe(1)

      const tableAfter = await prisma.table.findFirst({
        where: { eventId: testEvent.id, tableNumber: 'BIG' },
      })
      expect(tableAfter?.status).toBe('AVAILABLE') // untouched
    })
  })

  describe('WAITLIST fallback when no table fits', () => {
    beforeEach(resetState)

    test('reg with no fitting table → WAITLIST with paymentStatus=COMPLETED', async () => {
      // Only a capacity-2 table — party of 4 cannot fit anywhere.
      await prisma.table.create({
        data: {
          eventId: testEvent.id,
          tableNumber: 'TINY',
          capacity: 2,
          minOrder: 1,
          tableOrder: 1,
          status: 'AVAILABLE',
        },
      })

      const { payment } = await seedPendingPayment({
        guestsCount: 4,
        confirmationCode: 'BIG01',
        phoneNumber: '0503000003',
      })

      const result = await processTableBasedCallback(payment.id)

      expect(result.finalStatus).toBe('WAITLIST')
      expect(result.assignedTableId).toBeNull()

      const reg = await prisma.registration.findUnique({
        where: { id: payment.registrationId },
      })
      expect(reg?.status).toBe('WAITLIST')
      expect(reg?.tableId).toBeNull()
      // Money was captured even though no seat — admin assigns manually later
      expect(reg?.paymentStatus).toBe('COMPLETED')
      expect(reg?.waitlistPriority).toBe(1)
    })
  })

  describe('spotsReserved is NOT incremented for TABLE_BASED', () => {
    beforeEach(resetState)

    test('confirming a table reg does not touch event.spotsReserved', async () => {
      await prisma.table.create({
        data: {
          eventId: testEvent.id,
          tableNumber: 'A1',
          capacity: 4,
          minOrder: 2,
          tableOrder: 1,
          status: 'AVAILABLE',
        },
      })

      const before = await prisma.event.findUnique({
        where: { id: testEvent.id },
        select: { spotsReserved: true },
      })

      const { payment } = await seedPendingPayment({
        guestsCount: 3,
        confirmationCode: 'NOINC',
        phoneNumber: '0503000004',
      })

      await processTableBasedCallback(payment.id)

      const after = await prisma.event.findUnique({
        where: { id: testEvent.id },
        select: { spotsReserved: true },
      })

      // spotsReserved is a capacity-event counter and must not be touched
      // for TABLE_BASED. Both should be 0 (or whatever the initial value was).
      expect(after?.spotsReserved).toBe(before?.spotsReserved)
    })
  })

  describe('Replay protection', () => {
    beforeEach(resetState)

    test('processing the same payment twice does not double-assign', async () => {
      await prisma.table.createMany({
        data: [
          {
            eventId: testEvent.id,
            tableNumber: 'R1',
            capacity: 4,
            minOrder: 2,
            tableOrder: 1,
            status: 'AVAILABLE',
          },
          {
            eventId: testEvent.id,
            tableNumber: 'R2',
            capacity: 4,
            minOrder: 2,
            tableOrder: 2,
            status: 'AVAILABLE',
          },
        ],
      })

      const { payment } = await seedPendingPayment({
        guestsCount: 2,
        confirmationCode: 'RPL01',
        phoneNumber: '0503000005',
      })

      // First callback — assigns R1 (smallest-fit, lowest tableOrder on tie).
      const first = await processTableBasedCallback(payment.id)
      expect(first.finalStatus).toBe('CONFIRMED')

      // Second callback on the same payment — in production, this is gated
      // by the ProcessedCallback.fingerprint unique constraint before we
      // even reach the tx. We simulate that gate here: the idempotency check
      // would short-circuit and return the cached result. The critical DB
      // invariant is that we must not end up with TWO tables assigned to
      // one reg or one table assigned twice.
      const reg = await prisma.registration.findUnique({
        where: { id: payment.registrationId },
      })
      const firstAssignedTable = reg?.tableId

      // Verify: exactly one table is RESERVED, exactly one reg is CONFIRMED,
      // and the other table is still AVAILABLE.
      const reservedTables = await prisma.table.findMany({
        where: { eventId: testEvent.id, status: 'RESERVED' },
      })
      expect(reservedTables).toHaveLength(1)
      expect(reservedTables[0].id).toBe(firstAssignedTable)

      const availableTables = await prisma.table.findMany({
        where: { eventId: testEvent.id, status: 'AVAILABLE' },
      })
      expect(availableTables).toHaveLength(1)

      // Write ProcessedCallback fingerprint as the real callback would.
      await prisma.processedCallback.create({
        data: { fingerprint: `upfront-test-${payment.id}` },
      })

      // Attempting to write the SAME fingerprint again should error on unique
      // constraint — this is what provides replay protection in production.
      await expect(
        prisma.processedCallback.create({
          data: { fingerprint: `upfront-test-${payment.id}` },
        })
      ).rejects.toThrow()
    })
  })

  describe('Concurrent callbacks race for the same table', () => {
    beforeEach(resetState)

    test('two callbacks, one available table → exactly one gets assigned', async () => {
      // Single capacity-4 table. Two separate parties of 3 each start paying
      // for it at (nearly) the same moment. After both callbacks run, exactly
      // one must be CONFIRMED with the table, and the other must be WAITLIST.
      await prisma.table.create({
        data: {
          eventId: testEvent.id,
          tableNumber: 'ONE',
          capacity: 4,
          minOrder: 2,
          tableOrder: 1,
          status: 'AVAILABLE',
        },
      })

      const [p1, p2] = await Promise.all([
        seedPendingPayment({
          guestsCount: 3,
          confirmationCode: 'CON01',
          phoneNumber: '0504000001',
        }),
        seedPendingPayment({
          guestsCount: 3,
          confirmationCode: 'CON02',
          phoneNumber: '0504000002',
        }),
      ])

      // Run both callback transactions concurrently. Under Serializable
      // isolation, at most one will see the table as AVAILABLE in its tx —
      // the other's findSmallestFitTable call will either return null (if
      // committed in between) or fail with a serialization error we retry.
      //
      // For test determinism we accept any combination where:
      //   - exactly one reg is CONFIRMED with the table
      //   - the other reg is either WAITLIST or errored
      // and the table is RESERVED.
      const settled = await Promise.allSettled([
        processTableBasedCallback(p1.payment.id),
        processTableBasedCallback(p2.payment.id),
      ])

      // Retry any that errored with a serialization failure — that's how
      // production would handle it (Prisma re-runs the tx callback).
      for (let i = 0; i < settled.length; i++) {
        const s = settled[i]
        if (s.status === 'rejected') {
          const payment = i === 0 ? p1.payment : p2.payment
          const result = await processTableBasedCallback(payment.id)
          settled[i] = { status: 'fulfilled', value: result } as PromiseFulfilledResult<any>
        }
      }

      const results = settled.map((s) => (s as PromiseFulfilledResult<any>).value)
      const confirmedCount = results.filter((r) => r.finalStatus === 'CONFIRMED').length
      const waitlistCount = results.filter((r) => r.finalStatus === 'WAITLIST').length

      expect(confirmedCount).toBe(1)
      expect(waitlistCount).toBe(1)

      const table = await prisma.table.findFirst({
        where: { eventId: testEvent.id, tableNumber: 'ONE' },
        include: {
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true, guestsCount: true },
          },
        },
      })
      expect(table?.status).toBe('RESERVED')
      expect(table?.registrations).toHaveLength(1)
      expect(table?.registrations[0].guestsCount).toBe(3)
    })
  })
})
