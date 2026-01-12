import { test, expect } from '@playwright/test'

test.describe('Admin Login Navigation Links - Fixed', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('domcontentloaded')
  })

  test('should have proper anchor tags for sign up and forgot password', async ({ page }) => {
    // Verify the sign up link exists as an anchor tag with href
    const signupLink = page.locator('a[href="/admin/signup"]')
    await expect(signupLink).toBeVisible()
    await expect(signupLink).toHaveText('הרשמה')

    // Verify the forgot password link exists as an anchor tag with href
    const forgotPasswordLink = page.locator('a[href="/admin/forgot-password"]')
    await expect(forgotPasswordLink).toBeVisible()
    await expect(forgotPasswordLink).toHaveText('שכחתי סיסמה')

    console.log('✅ Both navigation links are proper anchor tags with href attributes')
  })

  test('should navigate to signup page when clicking הרשמה link', async ({ page }) => {
    // Find and click the signup link
    const signupLink = page.locator('a[href="/admin/signup"]')
    await signupLink.click()

    // Wait for navigation
    await page.waitForURL('**/admin/signup')

    // Verify we're on the signup page
    await expect(page).toHaveURL(/\/admin\/signup/)

    console.log('✅ Successfully navigated to signup page')
  })

  test('should navigate to forgot password page when clicking שכחתי סיסמה link', async ({
    page,
  }) => {
    // Find and click the forgot password link
    const forgotPasswordLink = page.locator('a[href="/admin/forgot-password"]')
    await forgotPasswordLink.click()

    // Wait for navigation
    await page.waitForURL('**/admin/forgot-password')

    // Verify we're on the forgot password page
    await expect(page).toHaveURL(/\/admin\/forgot-password/)

    console.log('✅ Successfully navigated to forgot password page')
  })

  test('should allow browser back navigation from signup page', async ({ page }) => {
    // Click signup link
    await page.locator('a[href="/admin/signup"]').click()
    await page.waitForURL('**/admin/signup')

    // Go back
    await page.goBack()
    await page.waitForURL('**/admin/login')

    // Verify we're back at login page
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible()

    console.log('✅ Browser back navigation works from signup page')
  })

  test('should allow browser back navigation from forgot password page', async ({ page }) => {
    // Click forgot password link
    await page.locator('a[href="/admin/forgot-password"]').click()
    await page.waitForURL('**/admin/forgot-password')

    // Go back
    await page.goBack()
    await page.waitForURL('**/admin/login')

    // Verify we're back at login page
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('h2:has-text("כניסת מנהלים")')).toBeVisible()

    console.log('✅ Browser back navigation works from forgot password page')
  })

  test('comprehensive navigation flow test', async ({ page }) => {
    console.log('Starting comprehensive navigation flow test...')

    // 1. Verify we're at login page
    await expect(page).toHaveURL(/\/admin\/login/)
    console.log('✓ At login page')

    // 2. Click signup link
    await page.locator('a[href="/admin/signup"]').click()
    await page.waitForURL('**/admin/signup')
    await expect(page).toHaveURL(/\/admin\/signup/)
    console.log('✓ Navigated to signup page')

    // 3. Go back to login
    await page.goBack()
    await page.waitForURL('**/admin/login')
    await expect(page).toHaveURL(/\/admin\/login/)
    console.log('✓ Back to login page')

    // 4. Click forgot password link
    await page.locator('a[href="/admin/forgot-password"]').click()
    await page.waitForURL('**/admin/forgot-password')
    await expect(page).toHaveURL(/\/admin\/forgot-password/)
    console.log('✓ Navigated to forgot password page')

    // 5. Go back to login
    await page.goBack()
    await page.waitForURL('**/admin/login')
    await expect(page).toHaveURL(/\/admin\/login/)
    console.log('✓ Back to login page again')

    console.log('✅ Comprehensive navigation flow completed successfully!')
  })
})
