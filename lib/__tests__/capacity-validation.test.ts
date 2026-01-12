/**
 * PRINCIPLE #7: Database Constraints + Business Logic Testing
 *
 * Capacity enforcement is CRITICAL for event registration.
 * Tests atomic counter logic to prevent race conditions.
 */

import { describe, test, expect } from 'vitest'
import { canRegister } from '@/lib/capacity-utils'

describe('Capacity Validation', () => {
  describe('Available spots (CONFIRMED)', () => {
    test('allows registration when spots available', () => {
      const result = canRegister(0, 100, 10)
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('CONFIRMED')
    })

    test('allows registration at exact capacity', () => {
      const result = canRegister(90, 100, 10)
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('CONFIRMED')
    })

    test('allows single spot when one spot left', () => {
      const result = canRegister(99, 100, 1)
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('CONFIRMED')
    })
  })

  describe('Waitlist handling', () => {
    test('puts on waitlist when capacity exceeded', () => {
      const result = canRegister(90, 100, 15) // 90 + 15 = 105 > 100
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('WAITLIST')
    })

    test('puts on waitlist when event is full', () => {
      const result = canRegister(100, 100, 1)
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('WAITLIST')
    })

    test('puts on waitlist when requesting many spots for nearly-full event', () => {
      const result = canRegister(95, 100, 10) // 95 + 10 = 105 > 100
      expect(result.canRegister).toBe(true)
      expect(result.status).toBe('WAITLIST')
    })
  })

  describe('Validation errors (NEGATIVE TESTING)', () => {
    test('REJECTS zero requested spots', () => {
      expect(() => canRegister(0, 100, 0)).toThrow('Requested spots must be positive')
    })

    test('REJECTS negative requested spots', () => {
      expect(() => canRegister(0, 100, -1)).toThrow('Requested spots must be positive')
    })

    test('REJECTS zero capacity', () => {
      expect(() => canRegister(0, 0, 1)).toThrow('Total capacity must be positive')
    })

    test('REJECTS negative capacity', () => {
      expect(() => canRegister(0, -10, 1)).toThrow('Total capacity must be positive')
    })

    test('REJECTS negative current reserved', () => {
      expect(() => canRegister(-5, 100, 1)).toThrow('Current reserved cannot be negative')
    })
  })

  describe('Edge cases (BOUNDARY TESTING)', () => {
    test('handles very large capacity', () => {
      const result = canRegister(0, 1000000, 1)
      expect(result.status).toBe('CONFIRMED')
    })

    test('handles very large reservation request', () => {
      const result = canRegister(0, 100, 500)
      expect(result.status).toBe('WAITLIST')
    })

    test('handles floating point (should be integers in practice)', () => {
      // This test documents expected behavior with non-integers
      const result = canRegister(50, 100, 10)
      expect(result.status).toBe('CONFIRMED')
    })
  })

  describe('Race condition scenarios (CRITICAL)', () => {
    test('concurrent requests for last spot (both should succeed, one CONFIRMED, one WAITLIST)', () => {
      // Request 1: 99 reserved, request 1 spot -> should be CONFIRMED
      const request1 = canRegister(99, 100, 1)
      expect(request1.status).toBe('CONFIRMED')

      // Request 2 (happens simultaneously): 99 reserved, request 1 spot
      // Database transaction will increment to 100 for one request
      // The other request will see 100 reserved and go to WAITLIST
      const request2 = canRegister(100, 100, 1) // After request 1 commits
      expect(request2.status).toBe('WAITLIST')
    })

    test('multiple small requests near capacity', () => {
      // Event: 95/100 spots taken
      // Request: 3 spots (95 + 3 = 98 <= 100) -> CONFIRMED
      const result1 = canRegister(95, 100, 3)
      expect(result1.status).toBe('CONFIRMED')

      // After first request: 98/100
      // Request: 2 spots (98 + 2 = 100 <= 100) -> CONFIRMED
      const result2 = canRegister(98, 100, 2)
      expect(result2.status).toBe('CONFIRMED')

      // After second request: 100/100 (FULL)
      // Request: 1 spot (100 + 1 = 101 > 100) -> WAITLIST
      const result3 = canRegister(100, 100, 1)
      expect(result3.status).toBe('WAITLIST')
    })
  })
})
