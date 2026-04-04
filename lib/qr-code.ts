import QRCode from 'qrcode'
import crypto from 'crypto'

/**
 * Generate a unique QR code string for a registration
 * Format: {registrationId}:{eventId}:{checksum}
 */
export function generateQRCodeData(registrationId: string, eventId: string): string {
  // Create checksum to prevent tampering
  const checksum = crypto
    .createHash('sha256')
    .update(`${registrationId}:${eventId}:${process.env.JWT_SECRET}`)
    .digest('hex')
    .substring(0, 8)

  return `${registrationId}:${eventId}:${checksum}`
}

/**
 * Generate a QR code URL for a registration (User Ticket URL)
 * This creates a scannable URL that opens the user's personal ticket page
 * Format: https://domain.com/ticket/{registrationId}/{cancellationToken}
 *
 * SECURITY: Uses cancellationToken (unique per registration) instead of
 * checkInToken (shared per event) to prevent users from seeing other registrations.
 *
 * The user ticket page shows:
 * - Their registration details
 * - QR code for staff scanning
 * - Check-in status
 * - Cancel button
 *
 * It does NOT show:
 * - Other registrations
 * - Staff controls
 * - Phone numbers of others
 */
export function generateQRCodeURL(registrationId: string, cancellationToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:9000'

  return `${baseUrl}/ticket/${registrationId}/${cancellationToken}`
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
 * If cancellationToken is provided, generates a scannable URL to user ticket page
 * Otherwise generates raw data (for backwards compatibility)
 *
 * SECURITY FIX: Now uses cancellationToken (per-registration) instead of
 * checkInToken (per-event) to prevent users from accessing staff dashboard.
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
    cancellationToken?: string
    /** @deprecated Use cancellationToken instead */
    checkInToken?: string
  } = {}
): Promise<string> {
  // Generate URL if cancellationToken provided, otherwise use raw data
  // Note: checkInToken is deprecated - use cancellationToken for security
  const qrData = options.cancellationToken
    ? generateQRCodeURL(registrationId, options.cancellationToken)
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
 * If cancellationToken is provided, generates a scannable URL to user ticket page
 * Otherwise generates raw data (for backwards compatibility)
 *
 * SECURITY FIX: Now uses cancellationToken (per-registration) instead of
 * checkInToken (per-event) to prevent users from accessing staff dashboard.
 */
export async function generateQRCodeBuffer(
  registrationId: string,
  eventId: string,
  options: {
    width?: number
    margin?: number
    cancellationToken?: string
    /** @deprecated Use cancellationToken instead */
    checkInToken?: string
  } = {}
): Promise<Buffer> {
  // Generate URL if cancellationToken provided, otherwise use raw data
  // Note: checkInToken is deprecated - use cancellationToken for security
  const qrData = options.cancellationToken
    ? generateQRCodeURL(registrationId, options.cancellationToken)
    : generateQRCodeData(registrationId, eventId)

  const buffer = await QRCode.toBuffer(qrData, {
    width: options.width || 300,
    margin: options.margin || 2,
    type: 'png',
  })

  return buffer
}
