import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const eventWhere: Record<string, unknown> = {}

    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned. Please logout and login again.' },
          { status: 403 }
        )
      }
      eventWhere.schoolId = admin.schoolId
    } else {
      const schoolId = new URL(request.url).searchParams.get('schoolId')
      if (schoolId) eventWhere.schoolId = schoolId
    }

    // Cache key is per-school. SUPER_ADMIN key includes their schoolId filter param
    // so different school filters never share a cached result.
    const cacheKey =
      admin.role === 'SUPER_ADMIN'
        ? ['dashboard-stats', 'super', (eventWhere.schoolId as string) ?? 'all']
        : ['dashboard-stats', admin.schoolId ?? 'none']

    const fetchStats = unstable_cache(
      async () => {
        const [activeEventsCount, confirmedAgg, waitlistAgg, capacityAgg] = await Promise.all([
          prisma.event.count({ where: { ...eventWhere, status: 'OPEN' } }),
          prisma.registration.aggregate({
            where: { event: eventWhere, status: 'CONFIRMED' },
            _sum: { spotsCount: true },
          }),
          prisma.registration.aggregate({
            where: { event: eventWhere, status: 'WAITLIST' },
            _sum: { spotsCount: true },
          }),
          prisma.event.aggregate({
            where: eventWhere,
            _sum: { capacity: true },
          }),
        ])
        return { activeEventsCount, confirmedAgg, waitlistAgg, capacityAgg }
      },
      cacheKey,
      { revalidate: 30 }
    )

    const { activeEventsCount, confirmedAgg, waitlistAgg, capacityAgg } = await fetchStats()

    const totalRegistrations = confirmedAgg._sum.spotsCount ?? 0
    const waitlistCount = waitlistAgg._sum.spotsCount ?? 0
    const totalCapacity = capacityAgg._sum.capacity ?? 0
    const occupancyRate =
      totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0

    return NextResponse.json({
      activeEvents: activeEventsCount,
      totalRegistrations,
      waitlistCount,
      occupancyRate,
    })
  } catch (error) {
    logger.error('Error fetching dashboard stats', { source: 'dashboard', error })
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
