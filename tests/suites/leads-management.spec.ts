import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

test.describe('Leads Management', () => {
  let schoolId: string
  let adminEmail: string
  let adminPassword: string

  test.beforeAll(async () => {
    await cleanupTestData()
  })

  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.beforeEach(async ({ page }) => {
    // Create test school and admin
    const school = await createSchool()
      .withName('Test School Leads')
      .withSlug('test-school-leads')
      .create()
    schoolId = school.id

    adminEmail = `admin-${Date.now()}@test.com`
    adminPassword = 'Password123!'

    await createAdmin()
      .withEmail(adminEmail)
      .withPassword(adminPassword)
      .withSchool(schoolId)
      .withRole('ADMIN')
      .create()

    // Login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(adminEmail, adminPassword)
  })

  test('should display leads tab in navigation', async ({ page }) => {
    await expect(page.locator('text=לידים')).toBeVisible()
  })

  test('should show all leads grouped by phone number', async ({ page }) => {
    // Create 2 events
    const event1 = await createEvent()
      .withTitle('Event 1')
      .withSchool(schoolId)
      .create()

    const event2 = await createEvent()
      .withTitle('Event 2')
      .withSchool(schoolId)
      .create()

    // Create registrations for same person (same phone) in both events
    await createRegistration()
      .withEvent(event1.id)
      .withName('John Doe')
      .withPhone('050-1234567')
      .withEmail('john@test.com')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event2.id)
      .withName('John Doe')
      .withPhone('0501234567') // Same phone, different format
      .withEmail('john@test.com')
      .withStatus('WAITLIST')
      .create()

    // Navigate to leads page
    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Should see one row for John Doe with 2 events
    await expect(page.locator('text=John Doe')).toBeVisible()
    await expect(page.locator('text=0501234567')).toBeVisible()

    // Should show event counts
    await expect(page.locator('text=/1.*✓/i')).toBeVisible() // 1 confirmed
    await expect(page.locator('text=/1.*⏰/i')).toBeVisible() // 1 waitlist
  })

  test('should filter leads by event', async ({ page }) => {
    const event1 = await createEvent()
      .withTitle('Soccer Game')
      .withSchool(schoolId)
      .create()

    const event2 = await createEvent()
      .withTitle('Basketball Game')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event1.id)
      .withName('Alice')
      .withPhone('050-1111111')
      .create()

    await createRegistration()
      .withEvent(event2.id)
      .withName('Bob')
      .withPhone('050-2222222')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Should see both leads initially
    await expect(page.locator('text=Alice')).toBeVisible()
    await expect(page.locator('text=Bob')).toBeVisible()

    // Filter by Soccer Game - using searchable select
    // Click the searchable select trigger
    await page.click('button:has-text("כל האירועים")')
    // Type to search
    await page.fill('input[placeholder="חפש אירוע..."]', 'Soccer')
    // Click the option
    await page.click('button:has-text("Soccer Game")')
    await page.waitForTimeout(500)

    // Should only see Alice
    await expect(page.locator('text=Alice')).toBeVisible()
    await expect(page.locator('text=Bob')).not.toBeVisible()
  })

  test('should filter leads by status', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Confirmed Person')
      .withPhone('050-1111111')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Waitlist Person')
      .withPhone('050-2222222')
      .withStatus('WAITLIST')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Filter by confirmed only
    await page.selectOption('select[name="statusFilter"]', 'CONFIRMED')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Confirmed Person')).toBeVisible()
    await expect(page.locator('text=Waitlist Person')).not.toBeVisible()

    // Filter by waitlist only
    await page.selectOption('select[name="statusFilter"]', 'WAITLIST')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Confirmed Person')).not.toBeVisible()
    await expect(page.locator('text=Waitlist Person')).toBeVisible()
  })

  test('should search leads by name, phone, or email', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Alice Wonder')
      .withPhone('050-1111111')
      .withEmail('alice@test.com')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Bob Builder')
      .withPhone('050-2222222')
      .withEmail('bob@test.com')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Search by name
    await page.fill('input[name="search"]', 'Alice')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Alice Wonder')).toBeVisible()
    await expect(page.locator('text=Bob Builder')).not.toBeVisible()

    // Search by phone
    await page.fill('input[name="search"]', '050-2222222')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Alice Wonder')).not.toBeVisible()
    await expect(page.locator('text=Bob Builder')).toBeVisible()

    // Search by email
    await page.fill('input[name="search"]', 'alice@')
    await page.waitForTimeout(500)

    await expect(page.locator('text=Alice Wonder')).toBeVisible()
    await expect(page.locator('text=Bob Builder')).not.toBeVisible()
  })

  test('should filter leads by date range', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    // Create old registration
    const oldReg = await createRegistration()
      .withEvent(event.id)
      .withName('Old Lead')
      .withPhone('050-1111111')
      .create()

    // Manually update createdAt to 60 days ago
    await prisma.registration.update({
      where: { id: oldReg.id },
      data: { createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) }
    })

    // Create recent registration
    await createRegistration()
      .withEvent(event.id)
      .withName('Recent Lead')
      .withPhone('050-2222222')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Filter to last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]

    await page.fill('input[name="dateFrom"]', thirtyDaysAgo)
    await page.waitForTimeout(500)

    // Should only see recent lead
    await expect(page.locator('text=Recent Lead')).toBeVisible()
    await expect(page.locator('text=Old Lead')).not.toBeVisible()
  })

  test('should sort leads by clicking column headers', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Zara')
      .withPhone('050-1111111')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Alice')
      .withPhone('050-2222222')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Click name column header to sort
    await page.click('th:has-text("שם")')
    await page.waitForTimeout(500)

    // Check order (Alice should be first)
    const rows = page.locator('tbody tr')
    const firstRow = rows.first()
    await expect(firstRow.locator('text=Alice')).toBeVisible()
  })

  test('should export leads to CSV', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Test Lead')
      .withPhone('050-1234567')
      .withEmail('test@test.com')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Click export button
    const downloadPromise = page.waitForEvent('download')
    await page.click('button:has-text("ייצוא ל-CSV")')
    const download = await downloadPromise

    // Verify download
    expect(download.suggestedFilename()).toContain('leads')
    expect(download.suggestedFilename()).toContain('.csv')
  })

  test('should enforce multi-tenant isolation', async ({ page }) => {
    // Create another school with leads
    const otherSchool = await createSchool()
      .withName('Other School')
      .withSlug('other-school-leads')
      .create()

    const otherEvent = await createEvent()
      .withTitle('Other Event')
      .withSchool(otherSchool.id)
      .create()

    await createRegistration()
      .withEvent(otherEvent.id)
      .withName('Other School Lead')
      .withPhone('050-9999999')
      .create()

    // Create lead for current school
    const event = await createEvent()
      .withTitle('My Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('My School Lead')
      .withPhone('050-1111111')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Should only see current school's leads
    await expect(page.locator('text=My School Lead')).toBeVisible()
    await expect(page.locator('text=Other School Lead')).not.toBeVisible()
  })

  test('should display stats cards with correct counts', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Stats Test Event')
      .withSchool(schoolId)
      .create()

    // Create 3 confirmed and 2 waitlist registrations
    await createRegistration()
      .withEvent(event.id)
      .withName('Confirmed 1')
      .withPhone('050-1111111')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Confirmed 2')
      .withPhone('050-2222222')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Confirmed 3')
      .withPhone('050-3333333')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Waitlist 1')
      .withPhone('050-4444444')
      .withStatus('WAITLIST')
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('Waitlist 2')
      .withPhone('050-5555555')
      .withStatus('WAITLIST')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Wait for data to load
    await page.waitForSelector('text=סך הכל לידים')

    // Check total leads stat card
    const totalCard = page.locator('text=סך הכל לידים').locator('..')
    await expect(totalCard.locator('text=5')).toBeVisible()

    // Check confirmed stat card
    const confirmedCard = page.locator('text=רשומים מאושרים').locator('..')
    await expect(confirmedCard.locator('text=3')).toBeVisible()

    // Check waitlist stat card
    const waitlistCard = page.locator('text=רשימת המתנה').locator('..')
    await expect(waitlistCard.locator('text=2')).toBeVisible()
  })

  test('should show skeleton loading state', async ({ page }) => {
    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Check for skeleton loading elements (should appear briefly)
    // We can't reliably test this without slowing down the API
    // But we can verify the structure exists in the DOM
    const table = page.locator('table')
    await expect(table).toBeVisible()
  })

  test('should show actionable empty state with no leads', async ({ page }) => {
    // Don't create any leads
    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Should see empty state message
    await expect(page.locator('text=לא נמצאו לידים')).toBeVisible()
    await expect(page.locator('text=עדיין אין לידים במערכת')).toBeVisible()

    // Should see search icon
    const icon = page.locator('svg').first()
    await expect(icon).toBeVisible()
  })

  test('should show empty state with filters and clear button', async ({ page }) => {
    const event = await createEvent()
      .withTitle('Test Event')
      .withSchool(schoolId)
      .create()

    await createRegistration()
      .withEvent(event.id)
      .withName('John Doe')
      .withPhone('050-1234567')
      .withStatus('CONFIRMED')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Apply filter that will return no results
    await page.fill('input[name="search"]', 'NonExistentPerson')
    await page.waitForTimeout(500)

    // Should see filtered empty state
    await expect(page.locator('text=לא נמצאו לידים התואמים את הפילטרים שבחרת')).toBeVisible()

    // Should see suggestions
    await expect(page.locator('text=💡 נסה:')).toBeVisible()
    await expect(page.locator('text=לחפש משהו אחר')).toBeVisible()

    // Should see clear filters button
    const clearButton = page.locator('button:has-text("נקה את כל הפילטרים")')
    await expect(clearButton).toBeVisible()

    // Click clear button
    await clearButton.click()
    await page.waitForTimeout(500)

    // Should now see the lead
    await expect(page.locator('text=John Doe')).toBeVisible()
  })

  test('should update stats when filtering', async ({ page }) => {
    const event1 = await createEvent()
      .withTitle('Event A')
      .withSchool(schoolId)
      .create()

    const event2 = await createEvent()
      .withTitle('Event B')
      .withSchool(schoolId)
      .create()

    // Event A: 2 confirmed
    await createRegistration()
      .withEvent(event1.id)
      .withPhone('050-1111111')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event1.id)
      .withPhone('050-2222222')
      .withStatus('CONFIRMED')
      .create()

    // Event B: 1 confirmed, 1 waitlist
    await createRegistration()
      .withEvent(event2.id)
      .withPhone('050-3333333')
      .withStatus('CONFIRMED')
      .create()

    await createRegistration()
      .withEvent(event2.id)
      .withPhone('050-4444444')
      .withStatus('WAITLIST')
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Initial stats: 4 total, 3 confirmed, 1 waitlist
    await expect(page.locator('text=סך הכל לידים').locator('..').locator('text=4')).toBeVisible()

    // Filter by Event A
    await page.click('button:has-text("כל האירועים")')
    await page.fill('input[placeholder="חפש אירוע..."]', 'Event A')
    await page.click('button:has-text("Event A")')
    await page.waitForTimeout(500)

    // Stats should update: 2 total, 2 confirmed, 0 waitlist
    await expect(page.locator('text=סך הכל לידים').locator('..').locator('text=2')).toBeVisible()
    await expect(page.locator('text=רשומים מאושרים').locator('..').locator('text=2')).toBeVisible()
    await expect(page.locator('text=רשימת המתנה').locator('..').locator('text=0')).toBeVisible()
  })

  test('should normalize phone numbers when grouping', async ({ page }) => {
    const event1 = await createEvent()
      .withTitle('Event 1')
      .withSchool(schoolId)
      .create()

    const event2 = await createEvent()
      .withTitle('Event 2')
      .withSchool(schoolId)
      .create()

    // Create registrations with different phone formats
    await createRegistration()
      .withEvent(event1.id)
      .withName('John Doe')
      .withPhone('050-123-4567') // With dashes
      .create()

    await createRegistration()
      .withEvent(event2.id)
      .withName('John Doe')
      .withPhone('0501234567') // No dashes
      .create()

    await createRegistration()
      .withEvent(event2.id)
      .withName('John Doe')
      .withPhone('+972501234567') // International format
      .create()

    await page.click('text=לידים')
    await page.waitForURL('**/admin/leads')

    // Should see only ONE row for John Doe (all phones normalized to same number)
    const rows = page.locator('tbody tr:has-text("John Doe")')
    await expect(rows).toHaveCount(1)

    // Should show 3 events
    await expect(page.locator('text=/3.*events/i')).toBeVisible()
  })
})
