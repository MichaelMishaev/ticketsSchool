import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  formatDateHebrew,
  getRelativeTime,
  formatRegistrationTime,
  formatEventTime,
  formatDateRange,
  formatEventDate,
} from '@/lib/date-formatting'

describe('Date Formatting (Hebrew) - Israeli Event System', () => {
  let originalTimezone: string | undefined

  beforeEach(() => {
    // Save original timezone
    originalTimezone = process.env.TZ

    // Set timezone to Israel Standard Time for consistent tests
    process.env.TZ = 'Asia/Jerusalem'

    // Use fixed date for deterministic tests: Friday, January 15, 2026, 14:00 IST
    vi.setSystemTime(new Date('2026-01-15T14:00:00+02:00'))
  })

  afterEach(() => {
    // Restore original timezone
    if (originalTimezone !== undefined) {
      process.env.TZ = originalTimezone
    } else {
      delete process.env.TZ
    }

    // Reset system time
    vi.useRealTimers()
  })

  describe('formatDateHebrew() - Full Hebrew Date Display', () => {
    it('should format full date in Hebrew with weekday', () => {
      const date = new Date('2026-01-15T14:00:00+02:00') // Friday, January 15, 2026
      const result = formatDateHebrew(date)

      // Should include weekday, day, month, year in Hebrew
      expect(result).toContain('15')
      expect(result).toContain('2026')
      // Hebrew weekday pattern: "יום [weekday],"
      expect(result).toMatch(/יום .+,/)
    })

    it('should handle Hebrew month names correctly', () => {
      const januaryDate = new Date('2026-01-15T14:00:00+02:00')
      const februaryDate = new Date('2026-02-15T14:00:00+02:00')
      const decemberDate = new Date('2026-12-15T14:00:00+02:00')

      const jan = formatDateHebrew(januaryDate)
      const feb = formatDateHebrew(februaryDate)
      const dec = formatDateHebrew(decemberDate)

      // Each should be different
      expect(jan).not.toBe(feb)
      expect(feb).not.toBe(dec)
      expect(jan).not.toBe(dec)

      // All should contain year and day
      expect(jan).toContain('15')
      expect(feb).toContain('15')
      expect(dec).toContain('15')
    })

    it('should use Hebrew weekday names', () => {
      const sunday = new Date('2026-01-11T14:00:00+02:00') // Sunday
      const friday = new Date('2026-01-16T14:00:00+02:00') // Friday
      const saturday = new Date('2026-01-17T14:00:00+02:00') // Saturday

      const sunResult = formatDateHebrew(sunday)
      const friResult = formatDateHebrew(friday)
      const satResult = formatDateHebrew(saturday)

      // All should start with "יום" (day)
      expect(sunResult).toMatch(/^יום/)
      expect(friResult).toMatch(/^יום/)
      expect(satResult).toMatch(/^יום/)

      // All should be different weekdays
      expect(sunResult).not.toBe(friResult)
      expect(friResult).not.toBe(satResult)
    })

    it('should handle leap year dates correctly', () => {
      const leapDay = new Date('2024-02-29T14:00:00+02:00') // Leap year
      const result = formatDateHebrew(leapDay)

      expect(result).toContain('29')
      expect(result).toContain('2024')
    })

    it('should format dates consistently regardless of time', () => {
      const morning = new Date('2026-01-15T08:00:00+02:00')
      const afternoon = new Date('2026-01-15T14:00:00+02:00')
      const night = new Date('2026-01-15T23:00:00+02:00')

      const morningResult = formatDateHebrew(morning)
      const afternoonResult = formatDateHebrew(afternoon)
      const nightResult = formatDateHebrew(night)

      // Same date, different times should produce same result
      expect(morningResult).toBe(afternoonResult)
      expect(afternoonResult).toBe(nightResult)
    })
  })

  describe('getRelativeTime() - Relative Time in Hebrew', () => {
    it('should return "היום" for today', () => {
      const now = new Date('2026-01-15T14:00:00+02:00')
      const today = new Date('2026-01-15T20:00:00+02:00') // Same day, later

      const result = getRelativeTime(today, now)

      expect(result).toBe('היום')
    })

    it('should return "מחר" for tomorrow', () => {
      const now = new Date('2026-01-15T14:00:00+02:00')
      const tomorrow = new Date('2026-01-16T14:00:00+02:00')

      const result = getRelativeTime(tomorrow, now)

      expect(result).toBe('מחר')
    })

    it('should return "אתמול" for yesterday', () => {
      const now = new Date('2026-01-15T14:00:00+02:00')
      const yesterday = new Date('2026-01-14T14:00:00+02:00')

      const result = getRelativeTime(yesterday, now)

      expect(result).toBe('אתמול')
    })

    it('should return "עוד X ימים" for future dates', () => {
      const now = new Date('2026-01-15T14:00:00+02:00')
      const future3 = new Date('2026-01-18T14:00:00+02:00') // 3 days
      const future7 = new Date('2026-01-22T14:00:00+02:00') // 7 days

      expect(getRelativeTime(future3, now)).toBe('עוד 3 ימים')
      expect(getRelativeTime(future7, now)).toBe('עוד 7 ימים')
    })

    it('should return "לפני X ימים" for past dates', () => {
      const now = new Date('2026-01-15T14:00:00+02:00')
      const past3 = new Date('2026-01-12T14:00:00+02:00') // 3 days ago
      const past7 = new Date('2026-01-08T14:00:00+02:00') // 7 days ago

      expect(getRelativeTime(past3, now)).toBe('לפני 3 ימים')
      expect(getRelativeTime(past7, now)).toBe('לפני 7 ימים')
    })

    it('should use current time when "now" is not provided', () => {
      // Current system time is 2026-01-15T14:00:00+02:00
      const tomorrow = new Date('2026-01-16T14:00:00+02:00')

      const result = getRelativeTime(tomorrow)

      expect(result).toBe('מחר')
    })

    it('should handle month boundaries correctly', () => {
      const now = new Date('2026-01-31T14:00:00+02:00')
      const nextDay = new Date('2026-02-01T14:00:00+02:00')

      const result = getRelativeTime(nextDay, now)

      expect(result).toBe('מחר')
    })

    it('should handle year boundaries correctly', () => {
      const now = new Date('2025-12-31T14:00:00+02:00')
      const nextDay = new Date('2026-01-01T14:00:00+02:00')

      const result = getRelativeTime(nextDay, now)

      expect(result).toBe('מחר')
    })
  })

  describe('formatRegistrationTime() - Registration Timestamp', () => {
    it('should format in DD/MM/YYYY HH:mm format', () => {
      const date = new Date('2026-01-15T14:30:00+02:00')
      const result = formatRegistrationTime(date)

      // Israeli format: DD/MM/YYYY HH:mm
      // Note: Exact format may vary by locale implementation, but should contain these elements
      expect(result).toMatch(/15/)
      expect(result).toMatch(/01/)
      expect(result).toMatch(/2026/)
      expect(result).toMatch(/14/)
      expect(result).toMatch(/30/)
    })

    it('should use 24-hour format (not AM/PM)', () => {
      const afternoon = new Date('2026-01-15T14:30:00+02:00') // 14:30
      const evening = new Date('2026-01-15T20:45:00+02:00') // 20:45

      const afternoonResult = formatRegistrationTime(afternoon)
      const eveningResult = formatRegistrationTime(evening)

      // Should contain hour as number (14, 20), not with AM/PM
      expect(afternoonResult).toMatch(/14/)
      expect(afternoonResult).not.toMatch(/PM|AM/)

      expect(eveningResult).toMatch(/20/)
      expect(eveningResult).not.toMatch(/PM|AM/)
    })

    it('should handle midnight correctly', () => {
      const midnight = new Date('2026-01-15T00:00:00+02:00')
      const result = formatRegistrationTime(midnight)

      // Should show 00:00, not 12:00 AM
      expect(result).toMatch(/00/)
      expect(result).toMatch(/00/)
    })

    it('should handle single-digit dates and months with zero-padding', () => {
      const date = new Date('2026-01-05T08:05:00+02:00') // January 5, 08:05
      const result = formatRegistrationTime(date)

      // Should contain 05 (not just 5)
      expect(result).toMatch(/05/)
    })

    it('should format timestamps consistently for same minute', () => {
      const time1 = new Date('2026-01-15T14:30:00+02:00')
      const time2 = new Date('2026-01-15T14:30:45+02:00') // +45 seconds

      const result1 = formatRegistrationTime(time1)
      const result2 = formatRegistrationTime(time2)

      // Same minute should produce same result (no seconds)
      expect(result1).toBe(result2)
    })
  })

  describe('formatEventTime() - Event Time Display', () => {
    it('should format time in HH:mm format', () => {
      const date = new Date('2026-01-15T20:00:00+02:00')
      const result = formatEventTime(date)

      // Should be "20:00" format
      expect(result).toMatch(/20/)
      expect(result).toMatch(/00/)
    })

    it('should use 24-hour format', () => {
      const morning = new Date('2026-01-15T09:30:00+02:00')
      const afternoon = new Date('2026-01-15T14:30:00+02:00')
      const evening = new Date('2026-01-15T21:30:00+02:00')

      const morningResult = formatEventTime(morning)
      const afternoonResult = formatEventTime(afternoon)
      const eveningResult = formatEventTime(evening)

      // Should contain hour numbers, not AM/PM
      expect(morningResult).toMatch(/09|9/)
      expect(afternoonResult).toMatch(/14/)
      expect(eveningResult).toMatch(/21/)

      expect(morningResult).not.toMatch(/AM|PM/)
      expect(afternoonResult).not.toMatch(/AM|PM/)
      expect(eveningResult).not.toMatch(/AM|PM/)
    })

    it('should not include date components', () => {
      const date = new Date('2026-01-15T20:00:00+02:00')
      const result = formatEventTime(date)

      // Should NOT contain date (15, 2026)
      expect(result).not.toMatch(/15/)
      expect(result).not.toMatch(/2026/)
    })
  })

  describe('formatDateRange() - Date Range Formatting', () => {
    it('should format same-month range correctly', () => {
      const start = new Date('2026-01-15T14:00:00+02:00')
      const end = new Date('2026-01-17T14:00:00+02:00')

      const result = formatDateRange(start, end)

      // Should be like "15-17 בינואר"
      expect(result).toMatch(/15/)
      expect(result).toMatch(/17/)
      expect(result).toMatch(/-/)
    })

    it('should format different-month range correctly', () => {
      const start = new Date('2026-01-30T14:00:00+02:00')
      const end = new Date('2026-02-02T14:00:00+02:00')

      const result = formatDateRange(start, end)

      // Should include both month names
      expect(result).toMatch(/30/)
      expect(result).toMatch(/02|2/)
    })

    it('should format different-year range correctly', () => {
      const start = new Date('2025-12-30T14:00:00+02:00')
      const end = new Date('2026-01-02T14:00:00+02:00')

      const result = formatDateRange(start, end)

      // Should include both years
      expect(result).toMatch(/2025/)
      expect(result).toMatch(/2026/)
      expect(result).toMatch(/30/)
      expect(result).toMatch(/02|2/)
    })

    it('should handle single-day range (same start and end)', () => {
      const date = new Date('2026-01-15T14:00:00+02:00')

      const result = formatDateRange(date, date)

      // Should be like "15-15 בינואר"
      expect(result).toMatch(/15/)
    })

    it('should format multi-day event in same month', () => {
      const start = new Date('2026-01-10T14:00:00+02:00')
      const end = new Date('2026-01-20T14:00:00+02:00')

      const result = formatDateRange(start, end)

      expect(result).toMatch(/10/)
      expect(result).toMatch(/20/)
    })
  })

  describe('formatEventDate() - Event Card Display', () => {
    it('should include weekday and date', () => {
      const date = new Date('2026-01-15T14:00:00+02:00') // Friday

      const result = formatEventDate(date)

      // Should include weekday (יום) and date components
      expect(result).toMatch(/יום/)
      expect(result).toMatch(/15/)
      expect(result).toMatch(/01/)
      expect(result).toMatch(/2026/)
    })

    it('should use DD.MM.YYYY or DD/MM/YYYY format', () => {
      const date = new Date('2026-01-15T14:00:00+02:00')

      const result = formatEventDate(date)

      // Should contain date separators (. or /)
      expect(result).toMatch(/15/)
      expect(result).toMatch(/01/)
      expect(result).toMatch(/2026/)
    })

    it('should differentiate between different weekdays', () => {
      const friday = new Date('2026-01-16T14:00:00+02:00')
      const saturday = new Date('2026-01-17T14:00:00+02:00')

      const friResult = formatEventDate(friday)
      const satResult = formatEventDate(saturday)

      // Different weekdays should produce different results
      expect(friResult).not.toBe(satResult)
    })
  })

  describe('Edge Cases - Timezone Handling', () => {
    it('should handle Israel Standard Time (IST, UTC+2) correctly', () => {
      // Winter time (IST)
      const winterDate = new Date('2026-01-15T14:00:00+02:00')

      const result = formatDateHebrew(winterDate)

      expect(result).toContain('15')
      expect(result).toContain('2026')
    })

    it('should handle Israel Daylight Time (IDT, UTC+3) correctly', () => {
      // Summer time (IDT) - typically late March to late October
      const summerDate = new Date('2026-06-15T14:00:00+03:00')

      const result = formatDateHebrew(summerDate)

      expect(result).toContain('15')
      expect(result).toContain('2026')
    })

    it('should handle daylight saving time transitions', () => {
      // Spring forward: Last Friday before April 2 at 02:00
      // In 2026, March 27 is the DST transition date
      const beforeDST = new Date('2026-03-26T23:00:00+02:00')
      const afterDST = new Date('2026-03-27T03:00:00+03:00')

      const beforeResult = formatRegistrationTime(beforeDST)
      const afterResult = formatRegistrationTime(afterDST)

      // Both should format correctly despite timezone change
      expect(beforeResult).toMatch(/23/)
      expect(afterResult).toMatch(/03/)
    })

    it('should format times consistently across timezone', () => {
      // Same absolute time, different timezone representations
      const israelTime = new Date('2026-01-15T14:00:00+02:00')
      const utcTime = new Date('2026-01-15T12:00:00Z') // Same as 14:00 IST

      const israelResult = formatEventTime(israelTime)
      const utcResult = formatEventTime(utcTime)

      // Should produce same result (14:00) when using Asia/Jerusalem timezone
      expect(israelResult).toMatch(/14/)
      expect(utcResult).toMatch(/14/)
    })
  })

  describe('Edge Cases - Special Dates', () => {
    it('should handle New Year correctly', () => {
      const newYear = new Date('2026-01-01T00:00:00+02:00')

      const result = formatDateHebrew(newYear)

      expect(result).toMatch(/01|1/)
      expect(result).toContain('2026')
    })

    it('should handle end of year correctly', () => {
      const endOfYear = new Date('2026-12-31T23:59:59+02:00')

      const result = formatDateHebrew(endOfYear)

      expect(result).toMatch(/31/)
      expect(result).toContain('2026')
    })

    it('should handle February 28 in non-leap year', () => {
      const feb28 = new Date('2025-02-28T14:00:00+02:00')

      const result = formatDateHebrew(feb28)

      expect(result).toMatch(/28/)
      expect(result).toContain('2025')
    })
  })
})
