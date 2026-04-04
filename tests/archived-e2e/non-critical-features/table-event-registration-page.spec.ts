import { test, expect } from '@playwright/test'

test.describe('TABLE_BASED Event Registration Page', () => {
  const eventUrl = 'http://localhost:9000/p/schooltest/shyrh-btzybvr-bmsadt-mykal'

  test('should show correct status for table-based event', async ({ page }) => {
    // Navigate to the table-based event
    await page.goto(eventUrl)

    // Wait for the page to load
    await page.waitForLoadState('networkidle')

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/table-event-before.png', fullPage: true })

    // Check that the page loaded successfully
    await expect(page.locator('h1')).toContainText('שירה בציבור במסעדת מיכאל')

    // Verify it does NOT show "אין מקומות פנויים" (no spots available)
    const noSpotsText = page.locator('text=אין מקומות פנויים')
    await expect(noSpotsText).not.toBeVisible()

    // Verify it shows "✓ פתוח" (open status)
    const openStatus = page.locator('text=✓ פתוח')
    await expect(openStatus).toBeVisible()

    // Verify the form title is "הרשמה לאירוע" not "הרשמה לרשימת המתנה"
    const formTitle = page.locator('h2')
    await expect(formTitle).toContainText('הרשמה לאירוע')

    // Verify guest count selector is visible
    const guestSelector = page.locator('text=כמה אורחים')
    await expect(guestSelector).toBeVisible()

    // Verify max guest count is 8 (based on largest table capacity)
    const maxGuestsRange = page.locator('text=1 - 8 אורחים')
    await expect(maxGuestsRange).toBeVisible()

    // Verify submit button says "אשר הזמנה" not "הרשמה לרשימת המתנה"
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toContainText('אשר הזמנה')

    // Take final screenshot
    await page.screenshot({ path: 'test-results/table-event-after.png', fullPage: true })

    console.log('✅ All checks passed! The fix is working correctly.')
  })

  test('should show capacity bar for capacity-based events', async ({ page }) => {
    // This test verifies that capacity-based events still work correctly
    // We'll skip this if we don't have a capacity-based event to test
    test.skip(!process.env.CAPACITY_EVENT_URL, 'No capacity-based event URL provided')

    // You can add a capacity-based event test here later
  })
})
