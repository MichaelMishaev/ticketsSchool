import { prisma, Prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { generateQRCodeData } from '@/lib/qr-code'

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
      // Find smallest fitting table (SMALLEST_FIT)
      const table = await tx.table.findFirst({
        where: {
          eventId,
          status: 'AVAILABLE',
          capacity: { gte: guestsCount },  // Must fit group
          minOrder: { lte: guestsCount }   // Group meets minimum
        },
        orderBy: { capacity: 'asc' }  // SMALLEST first
      })

      // No table → WAITLIST
      if (!table) {
        const waitlistCount = await tx.registration.count({
          where: { eventId, status: 'WAITLIST' }
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
            data: registrationData.data
          }
        })

        // Generate QR code
        const qrCodeData = generateQRCodeData(registration.id, eventId)
        await tx.registration.update({
          where: { id: registration.id },
          data: { qrCode: qrCodeData }
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
          data: registrationData.data
        }
      })

      // Generate QR code
      const qrCodeData = generateQRCodeData(registration.id, eventId)
      await tx.registration.update({
        where: { id: registration.id },
        data: { qrCode: qrCodeData }
      })

      await tx.table.update({
        where: { id: table.id },
        data: { status: 'RESERVED', reservedById: registration.id }
      })

      return { status: 'CONFIRMED', registration, table }
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      timeout: 10000
    }
  )
}

function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateCancellationToken(eventId: string, phone: string): string {
  return jwt.sign(
    { eventId, phone },
    process.env.JWT_SECRET!,
    { expiresIn: '30d' }
  )
}
