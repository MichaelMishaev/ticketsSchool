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

    // Build where clause based on admin role
    const where: any = {}

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
      // If SUPER_ADMIN doesn't specify schoolId, show ALL schools
    }

    // Use parallel aggregate queries — avoids loading all registration rows into memory
    const registrationWhere = where.schoolId
      ? { event: { schoolId: where.schoolId as string } }
      : {}

    const [activeEvents, confirmedAgg, waitlistAgg, capacityAgg] = await Promise.all([
      prisma.event.count({ where: { ...where, status: 'OPEN' } }),
      prisma.registration.aggregate({
        where: { status: 'CONFIRMED', ...registrationWhere },
        _sum: { spotsCount: true },
      }),
      prisma.registration.aggregate({
        where: { status: 'WAITLIST', ...registrationWhere },
        _sum: { spotsCount: true },
      }),
      prisma.event.aggregate({
        where,
        _sum: { capacity: true },
      }),
    ])

    const totalRegistrations = confirmedAgg._sum.spotsCount ?? 0
    const waitlistCount = waitlistAgg._sum.spotsCount ?? 0
    const totalCapacity = capacityAgg._sum.capacity ?? 0

    const occupancyRate =
      totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0

    return NextResponse.json({
      activeEvents,
      totalRegistrations,
      waitlistCount,
      occupancyRate,
    })
  } catch (error) {
    logger.error('Error fetching dashboard stats', { source: 'dashboard', error })
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
