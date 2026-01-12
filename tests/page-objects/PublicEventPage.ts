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
        await this.page.fill(`input[name="${key}"], select[name="${key}"], textarea[name="${key}"]`, String(value))
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
    await expect(
      this.page.locator('text=/רשימת המתנה|waitlist/i')
    ).toBeVisible({ timeout: 10000 })
  }

  async expectEventFull() {
    await expect(
      this.page.locator('text=/אירוע מלא|event.*full|מקומות תפוסים/i')
    ).toBeVisible()
  }

  async expectEventCancelled() {
    await expect(
      this.page.locator('text=/אירוע בוטל|event.*cancel/i')
    ).toBeVisible()
  }

  async expectValidationError() {
    await expect(
      this.page.locator('.error, [role="alert"], text=/שגיאה|error/i')
    ).toBeVisible()
  }

  async getConfirmationCode(): Promise<string | null> {
    const codeElement = await this.page.locator('[data-testid="confirmation-code"], .confirmation-code').first()
    return await codeElement.textContent()
  }

  async expectEventDetails(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible()
  }

  async getAvailableSpots(): Promise<string | null> {
    const spotsElement = await this.page.locator('[data-testid="available-spots"], .available-spots').first()
    return await spotsElement.textContent()
  }

  async isRegistrationClosed(): Promise<boolean> {
    const submitButton = this.page.locator('button[type="submit"]')
    return await submitButton.isDisabled()
  }
}
