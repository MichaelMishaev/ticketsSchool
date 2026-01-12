import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireSuperAdmin } from '@/lib/auth.server'

export async function POST() {
  try {
    // This is a system-wide operation - require SUPER_ADMIN access
    await requireSuperAdmin()

    console.log('🔧 Starting registration status fix...')

    const events = await prisma.event.findMany({
      include: {
        registrations: {
          orderBy: { createdAt: 'asc' },
          where: { status: { not: 'CANCELLED' } }
        }
      }
    })

    const fixes: Array<{
      eventTitle: string
      registrationCode: string
      oldStatus: string
      newStatus: string
    }> = []

    for (const event of events) {
      let confirmedSpots = 0

      for (const registration of event.registrations) {
        const shouldBeConfirmed = confirmedSpots + registration.spotsCount <= event.capacity
        const currentStatus = registration.status
        const newStatus = shouldBeConfirmed ? 'CONFIRMED' : 'WAITLIST'

        if (currentStatus !== newStatus) {
          fixes.push({
            eventTitle: event.title,
            registrationCode: registration.confirmationCode,
            oldStatus: currentStatus,
            newStatus: newStatus
          })

          await prisma.registration.update({
            where: { id: registration.id },
            data: { status: newStatus }
          })
        }

        if (newStatus === 'CONFIRMED') {
          confirmedSpots += registration.spotsCount
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixes.length} registration status issues`,
      fixes: fixes
    })
  } catch (error) {
    console.error('Error fixing registration statuses:', error)
    return NextResponse.json(
      { error: 'Failed to fix registration statuses' },
      { status: 500 }
    )
  }
}