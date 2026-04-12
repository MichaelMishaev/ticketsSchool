import { test, expect } from '@playwright/test'
import { prisma } from '@/lib/prisma'

/**
 * P0 Critical Tests: Table Management Features
 * - Duplicate tables (single & bulk)
 * - Template system (save & apply)
 * - Bulk edit operations
 * - Bulk delete operations
 */

test.describe('Table Management - P0 Critical', () => {
  let schoolId: string
  let adminEmail: string
  let eventId: string

  test.beforeAll(async () => {
    // Create test school and admin
    const school = await prisma.school.create({
      data: {
        name: 'Table Test School',
        slug: `table-test-${Date.now()}`,
        primaryColor: '#3b82f6'
      }
    })
    schoolId = school.id

    const admin = await prisma.admin.create({
      data: {
        email: `table-test-${Date.now()}@test.com`,
        passwordHash: '$2a$10$abcdefghijklmnopqrstuvwxyz', // Hashed "password"
        name: 'Table Test Admin',
        role: 'ADMIN',
        schoolId,
        emailVerified: true
      }
    })
    adminEmail = admin.email

    // Create test event
    const event = await prisma.event.create({
      data: {
        title: 'Table Management Test Event',
        slug: `table-test-event-${Date.now()}`,
        schoolId,
        startAt: new Date(Date.now() + 86400000), // Tomorrow
        capacity: 100,
        status: 'OPEN',
        eventType: 'TABLE_BASED'
      }
    })
    eventId = event.id
  })

  test.afterAll(async () => {
    // Cleanup
    await prisma.table.deleteMany({ where: { eventId } })
    await prisma.event.deleteMany({ where: { schoolId } })
    await prisma.admin.deleteMany({ where: { schoolId } })
    await prisma.school.delete({ where: { id: schoolId } })
  })

  test('should duplicate a table with auto-increment naming', async ({ page }) => {
    // Login
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    // Create initial table
    const table = await prisma.table.create({
      data: {
        eventId,
        tableNumber: '5',
        capacity: 8,
        minOrder: 4,
        tableOrder: 1,
        status: 'AVAILABLE'
      }
    })

    // Go to event details
    await page.goto(`/admin/events/${eventId}`)
    await expect(page.locator('text=שולחן 5')).toBeVisible()

    // Click duplicate button
    await page.locator('[aria-label="שכפל שולחן"]').first().click()

    // Modal should appear
    await expect(page.locator('text=שכפול שולחן')).toBeVisible()

    // Enter count
    await page.fill('#count', '3')

    // Verify preview
    await expect(page.locator('text=שולחן 6')).toBeVisible()
    await expect(page.locator('text=שולחן 7')).toBeVisible()
    await expect(page.locator('text=שולחן 8')).toBeVisible()

    // Confirm
    await page.click('text=צור 3 שולחנות')

    // Verify success message
    await expect(page.locator('text=נוצרו 3 שולחנות בהצלחה')).toBeVisible()

    // Verify tables were created
    const tables = await prisma.table.findMany({
      where: { eventId },
      orderBy: { tableNumber: 'asc' }
    })
    expect(tables).toHaveLength(4)
    expect(tables.map(t => t.tableNumber)).toEqual(['5', '6', '7', '8'])
  })

  test('should save current tables as template', async ({ page }) => {
    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Click save as template
    await page.click('text=שמור שולחנות נוכחיים כתבנית')

    // Fill template details
    await expect(page.locator('text=שמירת תבנית')).toBeVisible()
    await page.fill('#template-name', 'Test Template')
    await page.fill('#template-description', 'Test description')

    // Save
    await page.click('text=שמור תבנית')

    // Verify success
    await expect(page.locator('text=תבנית "Test Template" נשמרה בהצלחה')).toBeVisible()

    // Verify in database
    const template = await prisma.tableTemplate.findFirst({
      where: {
        schoolId,
        name: 'Test Template'
      }
    })
    expect(template).toBeTruthy()
    expect(template?.description).toBe('Test description')
  })

  test('should apply template to create tables', async ({ page }) => {
    // Create a template first
    const template = await prisma.tableTemplate.create({
      data: {
        schoolId,
        name: 'Quick Template',
        config: [
          { capacity: 10, minOrder: 5, count: 10, namePattern: '{n}' }
        ]
      }
    })

    // Create new event for testing
    const newEvent = await prisma.event.create({
      data: {
        title: 'Template Test Event',
        slug: `template-test-${Date.now()}`,
        schoolId,
        startAt: new Date(Date.now() + 86400000),
        capacity: 100,
        status: 'OPEN',
        eventType: 'TABLE_BASED'
      }
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${newEvent.id}`)

    // Click templates card
    await page.click('text=תבניות מוכנות')

    // Select template
    await expect(page.locator('text=Quick Template')).toBeVisible()
    await page.locator('text=Quick Template').click()

    // Verify success
    await expect(page.locator('text=נוצרו 10 שולחנות מתבנית')).toBeVisible()

    // Verify tables created
    const tables = await prisma.table.findMany({
      where: { eventId: newEvent.id }
    })
    expect(tables).toHaveLength(10)

    // Cleanup
    await prisma.table.deleteMany({ where: { eventId: newEvent.id } })
    await prisma.event.delete({ where: { id: newEvent.id } })
    await prisma.tableTemplate.delete({ where: { id: template.id } })
  })

  test('should bulk edit multiple tables', async ({ page }) => {
    // Create multiple tables
    await prisma.table.createMany({
      data: [
        { eventId, tableNumber: '10', capacity: 6, minOrder: 3, tableOrder: 10, status: 'AVAILABLE' },
        { eventId, tableNumber: '11', capacity: 6, minOrder: 3, tableOrder: 11, status: 'AVAILABLE' },
        { eventId, tableNumber: '12', capacity: 6, minOrder: 3, tableOrder: 12, status: 'AVAILABLE' }
      ]
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Enable bulk selection mode
    await page.click('text=בחירה מרובה')

    // Select tables
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.nth(0).check()
    await checkboxes.nth(1).check()
    await checkboxes.nth(2).check()

    // Verify bulk actions bar appears
    await expect(page.locator('text=3 שולחנות נבחרו')).toBeVisible()

    // Click edit button
    await page.locator('button:has-text("ערוך")').click()

    // Fill bulk edit form
    await expect(page.locator('text=עריכה מרובה')).toBeVisible()
    await page.fill('#bulk-capacity', '10')
    await page.fill('#bulk-minOrder', '5')

    // Submit
    await page.click('text=עדכן 3 שולחנות')

    // Verify success
    await expect(page.locator('text=עודכנו 3 שולחנות בהצלחה')).toBeVisible()

    // Verify in database
    const updatedTables = await prisma.table.findMany({
      where: {
        eventId,
        tableNumber: { in: ['10', '11', '12'] }
      }
    })
    expect(updatedTables.every(t => t.capacity === 10 && t.minOrder === 5)).toBe(true)
  })

  test('should bulk delete multiple tables', async ({ page }) => {
    // Create test tables
    await prisma.table.createMany({
      data: [
        { eventId, tableNumber: '20', capacity: 8, minOrder: 4, tableOrder: 20, status: 'AVAILABLE' },
        { eventId, tableNumber: '21', capacity: 8, minOrder: 4, tableOrder: 21, status: 'AVAILABLE' }
      ]
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Enable bulk selection
    await page.click('text=בחירה מרובה')

    // Select tables to delete
    const checkboxes = page.locator('input[type="checkbox"]')
    await checkboxes.last().check()
    await checkboxes.nth(-2).check()

    // Click delete
    page.on('dialog', dialog => dialog.accept()) // Accept confirmation
    await page.locator('button:has-text("מחק")').click()

    // Verify success
    await expect(page.locator('text=נמחקו 2 שולחנות בהצלחה')).toBeVisible()

    // Verify in database
    const remainingTables = await prisma.table.findMany({
      where: {
        eventId,
        tableNumber: { in: ['20', '21'] }
      }
    })
    expect(remainingTables).toHaveLength(0)
  })

  test('should prevent bulk delete of reserved tables', async ({ page }) => {
    // Create reserved table
    await prisma.table.create({
      data: {
        eventId,
        tableNumber: '30',
        capacity: 8,
        minOrder: 4,
        tableOrder: 30,
        status: 'RESERVED'
      }
    })

    // Login and navigate
    await page.goto('/admin/login')
    await page.fill('[name="email"]', adminEmail)
    await page.fill('[name="password"]', 'password')
    await page.click('button[type="submit"]')
    await page.waitForURL('/admin')

    await page.goto(`/admin/events/${eventId}`)

    // Try to select reserved table - should not have checkbox
    const reservedCard = page.locator('text=שולחן 30').locator('..')
    await expect(reservedCard.locator('input[type="checkbox"]')).toHaveCount(0)
  })
})
