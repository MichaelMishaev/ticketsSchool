import { prisma } from '@/lib/prisma'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth.server'
import EditEventClient from './EditEventClient'

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

  // Only allow editing TABLE_BASED events
  if (event.eventType !== 'TABLE_BASED') {
    redirect(`/admin/events/${id}`)
  }

  return (
    <EditEventClient
      eventId={event.id}
      eventTitle={event.title}
      initialTables={event.tables}
    />
  )
}
