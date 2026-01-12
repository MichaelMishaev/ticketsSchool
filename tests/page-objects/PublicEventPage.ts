import { Page, expect } from '@playwright/test'

export class PublicEventPage {
  constructor(private page: Page) {}

  async goto(schoolSlug: string, eventSlug: string) {
    await this.page.goto(`/p/${schoolSlug}/${eventSlug}`)
    // Wait for form to load before proceeding (fixes race condition)
    await this.page.waitForSelector('input[name="name"]', { state: 'visible', timeout: 15000 })
  }

  async fillRegistrationForm(data: {
    name: string
    email: string
    phone: string
    spots?: number
    customFields?: Record<string, any>
  }) {
    await this.page.fill('input[name="name"]', data.name)
    await this.page.fill('input[name="email"]', data.email)
    await this.page.fill('input[name="phone"]', data.phone)

    if (data.spots) {
      await this.page.fill('input[name="spots"]', data.spots.toString())
    }

    if (data.customFields) {
      for (const [key, value] of Object.entries(data.customFields)) {
        await this.page.fill(
          `input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`,
          String(value)
        )
      }
    }
  }

  async submitRegistration() {
    await this.page.click('button[type="submit"]')
  }

  async register(data: {
    name: string
    email: string
    phone: string
    spots?: number
    customFields?: Record<string, any>
  }) {
    await this.fillRegistrationForm(data)
    await this.submitRegistration()
  }

  async expectConfirmation() {
    await expect(
      this.page.locator('text=/הרשמה הושלמה|נרשמת בהצלחה|registration.*success/i')
    ).toBeVisible({ timeout: 10000 })
  }

  async expectWaitlist() {
    await expect(this.page.locator('text=/רשימת המתנה|waitlist/i')).toBeVisible({ timeout: 10000 })
  }

  async expectEventFull() {
    await expect(this.page.locator('text=/אירוע מלא|event.*full|מקומות תפוסים/i')).toBeVisible()
  }

  async expectEventCancelled() {
    await expect(this.page.locator('text=/אירוע בוטל|event.*cancel/i')).toBeVisible()
  }

  async expectValidationError() {
    await expect(this.page.locator('.error, [role="alert"], text=/שגיאה|error/i')).toBeVisible()
  }

  async getConfirmationCode(): Promise<string | null> {
    const codeElement = await this.page
      .locator('[data-testid="confirmation-code"], .confirmation-code')
      .first()
    return await codeElement.textContent()
  }

  async expectEventDetails(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible()
  }

  async getAvailableSpots(): Promise<string | null> {
    const spotsElement = await this.page
      .locator('[data-testid="available-spots"], .available-spots')
      .first()
    return await spotsElement.textContent()
  }

  async isRegistrationClosed(): Promise<boolean> {
    const submitButton = this.page.locator('button[type="submit"]')
    return await submitButton.isDisabled()
  }

  /**
   * Get the maximum number of spots from GuestCountSelector range text
   * Returns the max value from "1 - 7 אורחים" text
   */
  async getMaxSpots(): Promise<number> {
    // Scroll to make sure the GuestCountSelector is visible
    const rangeLocator = this.page.locator('.text-xs.text-gray-500').first()
    await rangeLocator.scrollIntoViewIfNeeded()
    await rangeLocator.waitFor({ state: 'visible', timeout: 10000 })

    const rangeText = await rangeLocator.textContent()
    if (!rangeText) return 0

    // Extract max value from "1 - 7 אורחים" pattern
    const match = rangeText.match(/(\d+)\s*-\s*(\d+)/)
    if (match && match[2]) {
      return parseInt(match[2])
    }
    return 0
  }

  /**
   * Get the current guest count value from GuestCountSelector
   */
  async getCurrentGuestCount(): Promise<number> {
    const countLocator = this.page
      .locator('.text-4xl.sm\\:text-5xl.font-bold.text-gray-900')
      .first()
    await countLocator.scrollIntoViewIfNeeded()
    const countText = await countLocator.textContent()
    return countText ? parseInt(countText) : 0
  }

  /**
   * Click the increment button in GuestCountSelector
   */
  async incrementGuests() {
    const btn = this.page.locator('button[aria-label="הוסף אורח"]')
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
  }

  /**
   * Click the decrement button in GuestCountSelector
   */
  async decrementGuests() {
    const btn = this.page.locator('button[aria-label="הפחת מספר אורחים"]')
    await btn.scrollIntoViewIfNeeded()
    await btn.click()
  }

  /**
   * Check if increment button is disabled (reached max)
   */
  async isIncrementDisabled(): Promise<boolean> {
    const incrementBtn = this.page.locator('button[aria-label="הוסף אורח"]')
    await incrementBtn.scrollIntoViewIfNeeded()
    return await incrementBtn.isDisabled()
  }

  /**
   * Check if decrement button is disabled (reached min)
   */
  async isDecrementDisabled(): Promise<boolean> {
    const decrementBtn = this.page.locator('button[aria-label="הפחת מספר אורחים"]')
    await decrementBtn.scrollIntoViewIfNeeded()
    return await decrementBtn.isDisabled()
  }
}
