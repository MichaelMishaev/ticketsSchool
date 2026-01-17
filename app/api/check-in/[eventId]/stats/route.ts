import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/check-in/[eventId]/stats
 * Get check-in statistics for event (admin authenticated)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    // Authenticate admin
    const admin = await requireAdmin()
    const { eventId } = await params

    // Verify event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        schoolId: true,
        title: true,
        startAt: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (non-super admins)
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    // Get registration statistics
    const totalRegistrations = await prisma.registration.count({
      where: {
        eventId,
        status: { in: ['CONFIRMED', 'WAITLIST'] }, // Exclude cancelled
      },
    })

    // Get checked-in count (not undone)
    const checkedInCount = await prisma.checkIn.count({
      where: {
        registration: {
          eventId,
        },
        undoneAt: null, // Only count active check-ins
      },
    })

    // Count late arrivals (checked in 30+ min after event start)
    const lateCount = await prisma.checkIn.count({
      where: {
        registration: {
          eventId,
        },
        undoneAt: null,
        isLate: true,
      },
    })

    const onTimeCount = checkedInCount - lateCount

    const checkInPercentage =
      totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0

    const latePercentage = checkedInCount > 0 ? Math.round((lateCount / checkedInCount) * 100) : 0

    return NextResponse.json({
      totalRegistrations,
      checkedInCount,
      notCheckedInCount: totalRegistrations - checkedInCount,
      checkInPercentage,
      // Late arrival stats
      checkedInOnTime: onTimeCount,
      checkedInLate: lateCount,
      latePercentage,
      event: {
        title: event.title,
        startAt: event.startAt,
      },
    })
  } catch (error) {
    logger.error('Error fetching check-in stats', { source: 'check-in', error })
    return NextResponse.json({ error: 'Failed to load statistics' }, { status: 500 })
  }
}
