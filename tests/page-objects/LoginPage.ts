import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/login')
  }

  async login(email: string, password: string) {
    // Email field has type="text" on the login page, not type="email"
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')

    // Wait for redirect to dashboard or specific URL
    await this.page.waitForURL(/\/admin/, { timeout: 15000 })

    // Wait for page to finish loading completely
    await this.page.waitForLoadState('networkidle', { timeout: 20000 })

    // Wait for admin layout to fully load (indicates auth check completed)
    // The logout button appears after the layout finishes loading
    await this.page.locator('text=התנתק').waitFor({ state: 'attached', timeout: 20000 })
  }

  async loginAndWaitFor(email: string, password: string, expectedUrl: string | RegExp) {
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[type="password"]', password)
    await this.page.click('button[type="submit"]')

    await this.page.waitForURL(expectedUrl, { timeout: 10000 })
  }

  async expectLoginError(message?: string) {
    // Look for error messages - try multiple selectors
    const errorVisible = await Promise.race([
      this.page.locator('.error').isVisible().catch(() => false),
      this.page.locator('[role="alert"]').isVisible().catch(() => false),
      this.page.locator('text=/שגיאה|error/i').isVisible().catch(() => false),
      this.page.locator('.text-red-500, .text-red-600, .text-red-700').isVisible().catch(() => false)
    ])

    // At least one error indicator should be visible
    const anyError = await this.page.locator('.error, [role="alert"]').or(this.page.locator('text=/שגיאה|error/i')).first().isVisible({ timeout: 5000 }).catch(() => false)

    expect(anyError || errorVisible).toBeTruthy()

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
    await this.page.fill('input[name="email"]', email)
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
