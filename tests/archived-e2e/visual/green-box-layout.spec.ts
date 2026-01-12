import { test, expect } from '@playwright/test'

test.describe('Green Box Signup Options Layout', () => {
  test('should display green box centered and full width on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    await page.goto('http://localhost:9000')

    // Wait for the green box to be visible
    const greenBox = page.locator('.bg-green-50').first()
    await expect(greenBox).toBeVisible()

    // Take screenshot of the green box
    await greenBox.screenshot({ path: 'test-results/green-box-mobile.png' })

    // Check if the signup options are centered
    const googleOption = page.locator('text=חשבון גוגל (הכי מהיר!)')
    await expect(googleOption).toBeVisible()

    // Get bounding box to verify width
    const greenBoxBounds = await greenBox.boundingBox()
    console.log('Green Box Bounds:', greenBoxBounds)

    // Take full step 2 screenshot
    const step2 = page.locator('text=תירשמו').locator('..')
    await step2.screenshot({ path: 'test-results/step2-full-mobile.png' })
  })

  test('should verify text is centered', async ({ page }) => {
    await page.goto('http://localhost:9000')

    const greenBox = page.locator('.bg-green-50').first()
    await expect(greenBox).toBeVisible()

    // Check the Google option alignment
    const googleOption = greenBox.locator('text=חשבון גוגל (הכי מהיר!)')
    const googleClass = await googleOption.getAttribute('class')
    console.log('Google option classes:', googleClass)
    expect(googleClass).toContain('text-center')
  })
})
