import { NextRequest, NextResponse } from 'next/server'
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

    // Build event where clause based on admin role
    const eventWhere: any = {}

    // Regular admins can only see their school's events
    if (admin.role !== 'SUPER_ADMIN') {
      // CRITICAL: Non-super admins MUST have a schoolId to prevent seeing all events
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      eventWhere.schoolId = admin.schoolId
    }

    // Super admins can filter by school via query param
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        eventWhere.schoolId = schoolId
      }
    }

    const [regGroups, recentRegs] = await Promise.all([
      prisma.registration.groupBy({
        by: ['eventId'],
        where: { status: 'CONFIRMED', event: eventWhere },
        _sum: { spotsCount: true },
        _count: { id: true },
      }),
      prisma.registration.findMany({
        where: { status: 'CONFIRMED', event: eventWhere },
        select: {
          id: true,
          confirmationCode: true,
          email: true,
          spotsCount: true,
          createdAt: true,
          event: { select: { id: true, title: true, startAt: true, location: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

    const eventIds = regGroups.map((g) => g.eventId)
    const events =
      eventIds.length > 0
        ? await prisma.event.findMany({
            where: { id: { in: eventIds } },
            select: { id: true, title: true, startAt: true, location: true },
          })
        : []
    const eventById = Object.fromEntries(events.map((e) => [e.id, e]))

    const byEvent = regGroups.map((group) => ({
      event: eventById[group.eventId],
      registrationCount: group._count.id,
      registrations: [] as any[],
      totalSpots: group._sum.spotsCount ?? 0,
    }))

    const totalRegistrations = regGroups.reduce((s, g) => s + g._count.id, 0)
    const totalSpots = regGroups.reduce((s, g) => s + (g._sum.spotsCount ?? 0), 0)

    return NextResponse.json({
      totalRegistrations,
      totalSpots,
      byEvent,
      recentRegistrations: recentRegs,
    })
  } catch (error) {
    logger.error('Error fetching registrations', { source: 'dashboard', error })
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}
