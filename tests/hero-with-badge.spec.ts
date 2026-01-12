import { test, expect } from '@playwright/test'

test('capture hero section with center badge', async ({ page }) => {
  await page.goto('http://localhost:9000')
  await page.waitForLoadState('networkidle')

  // Wait for animations
  await page.waitForTimeout(2000)

  // Find the hero section
  const heroSection = page.locator('section').first()

  // Take screenshot of just the hero
  await heroSection.screenshot({
    path: 'hero-section-with-badge.png',
  })

  // Check that the center badge exists
  const centerBadge = page.locator('text=חינם לצמיתות')
  await expect(centerBadge).toBeVisible()

  console.log('\n✅ Hero section screenshot saved!')
  console.log('📍 Center badge with "100% חינם לצמיתות" is visible\n')
})
