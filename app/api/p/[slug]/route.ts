import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const event = await prisma.event.findUnique({
      where: { slug },
      include: {
        _count: {
          select: {
            registrations: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Calculate total spots taken by summing spotsCount from CONFIRMED registrations
    const confirmedRegistrations = await prisma.registration.findMany({
      where: {
        eventId: event.id,
        status: 'CONFIRMED'
      },
      select: {
        spotsCount: true
      }
    })

    const totalSpotsTaken = confirmedRegistrations.reduce(
      (sum, reg) => sum + reg.spotsCount,
      0
    )

    // Return only public information
    return NextResponse.json({
      id: event.id,
      title: event.title,
      description: event.description,
      gameType: event.gameType,
      location: event.location,
      startAt: event.startAt,
      endAt: event.endAt,
      capacity: event.capacity,
      status: event.status,
      maxSpotsPerPerson: event.maxSpotsPerPerson,
      fieldsSchema: event.fieldsSchema,
      conditions: event.conditions,
      requireAcceptance: event.requireAcceptance,
      completionMessage: event.completionMessage,
      _count: event._count,
      totalSpotsTaken
    })
  } catch (error) {
    console.error('Error fetching event:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event' },
      { status: 500 }
    )
  }
}