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
      return NextResponse.json(
        { error: 'Table ID is required' },
        { status: 400 }
      )
    }

    // Verify event belongs to admin's school (unless SUPER_ADMIN)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        schoolId: true,
        eventType: true
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Multi-tenant security check
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }

      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
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
            waitlistPriority: true
          }
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

        // Fetch table
        const table = await tx.table.findUnique({
          where: { id: tableId },
          select: {
            id: true,
            eventId: true,
            tableNumber: true,
            capacity: true,
            minOrder: true,
            status: true
          }
        })

        if (!table) {
          throw new Error('Table not found')
        }

        if (table.eventId !== eventId) {
          throw new Error('Table does not belong to this event')
        }

        if (table.status !== 'AVAILABLE') {
          throw new Error(`Table ${table.tableNumber} is not available (status: ${table.status})`)
        }

        // Verify guest count fits table constraints
        const guestCount = registration.guestsCount || 0

        // Check minimum order (can be overridden with force flag)
        if (guestCount < table.minOrder && !force) {
          throw new Error(
            `Guest count (${guestCount}) is below table minimum order (${table.minOrder})`
          )
        }

        // Always enforce capacity limit (no override)
        if (guestCount > table.capacity) {
          throw new Error(
            `Guest count (${guestCount}) exceeds table capacity (${table.capacity})`
          )
        }

        // Update registration to CONFIRMED
        const updatedRegistration = await tx.registration.update({
          where: { id: registrationId },
          data: {
            status: 'CONFIRMED',
            waitlistPriority: null // Clear waitlist priority
          },
          select: {
            id: true,
            confirmationCode: true,
            status: true,
            guestsCount: true,
            phoneNumber: true,
            data: true
          }
        })

        // Reserve table
        const updatedTable = await tx.table.update({
          where: { id: tableId },
          data: {
            status: 'RESERVED',
            reservedById: registrationId
          },
          select: {
            id: true,
            tableNumber: true,
            capacity: true,
            minOrder: true,
            status: true
          }
        })

        return {
          registration: updatedRegistration,
          table: updatedTable
        }
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: 10000
      }
    )

    return NextResponse.json({
      success: true,
      message: `Waitlist registration assigned to table ${result.table.tableNumber}`,
      registration: result.registration,
      table: result.table
    })
  } catch (error: any) {
    logger.error('Waitlist assignment error', { source: 'events', error })

    // Handle auth errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Handle business logic errors with user-friendly messages
    if (
      error.message.includes('not found') ||
      error.message.includes('does not belong') ||
      error.message.includes('Cannot assign') ||
      error.message.includes('not available') ||
      error.message.includes('Guest count') ||
      error.message.includes('below table') ||
      error.message.includes('exceeds table')
    ) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to assign waitlist registration to table' },
      { status: 500 }
    )
  }
}
