import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { EventFormData } from '@/types'
import { getCurrentAdmin } from '@/lib/auth.server'

function generateSlug(): string {
  return Math.random().toString(36).substring(2, 15)
}

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

    // Regular admins can only see their school's events (all roles except SUPER_ADMIN)
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

    // Super admins can filter by school via query param or see all schools
    if (admin.role === 'SUPER_ADMIN') {
      const url = new URL(request.url)
      const schoolId = url.searchParams.get('schoolId')
      if (schoolId) {
        where.schoolId = schoolId
      }
      // If no schoolId param, SUPER_ADMIN sees all schools
    }

    const events = await prisma.event.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        school: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
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
    // Get current admin session
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const data: EventFormData = await request.json()

    // Determine schoolId
    let schoolId: string | undefined

    // Regular admins can ONLY create events for their school (all roles except SUPER_ADMIN)
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 400 }
        )
      }
      schoolId = admin.schoolId
    }

    // Super admins can specify schoolId or use their assigned school
    if (admin.role === 'SUPER_ADMIN') {
      schoolId = (data as any).schoolId || admin.schoolId
    }

    // Validate schoolId exists
    if (!schoolId) {
      return NextResponse.json(
        { error: 'School ID is required' },
        { status: 400 }
      )
    }

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
        schoolId,  // NEW: Set school context
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
      },
      include: {
        school: true
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