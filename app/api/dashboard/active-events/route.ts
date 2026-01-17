import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Build where clause based on admin role
    const where: any = {
      status: 'OPEN'
    }

    // Regular admins can only see their school's events
    if (admin.role !== 'SUPER_ADMIN') {
      // CRITICAL: Non-super admins MUST have a schoolId to prevent seeing all events
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      where.schoolId = admin.schoolId
    }

    // Super admins can filter by school via query param
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        where.schoolId = schoolId
      }
    }

    const activeEvents = await prisma.event.findMany({
      where,
      include: {
        _count: {
          select: {
            registrations: true
          }
        },
        registrations: {
          select: {
            status: true,
            spotsCount: true
          }
        }
      },
      orderBy: {
        startAt: 'asc'
      }
    })

    const eventsWithDetails = activeEvents.map(event => {
      const confirmedCount = event.registrations
        .filter(reg => reg.status === 'CONFIRMED')
        .reduce((sum, reg) => sum + reg.spotsCount, 0)

      const waitlistCount = event.registrations
        .filter(reg => reg.status === 'WAITLIST')
        .reduce((sum, reg) => sum + reg.spotsCount, 0)

      const occupancyRate = event.capacity > 0
        ? Math.round((confirmedCount / event.capacity) * 100)
        : 0

      return {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location,
        capacity: event.capacity,
        confirmedCount,
        waitlistCount,
        totalRegistrations: event._count.registrations,
        occupancyRate,
        availableSpots: Math.max(0, event.capacity - confirmedCount)
      }
    })

    return NextResponse.json({
      count: activeEvents.length,
      events: eventsWithDetails
    })
  } catch (error) {
    logger.error('Error fetching active events', { source: 'dashboard', error })
    return NextResponse.json(
      { error: 'Failed to fetch active events' },
      { status: 500 }
    )
  }
}