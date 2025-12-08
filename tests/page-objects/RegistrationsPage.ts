import { Page, expect } from '@playwright/test'

export class RegistrationsPage {
  constructor(private page: Page) {}

  async goto(eventId: string) {
    await this.page.goto(`/admin/events/${eventId}/registrations`)
  }

  async getRegistrationCount(): Promise<number> {
    const registrations = await this.page.locator('[data-testid="registration-item"], .registration-row, tr[data-registration-id]').all()
    return registrations.length
  }

  async searchRegistrations(query: string) {
    await this.page.fill('input[placeholder*="חיפוש"], input[type="search"]', query)
  }

  async filterByStatus(status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED') {
    await this.page.selectOption('select[name="status"], select[data-testid="status-filter"]', status)
  }

  async clickRegistration(registrantName: string) {
    await this.page.click(`text=${registrantName}`)
  }

  async cancelRegistration(registrantName: string) {
    await this.clickRegistration(registrantName)
    await this.page.click('button:has-text("ביטול"), button:has-text("Cancel")')
    await this.page.click('button:has-text("אשר"), button:has-text("Confirm")')
  }

  async editRegistration(registrantName: string, newData: {
    name?: string
    email?: string
    phone?: string
    spots?: number
  }) {
    await this.clickRegistration(registrantName)
    await this.page.click('button:has-text("עריכה"), button:has-text("Edit")')

    if (newData.name) {
      await this.page.fill('input[name="name"]', newData.name)
    }
    if (newData.email) {
      await this.page.fill('input[name="email"]', newData.email)
    }
    if (newData.phone) {
      await this.page.fill('input[name="phone"]', newData.phone)
    }
    if (newData.spots) {
      await this.page.fill('input[name="spots"]', newData.spots.toString())
    }

    await this.page.click('button[type="submit"]')
  }

  async exportCSV() {
    await this.page.click('button:has-text("יצא"), button:has-text("Export")')

    const downloadPromise = this.page.waitForEvent('download')
    await this.page.click('button:has-text("CSV")')
    return await downloadPromise
  }

  async expectRegistrationExists(registrantName: string) {
    await expect(this.page.locator(`text=${registrantName}`)).toBeVisible()
  }

  async expectRegistrationStatus(registrantName: string, status: string) {
    const row = this.page.locator(`[data-registration-name="${registrantName}"], text=${registrantName}`)
    await expect(row.locator(`text=${status}`)).toBeVisible()
  }

  async getConfirmedCount(): Promise<number> {
    const confirmedRows = await this.page.locator('[data-status="CONFIRMED"], .status-confirmed').all()
    return confirmedRows.length
  }

  async getWaitlistCount(): Promise<number> {
    const waitlistRows = await this.page.locator('[data-status="WAITLIST"], .status-waitlist').all()
    return waitlistRows.length
  }

  async promoteFromWaitlist(registrantName: string) {
    await this.clickRegistration(registrantName)
    await this.page.click('button:has-text("העבר לאישור"), button:has-text("Confirm")')
  }
}
