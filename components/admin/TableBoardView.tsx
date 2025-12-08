import { prisma } from '@/lib/prisma'
import TableBoardClient from './TableBoardClient'
import TableBoardTabs from './TableBoardTabs'
import WaitlistManager from './WaitlistManager'
import ShareLinkCard from './ShareLinkCard'
import { Users, Clock, UtensilsCrossed, ListOrdered } from 'lucide-react'

interface TableBoardViewProps {
  eventId: string
}

async function getTableBoardData(eventId: string) {
  const [tables, event] = await Promise.all([
    prisma.table.findMany({
      where: { eventId },
      orderBy: { tableOrder: 'asc' },
      include: {
        reservation: {
          select: {
            id: true,
            confirmationCode: true,
            guestsCount: true,
            phoneNumber: true,
            data: true,
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

  // Compute matching tables for each waitlist entry
  const waitlistWithMatches = waitlist.map((entry) => {
    const guestCount = entry.guestsCount || 0
    const matchingTables = availableTables.filter(
      (table) => guestCount >= table.minOrder && guestCount <= table.capacity
    )
    const bestTable = matchingTables.length > 0
      ? matchingTables.sort((a, b) => a.capacity - b.capacity)[0]
      : null

    return {
      ...entry,
      matchingTables: matchingTables.map((t) => ({
        id: t.id,
        tableNumber: t.tableNumber,
        capacity: t.capacity,
        minOrder: t.minOrder,
      })),
      bestTable: bestTable ? {
        id: bestTable.id,
        tableNumber: bestTable.tableNumber,
        capacity: bestTable.capacity,
      } : null,
      hasMatch: matchingTables.length > 0,
    }
  })

  // Compute dynamic status for each table
  const tablesWithStatus = tables.map((table) => ({
    ...table,
    hasWaitlistMatch: waitlistWithMatches.some(
      (w) => w.matchingTables.some((t) => t.id === table.id)
    ),
  }))

  // Compute stats
  const stats = {
    total: tables.length,
    available: tables.filter((t) => t.status === 'AVAILABLE').length,
    reserved: tables.filter((t) => t.status === 'RESERVED').length,
    waitlistCount: waitlist.length,
    matchAvailable: tablesWithStatus.filter((t) => t.hasWaitlistMatch && t.status === 'AVAILABLE').length,
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

  // Tables View
  const tablesView = (
    <div className="space-y-6">
      {tables.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">אין שולחנות</h3>
          <p className="text-gray-600 mb-4">טרם הוספת שולחנות לאירוע זה</p>
          <a
            href={`/admin/events/${eventId}/edit`}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            הוסף שולחנות
          </a>
        </div>
      ) : (
        <TableBoardClient tables={tables} eventId={eventId} />
      )}

      {stats.matchAvailable > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-base">✨</span>
              </div>
              <div className="flex-1 min-w-0" dir="rtl">
                <p className="text-sm font-semibold text-amber-900 mb-1">יש התאמות זמינות!</p>
                <p className="text-xs text-amber-800">
                  {stats.matchAvailable} {stats.matchAvailable === 1 ? 'שולחן פנוי' : 'שולחנות פנויים'}{' '}
                  מתאימים לאורחים ברשימת ההמתנה. עבור ללשונית "רשימת המתנה" לשיבוץ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // Waitlist View
  const waitlistView = (
    <WaitlistManager
      eventId={eventId}
      waitlist={waitlistWithMatches}
    />
  )

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header with Event Info - Modernized */}
      <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Subtle gradient background */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          label="סה״כ שולחנות"
          value={stats.total}
          icon={<UtensilsCrossed className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="פנויים"
          value={stats.available}
          icon={<Users className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="תפוסים"
          value={stats.reserved}
          icon={<Users className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="רשימת המתנה"
          value={stats.waitlistCount}
          icon={<ListOrdered className="w-5 h-5" />}
          color="amber"
        />
      </div>

      {/* Share Link */}
      {event?.school?.slug && event?.slug && (
        <ShareLinkCard
          schoolSlug={event.school.slug}
          eventSlug={event.slug}
        />
      )}

      {/* Tabbed Content */}
      <TableBoardTabs
        tablesView={tablesView}
        waitlistView={waitlistView}
        waitlistCount={stats.waitlistCount}
      />
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string
  value: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'amber'
}) {
  const colorClasses = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'text-blue-600',
      gradient: 'from-blue-500/10 to-blue-600/5',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'text-green-600',
      gradient: 'from-green-500/10 to-green-600/5',
    },
    red: {
      bg: 'bg-red-50',
      icon: 'text-red-600',
      gradient: 'from-red-500/10 to-red-600/5',
    },
    amber: {
      bg: 'bg-amber-50',
      icon: 'text-amber-600',
      gradient: 'from-amber-500/10 to-amber-600/5',
    },
  }

  const colors = colorClasses[color]

  return (
    <div className="relative overflow-hidden bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
      {/* Subtle gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} pointer-events-none`} />

      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-lg ${colors.bg} ${colors.icon} flex-shrink-0`}>
            {icon}
          </div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-gray-900 leading-none mb-1">{value}</div>
            <div className="text-xs text-gray-600 font-medium">{label}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
