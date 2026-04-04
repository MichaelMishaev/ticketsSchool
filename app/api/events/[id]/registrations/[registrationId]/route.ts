import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { sendOverbookingAlertEmail } from '@/lib/email'
import { logger } from '@/lib/logger-v2'

// Type for overbooking alert data
interface OverbookingAlertData {
  adminEmail: string
  adminName: string
  eventName: string
  eventId: string
  capacity: number
  currentConfirmed: number
  attemptedSpots: number
  registrantName: string
  registrantPhone: string
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; registrationId: string }> }
) {
  try {
    // Check authentication
    const admin = await getCurrentAdmin()
    logger.debug('Registration PATCH authentication check', { source: 'registration', authenticated: !!admin })
    if (!admin) {
      logger.warn('Registration PATCH unauthorized: No admin session found', { source: 'registration' })
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    logger.debug('Registration PATCH admin authenticated', {
      source: 'registration',
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      schoolId: admin.schoolId
    })

    const { id, registrationId } = await params
    const data = await request.json()

    // Verify admin has access to this event's school (include title for alerts)
    const eventCheck = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true, title: true }
    })

    if (!eventCheck) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Check school access (SUPER_ADMIN can access all, others must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== eventCheck.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      )
    }

    // Use transaction to ensure atomic operation and prevent race conditions
    const registration = await prisma.$transaction(async (tx) => {
      // Get current registration with assigned table info and contact details
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
        // Get event with lock
        const [event] = await tx.$queryRaw<Array<{
          id: string
          capacity: number
          spotsReserved: number | null
        }>>`
          SELECT id, capacity, "spotsReserved" FROM "Event"
          WHERE id = ${id}
          FOR UPDATE
        `

        if (!event) {
          throw new Error('Event not found')
        }

        // CRITICAL: Always validate against REAL aggregate count to prevent overbooking
        // The spotsReserved counter can get out of sync, so we must verify with actual data
        const confirmedAgg = await tx.registration.aggregate({
          where: {
            eventId: id,
            status: 'CONFIRMED',
            id: { not: registrationId } // Exclude this registration if it was already confirmed
          },
          _sum: { spotsCount: true }
        })

        const actualConfirmed = confirmedAgg._sum.spotsCount || 0
        const spotsNeeded = isPromotingToConfirmed ? newSpotsCount : (newSpotsCount - oldSpotsCount)
        const actualSpotsLeft = event.capacity - actualConfirmed

        // Block if not enough actual capacity
        if (actualSpotsLeft < spotsNeeded) {
          throw new Error(`לא ניתן לאשר: נותרו רק ${actualSpotsLeft} מקומות פנויים, אך ההרשמה דורשת ${spotsNeeded} מקומות`)
        }

        // Also update the spotsReserved counter for performance optimization
        // But the aggregate check above is the source of truth
        if (event.spotsReserved !== null) {
          await tx.$executeRaw`
            UPDATE "Event"
            SET "spotsReserved" = "spotsReserved" + ${spotsNeeded}
            WHERE id = ${id}
          `
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

    // SAFETY CHECK: Detect if overbooking somehow occurred (shouldn't happen, but alert if it does)
    if (data.status === 'CONFIRMED') {
      try {
        const [overbookCheck] = await prisma.$queryRaw<Array<{
          capacity: number
          confirmedSpots: bigint
        }>>`
          SELECT e.capacity,
                 COALESCE(SUM(r."spotsCount"), 0) as "confirmedSpots"
          FROM "Event" e
          LEFT JOIN "Registration" r ON r."eventId" = e.id AND r.status = 'CONFIRMED'
          WHERE e.id = ${id}
          GROUP BY e.id
        `

        if (overbookCheck && Number(overbookCheck.confirmedSpots) > overbookCheck.capacity) {
          logger.error('OVERBOOKING DETECTED', {
            source: 'registration',
            eventId: id,
            capacity: overbookCheck.capacity,
            confirmedSpots: Number(overbookCheck.confirmedSpots),
            overage: Number(overbookCheck.confirmedSpots) - overbookCheck.capacity
          })

          // Get registration details for the alert
          const regDetails = await prisma.registration.findUnique({
            where: { id: registrationId },
            select: { phoneNumber: true, spotsCount: true, data: true }
          })
          const regData = (regDetails?.data as Record<string, any>) || {}

          // Send overbooking alert email
          sendOverbookingAlertEmail({
            adminEmail: admin.email,
            adminName: admin.email.split('@')[0],
            eventName: eventCheck.title,
            eventId: id,
            capacity: overbookCheck.capacity,
            currentConfirmed: Number(overbookCheck.confirmedSpots),
            attemptedSpots: regDetails?.spotsCount || 0,
            registrantName: regData.studentName || regData.name || regData.parentName || 'לא צוין',
            registrantPhone: regDetails?.phoneNumber || 'לא צוין'
          }).catch((emailError) => {
            logger.error('Failed to send overbooking alert email', { source: 'registration', error: emailError })
          })
        }
      } catch (checkError) {
        logger.error('Error checking for overbooking', { source: 'registration', error: checkError })
      }
    }

    return NextResponse.json(registration)
  } catch (error: any) {
    logger.error('Error updating registration', { source: 'registration', error })

    // Handle specific error messages (capacity validation errors)
    if (error.message.includes('Cannot promote') || error.message.includes('לא ניתן לאשר')) {
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
    logger.error('Error deleting registration', { source: 'registration', error })

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