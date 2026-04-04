/**
 * @LOCKED
 * Reason: Business-critical admin event details & registrations view
 * Scope:
 *   - Event details display
 *   - Registration list with status badges (CONFIRMED, WAITLIST, CANCELLED)
 *   - Multi-tenant access control
 *   - Export functionality
 *   - Table-based vs capacity-based views
 * See: /docs/infrastructure/GOLDEN_PATHS.md#REGISTRATION_ADMIN_VIEW_V1
 *
 * Multi-Tenant Enforcement (CRITICAL):
 *   - Verifies event belongs to admin's school
 *   - SUPER_ADMIN can view all schools
 *   - Regular admins: schoolId filter enforced
 *
 * Invariants Protected:
 *   - INVARIANT_MT_001: Multi-tenant isolation
 */
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getCurrentAdmin } from '@/lib/auth.server'
import TableBoardView from '@/components/admin/TableBoardView'
import EventDetailsTabbed from './EventDetailsTabbed'

export default async function EventDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Get current admin for permission check
  const admin = await getCurrentAdmin()
  if (!admin) {
    notFound()
  }

  // Fetch event with school info to check access
  const event = await prisma.event.findUnique({
    where: { id },
    select: {
      id: true,
      eventType: true,
      schoolId: true,
    },
  })

  if (!event) {
    notFound()
  }

  // Check school access (SUPER_ADMIN can access all events)
  if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
    notFound()
  }

  // Conditional rendering based on event type
  if (event.eventType === 'TABLE_BASED') {
    return <TableBoardView eventId={event.id} />
  }

  // Default to capacity-based view with new tab architecture
  return <EventDetailsTabbed />
}
