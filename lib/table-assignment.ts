import { prisma, Prisma } from '@/lib/prisma'
import type { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { generateQRCodeData } from '@/lib/qr-code'

/**
 * Shared transaction type that accepts either a full PrismaClient or a
 * transactional tx client. Used so both the public register path and the
 * payment callback path can find a smallest-fit table using the same
 * source-of-truth query.
 */
type TxClient = Prisma.TransactionClient | PrismaClient

/**
 * Find the smallest AVAILABLE table that fits `guestsCount` and whose
 * minOrder is met. Returns null when nothing fits.
 *
 * SMALLEST_FIT ordering intentionally picks the tightest-capacity table so
 * large tables stay available for larger parties. `minOrder` is only a gate
 * for empty tables — this function assumes the caller wants to allocate a
 * whole empty table (public booking & paid flows), which is consistent with
 * `reserveTableForGuests`. Admins who want to share an already-occupied
 * table go through a different code path.
 */
export async function findSmallestFitTable(tx: TxClient, eventId: string, guestsCount: number) {
  return tx.table.findFirst({
    where: {
      eventId,
      status: 'AVAILABLE',
      capacity: { gte: guestsCount }, // Must fit the group
      minOrder: { lte: guestsCount }, // Group meets the table's minimum
    },
    orderBy: { capacity: 'asc' }, // SMALLEST first
  })
}

export async function reserveTableForGuests(
  eventId: string,
  guestsCount: number,
  registrationData: {
    phoneNumber: string
    data: Prisma.InputJsonValue
  }
) {
  // Validate required fields
  if (!registrationData.phoneNumber || registrationData.phoneNumber.trim() === '') {
    throw new Error('Phone number is required for table reservation')
  }

  return await prisma.$transaction(
    async (tx) => {
      // Find smallest fitting table (SMALLEST_FIT) via shared helper so
      // this query stays identical between the public register path and
      // the payment callback path.
      const table = await findSmallestFitTable(tx, eventId, guestsCount)

      // No table → WAITLIST
      if (!table) {
        const waitlistCount = await tx.registration.count({
          where: { eventId, status: 'WAITLIST' },
        })

        const registration = await tx.registration.create({
          data: {
            eventId,
            guestsCount,
            status: 'WAITLIST',
            waitlistPriority: waitlistCount + 1,
            confirmationCode: generateConfirmationCode(),
            cancellationToken: generateCancellationToken(eventId, registrationData.phoneNumber),
            phoneNumber: registrationData.phoneNumber,
            data: registrationData.data,
          },
        })

        // Generate QR code
        const qrCodeData = generateQRCodeData(registration.id, eventId)
        await tx.registration.update({
          where: { id: registration.id },
          data: { qrCode: qrCodeData },
        })

        return { status: 'WAITLIST', registration }
      }

      // Table available → CONFIRMED
      const registration = await tx.registration.create({
        data: {
          eventId,
          guestsCount,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          cancellationToken: generateCancellationToken(eventId, registrationData.phoneNumber),
          phoneNumber: registrationData.phoneNumber,
          data: registrationData.data,
        },
      })

      // Generate QR code
      const qrCodeData = generateQRCodeData(registration.id, eventId)
      await tx.registration.update({
        where: { id: registration.id },
        data: { qrCode: qrCodeData },
      })

      // Two-write pattern: point registration at table, then flip table status.
      // Order matters for mental correctness — a concurrent reader should never
      // see a RESERVED table with zero registrations pointing at it.
      await tx.registration.update({
        where: { id: registration.id },
        data: { tableId: table.id },
      })
      await tx.table.update({
        where: { id: table.id },
        data: { status: 'RESERVED' },
      })

      return { status: 'CONFIRMED', registration, table }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000,
    }
  )
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateCancellationToken(eventId: string, phone: string): string {
  return jwt.sign({ eventId, phone }, process.env.JWT_SECRET!, { expiresIn: '30d' })
}
