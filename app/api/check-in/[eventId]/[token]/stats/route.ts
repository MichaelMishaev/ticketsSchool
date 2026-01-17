import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCheckInTokenFormat } from '@/lib/check-in-token'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/check-in/[eventId]/[token]/stats
 * Get live check-in statistics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string; token: string }> }
) {
  try {
    const { eventId, token } = await params

    // Validate token format
    if (!validateCheckInTokenFormat(token)) {
      return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
    }

    // Verify event exists and token matches
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        checkInToken: true,
        title: true,
        startAt: true
      }
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.checkInToken !== token) {
      return NextResponse.json({ error: 'Invalid check-in token' }, { status: 401 })
    }

    // Get registration statistics
    const totalRegistrations = await prisma.registration.count({
      where: {
        eventId,
        status: { in: ['CONFIRMED', 'WAITLIST'] } // Exclude cancelled
      }
    })

    // Get checked-in count (not undone)
    const checkedInCount = await prisma.checkIn.count({
      where: {
        registration: {
          eventId
        },
        undoneAt: null // Only count active check-ins
      }
    })

    // Get status breakdown
    const statusBreakdown = await prisma.registration.groupBy({
      by: ['status'],
      where: {
        eventId,
        status: { in: ['CONFIRMED', 'WAITLIST'] }
      },
      _count: {
        status: true
      }
    })

    const stats = {
      total: totalRegistrations,
      checkedIn: checkedInCount,
      notCheckedIn: totalRegistrations - checkedInCount,
      percentageCheckedIn:
        totalRegistrations > 0
          ? Math.round((checkedInCount / totalRegistrations) * 100)
          : 0,
      breakdown: {
        confirmed: statusBreakdown.find(s => s.status === 'CONFIRMED')?._count.status || 0,
        waitlist: statusBreakdown.find(s => s.status === 'WAITLIST')?._count.status || 0
      },
      event: {
        title: event.title,
        startAt: event.startAt
      }
    }

    return NextResponse.json(stats)
  } catch (error) {
    logger.error('Error fetching check-in stats', { source: 'check-in', error })
    return NextResponse.json(
      { error: 'Failed to load statistics' },
      { status: 500 }
    )
  }
}
