import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    const { id, registrationId } = await params
    const data = await request.json()

    // Use transaction to ensure atomic operation and prevent race conditions
    const registration = await prisma.$transaction(async (tx) => {
      // Get current registration
      const currentRegistration = await tx.registration.findUnique({
        where: { id: registrationId, eventId: id },
        select: { status: true, spotsCount: true, eventId: true }
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
        // Freeing up spots - update counter if it exists
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

      // Update registration status
      return await tx.registration.update({
        where: {
          id: registrationId,
          eventId: id
        },
        data: {
          status: newStatus,
          ...(data.spotsCount && { spotsCount: data.spotsCount }),
          ...(data.data && { data: data.data })
        }
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
    const { id, registrationId } = await params

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