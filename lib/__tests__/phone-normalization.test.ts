/**
 * PRINCIPLE #1: TDD - Test business logic with unit tests
 *
 * Phone normalization is critical for Israeli phone numbers.
 * This test suite ensures phone format consistency.
 */

import { describe, test, expect } from 'vitest'
import { normalizePhone } from '@/lib/phone-utils'

describe('Phone Normalization', () => {
  describe('Valid formats', () => {
    test('normalizes standard format (0501234567)', () => {
      expect(normalizePhone('0501234567')).toBe('0501234567')
    })

    test('normalizes format with spaces (050 123 4567)', () => {
      expect(normalizePhone('050 123 4567')).toBe('0501234567')
    })

    test('normalizes format with dashes (050-123-4567)', () => {
      expect(normalizePhone('050-123-4567')).toBe('0501234567')
    })

    test('normalizes format with parentheses (050) 123-4567', () => {
      expect(normalizePhone('(050) 123-4567')).toBe('0501234567')
    })

    test('converts international format +972501234567', () => {
      expect(normalizePhone('+972501234567')).toBe('0501234567')
    })

    test('converts international format with spaces +972 50 123 4567', () => {
      expect(normalizePhone('+972 50 123 4567')).toBe('0501234567')
    })
  })

  describe('Invalid formats (NEGATIVE TESTING)', () => {
    test('REJECTS phone with 9 digits', () => {
      expect(() => normalizePhone('050123456')).toThrow('Invalid Israeli phone number')
    })

    test('REJECTS phone with 11 digits', () => {
      expect(() => normalizePhone('05012345678')).toThrow('Invalid Israeli phone number')
    })

    test('REJECTS phone not starting with 0', () => {
      expect(() => normalizePhone('5501234567')).toThrow('Invalid Israeli phone number')
    })

    test('REJECTS empty string', () => {
      expect(() => normalizePhone('')).toThrow('Invalid Israeli phone number')
    })

    test('REJECTS non-numeric characters only', () => {
      expect(() => normalizePhone('abc-def-ghij')).toThrow('Invalid Israeli phone number')
    })

    test('REJECTS null/undefined (TypeScript should catch)', () => {
      // @ts-expect-error Testing runtime behavior
      expect(() => normalizePhone(null)).toThrow()
    })
  })

  describe('Edge cases', () => {
    test('handles leading/trailing spaces', () => {
      expect(normalizePhone('  0501234567  ')).toBe('0501234567')
    })

    test('handles mixed separators', () => {
      expect(normalizePhone('050-123 4567')).toBe('0501234567')
    })
  })
})
