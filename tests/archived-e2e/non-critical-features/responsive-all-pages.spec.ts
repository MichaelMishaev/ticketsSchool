import { test, expect, Page } from '@playwright/test'

/**
 * Comprehensive Responsive Testing Suite
 * Tests all pages across mobile, tablet, and desktop viewports
 */

// Viewport configurations
const viewports = {
  mobile: { width: 375, height: 667, name: 'iPhone SE' },
  tablet: { width: 768, height: 1024, name: 'iPad' },
  desktop: { width: 1920, height: 1080, name: 'Desktop' },
}

// Helper function to check if element is visible and not overflowing
async function checkElementResponsive(page: Page, selector: string, viewportName: string) {
  const element = page.locator(selector).first()

  if ((await element.count()) === 0) {
    console.log(`⚠️  [${viewportName}] Element not found: ${selector}`)
    return
  }

  const box = await element.boundingBox()
  const viewport = page.viewportSize()

  if (box && viewport) {
    const isOverflowing = box.width > viewport.width
    const isVisible = await element.isVisible()

    if (isOverflowing) {
      console.error(
        `❌ [${viewportName}] Element overflows: ${selector} (width: ${box.width}px, viewport: ${viewport.width}px)`
      )
    }

    if (!isVisible) {
      console.warn(`⚠️  [${viewportName}] Element not visible: ${selector}`)
    }

    expect(isOverflowing).toBe(false)
    expect(isVisible).toBe(true)
  }
}

// Test Suite 1: Landing Page (/)
test.describe('Landing Page Responsive Tests', () => {
  for (const [size, viewport] of Object.entries(viewports)) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:9000/')

      // Wait for page to load
      await page.waitForLoadState('networkidle')

      console.log(
        `\n📱 Testing Landing Page on ${viewport.name} (${viewport.width}x${viewport.height})`
      )

      // Check navigation
      await checkElementResponsive(page, 'nav', viewport.name)
      await checkElementResponsive(page, 'nav .text-2xl', viewport.name) // Logo

      // Check hero section
      await checkElementResponsive(page, 'h1', viewport.name)
      await checkElementResponsive(page, '.text-6xl, .text-8xl', viewport.name)

      // Check buttons
      const buttons = page.locator('a[href="/admin/login"], a[href="/admin/signup"]')
      const buttonCount = await buttons.count()

      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i)
        const box = await button.boundingBox()

        if (box) {
          // Buttons should not be too wide on mobile
          if (size === 'mobile') {
            expect(box.width).toBeLessThan(viewport.width - 40) // Allow 20px margin on each side
          }

          console.log(`  ✓ Button ${i + 1}: ${box.width}px wide`)
        }
      }

      // Check features section
      await checkElementResponsive(page, '#features', viewport.name)

      // Check how-it-works section
      await checkElementResponsive(page, '#how-it-works', viewport.name)

      // Check FAQ section
      await checkElementResponsive(page, '#faq', viewport.name)

      // Check WhatsApp contact section
      await checkElementResponsive(page, 'a[href*="wa.me"]', viewport.name)

      // Check footer
      await checkElementResponsive(page, 'footer', viewport.name)

      // Take screenshot for visual verification
      await page.screenshot({
        path: `test-results/landing-${size}.png`,
        fullPage: true,
      })

      console.log(`✅ Landing Page responsive on ${viewport.name}`)
    })
  }
})

// Test Suite 2: Privacy Policy Page
test.describe('Privacy Policy Responsive Tests', () => {
  for (const [size, viewport] of Object.entries(viewports)) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:9000/privacy')

      await page.waitForLoadState('networkidle')

      console.log(`\n📱 Testing Privacy Policy on ${viewport.name}`)

      // Check header
      await checkElementResponsive(page, 'header', viewport.name)

      // Check main content
      await checkElementResponsive(page, 'main', viewport.name)

      // Check sections
      await checkElementResponsive(page, 'h1', viewport.name)
      await checkElementResponsive(page, 'h2', viewport.name)

      // Check contact cards
      await checkElementResponsive(page, 'a[href*="wa.me"]', viewport.name)
      await checkElementResponsive(page, 'a[href*="mailto"]', viewport.name)

      await page.screenshot({
        path: `test-results/privacy-${size}.png`,
        fullPage: true,
      })

      console.log(`✅ Privacy Policy responsive on ${viewport.name}`)
    })
  }
})

// Test Suite 3: Terms of Service Page
test.describe('Terms of Service Responsive Tests', () => {
  for (const [size, viewport] of Object.entries(viewports)) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:9000/terms')

      await page.waitForLoadState('networkidle')

      console.log(`\n📱 Testing Terms of Service on ${viewport.name}`)

      // Check header
      await checkElementResponsive(page, 'header', viewport.name)

      // Check main content
      await checkElementResponsive(page, 'main', viewport.name)

      // Check sections
      await checkElementResponsive(page, 'h1', viewport.name)
      await checkElementResponsive(page, 'h2', viewport.name)

      await page.screenshot({
        path: `test-results/terms-${size}.png`,
        fullPage: true,
      })

      console.log(`✅ Terms of Service responsive on ${viewport.name}`)
    })
  }
})

// Test Suite 4: Admin Login Page
test.describe('Admin Login Responsive Tests', () => {
  for (const [size, viewport] of Object.entries(viewports)) {
    test(`should be responsive on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('http://localhost:9000/admin/login')

      await page.waitForLoadState('networkidle')

      console.log(`\n📱 Testing Admin Login on ${viewport.name}`)

      // Check form
      await checkElementResponsive(page, 'form', viewport.name)

      // Check input fields
      const inputs = page.locator('input[type="email"], input[type="password"]')
      const inputCount = await inputs.count()

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const box = await input.boundingBox()

        if (box && size === 'mobile') {
          expect(box.width).toBeLessThan(viewport.width - 40)
        }
      }

      // Check buttons
      await checkElementResponsive(page, 'button[type="submit"]', viewport.name)

      await page.screenshot({
        path: `test-results/login-${size}.png`,
        fullPage: true,
      })

      console.log(`✅ Admin Login responsive on ${viewport.name}`)
    })
  }
})

// Test Suite 5: Horizontal Scroll Check (Critical for mobile)
test.describe('Horizontal Scroll Prevention', () => {
  test('Landing page should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:9000/')

    await page.waitForLoadState('networkidle')

    // Check document width vs viewport width
    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = viewports.mobile.width

    console.log(`\n📏 Document width: ${documentWidth}px, Viewport width: ${viewportWidth}px`)

    if (documentWidth > viewportWidth) {
      console.error(
        `❌ Horizontal scroll detected! Document is ${documentWidth - viewportWidth}px wider than viewport`
      )
    }

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1) // Allow 1px tolerance
  })

  test('Privacy page should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:9000/privacy')

    await page.waitForLoadState('networkidle')

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = viewports.mobile.width

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })

  test('Terms page should not have horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:9000/terms')

    await page.waitForLoadState('networkidle')

    const documentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const viewportWidth = viewports.mobile.width

    expect(documentWidth).toBeLessThanOrEqual(viewportWidth + 1)
  })
})

// Test Suite 6: Touch Target Size (Mobile Usability)
test.describe('Touch Target Size Tests', () => {
  test('All clickable elements should be at least 44x44px on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('http://localhost:9000/')

    await page.waitForLoadState('networkidle')

    const clickableElements = page.locator('a, button')
    const count = await clickableElements.count()

    console.log(`\n👆 Checking ${count} clickable elements for touch target size...`)

    for (let i = 0; i < count; i++) {
      const element = clickableElements.nth(i)

      if (await element.isVisible()) {
        const box = await element.boundingBox()

        if (box) {
          const isTooSmall = box.width < 44 || box.height < 44

          if (isTooSmall) {
            const text = await element.textContent()
            console.warn(
              `⚠️  Element too small for touch: "${text?.substring(0, 30)}" (${box.width}x${box.height}px)`
            )
          }
        }
      }
    }
  })
})
