import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth.server'
import EditEventClient from './EditEventClient'
import EditEventDetailsClient from './EditEventDetailsClient'

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get current admin for permission check
  const admin = await getCurrentAdmin()
  if (!admin) {
    redirect('/admin/login')
  }

  // Fetch event with tables
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      tables: {
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
      },
    },
  })

  if (!event) {
    notFound()
  }

  // Check school access (SUPER_ADMIN can access all events)
  if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
    notFound()
  }

  // Route to appropriate edit component based on event type
  if (event.eventType === 'TABLE_BASED') {
    // Type-cast tables to match EditEventClient's expected type
    const tables = event.tables.map(table => ({
      ...table,
      reservation: table.reservation ? {
        ...table.reservation,
        data: table.reservation.data as Record<string, unknown>
      } : null
    }))

    return (
      <EditEventClient
        eventId={event.id}
        eventTitle={event.title}
        initialTables={tables}
      />
    )
  } else {
    // CAPACITY_BASED event - edit event details
    // Convert dates to datetime-local format for form inputs
    const formatDateTimeLocal = (date: Date | null) => {
      if (!date) return ''
      const d = new Date(date)
      const offset = d.getTimezoneOffset()
      const localDate = new Date(d.getTime() - (offset * 60 * 1000))
      return localDate.toISOString().slice(0, 16)
    }

    const initialData = {
      title: event.title,
      description: event.description || '',
      gameType: event.gameType || '',
      location: event.location || '',
      startAt: formatDateTimeLocal(event.startAt),
      endAt: event.endAt ? formatDateTimeLocal(event.endAt) : '',
      capacity: event.capacity,
      maxSpotsPerPerson: event.maxSpotsPerPerson,
      fieldsSchema: event.fieldsSchema as any || [],
      conditions: event.conditions || '',
      requireAcceptance: event.requireAcceptance,
      completionMessage: event.completionMessage || '',
      status: event.status,
      // Payment settings (Tier 2: Event Ticketing - YaadPay)
      paymentRequired: event.paymentRequired,
      paymentTiming: event.paymentTiming,
      pricingModel: event.pricingModel,
      priceAmount: event.priceAmount ? Number(event.priceAmount) : undefined,
      currency: event.currency,
    }

    return (
      <EditEventDetailsClient
        eventId={event.id}
        eventTitle={event.title}
        initialData={initialData}
      />
    )
  }
}
