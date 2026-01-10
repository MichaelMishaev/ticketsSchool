import QRCode from 'qrcode'
import crypto from 'crypto'

/**
 * Generate a unique QR code string for a registration
 * Format: {registrationId}:{eventId}:{checksum}
 */
export function generateQRCodeData(
  registrationId: string,
  eventId: string
): string {
  // Create checksum to prevent tampering
  const checksum = crypto
    .createHash('sha256')
    .update(`${registrationId}:${eventId}:${process.env.JWT_SECRET}`)
    .digest('hex')
    .substring(0, 8)

  return `${registrationId}:${eventId}:${checksum}`
}

/**
 * Validate a QR code string
 * Returns { valid: true, registrationId, eventId } if valid
 * Returns { valid: false } if invalid
 */
export function validateQRCodeData(qrCodeData: string): {
  valid: boolean
  registrationId?: string
  eventId?: string
} {
  try {
    const parts = qrCodeData.split(':')
    if (parts.length !== 3) {
      return { valid: false }
    }

    const [registrationId, eventId, checksum] = parts

    // Verify checksum
    const expectedChecksum = crypto
      .createHash('sha256')
      .update(`${registrationId}:${eventId}:${process.env.JWT_SECRET}`)
      .digest('hex')
      .substring(0, 8)

    if (checksum !== expectedChecksum) {
      return { valid: false }
    }

    return {
      valid: true,
      registrationId,
      eventId,
    }
  } catch {
    return { valid: false }
  }
}

/**
 * Generate a QR code image as a data URL
 */
export async function generateQRCodeImage(
  registrationId: string,
  eventId: string,
  options: {
    width?: number
    margin?: number
    color?: {
      dark?: string
      light?: string
    }
  } = {}
): Promise<string> {
  const qrData = generateQRCodeData(registrationId, eventId)

  const qrCodeDataURL = await QRCode.toDataURL(qrData, {
    width: options.width || 300,
    margin: options.margin || 2,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF',
    },
  })

  return qrCodeDataURL
}

/**
 * Generate a QR code image as a buffer (for PDFs)
 */
export async function generateQRCodeBuffer(
  registrationId: string,
  eventId: string,
  options: {
    width?: number
    margin?: number
  } = {}
): Promise<Buffer> {
  const qrData = generateQRCodeData(registrationId, eventId)

  const buffer = await QRCode.toBuffer(qrData, {
    width: options.width || 300,
    margin: options.margin || 2,
    type: 'png',
  })

  return buffer
}
