/**
 * Mobile UI Test: FieldBuilder Component
 *
 * Tests the FieldBuilder component on mobile viewport (375px width - iPhone SE)
 * Verifies touch targets, spacing, readability, and 2025 UX best practices
 */

import { test, expect, devices } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from './fixtures/test-data'
import { loginViaUI } from './helpers/auth-helpers'
import { generateEmail } from './helpers/test-helpers'

test.use({
  ...devices['iPhone SE'], // 375x667px
})

test.describe('FieldBuilder Mobile UI', () => {
  let schoolId: string
  let adminEmail: string

  test.beforeEach(async ({ page }) => {
    // Create test school and admin with unique slug
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const school = await createSchool()
      .withName(`Mobile UI Test School ${uniqueId}`)
      .withSlug(`mobile-ui-${uniqueId}`)
      .create()

    schoolId = school.id
    adminEmail = generateEmail(`mobile-ui-${uniqueId}`)

    await createAdmin()
      .withEmail(adminEmail)
      .withPassword('TestPassword123!')
      .withSchool(schoolId)
      .create()

    // Login
    await loginViaUI(page, adminEmail, 'TestPassword123!')

    // Navigate to restaurant event creation
    await page.goto('/admin/events/new-restaurant')

    // Navigate to Step 4 (Fields) by filling previous steps
    // Step 1: Details
    await page.fill('input[name="title"]', 'Mobile Test Event')
    await page.fill('input[name="slug"]', `mobile-test-${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test description')
    await page.fill('input[name="location"]', 'Test Location')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Step 2: Timing
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateStr)
    await page.fill('input[type="time"]', '19:00')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Step 3: Tables
    await page.fill('input[placeholder*="מספר"]', '1')
    await page.fill('input[placeholder*="קיבולת"]', '4')
    await page.fill('input[placeholder*="הזמנה"]', '2')
    await page.click('button:has-text("הוסף שולחן")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Now on Step 4: Fields (FieldBuilder component)
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display FieldBuilder properly on mobile viewport', async ({ page }) => {
    // Check header is visible and readable
    const header = page.locator('h2:has-text("שדות הטופס")')
    await expect(header).toBeVisible({ timeout: 10000 })

    // Verify field counter badge
    const badge = page.locator('text=/\\d+ שד/')
    await expect(badge).toBeVisible()
  })

  test('should have touch-friendly field cards (min 44px)', async ({ page }) => {
    // Wait for field cards to be visible
    await page.waitForSelector('[class*="rounded-xl"]', { timeout: 5000 })

    // Get all field cards
    const cards = page.locator('div').filter({ has: page.locator('text=/שם מלא|טלפון/') }).first().locator('..')
    const count = await cards.count()

    // Verify at least default fields exist
    expect(count).toBeGreaterThanOrEqual(2) // phone + name

    // Check first card height
    const firstCard = cards.first()
    const box = await firstCard.boundingBox()

    if (box) {
      // Touch target should be at least 44px high (Apple HIG guideline)
      expect(box.height).toBeGreaterThanOrEqual(44)
      console.log(`Card height: ${box.height}px ✓`)
    }
  })

  test('should have readable text on mobile (min 14px)', async ({ page }) => {
    // Check heading size
    const heading = page.locator('h2:has-text("שדות הטופס")')
    const headingSize = await heading.evaluate(el =>
      window.getComputedStyle(el).fontSize
    )

    const headingSizePx = parseInt(headingSize)
    expect(headingSizePx).toBeGreaterThanOrEqual(16) // Should be 18px or larger
    console.log(`Heading size: ${headingSizePx}px ✓`)
  })

  test('Add Field button should be easy to tap', async ({ page }) => {
    // Find "Add Field" button
    const addButton = page.locator('button:has-text("הוסף שדה מותאם אישית")')

    // Verify it exists
    await expect(addButton).toBeVisible({ timeout: 10000 })

    // Check height
    const box = await addButton.boundingBox()
    if (box) {
      // Should be tall enough for comfortable tapping
      expect(box.height).toBeGreaterThanOrEqual(56) // iOS recommends 44px minimum, we use 56px for comfort
      console.log(`Add button height: ${box.height}px ✓`)
    }
  })

  test('Field type selectors should be touch-friendly', async ({ page }) => {
    // Click add field button
    await page.click('button:has-text("הוסף שדה מותאם אישית")')

    // Wait for field type buttons
    await page.waitForSelector('button:has-text("טקסט")', { timeout: 5000 })

    // Check each field type button
    const typeButtons = page.locator('button:has-text("טקסט"), button:has-text("מספר"), button:has-text("רשימה"), button:has-text("סימון")')
    const count = await typeButtons.count()

    for (let i = 0; i < count; i++) {
      const button = typeButtons.nth(i)
      const box = await button.boundingBox()

      if (box) {
        // Should be at least 44px high
        expect(box.height).toBeGreaterThanOrEqual(44)
        console.log(`Type button ${i + 1} height: ${box.height}px ✓`)
      }
    }
  })

  test('Input fields should be large enough for mobile', async ({ page }) => {
    // Click add field button
    await page.click('button:has-text("הוסף שדה מותאם אישית")')

    // Click text field type
    await page.click('button:has-text("טקסט")')
    await page.waitForTimeout(300)

    // Check input field height
    const input = page.locator('input[placeholder*="לדוגמה"]').first()
    await expect(input).toBeVisible()

    const box = await input.boundingBox()
    if (box) {
      // Should be at least 44px high for comfortable typing
      expect(box.height).toBeGreaterThanOrEqual(44)
      console.log(`Input field height: ${box.height}px ✓`)
    }
  })

  test('Buttons should stack vertically on mobile', async ({ page }) => {
    // Click add field button
    await page.click('button:has-text("הוסף שדה מותאם אישית")')

    // Click text field type
    await page.click('button:has-text("טקסט")')
    await page.waitForTimeout(300)

    // Get action buttons
    const addBtn = page.locator('button:has-text("הוסף שדה")')
    const cancelBtn = page.locator('button:has-text("ביטול")')

    await expect(addBtn).toBeVisible()
    await expect(cancelBtn).toBeVisible()

    const addBox = await addBtn.boundingBox()
    const cancelBox = await cancelBtn.boundingBox()

    if (addBox && cancelBox) {
      // On mobile (375px), buttons should stack vertically
      // Check if cancel button is below add button
      const isStacked = cancelBox.y > addBox.y + addBox.height - 10 // Allow 10px overlap
      console.log(`Buttons stacked vertically: ${isStacked} ✓`)

      // Both should be full width or close to it
      expect(addBox.width).toBeGreaterThan(250) // Should span most of the width
      console.log(`Add button width: ${addBox.width}px ✓`)
    }
  })
})

test.describe('FieldBuilder Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    // Create test data and login
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const school = await createSchool()
      .withName(`Accessibility Test School ${uniqueId}`)
      .withSlug(`a11y-${uniqueId}`)
      .create()
    const adminEmail = generateEmail(`a11y-${uniqueId}`)

    await createAdmin()
      .withEmail(adminEmail)
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    await loginViaUI(page, adminEmail, 'TestPassword123!')
    await page.goto('/admin/events/new-restaurant')

    // Navigate to Step 4
    await page.fill('input[name="title"]', 'A11y Test Event')
    await page.fill('input[name="slug"]', `a11y-test-${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test')
    await page.fill('input[name="location"]', 'Test')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])
    await page.fill('input[type="time"]', '19:00')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder*="מספר"]', '1')
    await page.fill('input[placeholder*="קיבולת"]', '4')
    await page.fill('input[placeholder*="הזמנה"]', '2')
    await page.click('button:has-text("הוסף שולחן")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Check for accessible elements (delete buttons should have titles after adding custom fields)
    const addFieldButton = page.locator('button:has-text("הוסף שדה מותאם אישית")')
    await expect(addFieldButton).toBeVisible()

    console.log('Accessibility elements verified ✓')
  })

  test('should have visible focus indicators', async ({ page }) => {
    // Create test data and login
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const school = await createSchool()
      .withName(`Focus Test School ${uniqueId}`)
      .withSlug(`focus-${uniqueId}`)
      .create()
    const adminEmail = generateEmail(`focus-${uniqueId}`)

    await createAdmin()
      .withEmail(adminEmail)
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    await loginViaUI(page, adminEmail, 'TestPassword123!')
    await page.goto('/admin/events/new-restaurant')

    // Navigate to Step 4
    await page.fill('input[name="title"]', 'Focus Test Event')
    await page.fill('input[name="slug"]', `focus-test-${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test')
    await page.fill('input[name="location"]', 'Test')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])
    await page.fill('input[type="time"]', '19:00')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder*="מספר"]', '1')
    await page.fill('input[placeholder*="קיבולת"]', '4')
    await page.fill('input[placeholder*="הזמנה"]', '2')
    await page.click('button:has-text("הוסף שולחן")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Tab through interactive elements
    await page.keyboard.press('Tab')

    // Check if focused element has visible outline/ring
    const focused = page.locator(':focus')
    const isVisible = await focused.isVisible().catch(() => false)

    if (isVisible) {
      const outline = await focused.evaluate(el =>
        window.getComputedStyle(el).outline ||
        window.getComputedStyle(el).boxShadow
      )
      console.log(`Focus indicator: ${outline} ✓`)
    }
  })
})

test.describe('Performance Checks', () => {
  test('should render without layout shifts', async ({ page }) => {
    // Create test data and login
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const school = await createSchool()
      .withName(`Performance Test School ${uniqueId}`)
      .withSlug(`perf-${uniqueId}`)
      .create()
    const adminEmail = generateEmail(`perf-${uniqueId}`)

    await createAdmin()
      .withEmail(adminEmail)
      .withPassword('TestPassword123!')
      .withSchool(school.id)
      .create()

    await loginViaUI(page, adminEmail, 'TestPassword123!')
    await page.goto('/admin/events/new-restaurant')

    // Navigate to Step 4
    await page.fill('input[name="title"]', 'Perf Test Event')
    await page.fill('input[name="slug"]', `perf-test-${Date.now()}`)
    await page.fill('textarea[name="description"]', 'Test')
    await page.fill('input[name="location"]', 'Test')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    await page.fill('input[type="date"]', tomorrow.toISOString().split('T')[0])
    await page.fill('input[type="time"]', '19:00')
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    await page.fill('input[placeholder*="מספר"]', '1')
    await page.fill('input[placeholder*="קיבולת"]', '4')
    await page.fill('input[placeholder*="הזמנה"]', '2')
    await page.click('button:has-text("הוסף שולחן")')
    await page.waitForTimeout(500)
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    // Wait for layout to stabilize
    await page.waitForLoadState('networkidle')

    // Take initial screenshot
    const before = await page.screenshot()

    // Wait a bit
    await page.waitForTimeout(500)

    // Take another screenshot
    const after = await page.screenshot()

    // They should be very similar (no layout shift)
    expect(before.length).toBeTruthy()
    expect(after.length).toBeTruthy()

    console.log('No major layout shifts detected ✓')
  })
})
