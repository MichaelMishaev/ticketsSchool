import { NextRequest, NextResponse } from 'next/server'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'
import { prisma } from '@/lib/prisma'
import { getCurrentAdmin } from '@/lib/auth.server'
import { sendOverbookingAlertEmail, sendManualPaymentConfirmationEmail } from '@/lib/email'
import { generateQRCodeImage } from '@/lib/qr-code'
import { logger } from '@/lib/logger-v2'
import { findSmallestFitTable } from '@/lib/table-assignment'

/**
 * Extract a human-readable name from a registration's JSONB data column.
 * Matches the fallback order used by the overbooking alert on line 430.
 */
function extractName(data: unknown): string {
  const d = (data as Record<string, unknown>) || {}
  const studentName = typeof d.studentName === 'string' ? d.studentName : undefined
  const name = typeof d.name === 'string' ? d.name : undefined
  const parentName = typeof d.parentName === 'string' ? d.parentName : undefined
  return studentName || name || parentName || 'משתתף/ת'
}

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
    logger.debug('Registration PATCH authentication check', {
      source: 'registration',
      authenticated: !!admin,
    })
    if (!admin) {
      logger.warn('Registration PATCH unauthorized: No admin session found', {
        source: 'registration',
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    logger.debug('Registration PATCH admin authenticated', {
      source: 'registration',
      adminId: admin.adminId,
      email: admin.email,
      role: admin.role,
      schoolId: admin.schoolId,
    })

    const { id, registrationId } = await params
    const data = await request.json()

    // Verify admin has access to this event's school.
    // Also fetch fields we need for the manual-payment confirmation email
    // (startAt, location, school name) — avoids a second DB round-trip post-commit.
    const eventCheck = await prisma.event.findUnique({
      where: { id },
      select: {
        schoolId: true,
        eventType: true,
        title: true,
        startAt: true,
        location: true,
        school: { select: { name: true } },
      },
    })

    if (!eventCheck) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (SUPER_ADMIN can access all, others must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== eventCheck.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      )
    }

    // Reject tableId move on a non-CONFIRMED status change (nonsense semantics).
    // Allow tableId on an isolated PATCH (no status change) or on a CONFIRMED-keeping PATCH.
    if (data.tableId !== undefined && data.status && data.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Cannot set tableId on a non-CONFIRMED registration' },
        { status: 400 }
      )
    }

    // Capture the previous status across the transaction boundary so we can
    // detect a PAYMENT_PENDING → CONFIRMED transition AFTER the tx commits
    // (to fire the manual-approval confirmation email outside DB locks).
    let priorStatus: string | null = null
    // Track the table assigned during manual approval (TABLE_BASED events).
    let manualApprovalAssignedTableId: string | null = null

    // Use transaction to ensure atomic operation and prevent race conditions
    const registration = await prisma.$transaction(
      async (tx) => {
        // Get current registration with assigned table info and contact details
        const currentRegistration = await tx.registration.findUnique({
          where: { id: registrationId, eventId: id },
          include: {
            event: {
              select: { eventType: true },
            },
            table: {
              select: { id: true },
            },
          },
        })

        if (!currentRegistration) {
          throw new Error('Registration not found')
        }

        // Handle status changes - check capacity if promoting to CONFIRMED
        const oldStatus = currentRegistration.status
        const newStatus = data.status
        priorStatus = oldStatus
        const oldSpotsCount = currentRegistration.spotsCount
        const newSpotsCount = data.spotsCount ?? oldSpotsCount

        // Check if we're promoting to CONFIRMED (need capacity validation)
        const isPromotingToConfirmed = oldStatus !== 'CONFIRMED' && newStatus === 'CONFIRMED'
        const isIncreasingConfirmedSpots =
          oldStatus === 'CONFIRMED' && newStatus === 'CONFIRMED' && newSpotsCount > oldSpotsCount

        if (isPromotingToConfirmed || isIncreasingConfirmedSpots) {
          // Get event with lock
          const [event] = await tx.$queryRaw<
            Array<{
              id: string
              capacity: number
              spotsReserved: number | null
            }>
          >`
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
              id: { not: registrationId }, // Exclude this registration if it was already confirmed
            },
            _sum: { spotsCount: true },
          })

          const actualConfirmed = confirmedAgg._sum.spotsCount || 0
          const spotsNeeded = isPromotingToConfirmed ? newSpotsCount : newSpotsCount - oldSpotsCount
          const actualSpotsLeft = event.capacity - actualConfirmed

          // Block if not enough actual capacity
          if (actualSpotsLeft < spotsNeeded) {
            throw new Error(
              `לא ניתן לאשר: נותרו רק ${actualSpotsLeft} מקומות פנויים, אך ההרשמה דורשת ${spotsNeeded} מקומות`
            )
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

          // Conditional table release (table-sharing-aware):
          // Only flip table to AVAILABLE if this was the last CONFIRMED reg on it.
          if (currentRegistration.event.eventType === 'TABLE_BASED' && currentRegistration.table) {
            const tableId = currentRegistration.table.id
            // Clear tableId on this reg now (so the count below excludes it)
            await tx.registration.update({
              where: { id: registrationId },
              data: { tableId: null },
            })
            const remaining = await tx.registration.count({
              where: { tableId, status: 'CONFIRMED', id: { not: registrationId } },
            })
            if (remaining === 0) {
              await tx.table.update({
                where: { id: tableId },
                data: { status: 'AVAILABLE' },
              })
            }
          }
        }

        // tableId move-or-remove path (only meaningful when status is/stays CONFIRMED
        // and the event is TABLE_BASED). Runs after the status-change branch above.
        if (data.tableId !== undefined && currentRegistration.event.eventType === 'TABLE_BASED') {
          const effectiveStatus = newStatus ?? oldStatus
          if (effectiveStatus !== 'CONFIRMED') {
            throw new Error('Cannot set tableId on a non-CONFIRMED registration')
          }

          const currentTableId = currentRegistration.table?.id ?? null
          const targetTableId = data.tableId as string | null

          if (targetTableId === null) {
            // REMOVE FROM TABLE: clear tableId, conditionally release old table
            if (currentTableId) {
              await tx.registration.update({
                where: { id: registrationId },
                data: { tableId: null },
              })
              const remaining = await tx.registration.count({
                where: { tableId: currentTableId, status: 'CONFIRMED' },
              })
              if (remaining === 0) {
                await tx.table.update({
                  where: { id: currentTableId },
                  data: { status: 'AVAILABLE' },
                })
              }
            }
          } else if (targetTableId !== currentTableId) {
            // MOVE: lock the target table row, capacity-check, then assign.
            // Take an explicit FOR UPDATE lock so concurrent moves serialize
            // cleanly on the same target row (belt-and-suspenders inside Serializable).
            const targetRows = await tx.$queryRaw<
              Array<{
                id: string
                eventId: string
                capacity: number
                minOrder: number
                status: string
                tableNumber: string
              }>
            >`
              SELECT id, "eventId", capacity, "minOrder", status, "tableNumber"
              FROM "Table"
              WHERE id = ${targetTableId}
              FOR UPDATE
            `
            const target = targetRows[0]
            if (!target) {
              throw new Error('Target table not found')
            }
            if (target.eventId !== id) {
              throw new Error('Target table does not belong to this event')
            }
            if (target.status === 'INACTIVE') {
              throw new Error(`Table ${target.tableNumber} is on hold (INACTIVE)`)
            }

            // Sum current occupants on the target (CONFIRMED only, excluding this reg
            // in case it's somehow already attached)
            const occupiedAgg = await tx.registration.aggregate({
              where: {
                tableId: targetTableId,
                status: 'CONFIRMED',
                id: { not: registrationId },
              },
              _sum: { guestsCount: true },
            })
            const occupied = occupiedAgg._sum.guestsCount ?? 0
            const incoming = currentRegistration.guestsCount ?? 0
            if (incoming < 1) {
              throw new Error('Registration has no guest count set')
            }
            if (occupied + incoming > target.capacity) {
              throw new Error(
                `Not enough remaining seats on table ${target.tableNumber} (${target.capacity - occupied} free, ${incoming} requested)`
              )
            }
            // minOrder gate: only enforced when opening an empty table
            const isEmpty = occupied === 0
            if (isEmpty && incoming < target.minOrder && !data.force) {
              throw new Error(
                `Guest count (${incoming}) is below table minimum order (${target.minOrder})`
              )
            }

            // Point reg at the new table
            await tx.registration.update({
              where: { id: registrationId },
              data: { tableId: targetTableId },
            })
            // Flip target table to RESERVED if we opened it
            if (isEmpty) {
              await tx.table.update({
                where: { id: targetTableId },
                data: { status: 'RESERVED' },
              })
            }

            // Conditionally release the OLD table if we just vacated it
            if (currentTableId) {
              const remainingOld = await tx.registration.count({
                where: {
                  tableId: currentTableId,
                  status: 'CONFIRMED',
                  id: { not: registrationId },
                },
              })
              if (remainingOld === 0) {
                await tx.table.update({
                  where: { id: currentTableId },
                  data: { status: 'AVAILABLE' },
                })
              }
            }
          }
          // If targetTableId === currentTableId → no-op (move-to-same-table)
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
            ...(data.removedFromTable && {
              removedFromTable: true,
              removedAt: new Date().toISOString(),
            }),
          }
        }

        // If moving to waitlist from confirmed, assign priority
        if (newStatus === 'WAITLIST' && oldStatus === 'CONFIRMED') {
          // Get the highest priority in waitlist and add 1
          const highestPriority = await tx.registration.aggregate({
            where: { eventId: id, status: 'WAITLIST' },
            _max: { waitlistPriority: true },
          })
          updateData.waitlistPriority = (highestPriority._max.waitlistPriority || 0) + 1
        }

        // If manually approving a pending payment, also update the registration's payment fields
        if (oldStatus === 'PAYMENT_PENDING' && newStatus === 'CONFIRMED') {
          updateData.paymentStatus = 'COMPLETED'
          updateData.amountPaid = currentRegistration.amountDue // Mark full amount as paid
        }

        // TABLE_BASED: assign a table when manually approving PAYMENT_PENDING → CONFIRMED.
        // Uses the same Smallest Fit Algorithm as the automated payment callback route.
        // If no table fits, fall back to WAITLIST so the admin can see and handle it manually.
        if (
          oldStatus === 'PAYMENT_PENDING' &&
          newStatus === 'CONFIRMED' &&
          eventCheck.eventType === 'TABLE_BASED'
        ) {
          const guestsCount = currentRegistration.guestsCount ?? 0
          const table = await findSmallestFitTable(tx, id, guestsCount)

          if (table) {
            updateData.tableId = table.id
            manualApprovalAssignedTableId = table.id
          } else {
            // No table available — demote to WAITLIST so the admin can assign manually
            logger.warn(
              'Manual approval: no available table fits guest count — falling back to WAITLIST',
              {
                source: 'registration',
                registrationId,
                guestsCount,
              }
            )
            updateData.status = 'WAITLIST'
            updateData.paymentStatus = 'COMPLETED' // payment is still captured
            const waitlistCount = await tx.registration.count({
              where: { eventId: id, status: 'WAITLIST' },
            })
            updateData.waitlistPriority = waitlistCount + 1
          }
        }

        // If cancelling, record cancellation details
        if (newStatus === 'CANCELLED' && oldStatus !== 'CANCELLED') {
          updateData.cancelledAt = new Date()
          updateData.cancelledBy = 'ADMIN'
          if (data.cancellationReason) {
            updateData.cancellationReason = data.cancellationReason
          }
        }

        const updatedRegistration = await tx.registration.update({
          where: {
            id: registrationId,
            eventId: id,
          },
          data: updateData,
        })

        // If manually approving a pending payment, mark the linked Payment as completed
        if (oldStatus === 'PAYMENT_PENDING' && newStatus === 'CONFIRMED') {
          await tx.payment.updateMany({
            where: { registrationId: registrationId, status: 'PROCESSING' },
            data: {
              status: 'COMPLETED',
              paymentMethod: 'manual',
              yaadPayTransactionId: `MANUAL-${Date.now()}`,
              completedAt: new Date(),
            },
          })
        }

        // Flip the newly assigned table to RESERVED (two-write pattern: reg first, then table)
        if (manualApprovalAssignedTableId) {
          await tx.table.update({
            where: { id: manualApprovalAssignedTableId },
            data: { status: 'RESERVED' },
          })
        }

        return updatedRegistration
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    // MANUAL PAYMENT APPROVAL → send dedicated confirmation email.
    // Runs POST-commit so Resend's network I/O doesn't hold row locks
    // (same pattern as the overbooking alert below). Fire-and-forget:
    // email failure must never rollback or block the 200 response.
    if (priorStatus === 'PAYMENT_PENDING' && data.status === 'CONFIRMED') {
      const regData = (registration.data as Record<string, unknown>) || {}
      const recipientEmail = typeof regData.email === 'string' ? regData.email : null

      if (recipientEmail) {
        generateQRCodeImage(registration.id, id, {
          width: 300,
          margin: 2,
          cancellationToken: registration.cancellationToken || undefined,
        })
          .then((qrCodeImage) =>
            sendManualPaymentConfirmationEmail(recipientEmail, {
              name: extractName(registration.data),
              eventName: eventCheck.title,
              eventDate: format(eventCheck.startAt, "d בMMMM yyyy 'בשעה' HH:mm", { locale: he }),
              eventLocation: eventCheck.location ?? undefined,
              confirmationCode: registration.confirmationCode,
              qrCodeImage,
              schoolName: eventCheck.school.name,
              cancellationUrl: registration.cancellationToken
                ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'}/cancel/${registration.cancellationToken}`
                : undefined,
              amountPaid: registration.amountDue?.toString(),
            })
          )
          .then(() => {
            logger.info('Manual-approval confirmation email sent', {
              source: 'registration',
              registrationId,
              to: recipientEmail,
            })
          })
          .catch((err) =>
            logger.error('Failed to send manual-approval confirmation email', {
              source: 'registration',
              error: err,
              registrationId,
            })
          )
      } else {
        logger.warn('Manual approval: no email on registration.data, skipping confirmation email', {
          source: 'registration',
          registrationId,
        })
      }
    }

    // SAFETY CHECK: Detect if overbooking somehow occurred (shouldn't happen, but alert if it does)
    if (data.status === 'CONFIRMED') {
      try {
        const [overbookCheck] = await prisma.$queryRaw<
          Array<{
            capacity: number
            confirmedSpots: bigint
          }>
        >`
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
            overage: Number(overbookCheck.confirmedSpots) - overbookCheck.capacity,
          })

          // Get registration details for the alert
          const regDetails = await prisma.registration.findUnique({
            where: { id: registrationId },
            select: { phoneNumber: true, spotsCount: true, data: true },
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
            registrantPhone: regDetails?.phoneNumber || 'לא צוין',
          }).catch((emailError) => {
            logger.error('Failed to send overbooking alert email', {
              source: 'registration',
              error: emailError,
            })
          })
        }
      } catch (checkError) {
        logger.error('Error checking for overbooking', {
          source: 'registration',
          error: checkError,
        })
      }
    }

    return NextResponse.json(registration)
  } catch (error: any) {
    logger.error('Error updating registration', { source: 'registration', error })

    // Handle specific error messages (capacity validation errors)
    if (error.message.includes('Cannot promote') || error.message.includes('לא ניתן לאשר')) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Table sharing / move errors
    if (
      error.message.includes('Cannot set tableId') ||
      error.message.includes('Target table') ||
      error.message.includes('on hold') ||
      error.message.includes('no guest count') ||
      error.message.includes('Not enough remaining seats') ||
      error.message.includes('below table minimum')
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    if (error.message.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, registrationId } = await params

    // Verify admin has access to this event's school
    const event = await prisma.event.findUnique({
      where: { id },
      select: { schoolId: true },
    })

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    // Check school access (SUPER_ADMIN can access all, others must match schoolId)
    if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have access to this event' },
        { status: 403 }
      )
    }

    // Use transaction to atomically delete and update counter
    await prisma.$transaction(
      async (tx) => {
        // Get registration to check status and spots
        const registration = await tx.registration.findUnique({
          where: { id: registrationId, eventId: id },
          select: { status: true, spotsCount: true },
        })

        if (!registration) {
          throw new Error('Registration not found')
        }

        // Delete the registration
        await tx.registration.delete({
          where: {
            id: registrationId,
            eventId: id,
          },
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
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000,
      }
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.error('Error deleting registration', { source: 'registration', error })

    if (error.message.includes('not found')) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Failed to delete registration' }, { status: 500 })
  }
}
