import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from './fixtures/test-data'
import { LoginPage } from './page-objects/LoginPage'

// Helper function to wait for admin dashboard to finish loading
async function waitForDashboardLoad(page: any) {
  // Wait for loading state to disappear
  await page.waitForSelector('text=טוען...', { state: 'hidden', timeout: 10000 }).catch(() => {})
  // Also wait for the dashboard heading to appear as a double-check
  await page.waitForSelector('h2:has-text("לוח בקרה")', { timeout: 10000 }).catch(() => {})
}

// Helper function to get the correct dropdown button based on viewport
function getDropdownButton(page: any, isMobile: boolean) {
  // On mobile (< 640px): Use nth(1) to get the mobile header button (sm:hidden div)
  // On desktop (>= 640px): Use first() to get the desktop header button (hidden sm:flex div)
  const selector = 'button[aria-label="צור אירוע חדש"]'
  return isMobile ? page.locator(selector).nth(1) : page.locator(selector).first()
}

test.describe('CreateEventDropdown - Mobile & Desktop UI/UX Tests', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('Mobile Viewport (375px - iPhone SE)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('dropdown button is visible and accessible on mobile header', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Find the create event dropdown button (mobile version)
      const dropdownButton = getDropdownButton(page, true)
      await expect(dropdownButton).toBeVisible()

      // Check touch target size (minimum 44px)
      const buttonBox = await dropdownButton.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('dropdown opens and fits within viewport on mobile', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Click dropdown button (mobile version)
      const dropdownButton = getDropdownButton(page, true)
      await dropdownButton.click()

      // Wait for dropdown to appear
      await page.waitForTimeout(300)

      // Check that dropdown menu is visible
      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Verify dropdown doesn't overflow viewport
      const menuBox = await dropdownMenu.boundingBox()
      const viewport = page.viewportSize()

      if (menuBox && viewport) {
        // Dropdown should not exceed viewport width (with 1rem margin on each side)
        expect(menuBox.width).toBeLessThanOrEqual(viewport.width - 32) // 2rem = 32px
        expect(menuBox.x).toBeGreaterThanOrEqual(0)
        expect(menuBox.x + menuBox.width).toBeLessThanOrEqual(viewport.width)
      }
    })

    test('no horizontal scroll after opening dropdown on mobile', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown (mobile)
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      // Check no horizontal scroll
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)

      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // Allow 5px tolerance
    })

    test('both event options are visible and clickable on mobile', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      // Check both options are visible
      const regularOption = page.locator('a[href="/admin/events/new"]:has-text("אירוע רגיל")')
      const restaurantOption = page.locator(
        'a[href="/admin/events/new-restaurant"]:has-text("אירוע עם מקומות ישיבה")'
      )

      await expect(regularOption).toBeVisible()
      await expect(restaurantOption).toBeVisible()

      // Check touch targets are adequate
      const regularBox = await regularOption.boundingBox()
      const restaurantBox = await restaurantOption.boundingBox()

      expect(regularBox?.height).toBeGreaterThanOrEqual(44)
      expect(restaurantBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('dropdown closes when clicking outside on mobile', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Click outside (on page heading)
      await page.click('h2:has-text("לוח בקרה")')
      await page.waitForTimeout(300)

      // Dropdown should be hidden
      await expect(dropdownMenu).not.toBeVisible()
    })

    test('dropdown closes on Escape key', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Press Escape
      await page.keyboard.press('Escape')
      await page.waitForTimeout(300)

      // Dropdown should be hidden
      await expect(dropdownMenu).not.toBeVisible()
    })

    test('clicking regular event option navigates correctly', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      // Click regular event option
      await page.click('a[href="/admin/events/new"]:has-text("אירוע רגיל")')

      // Wait for navigation
      await page.waitForURL('**/admin/events/new')

      // Verify we're on the correct page
      expect(page.url()).toContain('/admin/events/new')
    })

    test('clicking restaurant event option navigates correctly', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, true).click()
      await page.waitForTimeout(300)

      // Click restaurant event option
      await page.click('a[href="/admin/events/new-restaurant"]:has-text("אירוע עם מקומות ישיבה")')

      // Wait for navigation
      await page.waitForURL('**/admin/events/new-restaurant')

      // Verify we're on the correct page
      expect(page.url()).toContain('/admin/events/new-restaurant')
    })
  })

  test.describe('Desktop Viewport (1920x1080)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 })
    })

    test('dropdown button is visible on desktop header', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Find the create event dropdown button (desktop)
      const dropdownButton = getDropdownButton(page, false)
      await expect(dropdownButton).toBeVisible()
    })

    test('dropdown opens and positions correctly on desktop', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Click dropdown button in navigation (header)
      await getDropdownButton(page, false).click()
      await page.waitForTimeout(300)

      // Check that dropdown menu is visible
      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Dropdown should have fixed width on desktop (sm:w-80 = 320px)
      const menuBox = await dropdownMenu.boundingBox()
      expect(menuBox?.width).toBeLessThanOrEqual(400) // Should be around 320px
    })

    test('hover states work correctly on desktop', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Open dropdown
      await getDropdownButton(page, false).click()
      await page.waitForTimeout(300)

      // Hover over regular event option
      const regularOption = page.locator('a[href="/admin/events/new"]:has-text("אירוע רגיל")')
      await regularOption.hover()
      await page.waitForTimeout(200)

      // Check background color changed (hover effect)
      const bgColor = await regularOption.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor
      })

      // Should have some background color (not transparent)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)')
      expect(bgColor).not.toBe('transparent')
    })

    test('dropdown is fully visible when opened on desktop (no clipping)', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Click dropdown button in navigation (header)
      await getDropdownButton(page, false).click()
      await page.waitForTimeout(300)

      // Get dropdown menu and both options
      const dropdownMenu = page.locator('[role="menu"]')
      const regularOption = page.locator('a[href="/admin/events/new"]:has-text("אירוע רגיל")')
      const restaurantOption = page.locator(
        'a[href="/admin/events/new-restaurant"]:has-text("אירוע עם מקומות ישיבה")'
      )

      // All elements should be visible
      await expect(dropdownMenu).toBeVisible()
      await expect(regularOption).toBeVisible()
      await expect(restaurantOption).toBeVisible()

      // CRITICAL: Check that both options are FULLY visible (not clipped by parent overflow)
      // Get the bounding boxes
      const menuBox = await dropdownMenu.boundingBox()
      const regularBox = await regularOption.boundingBox()
      const restaurantBox = await restaurantOption.boundingBox()

      // Verify all elements have valid bounding boxes
      expect(menuBox).toBeTruthy()
      expect(regularBox).toBeTruthy()
      expect(restaurantBox).toBeTruthy()

      if (menuBox && regularBox && restaurantBox) {
        // Regular option should be fully within the menu
        expect(regularBox.y).toBeGreaterThanOrEqual(menuBox.y)
        expect(regularBox.y + regularBox.height).toBeLessThanOrEqual(menuBox.y + menuBox.height)

        // Restaurant option should be fully within the menu
        expect(restaurantBox.y).toBeGreaterThanOrEqual(menuBox.y)
        expect(restaurantBox.y + restaurantBox.height).toBeLessThanOrEqual(
          menuBox.y + menuBox.height
        )

        // Both options should have visible height (not clipped to 0)
        expect(regularBox.height).toBeGreaterThan(40) // Should be at least 40px tall
        expect(restaurantBox.height).toBeGreaterThan(40)
      }

      // Verify both options are clickable (not obscured)
      await expect(regularOption).toBeEnabled()
      await expect(restaurantOption).toBeEnabled()
    })
  })

  test.describe('Events Page Dropdown (Page Variant)', () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
    })

    test('page variant dropdown works on events page (mobile)', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events')
      await page.waitForLoadState('networkidle')

      // Find the create event dropdown button
      const dropdownButton = page.locator('button:has-text("צור אירוע חדש")')
      await expect(dropdownButton).toBeVisible()

      // Click to open
      await dropdownButton.click()
      await page.waitForTimeout(300)

      // Verify dropdown is visible
      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Verify no horizontal overflow
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
      const viewportWidth = await page.evaluate(() => window.innerWidth)
      expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5)
    })

    test('page variant shows event type descriptions', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })

      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin/events')
      await page.waitForLoadState('networkidle')

      // Open dropdown
      await page.click('button:has-text("צור אירוע חדש")')
      await page.waitForTimeout(300)

      // Check for detailed descriptions
      await expect(page.locator('text=/מושלם לאירועי ספורט/i').first()).toBeVisible()
      await expect(page.locator('text=/ניהול שולחנות והזמנות/i').first()).toBeVisible()

      // Check for feature badges (use first() since text appears multiple times)
      await expect(page.locator('text=/מגבלת קיבולת/i').first()).toBeVisible()
      await expect(page.locator('text=/ניהול שולחנות/i').first()).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('dropdown has proper ARIA attributes', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Default viewport is desktop (1280x720)
      const dropdownButton = getDropdownButton(page, false)

      // Check aria-label
      const ariaLabel = await dropdownButton.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()

      // Check aria-expanded when closed
      let ariaExpanded = await dropdownButton.getAttribute('aria-expanded')
      expect(ariaExpanded).toBe('false')

      // Open dropdown
      await dropdownButton.click()
      await page.waitForTimeout(300)

      // Check aria-expanded when open
      ariaExpanded = await dropdownButton.getAttribute('aria-expanded')
      expect(ariaExpanded).toBe('true')

      // Check menu role
      const dropdownMenu = page.locator('[role="menu"]')
      await expect(dropdownMenu).toBeVisible()

      // Check menuitem roles
      const menuItems = page.locator('[role="menuitem"]')
      expect(await menuItems.count()).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('RTL Support', () => {
    test('dropdown aligns correctly in RTL layout', async ({ page }) => {
      const school = await createSchool().create()
      const admin = await createAdmin().withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('http://localhost:9000/admin')
      await waitForDashboardLoad(page)

      // Default viewport is desktop (1280x720)
      const dropdownButton = getDropdownButton(page, false)

      // Open dropdown
      await dropdownButton.click()
      await page.waitForTimeout(300)

      // Get dropdown menu position
      const dropdownMenu = page.locator('[role="menu"]')
      const menuBox = await dropdownMenu.boundingBox()
      const buttonBox = await dropdownButton.boundingBox()

      // Dropdown should align to the RIGHT of the button (RTL)
      if (menuBox && buttonBox) {
        // On mobile: dropdown right edge should align with button right edge
        // On desktop: similar alignment
        expect(menuBox.x).toBeLessThanOrEqual(buttonBox.x + buttonBox.width)
      }
    })
  })
})
