/**
 * PRINCIPLE #11: Negative Testing - Test both SHOULD work AND MUST NOT work
 *
 * Comprehensive validation helpers unit tests for event registration system.
 * Covers: email, phone, Hebrew, fields, URL, capacity, price, time, date, codes.
 *
 * Test Coverage:
 * - ✅ 60% positive tests (valid inputs)
 * - ✅ 40% negative tests (invalid inputs - REJECTS)
 * - ✅ Edge cases (empty strings, null, undefined, boundary values)
 */

import { describe, test, expect } from 'vitest'
import {
  isValidEmail,
  isValidIsraeliPhone,
  containsHebrew,
  getMissingFields,
  isValidURL,
  isValidCapacity,
  isValidPrice,
  isValidTime,
  isValidDate,
  isValidConfirmationCode,
} from '@/lib/validation-helpers'

describe('Validation Helpers', () => {
  describe('Email validation - isValidEmail()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true)
      expect(isValidEmail('test.user@domain.co.il')).toBe(true)
      expect(isValidEmail('admin+test@school.org')).toBe(true)
      expect(isValidEmail('contact@sub.domain.com')).toBe(true)
    })

    test('accepts email with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true)
      expect(isValidEmail('2023test@domain.com')).toBe(true)
    })

    test('accepts email with hyphens and underscores', () => {
      expect(isValidEmail('first-last@example.com')).toBe(true)
      expect(isValidEmail('user_name@domain.com')).toBe(true)
    })

    test('trims whitespace before validation', () => {
      expect(isValidEmail('  user@example.com  ')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS invalid email addresses', () => {
      expect(isValidEmail('invalid')).toBe(false)
      expect(isValidEmail('missing@domain')).toBe(false)
      expect(isValidEmail('@nodomain.com')).toBe(false)
      expect(isValidEmail('no-at-sign.com')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidEmail('')).toBe(false)
    })

    test('REJECTS whitespace only', () => {
      expect(isValidEmail('   ')).toBe(false)
    })

    test('REJECTS email with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false)
    })

    test('REJECTS multiple @ symbols', () => {
      expect(isValidEmail('user@@example.com')).toBe(false)
      expect(isValidEmail('user@domain@example.com')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidEmail(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidEmail(undefined)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidEmail(123)).toBe(false)
    })
  })

  describe('Israeli phone validation - isValidIsraeliPhone()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid Israeli phone numbers (10 digits starting with 0)', () => {
      expect(isValidIsraeliPhone('0501234567')).toBe(true)
      expect(isValidIsraeliPhone('0521234567')).toBe(true)
      expect(isValidIsraeliPhone('0541234567')).toBe(true)
      expect(isValidIsraeliPhone('0771234567')).toBe(true)
    })

    test('accepts phone with spaces', () => {
      expect(isValidIsraeliPhone('050 123 4567')).toBe(true)
      expect(isValidIsraeliPhone('050 1234567')).toBe(true)
    })

    test('accepts phone with dashes', () => {
      expect(isValidIsraeliPhone('050-123-4567')).toBe(true)
      expect(isValidIsraeliPhone('050-1234567')).toBe(true)
    })

    test('accepts phone with parentheses', () => {
      expect(isValidIsraeliPhone('(050) 123-4567')).toBe(true)
      expect(isValidIsraeliPhone('(050)1234567')).toBe(true)
    })

    test('accepts phone with mixed separators', () => {
      expect(isValidIsraeliPhone('050-123 4567')).toBe(true)
      expect(isValidIsraeliPhone('(050) 123 4567')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS phone with 9 digits (too short)', () => {
      expect(isValidIsraeliPhone('050123456')).toBe(false)
    })

    test('REJECTS phone with 11 digits (too long)', () => {
      expect(isValidIsraeliPhone('05012345678')).toBe(false)
    })

    test('REJECTS phone not starting with 0', () => {
      expect(isValidIsraeliPhone('5501234567')).toBe(false)
      expect(isValidIsraeliPhone('1501234567')).toBe(false)
    })

    test('REJECTS international format +972 (not normalized)', () => {
      // This function expects normalized Israeli format (0XXXXXXXXX)
      // International format should be normalized first
      expect(isValidIsraeliPhone('+972501234567')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidIsraeliPhone('')).toBe(false)
    })

    test('REJECTS non-numeric characters only', () => {
      expect(isValidIsraeliPhone('abc-def-ghij')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidIsraeliPhone(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidIsraeliPhone(undefined)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidIsraeliPhone(123456789)).toBe(false)
    })
  })

  describe('Hebrew text validation - containsHebrew()', () => {
    // POSITIVE TESTS (60%)
    test('detects Hebrew characters', () => {
      expect(containsHebrew('שלום')).toBe(true)
      expect(containsHebrew('ישראל')).toBe(true)
      expect(containsHebrew('מכבי תל אביב')).toBe(true)
    })

    test('handles mixed Hebrew and English', () => {
      expect(containsHebrew('Hello שלום')).toBe(true)
      expect(containsHebrew('שלום World')).toBe(true)
      expect(containsHebrew('2024 ישראל')).toBe(true)
    })

    test('handles Hebrew with numbers and punctuation', () => {
      expect(containsHebrew('ישראל 2024')).toBe(true)
      expect(containsHebrew('שלום!')).toBe(true)
      expect(containsHebrew('ישראל, תל אביב')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('returns false for English-only text', () => {
      expect(containsHebrew('Hello World')).toBe(false)
      expect(containsHebrew('English Text')).toBe(false)
    })

    test('returns false for numbers only', () => {
      expect(containsHebrew('123456')).toBe(false)
    })

    test('returns false for empty string', () => {
      expect(containsHebrew('')).toBe(false)
    })

    test('returns false for whitespace only', () => {
      expect(containsHebrew('   ')).toBe(false)
    })

    test('returns false for non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(containsHebrew(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(containsHebrew(undefined)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(containsHebrew(123)).toBe(false)
    })
  })

  describe('Required fields validation - getMissingFields()', () => {
    // POSITIVE TESTS (60%)
    test('returns empty array when all required fields present', () => {
      const data = {
        name: 'משה כהן',
        email: 'moshe@example.com',
        phone: '0501234567',
      }
      const required = ['name', 'email', 'phone']

      expect(getMissingFields(data, required)).toEqual([])
    })

    test('handles extra fields (not in required list)', () => {
      const data = {
        name: 'משה',
        email: 'test@test.com',
        extraField: 'ignored',
      }
      const required = ['name', 'email']

      expect(getMissingFields(data, required)).toEqual([])
    })

    test('returns empty array when no fields required', () => {
      const data = { name: 'Test' }
      const required: string[] = []

      expect(getMissingFields(data, required)).toEqual([])
    })

    // NEGATIVE TESTS (40%)
    test('returns missing field names', () => {
      const data = {
        name: 'משה',
        // email missing
        phone: '0501234567',
      }
      const required = ['name', 'email', 'phone']

      expect(getMissingFields(data, required)).toEqual(['email'])
    })

    test('returns multiple missing fields', () => {
      const data = {
        name: 'משה',
        // email and phone missing
      }
      const required = ['name', 'email', 'phone']

      expect(getMissingFields(data, required)).toEqual(['email', 'phone'])
    })

    test('treats null as missing', () => {
      const data = {
        name: null,
        email: 'test@test.com',
      }
      const required = ['name', 'email']

      expect(getMissingFields(data, required)).toEqual(['name'])
    })

    test('treats undefined as missing', () => {
      const data = {
        name: undefined,
        email: 'test@test.com',
      }
      const required = ['name', 'email']

      expect(getMissingFields(data, required)).toEqual(['name'])
    })

    test('treats empty string as missing', () => {
      const data = {
        name: '',
        email: 'test@test.com',
      }
      const required = ['name', 'email']

      expect(getMissingFields(data, required)).toEqual(['name'])
    })

    test('handles all fields missing', () => {
      const data = {}
      const required = ['name', 'email', 'phone']

      expect(getMissingFields(data, required)).toEqual(['name', 'email', 'phone'])
    })
  })

  describe('URL validation - isValidURL()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid HTTP URLs', () => {
      expect(isValidURL('http://example.com')).toBe(true)
      expect(isValidURL('http://www.example.com')).toBe(true)
    })

    test('accepts valid HTTPS URLs', () => {
      expect(isValidURL('https://example.com')).toBe(true)
      expect(isValidURL('https://www.example.com')).toBe(true)
      expect(isValidURL('https://subdomain.example.com')).toBe(true)
    })

    test('accepts URLs with paths', () => {
      expect(isValidURL('https://example.com/path/to/page')).toBe(true)
      expect(isValidURL('https://example.com/image.png')).toBe(true)
    })

    test('accepts URLs with query parameters', () => {
      expect(isValidURL('https://example.com?param=value')).toBe(true)
      expect(isValidURL('https://example.com/path?a=1&b=2')).toBe(true)
    })

    test('accepts URLs with ports', () => {
      expect(isValidURL('https://example.com:8080')).toBe(true)
      expect(isValidURL('http://localhost:3000')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS invalid URLs', () => {
      expect(isValidURL('not-a-url')).toBe(false)
      expect(isValidURL('just text')).toBe(false)
    })

    test('REJECTS URLs without protocol', () => {
      expect(isValidURL('example.com')).toBe(false)
      expect(isValidURL('www.example.com')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidURL('')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidURL(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidURL(undefined)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidURL(123)).toBe(false)
    })
  })

  describe('Capacity validation - isValidCapacity()', () => {
    // POSITIVE TESTS (60%)
    test('accepts positive integers', () => {
      expect(isValidCapacity(1)).toBe(true)
      expect(isValidCapacity(10)).toBe(true)
      expect(isValidCapacity(100)).toBe(true)
      expect(isValidCapacity(1000)).toBe(true)
    })

    test('accepts large capacities', () => {
      expect(isValidCapacity(10000)).toBe(true)
      expect(isValidCapacity(999999)).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS zero', () => {
      expect(isValidCapacity(0)).toBe(false)
    })

    test('REJECTS negative numbers', () => {
      expect(isValidCapacity(-1)).toBe(false)
      expect(isValidCapacity(-100)).toBe(false)
    })

    test('REJECTS floats/decimals', () => {
      expect(isValidCapacity(10.5)).toBe(false)
      expect(isValidCapacity(1.1)).toBe(false)
    })

    test('REJECTS NaN', () => {
      expect(isValidCapacity(NaN)).toBe(false)
    })

    test('REJECTS Infinity', () => {
      expect(isValidCapacity(Infinity)).toBe(false)
      expect(isValidCapacity(-Infinity)).toBe(false)
    })
  })

  describe('Price validation - isValidPrice()', () => {
    // POSITIVE TESTS (60%)
    test('accepts zero (free events)', () => {
      expect(isValidPrice(0)).toBe(true)
    })

    test('accepts positive integers (price in cents/agorot)', () => {
      expect(isValidPrice(1)).toBe(true)
      expect(isValidPrice(100)).toBe(true)
      expect(isValidPrice(5000)).toBe(true) // 50 shekels
    })

    test('accepts large prices', () => {
      expect(isValidPrice(100000)).toBe(true) // 1000 shekels
      expect(isValidPrice(999999)).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS negative prices', () => {
      expect(isValidPrice(-1)).toBe(false)
      expect(isValidPrice(-100)).toBe(false)
    })

    test('REJECTS floats/decimals (price must be in cents)', () => {
      expect(isValidPrice(10.5)).toBe(false)
      expect(isValidPrice(99.99)).toBe(false)
    })

    test('REJECTS NaN', () => {
      expect(isValidPrice(NaN)).toBe(false)
    })

    test('REJECTS Infinity', () => {
      expect(isValidPrice(Infinity)).toBe(false)
      expect(isValidPrice(-Infinity)).toBe(false)
    })
  })

  describe('Time validation - isValidTime()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid HH:mm format (00:00-23:59)', () => {
      expect(isValidTime('00:00')).toBe(true)
      expect(isValidTime('12:00')).toBe(true)
      expect(isValidTime('23:59')).toBe(true)
    })

    test('accepts morning times', () => {
      expect(isValidTime('06:30')).toBe(true)
      expect(isValidTime('09:15')).toBe(true)
    })

    test('accepts afternoon/evening times', () => {
      expect(isValidTime('14:00')).toBe(true)
      expect(isValidTime('18:30')).toBe(true)
      expect(isValidTime('20:45')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS invalid hours (24+)', () => {
      expect(isValidTime('24:00')).toBe(false)
      expect(isValidTime('25:30')).toBe(false)
    })

    test('REJECTS invalid minutes (60+)', () => {
      expect(isValidTime('12:60')).toBe(false)
      expect(isValidTime('12:99')).toBe(false)
    })

    test('REJECTS single digit hours/minutes', () => {
      expect(isValidTime('9:30')).toBe(false) // Should be 09:30
      expect(isValidTime('12:5')).toBe(false) // Should be 12:05
    })

    test('REJECTS missing colon', () => {
      expect(isValidTime('1200')).toBe(false)
    })

    test('REJECTS wrong format', () => {
      expect(isValidTime('12:00:00')).toBe(false) // HH:mm:ss not allowed
      expect(isValidTime('12-00')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidTime('')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidTime(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidTime(undefined)).toBe(false)
    })
  })

  describe('Date validation - isValidDate()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid YYYY-MM-DD format', () => {
      expect(isValidDate('2024-01-15')).toBe(true)
      expect(isValidDate('2024-12-31')).toBe(true)
    })

    test('accepts leap year dates', () => {
      expect(isValidDate('2024-02-29')).toBe(true) // 2024 is leap year
    })

    test('accepts valid dates in different months', () => {
      expect(isValidDate('2024-01-01')).toBe(true)
      expect(isValidDate('2024-06-15')).toBe(true)
      expect(isValidDate('2024-12-25')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS invalid date values (Feb 30)', () => {
      expect(isValidDate('2024-02-30')).toBe(false)
    })

    test('REJECTS invalid date values (April 31)', () => {
      expect(isValidDate('2024-04-31')).toBe(false)
    })

    test('REJECTS Feb 29 on non-leap year', () => {
      expect(isValidDate('2023-02-29')).toBe(false) // 2023 is not leap year
    })

    test('REJECTS wrong format (DD-MM-YYYY)', () => {
      expect(isValidDate('15-01-2024')).toBe(false)
    })

    test('REJECTS wrong format (MM/DD/YYYY)', () => {
      expect(isValidDate('01/15/2024')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidDate('')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidDate(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidDate(undefined)).toBe(false)
    })
  })

  describe('Confirmation code validation - isValidConfirmationCode()', () => {
    // POSITIVE TESTS (60%)
    test('accepts valid 6-character alphanumeric codes', () => {
      expect(isValidConfirmationCode('ABC123')).toBe(true)
      expect(isValidConfirmationCode('XYZ789')).toBe(true)
      expect(isValidConfirmationCode('123456')).toBe(true)
    })

    test('accepts uppercase codes', () => {
      expect(isValidConfirmationCode('ABCDEF')).toBe(true)
      expect(isValidConfirmationCode('GHIJKL')).toBe(true)
    })

    test('accepts lowercase codes (case-insensitive)', () => {
      expect(isValidConfirmationCode('abcdef')).toBe(true)
      expect(isValidConfirmationCode('xyz123')).toBe(true)
    })

    test('accepts mixed case codes', () => {
      expect(isValidConfirmationCode('AbC123')).toBe(true)
      expect(isValidConfirmationCode('xYz789')).toBe(true)
    })

    // NEGATIVE TESTS (40%)
    test('REJECTS codes shorter than 6 characters', () => {
      expect(isValidConfirmationCode('ABC12')).toBe(false)
      expect(isValidConfirmationCode('A1')).toBe(false)
    })

    test('REJECTS codes longer than 6 characters', () => {
      expect(isValidConfirmationCode('ABC1234')).toBe(false)
      expect(isValidConfirmationCode('ABCDEFG')).toBe(false)
    })

    test('REJECTS codes with special characters', () => {
      expect(isValidConfirmationCode('ABC-12')).toBe(false)
      expect(isValidConfirmationCode('ABC_12')).toBe(false)
      expect(isValidConfirmationCode('ABC!23')).toBe(false)
    })

    test('REJECTS empty string', () => {
      expect(isValidConfirmationCode('')).toBe(false)
    })

    test('REJECTS non-string types', () => {
      // @ts-expect-error Testing runtime behavior
      expect(isValidConfirmationCode(null)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidConfirmationCode(undefined)).toBe(false)
      // @ts-expect-error Testing runtime behavior
      expect(isValidConfirmationCode(123456)).toBe(false)
    })
  })
})
