import { test, expect } from '@playwright/test'
import { createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

test.describe('Mobile Bottom Tab Navigation - P0', () => {
  test.afterEach(async () => {
    await cleanupTestData()
  })

  test.describe('Mobile Viewport (375px width - iPhone SE)', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should show bottom tab bar on mobile and hide top tabs', async ({ page }) => {
      // Create test data
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // Bottom tab bar should be visible
      const bottomTabBar = page.locator('nav[aria-label="ניווט תחתון - ניהול אירוע"]')
      await expect(bottomTabBar).toBeVisible()

      // Top tab navigation should be hidden
      const topTabNav = page.locator('nav[aria-label="ניהול אירוע - קטגוריות"]')
      await expect(topTabNav).toBeHidden()
    })

    test('should display all 4 tabs without scrolling', async ({ page }) => {
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // All 4 tabs should be visible in viewport
      // Use text selectors which are more reliable
      const overviewTab = page.getByRole('tab', { name: /סקירה/ })
      const registrationsTab = page.getByRole('tab', { name: /רשימות/ })
      const checkinTab = page.getByRole('tab', { name: /כניסה/ })
      const reportsTab = page.getByRole('tab', { name: /דוחות/ })

      await expect(overviewTab).toBeVisible()
      await expect(registrationsTab).toBeVisible()
      await expect(checkinTab).toBeVisible()
      await expect(reportsTab).toBeVisible()

      // No horizontal scrollbar should exist on bottom tab bar
      const bottomTabBar = page.locator('nav[aria-label="ניווט תחתון - ניהול אירוע"]')
      const hasOverflow = await bottomTabBar.evaluate((el) => {
        return el.scrollWidth > el.clientWidth
      })
      expect(hasOverflow).toBe(false)
    })

    test('should have touch targets of at least 64px height', async ({ page }) => {
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // Check tab button height
      const tabButton = page.locator('button[aria-label*="סקירת אירוע"]')
      const height = await tabButton.evaluate((el) => el.clientHeight)

      expect(height).toBeGreaterThanOrEqual(64)
    })

    test('should update active tab state when clicked', async ({ page }) => {
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // Overview tab should be active initially
      const overviewTab = page.getByRole('tab', { name: /סקירה/ })
      await expect(overviewTab).toHaveAttribute('aria-selected', 'true')
      await expect(overviewTab).toHaveClass(/text-blue-600/)

      // Click registrations tab
      const registrationsTab = page.getByRole('tab', { name: /רשימות/ })
      await registrationsTab.click()

      // Wait for URL to update
      await page.waitForURL(/tab=registrations/)

      // Registrations tab should now be active
      await expect(registrationsTab).toHaveAttribute('aria-selected', 'true')
      await expect(registrationsTab).toHaveClass(/text-blue-600/)

      // Overview tab should be inactive
      await expect(overviewTab).toHaveAttribute('aria-selected', 'false')
      await expect(overviewTab).toHaveClass(/text-gray-500/)
    })
  })

  test.describe('Desktop Viewport (1024px width)', () => {
    test.use({ viewport: { width: 1024, height: 768 } })

    test('should show top tabs on desktop and hide bottom bar', async ({ page }) => {
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // Top tab navigation should be visible
      const topTabNav = page.locator('nav[aria-label="ניהול אירוע - קטגוריות"]')
      await expect(topTabNav).toBeVisible()

      // Bottom tab bar should be hidden
      const bottomTabBar = page.locator('nav[aria-label="ניווט תחתון - ניהול אירוע"]')
      await expect(bottomTabBar).toBeHidden()
    })
  })

  test.describe('Accessibility', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should have proper ARIA attributes', async ({ page }) => {
      const admin = await createAdmin().create()
      const event = await createEvent().withSchool(admin.schoolId!).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, admin.password)
      await page.waitForURL(/admin/)

      await page.goto(`/admin/events/${event.id}?tab=overview`)
      await page.waitForLoadState('networkidle')

      // Nav should have role="tablist"
      const bottomTabBar = page.locator('nav[aria-label="ניווט תחתון - ניהול אירוע"]')
      await expect(bottomTabBar).toHaveAttribute('role', 'tablist')

      // Each tab should have role="tab"
      const tabs = bottomTabBar.locator('button')
      const count = await tabs.count()

      for (let i = 0; i < count; i++) {
        const tab = tabs.nth(i)
        await expect(tab).toHaveAttribute('role', 'tab')
        await expect(tab).toHaveAttribute('aria-label')
        await expect(tab).toHaveAttribute('aria-selected')
      }
    })
  })
})
