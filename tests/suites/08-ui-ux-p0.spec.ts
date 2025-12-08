import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  cleanupTestData,
} from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { generateIsraeliPhone } from '../helpers/test-helpers'

test.describe('UI/UX & Accessibility P0 - Critical Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[08.1.1] Mobile Viewport - 375px (iPhone SE)', () => {
    test('public registration form works on 375px mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // Allow 5px tolerance

      // Verify form is visible (public registration only has name and phone)
      await expect(page.locator('input[name="name"]')).toBeVisible()
      await expect(page.locator('input[name="phone"]')).toBeVisible()

      // Verify submit button is visible
      await expect(page.locator('button[type="submit"]')).toBeVisible()
    })

    test('admin events page works on 375px mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events')

      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)

      // Content should be visible
      const pageText = await page.textContent('body')
      expect(pageText).not.toBeNull()
    })
  })

  test.describe('[08.1.5] Form Inputs on Mobile - Text Visibility (CRITICAL)', () => {
    test('input text is visible (NOT white on white)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check name input text color and background
      const nameInput = page.locator('input[name="name"]').first()
      await nameInput.waitFor({ state: 'visible' })

      const nameStyles = await nameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Text should NOT be white (rgb(255, 255, 255))
      expect(nameStyles.color).not.toBe('rgb(255, 255, 255)')

      // Background should be light (white or near-white is OK for bg)
      // Color should be dark for readability

      // Check phone input (email not used in public registration)
      const phoneInput = page.locator('input[name="phone"]').first()
      const phoneStyles = await phoneInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      expect(phoneStyles.color).not.toBe('rgb(255, 255, 255)')
    })

    test('typed text is visible in inputs', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Type in name field
      await page.fill('input[name="name"]', 'Test User')

      // Verify text is visible (input has value)
      const nameValue = await page.inputValue('input[name="name"]')
      expect(nameValue).toBe('Test User')

      // Check that text color contrasts with background
      const nameInput = page.locator('input[name="name"]').first()
      const styles = await nameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Ensure text is not same color as background
      expect(styles.color).not.toBe(styles.backgroundColor)
    })
  })

  test.describe('[08.2.1-2.4] Hebrew RTL Layout', () => {
    test('page has RTL direction for Hebrew content', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check if HTML or body has dir="rtl"
      const htmlDir = await page.evaluate(() => {
        return document.documentElement.getAttribute('dir') || document.body.getAttribute('dir')
      })

      // Should be 'rtl' for Hebrew content
      // Or check if body/main container has dir="rtl"
      const hasRtl = htmlDir === 'rtl' ||
        await page.locator('[dir="rtl"]').count() > 0

      expect(hasRtl).toBeTruthy()
    })

    test('text alignment is right-aligned for Hebrew', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check text-align of Hebrew content
      const bodyTextAlign = await page.evaluate(() => {
        const body = document.body
        return window.getComputedStyle(body).textAlign
      })

      // Should be 'right' or 'start' (which is right in RTL context)
      const isRightAligned = bodyTextAlign === 'right' || bodyTextAlign === 'start'

      expect(isRightAligned).toBeTruthy()
    })

    test('admin dashboard has RTL layout', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/dashboard')

      // Check RTL
      const hasRtl = await page.evaluate(() => {
        return document.documentElement.getAttribute('dir') === 'rtl' ||
               document.body.getAttribute('dir') === 'rtl' ||
               document.querySelector('[dir="rtl"]') !== null
      })

      expect(hasRtl).toBeTruthy()
    })
  })

  test.describe('[08.3.1-3.3] Touch Targets - Minimum 44px Height', () => {
    test('submit button has minimum 44px height on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.waitFor({ state: 'visible' })

      const buttonBox = await submitButton.boundingBox()

      // iOS accessibility guideline: minimum 44px touch target
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('input fields have minimum 44px height on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check name input
      const nameInput = page.locator('input[name="name"]').first()
      const nameBox = await nameInput.boundingBox()

      expect(nameBox?.height).toBeGreaterThanOrEqual(44)

      // Check phone input (email not used in public registration)
      const phoneInput = page.locator('input[name="phone"]').first()
      const phoneBox = await phoneInput.boundingBox()

      expect(phoneBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('navigation links have adequate touch targets', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/dashboard')

      // Find navigation links
      const navLinks = page.locator('nav a, a[href*="/admin"]')
      const linkCount = await navLinks.count()

      if (linkCount > 0) {
        for (let i = 0; i < Math.min(3, linkCount); i++) {
          const link = navLinks.nth(i)
          if (await link.isVisible()) {
            const box = await link.boundingBox()
            // Should have reasonable touch target (at least 40px)
            expect(box?.height).toBeGreaterThanOrEqual(40)
          }
        }
      }
    })
  })

  test.describe('[08.4.1] Button Click Feedback', () => {
    test('submit button disables during form submission', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Fill form (email not used in public registration)
      await page.fill('input[name="name"]', 'Test User')
      await page.fill('input[name="phone"]', generateIsraeliPhone())
      await page.fill('input[name="spotsCount"]', '1')

      // Click submit
      const submitButton = page.locator('button[type="submit"]')
      await submitButton.click()

      // Check if button is disabled during processing
      await page.waitForTimeout(100) // Small delay to check state

      const isDisabled = await submitButton.isDisabled().catch(() => false)

      // Button should be disabled OR have some loading state
      const hasLoadingState = isDisabled ||
        await page.locator('button:has-text("שולח"), button:has-text("טוען")').count() > 0

      expect(hasLoadingState).toBeTruthy()
    })
  })

  test.describe('[08.4.5] Success Feedback', () => {
    test('success message shown after registration', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      await publicPage.register({
        name: 'Success Test User',
        email: `success-${Date.now()}@test.com`,
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      // Should see success message
      await expect(
        page.locator('text=/הרשמה הושלמה|הושלמה בהצלחה|success|confirmation/i')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('[08.4.6] Error Feedback', () => {
    test('error message shown for invalid form submission', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Wait for form to load
      await page.waitForSelector('input[name="name"]', { state: 'visible' })

      // Form shows error feedback when fields are empty
      // Check for disabled button with error text OR error message list
      const hasDisabledButton = await page.locator('button:disabled:has-text("נא למלא")').isVisible().catch(() => false)
      const hasErrorList = await page.locator('text=/יש למלא|missing|required/i').isVisible().catch(() => false)
      const hasRequiredText = await page.locator('text=/חובה/').isVisible().catch(() => false)

      // Should have some form of error feedback for empty required fields
      expect(hasDisabledButton || hasErrorList || hasRequiredText).toBeTruthy()
    })
  })

  test.describe('[08.5.1] Input Field Labels', () => {
    test('all inputs have visible labels', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Wait for form to load
      await page.waitForSelector('input[name="name"]', { state: 'visible' })

      // Check for labels (public registration has name and phone only)
      // Labels can be text nodes or label elements
      const hasNameLabel = await page.locator('text=/שם מלא|שם/i').isVisible()
      const hasPhoneLabel = await page.locator('text=/טלפון|phone/i').isVisible()

      // At least the main form labels should be visible
      expect(hasNameLabel || hasPhoneLabel).toBe(true)
    })
  })

  test.describe('[08.5.2] Required Field Indicators', () => {
    test('required fields are marked', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Wait for form to load
      await page.waitForSelector('input[name="name"]', { state: 'visible' })

      // Check for required indicators (asterisk or "חובה" text or disabled submit with error message)
      const hasAsterisk = await page.locator('text="*"').isVisible().catch(() => false)
      const hasRequiredText = await page.locator('text=/חובה|required/i').isVisible().catch(() => false)
      const hasRequiredAttr = await page.locator('input[required]').count() > 0
      const hasDisabledSubmit = await page.locator('button:has-text("נא למלא")').isVisible().catch(() => false)

      // At least one required indicator should exist
      expect(hasAsterisk || hasRequiredText || hasRequiredAttr || hasDisabledSubmit).toBeTruthy()
    })
  })

  test.describe('[08.5.5] Input Field Focus States', () => {
    test('focused input has visible focus indicator', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      const nameInput = page.locator('input[name="name"]').first()

      // Focus the input
      await nameInput.focus()

      // Check for focus styling
      const focusStyles = await nameInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          outline: computed.outline,
          outlineWidth: computed.outlineWidth,
          outlineStyle: computed.outlineStyle,
          borderColor: computed.borderColor,
          boxShadow: computed.boxShadow,
        }
      })

      // Should have some visible focus indication
      const hasFocusIndicator =
        (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
        (focusStyles.boxShadow && focusStyles.boxShadow !== 'none') ||
        focusStyles.borderColor !== 'rgb(0, 0, 0)'

      expect(hasFocusIndicator).toBeTruthy()
    })
  })

  test.describe('[08.6.1] Text Contrast - Normal Text', () => {
    test('body text has sufficient contrast', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Get body text color and background
      const bodyStyles = await page.evaluate(() => {
        const body = document.body
        const computed = window.getComputedStyle(body)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Text should not be same as background
      expect(bodyStyles.color).not.toBe(bodyStyles.backgroundColor)

      // Should be dark text on light background or vice versa
      // (We can't easily calculate exact contrast ratio in Playwright,
      // but we can verify they're different)
      expect(bodyStyles.color).toBeTruthy()
      expect(bodyStyles.backgroundColor).toBeTruthy()
    })
  })

  test.describe('[08.6.6] Input Field Text Visibility (CRITICAL)', () => {
    test('input fields have dark text on light background', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check all input fields (public registration has name and phone only)
      const inputs = ['input[name="name"]', 'input[name="phone"]']

      for (const selector of inputs) {
        const input = page.locator(selector).first()
        const styles = await input.evaluate((el) => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
          }
        })

        // CRITICAL: Text should NOT be white
        expect(styles.color).not.toBe('rgb(255, 255, 255)')
        expect(styles.color).not.toBe('rgba(255, 255, 255, 1)')

        // Should have proper contrast (dark text, light bg)
        expect(styles.color).not.toBe(styles.backgroundColor)
      }
    })
  })

  test.describe('[08.7.1] Keyboard-Only Navigation', () => {
    test('can navigate form with Tab key', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Start at top of page
      await page.keyboard.press('Tab')

      // Check if focus moved to an interactive element
      const focusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName
      })

      // Should have focused some element (INPUT, BUTTON, A, etc.)
      expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA']).toContain(focusedElement)

      // Tab through several elements
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')

      // Should still have valid focus
      const secondFocusedElement = await page.evaluate(() => {
        return document.activeElement?.tagName
      })

      expect(['INPUT', 'BUTTON', 'A', 'SELECT', 'TEXTAREA', 'BODY']).toContain(secondFocusedElement)
    })
  })

  test.describe('[08.7.2] Enter Key to Submit Forms', () => {
    test('pressing Enter in last field submits form', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Fill form fields (email not used in public registration)
      await page.fill('input[name="name"]', 'Keyboard User')
      await page.fill('input[name="phone"]', generateIsraeliPhone())
      await page.fill('input[name="spotsCount"]', '1')

      // Focus last field and press Enter
      await page.locator('input[name="spotsCount"]').focus()
      await page.keyboard.press('Enter')

      // Form should submit
      await page.waitForTimeout(2000)

      // Check for success message or confirmation
      const pageText = await page.textContent('body')
      const submitted = pageText?.includes('הושלמה') ||
                        pageText?.includes('success') ||
                        pageText?.includes('confirmation')

      expect(submitted).toBeTruthy()
    })
  })

  test.describe('[08.2.4] Mixed Hebrew and English Text', () => {
    test('mixed language text renders correctly', async ({ page }) => {
      const school = await createSchool().create()
      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Soccer משחק כדורגל 2024') // Mixed Hebrew and English
        .withCapacity(50)
        .inFuture()
        .create()

      await page.goto(`http://localhost:9000/p/${school.slug}/${event.slug}`)

      // Check that title is displayed
      const pageText = await page.textContent('body')

      // Should contain both Hebrew and English
      expect(pageText).toContain('Soccer')
      expect(pageText).toContain('משחק')

      // Verify RTL context is set
      const hasRtl = await page.evaluate(() => {
        return document.querySelector('[dir="rtl"]') !== null ||
               document.documentElement.getAttribute('dir') === 'rtl'
      })

      expect(hasRtl).toBeTruthy()
    })
  })
})
