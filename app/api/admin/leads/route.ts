import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { normalizePhoneNumber } from '@/lib/utils'
import { logger } from '@/lib/logger-v2'

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin()

    // Enforce multi-tenant isolation
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json(
          { error: 'Admin must have a school assigned' },
          { status: 403 }
        )
      }
    }

    const searchParams = request.nextUrl.searchParams
    const eventId = searchParams.get('eventId')
    const status = searchParams.get('status') // 'CONFIRMED', 'WAITLIST', or null for all
    const search = searchParams.get('search')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    // Build where clause
    const where: any = {}

    // Multi-tenant filter
    if (admin.role !== 'SUPER_ADMIN') {
      where.event = { schoolId: admin.schoolId }
    }

    // Event filter
    if (eventId) {
      where.eventId = eventId
    }

    // Status filter
    if (status && (status === 'CONFIRMED' || status === 'WAITLIST')) {
      where.status = status
    }

    // Date range filter
    if (dateFrom || dateTo) {
      where.createdAt = {}
      if (dateFrom) {
        where.createdAt.gte = new Date(dateFrom)
      }
      if (dateTo) {
        where.createdAt.lte = new Date(dateTo)
      }
    }

    // Fetch all registrations with event data
    const registrations = await prisma.registration.findMany({
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startAt: true,
            schoolId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Group by normalized phone number
    const leadsMap = new Map<string, {
      name: string
      phone: string
      email: string | null
      events: Array<{ id: string; name: string; date: Date; status: string }>
      confirmedCount: number
      waitlistCount: number
      latestRegistration: Date
      totalGuests: number
    }>()

    for (const reg of registrations) {
      // Extract name and email from JSON data field
      const regData = reg.data as any
      const name = regData?.name || 'Unknown'
      const email = regData?.email || null

      // Normalize phone
      let normalizedPhone: string | null = null
      if (reg.phoneNumber) {
        try {
          normalizedPhone = normalizePhoneNumber(reg.phoneNumber)
        } catch (error) {
          // If phone normalization fails, use original
          normalizedPhone = reg.phoneNumber
        }
      }

      // Apply search filter after normalization
      if (search) {
        const searchLower = search.toLowerCase()
        const matchesSearch =
          name.toLowerCase().includes(searchLower) ||
          (normalizedPhone && normalizedPhone.includes(searchLower)) ||
          (email && email.toLowerCase().includes(searchLower))

        if (!matchesSearch) {
          continue
        }
      }

      // Get or create lead entry (skip if no phone number)
      if (!normalizedPhone) {
        continue
      }
      const existing = leadsMap.get(normalizedPhone)

      if (existing) {
        // Add event to existing lead
        existing.events.push({
          id: reg.event.id,
          name: reg.event.title,
          date: reg.event.startAt,
          status: reg.status,
        })

        // Update counts
        if (reg.status === 'CONFIRMED') {
          existing.confirmedCount++
        } else if (reg.status === 'WAITLIST') {
          existing.waitlistCount++
        }

        // Update totals
        existing.totalGuests += reg.guestsCount || 0

        // Update to latest name/email (most recent registration)
        if (reg.createdAt > existing.latestRegistration) {
          existing.name = name
          existing.email = email
          existing.latestRegistration = reg.createdAt
        }
      } else {
        // Create new lead entry
        leadsMap.set(normalizedPhone, {
          name,
          phone: normalizedPhone,
          email,
          events: [{
            id: reg.event.id,
            name: reg.event.title,
            date: reg.event.startAt,
            status: reg.status,
          }],
          confirmedCount: reg.status === 'CONFIRMED' ? 1 : 0,
          waitlistCount: reg.status === 'WAITLIST' ? 1 : 0,
          latestRegistration: reg.createdAt,
          totalGuests: reg.guestsCount || 0,
        })
      }
    }

    // Convert map to array
    const leads = Array.from(leadsMap.values())

    return NextResponse.json({
      success: true,
      leads,
      total: leads.length,
    })
  } catch (error) {
    logger.error('Failed to fetch leads', { source: 'admin', error })
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    )
  }
}
