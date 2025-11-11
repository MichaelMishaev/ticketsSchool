/**
 * Event Helper Functions
 * Utilities for creating and managing events in tests
 */

import { Page, expect } from '@playwright/test'
import { getFutureDate } from './test-data'

/**
 * Create event via UI
 */
export async function createEventViaUI(
  page: Page,
  eventData: {
    title: string
    description?: string
    location: string
    capacity: number
    startAt?: string
    endAt?: string
    maxSpotsPerPerson?: number
  }
): Promise<string> {
  await page.goto('/admin/events/new')

  // Step 1: Details
  await page.fill('input[name="title"]', eventData.title)
  if (eventData.description) {
    await page.fill('textarea[name="description"]', eventData.description)
  }
  await page.fill('input[name="location"]', eventData.location)
  await page.click('button:has-text("הבא")')

  // Step 2: Timing
  const startDate = eventData.startAt || getFutureDate(7)
  await page.fill('input[type="datetime-local"]', startDate.split('T')[0] + 'T16:00')
  await page.click('button:has-text("הבא")')

  // Step 3: Capacity
  await page.fill('input[name="capacity"]', eventData.capacity.toString())
  if (eventData.maxSpotsPerPerson) {
    await page.fill('input[name="maxSpotsPerPerson"]', eventData.maxSpotsPerPerson.toString())
  }
  await page.click('button:has-text("הבא")')

  // Step 4: Advanced (skip custom fields for now)
  await page.click('button:has-text("צור אירוע")')

  // Wait for success and get event slug from URL
  await expect(page.locator('text=האירוע נוצר בהצלחה')).toBeVisible({ timeout: 10000 })

  // Extract slug from success modal or redirect
  const eventSlug = await extractEventSlugFromPage(page)
  return eventSlug
}

/**
 * Create event via API (faster for setup)
 */
export async function createEventViaAPI(
  page: Page,
  eventData: {
    title: string
    description?: string
    location: string
    capacity: number
    startAt?: string
    maxSpotsPerPerson?: number
  }
): Promise<any> {
  const response = await page.request.post('/api/events', {
    data: {
      ...eventData,
      startAt: eventData.startAt || getFutureDate(7),
      endAt: null,
      gameType: 'Test',
      fieldsSchema: [
        { name: 'fullName', label: 'שם מלא', type: 'text', required: true },
        { name: 'phone', label: 'טלפון', type: 'text', required: true },
      ],
      conditions: '',
      requireAcceptance: false,
      completionMessage: '',
    },
  })

  expect(response.ok()).toBeTruthy()
  const event = await response.json()
  return event
}

/**
 * Register for event via public form
 */
export async function registerForEvent(
  page: Page,
  schoolSlug: string,
  eventSlug: string,
  registrationData: {
    fullName: string
    phone: string
    [key: string]: any
  },
  spotsCount: number = 1
): Promise<string> {
  await page.goto(`/p/${schoolSlug}/${eventSlug}`)

  // Fill form fields
  await page.fill('input[name="fullName"]', registrationData.fullName)
  await page.fill('input[name="phone"]', registrationData.phone)

  // Fill any additional fields
  for (const [key, value] of Object.entries(registrationData)) {
    if (key !== 'fullName' && key !== 'phone') {
      await page.fill(`input[name="${key}"], textarea[name="${key}"], select[name="${key}"]`, value)
    }
  }

  // Set spots count if different from 1
  if (spotsCount > 1) {
    await page.fill('input[type="number"]', spotsCount.toString())
  }

  // Accept terms if required
  const termsCheckbox = page.locator('input[type="checkbox"]')
  if (await termsCheckbox.isVisible()) {
    await termsCheckbox.check()
  }

  // Submit
  await page.click('button:has-text("שלח הרשמה")')

  // Wait for success and extract confirmation code
  await expect(page.locator('text=קוד אישור')).toBeVisible({ timeout: 10000 })
  const confirmationCode = await page.locator('text=/[A-Z0-9]{6,10}/').textContent()

  return confirmationCode || ''
}

/**
 * Get event details via API
 */
export async function getEventDetails(
  page: Page,
  eventId: string
): Promise<any> {
  const response = await page.request.get(`/api/events/${eventId}`)
  expect(response.ok()).toBeTruthy()
  return await response.json()
}

/**
 * Change event status
 */
export async function changeEventStatus(
  page: Page,
  eventId: string,
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
): Promise<void> {
  const response = await page.request.patch(`/api/events/${eventId}`, {
    data: { status },
  })
  expect(response.ok()).toBeTruthy()
}

/**
 * Delete registration
 */
export async function deleteRegistration(
  page: Page,
  eventId: string,
  registrationId: string
): Promise<void> {
  const response = await page.request.delete(
    `/api/events/${eventId}/registrations/${registrationId}`
  )
  expect(response.ok()).toBeTruthy()
}

/**
 * Promote waitlist registration to confirmed
 */
export async function promoteFromWaitlist(
  page: Page,
  eventId: string,
  registrationId: string
): Promise<void> {
  const response = await page.request.patch(
    `/api/events/${eventId}/registrations/${registrationId}`,
    {
      data: { status: 'CONFIRMED' },
    }
  )
  expect(response.ok()).toBeTruthy()
}

/**
 * Extract event slug from page (after creation)
 */
async function extractEventSlugFromPage(page: Page): Promise<string> {
  // Try to get slug from URL preview in success modal
  const slugElement = page.locator('text=/p\\/[^/]+\\/([^/\\s]+)/')
  if (await slugElement.isVisible()) {
    const text = await slugElement.textContent()
    const match = text?.match(/p\/[^/]+\/([^/\s]+)/)
    if (match) return match[1]
  }

  // Fallback: wait for navigation to event management page
  await page.waitForURL(/\/admin\/events\/[^/]+/, { timeout: 5000 })
  const eventId = page.url().split('/').pop()

  // Get event details to find slug
  const event = await getEventDetails(page, eventId!)
  return event.slug
}

/**
 * Verify event capacity indicator
 */
export async function verifyCapacityIndicator(
  page: Page,
  spotsTaken: number,
  totalCapacity: number
): Promise<void> {
  const capacityText = await page.locator('text=/\\d+\\/\\d+/').textContent()
  expect(capacityText).toContain(`${spotsTaken}/${totalCapacity}`)
}

/**
 * Verify registration in admin panel
 */
export async function verifyRegistrationInAdmin(
  page: Page,
  eventId: string,
  confirmationCode: string
): Promise<void> {
  await page.goto(`/admin/events/${eventId}`)

  // Search for confirmation code
  await page.fill('input[placeholder*="חיפוש"]', confirmationCode)

  // Should find the registration
  await expect(page.locator(`text=${confirmationCode}`)).toBeVisible()
}
