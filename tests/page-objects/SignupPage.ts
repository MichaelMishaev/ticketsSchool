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
    schoolName: string
    schoolSlug: string
  }) {
    await this.page.fill('input[name="email"], input[type="email"]', data.email)
    await this.page.fill('input[name="password"], input[type="password"]', data.password)
    await this.page.fill('input[name="name"]', data.name)
    await this.page.fill('input[name="schoolName"]', data.schoolName)
    await this.page.fill('input[name="schoolSlug"]', data.schoolSlug)
  }

  async submit() {
    await this.page.click('button[type="submit"]')
  }

  async signup(data: {
    email: string
    password: string
    name: string
    schoolName: string
    schoolSlug: string
  }) {
    await this.fillForm(data)
    await this.submit()
  }

  async expectSuccess() {
    await expect(
      this.page.locator('text=/הצלחה|success|נרשמת בהצלחה/i')
    ).toBeVisible({ timeout: 10000 })
  }

  async expectError(message?: string) {
    const errorLocator = this.page.locator('.error, [role="alert"], text=/שגיאה|error/i')
    await expect(errorLocator).toBeVisible({ timeout: 5000 })

    if (message) {
      await expect(this.page.locator(`text=${message}`)).toBeVisible()
    }
  }

  async expectValidationError(field: string) {
    const fieldError = this.page.locator(`input[name="${field}"] ~ .error, input[name="${field}"] + .error`)
    await expect(fieldError).toBeVisible()
  }

  async expectDuplicateEmailError() {
    await expect(
      this.page.locator('text=/כבר קיים|already exists|duplicate/i')
    ).toBeVisible()
  }
}
