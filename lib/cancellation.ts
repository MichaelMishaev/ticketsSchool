import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

/**
 * Cancel reservation using token (customer self-service cancellation)
 * Enforces cancellation deadline
 */
export async function cancelReservation(token: string, reason?: string) {
  // Verify JWT token
  let decoded: { eventId: string; phone: string }

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET!) as any
  } catch (error) {
    throw new Error('Invalid or expired cancellation link')
  }

  return await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findFirst({
      where: {
        eventId: decoded.eventId,
        phoneNumber: decoded.phone,
        status: { in: ['CONFIRMED', 'WAITLIST'] }
      },
      include: { event: true, assignedTable: true }
    })

    if (!registration) {
      throw new Error('Registration not found or already cancelled')
    }

    // Check deadline
    const hoursUntilEvent =
      (new Date(registration.event.startAt).getTime() - Date.now()) / (1000 * 60 * 60)

    if (hoursUntilEvent < registration.event.cancellationDeadlineHours) {
      throw new Error(`Cannot cancel less than ${registration.event.cancellationDeadlineHours} hours before event`)
    }

    // Mark cancelled
    await tx.registration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: 'CUSTOMER'
      }
    })

    // Free table if table-based
    if (registration.event.eventType === 'TABLE_BASED' && registration.assignedTable) {
      await tx.table.update({
        where: { id: registration.assignedTable.id },
        data: { status: 'AVAILABLE', reservedById: null }
      })
    }

    // Decrement counter if capacity-based
    if (registration.event.eventType === 'CAPACITY_BASED') {
      await tx.event.update({
        where: { id: registration.eventId },
        data: { spotsReserved: { decrement: registration.spotsCount || 0 } }
      })
    }

    return { success: true }
  })
}

/**
 * Admin cancellation - bypasses deadline, preserves data for audit trail
 * @param registrationId - Registration ID to cancel
 * @param reason - Optional cancellation reason
 * @returns Success result
 */
export async function adminCancelReservation(registrationId: string, reason?: string) {
  return await prisma.$transaction(async (tx) => {
    const registration = await tx.registration.findUnique({
      where: { id: registrationId },
      include: { event: true, assignedTable: true }
    })

    if (!registration) {
      throw new Error('Registration not found')
    }

    if (registration.status === 'CANCELLED') {
      throw new Error('Registration already cancelled')
    }

    // Mark cancelled by admin
    await tx.registration.update({
      where: { id: registration.id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancellationReason: reason,
        cancelledBy: 'ADMIN'
      }
    })

    // Free table if table-based and confirmed
    if (registration.event.eventType === 'TABLE_BASED' && registration.assignedTable) {
      await tx.table.update({
        where: { id: registration.assignedTable.id },
        data: { status: 'AVAILABLE', reservedById: null }
      })
    }

    // Decrement counter if capacity-based and confirmed
    if (registration.event.eventType === 'CAPACITY_BASED' && registration.status === 'CONFIRMED') {
      await tx.event.update({
        where: { id: registration.eventId },
        data: { spotsReserved: { decrement: registration.spotsCount || 0 } }
      })
    }

    return { success: true }
  })
}
