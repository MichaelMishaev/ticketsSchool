import { Page } from '@playwright/test'

/**
 * Wait for element with Hebrew or English text
 */
export async function waitForText(
  page: Page,
  text: string | RegExp,
  timeout = 5000
): Promise<void> {
  await page.waitForSelector(`text=${text instanceof RegExp ? text : text}`, { timeout })
}

/**
 * Fill Israeli phone number
 */
export function normalizeIsraeliPhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error(`Invalid Israeli phone number: ${phone}`)
  }

  return normalized
}

/**
 * Generate random Israeli phone
 */
export function generateIsraeliPhone(): string {
  const prefix = '050' // Common Israeli mobile prefix
  const suffix = Math.floor(Math.random() * 10000000).toString().padStart(7, '0')
  return prefix + suffix
}

/**
 * Generate unique email
 */
export function generateEmail(prefix = 'test'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}@test.com`
}

/**
 * Generate future date (for events)
 */
export function getFutureDate(daysAhead = 7): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString().split('T')[0]
}

/**
 * Generate past date
 */
export function getPastDate(daysAgo = 7): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString().split('T')[0]
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  timeout = 10000
): Promise<unknown> {
  const response = await page.waitForResponse(
    (response) => {
      const url = response.url()
      if (typeof urlPattern === 'string') {
        return url.includes(urlPattern)
      }
      return urlPattern.test(url)
    },
    { timeout }
  )

  return await response.json()
}

/**
 * Check mobile viewport
 */
export function isMobileViewport(page: Page): boolean {
  const viewport = page.viewportSize()
  return viewport ? viewport.width < 768 : false
}

/**
 * Take screenshot with timestamp
 */
export async function takeTimestampedScreenshot(
  page: Page,
  name: string
): Promise<void> {
  const timestamp = Date.now()
  await page.screenshot({ path: `screenshots/${name}-${timestamp}.png` })
}

/**
 * Wait for loading to finish
 */
export async function waitForLoadingToFinish(page: Page, timeout = 5000): Promise<void> {
  try {
    await page.waitForSelector('.loading, [data-loading="true"], .spinner', {
      state: 'detached',
      timeout,
    })
  } catch {
    // Loading indicator might not appear, that's ok
  }
}

/**
 * Scroll element into view
 */
export async function scrollIntoView(page: Page, selector: string): Promise<void> {
  await page.locator(selector).scrollIntoViewIfNeeded()
}

/**
 * Get text content safely
 */
export async function getTextContent(page: Page, selector: string): Promise<string> {
  const element = page.locator(selector).first()
  return (await element.textContent()) || ''
}

/**
 * Check if element exists
 */
export async function elementExists(page: Page, selector: string): Promise<boolean> {
  const count = await page.locator(selector).count()
  return count > 0
}

/**
 * Wait for navigation
 */
export async function waitForNavigation(
  page: Page,
  action: () => Promise<void>,
  timeout = 10000
): Promise<void> {
  await Promise.all([
    page.waitForNavigation({ timeout }),
    action(),
  ])
}

/**
 * Retry action multiple times
 */
export async function retryAction<T>(
  action: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await action()
    } catch (error) {
      if (i === retries - 1) throw error
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  throw new Error('Retry failed')
}

/**
 * Generate confirmation code format
 */
export function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

/**
 * Parse capacity text (e.g., "25 / 50")
 */
export function parseCapacityText(text: string): { reserved: number; total: number } {
  const match = text.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) throw new Error(`Cannot parse capacity: ${text}`)

  return {
    reserved: parseInt(match[1], 10),
    total: parseInt(match[2], 10),
  }
}

/**
 * Wait for element to be stable (not moving)
 */
export async function waitForStable(page: Page, selector: string, timeout = 3000): Promise<void> {
  const element = page.locator(selector)
  await element.waitFor({ state: 'visible', timeout })

  // Wait for animations to finish
  await page.waitForTimeout(300)
}

/**
 * Clear input field completely
 */
export async function clearInput(page: Page, selector: string): Promise<void> {
  await page.locator(selector).clear()
  await page.locator(selector).fill('')
}

/**
 * Type with delay (simulates human typing)
 */
export async function typeSlowly(page: Page, selector: string, text: string, delay = 50): Promise<void> {
  await page.locator(selector).type(text, { delay })
}

/**
 * Generate unique school name with timestamp
 */
export function generateSchoolName(prefix = 'Test School'): string {
  return `${prefix} ${Date.now()}-${Math.random().toString(36).substring(7)}`
}
