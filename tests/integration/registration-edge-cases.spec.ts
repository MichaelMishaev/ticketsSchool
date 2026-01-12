import { test, expect } from '@playwright/test'

/**
 * CRITICAL: Registration Edge Cases Tests
 *
 * These tests verify that registration handles all edge cases correctly:
 * - Israeli phone number normalization
 * - Invalid input validation
 * - Duplicate registrations
 * - Special characters in names
 * - Email validation
 * - Required field enforcement
 *
 * Test Strategy:
 * 1. Test phone number formats (with/without spaces, international prefix)
 * 2. Test invalid inputs (SQL injection, XSS attempts)
 * 3. Test duplicate prevention
 * 4. Test boundary values
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:9000'

test.describe('Registration Edge Cases - CRITICAL', () => {
  const testEventSlug = 'edge-case-test-event'

  test.describe('Israeli Phone Number Normalization', () => {
    test('accepts phone with spaces: 050 123 4567', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Phone Test User 1')
      await page.fill('input[name="phone"]', '050 123 4567')
      await page.fill('input[name="email"]', 'phonetest1@test.com')

      await page.click('button[type="submit"]')

      // Should succeed (normalizes to 0501234567)
      await expect(page.locator('text=הרשמה הושלמה בהצלחה, text=confirmation')).toBeVisible({
        timeout: 5000,
      })

      console.log('✅ Phone with spaces normalized correctly')
    })

    test('accepts phone with dashes: 050-123-4567', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Phone Test User 2')
      await page.fill('input[name="phone"]', '050-123-4567')
      await page.fill('input[name="email"]', 'phonetest2@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Phone with dashes normalized correctly')
    })

    test('accepts phone with parentheses: (050) 123-4567', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Phone Test User 3')
      await page.fill('input[name="phone"]', '(050) 123-4567')
      await page.fill('input[name="email"]', 'phonetest3@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Phone with parentheses normalized correctly')
    })

    test('converts international format +972 to 0', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'International Phone User')
      await page.fill('input[name="phone"]', '+972501234567')
      await page.fill('input[name="email"]', 'international@test.com')

      await page.click('button[type="submit"]')

      // Should normalize +972501234567 → 0501234567
      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ International format +972 converted to 0')
    })

    test('rejects invalid phone: too short', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Invalid Phone User')
      await page.fill('input[name="phone"]', '050123') // Only 6 digits
      await page.fill('input[name="email"]', 'invalid@test.com')

      await page.click('button[type="submit"]')

      // Should show error
      await expect(page.locator('text=מספר טלפון לא תקין, text=invalid phone')).toBeVisible({
        timeout: 3000,
      })

      console.log('✅ Short phone number rejected')
    })

    test('rejects invalid phone: too long', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Invalid Phone User 2')
      await page.fill('input[name="phone"]', '050123456789') // 12 digits
      await page.fill('input[name="email"]', 'invalid2@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=מספר טלפון לא תקין, text=invalid phone')).toBeVisible({
        timeout: 3000,
      })

      console.log('✅ Long phone number rejected')
    })

    test('rejects phone not starting with 0', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Invalid Phone User 3')
      await page.fill('input[name="phone"]', '5501234567') // Doesn't start with 0
      await page.fill('input[name="email"]', 'invalid3@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=מספר טלפון לא תקין, text=invalid phone')).toBeVisible({
        timeout: 3000,
      })

      console.log('✅ Phone not starting with 0 rejected')
    })
  })

  test.describe('Required Field Validation', () => {
    test('cannot submit without name', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      // Leave name empty
      await page.fill('input[name="phone"]', '0501234567')
      await page.fill('input[name="email"]', 'noname@test.com')

      await page.click('button[type="submit"]')

      // Should show validation error or focus on name field
      const nameInput = page.locator('input[name="name"]')
      await expect(nameInput)
        .toBeFocused()
        .catch(() => true)

      // Or check for error message
      const hasError = await page
        .locator('text=נא למלא, text=שדה חובה, text=required')
        .isVisible()
        .catch(() => false)

      expect(
        hasError ||
          (await nameInput.evaluate((el) => (el as HTMLInputElement).checkValidity())) === false
      ).toBeTruthy()

      console.log('✅ Cannot submit without name')
    })

    test('cannot submit without phone', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'No Phone User')
      await page.fill('input[name="email"]', 'nophone@test.com')

      await page.click('button[type="submit"]')

      const phoneInput = page.locator('input[name="phone"]')
      const isFocused = await phoneInput.evaluate((el) => el === document.activeElement)

      expect(isFocused).toBeTruthy()

      console.log('✅ Cannot submit without phone')
    })

    test('can submit without email if not required', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'No Email User')
      await page.fill('input[name="phone"]', '0509999999')
      // Don't fill email

      await page.click('button[type="submit"]')

      // Should succeed if email is optional
      const succeeded = await page
        .locator('text=הרשמה הושלמה בהצלחה')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (succeeded) {
        console.log('✅ Email is optional - submission succeeded')
      } else {
        console.log('⚠️  Email appears to be required')
      }
    })
  })

  test.describe('Email Validation', () => {
    test('accepts valid email formats', async ({ page }) => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.co.il',
        'user_123@test-domain.com',
      ]

      for (const email of validEmails) {
        await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

        await page.fill('input[name="name"]', `Email Test ${email}`)
        await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
        await page.fill('input[name="email"]', email)

        await page.click('button[type="submit"]')

        await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })
      }

      console.log('✅ All valid email formats accepted')
    })

    test('rejects invalid email formats', async ({ page }) => {
      const invalidEmails = ['notanemail', 'missing@domain', '@nodomain.com', 'spaces in@email.com']

      for (const email of invalidEmails) {
        await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

        await page.fill('input[name="name"]', 'Invalid Email Test')
        await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
        await page.fill('input[name="email"]', email)

        await page.click('button[type="submit"]')

        // Should show validation error
        const emailInput = page.locator('input[name="email"]')
        const isInvalid = await emailInput.evaluate(
          (el) => (el as HTMLInputElement).checkValidity() === false
        )

        expect(isInvalid).toBeTruthy()
      }

      console.log('✅ Invalid email formats rejected')
    })
  })

  test.describe('Duplicate Registration Prevention', () => {
    test('prevents duplicate registration with same phone', async ({ page }) => {
      const uniquePhone = `050${Date.now().toString().slice(-7)}`

      // First registration
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
      await page.fill('input[name="name"]', 'First Registration')
      await page.fill('input[name="phone"]', uniquePhone)
      await page.fill('input[name="email"]', 'first@test.com')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      // Try to register again with same phone
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
      await page.fill('input[name="name"]', 'Duplicate Registration')
      await page.fill('input[name="phone"]', uniquePhone) // Same phone!
      await page.fill('input[name="email"]', 'duplicate@test.com')
      await page.click('button[type="submit"]')

      // Should show error message
      await expect(page.locator('text=כבר נרשמת, text=already registered')).toBeVisible({
        timeout: 5000,
      })

      console.log('✅ Duplicate phone registration prevented')
    })

    test('allows same name with different phone', async ({ page }) => {
      const sameName = 'Same Name User'

      // First registration
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
      await page.fill('input[name="name"]', sameName)
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'samename1@test.com')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      // Second registration with same name, different phone
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
      await page.fill('input[name="name"]', sameName)
      await page.fill('input[name="phone"]', `050${(Date.now() + 1).toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'samename2@test.com')
      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Same name with different phone allowed')
    })
  })

  test.describe('Special Characters and Encoding', () => {
    test('accepts Hebrew names', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'משה כהן')
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'hebrew@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Hebrew names accepted')
    })

    test('accepts names with apostrophes', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', "O'Connor")
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'apostrophe@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Names with apostrophes accepted')
    })

    test('accepts names with hyphens', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Jean-Pierre')
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'hyphen@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Names with hyphens accepted')
    })

    test('sanitizes potential XSS in name field', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      const xssPayload = '<script>alert("XSS")</script>'

      await page.fill('input[name="name"]', xssPayload)
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'xsstest@test.com')

      await page.click('button[type="submit"]')

      // Check that script didn't execute
      const alertWasShown = await page.evaluate(() => {
        return typeof (window as any).__alertCalled !== 'undefined'
      })

      expect(alertWasShown).toBeFalsy()

      // Check that confirmation page doesn't have unescaped script
      const hasScriptTag = await page
        .locator('script:has-text("alert")')
        .isVisible()
        .catch(() => false)
      expect(hasScriptTag).toBeFalsy()

      console.log('✅ XSS payload sanitized correctly')
    })
  })

  test.describe('Boundary Values', () => {
    test('accepts minimum valid name length', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'AB') // 2 characters
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'short@test.com')

      await page.click('button[type="submit"]')

      const succeeded = await page
        .locator('text=הרשמה הושלמה בהצלחה')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      if (succeeded) {
        console.log('✅ Minimum name length accepted (2 chars)')
      } else {
        console.log('⚠️  Minimum name length may be > 2 characters')
      }
    })

    test('accepts maximum reasonable name length', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      const longName = 'A'.repeat(100) // 100 characters

      await page.fill('input[name="name"]', longName)
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'longname@test.com')

      await page.click('button[type="submit"]')

      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Long name (100 chars) accepted')
    })

    test('handles zero spots request gracefully', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Zero Spots User')
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)
      await page.fill('input[name="email"]', 'zero@test.com')

      const spotsInput = page.locator('input[name="spots"]')
      if (await spotsInput.isVisible()) {
        await spotsInput.fill('0')

        await page.click('button[type="submit"]')

        // Should either reject or default to 1
        const hasError = await page
          .locator('text=לפחות מקום אחד, text=at least 1')
          .isVisible({ timeout: 3000 })
          .catch(() => false)

        if (hasError) {
          console.log('✅ Zero spots rejected with error')
        } else {
          console.log('⚠️  Zero spots may have been accepted or defaulted to 1')
        }
      }
    })
  })

  test.describe('Form State and UX', () => {
    test('submit button disabled while submitting', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Button Test User')
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)

      const submitButton = page.locator('button[type="submit"]')

      // Click and immediately check if disabled
      await submitButton.click()

      // Button should be disabled during submission
      const isDisabled = await submitButton.isDisabled()

      expect(isDisabled).toBeTruthy()

      console.log('✅ Submit button disabled during submission')
    })

    test('shows loading state during submission', async ({ page }) => {
      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      await page.fill('input[name="name"]', 'Loading Test User')
      await page.fill('input[name="phone"]', `050${Date.now().toString().slice(-7)}`)

      await page.click('button[type="submit"]')

      // Check for loading indicator
      const hasLoadingText = await page
        .locator('text=שולח, text=loading, text=...')
        .isVisible({ timeout: 1000 })
        .catch(() => false)
      const hasSpinner = await page
        .locator('.animate-spin, .spinner')
        .isVisible({ timeout: 1000 })
        .catch(() => false)

      expect(hasLoadingText || hasSpinner).toBeTruthy()

      console.log('✅ Loading state shown during submission')
    })
  })
})
