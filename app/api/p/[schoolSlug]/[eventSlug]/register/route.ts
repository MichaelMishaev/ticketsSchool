import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateConfirmationCode, normalizePhoneNumber } from '@/lib/utils'
import { reserveTableForGuests } from '@/lib/table-assignment'
import { generateQRCodeData, generateQRCodeImage } from '@/lib/qr-code'
import { sendRegistrationConfirmationEmail, sendPaymentInvoiceEmail } from '@/lib/email'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { createId } from '@paralleldrive/cuid2'
import { Decimal } from '@prisma/client/runtime/library'
import { generateCheckInToken, validateCheckInTokenFormat } from '@/lib/check-in-token'
import { registrationLogger } from '@/lib/logger-v2'

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
      select: { id: true, name: true },
    })

    if (!school) {
      throw new Error('School not found')
    }

    // Find event (outside transaction for TABLE_BASED check)
    const event = await prisma.event.findFirst({
      where: {
        slug: eventSlug,
        schoolId: school.id,
      },
      include: {
        tables: true,
      },
    })

    if (!event) {
      throw new Error('Event not found')
    }

    // Ensure event has a valid check-in token (for QR code generation)
    if (!event.checkInToken || !validateCheckInTokenFormat(event.checkInToken)) {
      const newToken = generateCheckInToken()
      await prisma.event.update({
        where: { id: event.id },
        data: { checkInToken: newToken },
      })
      event.checkInToken = newToken
    }

    // Check event status
    if (event.status === 'CLOSED') {
      throw new Error('Event registration is closed')
    }

    if (event.status === 'PAUSED') {
      throw new Error('Event registration is paused')
    }

    // Check if event has already started (registration closes at start time)
    if (new Date(event.startAt) <= new Date()) {
      throw new Error('Registration is closed - event has already started')
    }

    // CRITICAL SECURITY CHECK: Reject UPFRONT payment events (UNLESS registering for waitlist)
    // UPFRONT payment events must go through the payment API first (/api/payment/create)
    // This prevents users from bypassing payment by calling the registration API directly
    // EXCEPTION: If event is FULL, allow waitlist registration without payment
    if (event.paymentRequired && event.paymentTiming === 'UPFRONT') {
      // Calculate current capacity to check if waitlist registration is allowed
      const currentConfirmed = await prisma.registration.aggregate({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
        },
        _sum: {
          spotsCount: true,
        },
      })
      const totalSpotsTaken = currentConfirmed._sum.spotsCount || 0
      const spotsLeft = event.capacity - totalSpotsTaken
      const spotsCount = Number(data.spotsCount) || 1

      // If there are spots available, user must pay first (reject direct registration)
      // If event is FULL, allow waitlist registration without payment
      if (spotsLeft >= spotsCount) {
        throw new Error('This event requires upfront payment. Please complete payment first.')
      }
      // Event is full - continue to waitlist registration below
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

    // Check if user is banned
    const bans = await prisma.userBan.findMany({
      where: {
        phoneNumber,
        schoolId: school.id,
        active: true,
      },
    })

    // Find first active ban (date-based OR game-based with remaining games)
    const activeBan = bans.find((ban) => {
      // Date-based ban (not expired)
      if (ban.expiresAt && ban.expiresAt >= new Date()) {
        return true
      }
      // Game-based ban (no expiration date AND still has games to block)
      if (!ban.expiresAt && ban.eventsBlocked < ban.bannedGamesCount) {
        return true
      }
      return false
    })

    if (activeBan) {
      if (activeBan.expiresAt) {
        // Date-based ban
        const expirationDate = new Date(activeBan.expiresAt).toLocaleDateString('he-IL')
        throw new Error(`מצטערים, חשבונך חסום עד ${expirationDate}. סיבה: ${activeBan.reason}`)
      } else {
        // Game-based ban
        const remainingGames = activeBan.bannedGamesCount - activeBan.eventsBlocked
        throw new Error(
          `מצטערים, חשבונך חסום ל-${remainingGames} משחקים נוספים. סיבה: ${activeBan.reason}`
        )
      }
    }

    // Check for duplicate registration by phone number
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        phoneNumber: phoneNumber,
        status: { not: 'CANCELLED' },
      },
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

      // Detect POST_REGISTRATION payment mode
      const requiresPostPayment =
        event.paymentRequired && event.paymentTiming === 'POST_REGISTRATION'

      const result = await reserveTableForGuests(event.id, guestsCount, {
        phoneNumber: phoneNumber || '',
        data,
      })

      // Calculate payment amount if POST_REGISTRATION
      let amountDue: Decimal | null = null
      let paymentIntentId: string | null = null

      if (requiresPostPayment && event.priceAmount) {
        // Calculate based on pricing model
        if (event.pricingModel === 'PER_GUEST') {
          amountDue = new Decimal(event.priceAmount).times(guestsCount)
        } else {
          // FIXED_PRICE - single price regardless of guest count
          amountDue = new Decimal(event.priceAmount)
        }

        // Generate unique payment intent ID
        paymentIntentId = createId()

        // Create Payment record
        await prisma.payment.create({
          data: {
            registrationId: result.registration.id,
            eventId: event.id,
            schoolId: school.id,
            amount: amountDue,
            currency: event.currency,
            status: 'PENDING',
            paymentMethod: 'yaadpay',
            payerEmail: data.email || null,
            payerPhone: phoneNumber,
            payerName: data.name,
            yaadPayOrderId: paymentIntentId,
          },
        })

        // Update registration with payment details
        await prisma.registration.update({
          where: { id: result.registration.id },
          data: {
            paymentStatus: 'PENDING',
            amountDue,
            paymentIntentId,
          },
        })
      }

      // Generate QR code image only if FREE or WAITLIST (skip for PENDING payments)
      let qrCodeImage: string | undefined
      const shouldGenerateQR = !requiresPostPayment || result.status === 'WAITLIST'

      if (shouldGenerateQR) {
        qrCodeImage = await generateQRCodeImage(result.registration.id, event.id, {
          width: 300,
          margin: 2,
          cancellationToken: result.registration.cancellationToken || undefined,
        })
      }

      // Send appropriate email based on payment mode
      if (data.email) {
        try {
          const eventDate = format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', {
            locale: he,
          })

          if (requiresPostPayment && result.status !== 'WAITLIST' && paymentIntentId && amountDue) {
            // Send invoice email for POST_REGISTRATION
            const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/payment/pay?intent=${paymentIntentId}`
            const currencySymbol = event.currency === 'ILS' ? '₪' : event.currency

            await sendPaymentInvoiceEmail({
              to: data.email,
              eventTitle: event.title,
              eventDate,
              eventLocation: event.location || 'לא צוין',
              amount: Number(amountDue),
              currency: event.currency,
              paymentLink,
              customerName: data.name,
              confirmationCode: result.registration.confirmationCode,
            })

            registrationLogger.info('Payment invoice email sent', {
              email: data.email,
              eventId: event.id,
            })
          } else {
            // Send regular confirmation email (FREE or WAITLIST)
            if (qrCodeImage) {
              const cancellationUrl = result.registration.cancellationToken
                ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/cancel/${result.registration.cancellationToken}`
                : undefined

              await sendRegistrationConfirmationEmail(data.email, {
                name: data.name,
                eventName: event.title,
                eventDate,
                eventLocation: event.location || undefined,
                confirmationCode: result.registration.confirmationCode,
                qrCodeImage,
                status: result.status as 'CONFIRMED' | 'WAITLIST',
                schoolName: school.name || 'TicketCap',
                cancellationUrl,
              })

              registrationLogger.info('Registration confirmation email sent', {
                email: data.email,
                eventId: event.id,
              })
            }
          }
        } catch (emailError) {
          // Log error but don't fail the registration
          registrationLogger.error('Failed to send registration email', {
            error: emailError,
            email: data.email,
          })
        }
      }

      return NextResponse.json({
        success: true,
        confirmationCode: result.registration.confirmationCode,
        status: result.status,
        registrationId: result.registration.id,
        qrCodeImage, // Include QR code image in response (undefined for pending payments)
        requiresPayment: requiresPostPayment && result.status !== 'WAITLIST',
        paymentIntentId: requiresPostPayment ? paymentIntentId : undefined,
        message:
          requiresPostPayment && result.status !== 'WAITLIST'
            ? 'ההרשמה נקלטה - אנא בדוק את המייל לקבלת קישור לתשלום'
            : result.status === 'WAITLIST'
              ? 'נרשמת לרשימת ההמתנה'
              : 'השולחן הוזמן בהצלחה',
      })
    }

    // CAPACITY_BASED events (existing logic with transaction)
    const spotsCount = Number(data.spotsCount) || 1

    // Validate spots
    if (spotsCount < 1 || spotsCount > event.maxSpotsPerPerson) {
      throw new Error(`Invalid spots count. Must be between 1 and ${event.maxSpotsPerPerson}`)
    }

    // Detect POST_REGISTRATION payment mode
    const requiresPostPayment = event.paymentRequired && event.paymentTiming === 'POST_REGISTRATION'

    // Start a transaction to ensure atomic operation and prevent race conditions
    const registration = await prisma.$transaction(
      async (tx) => {
        // Calculate current confirmed registrations within transaction
        const currentConfirmed = await tx.registration.aggregate({
          where: {
            eventId: event.id,
            status: 'CONFIRMED',
          },
          _sum: {
            spotsCount: true,
          },
        })

        const totalSpotsTaken = currentConfirmed._sum.spotsCount || 0
        const spotsLeft = event.capacity - totalSpotsTaken

        // Determine registration status
        const registrationStatus: 'CONFIRMED' | 'WAITLIST' =
          spotsLeft >= spotsCount ? 'CONFIRMED' : 'WAITLIST'

        // Generate secure confirmation code
        const confirmationCode = generateConfirmationCode()

        // Calculate payment amount if POST_REGISTRATION
        let amountDue: Decimal | null = null
        let paymentIntentId: string | null = null
        let paymentStatus: 'PENDING' | undefined = undefined

        if (requiresPostPayment && event.priceAmount && registrationStatus === 'CONFIRMED') {
          // Calculate based on pricing model
          if (event.pricingModel === 'PER_GUEST') {
            amountDue = new Decimal(event.priceAmount).times(spotsCount)
          } else {
            // FIXED_PRICE - single price regardless of spot count
            amountDue = new Decimal(event.priceAmount)
          }

          // Generate unique payment intent ID
          paymentIntentId = createId()
          paymentStatus = 'PENDING'
        }

        // Generate cancellation token (used for both cancellation URL and secure QR code)
        const cancellationToken = createId()

        // Create registration within transaction (without QR code first)
        const registration = await tx.registration.create({
          data: {
            eventId: event.id,
            data,
            spotsCount,
            status: registrationStatus,
            confirmationCode,
            phoneNumber: phoneNumber,
            email: data.email || null,
            paymentStatus: paymentStatus,
            amountDue,
            paymentIntentId,
            cancellationToken, // SECURITY: Used for user ticket page URL
          },
        })

        // Generate QR code after we have the registration ID (skip for PENDING payments)
        if (!requiresPostPayment || registrationStatus === 'WAITLIST') {
          const qrCodeData = generateQRCodeData(registration.id, event.id)

          // Update registration with QR code
          await tx.registration.update({
            where: { id: registration.id },
            data: { qrCode: qrCodeData },
          })
        }

        // Create Payment record if POST_REGISTRATION
        if (
          requiresPostPayment &&
          amountDue &&
          paymentIntentId &&
          registrationStatus === 'CONFIRMED'
        ) {
          await tx.payment.create({
            data: {
              registrationId: registration.id,
              eventId: event.id,
              schoolId: school.id,
              amount: amountDue,
              currency: event.currency,
              status: 'PENDING',
              paymentMethod: 'yaadpay',
              payerEmail: data.email || null,
              payerPhone: phoneNumber,
              payerName: data.name,
              yaadPayOrderId: paymentIntentId,
            },
          })
        }

        return registration
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    // Generate QR code image only if FREE or WAITLIST (skip for PENDING payments)
    let qrCodeImage: string | undefined
    const shouldGenerateQR = !requiresPostPayment || registration.status === 'WAITLIST'

    if (shouldGenerateQR) {
      qrCodeImage = await generateQRCodeImage(registration.id, event.id, {
        width: 300,
        margin: 2,
        cancellationToken: registration.cancellationToken || undefined,
      })
    }

    // Send appropriate email based on payment mode
    if (data.email) {
      try {
        const eventDate = format(new Date(event.startAt), 'EEEE, dd בMMMM yyyy בשעה HH:mm', {
          locale: he,
        })

        if (
          requiresPostPayment &&
          registration.status === 'CONFIRMED' &&
          registration.paymentIntentId &&
          registration.amountDue
        ) {
          // Send invoice email for POST_REGISTRATION
          const paymentLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/payment/pay?intent=${registration.paymentIntentId}`

          await sendPaymentInvoiceEmail({
            to: data.email,
            eventTitle: event.title,
            eventDate,
            eventLocation: event.location || 'לא צוין',
            amount: Number(registration.amountDue),
            currency: event.currency,
            paymentLink,
            customerName: data.name,
            confirmationCode: registration.confirmationCode,
          })

          registrationLogger.info('Payment invoice email sent', {
            email: data.email,
            eventId: event.id,
          })
        } else {
          // Send regular confirmation email (FREE or WAITLIST)
          if (qrCodeImage) {
            const cancellationUrl = registration.cancellationToken
              ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/cancel/${registration.cancellationToken}`
              : undefined

            await sendRegistrationConfirmationEmail(data.email, {
              name: data.name,
              eventName: event.title,
              eventDate,
              eventLocation: event.location || undefined,
              confirmationCode: registration.confirmationCode,
              qrCodeImage,
              status: registration.status as 'CONFIRMED' | 'WAITLIST',
              schoolName: school.name || 'TicketCap',
              cancellationUrl,
            })

            registrationLogger.info('Registration confirmation email sent', {
              email: data.email,
              eventId: event.id,
            })
          }
        }
      } catch (emailError) {
        // Log error but don't fail the registration
        registrationLogger.error('Failed to send registration email', {
          error: emailError,
          email: data.email,
        })
      }
    }

    // Return response with QR code image
    return NextResponse.json({
      success: true,
      confirmationCode: registration.confirmationCode,
      status: registration.status,
      registrationId: registration.id,
      qrCodeImage, // Include QR code image in response (undefined for pending payments)
      requiresPayment: requiresPostPayment && registration.status === 'CONFIRMED',
      paymentIntentId: requiresPostPayment ? registration.paymentIntentId : undefined,
      message:
        requiresPostPayment && registration.status === 'CONFIRMED'
          ? 'ההרשמה נקלטה - אנא בדוק את המייל לקבלת קישור לתשלום'
          : registration.status === 'WAITLIST'
            ? 'נרשמת לרשימת ההמתנה'
            : 'ההרשמה הושלמה בהצלחה',
    })
  } catch (error: unknown) {
    // Enhanced error logging for debugging
    registrationLogger.error('Registration error', { error })

    // Handle specific error messages
    const errorMessage = error instanceof Error ? error.message : ''

    if (errorMessage.includes('School not found')) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    if (errorMessage.includes('Event not found')) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (errorMessage.includes('registration is closed') || errorMessage.includes('is paused')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (errorMessage.includes('Invalid spots count')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    if (errorMessage.includes('Phone number already registered')) {
      return NextResponse.json({ error: 'מספר הטלפון כבר רשום לאירוע זה' }, { status: 400 })
    }

    if (errorMessage.includes('Invalid phone number')) {
      return NextResponse.json({ error: 'מספר הטלפון אינו תקין' }, { status: 400 })
    }

    if (errorMessage.includes('Invalid guest count')) {
      return NextResponse.json({ error: 'מספר האורחים אינו תקין' }, { status: 400 })
    }

    if (errorMessage.includes('Phone number is required')) {
      return NextResponse.json({ error: 'מספר טלפון הוא שדה חובה' }, { status: 400 })
    }

    if (errorMessage.includes('Name is required')) {
      return NextResponse.json({ error: 'שם הוא שדה חובה' }, { status: 400 })
    }

    if (errorMessage.includes('Phone number is required for table reservation')) {
      return NextResponse.json({ error: 'מספר טלפון הוא שדה חובה להזמנת שולחן' }, { status: 400 })
    }

    if (errorMessage.includes('חשבונך חסום')) {
      // User is banned - return the full Hebrew message
      return NextResponse.json({ error: errorMessage }, { status: 403 })
    }

    if (errorMessage.includes('requires upfront payment')) {
      // UPFRONT payment events must go through payment API
      return NextResponse.json(
        { error: 'אירוע זה דורש תשלום מראש. אנא השלם את התשלום תחילה.' },
        { status: 400 }
      )
    }

    // Include error details in development for debugging
    const isDev = process.env.NODE_ENV !== 'production'
    return NextResponse.json(
      {
        error: 'Failed to register',
        details: isDev ? errorMessage : undefined,
        code:
          error instanceof Error && 'code' in error ? (error as { code: string }).code : undefined,
      },
      { status: 500 }
    )
  }
}
