import { test, expect } from '@playwright/test'

test('inspect landing page hero cards', async ({ page }) => {
  await page.goto('http://localhost:9000')
  await page.waitForLoadState('networkidle')

  // Find all "בקרוב" badges
  const badges = await page.locator('span:has-text("בקרוב")').all()
  console.log(`\n📊 Found ${badges.length} "בקרוב" badges total\n`)

  // Hero section cards
  const heroCards = [
    { selector: 'div:has-text("WhatsApp אוטומטי")', name: 'WhatsApp' },
    { selector: 'div:has-text("תשלומים מאובטחים")', name: 'Payments' },
    { selector: 'div:has-text("דוחות בזמן אמת")', name: 'Analytics' },
    { selector: 'div:has-text("מותאם לנייד")', name: 'Mobile' },
    { selector: 'div:has-text("מאובטח 100%")', name: 'Security' },
  ]

  console.log('🎴 Hero Cards (floating collage):')
  for (const card of heroCards) {
    const element = page.locator(card.selector).first()
    const hasBadge = await element.locator('span:has-text("בקרוב")').count()
    console.log(`  ${card.name}: ${hasBadge > 0 ? '✅ HAS badge' : '❌ NO badge'}`)
  }

  // Features grid
  console.log('\n📋 Features Grid:')
  const gridCards = await page.locator('div.border-4.rounded-2xl').all()
  for (let i = 0; i < gridCards.length; i++) {
    const card = gridCards[i]
    const text = await card.textContent()
    const hasBadge = await card.locator('span:has-text("בקרוב")').count()
    const title = text?.match(/WhatsApp|תשלומים|דוחות|מותאם|אבטחה/)?.[0] || 'Unknown'
    if (hasBadge > 0) {
      console.log(`  Card ${i + 1} (${title}): ✅ HAS badge`)
    }
  }

  await page.screenshot({ path: 'landing-hero-cards.png', fullPage: true })
  console.log('\n✅ Screenshot saved\n')
})
