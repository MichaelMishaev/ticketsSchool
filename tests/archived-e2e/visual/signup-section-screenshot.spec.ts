import { test, expect } from '@playwright/test'

test('Capture signup section screenshots', async ({ page }) => {
  // Mobile viewport
  await page.setViewportSize({ width: 375, height: 667 })

  await page.goto('http://localhost:9000')

  // Scroll to the "How It Works" section
  await page.locator('text=איך להתחיל?').scrollIntoViewIfNeeded()

  // Wait a bit for smooth scroll
  await page.waitForTimeout(500)

  // Find Step 2 heading
  const step2Heading = page.locator('h3:has-text("תירשמו")').first()
  await step2Heading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(500)

  // Take screenshot of the entire visible area
  await page.screenshot({ path: 'test-results/signup-section-full.png', fullPage: false })

  // Find the green box with signup options
  const greenBox = page.locator('.bg-green-50').first()
  await greenBox.scrollIntoViewIfNeeded()
  await page.waitForTimeout(300)

  // Screenshot just the green box
  await greenBox.screenshot({ path: 'test-results/signup-green-box.png' })

  console.log('Screenshots captured successfully!')
})
