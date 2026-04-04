import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/utils'
import { createPaymentRequest } from '@/lib/yaadpay'
import { Decimal } from '@prisma/client/runtime/library'
import { rateLimit } from '@/lib/rate-limiter'
import { encryptPhone, encryptEmail } from '@/lib/encryption'
import { paymentLogger } from '@/lib/logger-v2'

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  maxAttempts: 10, // 10 payment attempts per hour
  blockDurationMs: 60 * 60 * 1000,
})

/**
 * POST /api/payment/create
 * Create payment session for upfront payment events
 *
 * This is a PUBLIC endpoint - no authentication required.
 * Validates event requires upfront payment, calculates amount, creates pending registration,
 * and returns auto-submit HTML form that POSTs to YaadPay.
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await paymentLimiter(request)
  if (rateLimitResponse) return rateLimitResponse

  // Fail fast: encryption key required before any DB work
  if (!process.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY.length < 32) {
    paymentLogger.error('ENCRYPTION_KEY missing or too short — payment route disabled', {
      present: !!process.env.ENCRYPTION_KEY,
      length: process.env.ENCRYPTION_KEY?.length ?? 0,
      railwayEnv: process.env.RAILWAY_ENVIRONMENT_NAME,
    })
    return NextResponse.json(
      { error: 'מערכת התשלומים אינה זמינה כעת. אנא פנה לתמיכה.' },
      { status: 503 }
    )
  }

  // Runtime safety check - prevent using mock mode in production Railway environment
  const railwayEnv = process.env.RAILWAY_ENVIRONMENT_NAME // 'production' | 'development' | undefined
  const isRailwayProd = railwayEnv === 'production'
  if (isRailwayProd && process.env.YAADPAY_MOCK_MODE === 'true') {
    paymentLogger.error('CRITICAL: Mock mode is enabled in production!')
    return NextResponse.json({ error: 'תצורה לא תקינה של מערכת התשלומים' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { registrationData, eventId, eventSlug, schoolSlug } = body

    // Validate required parameters
    if (!schoolSlug || !eventSlug) {
      return NextResponse.json({ error: 'חסרים פרמטרים נדרשים' }, { status: 400 })
    }

    if (!registrationData || typeof registrationData !== 'object') {
      return NextResponse.json({ error: 'נתוני הרשמה לא תקינים' }, { status: 400 })
    }

    // Validate required contact fields in registrationData
    if (!registrationData.name || !registrationData.phone) {
      return NextResponse.json({ error: 'חסרים שדות חובה: שם וטלפון' }, { status: 400 })
    }

    if (!registrationData.email) {
      return NextResponse.json({ error: 'אימייל נדרש לאירועים עם תשלום' }, { status: 400 })
    }

    // Find school
    const school = await prisma.school.findUnique({
      where: { slug: schoolSlug },
      select: { id: true, name: true },
    })

    if (!school) {
      return NextResponse.json({ error: 'בית הספר לא נמצא' }, { status: 404 })
    }

    // Find event and verify it belongs to the school (multi-tenant isolation)
    const event = await prisma.event.findFirst({
      where: {
        slug: eventSlug,
        schoolId: school.id,
      },
      select: {
        id: true,
        slug: true,
        title: true,
        schoolId: true,
        status: true,
        startAt: true,
        paymentRequired: true,
        paymentTiming: true,
        pricingModel: true,
        priceAmount: true,
        currency: true,
        eventType: true,
        capacity: true,
        spotsReserved: true,
      },
    })

    if (!event) {
      return NextResponse.json({ error: 'האירוע לא נמצא' }, { status: 404 })
    }

    // Verify event requires upfront payment
    if (!event.paymentRequired || event.paymentTiming !== 'UPFRONT') {
      return NextResponse.json({ error: 'האירוע לא דורש תשלום מראש' }, { status: 400 })
    }

    // Check event status
    if (event.status === 'CLOSED') {
      return NextResponse.json({ error: 'ההרשמה לאירוע נסגרה' }, { status: 400 })
    }

    if (event.status === 'PAUSED') {
      return NextResponse.json({ error: 'ההרשמה לאירוע מושהית' }, { status: 400 })
    }

    // Check if event has already started (registration closes at start time)
    if (new Date(event.startAt) <= new Date()) {
      return NextResponse.json({ error: 'ההרשמה נסגרה - האירוע כבר התחיל' }, { status: 400 })
    }

    // Verify price is configured
    if (!event.priceAmount || event.priceAmount.lte(0)) {
      return NextResponse.json({ error: 'התמחור לא הוגדר לאירוע זה' }, { status: 400 })
    }

    // Calculate amount based on pricing model
    let amountDue: Decimal

    if (event.pricingModel === 'FIXED_PRICE') {
      // Fixed price per registration
      amountDue = event.priceAmount
    } else if (event.pricingModel === 'PER_GUEST') {
      // Price per guest/spot (works for both TABLE_BASED and CAPACITY_BASED events)
      // TABLE_BASED events send 'guestsCount', CAPACITY_BASED events send 'spotsCount'
      const participantCount = Number(registrationData.guestsCount || registrationData.spotsCount)

      if (!participantCount || participantCount < 1) {
        return NextResponse.json({ error: 'מספר משתתפים לא תקין' }, { status: 400 })
      }

      amountDue = event.priceAmount.mul(participantCount)
    } else if (event.pricingModel === 'FREE') {
      return NextResponse.json({ error: 'האירוע חינמי, תשלום לא נדרש' }, { status: 400 })
    } else {
      return NextResponse.json({ error: 'מודל תמחור לא תקין' }, { status: 400 })
    }

    // Normalize phone number (Israeli format)
    let phoneNumber: string
    try {
      phoneNumber = normalizePhoneNumber(registrationData.phone)
    } catch (error) {
      return NextResponse.json({ error: 'פורמט מספר טלפון לא תקין' }, { status: 400 })
    }

    // Check for duplicate registration (same phone number, not cancelled)
    const existingRegistration = await prisma.registration.findFirst({
      where: {
        eventId: event.id,
        phoneNumber: phoneNumber,
        status: { not: 'CANCELLED' },
      },
    })

    if (existingRegistration) {
      return NextResponse.json({ error: 'מספר הטלפון כבר רשום לאירוע זה' }, { status: 400 })
    }

    // Check if user is banned
    const activeBan = await prisma.userBan.findFirst({
      where: {
        phoneNumber,
        schoolId: school.id,
        active: true,
        OR: [
          // Date-based ban (not expired)
          {
            expiresAt: { gte: new Date() },
          },
          // Game-based ban (no expiration date AND still has games to block)
          {
            expiresAt: null,
            eventsBlocked: { lt: prisma.userBan.fields.bannedGamesCount },
          },
        ],
      },
    })

    if (activeBan) {
      if (activeBan.expiresAt) {
        const expirationDate = new Date(activeBan.expiresAt).toLocaleDateString('he-IL')
        return NextResponse.json(
          { error: `מצטערים, חשבונך חסום עד ${expirationDate}. סיבה: ${activeBan.reason}` },
          { status: 403 }
        )
      } else {
        const remainingGames = activeBan.bannedGamesCount - activeBan.eventsBlocked
        return NextResponse.json(
          {
            error: `מצטערים, חשבונך חסום ל-${remainingGames} משחקים נוספים. סיבה: ${activeBan.reason}`,
          },
          { status: 403 }
        )
      }
    }

    // Create registration + payment in atomic transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Generate unique payment intent ID and cancellation token using cuid
        const { createId } = await import('@paralleldrive/cuid2')
        const paymentIntentId = createId()
        const cancellationToken = createId() // SECURITY: Used for user ticket page URL

        // Check for idempotency: if this paymentIntentId already exists, return existing
        const existingPayment = await tx.payment.findFirst({
          where: {
            yaadPayOrderId: paymentIntentId,
          },
          include: {
            registration: true,
          },
        })

        if (existingPayment && existingPayment.registration) {
          // Payment already created, return existing
          paymentLogger.info('Idempotency check: Payment already exists', { paymentIntentId })
          return {
            registration: existingPayment.registration,
            payment: existingPayment,
            isExisting: true,
          }
        }

        // Create pending registration FIRST (to satisfy foreign key constraint)
        const registration = await tx.registration.create({
          data: {
            eventId: event.id,
            data: registrationData,
            spotsCount:
              event.eventType === 'CAPACITY_BASED' ? Number(registrationData.spotsCount) || 1 : 0,
            guestsCount:
              event.eventType === 'TABLE_BASED' ? Number(registrationData.guestsCount) : null,
            status: 'CONFIRMED', // Will be set to WAITLIST if capacity exceeded (handled in callback)
            confirmationCode: Math.random().toString(36).substring(2, 8).toUpperCase(), // Temporary, will be replaced
            phoneNumber: phoneNumber,
            email: registrationData.email,
            paymentStatus: 'PROCESSING',
            paymentIntentId: paymentIntentId,
            amountDue: amountDue,
            cancellationToken: cancellationToken, // SECURITY: Used for user ticket page URL
          },
        })

        // Now create payment with the real registration ID
        const payment = await tx.payment.create({
          data: {
            schoolId: school.id,
            eventId: event.id,
            registrationId: registration.id, // Real registration ID
            amount: amountDue,
            currency: event.currency,
            status: 'PROCESSING',
            paymentMethod: 'yaadpay',
            yaadPayOrderId: paymentIntentId,
            payerEmail: encryptEmail(registrationData.email), // ENCRYPT
            payerPhone: encryptPhone(phoneNumber), // ENCRYPT
            payerName: registrationData.name, // Name stays plaintext (less sensitive)
          },
        })

        return {
          registration,
          payment,
          isExisting: false,
        }
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    // If existing payment, return error
    if (result.isExisting) {
      return NextResponse.json({ error: 'תשלום כבר יזם עבור בקשה זו' }, { status: 400 })
    }

    // MOCK MODE: Simulate successful payment for development (bypass YaadPay)
    if (process.env.YAADPAY_MOCK_MODE === 'true') {
      paymentLogger.info('MOCK MODE: Simulating successful payment', {
        paymentIntentId: result.payment.yaadPayOrderId,
        registrationId: result.registration.id,
        eventId: event.id,
      })

      // Simulate payment success - redirect to callback with success params
      const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/api/payment/callback`
      const mockParams = new URLSearchParams({
        CCode: '0', // Success code
        Order: result.payment.yaadPayOrderId!,
        Id: `MOCK-${Date.now()}`,
        ConfirmationCode: `MOCK-${Math.random().toString(36).substring(7).toUpperCase()}`,
        Amount: amountDue.toString(),
        Param1: JSON.stringify({
          eventId: event.id,
          schoolId: school.id,
          registrationId: result.registration.id,
          eventSlug: event.slug,
          schoolSlug: schoolSlug,
        }),
      })

      return NextResponse.json({
        type: 'mock',
        redirectUrl: `${callbackUrl}?${mockParams.toString()}`,
      })
    }

    // PRODUCTION: Generate YaadPay payment request
    const paymentRequest = createPaymentRequest({
      amount: parseFloat(amountDue.toString()),
      orderId: result.payment.yaadPayOrderId!,
      customerEmail: registrationData.email,
      customerName: registrationData.name,
      customerPhone: phoneNumber,
      description: `${event.title} - ${school.name}`,
      metadata: {
        eventId: event.id,
        schoolId: school.id,
        registrationId: result.registration.id,
        eventSlug: event.slug,
        schoolSlug: schoolSlug,
      },
    })

    paymentLogger.info('Created payment session', {
      paymentIntentId: result.payment.yaadPayOrderId,
      registrationId: result.registration.id,
      eventId: event.id,
      amount: amountDue.toString(),
      currency: event.currency,
    })

    // Return JSON so frontend can create a real DOM form (avoids CSP blob: issues)
    return NextResponse.json({
      type: 'payment',
      redirectUrl: paymentRequest.redirectUrl,
      formParams: paymentRequest.formParams,
    })
  } catch (error: unknown) {
    paymentLogger.error('Error creating payment session', { error })

    // Handle specific errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // YaadPay configuration errors
    if (errorMessage.includes('YaadPay credentials not configured')) {
      return NextResponse.json(
        { error: 'מערכת התשלומים לא מוגדרת. אנא פנה לתמיכה.' },
        { status: 500 }
      )
    }

    // Generic error
    return NextResponse.json({ error: 'נכשל ביצירת הפעלת תשלום' }, { status: 500 })
  }
}
