import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

interface AvailableTable {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  registrations: Array<{ id: string; guestsCount: number | null }>
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await getCurrentAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: eventId } = await params

  try {
    // Verify event + school access
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch waitlist + available tables in parallel
    const [waitlistEntries, availableTables] = await Promise.all([
      prisma.registration.findMany({
        where: { eventId, status: 'WAITLIST' },
        orderBy: { waitlistPriority: 'asc' },
        select: {
          id: true,
          confirmationCode: true,
          guestsCount: true,
          phoneNumber: true,
          waitlistPriority: true,
          data: true,
          createdAt: true,
        },
      }),
      prisma.table.findMany({
        where: { eventId, status: 'AVAILABLE' },
        select: {
          id: true,
          tableNumber: true,
          capacity: true,
          minOrder: true,
          registrations: {
            where: { status: 'CONFIRMED' },
            select: { id: true, guestsCount: true },
          },
        },
      }),
    ])

    // Track which table has been "claimed" as bestTable by a higher-priority entry
    // Maps tableId → index of entry that claimed it
    const claimedBestTables = new Map<string, number>()

    const waitlist = waitlistEntries.map((entry, entryIndex) => {
      const guestCount = entry.guestsCount ?? 0

      // Compute occupied spots for each table (sharing-aware)
      const tablesWithOccupancy = availableTables.map((table) => {
        const occupied = table.registrations.reduce(
          (sum, r) => sum + (r.guestsCount ?? 0),
          0
        )
        const remaining = Math.max(0, table.capacity - occupied)
        return { ...table, occupied, remaining }
      })

      // matchingTables: can fit the guest (capacity check only)
      const matchingTables = tablesWithOccupancy
        .filter((t) => guestCount <= t.remaining)
        .map((t) => ({
          id: t.id,
          tableNumber: t.tableNumber,
          capacity: t.capacity,
          minOrder: t.minOrder,
        }))

      const hasMatch = matchingTables.length > 0

      if (!hasMatch) {
        return {
          id: entry.id,
          confirmationCode: entry.confirmationCode,
          guestsCount: entry.guestsCount,
          phoneNumber: entry.phoneNumber,
          waitlistPriority: entry.waitlistPriority,
          data: entry.data,
          createdAt: entry.createdAt.toISOString(),
          matchingTables: [],
          bestTable: null,
          hasMatch: false,
        }
      }

      // Candidates that meet minOrder — sort by smallest gap
      const meetsMinOrder = tablesWithOccupancy
        .filter((t) => guestCount <= t.remaining && guestCount >= t.minOrder)
        .sort((a, b) => (a.remaining - guestCount) - (b.remaining - guestCount))

      // Fallback: all matching, sort by smallest gap
      const allMatching = tablesWithOccupancy
        .filter((t) => guestCount <= t.remaining)
        .sort((a, b) => (a.remaining - guestCount) - (b.remaining - guestCount))

      const candidateList = meetsMinOrder.length > 0 ? meetsMinOrder : allMatching

      // Priority-aware deduplication: skip tables already claimed by higher-priority entry
      // with equal or better fit
      let bestTableData: { id: string; tableNumber: string; capacity: number } | null = null

      for (const candidate of candidateList) {
        const claimedBy = claimedBestTables.get(candidate.id)
        if (claimedBy === undefined) {
          // Unclaimed — take it
          claimedBestTables.set(candidate.id, entryIndex)
          bestTableData = {
            id: candidate.id,
            tableNumber: candidate.tableNumber,
            capacity: candidate.capacity,
          }
          break
        }
        // Already claimed by a higher-priority entry — try next candidate
      }

      // If all candidates are claimed, fall back to first candidate (no strict dedup on display)
      if (!bestTableData && candidateList.length > 0) {
        const first = candidateList[0]
        bestTableData = {
          id: first.id,
          tableNumber: first.tableNumber,
          capacity: first.capacity,
        }
      }

      return {
        id: entry.id,
        confirmationCode: entry.confirmationCode,
        guestsCount: entry.guestsCount,
        phoneNumber: entry.phoneNumber,
        waitlistPriority: entry.waitlistPriority,
        data: entry.data,
        createdAt: entry.createdAt.toISOString(),
        matchingTables,
        bestTable: bestTableData,
        hasMatch: true,
      }
    })

    return NextResponse.json({ waitlist })
  } catch (error) {
    console.error('Error fetching waitlist:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
