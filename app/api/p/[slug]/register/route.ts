import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateConfirmationCode, normalizePhoneNumber } from '@/lib/utils'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await request.json()
    const { spotsCount = 1, ...registrationData } = data

    // Start a transaction with Serializable isolation to prevent race conditions
    return await prisma.$transaction(async (tx) => {
      // Lock the event row with FOR UPDATE to prevent concurrent modifications
      // This ensures only one transaction can read and modify this event at a time
      const eventRaw = await tx.$queryRaw<Array<{
        id: string
        slug: string
        schoolId: string
        title: string
        description: string | null
        gameType: string | null
        location: string | null
        startAt: Date
        endAt: Date | null
        capacity: number
        status: string
        maxSpotsPerPerson: number
        fieldsSchema: any
        conditions: string | null
        requireAcceptance: boolean
        completionMessage: string | null
        createdAt: Date
        updatedAt: Date
      }>>`
        SELECT * FROM "Event"
        WHERE slug = ${slug}
        FOR UPDATE
      `

      if (!eventRaw || eventRaw.length === 0) {
        throw new Error('Event not found')
      }

      const event = eventRaw[0]

      if (event.status !== 'OPEN') {
        throw new Error('Registration is closed')
      }

      // Normalize phone number if provided
      const phoneNumber = registrationData.phone ?
        normalizePhoneNumber(registrationData.phone) : null

      // Check total spots per phone number (maxSpotsPerPerson limit per phone)
      if (phoneNumber) {
        const existingRegistrations = await tx.registration.aggregate({
          where: {
            eventId: event.id,
            phoneNumber: phoneNumber,
            status: { not: 'CANCELLED' }
          },
          _sum: {
            spotsCount: true
          }
        })

        const totalSpotsForPhone = existingRegistrations._sum.spotsCount || 0
        const newTotal = totalSpotsForPhone + spotsCount

        if (newTotal > event.maxSpotsPerPerson) {
          const remaining = event.maxSpotsPerPerson - totalSpotsForPhone
          if (remaining <= 0) {
            throw new Error(`מספר הטלפון כבר רשום למקסימום המקומות (${event.maxSpotsPerPerson})`)
          } else {
            throw new Error(`ניתן להירשם עד ${remaining} מקומות נוספות עבור מספר טלפון זה (סה"כ מקסימום ${event.maxSpotsPerPerson} מקומות)`)
          }
        }

        // Check if single registration exceeds max (also validate for users without phone)
        if (spotsCount > event.maxSpotsPerPerson) {
          throw new Error(`מקסימום ${event.maxSpotsPerPerson} מקומות מותרים לכל הרשמה`)
        }
      } else {
        // For registrations without phone number, just check single registration limit
        if (spotsCount > event.maxSpotsPerPerson) {
          throw new Error(`מקסימום ${event.maxSpotsPerPerson} מקומות מותרים לכל הרשמה`)
        }
      }

      // Check if spotsReserved column exists (migration applied)
      // If yes: use atomic counter (fast, race-condition proof)
      // If no: use aggregate count (slower, but works with FOR UPDATE lock)
      const useSpotsReserved = 'spotsReserved' in event

      let status: 'CONFIRMED' | 'WAITLIST'

      if (useSpotsReserved) {
        // PHASE 2: Atomic counter approach (after migration)
        const spotsReserved = (event as any).spotsReserved as number || 0
        const spotsLeft = event.capacity - spotsReserved

        if (spotsLeft >= spotsCount) {
          // Try to atomically reserve spots
          const updated = await tx.$executeRaw`
            UPDATE "Event"
            SET "spotsReserved" = "spotsReserved" + ${spotsCount}
            WHERE id = ${event.id}
            AND "spotsReserved" + ${spotsCount} <= capacity
          `

          if (updated > 0) {
            status = 'CONFIRMED'
          } else {
            // Another transaction took the spots - go to waitlist
            status = 'WAITLIST'
          }
        } else {
          status = 'WAITLIST'
        }
      } else {
        // PHASE 1: Aggregate count approach (before migration)
        // Event row is already locked with FOR UPDATE, so this is safe
        const currentConfirmed = await tx.registration.aggregate({
          where: {
            eventId: event.id,
            status: 'CONFIRMED'
          },
          _sum: {
            spotsCount: true
          }
        })

        const totalConfirmed = currentConfirmed._sum.spotsCount || 0
        const spotsLeft = event.capacity - totalConfirmed

        status = spotsLeft >= spotsCount ? 'CONFIRMED' : 'WAITLIST'
      }

      // Create registration
      const registration = await tx.registration.create({
        data: {
          eventId: event.id,
          data: registrationData,
          spotsCount: spotsCount,
          status: status,
          phoneNumber: phoneNumber,
          email: registrationData.email || null,
          confirmationCode: generateConfirmationCode()
        }
      })

      return NextResponse.json({
        success: true,
        confirmationCode: registration.confirmationCode,
        status: registration.status,
        registrationId: registration.id,
        message: status === 'WAITLIST' ?
          'נרשמת לרשימת ההמתנה' :
          'ההרשמה הושלמה בהצלחה'
      })
    }, {
      isolationLevel: 'Serializable',  // Strongest isolation level to prevent race conditions
      timeout: 10000  // 10 second timeout to prevent long-running locks
    })
  } catch (error: any) {
    console.error('Registration error:', error)

    // Handle specific error messages
    if (error.message.includes('מספר הטלפון כבר רשום למקסימום') || error.message.includes('ניתן להירשם עד')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('Registration is closed')) {
      return NextResponse.json(
        { error: 'ההרשמה סגורה' },
        { status: 400 }
      )
    }

    if (error.message.includes('Event not found')) {
      return NextResponse.json(
        { error: 'האירוע לא נמצא' },
        { status: 404 }
      )
    }

    if (error.message.includes('Maximum')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'שגיאה בהרשמה. נסה שוב.' },
      { status: 500 }
    )
  }
}