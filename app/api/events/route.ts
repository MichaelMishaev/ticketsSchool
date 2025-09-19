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
        }
      }
    })

    return NextResponse.json(events)
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

    const event = await prisma.event.create({
      data: {
        slug: generateSlug(),
        title: data.title,
        description: data.description,
        gameType: data.gameType,
        location: data.location,
        startAt: new Date(data.startAt),
        endAt: data.endAt ? new Date(data.endAt) : null,
        capacity: data.capacity,
        maxSpotsPerPerson: data.maxSpotsPerPerson,
        fieldsSchema: data.fieldsSchema,
        conditions: data.conditions,
        requireAcceptance: data.requireAcceptance,
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