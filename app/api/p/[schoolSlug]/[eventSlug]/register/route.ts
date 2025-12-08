import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateConfirmationCode, normalizePhoneNumber } from '@/lib/utils'
import { reserveTableForGuests } from '@/lib/table-assignment'

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

    // Find school (outside transaction for TABLE_BASED check)
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true }
    })

    if (!school) {
      throw new Error('School not found')
    }

    // Find event (outside transaction for TABLE_BASED check)
    const event = await prisma.event.findFirst({
      where: {
        slug: eventSlug,
        schoolId: school.id
      }
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Check event status
    if (event.status === 'CLOSED') {
      throw new Error('Event registration is closed')
    }

    if (event.status === 'PAUSED') {
      throw new Error('Event registration is paused')
    }

    // Validate required contact information
    if (!data.phone || typeof data.phone !== 'string' || data.phone.trim() === '') {
      throw new Error('Phone number is required')
    }

    if (!data.name || typeof data.name !== 'string' || data.name.trim() === '') {
      throw new Error('Name is required')
    }

    // Normalize phone number (now guaranteed to be present)
    const phoneNumber = normalizePhoneNumber(data.phone)

    // Check for duplicate registration by phone number
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        phoneNumber: phoneNumber,
        status: { not: 'CANCELLED' }
      }
    })

    if (existingRegistration) {
      throw new Error('Phone number already registered for this event')
    }

    // TABLE_BASED events use table assignment logic (has its own transaction)
    if (event.eventType === 'TABLE_BASED') {
      const guestsCount = Number(data.guestsCount)

      if (!guestsCount || guestsCount < 1) {
        throw new Error('Invalid guest count')
      }

      const result = await reserveTableForGuests(event.id, guestsCount, {
        phoneNumber: phoneNumber || '',
        data
      })

      return NextResponse.json({
        success: true,
        confirmationCode: result.registration.confirmationCode,
        status: result.status,
        registrationId: result.registration.id,
        message: result.status === 'WAITLIST' ?
          'נרשמת לרשימת ההמתנה' :
          'השולחן הוזמן בהצלחה'
      })
    }

    // CAPACITY_BASED events (existing logic with transaction)
    const spotsCount = Number(data.spotsCount) || 1

    // Validate spots
    if (spotsCount < 1 || spotsCount > event.maxSpotsPerPerson) {
      throw new Error(`Invalid spots count. Must be between 1 and ${event.maxSpotsPerPerson}`)
    }

    // Start a transaction to ensure atomic operation and prevent race conditions
    return await prisma.$transaction(async (tx) => {
      // Calculate current confirmed registrations within transaction
      const currentConfirmed = await tx.registration.aggregate({
        where: {
          eventId: event.id,
          status: 'CONFIRMED'
        },
        _sum: {
          spotsCount: true
        }
      })

      const totalSpotsTaken = currentConfirmed._sum.spotsCount || 0
      const spotsLeft = event.capacity - totalSpotsTaken

      // Determine registration status
      const registrationStatus: 'CONFIRMED' | 'WAITLIST' =
        spotsLeft >= spotsCount ? 'CONFIRMED' : 'WAITLIST'

      // Generate secure confirmation code
      const confirmationCode = generateConfirmationCode()

      // Create registration within transaction
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          data,
          spotsCount,
          status: registrationStatus,
          confirmationCode,
          phoneNumber: phoneNumber,
          email: data.email || null
        }
      })

      // Return response within transaction
      return NextResponse.json({
        success: true,
        confirmationCode: registration.confirmationCode,
        status: registration.status,
        registrationId: registration.id,
        message: registrationStatus === 'WAITLIST' ?
          'נרשמת לרשימת ההמתנה' :
          'ההרשמה הושלמה בהצלחה'
      })
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    })
  } catch (error: any) {
    console.error('Error creating registration:', error)

    // Handle specific error messages
    if (error.message.includes('School not found')) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      )
    }

    if (error.message.includes('Event not found')) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    if (error.message.includes('registration is closed') || error.message.includes('is paused')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('Invalid spots count')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('Phone number already registered')) {
      return NextResponse.json(
        { error: 'מספר הטלפון כבר רשום לאירוע זה' },
        { status: 400 }
      )
    }

    if (error.message.includes('Invalid phone number')) {
      return NextResponse.json(
        { error: 'מספר הטלפון אינו תקין' },
        { status: 400 }
      )
    }

    if (error.message.includes('Invalid guest count')) {
      return NextResponse.json(
        { error: 'מספר האורחים אינו תקין' },
        { status: 400 }
      )
    }

    if (error.message.includes('Phone number is required')) {
      return NextResponse.json(
        { error: 'מספר טלפון הוא שדה חובה' },
        { status: 400 }
      )
    }

    if (error.message.includes('Name is required')) {
      return NextResponse.json(
        { error: 'שם הוא שדה חובה' },
        { status: 400 }
      )
    }

    if (error.message.includes('Phone number is required for table reservation')) {
      return NextResponse.json(
        { error: 'מספר טלפון הוא שדה חובה להזמנת שולחן' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to register' },
      { status: 500 }
    )
  }
}
