import { test, expect } from '@playwright/test'

test('detailed landing page card inspection', async ({ page }) => {
  await page.goto('http://localhost:9000')
  await page.waitForLoadState('networkidle')

  console.log('\n🎨 HERO SECTION CARDS ANALYSIS:\n')

  const cards = [
    { name: 'WhatsApp', text: 'WhatsApp אוטומטי' },
    { name: 'Payments', text: 'תשלומים מאובטחים' },
    { name: 'Analytics', text: 'דוחות בזמן אמת' },
    { name: 'Mobile', text: 'מותאם לנייד' },
    { name: 'Security', text: 'מאובטח 100%' },
  ]

  for (const card of cards) {
    // Find the card container
    const cardElement = page.locator(`h3:has-text("${card.text}")`).first().locator('..')

    // Check for badge
    const hasBadge = (await cardElement.locator('span:has-text("בקרוב")').count()) > 0

    // Get card colors
    const bgColor = await cardElement.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor
    })

    console.log(`📦 ${card.name}:`)
    console.log(`   Badge: ${hasBadge ? '🟡 YES' : '⚪ NO'}`)
    console.log(`   Background: ${bgColor}`)
  }

  // Screenshot
  await page.screenshot({
    path: 'landing-current-state.png',
    fullPage: false,
    clip: { x: 0, y: 100, width: 1920, height: 800 },
  })

  console.log('\n✅ Screenshot saved as landing-current-state.png\n')
})
