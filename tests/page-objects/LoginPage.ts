import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for redirect to dashboard or specific URL
    await this.page.waitForURL(/\/admin/, { timeout: 10000 })
  }

  async loginAndWaitFor(email: string, password: string, expectedUrl: string | RegExp) {
    await this.page.fill('input[type="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')

    await this.page.waitForURL(expectedUrl, { timeout: 10000 })
  }

  async expectLoginError(message?: string) {
    const errorLocator = this.page.locator('.error, [role="alert"], text=/שגיאה|error/i')
    await expect(errorLocator).toBeVisible({ timeout: 5000 })

    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible()
    }
  }

  async expectEmailVerificationRequired() {
    await expect(
      this.page.locator('text=/אמת את המייל|verify.*email/i')
    ).toBeVisible({ timeout: 5000 })
  }

  async fillEmail(email: string) {
    await this.page.fill('input[type="email"]', email)
  }

  async fillPassword(password: string) {
    await this.page.fill('input[type="password"]', password)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async isOnLoginPage() {
    return this.page.url().includes('/admin/login')
  }
}
