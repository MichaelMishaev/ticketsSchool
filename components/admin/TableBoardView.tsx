import { prisma } from '@/lib/prisma'
import ShareLinkCard from './ShareLinkCard'
import TableBoardLiveWrapper from './TableBoardLiveWrapper'
import { Clock, UtensilsCrossed } from 'lucide-react'

interface TableBoardViewProps {
  eventId: string
}

async function getTableBoardData(eventId: string) {
  const [tables, event] = await Promise.all([
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
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        title: true,
        slug: true,
        startAt: true,
        location: true,
        school: {
          select: {
            slug: true,
          },
        },
      },
    }),
  ])

  // Fetch waitlist with matching tables (for waitlist tab)
  const waitlist = await prisma.registration.findMany({
    where: {
      eventId,
      status: 'WAITLIST',
    },
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
  })

  // Get available tables for matching
  const availableTables = tables.filter((t) => t.status === 'AVAILABLE')

  // Compute matching tables for each waitlist entry with priority-aware recommendations
  const waitlistWithMatches = waitlist.map((entry, index) => {
    const guestCount = entry.guestsCount || 0

    // Show all tables that fit within capacity (admin can override minimum with confirmation)
    const matchingTables = availableTables.filter((table) => guestCount <= table.capacity)

    // Best table is the one that meets minimum AND has closest capacity (best fit)
    let bestTable: (typeof matchingTables)[0] | null = null

    if (matchingTables.length > 0) {
      const sortedTables = matchingTables
        .filter((t) => guestCount >= t.minOrder) // Prefer tables that meet minimum
        .sort((a, b) => {
          // Sort by best fit: prefer tables where guest count is closer to capacity
          // This prioritizes larger parties for larger tables (better capacity utilization)
          const gapA = a.capacity - guestCount
          const gapB = b.capacity - guestCount
          return gapA - gapB // Smallest gap first (best fit)
        })

      bestTable =
        sortedTables[0] ||
        matchingTables.sort((a, b) => {
          const gapA = a.capacity - guestCount
          const gapB = b.capacity - guestCount
          return gapA - gapB
        })[0] // Fallback to best fit if none meet minimum

      // Check if this table is a better fit for a higher-priority entry
      // If so, don't recommend it to this entry
      if (bestTable && index > 0) {
        const currentGap = bestTable.capacity - guestCount

        // Check all higher-priority entries (earlier in waitlist)
        for (let i = 0; i < index; i++) {
          const higherPriorityEntry = waitlist[i]
          const higherGuestCount = higherPriorityEntry.guestsCount || 0

          // Check if this table fits the higher-priority entry
          if (higherGuestCount <= bestTable.capacity) {
            const higherGap = bestTable.capacity - higherGuestCount

            // If higher-priority entry has a better or equal fit, don't recommend this table
            if (higherGap <= currentGap) {
              // Find next best table that isn't claimed by higher-priority entries
              const alternativeTables = matchingTables.filter((t) => t.id !== bestTable!.id)
              if (alternativeTables.length > 0) {
                bestTable = alternativeTables.sort((a, b) => {
                  const gapA = a.capacity - guestCount
                  const gapB = b.capacity - guestCount
                  return gapA - gapB
                })[0]
              } else {
                bestTable = null // No alternative, show all matches but no specific recommendation
              }
              break
            }
          }
        }
      }
    }

    return {
      ...entry,
      matchingTables: matchingTables.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        minOrder: t.minOrder,
      })),
      bestTable: bestTable
        ? {
            id: bestTable.id,
            tableNumber: bestTable.tableNumber,
            capacity: bestTable.capacity,
          }
        : null,
      hasMatch: matchingTables.length > 0,
    }
  })

  // Compute dynamic status for each table
  const tablesWithStatus = tables.map((table) => ({
    ...table,
    hasWaitlistMatch: waitlistWithMatches.some((w) =>
      w.matchingTables.some((t) => t.id === table.id)
    ),
  }))

  // Compute stats
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
    waitlistCount: waitlist.length,
    matchAvailable: tablesWithStatus.filter((t) => t.hasWaitlistMatch && t.status === 'AVAILABLE')
      .length,
  }

  return { tables: tablesWithStatus, waitlistWithMatches, event, stats }
}

export default async function TableBoardView({ eventId }: TableBoardViewProps) {
  const { tables, waitlistWithMatches, event, stats } = await getTableBoardData(eventId)

  if (!event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">אירוע לא נמצא</p>
      </div>
    )
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with Event Info */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-transparent to-blue-50/20 pointer-events-none" />
        <div className="relative p-5">
          <h1 className="text-xl font-bold text-gray-900 mb-3 leading-tight">{event.title}</h1>
          <div className="flex flex-col gap-2 text-xs text-gray-600">
            {event.location && (
              <div className="flex items-center gap-2">
                <div className="p-1 bg-gray-100 rounded">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-gray-600" />
                </div>
                <span className="font-medium">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="p-1 bg-gray-100 rounded">
                <Clock className="w-3.5 h-3.5 text-gray-600" />
              </div>
              <span className="font-medium">
                {new Date(event.startAt).toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Share Link */}
      {event?.school?.slug && event?.slug && (
        <ShareLinkCard schoolSlug={event.school.slug} eventSlug={event.slug} eventTitle={event.title} />
      )}

      {/* Live stats + tabs — all polling centralised in wrapper */}
      <TableBoardLiveWrapper
        eventId={eventId}
        initialTables={tables}
        initialWaitlist={waitlistWithMatches}
        initialStats={stats}
      />
    </div>
  )
}
