# Monitoring Integration Examples

This guide shows how to integrate OpenTelemetry and Sentry monitoring into your Next.js API routes and server components.

## Table of Contents

1. [API Route Examples](#api-route-examples)
2. [Registration Flow](#registration-flow)
3. [Payment Flow](#payment-flow)
4. [Server Component Examples](#server-component-examples)
5. [Error Handling](#error-handling)
6. [Performance Tracking](#performance-tracking)

---

## API Route Examples

### Basic API Route with Monitoring

```typescript
// app/api/events/route.ts
import { NextResponse } from 'next/server'
import { getCurrentAdmin } from '@/lib/auth.server'
import { initSentryForRequest, setUserContext, setSchoolContext } from '@/lib/monitoring/sentry'
import { trackAPICall, startTimer } from '@/lib/monitoring/metrics'

export async function GET(request: Request) {
  // Start timer for performance tracking
  const stopTimer = startTimer()

  // Initialize Sentry context
  initSentryForRequest(request)

  try {
    // Get authenticated admin
    const admin = await getCurrentAdmin()
    if (!admin) {
      const duration = stopTimer()
      trackAPICall('/api/events', 'GET', 401, duration)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Set monitoring context
    setUserContext(admin.id, admin.email, { role: admin.role })
    if (admin.schoolId) {
      setSchoolContext(admin.schoolId, admin.schoolName)
    }

    // Fetch events
    const events = await prisma.event.findMany({
      where: admin.role !== 'SUPER_ADMIN' ? { schoolId: admin.schoolId } : {},
    })

    // Track successful request
    const duration = stopTimer()
    trackAPICall('/api/events', 'GET', 200, duration)

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)

    // Track error
    const duration = stopTimer()
    trackAPICall('/api/events', 'GET', 500, duration)

    // Error is automatically sent to Sentry via instrumentation.ts
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 })
  }
}
```

---

## Registration Flow

### Complete Registration Flow with Tracing

```typescript
// app/api/events/[id]/register/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createSpan, traceRegistration } from '@/lib/monitoring/telemetry'
import { trackRegistration, startTimer } from '@/lib/monitoring/metrics'
import { addBreadcrumb, setEventContext } from '@/lib/monitoring/sentry'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const stopTimer = startTimer()
  const eventId = params.id

  try {
    const body = await request.json()
    const { fullName, email, phone, spotsCount } = body

    // Set event context for error tracking
    setEventContext(eventId)
    addBreadcrumb('registration', 'Starting registration process', {
      eventId,
      spotsRequested: spotsCount,
    })

    // Trace registration with custom span
    const result = await traceRegistration(eventId, spotsCount, async () => {
      return await createSpan('registration.transaction', async (span) => {
        // Atomic transaction with capacity check
        const registration = await prisma.$transaction(async (tx) => {
          // Check capacity
          const event = await tx.event.findUnique({
            where: { id: eventId },
          })

          if (!event) {
            throw new Error('Event not found')
          }

          span.setAttributes({
            'event.capacity': event.capacity,
            'event.spotsReserved': event.spotsReserved,
          })

          let status: 'CONFIRMED' | 'WAITLIST'

          if (event.spotsReserved + spotsCount > event.capacity) {
            status = 'WAITLIST'
            addBreadcrumb('registration', 'Event at capacity, adding to waitlist', {
              capacity: event.capacity,
              reserved: event.spotsReserved,
            })
          } else {
            status = 'CONFIRMED'
            await tx.event.update({
              where: { id: eventId },
              data: { spotsReserved: { increment: spotsCount } },
            })
            addBreadcrumb('registration', 'Spots reserved successfully', {
              spotsReserved: spotsCount,
            })
          }

          // Create registration
          const registration = await tx.registration.create({
            data: {
              eventId,
              fullName,
              email,
              phone,
              spotsCount,
              status,
              confirmationCode: generateConfirmationCode(),
            },
          })

          span.setAttributes({
            'registration.id': registration.id,
            'registration.status': status,
            'registration.confirmationCode': registration.confirmationCode,
          })

          return { registration, status }
        })

        return registration
      })
    })

    // Track metrics
    const duration = stopTimer()
    trackRegistration(eventId, result.status, duration)
    trackAPICall('/api/events/[id]/register', 'POST', 200, duration)

    addBreadcrumb('registration', 'Registration completed successfully', {
      registrationId: result.registration.id,
      status: result.status,
    })

    return NextResponse.json({
      success: true,
      registration: result.registration,
      status: result.status,
    })
  } catch (error) {
    console.error('Registration failed:', error)

    const duration = stopTimer()
    trackAPICall('/api/events/[id]/register', 'POST', 500, duration)

    addBreadcrumb(
      'registration',
      'Registration failed',
      {
        error: (error as Error).message,
      },
      'error'
    )

    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}
```

---

## Payment Flow

### Payment Creation with Tracing

```typescript
// app/api/payment/create/route.ts
import { NextResponse } from 'next/server'
import { YaadPayClient } from '@/lib/yaadpay'
import { tracePayment } from '@/lib/monitoring/telemetry'
import { trackPayment, startTimer } from '@/lib/monitoring/metrics'
import { setPaymentContext, addBreadcrumb } from '@/lib/monitoring/sentry'

export async function POST(request: Request) {
  const stopTimer = startTimer()

  try {
    const body = await request.json()
    const { registrationId, amount, currency } = body

    // Trace payment processing
    const payment = await tracePayment(amount, currency, async () => {
      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          registrationId,
          amount,
          currency,
          status: 'PROCESSING',
          yaadPayOrderId: generatePaymentIntent(),
        },
      })

      setPaymentContext(payment.id, payment.yaadPayOrderId, {
        amount,
        currency,
        status: 'PROCESSING',
      })

      addBreadcrumb('payment', 'Payment record created', {
        paymentId: payment.id,
        amount,
      })

      // Mock mode check
      if (process.env.YAADPAY_MOCK_MODE === 'true') {
        addBreadcrumb('payment', 'Mock mode enabled, skipping YaadPay', {
          mode: 'mock',
        })
        return { payment, mockMode: true }
      }

      // Create YaadPay payment
      const yaadpay = new YaadPayClient()
      const yaadpayResponse = await yaadpay.createPayment({
        amount,
        currency,
        orderId: payment.yaadPayOrderId,
      })

      addBreadcrumb('payment', 'YaadPay payment created', {
        orderId: payment.yaadPayOrderId,
      })

      return { payment, yaadpayResponse, mockMode: false }
    })

    // Track metrics
    const duration = stopTimer()
    trackPayment(amount, 'PROCESSING', duration, currency)
    trackAPICall('/api/payment/create', 'POST', 200, duration)

    return NextResponse.json({
      success: true,
      payment: payment.payment,
      mockMode: payment.mockMode,
    })
  } catch (error) {
    console.error('Payment creation failed:', error)

    const duration = stopTimer()
    trackPayment(0, 'FAILED', duration, 'ils')
    trackAPICall('/api/payment/create', 'POST', 500, duration)

    return NextResponse.json({ error: 'Payment creation failed' }, { status: 500 })
  }
}

function generatePaymentIntent(): string {
  return `PAY_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
```

### Payment Callback Handler

```typescript
// app/api/payment/callback/route.ts
import { NextResponse } from 'next/server'
import { trackPayment, startTimer } from '@/lib/monitoring/metrics'
import { addBreadcrumb, setPaymentContext } from '@/lib/monitoring/sentry'
import { createSpan } from '@/lib/monitoring/telemetry'

export async function GET(request: Request) {
  const stopTimer = startTimer()

  try {
    const url = new URL(request.url)
    const orderId = url.searchParams.get('Order')
    const status = url.searchParams.get('Status')

    if (!orderId) {
      throw new Error('Missing Order parameter')
    }

    addBreadcrumb('payment', 'Payment callback received', {
      orderId,
      status,
    })

    // Find payment by YaadPay order ID
    const payment = await createSpan('payment.callback.findPayment', async (span) => {
      const payment = await prisma.payment.findFirst({
        where: { yaadPayOrderId: orderId },
        include: { registration: true },
      })

      if (!payment) {
        throw new Error(`Payment not found for order ${orderId}`)
      }

      span.setAttributes({
        'payment.id': payment.id,
        'payment.amount': payment.amount,
        'registration.id': payment.registrationId,
      })

      return payment
    })

    setPaymentContext(payment.id, orderId, {
      amount: payment.amount,
      status,
    })

    // Update payment status
    await createSpan('payment.callback.updateStatus', async (span) => {
      const isSuccess = status === '1' || status === 'success'
      const newStatus = isSuccess ? 'COMPLETED' : 'FAILED'

      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          updatedAt: new Date(),
        },
      })

      // Update registration
      await prisma.registration.update({
        where: { id: payment.registrationId },
        data: {
          paymentStatus: newStatus,
        },
      })

      span.setAttributes({
        'payment.status': newStatus,
        'payment.success': isSuccess,
      })

      addBreadcrumb('payment', `Payment ${newStatus.toLowerCase()}`, {
        paymentId: payment.id,
        amount: payment.amount,
      })
    })

    // Track metrics
    const duration = stopTimer()
    trackPayment(
      payment.amount,
      status === '1' ? 'COMPLETED' : 'FAILED',
      duration,
      payment.currency
    )
    trackAPICall('/api/payment/callback', 'GET', 200, duration)

    // Redirect to success/failure page
    const redirectUrl =
      status === '1'
        ? `/payment/success?code=${payment.registration.confirmationCode}`
        : `/payment/failed?orderId=${orderId}`

    return NextResponse.redirect(new URL(redirectUrl, request.url))
  } catch (error) {
    console.error('Payment callback failed:', error)

    const duration = stopTimer()
    trackAPICall('/api/payment/callback', 'GET', 500, duration)

    return NextResponse.redirect(new URL('/payment/error', request.url))
  }
}
```

---

## Server Component Examples

### Dashboard Page with Monitoring

```typescript
// app/admin/dashboard/page.tsx
import { getCurrentAdmin } from '@/lib/auth.server'
import { setUserContext, setSchoolContext } from '@/lib/monitoring/sentry'
import { createSpan } from '@/lib/monitoring/telemetry'
import { startTimer, trackDatabaseQuery } from '@/lib/monitoring/metrics'

export default async function DashboardPage() {
  const stopTimer = startTimer()

  try {
    // Get admin
    const admin = await getCurrentAdmin()
    if (!admin) {
      redirect('/admin/login')
    }

    // Set monitoring context
    setUserContext(admin.id, admin.email, { role: admin.role })
    if (admin.schoolId) {
      setSchoolContext(admin.schoolId, admin.schoolName)
    }

    // Fetch dashboard data with tracing
    const [events, registrations, stats] = await createSpan(
      'dashboard.fetchData',
      async (span) => {
        span.setAttributes({
          'admin.id': admin.id,
          'school.id': admin.schoolId || 'none',
        })

        const [events, registrations, stats] = await Promise.all([
          // Fetch events
          createSpan('dashboard.fetchEvents', async () => {
            const queryStopTimer = startTimer()
            const events = await prisma.event.findMany({
              where:
                admin.role !== 'SUPER_ADMIN'
                  ? { schoolId: admin.schoolId }
                  : {},
              take: 10,
              orderBy: { createdAt: 'desc' },
            })
            trackDatabaseQuery('event', 'findMany', queryStopTimer())
            return events
          }),

          // Fetch registrations
          createSpan('dashboard.fetchRegistrations', async () => {
            const queryStopTimer = startTimer()
            const registrations = await prisma.registration.findMany({
              where:
                admin.role !== 'SUPER_ADMIN'
                  ? { event: { schoolId: admin.schoolId } }
                  : {},
              take: 10,
              orderBy: { createdAt: 'desc' },
            })
            trackDatabaseQuery('registration', 'findMany', queryStopTimer())
            return registrations
          }),

          // Fetch stats
          createSpan('dashboard.fetchStats', async () => {
            const queryStopTimer = startTimer()
            const stats = await prisma.event.groupBy({
              by: ['status'],
              where:
                admin.role !== 'SUPER_ADMIN'
                  ? { schoolId: admin.schoolId }
                  : {},
              _count: true,
            })
            trackDatabaseQuery('event', 'groupBy', queryStopTimer())
            return stats
          }),
        ])

        span.setAttributes({
          'dashboard.events_count': events.length,
          'dashboard.registrations_count': registrations.length,
        })

        return [events, registrations, stats]
      }
    )

    return (
      <div>
        <h1>Dashboard</h1>
        {/* Render dashboard UI */}
      </div>
    )
  } catch (error) {
    console.error('Dashboard error:', error)
    throw error // Will be caught by error.tsx
  }
}
```

---

## Error Handling

### Error Boundary with Sentry

```typescript
// app/error.tsx
'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to Sentry
    Sentry.captureException(error, {
      tags: {
        boundary: 'app_error',
      },
      extra: {
        digest: error.digest,
      },
    })
  }, [error])

  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

---

## Performance Tracking

### Custom Performance Tracking

```typescript
// lib/performance.ts
import { startPerformanceTimer } from '@/lib/monitoring/sentry'
import { startTimer } from '@/lib/monitoring/metrics'

export async function trackOperation<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const sentryTimer = startPerformanceTimer(name)
  const metricsTimer = startTimer()

  try {
    const result = await operation()
    const duration = metricsTimer()

    // Track in Sentry
    sentryTimer({ status: 'success', duration })

    return result
  } catch (error) {
    const duration = metricsTimer()

    // Track failure
    sentryTimer({ status: 'error', duration, error: (error as Error).message })

    throw error
  }
}

// Usage
const events = await trackOperation('fetchEvents', async () => {
  return await prisma.event.findMany()
})
```

---

## Best Practices

### 1. Always Set Context Early

```typescript
// ✅ GOOD - Set context at the start of the request
export async function POST(request: Request) {
  initSentryForRequest(request)
  const admin = await getCurrentAdmin()
  setUserContext(admin.id, admin.email)
  setSchoolContext(admin.schoolId)

  // ... rest of handler
}

// ❌ BAD - Missing context
export async function POST(request: Request) {
  // No context set - errors will lack debugging info
  const admin = await getCurrentAdmin()
  // ... rest of handler
}
```

### 2. Track All Critical Operations

```typescript
// ✅ GOOD - Track registration with metrics and spans
const result = await traceRegistration(eventId, spotsCount, async () => {
  const registration = await createRegistration(data)
  trackRegistration(eventId, registration.status, duration)
  return registration
})

// ❌ BAD - No tracking
const registration = await createRegistration(data)
```

### 3. Add Breadcrumbs for Context

```typescript
// ✅ GOOD - Add breadcrumbs before operations
addBreadcrumb('registration', 'Checking event capacity', { eventId })
const event = await prisma.event.findUnique({ where: { id: eventId } })

addBreadcrumb('registration', 'Creating registration', { status: 'CONFIRMED' })
const registration = await prisma.registration.create({ data })

// ❌ BAD - No breadcrumbs (hard to debug errors)
const event = await prisma.event.findUnique({ where: { id: eventId } })
const registration = await prisma.registration.create({ data })
```

### 4. Filter Sensitive Data

```typescript
// ✅ GOOD - Filter before sending to Sentry
addBreadcrumb('user', 'User registration', {
  email: '[REDACTED]',
  phone: '[REDACTED]',
  name: userData.fullName,
})

// ❌ BAD - Exposing PII
addBreadcrumb('user', 'User registration', {
  email: userData.email,
  phone: userData.phone,
  creditCard: userData.creditCard,
})
```

---

**Last Updated:** 2026-01-12
