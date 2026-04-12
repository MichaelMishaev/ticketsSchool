import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin, requireSchoolAccess } from '@/lib/auth.server'

// ─── Body types ──────────────────────────────────────────────────────────────

interface MoveToWaitlistBody {
  status: 'WAITLIST'
  moveToWaitlist: true
  cancellationReason?: string
  removedFromTable?: boolean
}

interface MoveToTableBody {
  tableId: string
  status?: never
  moveToWaitlist?: never
}

type PatchBody = MoveToWaitlistBody | MoveToTableBody

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Count remaining CONFIRMED registrations on a table (excluding a specific
 * registration id, so we can test "after this reg leaves").
 */
async function countConfirmedOnTable(
  tableId: string,
  excludeRegId?: string
): Promise<number> {
  return prisma.registration.count({
    where: {
      tableId,
      status: 'CONFIRMED',
      ...(excludeRegId ? { id: { not: excludeRegId } } : {}),
    },
  })
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  // 1. Auth
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Params
  const { id: eventId, registrationId } = await params

  // 3. Parse body
  let body: PatchBody
  try {
    body = (await request.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // 4. Fetch registration (include table relation for occupancy checks)
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId, eventId },
  })

  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  // 5. Fetch event for school access check
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { schoolId: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // 6. School access check
  try {
    await requireSchoolAccess(event.schoolId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Use case A: Move to waitlist ──────────────────────────────────────────
  if ('moveToWaitlist' in body && body.moveToWaitlist === true) {
    const oldTableId = registration.tableId

    const updatedRegistration = await prisma.$transaction(async (tx) => {
      // Update registration: clear table, set WAITLIST
      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: {
          status: 'WAITLIST',
          tableId: null,
          cancellationReason: body.cancellationReason ?? null,
        },
      })

      // Conditional table release
      if (oldTableId) {
        const remaining = await tx.registration.count({
          where: {
            tableId: oldTableId,
            status: 'CONFIRMED',
          },
        })

        if (remaining === 0) {
          await tx.table.update({
            where: { id: oldTableId },
            data: { status: 'AVAILABLE' },
          })
        }
      }

      return updated
    })

    return NextResponse.json({ registration: updatedRegistration })
  }

  // ── Use case B: Move to a different table ─────────────────────────────────
  if ('tableId' in body && body.tableId) {
    const targetTableId = body.tableId

    // Fetch target table with its CONFIRMED registrations
    const targetTable = await prisma.table.findUnique({
      where: { id: targetTableId },
      include: {
        registrations: {
          where: { status: 'CONFIRMED' },
          select: { id: true, guestsCount: true },
        },
      },
    })

    if (!targetTable) {
      return NextResponse.json({ error: 'Target table not found' }, { status: 404 })
    }

    if (targetTable.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Table does not belong to this event' },
        { status: 400 }
      )
    }

    if (targetTable.status === 'INACTIVE') {
      return NextResponse.json(
        { error: 'Cannot assign to an INACTIVE table' },
        { status: 422 }
      )
    }

    // Compute occupied + remaining capacity
    const occupiedSpots = targetTable.registrations.reduce(
      (sum, r) => sum + (r.guestsCount ?? 1),
      0
    )
    const remainingSpots = targetTable.capacity - occupiedSpots
    const incomingGuests = registration.guestsCount ?? 1

    if (incomingGuests > remainingSpots) {
      return NextResponse.json(
        {
          error: 'Not enough capacity on target table',
          remainingSpots,
          requested: incomingGuests,
        },
        { status: 422 }
      )
    }

    const oldTableId = registration.tableId
    const targetWasAvailable = targetTable.status === 'AVAILABLE'
    const targetIsEmpty = targetTable.registrations.length === 0

    const updatedRegistration = await prisma.$transaction(async (tx) => {
      // Move registration to new table
      const updated = await tx.registration.update({
        where: { id: registrationId },
        data: { tableId: targetTableId },
      })

      // Flip old table to AVAILABLE if it now has no CONFIRMED regs
      if (oldTableId && oldTableId !== targetTableId) {
        const remaining = await tx.registration.count({
          where: {
            tableId: oldTableId,
            status: 'CONFIRMED',
            id: { not: registrationId },
          },
        })

        if (remaining === 0) {
          await tx.table.update({
            where: { id: oldTableId },
            data: { status: 'AVAILABLE' },
          })
        }
      }

      // Flip new table to RESERVED if it was AVAILABLE and this is the first reg
      if (targetWasAvailable && targetIsEmpty) {
        await tx.table.update({
          where: { id: targetTableId },
          data: { status: 'RESERVED' },
        })
      }

      return updated
    })

    return NextResponse.json({ registration: updatedRegistration })
  }

  return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  // 1. Auth
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Params
  const { id: eventId, registrationId } = await params

  // 3. Fetch registration for tableId + ownership
  const registration = await prisma.registration.findUnique({
    where: { id: registrationId, eventId },
    select: { id: true, tableId: true, status: true },
  })

  if (!registration) {
    return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
  }

  // 4. Fetch event for school access check
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { schoolId: true },
  })

  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  // 5. School access check
  try {
    await requireSchoolAccess(event.schoolId)
  } catch {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 6. Delete + conditional table release in a transaction
  const { tableId } = registration

  await prisma.$transaction(async (tx) => {
    await tx.registration.delete({ where: { id: registrationId } })

    if (tableId) {
      const remaining = await tx.registration.count({
        where: {
          tableId,
          status: 'CONFIRMED',
        },
      })

      if (remaining === 0) {
        await tx.table.update({
          where: { id: tableId },
          data: { status: 'AVAILABLE' },
        })
      }
    }
  })

  return NextResponse.json({ success: true })
}
