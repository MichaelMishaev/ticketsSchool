import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  try {
    const [tables, waitlist] = await Promise.all([
      prisma.table.findMany({
        where: { eventId },
        orderBy: { tableOrder: 'asc' },
        include: {
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
          },
        },
      }),
      prisma.registration.findMany({
        where: { eventId, status: 'WAITLIST' },
        select: { guestsCount: true },
      }),
    ])

    // Verify school access after fetching (need eventId → schoolId)
    if (admin.role !== 'SUPER_ADMIN') {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        select: { schoolId: true },
      })

      if (!event) {
        return NextResponse.json({ error: 'Event not found' }, { status: 404 })
      }

      if (admin.schoolId !== event.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const tablesWithStatus = tables.map((table) => {
      const hasWaitlistMatch = waitlist.some((w) => w.guestsCount <= table.capacity)

      return {
        ...table,
        registrations: table.registrations.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        })),
        hasWaitlistMatch,
      }
    })

    return NextResponse.json({ tables: tablesWithStatus })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch tables' }, { status: 500 })
  }
}
