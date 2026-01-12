/**
 * Admin Signup Tests
 * Tests for new user registration (Bug #13 two-step form)
 */

import { test, expect } from '@playwright/test'
import { generateUniqueTestData } from '../helpers/test-data'
import { clearCookies } from '../helpers/auth-helpers'

test.describe('Admin Signup', () => {
  test.beforeEach(async ({ page }) => {
    await clearCookies(page)
    await page.goto('/admin/signup')
  })

  test('should display two-step signup form (Bug #13)', async ({ page }) => {
    // Should show organization info section
    await expect(page.locator('text=/פרטי ארגון|Organization/')).toBeVisible()

    // Organization fields
    await expect(page.locator('input[name="schoolName"]')).toBeVisible()
    await expect(page.locator('input[name="schoolSlug"]')).toBeVisible()

    // Personal info section
    await expect(page.locator('text=/פרטים אישיים|Personal/')).toBeVisible()

    // Personal fields
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="email"]')).toBeVisible()
    await expect(page.locator('input[name="password"]')).toBeVisible()
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible()
  })

  test('should auto-generate slug from school name', async ({ page }) => {
    const schoolName = 'Test School ABC'
    const expectedSlug = 'test-school-abc'

    await page.fill('input[name="schoolName"]', schoolName)

    // Slug should auto-populate
    const slugValue = await page.locator('input[name="schoolSlug"]').inputValue()
    expect(slugValue).toBe(expectedSlug)
  })

  test('should show URL preview for school slug', async ({ page }) => {
    await page.fill('input[name="schoolSlug"]', 'my-school')

    // Should show preview like "ticketcap.com/p/my-school" or similar
    await expect(page.locator('text=/ticketcap|kartis|p\\/my-school/')).toBeVisible()
  })

  test('should validate password match', async ({ page }) => {
    const testData = generateUniqueTestData()

    await page.fill('input[name="schoolName"]', testData.school.name)
    await page.fill('input[name="name"]', testData.admin.name)
    await page.fill('input[name="email"]', testData.admin.email)
    await page.fill('input[name="password"]', 'Password123!')
    await page.fill('input[name="confirmPassword"]', 'DifferentPassword123!')

    await page.click('button[type="submit"]')

    // Should show password mismatch error
    await expect(page.locator('text=/לא תואמ|not match|mismatch/')).toBeVisible()
  })

  test('should successfully create account with all fields', async ({ page }) => {
    const testData = generateUniqueTestData()

    // Fill organization info
    await page.fill('input[name="schoolName"]', testData.school.name)
    await page.fill('input[name="schoolSlug"]', testData.school.slug)

    // Fill personal info
    await page.fill('input[name="name"]', testData.admin.name)
    await page.fill('input[name="email"]', testData.admin.email)
    await page.fill('input[name="password"]', testData.admin.password)
    await page.fill('input[name="confirmPassword"]', testData.admin.password)

    // Submit
    await page.click('button[type="submit"]')

    // Should show success message
    await expect(page.locator('text=/נרשמת בהצלחה|success|created/')).toBeVisible({
      timeout: 10000,
    })

    // Should show email verification instructions
    await expect(page.locator('text=/אימות|verification|email/')).toBeVisible()
  })

  test('should show error for duplicate school slug', async ({ page }) => {
    const testData = generateUniqueTestData()

    // First signup
    await page.fill('input[name="schoolName"]', testData.school.name)
    await page.fill('input[name="schoolSlug"]', 'duplicate-test-slug')
    await page.fill('input[name="name"]', testData.admin.name)
    await page.fill('input[name="email"]', testData.admin.email)
    await page.fill('input[name="password"]', testData.admin.password)
    await page.fill('input[name="confirmPassword"]', testData.admin.password)

    await page.click('button[type="submit"]')
    await expect(page.locator('text=/נרשמת בהצלחה|success/')).toBeVisible({ timeout: 10000 })

    // Try to signup again with same slug
    await page.goto('/admin/signup')

    const testData2 = generateUniqueTestData()
    await page.fill('input[name="schoolName"]', testData2.school.name)
    await page.fill('input[name="schoolSlug"]', 'duplicate-test-slug') // Same slug
    await page.fill('input[name="name"]', testData2.admin.name)
    await page.fill('input[name="email"]', testData2.admin.email)
    await page.fill('input[name="password"]', testData2.admin.password)
    await page.fill('input[name="confirmPassword"]', testData2.admin.password)

    await page.click('button[type="submit"]')

    // Should show error about duplicate slug
    await expect(page.locator('text=/כבר תפוס|already taken|exists/')).toBeVisible({
      timeout: 5000,
    })
  })

  test('should have "resend verification email" button on success screen (Bug #14)', async ({
    page,
  }) => {
    const testData = generateUniqueTestData()

    await page.fill('input[name="schoolName"]', testData.school.name)
    await page.fill('input[name="schoolSlug"]', testData.school.slug)
    await page.fill('input[name="name"]', testData.admin.name)
    await page.fill('input[name="email"]', testData.admin.email)
    await page.fill('input[name="password"]', testData.admin.password)
    await page.fill('input[name="confirmPassword"]', testData.admin.password)

    await page.click('button[type="submit"]')

    // Success screen
    await expect(page.locator('text=/נרשמת בהצלחה|success/')).toBeVisible({ timeout: 10000 })

    // Should have resend button
    const resendButton = page.locator('button:has-text("שלח מייל שוב")')
    await expect(resendButton).toBeVisible()

    // Click resend
    await resendButton.click()

    // Should show feedback
    await expect(
      page.locator('text=/נשלח מחדש|resent|sent again/').first()
    ).toBeVisible({ timeout: 5000 })
  })

  test('should validate password strength', async ({ page }) => {
    const testData = generateUniqueTestData()

    await page.fill('input[name="schoolName"]', testData.school.name)
    await page.fill('input[name="name"]', testData.admin.name)
    await page.fill('input[name="email"]', testData.admin.email)

    // Try weak password
    await page.fill('input[name="password"]', '123')
    await page.fill('input[name="confirmPassword"]', '123')

    await page.click('button[type="submit"]')

    // Should show error about password length
    await expect(page.locator('text=/לפחות 8|at least 8|too short/')).toBeVisible()
  })

  test.describe('Mobile responsiveness', () => {
    test('should be fully functional on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const testData = generateUniqueTestData()

      // All fields should be visible
      await expect(page.locator('input[name="schoolName"]')).toBeVisible()
      await expect(page.locator('input[name="name"]')).toBeVisible()

      // Submit button should have min height
      const submitBtn = page.locator('button[type="submit"]')
      const box = await submitBtn.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44)

      // Should be able to complete signup
      await page.fill('input[name="schoolName"]', testData.school.name)
      await page.fill('input[name="schoolSlug"]', testData.school.slug)
      await page.fill('input[name="name"]', testData.admin.name)
      await page.fill('input[name="email"]', testData.admin.email)
      await page.fill('input[name="password"]', testData.admin.password)
      await page.fill('input[name="confirmPassword"]', testData.admin.password)

      await submitBtn.click()

      await expect(page.locator('text=/נרשמת בהצלחה|success/')).toBeVisible({ timeout: 10000 })
    })
  })

  test('should have link to login page', async ({ page }) => {
    const loginLink = page.locator('a[href*="login"]')
    await expect(loginLink).toBeVisible()

    await loginLink.click()
    await expect(page).toHaveURL('/admin/login')
  })

  test('should have home button to return to landing', async ({ page }) => {
    const homeButton = page.locator('a[href="/"]')
    if (await homeButton.isVisible()) {
      await homeButton.click()
      await expect(page).toHaveURL('/')
    }
  })
})
