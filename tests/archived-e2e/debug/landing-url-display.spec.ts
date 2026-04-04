import { test, expect } from '@playwright/test'

test.describe('Landing Page URL Display', () => {
  test('URL should not break awkwardly on mobile (346px)', async ({ page }) => {
    // Set mobile viewport to match the screenshot
    await page.setViewportSize({ width: 346, height: 878 })

    // Navigate to landing page
    await page.goto('http://localhost:9000')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    console.log('\n📱 Testing URL Display on 346px mobile viewport\n')

    // Find the purple button with the URL
    const urlButton = page.locator('.bg-purple-600.text-white.font-mono')

    // Check if the element exists
    const exists = await urlButton.count()
    console.log(`✓ URL button found: ${exists > 0}`)
    expect(exists).toBeGreaterThan(0)

    // Get the text content
    const urlText = await urlButton.textContent()
    console.log(`✓ URL text: "${urlText}"`)

    // Get bounding box
    const box = await urlButton.boundingBox()
    if (box) {
      console.log(`✓ Button dimensions: ${box.width}px × ${box.height}px`)
      console.log(`✓ Button position: (${box.x}, ${box.y})`)
    }

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/url-display-mobile-346px.png',
      fullPage: true,
    })
    console.log('\n✓ Screenshot saved: test-results/url-display-mobile-346px.png')

    // Check that viewport doesn't have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    console.log(`\n✓ Body width: ${bodyWidth}px`)
    console.log(`✓ Viewport width: ${viewportWidth}px`)

    if (bodyWidth > viewportWidth) {
      console.log(
        `❌ Horizontal scroll detected! Body is ${bodyWidth - viewportWidth}px wider than viewport`
      )
    } else {
      console.log(`✅ No horizontal scroll - perfect!`)
    }

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1) // Allow 1px tolerance
  })

  test('URL should display properly on iPhone SE (375px)', async ({ page }) => {
    // Set iPhone SE viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Navigate to landing page
    await page.goto('http://localhost:9000')

    // Wait for page to load
    await page.waitForLoadState('networkidle')

    console.log('\n📱 Testing URL Display on iPhone SE (375px)\n')

    // Find the purple button with the URL
    const urlButton = page.locator('.bg-purple-600.text-white.font-mono')

    // Check if the element exists
    const exists = await urlButton.count()
    console.log(`✓ URL button found: ${exists > 0}`)
    expect(exists).toBeGreaterThan(0)

    // Get the text content
    const urlText = await urlButton.textContent()
    console.log(`✓ URL text: "${urlText}"`)

    // Get bounding box
    const box = await urlButton.boundingBox()
    if (box) {
      console.log(`✓ Button dimensions: ${box.width}px × ${box.height}px`)
    }

    // Take a screenshot
    await page.screenshot({
      path: 'test-results/url-display-iphone-se.png',
      fullPage: true,
    })
    console.log('\n✓ Screenshot saved: test-results/url-display-iphone-se.png')

    // Check that viewport doesn't have horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    console.log(`\n✓ Body width: ${bodyWidth}px`)
    console.log(`✓ Viewport width: ${viewportWidth}px`)

    if (bodyWidth > viewportWidth) {
      console.log(`❌ Horizontal scroll detected!`)
    } else {
      console.log(`✅ No horizontal scroll`)
    }

    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })
})
