import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * GET /api/admin/attendance/history?phone={phone}
 * Get attendance history for a specific user across all events
 * Shows how many times they showed up vs registered
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()
    const { searchParams } = new URL(request.url)
    const phone = searchParams.get('phone')

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number required' },
        { status: 400 }
      )
    }

    // Build school filter
    const schoolFilter = admin.role === 'SUPER_ADMIN' ? {} : { schoolId: admin.schoolId }

    // Get all registrations for this phone number in this school
    const registrations = await prisma.registration.findMany({
      where: {
        phoneNumber: phone,
        event: schoolFilter,
        status: { in: ['CONFIRMED', 'WAITLIST'] }
      },
      select: {
        id: true,
        eventId: true,
        status: true,
        checkIn: {
          select: {
            id: true,
            checkedInAt: true,
            undoneAt: true
          }
        },
        event: {
          select: {
            id: true,
            title: true,
            startAt: true
          }
        }
      },
      orderBy: {
        event: {
          startAt: 'desc'
        }
      },
      take: 10 // Last 10 events
    })

    // Calculate stats
    const totalEvents = registrations.length
    const attendedEvents = registrations.filter(
      r => r.checkIn && !r.checkIn.undoneAt
    ).length
    const noShowEvents = totalEvents - attendedEvents
    const attendanceRate = totalEvents > 0
      ? Math.round((attendedEvents / totalEvents) * 100)
      : 0

    // Recent events with attendance status
    const recentEvents = registrations.slice(0, 5).map(reg => ({
      eventId: reg.event.id,
      eventTitle: reg.event.title,
      eventDate: reg.event.startAt,
      attended: !!(reg.checkIn && !reg.checkIn.undoneAt),
      status: reg.status
    }))

    return NextResponse.json({
      phone,
      stats: {
        totalEvents,
        attendedEvents,
        noShowEvents,
        attendanceRate
      },
      recentEvents
    })
  } catch (error) {
    logger.error('Error fetching attendance history', { source: 'admin', error })
    return NextResponse.json(
      { error: 'Failed to load attendance history' },
      { status: 500 }
    )
  }
}
