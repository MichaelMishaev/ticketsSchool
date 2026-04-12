import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { prisma, Prisma } from '@/lib/prisma'

interface AssignRouteParams {
  params: Promise<{ id: string; regId: string }>
}

interface AssignBody {
  tableId?: string
  force?: boolean
}

interface KnownError {
  statusCode: number
  message?: string
  [key: string]: unknown
}

function isKnownError(err: unknown): err is KnownError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'statusCode' in err &&
    typeof (err as KnownError).statusCode === 'number'
  )
}

export async function POST(
  request: NextRequest,
  { params }: AssignRouteParams
): Promise<NextResponse> {
  // 1. Auth
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse params
  const { id: eventId, regId } = await params

  // 3. Parse body
  let body: AssignBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tableId, force = false } = body

  if (!tableId) {
    return NextResponse.json({ error: 'tableId is required' }, { status: 400 })
  }

  // 4. Transaction (Serializable isolation)
  try {
    const updatedRegistration = await prisma.$transaction(
      async (tx) => {
        // a. Fetch event
        const event = await tx.event.findUnique({
          where: { id: eventId },
          select: { schoolId: true, eventType: true },
        })

        if (!event) {
          throw { statusCode: 404, message: 'Event not found' }
        }

        // b. School access check
        if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
          throw { statusCode: 403 }
        }

        // c. Validate event type
        if (event.eventType !== 'TABLE_BASED') {
          throw {
            statusCode: 422,
            message: 'Only supported for table-based events',
          }
        }

        // d. Fetch the waitlist registration
        const registration = await tx.registration.findUnique({
          where: { id: regId },
          select: { id: true, status: true, guestsCount: true, eventId: true },
        })

        // e. Validate registration
        if (!registration) {
          throw { statusCode: 404, message: 'Registration not found' }
        }
        if (registration.eventId !== eventId) {
          throw {
            statusCode: 400,
            message: 'Registration does not belong to this event',
          }
        }
        if (registration.status !== 'WAITLIST') {
          throw {
            statusCode: 422,
            message: `Registration status must be WAITLIST, got ${registration.status}`,
          }
        }

        // f. Fetch target table with its CONFIRMED registrations
        const table = await tx.table.findUnique({
          where: { id: tableId },
          include: {
            registrations: {
              where: { status: 'CONFIRMED' },
              select: { id: true, guestsCount: true },
            },
          },
        })

        // g. Validate table exists and belongs to eventId
        if (!table) {
          throw { statusCode: 404, message: 'Table not found' }
        }
        if (table.eventId !== eventId) {
          throw {
            statusCode: 400,
            message: 'Table does not belong to this event',
          }
        }

        // h. Check table status
        if (table.status === 'INACTIVE') {
          throw { statusCode: 422, message: 'Table is inactive' }
        }

        // i. Compute occupied seats
        const occupied = table.registrations.reduce(
          (sum, r) => sum + (r.guestsCount ?? 0),
          0
        )

        // j. Incoming guests
        const incoming = registration.guestsCount ?? 0

        // k. Capacity check (always enforced)
        if (occupied + incoming > table.capacity) {
          const remaining = table.capacity - occupied
          throw {
            statusCode: 422,
            message: `Not enough capacity. Remaining: ${remaining}`,
            remaining,
          }
        }

        // l. minOrder check (only when table is empty and force is not set)
        if (
          table.registrations.length === 0 &&
          incoming < table.minOrder &&
          !force
        ) {
          throw {
            statusCode: 422,
            message: `Minimum order is ${table.minOrder}`,
            minOrder: table.minOrder,
          }
        }

        // m. Update registration: confirm it and assign to table
        const updated = await tx.registration.update({
          where: { id: regId },
          data: {
            status: 'CONFIRMED',
            tableId: tableId,
            waitlistPriority: null,
          },
        })

        // n. Flip table to RESERVED if it was AVAILABLE
        if (table.status === 'AVAILABLE') {
          await tx.table.update({
            where: { id: tableId },
            data: { status: 'RESERVED' },
          })
        }

        // o. Return updated registration
        return updated
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    return NextResponse.json(updatedRegistration, { status: 200 })
  } catch (err: unknown) {
    if (isKnownError(err)) {
      const { statusCode, message, ...extras } = err
      return NextResponse.json(
        { error: message ?? 'Request failed', ...extras },
        { status: statusCode }
      )
    }

    console.error('[waitlist/assign] Unexpected error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
