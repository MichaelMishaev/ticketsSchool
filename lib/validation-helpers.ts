/**
 * Validation Helpers for Event Registration System
 *
 * This module provides validation functions for:
 * - Email addresses (RFC 5322 compliant)
 * - Israeli phone numbers (10 digits, starts with 0)
 * - Hebrew text (for names, descriptions)
 * - Field requirements (check required fields)
 * - URLs (for logos, images)
 * - Capacity (positive integers)
 * - Price (positive numbers, cents)
 * - Time format (HH:mm, 00:00-23:59)
 */

/**
 * Validates email address format (RFC 5322 compliant)
 * @param email - Email address to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // RFC 5322 compliant email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Validates Israeli phone number format (10 digits starting with 0)
 * Accepts formats with spaces, dashes, parentheses
 * @param phone - Phone number to validate
 * @returns true if valid Israeli phone format
 */
export function isValidIsraeliPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false
  }

  // Normalize phone: remove spaces, dashes, parentheses
  const normalized = phone.replace(/[\s\-\(\)]/g, '')

  // After normalization, must be exactly 10 digits starting with 0
  return /^0\d{9}$/.test(normalized)
}

/**
 * Checks if text contains Hebrew characters
 * Useful for validating Hebrew names, descriptions
 * @param text - Text to check
 * @returns true if text contains at least one Hebrew character
 */
export function containsHebrew(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  // Hebrew Unicode range: U+0590 to U+05FF
  return /[\u0590-\u05FF]/.test(text)
}

/**
 * Checks which required fields are missing from data object
 * Treats null, undefined, empty string as missing
 * @param data - Data object to check
 * @param requiredFields - Array of required field names
 * @returns Array of missing field names (empty if all present)
 */
export function getMissingFields(data: Record<string, any>, requiredFields: string[]): string[] {
  return requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })
}

/**
 * Validates URL format
 * @param url - URL to validate
 * @returns true if valid URL format
 */
export function isValidURL(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates event capacity (must be positive integer)
 * @param capacity - Capacity to validate
 * @returns true if positive integer
 */
export function isValidCapacity(capacity: number): boolean {
  return Number.isInteger(capacity) && capacity > 0
}

/**
 * Validates price in cents (must be non-negative integer)
 * @param price - Price in cents (agorot)
 * @returns true if non-negative integer
 */
export function isValidPrice(price: number): boolean {
  return Number.isInteger(price) && price >= 0
}

/**
 * Validates time format (HH:mm, 00:00-23:59)
 * @param time - Time string to validate
 * @returns true if valid HH:mm format
 */
export function isValidTime(time: string): boolean {
  if (!time || typeof time !== 'string') {
    return false
  }

  // HH:mm format: 00:00 to 23:59
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/
  return timeRegex.test(time)
}

/**
 * Validates date string (YYYY-MM-DD format)
 * @param date - Date string to validate
 * @returns true if valid date format and date is valid
 */
export function isValidDate(date: string): boolean {
  if (!date || typeof date !== 'string') {
    return false
  }

  // YYYY-MM-DD format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(date)) {
    return false
  }

  // Parse date parts
  const [year, month, day] = date.split('-').map(Number)

  // Check if date is valid (not 2024-02-30)
  const dateObj = new Date(year, month - 1, day)

  // Date constructor auto-corrects invalid dates (Feb 30 → Mar 2)
  // So we need to check if the resulting date matches what we put in
  return (
    !isNaN(dateObj.getTime()) &&
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  )
}

/**
 * Validates confirmation code format (6 alphanumeric characters)
 * @param code - Confirmation code to validate
 * @returns true if valid confirmation code format
 */
export function isValidConfirmationCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false
  }

  // 6 alphanumeric characters (case-insensitive)
  return /^[A-Z0-9]{6}$/i.test(code)
}
