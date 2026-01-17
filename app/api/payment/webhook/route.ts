import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { validateCallback, type YaadPayCallback } from '@/lib/yaadpay'
import { PaymentStatus } from '@prisma/client'
import { paymentLogger } from '@/lib/logger-v2'

/**
 * YaadPay Webhook Handler (Server-to-Server Notification)
 *
 * This endpoint receives async notifications from YaadPay after payment processing.
 * Key differences from callback route:
 * - Server-to-server (no user redirect)
 * - Must return 200 OK for YaadPay to not retry
 * - No email sending (user already got email from callback)
 * - Logging is critical for tracking webhook deliveries
 *
 * Critical: Idempotency is MANDATORY - YaadPay may retry webhooks
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse YaadPay callback parameters from URL query string or POST body
    const { searchParams } = new URL(request.url)
    const params: YaadPayCallback = {
      CCode: searchParams.get('CCode') || '',
      Order: searchParams.get('Order') || '',
      Id: searchParams.get('Id') || '',
      ConfirmationCode: searchParams.get('ConfirmationCode') || undefined,
      Amount: searchParams.get('Amount') || undefined,
      ACode: searchParams.get('ACode') || undefined,
      Param1: searchParams.get('Param1') || undefined,
      signature: searchParams.get('signature') || undefined,
    }

    paymentLogger.info('Webhook received', {
      orderId: params.Order,
      transactionId: params.Id,
      cCode: params.CCode,
    })

    // Validate callback parameters
    const validation = validateCallback(params)

    if (!validation.isValid) {
      paymentLogger.error('Invalid webhook parameters', { error: validation.errorMessage })
      // Return 200 OK even for invalid webhooks to prevent YaadPay retries
      // Log the error but don't fail
      return NextResponse.json({
        received: true,
        warning: 'Invalid parameters - logged for review'
      })
    }

    const { orderId, transactionId, isSuccess, confirmationCode, amount, errorMessage } = validation

    // ============================================================================
    // IDEMPOTENCY CHECK - Critical to prevent duplicate processing
    // ============================================================================

    // Find payment by paymentIntentId (stored in Registration.paymentIntentId)
    const registration = await prisma.registration.findUnique({
      where: { paymentIntentId: orderId },
      include: {
        payment: true,
        event: {
          select: {
            id: true,
            title: true,
            schoolId: true
          }
        }
      }
    })

    if (!registration) {
      paymentLogger.error('Payment not found for orderId', { orderId })
      // Return 200 OK to prevent retries for non-existent payments
      return NextResponse.json({
        received: true,
        warning: 'Payment not found - may be test transaction'
      })
    }

    // Check if payment already processed (idempotency)
    if (registration.payment && registration.payment.status !== 'PENDING') {
      const alreadyProcessed = registration.payment.status === 'COMPLETED' && isSuccess
      const alreadyFailed = registration.payment.status === 'FAILED' && !isSuccess

      if (alreadyProcessed || alreadyFailed) {
        paymentLogger.info('Payment already processed (duplicate webhook)', {
          orderId,
          currentStatus: registration.payment.status,
          webhookSuccess: isSuccess,
          processingTimeMs: Date.now() - startTime,
        })

        // Return success for duplicate webhooks (idempotency)
        return NextResponse.json({
          received: true,
          message: 'Payment already processed',
          status: registration.payment.status
        })
      }
    }

    // ============================================================================
    // ATOMIC TRANSACTION - Update Payment + Registration
    // ============================================================================

    const newPaymentStatus: PaymentStatus = isSuccess ? 'COMPLETED' : 'FAILED'
    const newRegistrationPaymentStatus = isSuccess ? 'COMPLETED' : 'FAILED'

    paymentLogger.info('Processing payment update', {
      orderId,
      newStatus: newPaymentStatus,
      isSuccess,
      transactionId,
    })

    await prisma.$transaction(async (tx) => {
      // Update or create Payment record
      if (registration.payment) {
        // Update existing payment
        await tx.payment.update({
          where: { id: registration.payment.id },
          data: {
            status: newPaymentStatus,
            yaadPayTransactionId: transactionId,
            yaadPayConfirmCode: confirmationCode,
            yaadPayCCode: parseInt(params.CCode || '-1'),
            completedAt: isSuccess ? new Date() : undefined,
            updatedAt: new Date()
          }
        })
      } else {
        // Create payment record if it doesn't exist
        await tx.payment.create({
          data: {
            registrationId: registration.id,
            eventId: registration.event.id,
            schoolId: registration.event.schoolId,
            amount: amount || registration.amountDue || 0,
            currency: 'ILS',
            status: newPaymentStatus,
            paymentMethod: 'yaadpay',
            yaadPayOrderId: orderId,
            yaadPayTransactionId: transactionId,
            yaadPayConfirmCode: confirmationCode,
            yaadPayCCode: parseInt(params.CCode || '-1'),
            payerEmail: registration.email || undefined,
            payerPhone: registration.phoneNumber || undefined,
            completedAt: isSuccess ? new Date() : undefined
          }
        })
      }

      // Update registration payment status
      await tx.registration.update({
        where: { id: registration.id },
        data: {
          paymentStatus: newRegistrationPaymentStatus,
          amountPaid: isSuccess ? (amount || registration.amountDue) : undefined,
          updatedAt: new Date()
        }
      })
    })

    const processingTime = Date.now() - startTime

    paymentLogger.info('Payment processed successfully via webhook', {
      orderId,
      transactionId,
      status: newPaymentStatus,
      isSuccess,
      confirmationCode,
      processingTimeMs: processingTime,
    })

    // ============================================================================
    // SUCCESS RESPONSE - Return 200 OK for YaadPay
    // ============================================================================

    return NextResponse.json({
      received: true,
      status: newPaymentStatus,
      orderId,
      transactionId,
      processingTime
    })

  } catch (error) {
    const processingTime = Date.now() - startTime

    paymentLogger.error('Error processing webhook', {
      error,
      processingTimeMs: processingTime,
    })

    // CRITICAL: Return 200 OK even on error to prevent YaadPay retries
    // Log the error for manual review, but don't fail the webhook
    return NextResponse.json({
      received: true,
      warning: 'Error processing webhook - logged for review'
    })
  }
}

/**
 * Health check endpoint for webhook
 * Useful for verifying webhook URL is accessible
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'yaadpay-webhook',
    timestamp: new Date().toISOString()
  })
}
