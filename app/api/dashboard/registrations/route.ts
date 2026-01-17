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
      status: 'CONFIRMED'
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
      where.event = {
        schoolId: admin.schoolId
      }
    }

    // Super admins can filter by school via query param
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        where.event = {
          schoolId: schoolId
        }
      }
    }

    const registrations = await prisma.registration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            location: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const registrationsByEvent = registrations.reduce((acc, reg) => {
      const eventId = reg.event.id
      if (!acc[eventId]) {
        acc[eventId] = {
          event: reg.event,
          registrations: [],
          totalSpots: 0
        }
      }
      acc[eventId].registrations.push(reg)
      acc[eventId].totalSpots += reg.spotsCount
      return acc
    }, {} as any)

    const totalSpots = registrations.reduce((sum, reg) => sum + reg.spotsCount, 0)

    return NextResponse.json({
      totalRegistrations: registrations.length,
      totalSpots,
      byEvent: Object.values(registrationsByEvent),
      recentRegistrations: registrations.slice(0, 10).map(reg => ({
        id: reg.id,
        confirmationCode: reg.confirmationCode,
        email: reg.email,
        spotsCount: reg.spotsCount,
        createdAt: reg.createdAt,
        event: reg.event
      }))
    })
  } catch (error) {
    logger.error('Error fetching registrations', { source: 'dashboard', error })
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}