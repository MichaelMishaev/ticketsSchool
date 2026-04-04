import { test, expect } from '@playwright/test'

test('Final test - real Playwright click with manual onclick attachment', async ({ page }) => {
  await page.goto('http://localhost:9000/admin/login')
  await page.waitForLoadState('networkidle')

  // Wait for useEffect to run and attach handlers
  await page.waitForTimeout(1500)

  console.log('Clicking הרשמה button...')

  const signupButton = page.locator('button:has-text("הרשמה")')
  await expect(signupButton).toBeVisible()

  // Click with real Playwright click
  await signupButton.click()

  // Wait for navigation
  await page.waitForURL('**/admin/signup', { timeout: 5000 })

  const currentUrl = page.url()
  console.log(`Current URL: ${currentUrl}`)

  expect(currentUrl).toContain('/admin/signup')
  console.log('✅ SUCCESS! Real click works!')
})
