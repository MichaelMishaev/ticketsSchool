import { test, expect } from '@playwright/test'

test.describe('Event Creation - Step Navigation Test', () => {
  test('should navigate through all 4 steps without triggering success screen', async ({ page }) => {
    // Navigate to the new-test event creation page
    await page.goto('http://localhost:3000/admin/events/new-test')

    console.log('Step 1: Checking initial page load...')
    await expect(page.locator('h1:has-text("יצירת אירוע חדש")')).toBeVisible()

    // Step 1: Fill Event Details
    console.log('Step 2: Filling event details (Step 1/4)...')
    await page.fill('input[id="gameType"]', 'כדורגל')
    await page.fill('input[id="title"]', 'משחק ידידות')
    await page.fill('textarea[id="description"]', 'משחק כדורגל ידידותי')
    await page.fill('input[id="location"]', 'מגרש ראשי')

    // Click Next to go to Step 2
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    console.log('Step 3: Now on Timing step (Step 2/4)...')
    // Verify we're on step 2 (Timing)
    await expect(page.locator('h2:has-text("תזמון")')).toBeVisible()

    // Fill start date/time
    await page.fill('input[type="date"]', '2025-12-01')
    await page.fill('input[type="time"]', '10:00')

    // Click Next to go to Step 3
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    console.log('Step 4: Now on Capacity step (Step 3/4)...')
    // Verify we're on step 3 (Capacity)
    await expect(page.locator('h2:has-text("מקומות")')).toBeVisible()

    // Capacity should have default values, click Next
    await page.click('button:has-text("המשך")')
    await page.waitForTimeout(500)

    console.log('Step 5: Now on Advanced step (Step 4/4)...')
    // Verify we're on step 4 (Advanced)
    await expect(page.locator('h2:has-text("מתקדם")')).toBeVisible()

    // Check if FieldBuilder is visible
    const fieldBuilderHeader = page.locator('h2:has-text("שדות נוספים להרשמה")')
    await expect(fieldBuilderHeader).toBeVisible()
    console.log('✅ FieldBuilder header is visible!')

    // Check if there's a success screen showing up prematurely
    const successOverlay = page.locator('text=האירוע נוצר בהצלחה')
    const isSuccessVisible = await successOverlay.isVisible().catch(() => false)

    if (isSuccessVisible) {
      console.error('❌ ERROR: Success screen appeared on step 4 without submitting!')
      throw new Error('Success screen should NOT appear until form is submitted')
    } else {
      console.log('✅ SUCCESS: No premature success screen on step 4')
    }

    // Verify submit button exists and is enabled
    const submitButton = page.locator('button[type="submit"]:has-text("צור אירוע")')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()
    console.log('✅ Submit button is visible and enabled')

    // Take a screenshot of step 4 for verification
    await page.screenshot({ path: 'playwright-report/step-4-advanced.png', fullPage: true })
    console.log('📸 Screenshot saved: step-4-advanced.png')
  })
})
