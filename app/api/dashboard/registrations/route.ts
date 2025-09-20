import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const registrations = await prisma.registration.findMany({
      where: {
        status: 'CONFIRMED'
      },
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
    console.error('Error fetching registrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    )
  }
}