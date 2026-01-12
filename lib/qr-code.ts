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
 * Generate a QR code URL for a registration
 * This creates a scannable URL that phones can open directly
 * Format: https://domain.com/check-in/{eventId}/{token}?qr={qrData}
 */
export function generateQRCodeURL(
  registrationId: string,
  eventId: string,
  checkInToken: string
): string {
  const qrData = generateQRCodeData(registrationId, eventId)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'

  return `${baseUrl}/check-in/${eventId}/${checkInToken}?qr=${encodeURIComponent(qrData)}`
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
 * If checkInToken is provided, generates a scannable URL
 * Otherwise generates raw data (for backwards compatibility)
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
    checkInToken?: string
  } = {}
): Promise<string> {
  // Generate URL if checkInToken provided, otherwise use raw data
  const qrData = options.checkInToken
    ? generateQRCodeURL(registrationId, eventId, options.checkInToken)
    : generateQRCodeData(registrationId, eventId)

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
 * If checkInToken is provided, generates a scannable URL
 * Otherwise generates raw data (for backwards compatibility)
 */
export async function generateQRCodeBuffer(
  registrationId: string,
  eventId: string,
  options: {
    width?: number
    margin?: number
    checkInToken?: string
  } = {}
): Promise<Buffer> {
  // Generate URL if checkInToken provided, otherwise use raw data
  const qrData = options.checkInToken
    ? generateQRCodeURL(registrationId, eventId, options.checkInToken)
    : generateQRCodeData(registrationId, eventId)

  const buffer = await QRCode.toBuffer(qrData, {
    width: options.width || 300,
    margin: options.margin || 2,
    type: 'png',
  })

  return buffer
}
