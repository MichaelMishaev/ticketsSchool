/**
 * Admin Dashboard Tests
 * Tests for the main admin dashboard with stats cards and drilldowns
 */

import { test, expect } from '@playwright/test'
import { loginViaAPI } from '../helpers/auth-helpers'
import { createEventViaAPI } from '../helpers/event-helpers'
import { TEST_ADMINS } from '../helpers/test-data'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaAPI(page, TEST_ADMINS.adminA.email, TEST_ADMINS.adminA.password)
    await page.goto('/admin')
  })

  test('should display dashboard with stats cards', async ({ page }) => {
    // Page title
    await expect(page.locator('text=לוח בקרה')).toBeVisible()

    // Stats cards should be visible
    await expect(page.locator('text=אירועים פעילים')).toBeVisible()
    await expect(page.locator('text=/נרשמים|רישומים/')).toBeVisible()
    await expect(page.locator('text=/רשימת המתנה|waitlist/')).toBeVisible()
    await expect(page.locator('text=/תפוסה|occupancy/')).toBeVisible()
  })

  test('should display numeric values in stats cards', async ({ page }) => {
    // All cards should show numbers (even if 0)
    const statCards = page.locator('text=/\\d+/')
    const count = await statCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should open drilldown modal when clicking stat card', async ({ page }) => {
    // Click on active events card
    const activeEventsCard = page.locator('button:has-text("אירועים פעילים")').first()
    await activeEventsCard.click()

    // Should open modal with details
    await expect(page.locator('text=/פרטים מלאים|details/').first()).toBeVisible({
      timeout: 5000,
    })

    // Modal should be closeable
    const closeButton = page.locator('button:has-text("×"), button:has-text("סגור")').first()
    if (await closeButton.isVisible()) {
      await closeButton.click()

      // Modal should close
      await expect(
        page.locator('text=/פרטים מלאים|details/').first()
      ).not.toBeVisible()
    }
  })

  test('should display recent events section', async ({ page }) => {
    // Create at least one event
    await createEventViaAPI(page, {
      title: 'Dashboard Test Event',
      location: 'Test Location',
      capacity: 50,
    })

    await page.reload()

    // Should show recent events
    await expect(page.locator('text=Dashboard Test Event')).toBeVisible({ timeout: 5000 })
  })

  test('should have "create event" button', async ({ page }) => {
    const createButton = page.locator('a[href*="/admin/events/new"]')
    await expect(createButton).toBeVisible()

    await createButton.click()
    await expect(page).toHaveURL(/\/admin\/events\/new/)
  })

  test('should navigate to events list', async ({ page }) => {
    const eventsLink = page.locator('a[href="/admin/events"]')
    await expect(eventsLink).toBeVisible()

    await eventsLink.click()
    await expect(page).toHaveURL('/admin/events')
  })

  test.describe('Super Admin Button (Bug #12)', () => {
    test('should NOT show AdminProd button for regular admin', async ({ page }) => {
      // Logged in as regular admin
      await page.goto('/admin')

      // AdminProd button should NOT be visible
      const adminProdButton = page.locator('a[href="/admin-prod"]')
      await expect(adminProdButton).not.toBeVisible()
    })

    test('should show AdminProd button for SUPER_ADMIN', async ({ page, browser }) => {
      // Login as super admin
      const context = await browser.newContext()
      const superPage = await context.newPage()

      await loginViaAPI(superPage, TEST_ADMINS.superAdmin.email, TEST_ADMINS.superAdmin.password)
      await superPage.goto('/admin')

      // AdminProd button SHOULD be visible
      const adminProdButton = superPage.locator('a[href="/admin-prod"]')
      await expect(adminProdButton).toBeVisible({ timeout: 5000 })

      await context.close()
    })
  })

  test.describe('Mobile responsiveness', () => {
    test('should display stats in 2-column grid on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/admin')

      // Stats cards should be visible
      await expect(page.locator('text=אירועים פעילים')).toBeVisible()

      // Check grid layout (should be 2 columns on mobile)
      const statsContainer = page.locator('div:has(text("אירועים פעילים"))').first()
      const gridClass = await statsContainer.getAttribute('class')

      // Should have grid-cols-2 or similar mobile grid class
      expect(gridClass).toMatch(/grid/)
    })

    test('should have touch-friendly stat cards (min 88px height)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/admin')

      const statCard = page.locator('button:has-text("אירועים פעילים")').first()
      const box = await statCard.boundingBox()

      expect(box?.height).toBeGreaterThanOrEqual(88)
    })

    test('should open hamburger menu on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.goto('/admin')

      // Look for hamburger menu button
      const menuButton = page.locator('button[aria-label*="menu"], button:has-text("☰")')
      if (await menuButton.isVisible()) {
        await menuButton.click()

        // Menu should open with navigation links
        await expect(page.locator('text=יציאה')).toBeVisible()
      }
    })
  })

  test.describe('Navigation', () => {
    test('should navigate to all admin sections', async ({ page }) => {
      // Team
      const teamLink = page.locator('a[href*="/admin/team"]')
      if (await teamLink.isVisible()) {
        await teamLink.click()
        await expect(page).toHaveURL(/\/admin\/team/)
        await page.goBack()
      }

      // Settings
      const settingsLink = page.locator('a[href*="/admin/settings"]')
      if (await settingsLink.isVisible()) {
        await settingsLink.click()
        await expect(page).toHaveURL(/\/admin\/settings/)
        await page.goBack()
      }

      // Help
      const helpLink = page.locator('a[href*="/admin/help"]')
      if (await helpLink.isVisible()) {
        await helpLink.click()
        await expect(page).toHaveURL(/\/admin\/help/)
        await page.goBack()
      }
    })

    test('should logout successfully', async ({ page }) => {
      // Click logout
      const logoutLink = page.locator('text=יציאה')
      await logoutLink.click()

      // Should redirect to login
      await page.waitForURL('/admin/login', { timeout: 5000 })

      // Should not be able to access /admin without login
      await page.goto('/admin')
      await page.waitForURL('/admin/login', { timeout: 5000 })
    })
  })
})
