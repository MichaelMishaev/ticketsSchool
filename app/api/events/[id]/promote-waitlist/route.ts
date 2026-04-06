import { NextRequest, NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { promoteFromWaitlist } from '@/lib/waitlist-promotion'

/**
 * POST /api/events/[id]/promote-waitlist
 * Manually trigger waitlist promotion for available spots
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Require authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()
    const { freedSpots } = data

    // Check event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id },
      select: {
        schoolId: true,
        capacity: true,
        spotsReserved: true,
        status: true,
        deletedAt: true,
      },
    })

    if (!event || event.deletedAt !== null) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (multi-tenant isolation)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: "Forbidden: No access to this school's events" },
        { status: 403 }
      )
    }

    // Validate freed spots
    const availableSpots = event.capacity - event.spotsReserved
    if (freedSpots > availableSpots) {
      return NextResponse.json(
        {
          error: `מבוקש לקדם ${freedSpots} מקומות אבל יש רק ${availableSpots} פנויים`,
          details: {
            requested: freedSpots,
            available: availableSpots,
          },
        },
        { status: 400 }
      )
    }

    // Trigger waitlist promotion
    const result = await promoteFromWaitlist(id, freedSpots || availableSpots)

    return NextResponse.json({
      success: true,
      promoted: result.promoted,
      registrationIds: result.registrationIds,
    })
  } catch (error) {
    console.error('Error promoting waitlist:', error)
    return NextResponse.json({ error: 'Failed to promote waitlist' }, { status: 500 })
  }
}
