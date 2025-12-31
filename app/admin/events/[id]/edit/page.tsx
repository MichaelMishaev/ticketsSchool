import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth.server'
import EditEventClient from './EditEventClient'
import EditCapacityEventClient from './EditCapacityEventClient'

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Get current admin for permission check
  const admin = await getCurrentAdmin()
  if (!admin) {
    redirect('/admin/login')
  }

  // Fetch event with tables and capacity data
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

  // Route to correct edit component based on event type
  if (event.eventType === 'TABLE_BASED') {
    // Type-cast tables to match EditEventClient's expected type
    const tables = event.tables.map((table) => ({
      ...table,
      reservation: table.reservation
        ? {
            ...table.reservation,
            data: table.reservation.data as Record<string, unknown>,
          }
        : null,
    }))

    return <EditEventClient eventId={event.id} eventTitle={event.title} initialTables={tables} />
  }

  // CAPACITY_BASED events
  return (
    <EditCapacityEventClient
      eventId={event.id}
      initialData={{
        title: event.title,
        description: event.description,
        gameType: event.gameType,
        location: event.location,
        startAt: event.startAt.toISOString(),
        endAt: event.endAt?.toISOString() || null,
        capacity: event.capacity,
        maxSpotsPerPerson: event.maxSpotsPerPerson,
        status: event.status,
        fieldsSchema: event.fieldsSchema as any[],
        conditions: event.conditions,
        requireAcceptance: event.requireAcceptance,
        completionMessage: event.completionMessage,
        spotsReserved: event.spotsReserved,
      }}
    />
  )
}
