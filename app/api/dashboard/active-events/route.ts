import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build where clause based on admin role
    const where: any = {
      status: 'OPEN',
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

    const cacheKey =
      admin.role === 'SUPER_ADMIN'
        ? ['dashboard-active-events', 'super', (where.schoolId as string) ?? 'all']
        : ['dashboard-active-events', admin.schoolId ?? 'none']

    const fetchActiveEvents = unstable_cache(
      async () => {
        const [events, regGroups] = await Promise.all([
          prisma.event.findMany({
            where,
            select: {
              id: true,
              title: true,
              startAt: true,
              endAt: true,
              location: true,
              capacity: true,
            },
            orderBy: { startAt: 'asc' },
          }),
          prisma.registration.groupBy({
            by: ['eventId', 'status'],
            where: { event: { ...where } },
            _sum: { spotsCount: true },
          }),
        ])
        return { events, regGroups }
      },
      cacheKey,
      { revalidate: 30 }
    )

    const { events, regGroups } = await fetchActiveEvents()

    const regMap: Record<string, { confirmed: number; waitlist: number }> = {}
    for (const group of regGroups) {
      if (!regMap[group.eventId]) regMap[group.eventId] = { confirmed: 0, waitlist: 0 }
      const spots = group._sum.spotsCount ?? 0
      if (group.status === 'CONFIRMED') regMap[group.eventId].confirmed += spots
      if (group.status === 'WAITLIST') regMap[group.eventId].waitlist += spots
    }

    const eventsWithDetails = events.map((event) => {
      const { confirmed: confirmedCount = 0, waitlist: waitlistCount = 0 } = regMap[event.id] ?? {}
      const occupancyRate =
        event.capacity > 0 ? Math.round((confirmedCount / event.capacity) * 100) : 0
      return {
        id: event.id,
        title: event.title,
        startAt: event.startAt,
        endAt: event.endAt,
        location: event.location,
        capacity: event.capacity,
        confirmedCount,
        waitlistCount,
        totalRegistrations: confirmedCount + waitlistCount,
        occupancyRate,
        availableSpots: Math.max(0, event.capacity - confirmedCount),
      }
    })

    return NextResponse.json({
      count: events.length,
      events: eventsWithDetails,
    })
  } catch (error) {
    logger.error('Error fetching active events', { source: 'dashboard', error })
    return NextResponse.json({ error: 'Failed to fetch active events' }, { status: 500 })
  }
}
