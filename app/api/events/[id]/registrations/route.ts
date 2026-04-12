import { NextRequest, NextResponse } from 'next/server'
import { prisma, Prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { normalizePhone } from '@/lib/phone-utils'
import jwt from 'jsonwebtoken'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  const { searchParams } = new URL(request.url)
  const statusFilter = searchParams.get('status')
  const searchFilter = searchParams.get('search')

  try {
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

    const registrations = await prisma.registration.findMany({
      where: {
        eventId,
        ...(statusFilter ? { status: statusFilter as string } : {}),
        ...(searchFilter
          ? {
              OR: [
                { phoneNumber: { contains: searchFilter, mode: 'insensitive' } },
                { confirmationCode: { contains: searchFilter, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        status: true,
        spotsCount: true,
        guestsCount: true,
        phoneNumber: true,
        data: true,
        confirmationCode: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      registrations: registrations.map((r) => ({
        ...r,
        createdAt: r.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  let body: { tableId?: string; guestsCount?: number; name?: string; phone?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { tableId, guestsCount, name, phone } = body

  if (!tableId || guestsCount === undefined || !name || !phone) {
    return NextResponse.json(
      { error: 'Missing required fields: tableId, guestsCount, name, phone' },
      { status: 400 }
    )
  }

  if (typeof guestsCount !== 'number' || guestsCount < 1) {
    return NextResponse.json({ error: 'guestsCount must be a positive number' }, { status: 400 })
  }

  let normalizedPhone: string
  try {
    normalizedPhone = normalizePhone(phone)
  } catch {
    return NextResponse.json({ error: 'מספר הטלפון אינו תקין' }, { status: 422 })
  }

  try {
    const registration = await prisma.$transaction(
      async (tx) => {
        // 1. Fetch event
        const event = await tx.event.findUnique({
          where: { id: eventId },
          select: { schoolId: true, eventType: true },
        })

        if (!event) {
          throw Object.assign(new Error('Event not found'), { statusCode: 404 })
        }

        if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
          throw Object.assign(new Error('Forbidden'), { statusCode: 403 })
        }

        if (event.eventType !== 'TABLE_BASED') {
          throw Object.assign(
            new Error('Manual registration is only supported for table-based events'),
            { statusCode: 422 }
          )
        }

        // 2. Fetch table with current confirmed registrations
        const table = await tx.table.findUnique({
          where: { id: tableId },
          include: {
            registrations: {
              where: { status: 'CONFIRMED' },
              select: { id: true, guestsCount: true },
            },
          },
        })

        if (!table || table.eventId !== eventId) {
          throw Object.assign(new Error('Table not found'), { statusCode: 404 })
        }

        // 3. Validate table state
        if (table.status === 'INACTIVE') {
          throw Object.assign(new Error('Table is inactive and cannot accept registrations'), {
            statusCode: 422,
          })
        }

        const occupied = table.registrations.reduce((sum, r) => sum + r.guestsCount, 0)
        const remaining = table.capacity - occupied

        if (occupied + guestsCount > table.capacity) {
          throw Object.assign(
            new Error(`Not enough capacity. Remaining spots: ${remaining}`),
            { statusCode: 422, remaining }
          )
        }

        const isEmpty = table.registrations.length === 0
        if (isEmpty && guestsCount < table.minOrder) {
          throw Object.assign(
            new Error(`Minimum order for this table is ${table.minOrder} guests`),
            { statusCode: 422, minOrder: table.minOrder }
          )
        }

        // 4. Generate codes
        const confirmationCode = Math.random().toString(36).substring(2, 8).toUpperCase()
        const cancellationToken = jwt.sign(
          { eventId, phone: normalizedPhone },
          process.env.JWT_SECRET!,
          { expiresIn: '30d' }
        )

        // 5. Create registration
        const newRegistration = await tx.registration.create({
          data: {
            eventId,
            status: 'CONFIRMED',
            tableId,
            guestsCount,
            phoneNumber: normalizedPhone,
            data: { name: name.trim() },
            confirmationCode,
            cancellationToken,
          },
        })

        // 6. If table was empty before, mark it RESERVED
        if (isEmpty) {
          await tx.table.update({
            where: { id: tableId },
            data: { status: 'RESERVED' },
          })
        }

        return newRegistration
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )

    return NextResponse.json({ registration }, { status: 201 })
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      const err = error as { message: string; statusCode: number; remaining?: number; minOrder?: number }
      return NextResponse.json(
        {
          error: err.message,
          ...(err.remaining !== undefined ? { remaining: err.remaining } : {}),
          ...(err.minOrder !== undefined ? { minOrder: err.minOrder } : {}),
        },
        { status: err.statusCode }
      )
    }
    return NextResponse.json({ error: 'Failed to create registration' }, { status: 500 })
  }
}
