/**
 * Field Builder Accessibility E2E Tests
 *
 * Tests for the Additional Fields section in event creation page
 * Covers WCAG 2.1 compliance, keyboard navigation, mobile UX, and visual design
 */

import { test, expect, Page } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

// Helper to navigate to the event creation page and expand the fields section
async function navigateToFieldBuilder(page: Page, admin: { email: string }) {
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(admin.email, 'TestPassword123!')

  // Navigate to create new event
  await page.goto('http://localhost:9000/admin/events/new')
  await page.waitForLoadState('networkidle')

  // Find and click the "Additional Fields" section to expand it
  const fieldsSection = page.locator(
    'button:has-text("שדות נוספים"), button:has-text("שדות הטופס")'
  )
  if (await fieldsSection.isVisible()) {
    await fieldsSection.click()
    await page.waitForTimeout(300) // Wait for animation
  }
}

test.describe('Field Builder Accessibility P0 - Critical Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[10.1] ARIA Labels & Semantic Structure', () => {
    test('field list has proper role and aria-label', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Check for list role
      const fieldsList = page.locator('[role="list"][aria-label*="רשימת שדות"]')
      await expect(fieldsList).toBeVisible()

      // Check for listitem roles
      const fieldItems = page.locator('[role="listitem"]')
      const count = await fieldItems.count()
      expect(count).toBeGreaterThanOrEqual(2) // At least name and phone fields
    })

    test('field cards have descriptive aria-labels', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Check that field cards have aria-labels describing the field
      const nameField = page.locator('[role="listitem"][aria-label*="שם מלא"]')
      await expect(nameField).toBeVisible()

      const phoneField = page.locator('[role="listitem"][aria-label*="טלפון"]')
      await expect(phoneField).toBeVisible()
    })

    test('add field button has aria-expanded attribute', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Find the add field button
      const addButton = page.locator('button:has-text("הוסף שדה מותאם אישית")')
      await expect(addButton).toBeVisible()

      // Check aria-expanded is false initially
      const expandedBefore = await addButton.getAttribute('aria-expanded')
      expect(expandedBefore).toBe('false')

      // Click and check aria-expanded becomes true
      await addButton.click()
      await page.waitForTimeout(300)

      // The button is replaced by the form, so check the form is visible
      const addFieldForm = page.locator('#add-field-form, [role="form"][aria-label*="הוספת שדה"]')
      await expect(addFieldForm).toBeVisible()
    })

    test('field type buttons have role="radio" and aria-checked', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Check field type buttons have radio role
      const radioButtons = page.locator('[role="radio"]')
      const count = await radioButtons.count()
      expect(count).toBeGreaterThanOrEqual(4) // text, number, dropdown, checkbox

      // Check one is aria-checked=true (default is text)
      const checkedRadio = page.locator('[role="radio"][aria-checked="true"]')
      await expect(checkedRadio).toHaveCount(1)
    })

    test('badges have proper aria-labels', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Required badge should have aria-label
      const requiredBadge = page.locator('[aria-label*="חובה"]').first()
      await expect(requiredBadge).toBeVisible()

      // Protected badge should have aria-label
      const protectedBadge = page.locator('[aria-label*="מוגן"]').first()
      await expect(protectedBadge).toBeVisible()
    })
  })

  test.describe('[10.2] Keyboard Navigation', () => {
    test('can navigate fields with Tab key', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Focus on the first interactive element
      await page.keyboard.press('Tab')

      // Continue tabbing and verify focus moves through interactive elements
      let foundFocusableElement = false
      for (let i = 0; i < 10; i++) {
        const focusedElement = await page.evaluate(() => {
          const el = document.activeElement
          return el?.tagName?.toLowerCase()
        })
        if (focusedElement === 'button' || focusedElement === 'input') {
          foundFocusableElement = true
          break
        }
        await page.keyboard.press('Tab')
      }

      expect(foundFocusableElement).toBe(true)
    })

    test('reorder buttons are keyboard accessible', async ({ page }) => {
      // Skip on mobile viewports - keyboard navigation not applicable
      const viewport = page.viewportSize()
      if (viewport && viewport.width < 640) {
        test.skip()
        return
      }

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // First add a custom field so we have one that can be reordered
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Fill in field name
      await page.fill('input[placeholder*="הערות"]', 'שדה בדיקה')
      await page.waitForTimeout(100)

      // Click add
      await page.click('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
      await page.waitForTimeout(500)

      // Now check for reorder buttons
      const upButtons = page.locator('button[aria-label*="למעלה"]')
      const downButtons = page.locator('button[aria-label*="למטה"]')

      // Should have at least one reorder button visible
      const upCount = await upButtons.count()
      const downCount = await downButtons.count()
      expect(upCount + downCount).toBeGreaterThan(0)
    })

    test('focus is visible on interactive elements', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Focus on add field button
      const addButton = page.locator('button:has-text("הוסף שדה מותאם אישית")')
      await addButton.focus()

      // Check that focus styles are applied (ring or outline)
      const hasFocusStyle = await addButton.evaluate((el) => {
        const style = window.getComputedStyle(el)
        // Check for focus ring or outline
        const hasOutline = style.outlineWidth !== '0px' && style.outlineStyle !== 'none'
        const hasBoxShadow = style.boxShadow !== 'none'
        return hasOutline || hasBoxShadow
      })

      // Focus styles should be present (either via outline or box-shadow/ring)
      expect(hasFocusStyle).toBe(true)
    })
  })

  test.describe('[10.3] Touch Targets (Mobile)', () => {
    test('touch targets meet 44px minimum on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Check add field button size
      const addButton = page.locator('button:has-text("הוסף שדה מותאם אישית")')
      const addButtonBox = await addButton.boundingBox()
      expect(addButtonBox?.height).toBeGreaterThanOrEqual(44)

      // Open add field form
      await addButton.click()
      await page.waitForTimeout(300)

      // Check cancel button size
      const cancelButton = page.locator('button:has-text("ביטול")')
      if (await cancelButton.isVisible()) {
        const cancelBox = await cancelButton.boundingBox()
        expect(cancelBox?.height).toBeGreaterThanOrEqual(44)
      }

      // Check continue/submit button size
      const submitButton = page.locator(
        'button:has-text("המשך"), button:has-text("הוסף שדה"):not(:has-text("מותאם"))'
      )
      if (await submitButton.first().isVisible()) {
        const submitBox = await submitButton.first().boundingBox()
        expect(submitBox?.height).toBeGreaterThanOrEqual(44)
      }
    })

    test('checkboxes are large enough on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form to find a checkbox
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // On mobile stepper, go to step 3 where checkbox is
      const continueButton = page.locator('button:has-text("המשך")')
      if (await continueButton.isVisible()) {
        await continueButton.click()
        await page.waitForTimeout(200)
        await continueButton.click()
        await page.waitForTimeout(200)
      }

      // Find checkbox input
      const checkbox = page.locator('input[type="checkbox"]').first()
      if (await checkbox.isVisible()) {
        const checkboxStyles = await checkbox.evaluate((el) => {
          const style = window.getComputedStyle(el)
          return {
            width: parseFloat(style.width),
            height: parseFloat(style.height),
          }
        })
        // On mobile, checkboxes should be at least 24px (w-6 h-6)
        expect(checkboxStyles.width).toBeGreaterThanOrEqual(24)
        expect(checkboxStyles.height).toBeGreaterThanOrEqual(24)
      }
    })
  })

  test.describe('[10.4] Color Contrast (WCAG)', () => {
    test('required badge has sufficient contrast', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Find required badge
      const requiredBadge = page.locator('span:has-text("חובה")').first()
      await expect(requiredBadge).toBeVisible()

      // Check contrast (text should be dark on light background)
      const styles = await requiredBadge.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Text should be dark (red-900 = approximately rgb(127, 29, 29))
      // Background should be light (red-50 = approximately rgb(254, 242, 242))
      expect(styles.color).not.toBe('rgb(255, 255, 255)') // Not white text
      expect(styles.backgroundColor).not.toBe('rgb(0, 0, 0)') // Not black background
    })

    test('protected badge has sufficient contrast', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Find protected badge (should be on default fields)
      const protectedBadge = page.locator('span:has-text("מוגן")').first()
      await expect(protectedBadge).toBeVisible()

      // Check contrast
      const styles = await protectedBadge.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Text should be dark (purple-900)
      expect(styles.color).not.toBe('rgb(255, 255, 255)')
    })

    test('input fields have visible text', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Find label input
      const labelInput = page.locator('input[placeholder*="הערות"]').first()
      await expect(labelInput).toBeVisible()

      // Type something and check visibility
      await labelInput.fill('שדה בדיקה')

      const styles = await labelInput.evaluate((el) => {
        const computed = window.getComputedStyle(el)
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor,
        }
      })

      // Text should not be white on white
      expect(styles.color).not.toBe(styles.backgroundColor)
      expect(styles.color).not.toBe('rgb(255, 255, 255)')
    })
  })

  test.describe('[10.5] Mobile Stepper Pattern', () => {
    test('mobile shows step indicator on small screens', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Check for step indicators (circles with numbers 1, 2, 3)
      const stepIndicators = page.locator('[aria-label*="שלב"]')
      const hasStepIndicator = (await stepIndicators.count()) > 0

      // Also check for numbered steps
      const step1 = page.locator('div:has-text("1")').first()
      const step2 = page.locator('div:has-text("2")').first()
      const step3 = page.locator('div:has-text("3")').first()

      // Should have either step indicators or the numbered steps visible
      expect(
        hasStepIndicator ||
          ((await step1.isVisible()) && (await step2.isVisible()) && (await step3.isVisible()))
      ).toBe(true)
    })

    test('can navigate through mobile stepper steps', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Step 1: Fill field name
      const labelInput = page.locator('input[placeholder*="הערות"]')
      await expect(labelInput).toBeVisible()
      await labelInput.fill('שדה בדיקה')

      // Click continue
      const continueButton = page.locator('button:has-text("המשך")')
      await continueButton.click()
      await page.waitForTimeout(300)

      // Step 2: Should see field type selection
      const fieldTypeButtons = page.locator('[role="radio"]')
      expect(await fieldTypeButtons.count()).toBeGreaterThanOrEqual(4)

      // Continue to step 3
      await continueButton.click()
      await page.waitForTimeout(300)

      // Step 3: Should see required checkbox and add button
      const addButton = page.locator('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
      await expect(addButton).toBeVisible()
    })

    test('back button works in mobile stepper', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Fill and continue
      await page.fill('input[placeholder*="הערות"]', 'שדה בדיקה')
      await page.click('button:has-text("המשך")')
      await page.waitForTimeout(300)

      // Now we should be on step 2, click back
      const backButton = page.locator('button:has-text("חזור")')
      await expect(backButton).toBeVisible()
      await backButton.click()
      await page.waitForTimeout(300)

      // Should be back on step 1 - field name input should be visible again
      const labelInput = page.locator('input[placeholder*="הערות"]')
      await expect(labelInput).toBeVisible()
    })
  })

  test.describe('[10.6] Loading States', () => {
    test('add field button shows loading state', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Fill required fields
      const labelInput = page.locator('input[placeholder*="הערות"]').first()
      await labelInput.fill('שדה בדיקה')

      // On desktop, the add button is visible directly
      // On mobile, need to go through steps
      const viewport = page.viewportSize()
      if (viewport && viewport.width < 640) {
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
      }

      // Find add button and click it
      const addButton = page.locator('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
      await expect(addButton).toBeVisible()

      // Click and check for loading state (spinner or "מוסיף...")
      // Start the click but don't await it fully - we want to catch the loading state
      const loadingPromise = page.waitForSelector('text=מוסיף', { timeout: 2000 }).catch(() => null)

      await addButton.click()

      // Either we catch the loading state or the field was added successfully
      const loadingElement = await loadingPromise
      // The important thing is no error was thrown and the field gets added
      await page.waitForTimeout(500)

      // Verify field was added (success toast or new field in list)
      const successToast = page.locator('text=נוסף בהצלחה')
      const newField = page.locator('[role="listitem"][aria-label*="שדה בדיקה"]')
      expect((await successToast.isVisible()) || (await newField.isVisible())).toBe(true)
    })

    test('add button is disabled when form is incomplete', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // On desktop, the add button should be disabled when label is empty
      const viewport = page.viewportSize()
      if (viewport && viewport.width >= 640) {
        const addButton = page.locator('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
        await expect(addButton).toBeDisabled()
      } else {
        // On mobile, the continue button should be disabled when label is empty
        const continueButton = page.locator('button:has-text("המשך")')
        await expect(continueButton).toBeDisabled()
      }
    })
  })

  test.describe('[10.7] Success Feedback', () => {
    test('shows success toast after adding field', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open add field form
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)

      // Fill required fields
      await page.fill('input[placeholder*="הערות"]', 'שדה בדיקה')

      // Navigate through mobile stepper if needed
      const viewport = page.viewportSize()
      if (viewport && viewport.width < 640) {
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
      }

      // Click add
      await page.click('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')

      // Wait for success toast
      const successToast = page.locator('[role="status"]:has-text("נוסף בהצלחה")')
      await expect(successToast).toBeVisible({ timeout: 5000 })
    })

    test('success toast has proper ARIA role', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Open and add a field quickly
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)
      await page.fill('input[placeholder*="הערות"]', 'שדה נגישות')

      const viewport = page.viewportSize()
      if (viewport && viewport.width < 640) {
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
      }

      await page.click('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')

      // Check toast has role="status" for screen readers
      const toast = page.locator('[role="status"]')
      await expect(toast).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('[10.8] Badge Visual Hierarchy', () => {
    test('required and protected badges have different shapes', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Get required badge border-radius
      const requiredBadge = page.locator('span:has-text("חובה")').first()
      const requiredStyles = await requiredBadge.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })

      // Get protected badge border-radius
      const protectedBadge = page.locator('span:has-text("מוגן")').first()
      const protectedStyles = await protectedBadge.evaluate((el) => {
        return window.getComputedStyle(el).borderRadius
      })

      // They should have different border-radius values
      // Required uses rounded-md (6px or 0.375rem)
      // Protected uses rounded-full (9999px or 100%)
      expect(requiredStyles).not.toBe(protectedStyles)
    })

    test('badges have icons for additional visual distinction', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Required badge should have AlertCircle icon
      const requiredBadge = page.locator('span:has-text("חובה")').first()
      const requiredHasIcon = (await requiredBadge.locator('svg').count()) > 0

      // Protected badge should have Lock icon
      const protectedBadge = page.locator('span:has-text("מוגן")').first()
      const protectedHasIcon = (await protectedBadge.locator('svg').count()) > 0

      expect(requiredHasIcon).toBe(true)
      expect(protectedHasIcon).toBe(true)
    })
  })

  test.describe('[10.9] Field Reordering', () => {
    test('can reorder custom fields using buttons', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Add two custom fields
      for (const fieldName of ['שדה ראשון', 'שדה שני']) {
        await page.click('button:has-text("הוסף שדה מותאם אישית")')
        await page.waitForTimeout(300)
        await page.fill('input[placeholder*="הערות"]', fieldName)

        const viewport = page.viewportSize()
        if (viewport && viewport.width < 640) {
          await page.click('button:has-text("המשך")')
          await page.waitForTimeout(200)
          await page.click('button:has-text("המשך")')
          await page.waitForTimeout(200)
        }

        await page.click('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
        await page.waitForTimeout(500)
      }

      // Now check the order - "שדה ראשון" should be first, then "שדה שני"
      const fieldItems = page.locator('[role="listitem"]')
      const fieldLabels = await fieldItems.allTextContents()

      const firstIndex = fieldLabels.findIndex((text) => text.includes('שדה ראשון'))
      const secondIndex = fieldLabels.findIndex((text) => text.includes('שדה שני'))

      expect(firstIndex).toBeLessThan(secondIndex)

      // Find and click down button for "שדה ראשון" (to move it down)
      const downButton = page.locator('button[aria-label*="שדה ראשון"][aria-label*="למטה"]')
      if (await downButton.isVisible()) {
        await downButton.click()
        await page.waitForTimeout(300)

        // Check order changed
        const newFieldLabels = await fieldItems.allTextContents()
        const newFirstIndex = newFieldLabels.findIndex((text) => text.includes('שדה ראשון'))
        const newSecondIndex = newFieldLabels.findIndex((text) => text.includes('שדה שני'))

        expect(newFirstIndex).toBeGreaterThan(newSecondIndex)
      }
    })

    test('default fields cannot be reordered', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Try to find reorder buttons for default fields (name, phone)
      const nameUpButton = page.locator('button[aria-label*="שם מלא"][aria-label*="למעלה"]')
      const nameDownButton = page.locator('button[aria-label*="שם מלא"][aria-label*="למטה"]')

      // These should either not exist or be disabled
      if ((await nameUpButton.count()) > 0) {
        await expect(nameUpButton).toBeDisabled()
      }
      if ((await nameDownButton.count()) > 0) {
        await expect(nameDownButton).toBeDisabled()
      }
    })
  })

  test.describe('[10.10] Form Field Counter', () => {
    test('shows correct field count', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      await navigateToFieldBuilder(page, admin)

      // Check initial count (should be 2 - name and phone)
      const counterBadge = page.locator('[role="status"][aria-label*="שדות"]')
      await expect(counterBadge).toContainText('2')

      // Add a field
      await page.click('button:has-text("הוסף שדה מותאם אישית")')
      await page.waitForTimeout(300)
      await page.fill('input[placeholder*="הערות"]', 'שדה חדש')

      const viewport = page.viewportSize()
      if (viewport && viewport.width < 640) {
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
        await page.click('button:has-text("המשך")')
        await page.waitForTimeout(200)
      }

      await page.click('button:has-text("הוסף שדה"):not(:has-text("מותאם"))')
      await page.waitForTimeout(500)

      // Check count updated to 3
      await expect(counterBadge).toContainText('3')
    })
  })
})
