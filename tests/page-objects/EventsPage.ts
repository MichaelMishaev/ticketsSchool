import { Page, expect } from '@playwright/test'

export class EventsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/events')
  }

  async gotoNewEvent() {
    await this.page.goto('/admin/events/new')
  }

  async createEvent(data: {
    title: string
    description?: string
    startDate: string
    startTime: string
    capacity: number
    location: string
  }) {
    await this.page.fill('input[name="title"]', data.title)

    if (data.description) {
      await this.page.fill('textarea[name="description"], input[name="description"]', data.description)
    }

    await this.page.fill('input[name="startDate"], input[type="date"]', data.startDate)
    await this.page.fill('input[name="startTime"], input[type="time"]', data.startTime)
    await this.page.fill('input[name="capacity"]', data.capacity.toString())
    await this.page.fill('input[name="location"]', data.location)

    await this.page.click('button[type="submit"]')

    // Wait for redirect or success message
    await this.page.waitForURL(/\/admin\/events/, { timeout: 10000 })
  }

  async clickEvent(eventTitle: string) {
    await this.page.click(`text=${eventTitle}`)
  }

  async deleteEvent(eventTitle: string) {
    await this.page.click(`text=${eventTitle}`)
    await this.page.click('button:has-text("מחק"), button:has-text("Delete")')
    await this.page.click('button:has-text("אשר"), button:has-text("Confirm")')
  }

  async getEventCount(): Promise<number> {
    const events = await this.page.locator('[data-testid="event-item"], .event-card, .event-row').all()
    return events.length
  }

  async expectEventExists(eventTitle: string) {
    await expect(this.page.locator(`text=${eventTitle}`)).toBeVisible()
  }

  async expectEventNotExists(eventTitle: string) {
    await expect(this.page.locator(`text=${eventTitle}`)).not.toBeVisible()
  }

  async expectEmptyState() {
    await expect(
      this.page.locator('text=/אין אירועים|no events/i')
    ).toBeVisible()
  }

  async searchEvents(query: string) {
    await this.page.fill('input[placeholder*="חיפוש"], input[type="search"]', query)
  }

  async filterByStatus(status: string) {
    await this.page.selectOption('select[name="status"]', status)
  }

  async getEventDetails(eventTitle: string) {
    await this.clickEvent(eventTitle)

    const capacity = await this.page.locator('[data-testid="capacity"]').textContent()
    const spotsReserved = await this.page.locator('[data-testid="spots-reserved"]').textContent()

    return { capacity, spotsReserved }
  }
}
