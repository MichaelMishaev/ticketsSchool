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
    const where: any = {}

    // Regular admins can only see their school's events
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
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

    // Get events with registration counts (filtered by school)
    const events = await prisma.event.findMany({
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
      }
    })

    // Calculate statistics
    const activeEvents = events.filter(e => e.status === 'OPEN').length

    // Calculate total confirmed registrations and waitlist
    let totalRegistrations = 0
    let waitlistCount = 0
    let totalCapacity = 0

    events.forEach(event => {
      totalCapacity += event.capacity

      event.registrations.forEach(reg => {
        if (reg.status === 'CONFIRMED') {
          totalRegistrations += reg.spotsCount
        } else if (reg.status === 'WAITLIST') {
          waitlistCount += reg.spotsCount
        }
      })
    })

    const occupancyRate = totalCapacity > 0
      ? Math.round((totalRegistrations / totalCapacity) * 100)
      : 0

    return NextResponse.json({
      activeEvents,
      totalRegistrations,
      waitlistCount,
      occupancyRate
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}