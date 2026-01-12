import { test, expect } from '@playwright/test'

test.describe('Debug Step 4 Issue (With Auth)', () => {
  test('Login and navigate through all steps', async ({ page }) => {
    console.log('🚀 Starting test with authentication...')

    // Step 1: Login first
    console.log('🔐 Logging in...')
    await page.goto('http://localhost:9000/admin/login')
    await page.waitForLoadState('networkidle')

    // Fill in login credentials (you'll need to provide actual credentials)
    const emailInput = page.locator('input[type="email"]')
    const passwordInput = page.locator('input[type="password"]')

    if (await emailInput.isVisible()) {
      // Replace with actual test credentials
      await emailInput.fill('admin@test.com')
      await passwordInput.fill('password123')
      await page.locator('button[type="submit"]').click()
      await page.waitForTimeout(2000)
      console.log('✅ Login attempted')
    } else {
      console.log('⚠️ Login form not found - may already be logged in or auth disabled')
    }

    // Step 2: Navigate to the new-test page
    await page.goto('http://localhost:9000/admin/events/new-test')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)

    console.log('✅ Page loaded')
    await page.screenshot({ path: 'playwright-report/00-initial-load.png', fullPage: true })

    // Verify we're on the right page
    const header = page.locator('h1')
    const headerText = await header.textContent().catch(() => '')
    console.log('📝 Header:', headerText)

    // Check if we're still on login page
    if (headerText?.includes('כניסה') || headerText?.includes('התחברות')) {
      console.error('❌ Still on login page - authentication failed!')
      await page.screenshot({ path: 'playwright-report/ERROR-auth-failed.png', fullPage: true })
      return
    }

    // ============ STEP 1: Details ============
    console.log('\n📋 STEP 1: Filling event details...')

    await page.waitForSelector('input#gameType', { timeout: 5000 })

    await page.locator('input#gameType').fill('כדורגל')
    console.log('✅ Game type filled')

    await page.locator('input#title').fill('משחק ידידות')
    console.log('✅ Title filled')

    await page.locator('textarea#description').fill('משחק כדורגל ידידותי')
    console.log('✅ Description filled')

    await page.locator('input#location').fill('מגרש ראשי')
    console.log('✅ Location filled')

    await page.screenshot({ path: 'playwright-report/01-step-1-filled.png', fullPage: true })

    // Click המשך
    await page.locator('button:has-text("המשך")').click()
    await page.waitForTimeout(1000)
    console.log('✅ Moved to step 2')

    await page.screenshot({ path: 'playwright-report/02-step-2-timing.png', fullPage: true })

    // ============ STEP 2: Timing ============
    console.log('\n⏰ STEP 2: Filling timing...')

    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill('2025-12-15')
    console.log('✅ Date filled')

    const timeInput = page.locator('input[type="time"]').first()
    await timeInput.fill('10:00')
    console.log('✅ Time filled')

    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-report/03-step-2-filled.png', fullPage: true })

    // Click המשך
    await page.locator('button:has-text("המשך")').click()
    await page.waitForTimeout(1000)
    console.log('✅ Moved to step 3')

    await page.screenshot({ path: 'playwright-report/04-step-3-capacity.png', fullPage: true })

    // ============ STEP 3: Capacity ============
    console.log('\n👥 STEP 3: Capacity...')

    const capacityValue = await page.locator('input#capacity').inputValue()
    console.log('📊 Capacity:', capacityValue)

    const maxSpotsValue = await page.locator('input#maxSpotsPerPerson').inputValue()
    console.log('📊 Max spots per person:', maxSpotsValue)

    await page.screenshot({ path: 'playwright-report/05-step-3-ready.png', fullPage: true })

    // Click המשך
    const continueButton = page.locator('button:has-text("המשך")')
    const continueButtonCount = await continueButton.count()
    console.log('🔍 Number of המשך buttons found:', continueButtonCount)

    if (continueButtonCount > 0) {
      await continueButton.click()
      await page.waitForTimeout(1500)
      console.log('✅ Clicked המשך - should be on step 4')

      await page.screenshot({ path: 'playwright-report/06-after-step-3-click.png', fullPage: true })

      // ============ CHECK STEP 4 ============
      console.log('\n🔍 CHECKING STEP 4...')

      // Look for step 4 content
      const fieldBuilderHeader = page.locator('h2:has-text("שדות נוספים להרשמה")')
      const fieldBuilderVisible = await fieldBuilderHeader.isVisible().catch(() => false)
      console.log('📝 FieldBuilder header visible:', fieldBuilderVisible)

      const conditionsHeader = page.locator('h2:has-text("תנאים והגבלות")')
      const conditionsVisible = await conditionsHeader.isVisible().catch(() => false)
      console.log('📋 Conditions header visible:', conditionsVisible)

      const submitButton = page.locator('button:has-text("צור אירוע")')
      const submitVisible = await submitButton.isVisible().catch(() => false)
      console.log('🚀 Submit button visible:', submitVisible)

      const successScreen = page.locator('text=האירוע נוצר בהצלחה')
      const successVisible = await successScreen.isVisible().catch(() => false)
      console.log('⚠️ Success screen visible (should be false):', successVisible)

      if (successVisible) {
        console.error('❌ ERROR: Success screen appeared without submitting!')
        await page.screenshot({
          path: 'playwright-report/07-ERROR-premature-success.png',
          fullPage: true,
        })
      } else if (fieldBuilderVisible || conditionsVisible || submitVisible) {
        console.log('✅ SUCCESS: Step 4 is showing correctly!')
        await page.screenshot({ path: 'playwright-report/07-SUCCESS-step-4.png', fullPage: true })

        // Get full page HTML for inspection
        const bodyHTML = await page.locator('body').innerHTML()
        console.log('\n📄 Page HTML length:', bodyHTML.length, 'characters')

        // Count sections on step 4
        const sections = await page.locator('[class*="bg-white"][class*="shadow"]').count()
        console.log('📦 Number of card sections:', sections)
      } else {
        console.error('❌ ERROR: Step 4 content not visible!')
        await page.screenshot({
          path: 'playwright-report/07-ERROR-no-step-4-content.png',
          fullPage: true,
        })

        // Debug info
        const allH2 = await page.locator('h2').allTextContents()
        console.log('📝 All H2 headers on page:', allH2)

        const allButtons = await page.locator('button').allTextContents()
        console.log('🔘 All buttons on page:', allButtons)
      }
    } else {
      console.error('❌ ERROR: No המשך button found on step 3!')
      await page.screenshot({
        path: 'playwright-report/06-ERROR-no-continue-button.png',
        fullPage: true,
      })

      // Check what buttons are available
      const allButtons = await page.locator('button').allTextContents()
      console.log('🔘 All buttons on page:', allButtons)
    }

    console.log('\n✅ Test completed - check screenshots in playwright-report/')
  })
})
