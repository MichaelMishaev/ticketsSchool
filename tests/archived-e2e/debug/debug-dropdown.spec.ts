import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from './fixtures/test-data'

/**
 * SIMPLIFIED DEBUG TEST
 * Purpose: Isolate and identify why dropdown button doesn't appear
 */

test.describe('Debug: Dropdown Button Rendering', () => {
  test.afterAll(async () => await cleanupTestData())

  test('STEP 1: Verify basic login works', async ({ page }) => {
    // Create test data
    const school = await createSchool().withName('Debug School').create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail('debug@test.com')
      .withRole('ADMIN')
      .create()

    console.log('✓ Test data created:', {
      schoolId: school.id,
      adminId: admin.id,
      adminRole: admin.role,
    })

    // Go to login page
    await page.goto('http://localhost:9000/admin/login')

    // Login
    await page.fill('input[type="email"]', 'debug@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')

    // Wait for navigation
    await page.waitForURL('**/admin')
    console.log('✓ Logged in and redirected to:', page.url())

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-01-after-login.png', fullPage: true })
  })

  test('STEP 2: Check what renders after login', async ({ page }) => {
    // Create test data
    const school = await createSchool().withName('Debug School 2').create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail('debug2@test.com')
      .withRole('ADMIN')
      .create()

    // Login
    await page.goto('http://localhost:9000/admin/login')
    await page.fill('input[type="email"]', 'debug2@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Wait a bit for any async loading
    await page.waitForTimeout(3000)

    // Get page HTML
    const html = await page.content()
    console.log('\n=== PAGE CONTENT ===')
    console.log('Page contains "טוען...":', html.includes('טוען...'))
    console.log('Page contains "לוח בקרה":', html.includes('לוח בקרה'))
    console.log('Page contains "אירוע חדש":', html.includes('אירוע חדש'))
    console.log('Page contains "צור אירוע חדש":', html.includes('צור אירוע חדש'))

    // Find all buttons
    const buttons = await page.locator('button').all()
    console.log(`\n=== FOUND ${buttons.length} BUTTONS ===`)

    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent()
      const ariaLabel = await buttons[i].getAttribute('aria-label')
      const classes = await buttons[i].getAttribute('class')
      console.log(`Button ${i + 1}:`)
      console.log(`  Text: "${text?.trim()}"`)
      console.log(`  Aria-label: "${ariaLabel}"`)
      console.log(`  Visible: ${await buttons[i].isVisible()}`)
    }

    // Check navigation
    const nav = await page.locator('nav').first()
    const navHTML = await nav.innerHTML()
    console.log('\n=== NAV HTML (first 500 chars) ===')
    console.log(navHTML.substring(0, 500))

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-02-buttons-check.png', fullPage: true })
  })

  test('STEP 3: Check API /admin/me response', async ({ page, request }) => {
    // Create test data
    const school = await createSchool().withName('Debug School 3').create()
    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail('debug3@test.com')
      .withRole('ADMIN')
      .create()

    // Login via page (to get session cookie)
    await page.goto('http://localhost:9000/admin/login')
    await page.fill('input[type="email"]', 'debug3@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Now check /api/admin/me using the same context
    const response = await page.request.get('http://localhost:9000/api/admin/me')
    const data = await response.json()

    console.log('\n=== /api/admin/me RESPONSE ===')
    console.log(JSON.stringify(data, null, 2))

    // Verify response
    expect(data.authenticated).toBe(true)
    expect(data.admin).toBeDefined()
    expect(data.admin.role).toBe('ADMIN')

    console.log('✓ Admin role:', data.admin.role)
    console.log('✓ School ID:', data.admin.schoolId)
  })

  test('STEP 4: Check if SUPER_ADMIN renders dropdown', async ({ page }) => {
    // Create SUPER_ADMIN
    const superAdmin = await createAdmin()
      .withEmail('super@test.com')
      .withRole('SUPER_ADMIN')
      .withSchool(null) // SUPER_ADMIN has no school
      .create()

    console.log('✓ Created SUPER_ADMIN:', {
      id: superAdmin.id,
      role: superAdmin.role,
      schoolId: superAdmin.schoolId,
    })

    // Login
    await page.goto('http://localhost:9000/admin/login')
    await page.fill('input[type="email"]', 'super@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')
    await page.waitForTimeout(3000)

    // Check what renders
    const html = await page.content()
    console.log('\n=== SUPER_ADMIN PAGE ===')
    console.log('Page contains "Super Admin":', html.includes('Super Admin'))
    console.log('Page contains "אירוע חדש":', html.includes('אירוע חדש'))

    // SUPER_ADMIN should NOT see dropdown (it's hidden for them)
    const dropdownButton = page.locator('button[aria-label="צור אירוע חדש"]')
    const isVisible = await dropdownButton.isVisible().catch(() => false)
    console.log('Dropdown visible for SUPER_ADMIN:', isVisible)

    // Take screenshot
    await page.screenshot({ path: 'test-results/debug-04-super-admin.png', fullPage: true })
  })

  test('STEP 5: Detailed check - Regular ADMIN with school', async ({ page }) => {
    // Create complete setup
    const school = await createSchool()
      .withName('Test School Final')
      .withSlug('test-school-final')
      .create()

    const admin = await createAdmin()
      .withSchool(school.id)
      .withEmail('final@test.com')
      .withName('Final Test Admin')
      .withRole('ADMIN')
      .emailVerified(true)
      .create()

    console.log('✓ Created complete test setup:', {
      school: { id: school.id, name: school.name },
      admin: { id: admin.id, role: admin.role, schoolId: admin.schoolId },
    })

    // Login
    await page.goto('http://localhost:9000/admin/login')
    await page.fill('input[type="email"]', 'final@test.com')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/admin')

    // Wait for loading state to finish
    console.log('Waiting for loading state...')
    await page.waitForSelector('text=טוען...', { state: 'hidden', timeout: 10000 }).catch(() => {
      console.log('Warning: Loading text not found or already hidden')
    })

    // Double-check with dashboard heading
    await page.waitForSelector('h2:has-text("לוח בקרה")', { timeout: 10000 }).catch(() => {
      console.log('Warning: Dashboard heading not found')
    })

    console.log('Loading complete, checking page state...')
    await page.waitForTimeout(2000)

    // Get comprehensive state
    const state = {
      url: page.url(),
      title: await page.title(),
      hasLoadingText: await page
        .locator('text=טוען...')
        .isVisible()
        .catch(() => false),
      hasDashboard: await page
        .locator('h2:has-text("לוח בקרה")')
        .isVisible()
        .catch(() => false),
      hasDropdownButton: await page
        .locator('button[aria-label="צור אירוע חדש"]')
        .isVisible()
        .catch(() => false),
    }

    console.log('\n=== PAGE STATE ===')
    console.log(JSON.stringify(state, null, 2))

    // Check network state
    const perfTiming = await page.evaluate(() => JSON.stringify(window.performance.timing))
    console.log('\n=== PERFORMANCE ===')
    console.log('Page loaded:', perfTiming)

    // Get all text content
    const bodyText = await page.locator('body').textContent()
    console.log('\n=== BODY TEXT (first 500 chars) ===')
    console.log(bodyText?.substring(0, 500))

    // Take final screenshot
    await page.screenshot({ path: 'test-results/debug-05-final-state.png', fullPage: true })

    // Now try to find the button with detailed diagnostics
    const dropdownButton = page.locator('button[aria-label="צור אירוע חדש"]')
    const count = await dropdownButton.count()
    console.log(`\nDropdown button count: ${count}`)

    if (count === 0) {
      console.log('❌ BUTTON NOT FOUND - Checking alternatives...')

      // Check for button with text
      const buttonWithText = page.locator('button:has-text("אירוע חדש")')
      const textCount = await buttonWithText.count()
      console.log(`Button with text "אירוע חדש": ${textCount}`)

      // Check for any CreateEventDropdown
      const anyDropdown = page.locator('button', { has: page.locator('text="אירוע חדש"') })
      const anyCount = await anyDropdown.count()
      console.log(`Any button containing "אירוע חדש": ${anyCount}`)

      // List ALL buttons again
      const allButtons = await page.locator('button').all()
      console.log(`\nTotal buttons on page: ${allButtons.length}`)
      for (let i = 0; i < allButtons.length; i++) {
        const text = await allButtons[i].textContent()
        const aria = await allButtons[i].getAttribute('aria-label')
        console.log(`  ${i + 1}. text="${text?.trim()}" aria="${aria}"`)
      }
    } else {
      console.log(`✓ BUTTON FOUND! Count: ${count}`)
      const isVisible = await dropdownButton.isVisible()
      console.log(`  Visible: ${isVisible}`)

      if (isVisible) {
        const box = await dropdownButton.boundingBox()
        console.log(`  Position: ${JSON.stringify(box)}`)
      }
    }
  })
})
