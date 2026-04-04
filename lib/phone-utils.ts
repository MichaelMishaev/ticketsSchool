/**
 * Phone number utilities for Israeli phone numbers
 */

/**
 * Normalize Israeli phone number to standard format (0XXXXXXXXX)
 * Accepts various formats: 050-123-4567, (050) 123 4567, +972501234567
 *
 * @param phone - Phone number in any format
 * @returns Normalized phone number (10 digits starting with 0)
 * @throws Error if phone number is invalid
 *
 * @example
 * normalizePhone('050-123-4567') // '0501234567'
 * normalizePhone('+972501234567') // '0501234567'
 * normalizePhone('050 123 4567') // '0501234567'
 */
export function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  // Handle international format +972
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  // Validate Israeli format (10 digits starting with 0)
  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('Invalid Israeli phone number format')
  }

  return normalized
}
