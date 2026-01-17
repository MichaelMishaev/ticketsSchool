import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/events/[id]/waitlist
 * Get waitlist registrations with matching available tables
 * Admin only - requires schoolId verification
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    const { id: eventId } = await params

    // Verify event belongs to admin's school (unless SUPER_ADMIN)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        schoolId: true,
        eventType: true,
        title: true
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

    // Only table-based events have waitlist management
    if (event.eventType !== 'TABLE_BASED') {
      return NextResponse.json(
        { error: 'Waitlist management is only for table-based events' },
        { status: 400 }
      )
    }

    // Fetch waitlist and available tables in parallel
    const [waitlistRegistrations, availableTables] = await Promise.all([
      prisma.registration.findMany({
        where: {
          eventId,
          status: 'WAITLIST'
        },
        orderBy: { waitlistPriority: 'asc' },
        select: {
          id: true,
          confirmationCode: true,
          guestsCount: true,
          phoneNumber: true,
          data: true,
          waitlistPriority: true,
          createdAt: true
        }
      }),
      prisma.table.findMany({
        where: {
          eventId,
          status: 'AVAILABLE'
        },
        orderBy: { tableOrder: 'asc' },
        select: {
          id: true,
          tableNumber: true,
          capacity: true,
          minOrder: true,
          tableOrder: true
        }
      })
    ])

    // Compute matching tables for each waitlist entry
    const waitlistWithMatches = waitlistRegistrations.map(registration => {
      const guestCount = registration.guestsCount || 0

      // Find all tables that could fit this party
      const matchingTables = availableTables.filter(table =>
        guestCount >= table.minOrder && guestCount <= table.capacity
      )

      // Find the best (smallest fitting) table
      const bestTable = matchingTables.length > 0
        ? matchingTables.sort((a, b) => a.capacity - b.capacity)[0]
        : null

      return {
        ...registration,
        matchingTables: matchingTables.map(t => ({
          id: t.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          minOrder: t.minOrder
        })),
        bestTable: bestTable ? {
          id: bestTable.id,
          tableNumber: bestTable.tableNumber,
          capacity: bestTable.capacity
        } : null,
        hasMatch: matchingTables.length > 0
      }
    })

    return NextResponse.json({
      waitlist: waitlistWithMatches,
      stats: {
        totalWaitlist: waitlistRegistrations.length,
        withMatches: waitlistWithMatches.filter(w => w.hasMatch).length,
        withoutMatches: waitlistWithMatches.filter(w => !w.hasMatch).length,
        availableTables: availableTables.length
      }
    })
  } catch (error: any) {
    logger.error('Waitlist fetch error', { source: 'events', error })

    // Handle auth errors
    if (error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}
