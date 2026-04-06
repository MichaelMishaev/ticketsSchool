import { prisma, Prisma } from '@/lib/prisma'

/**
 * Automatically promote waitlist registrations when spots become available
 * Called after successful cancellation
 *
 * @param eventId - Event ID to check for waitlist promotions
 * @param freedSpots - Number of spots freed (for capacity-based events)
 * @returns Promotion result with count of promoted registrations
 */
export async function promoteFromWaitlist(
  eventId: string,
  freedSpots?: number
): Promise<{ promoted: number; registrationIds: string[] }> {
  // Retry logic for transaction conflicts/deadlocks
  const maxRetries = 3

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await prisma.$transaction(
        async (tx) => {
          // Get event with type and available tables
          const event = await tx.event.findUnique({
            where: { id: eventId },
            include: {
              tables: {
                where: { status: 'AVAILABLE' },
              },
            },
          })

          if (!event) {
            console.error('[PROMOTION] Event not found:', eventId)
            return { promoted: 0, registrationIds: [] }
          }

          // Skip promotion if event is closed
          if (event.status === 'CLOSED') {
            console.log('[PROMOTION] Event is CLOSED, skipping promotion')
            return { promoted: 0, registrationIds: [] }
          }

          // Skip promotion if auto-promotion is disabled
          if (event.autoPromoteWaitlist === false) {
            console.log('[PROMOTION] Auto-promotion is DISABLED for this event, skipping')
            return { promoted: 0, registrationIds: [] }
          }

          // Handle capacity-based vs table-based differently
          if (event.eventType === 'CAPACITY_BASED') {
            return await promoteCapacityBased(tx, event, freedSpots || 0)
          } else {
            return await promoteTableBased(tx, event)
          }
        },
        {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
          timeout: 10000,
        }
      )
    } catch (error: any) {
      // Check if it's a transaction conflict (P2034) or deadlock
      const isConflict =
        error?.code === 'P2034' ||
        error?.message?.includes('write conflict') ||
        error?.message?.includes('deadlock')

      if (isConflict && attempt < maxRetries) {
        // Exponential backoff: 100ms, 200ms, 400ms
        const delay = 100 * Math.pow(2, attempt - 1)
        console.log(
          `[PROMOTION] Transaction conflict, retrying in ${delay}ms (attempt ${attempt}/${maxRetries})`
        )
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }

      // Non-retryable error or max retries reached
      console.error('[PROMOTION] Failed after', attempt, 'attempts:', error)
      break
    }
  }

  // Don't throw - promotion is opportunistic, cancellation should always succeed
  return { promoted: 0, registrationIds: [] }
}

/**
 * Promote waitlist entries for capacity-based events
 * Uses FIFO ordering and promotes multiple entries if total freed spots allow
 */
async function promoteCapacityBased(
  tx: Prisma.TransactionClient,
  event: any,
  freedSpots: number
): Promise<{ promoted: number; registrationIds: string[] }> {
  const promoted: string[] = []
  let remainingSpots = freedSpots

  console.log(`[PROMOTION] Starting capacity-based promotion for event ${event.id}`)
  console.log(`[PROMOTION] Freed spots: ${freedSpots}`)

  while (remainingSpots > 0) {
    // PRIORITY 1: Try to find EXACT match first (maximizes spot utilization)
    // Example: If 5 spots freed, prioritize someone with 5 tickets over someone with 3
    let next = await tx.registration.findFirst({
      where: {
        eventId: event.id,
        status: 'WAITLIST',
        spotsCount: remainingSpots, // Exact match
        cancellationReason: null, // Only promote "clean" entries (never cancelled)
      },
      orderBy: { createdAt: 'asc' }, // FIFO
    })

    // PRIORITY 2: If no exact match, find anyone who fits (smaller sizes)
    if (!next) {
      next = await tx.registration.findFirst({
        where: {
          eventId: event.id,
          status: 'WAITLIST',
          spotsCount: { lte: remainingSpots },
          cancellationReason: null, // Only promote "clean" entries (never cancelled)
        },
        orderBy: { createdAt: 'asc' }, // FIFO
      })
    }

    if (!next) {
      console.log(
        `[PROMOTION] No more matching waitlist entries (${remainingSpots} spots remaining)`
      )
      break
    }

    // Promote to confirmed
    await tx.registration.update({
      where: { id: next.id },
      data: { status: 'CONFIRMED' },
    })

    // Increment event counter
    await tx.event.update({
      where: { id: event.id },
      data: { spotsReserved: { increment: next.spotsCount || 0 } },
    })

    promoted.push(next.id)
    remainingSpots -= next.spotsCount || 0

    // Log promotion (email scaffolding)
    console.log(`[PROMOTION] Promoted registration ${next.id} (${next.spotsCount} spots)`)
    console.log(`[PROMOTION] Event: ${event.title}`)
    console.log(`[PROMOTION] Confirmation code: ${next.confirmationCode}`)
    console.log(`[PROMOTION] Would send email to: ${next.phoneNumber || next.email}`)
  }

  return { promoted: promoted.length, registrationIds: promoted }
}

/**
 * Promote waitlist entries for table-based events
 * Honors waitlistPriority field and table constraints
 */
async function promoteTableBased(
  tx: Prisma.TransactionClient,
  event: any
): Promise<{ promoted: number; registrationIds: string[] }> {
  const promoted: string[] = []

  console.log(`[PROMOTION] Starting table-based promotion for event ${event.id}`)
  console.log(`[PROMOTION] Available tables: ${event.tables.length}`)

  // For each available table, try to assign a waitlist entry
  for (const table of event.tables) {
    const next = await tx.registration.findFirst({
      where: {
        eventId: event.id,
        status: 'WAITLIST',
        guestsCount: {
          gte: table.minOrder,
          lte: table.capacity,
        },
      },
      orderBy: [
        { waitlistPriority: 'asc' }, // Honor priority field
        { createdAt: 'asc' }, // Then FIFO
      ],
    })

    if (!next) {
      console.log(`[PROMOTION] No matching waitlist entry for table ${table.tableNumber}`)
      continue
    }

    // Assign table
    await tx.registration.update({
      where: { id: next.id },
      data: {
        status: 'CONFIRMED',
        waitlistPriority: null,
      },
    })

    await tx.table.update({
      where: { id: table.id },
      data: {
        status: 'RESERVED',
        reservedById: next.id,
      },
    })

    promoted.push(next.id)

    // Log promotion (email scaffolding)
    console.log(`[PROMOTION] Promoted registration ${next.id} to table ${table.tableNumber}`)
    console.log(`[PROMOTION] Event: ${event.title}`)
    console.log(`[PROMOTION] Confirmation code: ${next.confirmationCode}`)
    console.log(`[PROMOTION] Would send email to: ${next.phoneNumber || next.email}`)
  }

  return { promoted: promoted.length, registrationIds: promoted }
}
