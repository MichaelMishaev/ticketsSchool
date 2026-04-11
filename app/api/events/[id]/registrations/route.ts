import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { logger } from '@/lib/logger-v2'

/**
 * Lightweight registrations list endpoint for real-time polling.
 * Returns only the fields needed by the registrations tab.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: eventId } = await params

    // Verify admin has access to this event
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const url = new URL(request.url)
    const statusFilter = url.searchParams.get('status')
    const searchQuery = url.searchParams.get('search')

    const whereClause: Record<string, unknown> = { eventId }
    if (statusFilter) {
      whereClause.status = statusFilter
    }
    if (searchQuery) {
      whereClause.data = {
        path: ['name'],
        string_contains: searchQuery,
      }
    }

    const registrations = await prisma.registration.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        status: true,
        spotsCount: true,
        phoneNumber: true,
        data: true,
        confirmationCode: true,
        createdAt: true,
      },
    })

    // [PAYMENT_PENDING_TRACE] Log status breakdown on every poll — admins hit this every 3s
    const breakdown: Record<string, number> = {}
    for (const r of registrations) {
      breakdown[r.status] = (breakdown[r.status] ?? 0) + 1
    }
    logger.info('[PAYMENT_PENDING_TRACE] Polling endpoint returned', {
      source: 'registrations-poll',
      eventId,
      adminId: admin.adminId,
      total: registrations.length,
      statusBreakdown: breakdown,
      statusFilter,
      hasSearchQuery: !!searchQuery,
      paymentPendingIds: registrations
        .filter((r) => r.status === 'PAYMENT_PENDING')
        .map((r) => r.id),
    })

    return NextResponse.json({
      registrations: registrations.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    logger.error('[PAYMENT_PENDING_TRACE] Polling endpoint error', {
      source: 'registrations-poll',
      error,
    })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
