import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import TableBoardView from '@/components/admin/TableBoardView'
import CapacityBasedView from './CapacityBasedView'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch event with minimal data to check type
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      eventType: true,
    },
  })

  if (!event) {
    notFound()
  }

  // Conditional rendering based on event type
  if (event.eventType === 'TABLE_BASED') {
    return <TableBoardView eventId={event.id} />
  }

  // Default to capacity-based view
  return <CapacityBasedView />
}
