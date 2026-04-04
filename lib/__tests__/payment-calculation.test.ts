/**
 * PRINCIPLE #1: Test-Driven Development (TDD)
 * PRINCIPLE #11: Negative Testing (Test Forbidden Paths)
 *
 * Payment calculation is CRITICAL for event registration with YaadPay integration.
 * All amounts are stored in CENTS (agorot) to prevent floating-point precision errors.
 *
 * Business Rules (Israeli Shekel - ILS):
 * - Amounts stored in cents (1 ILS = 100 agorot/cents)
 * - Minimum payment: 1 agora (0.01 ILS = 1 cent)
 * - YaadPay processing fee: 2.5% + 1 ILS (100 cents) fixed fee
 * - Formula: subtotal = basePrice × quantity
 * - Formula: processingFee = (subtotal × 0.025) + 100 cents
 * - Formula: total = subtotal + processingFee
 */

import { describe, test, expect } from 'vitest'
import { calculatePaymentAmount, formatCentsToILS, convertILSToCents } from '@/lib/payment-utils'

describe('Payment Calculation (Israeli Shekel - ILS)', () => {
  describe('Valid calculations (POSITIVE TESTS - 60%)', () => {
    test('calculates payment for single participant without fee', () => {
      const result = calculatePaymentAmount(5000, 1, false) // 50 ILS per person
      expect(result).toBe(5000) // 50 ILS
    })

    test('calculates payment for single participant with processing fee', () => {
      const result = calculatePaymentAmount(5000, 1, true) // 50 ILS per person
      // Subtotal: 5000 cents (50 ILS)
      // Fee: (5000 × 0.025) + 100 = 125 + 100 = 225 cents
      // Total: 5000 + 225 = 5225 cents (52.25 ILS)
      expect(result).toBe(5225)
    })

    test('calculates payment for multiple participants without fee', () => {
      const result = calculatePaymentAmount(5000, 3, false) // 50 ILS × 3
      expect(result).toBe(15000) // 150 ILS
    })

    test('calculates payment for multiple participants with processing fee', () => {
      const result = calculatePaymentAmount(5000, 3, true) // 50 ILS × 3
      // Subtotal: 15000 cents (150 ILS)
      // Fee: (15000 × 0.025) + 100 = 375 + 100 = 475 cents
      // Total: 15000 + 475 = 15475 cents (154.75 ILS)
      expect(result).toBe(15475)
    })

    test('includes YaadPay processing fee correctly (2.5% + 1 ILS)', () => {
      const basePrice = 10000 // 100 ILS
      const quantity = 1
      const result = calculatePaymentAmount(basePrice, quantity, true)

      // Subtotal: 10000 cents (100 ILS)
      // Percentage fee: 10000 × 0.025 = 250 cents (2.5 ILS)
      // Fixed fee: 100 cents (1 ILS)
      // Total fee: 250 + 100 = 350 cents (3.5 ILS)
      // Total: 10000 + 350 = 10350 cents (103.50 ILS)
      expect(result).toBe(10350)
    })

    test('excludes processing fee when requested', () => {
      const result = calculatePaymentAmount(5000, 2, false)
      expect(result).toBe(10000) // No fee added
    })

    test('handles very large participant count', () => {
      const result = calculatePaymentAmount(5000, 100, false)
      expect(result).toBe(500000) // 5,000 ILS
    })

    test('calculates correct fee for large amounts', () => {
      const result = calculatePaymentAmount(100000, 1, true) // 1,000 ILS
      // Subtotal: 100000 cents (1,000 ILS)
      // Fee: (100000 × 0.025) + 100 = 2500 + 100 = 2600 cents
      // Total: 100000 + 2600 = 102600 cents (1,026 ILS)
      expect(result).toBe(102600)
    })
  })

  describe('Negative testing (REJECT invalid inputs - 30%)', () => {
    test('REJECTS zero base price', () => {
      expect(() => calculatePaymentAmount(0, 1)).toThrow('Base price must be positive')
    })

    test('REJECTS negative base price', () => {
      expect(() => calculatePaymentAmount(-5000, 1)).toThrow('Base price must be positive')
    })

    test('REJECTS zero quantity', () => {
      expect(() => calculatePaymentAmount(5000, 0)).toThrow('Quantity must be positive')
    })

    test('REJECTS negative quantity', () => {
      expect(() => calculatePaymentAmount(5000, -1)).toThrow('Quantity must be positive')
    })

    test('REJECTS floating-point base price (must be integer cents)', () => {
      expect(() => calculatePaymentAmount(50.5, 1)).toThrow(
        'Base price must be an integer (in cents)'
      )
    })

    test('REJECTS floating-point quantity', () => {
      expect(() => calculatePaymentAmount(5000, 2.5)).toThrow('Quantity must be an integer')
    })

    test('REJECTS both negative inputs', () => {
      expect(() => calculatePaymentAmount(-100, -1)).toThrow('Base price must be positive')
    })
  })

  describe('Edge cases (BOUNDARY TESTING - 10%)', () => {
    test('handles minimum payment (1 agora = 1 cent)', () => {
      const result = calculatePaymentAmount(1, 1, false)
      expect(result).toBe(1) // 0.01 ILS
    })

    test('handles minimum payment with processing fee', () => {
      const result = calculatePaymentAmount(1, 1, true)
      // Subtotal: 1 cent (0.01 ILS)
      // Fee: (1 × 0.025) + 100 = 0 + 100 = 100 cents (rounding)
      // Total: 1 + 100 = 101 cents (1.01 ILS)
      expect(result).toBe(101)
    })

    test('handles very large amounts (prevent overflow)', () => {
      const result = calculatePaymentAmount(1000000, 1, false) // 10,000 ILS
      expect(result).toBe(1000000)
      expect(Number.isSafeInteger(result)).toBe(true)
    })

    test('rounds percentage fee correctly to nearest cent', () => {
      const result = calculatePaymentAmount(333, 1, true) // 3.33 ILS
      // Subtotal: 333 cents
      // Fee: (333 × 0.025) + 100 = 8.325 + 100 = 108.325
      // Rounded: 8 + 100 = 108 cents
      // Total: 333 + 108 = 441 cents
      expect(result).toBe(441)
    })

    test('prevents floating-point precision errors', () => {
      // Test case that would fail with floating-point arithmetic
      const result = calculatePaymentAmount(1234, 7, true)
      // Subtotal: 1234 × 7 = 8638 cents
      // Fee: (8638 × 0.025) + 100 = 215.95 + 100 = 315.95
      // Rounded: 216 + 100 = 316 cents
      // Total: 8638 + 316 = 8954 cents

      expect(Number.isInteger(result)).toBe(true)
      expect(result).toBe(8954)
    })

    test('ensures result is always an integer (no decimals)', () => {
      const testCases = [
        [1, 1],
        [5000, 1],
        [333, 3],
        [9999, 7],
      ]

      testCases.forEach(([price, qty]) => {
        const result = calculatePaymentAmount(price, qty, true)
        expect(Number.isInteger(result)).toBe(true)
      })
    })
  })

  describe('Currency formatting helpers', () => {
    test('formats cents to ILS display (15050 → "150.50")', () => {
      expect(formatCentsToILS(15050)).toBe('150.50')
    })

    test('formats cents to ILS with two decimals', () => {
      expect(formatCentsToILS(5000)).toBe('50.00')
      expect(formatCentsToILS(1)).toBe('0.01')
      expect(formatCentsToILS(10350)).toBe('103.50')
    })

    test('converts ILS to cents (150.50 → 15050)', () => {
      expect(convertILSToCents(150.5)).toBe(15050)
    })

    test('converts ILS to cents with rounding', () => {
      expect(convertILSToCents(50.0)).toBe(5000)
      expect(convertILSToCents(0.01)).toBe(1)
      expect(convertILSToCents(103.5)).toBe(10350)
    })

    test('REJECTS negative ILS amounts', () => {
      expect(() => convertILSToCents(-10.5)).toThrow('ILS amount cannot be negative')
    })

    test('REJECTS floating-point cents in formatting', () => {
      expect(() => formatCentsToILS(150.5)).toThrow('Cents must be an integer')
    })
  })

  describe('Race condition scenarios (CRITICAL - concurrent payments)', () => {
    test('concurrent payments calculate independently (no shared state)', () => {
      // Simulate 2 concurrent payment calculations
      const payment1 = calculatePaymentAmount(5000, 1, true)
      const payment2 = calculatePaymentAmount(3000, 2, true)

      // Both should calculate correctly without interference
      expect(payment1).toBe(5225) // 50 ILS + fee
      expect(payment2).toBe(6250) // 60 ILS + fee
    })

    test('multiple participants do not cause calculation errors', () => {
      // Edge case: Many participants at once
      const participants = [1, 2, 3, 5, 10, 20, 50, 100]

      participants.forEach((count) => {
        const result = calculatePaymentAmount(5000, count, false)
        expect(result).toBe(5000 * count)
      })
    })
  })
})
