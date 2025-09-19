import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateConfirmationCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
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