import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth.server'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger-v2'

// GET /api/events/[id]/tables - List tables
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()

    // Verify event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const [tables, waitlistRegistrations] = await Promise.all([
      prisma.table.findMany({
        where: { eventId: id },
        orderBy: { tableOrder: 'asc' },
        include: {
          // Sharing-aware: a table can have many CONFIRMED registrations.
          // Ordered by creation time so the UI renders them stably.
          registrations: {
            where: { status: 'CONFIRMED' },
            select: {
              id: true,
              confirmationCode: true,
              guestsCount: true,
              phoneNumber: true,
              data: true,
              createdAt: true,
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      prisma.registration.findMany({
        where: { eventId: id, status: 'WAITLIST' },
        select: { guestsCount: true },
      }),
    ])

    // Compute hasWaitlistMatch: true when an AVAILABLE table fits at least one waitlist guest count.
    // MVP scope — gated on AVAILABLE status; widening to partial-RESERVED tables is a follow-up.
    const tablesWithDerived = tables.map((table) => ({
      ...table,
      hasWaitlistMatch:
        table.status === 'AVAILABLE' &&
        waitlistRegistrations.some((w) => (w.guestsCount ?? 0) <= table.capacity),
    }))

    return NextResponse.json({ tables: tablesWithDerived })
  } catch (error) {
    logger.error('Failed to fetch tables', { source: 'tables', error })
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}

// POST /api/events/[id]/tables - Create table
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = await requireAdmin()

    // Verify event exists and admin has access
    const event = await prisma.event.findUnique({
      where: { id },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Multi-tenant security: MUST verify schoolId
    if (admin.role !== 'SUPER_ADMIN') {
      if (!admin.schoolId) {
        return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
      }
      if (event.schoolId !== admin.schoolId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { tableNumber, capacity, minOrder, count = 1 } = body

    // Validation
    if (!tableNumber || !capacity || minOrder === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: tableNumber, capacity, minOrder' },
        { status: 400 }
      )
    }

    if (capacity < 1 || minOrder < 1) {
      return NextResponse.json(
        { error: 'Capacity and minOrder must be at least 1' },
        { status: 400 }
      )
    }

    if (minOrder > capacity) {
      return NextResponse.json({ error: 'minOrder cannot exceed capacity' }, { status: 400 })
    }

    if (count < 1 || count > 100) {
      return NextResponse.json({ error: 'Count must be between 1 and 100' }, { status: 400 })
    }

    // Get next table order
    const maxOrder = await prisma.table.findFirst({
      where: { eventId: id },
      orderBy: { tableOrder: 'desc' },
      select: { tableOrder: true },
    })
    const nextOrder = (maxOrder?.tableOrder ?? 0) + 1

    // If count === 1, create single table (existing behavior)
    if (count === 1) {
      const table = await prisma.table.create({
        data: {
          eventId: id,
          tableNumber,
          capacity,
          minOrder,
          tableOrder: nextOrder,
        },
      })

      // Sharing-aware: clients expect `registrations` to always exist.
      // A brand-new table has none — return an empty array for consistent shape.
      return NextResponse.json({ table: { ...table, registrations: [] } }, { status: 201 })
    }

    // Bulk creation: count > 1
    // Smart auto-increment naming
    const tableNumberMatch = tableNumber.match(/\d+/)
    const baseNumber = tableNumberMatch ? parseInt(tableNumberMatch[0], 10) : 1
    const prefix = tableNumberMatch ? tableNumber.substring(0, tableNumberMatch.index) : tableNumber
    const suffix = tableNumberMatch
      ? tableNumber.substring(tableNumberMatch.index! + tableNumberMatch[0].length)
      : ''

    // Get existing tables to find the highest number
    const existingTables = await prisma.table.findMany({
      where: { eventId: id },
      select: { tableNumber: true },
    })

    const existingNumbers = existingTables
      .map((t) => {
        const match = t.tableNumber.match(/\d+/)
        return match ? parseInt(match[0], 10) : 0
      })
      .filter((n) => n > 0)

    const maxExistingNumber =
      existingNumbers.length > 0 ? Math.max(...existingNumbers) : baseNumber - 1

    // Create multiple tables with auto-increment
    const tablesToCreate: {
      eventId: string
      tableNumber: string
      capacity: number
      minOrder: number
      tableOrder: number
      status: string
    }[] = []
    for (let i = 0; i < count; i++) {
      const newNumber = maxExistingNumber + i + 1
      const newTableNumber = `${prefix}${newNumber}${suffix}`

      tablesToCreate.push({
        eventId: id,
        tableNumber: newTableNumber,
        capacity,
        minOrder,
        tableOrder: nextOrder + i,
        status: 'AVAILABLE' as const,
      })
    }

    // Atomic bulk creation
    await prisma.table.createMany({
      data: tablesToCreate,
    })

    // Fetch created tables to return — add empty `registrations` to match the
    // GET shape so client code can spread them into state without crashing.
    const createdTables = await prisma.table.findMany({
      where: {
        eventId: id,
        tableOrder: {
          gte: nextOrder,
          lt: nextOrder + count,
        },
      },
      orderBy: { tableOrder: 'asc' },
    })

    return NextResponse.json(
      {
        tables: createdTables.map((t) => ({ ...t, registrations: [] })),
        count: createdTables.length,
      },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Failed to create table', { source: 'tables', error })
    return NextResponse.json({ error: 'Failed to create table' }, { status: 500 })
  }
}
