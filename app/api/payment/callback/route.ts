import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCallback, type YaadPayCallback } from '@/lib/yaadpay'
import { sendRegistrationConfirmationEmail } from '@/lib/email'
import { generateQRCodeImage } from '@/lib/qr-code'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

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

    console.log('[Payment Callback] Received:', {
      CCode: params.CCode,
      Order: params.Order,
      Id: params.Id,
      method: request.method,
    })

    // Validate callback
    const validation = validateCallback(params)

    if (!validation.isValid) {
      console.error('[Payment Callback] Invalid callback:', validation.errorMessage)
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent(validation.errorMessage || 'Invalid callback')}`, request.url)
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
      console.error('[Payment Callback] Payment not found:', validation.orderId)
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent('תשלום לא נמצא במערכת')}`, request.url)
      )
    }

    // CRITICAL: Idempotency check - if already completed, skip processing
    if (payment.status === 'COMPLETED') {
      console.log('[Payment Callback] Payment already completed, redirecting to success')
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    }

    // Verify multi-tenant isolation
    if (payment.schoolId !== payment.event.schoolId) {
      console.error('[Payment Callback] School ID mismatch:', {
        paymentSchoolId: payment.schoolId,
        eventSchoolId: payment.event.schoolId,
      })
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent('שגיאה במערכת')}`, request.url)
      )
    }

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
          const expectedAmount = parseFloat(payment.amount.toString())
          const paidAmount = validation.amount || 0

          if (Math.abs(expectedAmount - paidAmount) > 0.01) {
            console.error('[Payment Callback] Amount mismatch - potential tampering:', {
              expected: expectedAmount,
              received: paidAmount,
              orderId: validation.orderId,
              paymentId: payment.id
            })

            // Mark payment as failed due to amount mismatch
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

          // Update registration payment status
          const updatedRegistration = await tx.registration.update({
            where: { id: payment.registrationId },
            data: {
              paymentStatus: 'COMPLETED',
              amountPaid: validation.amount || payment.amount,
            },
          })

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
      console.log('[Payment Callback] Payment processed by concurrent request, redirecting')
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    }

    // Handle success case
    if (result.success) {
      console.log('[Payment Callback] Payment successful, sending confirmation email')

      // Generate QR code for registration
      try {
        const qrCodeImage = await generateQRCodeImage(
          payment.registration.id,
          payment.event.id,
          {
            width: 300,
            margin: 2,
          }
        )

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

            console.log('[Payment Callback] Confirmation email sent to:', payment.registration.email)
          } catch (emailError) {
            console.error('[Payment Callback] Failed to send confirmation email:', emailError)
          }
        }
      } catch (qrError) {
        console.error('[Payment Callback] Failed to generate QR code:', qrError)
      }

      // Redirect to success page
      return NextResponse.redirect(
        new URL(`/payment/success?code=${payment.registration.confirmationCode}`, request.url)
      )
    } else {
      // Handle failure case
      console.error('[Payment Callback] Payment failed:', result.errorMessage)
      return NextResponse.redirect(
        new URL(`/payment/failed?error=${encodeURIComponent(result.errorMessage || 'תשלום נכשל')}`, request.url)
      )
    }
  } catch (error) {
    console.error('[Payment Callback] Unexpected error:', error)

    // Map error to safe error code (prevent XSS)
    let errorCode = 'default'
    if (error instanceof Error) {
      if (error.message === 'amount_mismatch') {
        errorCode = 'amount_mismatch'
      } else if (error.message.includes('timeout')) {
        errorCode = 'timeout'
      }
    }

    return NextResponse.redirect(
      new URL(`/payment/failed?code=${errorCode}`, request.url)
    )
  }
}
