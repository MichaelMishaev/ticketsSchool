import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/login')
  }

  async login(email: string, password: string) {
    // Wait for form to be ready
    await this.page.waitForSelector('form', { state: 'visible', timeout: 10000 })

    // Email field has type="text" on the login page, not type="email"
    // Use more specific selector to target the form input
    await this.page.locator('form input[name="email"]').fill(email)
    await this.page.locator('form input[type="password"]').fill(password)

    // Click the submit button inside the form (not the Google link)
    // Use text selector to ensure we click the right button
    await this.page.locator('form button[type="submit"]:has-text("התחבר")').click()

    // Wait for redirect to dashboard or specific URL
    // Mobile Safari can be slower under sustained load, so we use 45 second timeout
    await this.page.waitForURL(/\/admin(?!\/login)/, { timeout: 45000 })

    // Wait for page to finish loading completely
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 })

    // Wait for network to be idle (ensures all API calls complete)
    await this.page.waitForLoadState('networkidle', { timeout: 10000 }).catch(() => {
      // Network idle might timeout on slow connections, that's okay
      console.log('Network idle timeout - continuing anyway')
    })

    // Verify we're no longer on the login page
    // This works across all screen sizes (mobile/desktop)
    const currentUrl = this.page.url()
    if (currentUrl.includes('/admin/login')) {
      throw new Error('Login failed - still on login page')
    }
  }

  async loginAndWaitFor(email: string, password: string, expectedUrl: string | RegExp) {
    // Wait for form to be ready
    await this.page.waitForSelector('form', { state: 'visible', timeout: 10000 })

    // Use form-scoped selectors
    await this.page.locator('form input[name="email"]').fill(email)
    await this.page.locator('form input[type="password"]').fill(password)
    await this.page.locator('form button[type="submit"]:has-text("התחבר")').click()

    await this.page.waitForURL(expectedUrl, { timeout: 10000 })
  }

  async expectLoginError(message?: string) {
    // Look for error messages - try multiple selectors
    const errorVisible = await Promise.race([
      this.page
        .locator('.error')
        .isVisible()
        .catch(() => false),
      this.page
        .locator('[role="alert"]')
        .isVisible()
        .catch(() => false),
      this.page
        .locator('text=/שגיאה|error/i')
        .isVisible()
        .catch(() => false),
      this.page
        .locator('.text-red-500, .text-red-600, .text-red-700')
        .isVisible()
        .catch(() => false),
    ])

    // At least one error indicator should be visible
    const anyError = await this.page
      .locator('.error, [role="alert"]')
      .or(this.page.locator('text=/שגיאה|error/i'))
      .first()
      .isVisible({ timeout: 5000 })
      .catch(() => false)

    expect(anyError || errorVisible).toBeTruthy()

    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible()
    }
  }

  async expectEmailVerificationRequired() {
    await expect(this.page.locator('text=/אמת את המייל|verify.*email/i')).toBeVisible({
      timeout: 5000,
    })
  }

  async fillEmail(email: string) {
    await this.page.locator('form input[name="email"]').fill(email)
  }

  async fillPassword(password: string) {
    await this.page.locator('form input[type="password"]').fill(password)
  }

  async submit() {
    await this.page.locator('form button[type="submit"]:has-text("התחבר")').click()
  }

  async isOnLoginPage() {
    return this.page.url().includes('/admin/login')
  }
}
