import { Page, expect } from '@playwright/test'

export class SignupPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/signup')
  }

  async fillForm(data: {
    email: string
    password: string
    name: string
    confirmPassword?: string
  }) {
    await this.page.fill('input[name="email"]', data.email)
    await this.page.fill('input[name="password"]', data.password)
    await this.page.fill('input[name="confirmPassword"]', data.confirmPassword || data.password)
    await this.page.fill('input[name="name"]', data.name)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async signup(data: {
    email: string
    password: string
    name: string
    confirmPassword?: string
  }) {
    await this.fillForm(data)
    await this.submit()
  }

  async expectSuccess() {
    // The app redirects to onboarding on successful signup
    await expect(this.page).toHaveURL(/\/admin\/onboarding/, { timeout: 10000 })
  }

  async expectEmailVerificationMessage() {
    await expect(
      this.page.locator('text=/נרשמת בהצלחה|הצלחה|success/i')
    ).toBeVisible({ timeout: 10000 })
  }

  async expectError(message?: string) {
    // Look for error text in the page
    const errorVisible = await this.page.locator('text=/שגיאה|error/i').first().isVisible({ timeout: 5000 }).catch(() => false)

    expect(errorVisible).toBeTruthy()

    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible()
    }
  }

  async expectValidationError(field: string) {
    // Look for error message near the field
    await expect(this.page.locator('text=/שגיאה|error/i').first()).toBeVisible()
  }

  async expectDuplicateEmailError() {
    await expect(
      this.page.locator('text=/כבר קיים|already exists|duplicate/i')
    ).toBeVisible()
  }
}
