import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    console.log('[Registration PATCH] Authentication check:', admin ? 'Authenticated' : 'Not authenticated')
    if (!admin) {
      console.error('[Registration PATCH] Unauthorized: No admin session found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    console.log('[Registration PATCH] Admin authenticated:', {
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      schoolId: admin.schoolId
    })

    const { id, registrationId } = await params
    const data = await request.json()

    // Verify admin has access to this event's school
    const event = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check school access (SUPER_ADMIN can access all, others must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      )
    }

    // Use transaction to ensure atomic operation and prevent race conditions
    const registration = await prisma.$transaction(async (tx) => {
      // Get current registration with assigned table info
      const currentRegistration = await tx.registration.findUnique({
        where: { id: registrationId, eventId: id },
        include: {
          event: {
            select: { eventType: true }
          },
          assignedTable: {
            select: { id: true }
          }
        }
      })

      if (!currentRegistration) {
        throw new Error('Registration not found')
      }

      // Handle status changes - check capacity if promoting to CONFIRMED
      const oldStatus = currentRegistration.status
      const newStatus = data.status
      const oldSpotsCount = currentRegistration.spotsCount
      const newSpotsCount = data.spotsCount ?? oldSpotsCount

      // Check if we're promoting to CONFIRMED (need capacity validation)
      const isPromotingToConfirmed = oldStatus !== 'CONFIRMED' && newStatus === 'CONFIRMED'
      const isIncreasingConfirmedSpots = oldStatus === 'CONFIRMED' && newStatus === 'CONFIRMED' && newSpotsCount > oldSpotsCount

      if (isPromotingToConfirmed || isIncreasingConfirmedSpots) {
        // Check if spotsReserved column exists (Phase 2 migration applied)
        const eventCheck = await tx.$queryRaw<Array<any>>`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = 'Event' AND column_name = 'spotsReserved'
        `

        const useSpotsReserved = eventCheck.length > 0

        if (useSpotsReserved) {
          // PHASE 2: Use atomic counter
          const spotsNeeded = isPromotingToConfirmed ? newSpotsCount : (newSpotsCount - oldSpotsCount)

          const [event] = await tx.$queryRaw<Array<{
            id: string
            capacity: number
            spotsReserved: number
          }>>`
            SELECT id, capacity, "spotsReserved" FROM "Event"
            WHERE id = ${id}
            FOR UPDATE
          `

          if (!event) {
            throw new Error('Event not found')
          }

          // Try to atomically reserve spots
          const updated = await tx.$executeRaw`
            UPDATE "Event"
            SET "spotsReserved" = "spotsReserved" + ${spotsNeeded}
            WHERE id = ${id}
            AND "spotsReserved" + ${spotsNeeded} <= capacity
          `

          if (updated === 0) {
            const spotsLeft = event.capacity - event.spotsReserved
            throw new Error(`Cannot promote: only ${spotsLeft} spots remaining, but registration requires ${spotsNeeded} more spots`)
          }
        } else {
          // PHASE 1: Use aggregate count with row lock
          const [event] = await tx.$queryRaw<Array<{ id: string; capacity: number }>>`
            SELECT id, capacity FROM "Event"
            WHERE id = ${id}
            FOR UPDATE
          `

          if (!event) {
            throw new Error('Event not found')
          }

          // Count current confirmed spots (excluding this registration)
          const confirmedAgg = await tx.registration.aggregate({
            where: {
              eventId: id,
              status: 'CONFIRMED',
              id: { not: registrationId }
            },
            _sum: { spotsCount: true }
          })

          const currentConfirmed = confirmedAgg._sum.spotsCount || 0
          const spotsLeft = event.capacity - currentConfirmed

          if (spotsLeft < newSpotsCount) {
            throw new Error(`Cannot promote: only ${spotsLeft} spots remaining, but registration requires ${newSpotsCount} spots`)
          }
        }
      } else if (oldStatus === 'CONFIRMED' && newStatus !== 'CONFIRMED') {
        // Freeing up spots - update counter if it exists (capacity-based)
        if (currentRegistration.event.eventType === 'CAPACITY_BASED') {
          try {
            await tx.$executeRaw`
              UPDATE "Event"
              SET "spotsReserved" = GREATEST(0, "spotsReserved" - ${oldSpotsCount})
              WHERE id = ${id}
            `
          } catch (error) {
            // Column doesn't exist yet (migration not applied) - that's OK
          }
        }

        // Free table if table-based
        if (currentRegistration.event.eventType === 'TABLE_BASED' && currentRegistration.assignedTable) {
          await tx.table.update({
            where: { id: currentRegistration.assignedTable.id },
            data: { status: 'AVAILABLE', reservedById: null }
          })
        }
      }

      // Prepare registration data update
      const updateData: any = {
        status: newStatus,
        ...(data.spotsCount && { spotsCount: data.spotsCount }),
      }

      // Handle data field updates (merge with existing data)
      if (data.removedFromTable || data.data) {
        const existingData = (currentRegistration.data as any) || {}
        updateData.data = {
          ...existingData,
          ...(data.data || {}),
          ...(data.removedFromTable && { removedFromTable: true, removedAt: new Date().toISOString() })
        }
      }

      // If moving to waitlist from confirmed, assign priority
      if (newStatus === 'WAITLIST' && oldStatus === 'CONFIRMED') {
        // Get the highest priority in waitlist and add 1
        const highestPriority = await tx.registration.aggregate({
          where: { eventId: id, status: 'WAITLIST' },
          _max: { waitlistPriority: true }
        })
        updateData.waitlistPriority = (highestPriority._max.waitlistPriority || 0) + 1
      }

      // If cancelling, record cancellation details
      if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
        updateData.cancelledAt = new Date()
        updateData.cancelledBy = 'ADMIN'
        if (data.cancellationReason) {
          updateData.cancellationReason = data.cancellationReason
        }
      }

      return await tx.registration.update({
        where: {
          id: registrationId,
          eventId: id
        },
        data: updateData
      })
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    })

    return NextResponse.json(registration)
  } catch (error: any) {
    console.error('Error updating registration:', error)

    // Handle specific error messages
    if (error.message.includes('Cannot promote')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update registration' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id, registrationId } = await params

    // Verify admin has access to this event's school
    const event = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true }
    })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check school access (SUPER_ADMIN can access all, others must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      )
    }

    // Use transaction to atomically delete and update counter
    await prisma.$transaction(async (tx) => {
      // Get registration to check status and spots
      const registration = await tx.registration.findUnique({
        where: { id: registrationId, eventId: id },
        select: { status: true, spotsCount: true }
      })

      if (!registration) {
        throw new Error('Registration not found')
      }

      // Delete the registration
      await tx.registration.delete({
        where: {
          id: registrationId,
          eventId: id
        }
      })

      // If it was confirmed, free up the spots (if spotsReserved column exists)
      if (registration.status === 'CONFIRMED') {
        try {
          await tx.$executeRaw`
            UPDATE "Event"
            SET "spotsReserved" = GREATEST(0, "spotsReserved" - ${registration.spotsCount})
            WHERE id = ${id}
          `
        } catch (error) {
          // Column doesn't exist yet (migration not applied) - that's OK
          // The spots are freed by virtue of the registration being deleted
        }
      }
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting registration:', error)

    if (error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'Registration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete registration' },
      { status: 500 }
    )
  }
}