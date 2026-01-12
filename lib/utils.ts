import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { randomBytes } from 'crypto'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateConfirmationCode(): string {
  // Generate cryptographically secure random code (6 characters)
  // Using base36 encoding (0-9, A-Z) for better readability
  const bytes = randomBytes(4) // 4 bytes = 32 bits of entropy
  const num = bytes.readUInt32BE(0)
  // Convert to base36 and take 6 characters, pad if needed
  return num.toString(36).substring(0, 6).toUpperCase().padStart(6, '0')
}

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.startsWith('972')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('0')) {
    return '+972' + cleaned.substring(1)
  }
  return '+972' + cleaned
}