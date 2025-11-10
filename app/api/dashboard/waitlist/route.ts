import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

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
      status: 'WAITLIST'
    }

    // Regular admins can only see their school's events
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
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

    const waitlistRegistrations = await prisma.registration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            location: true,
            capacity: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc' // First come, first served for waitlist
      }
    })

    const waitlistByEvent = waitlistRegistrations.reduce((acc, reg) => {
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

    const totalSpots = waitlistRegistrations.reduce((sum, reg) => sum + reg.spotsCount, 0)

    return NextResponse.json({
      totalWaitlist: waitlistRegistrations.length,
      totalSpots,
      byEvent: Object.values(waitlistByEvent),
      recentWaitlist: waitlistRegistrations.slice(0, 10).map(reg => ({
        id: reg.id,
        confirmationCode: reg.confirmationCode,
        email: reg.email,
        spotsCount: reg.spotsCount,
        createdAt: reg.createdAt,
        event: reg.event,
        position: waitlistRegistrations.findIndex(r => r.id === reg.id) + 1
      }))
    })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json(
      { error: 'Failed to fetch waitlist' },
      { status: 500 }
    )
  }
}