import { test, expect } from '@playwright/test'

test('debug: inspect actual HTML being served', async ({ page }) => {
  console.log('🔍 DEBUGGING: Loading page and inspecting actual HTML...\n')

  // Navigate to login page
  await page.goto('http://localhost:9000/admin/login')
  await page.waitForLoadState('networkidle')

  // Get the entire HTML of the navigation section
  const navSection = await page.locator('div.mt-6').innerHTML()
  console.log('📄 ACTUAL HTML BEING SERVED:')
  console.log('=====================================')
  console.log(navSection)
  console.log('=====================================\n')

  // Check for buttons vs anchors
  const buttons = await page.locator('div.mt-6 button').count()
  const anchors = await page.locator('div.mt-6 a').count()

  console.log(`🔢 Found ${buttons} <button> elements in navigation section`)
  console.log(`🔢 Found ${anchors} <a> elements in navigation section\n`)

  if (buttons > 0) {
    console.log('⚠️  WARNING: Still seeing BUTTON elements!')
    console.log('This means the browser is loading the OLD version\n')

    // Get button details
    const buttonElements = page.locator('div.mt-6 button')
    const count = await buttonElements.count()
    for (let i = 0; i < count; i++) {
      const text = await buttonElements.nth(i).textContent()
      const onClick = await buttonElements.nth(i).getAttribute('onclick')
      console.log(`Button ${i + 1}: "${text}" - onclick: ${onClick}`)
    }
  }

  if (anchors > 0) {
    console.log('✅ Good: Found ANCHOR elements')

    // Get anchor details
    const anchorElements = page.locator('div.mt-6 a')
    const count = await anchorElements.count()
    for (let i = 0; i < count; i++) {
      const text = await anchorElements.nth(i).textContent()
      const href = await anchorElements.nth(i).getAttribute('href')
      console.log(`Anchor ${i + 1}: "${text}" - href: ${href}`)
    }
  }

  // Check for JavaScript errors
  const errors: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      errors.push(msg.text())
    }
  })

  // Check for any overlay or pointer-events blocking
  const signupElement = page.locator('text=הרשמה').first()
  const styles = await signupElement.evaluate((el) => {
    const computed = window.getComputedStyle(el)
    return {
      pointerEvents: computed.pointerEvents,
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      zIndex: computed.zIndex,
    }
  })

  console.log('\n🎨 CSS Properties of הרשמה link:')
  console.log(JSON.stringify(styles, null, 2))

  // Take a screenshot
  await page.screenshot({ path: 'debug-login-page.png', fullPage: true })
  console.log('\n📸 Screenshot saved to debug-login-page.png')

  // Check cache headers
  const response = await page.goto('http://localhost:9000/admin/login')
  const headers = response?.headers()
  console.log('\n📋 Response Headers:')
  console.log('  cache-control:', headers?.['cache-control'])
  console.log('  etag:', headers?.['etag'])
  console.log('  x-nextjs-cache:', headers?.['x-nextjs-cache'])
})
