import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

export const runtime = 'nodejs' // SSE requires Node.js runtime
export const dynamic = 'force-dynamic'

interface StreamParams {
  params: Promise<{
    id: string
  }>
}

/**
 * Server-Sent Events (SSE) endpoint for real-time registration updates
 *
 * Streams new registrations as they occur to the admin dashboard.
 * The client connects via EventSource and receives updates automatically.
 *
 * Security: Enforces multi-tenant isolation - admins only see their school's registrations.
 */
export async function GET(request: NextRequest, { params }: StreamParams) {
  try {
    const { id: eventId } = await params
    const admin = await getCurrentAdmin()

    if (!admin) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify admin has access to this event (multi-tenant isolation)
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { schoolId: true }
    })

    if (!event) {
      return new Response('Event not found', { status: 404 })
    }

    // Enforce multi-tenant isolation
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return new Response('Forbidden', { status: 403 })
    }

    // Track last seen registration timestamp
    let lastSeenAt = new Date()

    // Create readable stream for SSE
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Send initial connection message
        const connectMessage = `data: ${JSON.stringify({
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`
        controller.enqueue(encoder.encode(connectMessage))

        // Poll for new registrations every 2 seconds
        const intervalId = setInterval(async () => {
          try {
            // Find registrations created after last check
            const newRegistrations = await prisma.registration.findMany({
              where: {
                eventId,
                createdAt: {
                  gt: lastSeenAt
                }
              },
              orderBy: {
                createdAt: 'asc'
              },
              select: {
                id: true,
                status: true,
                spotsCount: true,
                phoneNumber: true,
                data: true,
                confirmationCode: true,
                createdAt: true
              }
            })

            // Send each new registration as separate SSE message
            if (newRegistrations.length > 0) {
              for (const registration of newRegistrations) {
                const message = `data: ${JSON.stringify({
                  type: 'new_registration',
                  registration: {
                    ...registration,
                    createdAt: registration.createdAt.toISOString()
                  }
                })}\n\n`
                controller.enqueue(encoder.encode(message))

                // Update last seen timestamp
                if (registration.createdAt > lastSeenAt) {
                  lastSeenAt = registration.createdAt
                }
              }

              // Send stats update after new registrations
              const stats = await prisma.registration.groupBy({
                by: ['status'],
                where: { eventId },
                _count: true
              })

              const statsMessage = `data: ${JSON.stringify({
                type: 'stats_update',
                stats: {
                  confirmed: stats.find(s => s.status === 'CONFIRMED')?._count || 0,
                  waitlist: stats.find(s => s.status === 'WAITLIST')?._count || 0,
                  cancelled: stats.find(s => s.status === 'CANCELLED')?._count || 0
                }
              })}\n\n`
              controller.enqueue(encoder.encode(statsMessage))
            }

            // Send heartbeat to keep connection alive (every 30 seconds)
            const now = Date.now()
            if (now % 30000 < 2000) { // Within 2-second polling window
              const heartbeat = `data: ${JSON.stringify({
                type: 'heartbeat',
                timestamp: new Date().toISOString()
              })}\n\n`
              controller.enqueue(encoder.encode(heartbeat))
            }
          } catch (error) {
            logger.error('SSE polling error', { source: 'events', error })
            // Don't close stream on polling errors, just log and continue
          }
        }, 2000) // Poll every 2 seconds

        // Cleanup on client disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(intervalId)
          controller.close()
        })
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no', // Disable nginx buffering
      }
    })
  } catch (error) {
    logger.error('SSE endpoint error', { source: 'events', error })
    return new Response('Internal server error', { status: 500 })
  }
}
