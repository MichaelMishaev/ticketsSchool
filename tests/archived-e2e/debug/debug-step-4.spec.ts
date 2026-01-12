import { test, expect } from '@playwright/test'

test.describe('Debug Step 4 Issue', () => {
  test('Navigate through all steps and debug step 4', async ({ page }) => {
    console.log('🚀 Starting test...')

    // Navigate to the new-test page
    await page.goto('http://localhost:9000/admin/events/new-test')
    await page.waitForLoadState('networkidle')

    console.log('✅ Page loaded')
    await page.screenshot({ path: 'playwright-report/00-initial-load.png', fullPage: true })

    // Verify we're on the right page
    const header = await page.locator('h1:has-text("יצירת אירוע חדש")').textContent()
    console.log('📝 Header:', header)

    // Check initial step
    const stepWizard = page.locator('[class*="flex"][class*="items-center"]').first()
    console.log('📍 Initial step indicator found')

    // ============ STEP 1: Details ============
    console.log('\n📋 STEP 1: Filling event details...')

    // Fill gameType (required)
    await page.locator('input#gameType').fill('כדורגל')
    console.log('✅ Game type filled')

    // Fill title (required)
    await page.locator('input#title').fill('משחק ידידות')
    console.log('✅ Title filled')

    // Fill description
    await page.locator('textarea#description').fill('משחק כדורגל ידידותי')
    console.log('✅ Description filled')

    // Fill location
    await page.locator('input#location').fill('מגרש ראשי')
    console.log('✅ Location filled')

    await page.screenshot({ path: 'playwright-report/01-step-1-filled.png', fullPage: true })

    // Click המשך (Continue) button
    await page.locator('button:has-text("המשך")').click()
    await page.waitForTimeout(1000)
    console.log('✅ Clicked המשך - moved to step 2')

    await page.screenshot({ path: 'playwright-report/02-step-2-timing.png', fullPage: true })

    // ============ STEP 2: Timing ============
    console.log('\n⏰ STEP 2: Filling timing...')

    // Fill start date
    const dateInput = page.locator('input[type="date"]').first()
    await dateInput.fill('2025-12-15')
    console.log('✅ Date filled')

    // Fill start time
    const timeInput = page.locator('input[type="time"]').first()
    await timeInput.fill('10:00')
    console.log('✅ Time filled')

    await page.waitForTimeout(500)
    await page.screenshot({ path: 'playwright-report/03-step-2-filled.png', fullPage: true })

    // Click המשך
    await page.locator('button:has-text("המשך")').click()
    await page.waitForTimeout(1000)
    console.log('✅ Clicked המשך - moved to step 3')

    await page.screenshot({ path: 'playwright-report/04-step-3-capacity.png', fullPage: true })

    // ============ STEP 3: Capacity ============
    console.log('\n👥 STEP 3: Capacity (using defaults)...')

    // Check capacity value
    const capacityInput = page.locator('input#capacity')
    const capacityValue = await capacityInput.inputValue()
    console.log('📊 Capacity:', capacityValue)

    const maxSpotsInput = page.locator('input#maxSpotsPerPerson')
    const maxSpotsValue = await maxSpotsInput.inputValue()
    console.log('📊 Max spots per person:', maxSpotsValue)

    await page.screenshot({ path: 'playwright-report/05-step-3-ready.png', fullPage: true })

    // Click המשך
    const continueButton = page.locator('button:has-text("המשך")')
    const isVisible = await continueButton.isVisible()
    console.log('👁️ המשך button visible:', isVisible)

    if (isVisible) {
      await continueButton.click()
      await page.waitForTimeout(1000)
      console.log('✅ Clicked המשך - should be on step 4')

      await page.screenshot({ path: 'playwright-report/06-after-step-3-click.png', fullPage: true })

      // ============ CHECK STEP 4 ============
      console.log('\n🔍 CHECKING STEP 4...')

      // Look for step 4 indicators
      const fieldBuilderHeader = page.locator('h2:has-text("שדות נוספים להרשמה")')
      const isFieldBuilderVisible = await fieldBuilderHeader.isVisible().catch(() => false)
      console.log('📝 FieldBuilder header visible:', isFieldBuilderVisible)

      const conditionsHeader = page.locator('h2:has-text("תנאים והגבלות")')
      const isConditionsVisible = await conditionsHeader.isVisible().catch(() => false)
      console.log('📋 Conditions header visible:', isConditionsVisible)

      const submitButton = page.locator('button:has-text("צור אירוע")')
      const isSubmitVisible = await submitButton.isVisible().catch(() => false)
      console.log('🚀 Submit button visible:', isSubmitVisible)

      const successScreen = page.locator('text=האירוע נוצר בהצלחה')
      const isSuccessVisible = await successScreen.isVisible().catch(() => false)
      console.log('✅ Success screen visible:', isSuccessVisible)

      if (isSuccessVisible) {
        console.error('❌ ERROR: Success screen appeared prematurely!')
        await page.screenshot({
          path: 'playwright-report/07-ERROR-premature-success.png',
          fullPage: true,
        })
      } else if (isFieldBuilderVisible || isConditionsVisible || isSubmitVisible) {
        console.log('✅ SUCCESS: Step 4 is showing correctly!')
        await page.screenshot({ path: 'playwright-report/07-SUCCESS-step-4.png', fullPage: true })
      } else {
        console.error('❌ ERROR: Step 4 content not found!')
        await page.screenshot({ path: 'playwright-report/07-ERROR-no-step-4.png', fullPage: true })

        // Debug: Get page content
        const bodyText = await page.locator('body').textContent()
        console.log('📄 Page content (first 500 chars):', bodyText?.substring(0, 500))
      }
    } else {
      console.error('❌ ERROR: המשך button not visible on step 3!')

      // Check if submit button appeared instead
      const submitButton = page.locator('button:has-text("צור אירוע")')
      const isSubmitVisible = await submitButton.isVisible().catch(() => false)
      console.log('🚀 Submit button visible instead:', isSubmitVisible)

      await page.screenshot({
        path: 'playwright-report/06-ERROR-no-continue-button.png',
        fullPage: true,
      })
    }

    console.log('\n✅ Test completed - check screenshots in playwright-report/')
  })
})
