import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * POST /api/events/[id]/waitlist/[regId]/assign
 * Manually assign waitlist registration to a specific table
 * Admin only - requires schoolId verification
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; regId: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: eventId, regId: registrationId } = await params
    const body = await request.json()
    const { tableId, force } = body

    if (!tableId) {
      return NextResponse.json({ error: 'Table ID is required' }, { status: 400 })
    }

    // Verify event belongs to admin's school (unless SUPER_ADMIN)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        schoolId: true,
        eventType: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Multi-tenant security check
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }

      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Only table-based events have table assignment
    if (event.eventType !== 'TABLE_BASED') {
      return NextResponse.json(
        { error: 'Table assignment is only for table-based events' },
        { status: 400 }
      )
    }

    // Perform assignment in transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Fetch registration
        const registration = await tx.registration.findUnique({
          where: { id: registrationId },
          select: {
            id: true,
            eventId: true,
            status: true,
            guestsCount: true,
            confirmationCode: true,
            phoneNumber: true,
            data: true,
            waitlistPriority: true,
          },
        })

        if (!registration) {
          throw new Error('Registration not found')
        }

        if (registration.eventId !== eventId) {
          throw new Error('Registration does not belong to this event')
        }

        if (registration.status !== 'WAITLIST') {
          throw new Error(`Cannot assign registration with status: ${registration.status}`)
        }

        // Fetch table + its current CONFIRMED registrations (sharing-aware)
        const table = await tx.table.findUnique({
          where: { id: tableId },
          select: {
            id: true,
            eventId: true,
            tableNumber: true,
            capacity: true,
            minOrder: true,
            status: true,
            registrations: {
              where: { status: 'CONFIRMED' },
              select: { id: true, guestsCount: true },
            },
          },
        })

        if (!table) {
          throw new Error('Table not found')
        }

        if (table.eventId !== eventId) {
          throw new Error('Table does not belong to this event')
        }

        // INACTIVE = admin hold, not bookable. RESERVED = now valid (sharing allowed).
        if (table.status === 'INACTIVE') {
          throw new Error(`Table ${table.tableNumber} is on hold (INACTIVE)`)
        }

        // Verify incoming group count
        const incoming = registration.guestsCount || 0
        if (incoming < 1) {
          throw new Error('Registration has no guest count set')
        }

        // Shared-seat capacity check: sum existing occupants + incoming must fit
        const occupied = table.registrations.reduce((n, r) => n + (r.guestsCount ?? 0), 0)
        const isEmpty = table.registrations.length === 0

        if (occupied + incoming > table.capacity) {
          throw new Error(
            `Not enough remaining seats on table ${table.tableNumber} (${table.capacity - occupied} free, ${incoming} requested)`
          )
        }

        // minOrder is an "open the table" gate, not a per-reg rule.
        // Only enforced when table is currently empty; skipped when sharing.
        if (isEmpty && incoming < table.minOrder && !force) {
          throw new Error(
            `Guest count (${incoming}) is below table minimum order (${table.minOrder})`
          )
        }

        // Update registration to CONFIRMED and point it at the table (single write)
        const updatedRegistration = await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: 'CONFIRMED',
            waitlistPriority: null, // Clear waitlist priority
            tableId: table.id,
          },
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            guestsCount: true,
            phoneNumber: true,
            data: true,
          },
        })

        // Only flip table status to RESERVED when we opened an empty table.
        // An already-RESERVED (shared) table stays RESERVED.
        let updatedTable
        if (isEmpty) {
          updatedTable = await tx.table.update({
            where: { id: tableId },
            data: { status: 'RESERVED' },
            select: {
              id: true,
              tableNumber: true,
              capacity: true,
              minOrder: true,
              status: true,
            },
          })
        } else {
          updatedTable = {
            id: table.id,
            tableNumber: table.tableNumber,
            capacity: table.capacity,
            minOrder: table.minOrder,
            status: table.status,
          }
        }

        return {
          registration: updatedRegistration,
          table: updatedTable,
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000,
      }
    )

    return NextResponse.json({
      success: true,
      message: `Waitlist registration assigned to table ${result.table.tableNumber}`,
      registration: result.registration,
      table: result.table,
    })
  } catch (error: any) {
    logger.error('Waitlist assignment error', { source: 'events', error })

    // Handle auth errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Handle business logic errors with user-friendly messages
    if (
      error.message.includes('not found') ||
      error.message.includes('does not belong') ||
      error.message.includes('Cannot assign') ||
      error.message.includes('on hold') ||
      error.message.includes('no guest count') ||
      error.message.includes('Not enough remaining seats') ||
      error.message.includes('Guest count') ||
      error.message.includes('below table')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(
      { error: 'Failed to assign waitlist registration to table' },
      { status: 500 }
    )
  }
}
