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

    // Start a transaction to ensure atomic operation
    return await prisma.$transaction(async (tx) => {
      // Get event with lock to prevent race conditions
      const event = await tx.event.findUnique({
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
        throw new Error('Event not found')
      }

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

      // Calculate current confirmed registrations
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

      // Determine registration status
      const status = spotsLeft >= spotsCount ? 'CONFIRMED' : 'WAITLIST'

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