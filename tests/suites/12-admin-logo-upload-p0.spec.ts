import { test, expect } from '@playwright/test'
import { createAdmin, createSchool, createEvent, cleanupTestData } from '../fixtures/test-data'
import { generateEmail } from '../helpers/test-helpers'
import { loginViaAPI } from '../helpers/auth-helpers'
import { prisma } from '@/lib/prisma'
import path from 'path'

/**
 * P0 (CRITICAL) Admin Logo Upload Tests
 * Tests logo upload, deletion, validation, and multi-tenant isolation
 */

test.describe('Admin Logo Upload P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[12.1] Upload Valid Logo', () => {
    test('admin can upload valid 512x512 PNG logo', async ({ page, context }) => {
      // Setup: Create test school and admin
      const school = await createSchool().withName('Logo Upload Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('logo-upload'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Login
      await loginViaAPI(context, admin.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Verify no logo initially
      const currentLogo = page.locator('[data-testid="current-logo-preview"]')
      await expect(currentLogo).not.toBeVisible()

      // Upload logo
      const logoPath = path.join(__dirname, '../fixtures/test-logo-512.png')
      const fileInput = page.locator('[data-testid="logo-upload-input"]')
      await fileInput.setInputFiles(logoPath)

      // Wait for preview to appear
      await page.waitForTimeout(500) // Allow time for FileReader

      // Verify preview appears
      const newLogo = page.locator('[data-testid="new-logo-preview"]')
      await expect(newLogo).toBeVisible()

      // Click upload button
      const uploadButton = page.locator('[data-testid="logo-upload-button"]')
      await expect(uploadButton).toBeEnabled()
      await uploadButton.click()

      // Verify success message
      await expect(page.locator('text=הלוגו עודכן בהצלחה!')).toBeVisible({ timeout: 10000 })

      // Wait for reload
      await page.waitForLoadState('networkidle')

      // Verify logo saved in database
      const updatedSchool = await prisma.school.findUnique({ where: { id: school.id } })
      expect(updatedSchool?.logo).toBeTruthy()
      expect(updatedSchool?.logo).toContain('data:image/png;base64,')

      // Verify logo displays on settings page
      await page.goto('/admin/settings')
      await expect(page.locator('[data-testid="current-logo-preview"]')).toBeVisible()
    })
  })

  test.describe('[12.2] File Validation - Size', () => {
    test('system rejects oversized file (>5MB)', async ({ page, context }) => {
      // Setup
      const school = await createSchool().withName('Oversized Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('oversized'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await loginViaAPI(context, admin.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Try to upload oversized file
      const largeLogo = path.join(__dirname, '../fixtures/test-logo-large-6mb.png')
      await page.locator('[data-testid="logo-upload-input"]').setInputFiles(largeLogo)

      // Wait for validation
      await page.waitForTimeout(500)

      // Verify error message
      await expect(page.locator('text=/הקובץ גדול מדי/i')).toBeVisible({ timeout: 5000 })

      // Verify upload button disabled
      await expect(page.locator('[data-testid="logo-upload-button"]')).toBeDisabled()

      // Verify no logo saved to database
      const updatedSchool = await prisma.school.findUnique({ where: { id: school.id } })
      expect(updatedSchool?.logo).toBeNull()
    })
  })

  test.describe('[12.3] File Validation - Format', () => {
    test('system rejects invalid format (PDF)', async ({ page, context }) => {
      // Setup
      const school = await createSchool().withName('Invalid Format Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('invalid-format'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await loginViaAPI(context, admin.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Try to upload PDF file
      const pdfFile = path.join(__dirname, '../fixtures/test-document.pdf')
      await page.locator('[data-testid="logo-upload-input"]').setInputFiles(pdfFile)

      // Wait for validation
      await page.waitForTimeout(500)

      // Verify error message
      await expect(page.locator('text=/פורמט קובץ לא נתמך/i')).toBeVisible({ timeout: 5000 })

      // Verify upload button disabled
      await expect(page.locator('[data-testid="logo-upload-button"]')).toBeDisabled()
    })
  })

  test.describe('[12.4] Delete Logo', () => {
    test('admin can delete existing logo with confirmation', async ({ page, context }) => {
      // Setup: Create school with logo
      const school = await createSchool().withName('Delete Logo Test School').create()

      // Set a test logo directly in database
      const logoBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      await prisma.school.update({
        where: { id: school.id },
        data: { logo: logoBase64 },
      })

      const admin = await createAdmin()
        .withEmail(generateEmail('delete-logo'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await loginViaAPI(context, admin.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Verify logo exists
      await expect(page.locator('[data-testid="current-logo-preview"]')).toBeVisible()

      // Click delete button (first click - shows confirmation)
      const deleteButton = page.locator('[data-testid="logo-delete-button"]')
      await expect(deleteButton).toBeVisible()
      await deleteButton.click()

      // Verify confirmation state
      await expect(deleteButton).toHaveText('אישור מחיקה')

      // Confirm deletion (second click)
      await deleteButton.click()

      // Verify success message
      await expect(page.locator('text=הלוגו הוסר בהצלחה!')).toBeVisible({ timeout: 10000 })

      // Wait for reload
      await page.waitForLoadState('networkidle')

      // Verify logo removed from database
      const updatedSchool = await prisma.school.findUnique({ where: { id: school.id } })
      expect(updatedSchool?.logo).toBeNull()

      // Verify logo no longer displays
      await page.goto('/admin/settings')
      await expect(page.locator('[data-testid="current-logo-preview"]')).not.toBeVisible()
    })
  })

  test.describe('[12.5] Multi-Tenant Isolation (CRITICAL)', () => {
    test('admin A cannot upload logo for school B', async ({ page, context, browser }) => {
      // Setup: Create two schools with admins
      const schoolA = await createSchool().withName('School A Logo Test').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('admin-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Logo Test').create()
      const adminB = await createAdmin()
        .withEmail(generateEmail('admin-b'))
        .withPassword('TestPassword123!')
        .withSchool(schoolB.id)
        .create()

      // Login as Admin A
      await loginViaAPI(context, adminA.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Upload logo as Admin A (legitimate upload)
      const logoPath = path.join(__dirname, '../fixtures/test-logo-512.png')
      await page.locator('[data-testid="logo-upload-input"]').setInputFiles(logoPath)
      await page.waitForTimeout(500)
      await page.locator('[data-testid="logo-upload-button"]').click()
      await expect(page.locator('text=הלוגו עודכן בהצלחה!')).toBeVisible({ timeout: 10000 })

      // Verify logo uploaded to School A only
      const updatedSchoolA = await prisma.school.findUnique({ where: { id: schoolA.id } })
      const updatedSchoolB = await prisma.school.findUnique({ where: { id: schoolB.id } })

      expect(updatedSchoolA?.logo).toBeTruthy() // Admin A's school has logo
      expect(updatedSchoolB?.logo).toBeNull() // School B unaffected

      // Attempt API tampering (simulating malicious request)
      // Note: This is testing that the API uses schoolId from JWT, not request
      const newContext = await browser.newContext()
      await loginViaAPI(newContext, adminA.email, 'TestPassword123!')

      const formData = new FormData()
      const blob = new Blob(['fake-image'], { type: 'image/png' })
      formData.append('file', blob, 'test.png')
      formData.append('action', 'upload')
      // Intentionally NOT sending schoolId - API should use JWT

      const response = await newContext.request.post('/api/admin/update-school-logo', {
        data: formData,
      })

      // Verify API succeeded (uses JWT schoolId)
      expect(response.ok()).toBe(true)

      // Verify School B still has no logo (isolation maintained)
      const finalSchoolB = await prisma.school.findUnique({ where: { id: schoolB.id } })
      expect(finalSchoolB?.logo).toBeNull()

      await newContext.close()
    })
  })

  test.describe('[12.6] Logo Display on Public Pages', () => {
    test('uploaded logo displays correctly on public registration page', async ({
      page,
      context,
    }) => {
      // Setup: Create school with logo and event
      const school = await createSchool().withName('Public Logo Display School').create()

      const logoBase64 =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      await prisma.school.update({
        where: { id: school.id },
        data: { logo: logoBase64 },
      })

      const admin = await createAdmin()
        .withEmail(generateEmail('public-display'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Create test event
      const event = await createEvent()
        .withSchool(school.id)
        .withTitle('Logo Display Test Event')
        .withSlug(`logo-event-${Date.now()}`)
        .withCapacity(10)
        .inFuture()
        .create()

      // Navigate to public registration page
      await page.goto(`/p/${school.slug}/${event.slug}`)
      await page.waitForLoadState('networkidle')

      // Verify logo displays
      const logoElement = page.locator(`img[alt="${school.name}"]`).first()
      await expect(logoElement).toBeVisible()

      // Verify logo has correct src
      const src = await logoElement.getAttribute('src')
      expect(src).toBe(logoBase64)
    })
  })

  test.describe('[12.7] Mobile Touch Targets', () => {
    test('logo upload works on mobile with 44px touch targets', async ({ page, context }) => {
      // Set mobile viewport (iPhone SE)
      await page.setViewportSize({ width: 375, height: 667 })

      // Setup
      const school = await createSchool().withName('Mobile Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('mobile'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await loginViaAPI(context, admin.email, 'TestPassword123!')
      await page.goto('/admin/settings')
      await page.waitForLoadState('networkidle')

      // Verify touch targets meet iOS standard (44px minimum)
      const uploadButton = page.locator('[data-testid="logo-upload-button"]')
      const deleteButton = page.locator('[data-testid="logo-delete-button"]')
      const cancelButton = page.locator('[data-testid="logo-cancel-button"]')

      const uploadBox = await uploadButton.boundingBox()
      const cancelBox = await cancelButton.boundingBox()

      expect(uploadBox).toBeTruthy()
      expect(cancelBox).toBeTruthy()

      if (uploadBox) {
        expect(uploadBox.height).toBeGreaterThanOrEqual(44)
      }

      if (cancelBox) {
        expect(cancelBox.height).toBeGreaterThanOrEqual(44)
      }

      // Test actual upload on mobile
      const logoPath = path.join(__dirname, '../fixtures/test-logo-512.png')
      await page.locator('[data-testid="logo-upload-input"]').setInputFiles(logoPath)
      await page.waitForTimeout(500)

      // Verify button is tappable (not obscured)
      await expect(uploadButton).toBeEnabled()
      await uploadButton.click()

      // Verify success
      await expect(page.locator('text=הלוגו עודכן בהצלחה!')).toBeVisible({ timeout: 10000 })
    })
  })
})
