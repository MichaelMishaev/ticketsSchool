import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventFormData } from '@/types'

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 15)
}

export async function GET(request: NextRequest) {
  try {
    const events = await prisma.event.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { registrations: true }
        },
        registrations: {
          where: {
            status: 'CONFIRMED'
          },
          select: {
            spotsCount: true
          }
        }
      }
    })

    // Calculate total spots taken for each event
    const eventsWithSpots = events.map(event => {
      const totalSpotsTaken = event.registrations.reduce(
        (sum, reg) => sum + reg.spotsCount,
        0
      )
      // Remove registrations array from response and add totalSpotsTaken
      const { registrations, ...eventData } = event
      return {
        ...eventData,
        totalSpotsTaken
      }
    })

    return NextResponse.json(eventsWithSpots)
  } catch (error) {
    console.error('Error fetching events:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const data: EventFormData = await request.json()

    // Validate required fields
    if (!data.title || !data.startAt) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Validate dates
    const startAt = new Date(data.startAt)
    if (isNaN(startAt.getTime())) {
      return NextResponse.json(
        { error: 'Invalid start date' },
        { status: 400 }
      )
    }

    let endAt = null
    if (data.endAt) {
      endAt = new Date(data.endAt)
      if (isNaN(endAt.getTime())) {
        return NextResponse.json(
          { error: 'Invalid end date' },
          { status: 400 }
        )
      }
    }

    // Validate numbers
    const capacity = Number(data.capacity)
    const maxSpotsPerPerson = Number(data.maxSpotsPerPerson)

    if (isNaN(capacity) || capacity < 1) {
      return NextResponse.json(
        { error: 'Capacity must be a positive number' },
        { status: 400 }
      )
    }

    if (isNaN(maxSpotsPerPerson) || maxSpotsPerPerson < 1) {
      return NextResponse.json(
        { error: 'Max spots per person must be a positive number' },
        { status: 400 }
      )
    }

    const event = await prisma.event.create({
      data: {
        slug: generateSlug(),
        title: data.title,
        description: data.description,
        gameType: data.gameType,
        location: data.location,
        startAt: startAt,
        endAt: endAt,
        capacity: capacity,
        maxSpotsPerPerson: maxSpotsPerPerson,
        fieldsSchema: data.fieldsSchema as any,
        conditions: data.conditions,
        requireAcceptance: data.requireAcceptance,
        completionMessage: data.completionMessage,
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error('Error creating event:', error)
    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    )
  }
}