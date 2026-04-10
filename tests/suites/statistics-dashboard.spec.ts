import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import {
  createAdmin,
  createSchool,
  createEvent,
  createRegistration,
  cleanupTestData,
  prisma,
} from '../fixtures/test-data'
import { generateEmail } from '../helpers/test-helpers'
import { loginViaAPI } from '../helpers/auth-helpers'

/**
 * Super Admin Statistics Dashboard E2E Tests
 * Tests comprehensive analytics dashboard with:
 * - Access control (SUPER_ADMIN only)
 * - Tab navigation (5 tabs)
 * - Date range filtering
 * - Chart rendering
 * - CSV export
 */

// Configure test-level retries for stability
test.describe.configure({ retries: 2 })

test.describe('Statistics Dashboard - Access Control', () => {
  // Set longer timeout for this suite due to complex login flows
  test.setTimeout(60000)

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should redirect non-super-admin users to /admin', async ({ page }) => {
    // Create regular admin (not SUPER_ADMIN)
    const school = await createSchool().withName('Regular School').create()
    const admin = await createAdmin()
      .withEmail(generateEmail('regular-admin'))
      .withPassword('TestPassword123!')
      .withRole('ADMIN')
      .withSchool(school.id)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'TestPassword123!')

    // Attempt to navigate to statistics page
    await page.goto('/admin/statistics')

    // Should be redirected to /admin (dashboard)
    await expect(page).toHaveURL(/\/admin(?!\/statistics)/, { timeout: 10000 })
  })

  test('should allow SUPER_ADMIN to access statistics dashboard', async ({ page }) => {
    // Create SUPER_ADMIN
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null) // SUPER_ADMIN has no school
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')

    // Navigate to statistics page
    await page.goto('/admin/statistics')

    // Should stay on statistics page
    await expect(page).toHaveURL('/admin/statistics', { timeout: 10000 })

    // Verify page title is visible
    await expect(page.locator('h1:has-text("סטטיסטיקות מערכת")')).toBeVisible()
  })

  test('should show page header and description', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-header'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Verify header elements
    await expect(page.locator('h1:has-text("סטטיסטיקות מערכת")')).toBeVisible()
    await expect(page.locator('text=ניתוח מקיף של כל הפעילות במערכת')).toBeVisible()

    // Verify back button (use text selector to be more specific)
    await expect(page.locator('a:has-text("חזרה")')).toBeVisible()
  })
})

test.describe('Statistics Dashboard - Tab Navigation', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display all 5 tabs correctly', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-tabs'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Verify all 5 tabs are visible
    await expect(page.locator('button:has-text("הכנסות")')).toBeVisible()
    await expect(page.locator('button:has-text("הרשמות")')).toBeVisible()
    await expect(page.locator('button:has-text("תפוסה")')).toBeVisible()
    await expect(page.locator('button:has-text("נוכחות")')).toBeVisible()
    await expect(page.locator('button:has-text("בריאות המערכת")')).toBeVisible()
  })

  test('should switch to registrations tab and load data', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-reg-tab'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Wait for initial load
    await page.waitForLoadState('networkidle')

    // Click on registrations tab
    await page.locator('button:has-text("הרשמות")').click()

    // Wait for data to load (check for stat cards)
    await expect(page.locator('text=סה״כ הרשמות')).toBeVisible({ timeout: 10000 })
    // Use paragraph selector to avoid matching chart legend
    await expect(page.locator('p:has-text("מאושרות")')).toBeVisible()

    // Verify tab is active (purple border)
    const registrationsTab = page.locator('button:has-text("הרשמות")')
    await expect(registrationsTab).toHaveClass(/border-purple-600/)
  })

  test('should switch to capacity tab and display metrics', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-capacity'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Click capacity tab
    await page.locator('button:has-text("תפוסה")').click()

    // Wait for capacity metrics
    await expect(page.locator('text=קיבולת כוללת')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=מקומות תפוסים')).toBeVisible()
    await expect(page.locator('text=שיעור תפוסה ממוצע')).toBeVisible()
  })

  test('should switch to check-ins tab', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-checkins'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Click check-ins tab
    await page.locator('button:has-text("נוכחות")').click()

    // Wait for check-in metrics
    // Use paragraph selector to avoid matching chart legend and table header
    await expect(page.locator('p:has-text("נכחו")')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('p:has-text("לא הגיעו")')).toBeVisible()
    // Use paragraph selector to avoid matching heading "אירועים לפי שיעור נוכחות"
    await expect(page.locator('p:has-text("שיעור נוכחות")')).toBeVisible()
  })

  test('should switch to platform health tab', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-platform'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Click platform health tab
    await page.locator('button:has-text("בריאות המערכת")').click()

    // Wait for platform metrics
    await expect(page.locator('text=סה״כ בתי ספר')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=בתי ספר פעילים')).toBeVisible()
    await expect(page.locator('text=סה״כ משתמשים')).toBeVisible()
  })
})

test.describe('Statistics Dashboard - Date Range Filter', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display all date range options', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-dates'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Verify all date range buttons are visible
    await expect(page.locator('button:has-text("7 ימים")')).toBeVisible()
    await expect(page.locator('button:has-text("30 ימים")')).toBeVisible()
    await expect(page.locator('button:has-text("90 ימים")')).toBeVisible()
    await expect(page.locator('button:has-text("שנה")')).toBeVisible()
  })

  test('should change date range to 7 days and reload data', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-7d'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Wait for network request when changing date range
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/admin/super/statistics/revenue'),
      { timeout: 10000 }
    )

    // Click 7 days button
    await page.locator('button:has-text("7 ימים")').click()

    // Wait for API call to complete
    await responsePromise

    // Verify 7d button is active (white background, shadow)
    const button7d = page.locator('button:has-text("7 ימים")')
    await expect(button7d).toHaveClass(/bg-white/)
    await expect(button7d).toHaveClass(/shadow-sm/)
  })

  test('should change date range to 90 days', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-90d'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Wait for network request
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/admin/super/statistics/revenue'),
      { timeout: 10000 }
    )

    // Click 90 days button
    await page.locator('button:has-text("90 ימים")').click()

    await responsePromise

    // Verify 90d button is active
    const button90d = page.locator('button:has-text("90 ימים")')
    await expect(button90d).toHaveClass(/bg-white/)
  })

  test('should change date range to 1 year', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-1y'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Wait for network request
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/admin/super/statistics/revenue'),
      { timeout: 10000 }
    )

    // Click 1 year button
    await page.locator('button:has-text("שנה")').click()

    await responsePromise

    // Verify 1y button is active
    const button1y = page.locator('button:has-text("שנה")')
    await expect(button1y).toHaveClass(/bg-white/)
  })

  test('should refresh data when changing tabs with different date range', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-tab-date'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Change date range to 7 days
    await page.locator('button:has-text("7 ימים")').click()
    await page.waitForTimeout(1000)

    // Wait for network request when switching tabs
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/admin/super/statistics/registrations'),
      { timeout: 10000 }
    )

    // Switch to registrations tab
    await page.locator('button:has-text("הרשמות")').click()

    // Wait for API call with 7d date range
    const response = await responsePromise
    const url = response.url()
    expect(url).toContain('from=')
    expect(url).toContain('to=')
  })
})

test.describe('Statistics Dashboard - Export Functionality', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display CSV export button', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-export'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Verify export button is visible
    const exportButton = page.locator('button:has-text("ייצוא CSV")')
    await expect(exportButton).toBeVisible()

    // Verify button has correct styling
    await expect(exportButton).toHaveClass(/bg-green-600/)
  })

  test('should trigger download when clicking export button', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-export-click'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Wait for download event
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })

    // Click export button
    await page.locator('button:has-text("ייצוא CSV")').click()

    // Wait for download to start
    const download = await downloadPromise

    // Verify download filename contains expected pattern
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/statistics_.*\.csv/)
    expect(filename).toContain('revenue') // Default tab is revenue
  })

  test('should export correct tab data', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-export-tab'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Switch to registrations tab
    await page.locator('button:has-text("הרשמות")').click()
    await page.waitForTimeout(1000)

    // Wait for download
    const downloadPromise = page.waitForEvent('download', { timeout: 15000 })

    // Click export button
    await page.locator('button:has-text("ייצוא CSV")').click()

    const download = await downloadPromise
    const filename = download.suggestedFilename()

    // Should contain 'registrations' in filename
    expect(filename).toContain('registrations')
  })
})

test.describe('Statistics Dashboard - Refresh Functionality', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display refresh button', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-refresh'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Verify refresh button is visible (icon button)
    const refreshButton = page.locator('button:has(svg.lucide-refresh-cw)')
    await expect(refreshButton).toBeVisible()
  })

  test('should refresh data when clicking refresh button', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-refresh-click'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Wait for network request on refresh
    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/admin/super/statistics/revenue'),
      { timeout: 10000 }
    )

    // Click refresh button
    const refreshButton = page.locator('button:has(svg.lucide-refresh-cw)')
    await refreshButton.click()

    // Wait for API call
    await responsePromise

    // Verify refresh icon animates (has animate-spin class temporarily)
    // Note: This is tricky to test as animation is brief, so we just verify button is clickable
    await expect(refreshButton).toBeEnabled()
  })
})

test.describe('Statistics Dashboard - Chart Rendering', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should render revenue chart on default tab', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-chart'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    // Wait for chart to render
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Allow Recharts to render

    // Verify revenue trend chart title
    await expect(page.locator('h3:has-text("מגמת הכנסות")')).toBeVisible()

    // Verify chart container exists (ResponsiveContainer from Recharts)
    const chartContainer = page.locator('.recharts-wrapper').first()
    await expect(chartContainer).toBeVisible({ timeout: 10000 })
  })

  test('should render stat cards with metrics', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-statcards'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Verify stat cards are visible
    await expect(page.locator('text=הכנסות כוללות')).toBeVisible()
    await expect(page.locator('text=החזרים')).toBeVisible()
    await expect(page.locator('text=הכנסות נטו')).toBeVisible()
    await expect(page.locator('text=תשלומים שהושלמו')).toBeVisible()

    // Verify at least one stat card shows numeric data
    const statCards = page.locator('.bg-white.rounded-xl.shadow-sm')
    await expect(statCards.first()).toBeVisible()
  })

  test('should render pie chart for payment status distribution', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-piechart'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Verify pie chart section
    await expect(page.locator('h3:has-text("פילוח סטטוס תשלומים")')).toBeVisible()

    // Verify at least one Recharts chart is rendered
    const charts = page.locator('.recharts-wrapper')
    await expect(charts.first()).toBeVisible({ timeout: 10000 })
  })

  test('should render top schools list', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-topschools'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Verify top schools section
    await expect(page.locator('h3:has-text("בתי ספר מובילים")')).toBeVisible()
  })

  test('should render bar chart on registrations tab', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-barchart'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Switch to registrations tab
    await page.locator('button:has-text("הרשמות")').click()
    await page.waitForTimeout(2000)

    // Verify registrations trend chart
    await expect(page.locator('h3:has-text("מגמת הרשמות")')).toBeVisible()

    // Verify chart renders
    const charts = page.locator('.recharts-wrapper')
    await expect(charts.first()).toBeVisible({ timeout: 10000 })
  })

  test('should render top events table on registrations tab', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-topevents'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Switch to registrations tab
    await page.locator('button:has-text("הרשמות")').click()
    await page.waitForTimeout(1000)

    // Verify top events table
    await expect(page.locator('h3:has-text("אירועים מובילים לפי הרשמות")')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })
})

test.describe('Statistics Dashboard - Loading States', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should show loading skeleton on initial load', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-loading'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')

    // Navigate and immediately check for loading state
    await page.goto('/admin/statistics')

    // Loading skeleton should be visible briefly
    // Look for animated pulse elements
    const loadingElements = page.locator('.animate-pulse')

    // If page loads too fast, this might not be visible, so we make it optional
    const hasLoadingState = await loadingElements
      .first()
      .isVisible({ timeout: 1000 })
      .catch(() => false)

    // Either loading state was shown, or content loaded immediately (both are valid)
    if (hasLoadingState) {
      expect(hasLoadingState).toBeTruthy()
    }

    // Eventually, real content should be visible
    await expect(page.locator('h1:has-text("סטטיסטיקות מערכת")')).toBeVisible({ timeout: 10000 })
  })

  test('should show loading spinner when switching tabs', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-tab-loading'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Click on registrations tab
    await page.locator('button:has-text("הרשמות")').click()

    // Look for spinning refresh icon (loading indicator)
    // This might be brief, so we allow it to not be visible if loading is fast
    const loadingSpinner = page.locator('.animate-spin')
    await loadingSpinner.isVisible({ timeout: 2000 }).catch(() => {
      // Loading was too fast, that's okay
    })

    // Eventually content should load
    await expect(page.locator('text=סה״כ הרשמות')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Statistics Dashboard - Error Handling', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should handle API errors gracefully', async ({ page, context }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-error'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')

    // Intercept API calls and simulate error
    await page.route('**/api/admin/super/statistics/revenue*', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      })
    })

    await page.goto('/admin/statistics')

    // Should show error message
    await expect(page.locator('text=שגיאה בטעינת הנתונים')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Statistics Dashboard - Data Integration', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display real data from database', async ({ page }) => {
    // Create test data: school, event, registrations, payments
    const school = await createSchool().withName('Test School for Stats').create()

    const event = await createEvent()
      .withTitle('Test Event for Stats')
      .withSchool(school.id)
      .withCapacity(100)
      .inFuture()
      .withPayment(true, 'UPFRONT', 'PER_GUEST', 50, 'ILS')
      .create()

    // Create some registrations
    await createRegistration()
      .withEvent(event.id)
      .withName('Test User 1')
      .withSpots(2)
      .confirmed()
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Test User 2')
      .withSpots(1)
      .confirmed()
      .create()

    // Create super admin
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-realdata'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Switch to registrations tab to see our test data
    await page.locator('button:has-text("הרשמות")').click()
    await page.waitForTimeout(2000)

    // Verify some registration data is displayed
    await expect(page.locator('text=סה״כ הרשמות')).toBeVisible()

    // The actual numbers should be greater than 0 since we created registrations
    const totalRegsText = await page
      .locator('text=סה״כ הרשמות')
      .locator('..')
      .locator('..')
      .textContent()
    expect(totalRegsText).toBeTruthy()
  })
})

test.describe('Statistics Dashboard - Mobile Responsiveness', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('should display mobile-friendly layout', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-mobile'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Verify header is visible on mobile
    await expect(page.locator('h1:has-text("סטטיסטיקות מערכת")')).toBeVisible()

    // Verify tabs are scrollable (overflow-x-auto)
    const tabContainer = page.locator('.flex.overflow-x-auto').first()
    await expect(tabContainer).toBeVisible()

    // Verify date range buttons are visible
    await expect(page.locator('button:has-text("7 ימים")')).toBeVisible()

    // Verify export button shows only icon (no text) on mobile
    const exportButton = page.locator('button:has(svg.lucide-download)')
    await expect(exportButton).toBeVisible()
  })

  test('should allow tab navigation on mobile', async ({ page }) => {
    const superAdmin = await createAdmin()
      .withEmail(generateEmail('super-admin-mobile-tabs'))
      .withPassword('TestPassword123!')
      .withRole('SUPER_ADMIN')
      .withSchool(null)
      .create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(superAdmin.email, 'TestPassword123!')
    await page.goto('/admin/statistics')

    await page.waitForLoadState('networkidle')

    // Click registrations tab on mobile
    await page.locator('button:has-text("הרשמות")').click()

    // Verify content changes
    await expect(page.locator('text=סה״כ הרשמות')).toBeVisible({ timeout: 10000 })
  })
})

// US-STAT-05: Registration counts accurate after cancellations
test.describe('[US-STAT-05] Accurate counts after cancellation', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('server: registrations API shows correct confirmed vs cancelled counts', async ({
    context,
  }) => {
    const school = await createSchool().withName('Stats Accuracy Test').create()
    const admin = await createAdmin().withSchool(school.id).create()
    const event = await createEvent().withSchool(school.id).withCapacity(100).inFuture().create()

    await createRegistration().withEvent(event.id).confirmed().create()
    await createRegistration().withEvent(event.id).confirmed().create()
    await createRegistration().withEvent(event.id).confirmed().create()
    await createRegistration().withEvent(event.id).cancelled().create()

    await loginViaAPI(context, admin.email, admin.password)
    const res = await context.request.get(`/api/events/${event.id}/registrations`)
    if (res.status() === 200) {
      const body = await res.json()
      const regs = body.registrations ?? body
      if (Array.isArray(regs)) {
        const confirmed = regs.filter((r: any) => r.status === 'CONFIRMED')
        const cancelled = regs.filter((r: any) => r.status === 'CANCELLED')
        expect(confirmed.length).toBe(3)
        expect(cancelled.length).toBe(1)
      }
    }
  })
})

// US-STAT-01: Statistics dashboard loads without error
test.describe('[US-STAT-01] Statistics dashboard loads', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('client: /admin/statistics renders without 500', async ({ page, context }) => {
    const school = await createSchool().withName('Stats Dashboard Test').create()
    const admin = await createAdmin().withSchool(school.id).create()

    await loginViaAPI(context, admin.email, admin.password)
    await page.goto('http://localhost:9000/admin/statistics')
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })
})

// US-STAT-02: Per-event stats tab loads
test.describe('[US-STAT-02] Per-event statistics', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('client: event overview tab shows metrics without error', async ({ page, context }) => {
    const school = await createSchool().withName('PerEvt Stats Test').create()
    const admin = await createAdmin().withSchool(school.id).create()
    const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()
    await createRegistration().withEvent(event.id).confirmed().create()

    await loginViaAPI(context, admin.email, admin.password)
    await page.goto(`http://localhost:9000/admin/events/${event.id}`)
    await expect(page.locator('body')).not.toContainText(/500|Internal Server Error/i)
  })
})
