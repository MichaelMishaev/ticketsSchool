import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/p/[schoolSlug]/[eventSlug]/register
 * Register for an event using school slug + event slug
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ schoolSlug: string; eventSlug: string }> }
) {
  try {
    const { schoolSlug, eventSlug } = await params
    const data = await request.json()

    // Find school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true }
    })

    if (!school) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    // Find event
    const event = await prisma.event.findFirst({
      where: {
        slug: eventSlug,
        schoolId: school.id
      }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check event status
    if (event.status === 'CLOSED') {
      return NextResponse.json(
        { error: 'Event registration is closed' },
        { status: 400 }
      )
    }

    if (event.status === 'PAUSED') {
      return NextResponse.json(
        { error: 'Event registration is paused' },
        { status: 400 }
      )
    }

    // Validate spots
    const spotsCount = Number(data.spotsCount) || 1
    if (spotsCount < 1 || spotsCount > event.maxSpotsPerPerson) {
      return NextResponse.json(
        { error: `Invalid spots count. Must be between 1 and ${event.maxSpotsPerPerson}` },
        { status: 400 }
      )
    }

    // Calculate current spots taken
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

    const spotsLeft = event.capacity - totalSpotsTaken

    // Determine registration status
    let registrationStatus: 'CONFIRMED' | 'WAITLIST' = 'CONFIRMED'
    if (spotsLeft <= 0) {
      registrationStatus = 'WAITLIST'
    }

    // Generate confirmation code
    const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase()

    // Create registration
    const registration = await prisma.registration.create({
      data: {
        eventId: event.id,
        formData: data,
        spotsCount,
        status: registrationStatus,
        confirmationCode
      }
    })

    return NextResponse.json({
      success: true,
      confirmationCode,
      status: registrationStatus
    })
  } catch (error) {
    console.error('Error creating registration:', error)
    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
}
