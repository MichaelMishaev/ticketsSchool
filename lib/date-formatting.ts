/**
 * Hebrew Date/Time Formatting Utilities
 *
 * Provides consistent date/time formatting for the Israeli event system
 * with Hebrew locale (he-IL) and Israel timezone (IST/IDT).
 */

/**
 * Format date in full Hebrew format
 * Example: "יום שישי, 15 בינואר 2026"
 */
export function formatDateHebrew(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jerusalem',
  }).format(date)
}

/**
 * Get relative time in Hebrew
 * Examples:
 * - "היום" (today)
 * - "מחר" (tomorrow)
 * - "אתמול" (yesterday)
 * - "עוד 3 ימים" (in 3 days)
 * - "לפני 5 ימים" (5 days ago)
 */
export function getRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = date.getTime() - now.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'היום' // Today
  if (diffDays === 1) return 'מחר' // Tomorrow
  if (diffDays === -1) return 'אתמול' // Yesterday
  if (diffDays > 0) return `עוד ${diffDays} ימים` // In X days
  return `לפני ${Math.abs(diffDays)} ימים` // X days ago
}

/**
 * Format registration timestamp
 * Israeli format: DD/MM/YYYY HH:mm (24-hour)
 * Example: "12/01/2026 14:30"
 */
export function formatRegistrationTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem',
  }).format(date)
}

/**
 * Format event time (24-hour format)
 * Example: "20:00"
 */
export function formatEventTime(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jerusalem',
  }).format(date)
}

/**
 * Format date range in Hebrew
 * Examples:
 * - Same month: "15-17 בינואר"
 * - Different months: "30 בינואר - 2 בפברואר"
 * - Different years: "30 בדצמבר 2025 - 2 בינואר 2026"
 */
export function formatDateRange(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear()
  const endYear = endDate.getFullYear()
  const startMonth = startDate.getMonth()
  const endMonth = endDate.getMonth()

  const startDay = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    timeZone: 'Asia/Jerusalem',
  }).format(startDate)

  const endDay = new Intl.DateTimeFormat('he-IL', {
    day: 'numeric',
    timeZone: 'Asia/Jerusalem',
  }).format(endDate)

  const startMonthName = new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    timeZone: 'Asia/Jerusalem',
  }).format(startDate)

  const endMonthName = new Intl.DateTimeFormat('he-IL', {
    month: 'long',
    timeZone: 'Asia/Jerusalem',
  }).format(endDate)

  // Same year and month
  if (startYear === endYear && startMonth === endMonth) {
    return `${startDay}-${endDay} ב${startMonthName}`
  }

  // Same year, different months
  if (startYear === endYear) {
    return `${startDay} ב${startMonthName} - ${endDay} ב${endMonthName}`
  }

  // Different years
  return `${startDay} ב${startMonthName} ${startYear} - ${endDay} ב${endMonthName} ${endYear}`
}

/**
 * Format date for display in event cards/lists
 * Combines weekday and full date
 * Example: "יום שישי, 15.01.2026"
 */
export function formatEventDate(date: Date): string {
  return new Intl.DateTimeFormat('he-IL', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Jerusalem',
  }).format(date)
}
