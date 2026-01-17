import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCallback, type YaadPayCallback } from '@/lib/yaadpay'
import { sendRegistrationConfirmationEmail } from '@/lib/email'
import { generateQRCodeImage } from '@/lib/qr-code'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { Decimal } from '@prisma/client/runtime/library'
import { paymentLogger } from '@/lib/logger-v2'

// In-memory nonce tracking for callback replay protection
const processedCallbacks = new Set<string>()

// Cleanup old nonces every hour to prevent memory leak
setInterval(
  () => {
    paymentLogger.debug('Clearing processed callbacks from memory', {
      count: processedCallbacks.size,
    })
    processedCallbacks.clear()
  },
  60 * 60 * 1000
)

/**
 * Parse callback parameters from GET or POST request
 */
function parseCallbackParams(request: NextRequest): YaadPayCallback {
  const url = new URL(request.url)

  return {
    CCode: url.searchParams.get('CCode') || '',
    Order: url.searchParams.get('Order') || '',
    Id: url.searchParams.get('Id') || '',
    ConfirmationCode: url.searchParams.get('ConfirmationCode') || undefined,
    Amount: url.searchParams.get('Amount') || undefined,
    ACode: url.searchParams.get('ACode') || undefined,
    Param1: url.searchParams.get('Param1') || undefined,
    signature: url.searchParams.get('signature') || undefined,
  }
}

/**
 * GET /api/payment/callback
 * Handle YaadPay redirect after payment (GET method)
 */
export async function GET(request: NextRequest) {
  return handleCallback(request)
}

/**
 * POST /api/payment/callback
 * Handle YaadPay redirect after payment (POST method)
 */
export async function POST(request: NextRequest) {
  return handleCallback(request)
}

/**
 * Shared callback handler for both GET and POST
 */
async function handleCallback(request: NextRequest) {
  try {
    // Parse callback parameters
    const params = parseCallbackParams(request)

    paymentLogger.info('Callback received', {
      cCode: params.CCode,
      orderId: params.Order,
      transactionId: params.Id,
      method: request.method,
    })

    // Validate callback
    const validation = validateCallback(params)

    if (!validation.isValid) {
      paymentLogger.error('Invalid callback', { error: validation.errorMessage })
      return NextResponse.redirect(
        new URL(
          `/payment/failed?error=${encodeURIComponent(validation.errorMessage || 'Invalid callback')}`,
          request.url
        )
      )
    }

    // Find payment by yaadPayOrderId (which is our paymentIntentId)
    const payment = await prisma.payment.findUnique({
      where: { yaadPayOrderId: validation.orderId },
      include: {
        registration: {
          include: {
            event: {
              include: {
                school: true,
              },
            },
          },
        },
        event: true,
        school: true,
      },
    })

    if (!payment) {
      paymentLogger.error('Payment not found', { orderId: validation.orderId })
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent('תשלום לא נמצא במערכת')}`, request.url)
      )
    }

    // CRITICAL: Idempotency check - if already completed, skip processing
    if (payment.status === 'COMPLETED') {
      paymentLogger.info('Payment already completed, redirecting to success', {
        orderId: validation.orderId,
        registrationId: payment.registrationId,
      })
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    }

    // Verify multi-tenant isolation
    if (payment.schoolId !== payment.event.schoolId) {
      paymentLogger.error('School ID mismatch - multi-tenant isolation breach', {
        paymentSchoolId: payment.schoolId,
        eventSchoolId: payment.event.schoolId,
        orderId: validation.orderId,
      })
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent('שגיאה במערכת')}`, request.url)
      )
    }

    // Generate callback fingerprint for replay detection
    const callbackFingerprint = `${validation.orderId}:${validation.transactionId}:${validation.amount}:${params.CCode}`

    // Check if already processed (replay attack detection)
    if (processedCallbacks.has(callbackFingerprint)) {
      paymentLogger.warn('REPLAY ATTACK DETECTED - Callback already processed', {
        orderId: validation.orderId,
        transactionId: validation.transactionId,
        amount: validation.amount,
        method: request.method,
      })

      // Log security incident
      try {
        await prisma.breachIncident.create({
          data: {
            schoolId: payment.schoolId,
            incidentType: 'unauthorized_access',
            severity: 'medium',
            description: `Payment callback replay attack detected for order ${validation.orderId}`,
            affectedUsers: 1,
            dataTypes: JSON.stringify(['payment']),
            detectedAt: new Date(),
          },
        })
      } catch (err) {
        paymentLogger.error('Failed to log replay attack', { error: err })
      }

      // Return success (idempotent) but don't process again
      const registration = await prisma.registration.findFirst({
        where: { paymentIntentId: validation.orderId },
      })

      if (registration) {
        return NextResponse.redirect(
          new URL(`/payment/success?code=${registration.confirmationCode}`, request.url)
        )
      }

      return NextResponse.redirect(new URL('/payment/error', request.url))
    }

    // Mark as processed BEFORE starting transaction
    processedCallbacks.add(callbackFingerprint)

    // Process payment in atomic transaction
    const result = await prisma.$transaction(
      async (tx) => {
        // Re-check payment status inside transaction (prevent race condition)
        const currentPayment = await tx.payment.findUnique({
          where: { id: payment.id },
          select: { status: true },
        })

        if (currentPayment?.status === 'COMPLETED') {
          return { alreadyProcessed: true }
        }

        if (validation.isSuccess) {
          // SECURITY: Verify amount matches expected (prevent tampering)
          // Use exact decimal comparison (no tolerance for tampering)
          const expectedAmount = new Decimal(payment.amount.toString())
          const paidAmount = validation.amount
            ? new Decimal(validation.amount.toString())
            : new Decimal(0)

          // EXACT match required - no tolerance for tampering
          if (!expectedAmount.equals(paidAmount)) {
            paymentLogger.error('AMOUNT MISMATCH DETECTED - Potential tampering!', {
              paymentId: payment.id,
              expected: expectedAmount.toString(),
              received: paidAmount.toString(),
              orderId: validation.orderId,
              transactionId: validation.transactionId,
              difference: expectedAmount.minus(paidAmount).toString(),
            })

            // Log to security incident system
            try {
              await prisma.breachIncident.create({
                data: {
                  schoolId: payment.schoolId,
                  incidentType: 'payment_tampering',
                  severity: 'high',
                  description: `Payment amount mismatch detected: Expected ${expectedAmount}, Received ${paidAmount}`,
                  affectedUsers: 1,
                  dataTypes: JSON.stringify(['payment', 'transaction']),
                  detectedAt: new Date(),
                },
              })
            } catch (err) {
              paymentLogger.error('Failed to log breach incident', { error: err })
            }

            throw new Error('amount_mismatch')
          }

          // Payment successful - update payment and registration
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'COMPLETED',
              yaadPayCCode: parseInt(validation.orderId || '0'),
              yaadPayTransactionId: validation.transactionId,
              yaadPayConfirmCode: validation.confirmationCode,
              completedAt: new Date(),
            },
          })

          // CRITICAL: Check capacity BEFORE finalizing registration
          // Fetch current event state within transaction for atomic capacity check
          const currentEvent = await tx.event.findUnique({
            where: { id: payment.eventId },
            select: { capacity: true, spotsReserved: true, eventType: true },
          })

          if (!currentEvent) {
            throw new Error('Event not found in transaction')
          }

          // Determine final registration status based on capacity (CAPACITY_BASED events only)
          // If the registration was cancelled, start as WAITLIST and re-evaluate
          let finalStatus: 'CONFIRMED' | 'WAITLIST' =
            payment.registration.status === 'CANCELLED' ? 'WAITLIST' : payment.registration.status
          let shouldIncrementSpots = false

          if (currentEvent.eventType === 'CAPACITY_BASED') {
            const spotsAvailable = currentEvent.capacity - currentEvent.spotsReserved

            if (spotsAvailable >= payment.registration.spotsCount) {
              // Capacity available - confirm and reserve spots
              finalStatus = 'CONFIRMED'
              shouldIncrementSpots = true
            } else {
              // No capacity - move to waitlist
              finalStatus = 'WAITLIST'
              shouldIncrementSpots = false
            }
          }

          // Update registration payment status and final status
          const updatedRegistration = await tx.registration.update({
            where: { id: payment.registrationId },
            data: {
              paymentStatus: 'COMPLETED',
              amountPaid: validation.amount || payment.amount,
              status: finalStatus, // May change to WAITLIST if capacity exceeded
            },
          })

          // Atomically increment event.spotsReserved ONLY if confirmed
          if (shouldIncrementSpots) {
            await tx.event.update({
              where: { id: payment.eventId },
              data: { spotsReserved: { increment: updatedRegistration.spotsCount } },
            })
          }

          return {
            alreadyProcessed: false,
            success: true,
            payment: updatedPayment,
            registration: updatedRegistration,
          }
        } else {
          // Payment failed - update payment status
          const updatedPayment = await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'FAILED',
              yaadPayCCode: parseInt(params.CCode || '-1'),
              yaadPayTransactionId: validation.transactionId,
            },
          })

          // Optionally update registration status (keep as PENDING for retry)
          await tx.registration.update({
            where: { id: payment.registrationId },
            data: {
              paymentStatus: 'FAILED',
            },
          })

          return {
            alreadyProcessed: false,
            success: false,
            payment: updatedPayment,
            errorMessage: validation.errorMessage,
          }
        }
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    // If already processed in concurrent request, redirect to success
    if (result.alreadyProcessed) {
      paymentLogger.info('Payment processed by concurrent request, redirecting', {
        orderId: validation.orderId,
      })
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    }

    // Handle success case
    if (result.success) {
      paymentLogger.info('Payment successful, sending confirmation email', {
        orderId: validation.orderId,
        registrationId: payment.registrationId,
      })

      // Generate QR code for registration
      try {
        const qrCodeImage = await generateQRCodeImage(payment.registration.id, payment.event.id, {
          width: 300,
          margin: 2,
        })

        // Send confirmation email (don't fail redirect if email fails)
        if (payment.registration.email) {
          try {
            const eventDate = format(
              new Date(payment.event.startAt),
              'EEEE, dd בMMMM yyyy בשעה HH:mm',
              { locale: he }
            )

            const cancellationUrl = payment.registration.cancellationToken
              ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/cancel/${payment.registration.cancellationToken}`
              : undefined

            await sendRegistrationConfirmationEmail(payment.registration.email, {
              name: (payment.registration.data as Record<string, unknown>).name as string,
              eventName: payment.event.title,
              eventDate,
              eventLocation: payment.event.location || undefined,
              confirmationCode: payment.registration.confirmationCode,
              qrCodeImage,
              status: payment.registration.status as 'CONFIRMED' | 'WAITLIST',
              schoolName: payment.school.name,
              cancellationUrl,
            })

            paymentLogger.info('Confirmation email sent', {
              email: payment.registration.email,
              orderId: validation.orderId,
            })
          } catch (emailError) {
            paymentLogger.error('Failed to send confirmation email', {
              error: emailError,
              email: payment.registration.email,
              orderId: validation.orderId,
            })
          }
        }
      } catch (qrError) {
        paymentLogger.error('Failed to generate QR code', {
          error: qrError,
          registrationId: payment.registrationId,
        })
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    } else {
      // Handle failure case
      paymentLogger.error('Payment failed', {
        error: result.errorMessage,
        orderId: validation.orderId,
        registrationId: payment.registrationId,
      })
      return NextResponse.redirect(
        new URL(
          `/payment/failed?error=${encodeURIComponent(result.errorMessage || 'תשלום נכשל')}`,
          request.url
        )
      )
    }
  } catch (error) {
    paymentLogger.error('Unexpected error in payment callback', { error })

    // Map error to safe error code (prevent XSS)
    let errorCode = 'default'
    if (error instanceof Error) {
      if (error.message === 'amount_mismatch') {
        errorCode = 'amount_mismatch'
      } else if (error.message.includes('timeout')) {
        errorCode = 'timeout'
      }
    }

    return NextResponse.redirect(new URL(`/payment/failed?code=${errorCode}`, request.url))
  }
}
