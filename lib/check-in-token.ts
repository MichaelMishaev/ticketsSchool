import crypto from 'crypto'

/**
 * Generate a secure random check-in token for an event
 * This token allows public (but secure) access to the check-in page
 */
export function generateCheckInToken(): string {
  return crypto.randomBytes(32).toString('base64url')
}

/**
 * Validate a check-in token format
 * Returns true if the token looks valid (base64url format, correct length)
 */
export function validateCheckInTokenFormat(token: string): boolean {
  // Token should be base64url encoded (64 chars from 32 bytes)
  const base64UrlRegex = /^[A-Za-z0-9_-]{43}$/
  return base64UrlRegex.test(token)
}
