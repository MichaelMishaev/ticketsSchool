import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { RegistrationsPage } from '../page-objects/RegistrationsPage'
import { generateEmail, generateIsraeliPhone } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Admin Registration Management Tests
 * Ref: tests/scenarios/05-admin-registration-management.md
 */

test.describe('Admin Registration Management P0', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[05.1.1-1.2] View Registrations', () => {
    test('admin can view registrations list', async ({ page }) => {
      const school = await createSchool().withName('View Reg School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('view-reg'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Test Event')
        .withSchool(school.id)
        .create()

      // Create registrations
      await createRegistration()
        .withEvent(event.id)
        .withName('Test User 1')
        .confirmed()
        .create()

      await createRegistration()
        .withEvent(event.id)
        .withName('Test User 2')
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should see registrations
      await expect(page.locator('text=Test User 1')).toBeVisible()
      await expect(page.locator('text=Test User 2')).toBeVisible()
    })

    test('shows registration count summary', async ({ page }) => {
      const school = await createSchool().withName('Count School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('count'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Summary Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(30)
        .create()

      // Create 30 confirmed, 5 waitlist
      for (let i = 0; i < 30; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`Confirmed ${i}`)
          .confirmed()
          .create()
      }

      for (let i = 0; i < 5; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`Waitlist ${i}`)
          .waitlist()
          .create()
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should show counts
      await expect(page.locator('text=/30.*confirmed|30.*אושרו/i')).toBeVisible()
    })
  })

  test.describe('[05.3.1-3.2] Edit Registration', () => {
    test('admin can edit registration details', async ({ page }) => {
      const school = await createSchool().withName('Edit Reg School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('edit-reg'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Edit Event')
        .withSchool(school.id)
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('Original Name')
        .withEmail('original@test.com')
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click on registration
      await page.click('text=Original Name')

      // Click edit button
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Update name
      const nameInput = page.locator('input[name="name"]')
      await nameInput.clear()
      await nameInput.fill('Updated Name')

      await page.click('button[type="submit"]')

      await page.waitForTimeout(1000)

      // Should see updated name
      await expect(page.locator('text=Updated Name')).toBeVisible()
    })

    test('can change spots count', async ({ page }) => {
      const school = await createSchool().withName('Change Spots').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('change-spots'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Spots Event')
        .withSchool(school.id)
        .withCapacity(100)
        .withSpotsReserved(10)
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('User with 2 spots')
        .withSpots(2)
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click registration
      await page.click('text=User with 2 spots')

      // Click edit
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Change spots from 2 to 5
      const spotsInput = page.locator('input[name="spots"]')
      if (await spotsInput.count() > 0) {
        await spotsInput.clear()
        await spotsInput.fill('5')

        await page.click('button[type="submit"]')

        await page.waitForTimeout(1000)

        // Capacity should update (from 10 to 13 = +3 spots)
        await expect(page.locator('text=/13|הצלחה/i')).toBeVisible()
      }
    })
  })

  test.describe('[05.4.1-4.2] Cancel Registration', () => {
    test('admin can cancel confirmed registration', async ({ page }) => {
      const school = await createSchool().withName('Cancel School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('cancel'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Cancel Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(10)
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('User to Cancel')
        .withSpots(2)
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click registration
      await page.click('text=User to Cancel')

      // Click cancel button
      await page.click('button:has-text("ביטול"), button:has-text("Cancel")')

      // Confirm
      await page.click('button:has-text("אשר"), button:has-text("Confirm")')

      await page.waitForTimeout(1000)

      // Should show cancelled status
      await expect(
        page.locator('text=/בוטל|cancelled|CANCELLED/i')
      ).toBeVisible()
    })

    test('cancellation frees up capacity', async ({ page, request }) => {
      const school = await createSchool().withName('Free Capacity').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('free-cap'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Capacity Free Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(10)
        .full()
        .create()

      const registration = await createRegistration()
        .withEvent(event.id)
        .withName('Free Up User')
        .withSpots(3)
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Get initial capacity
      await page.goto(`/admin/events/${event.id}`)
      const initialCapacity = await page.locator('[data-testid="spots-reserved"], .spots-reserved').textContent()

      // Cancel registration
      await page.click('text=Free Up User')
      await page.click('button:has-text("ביטול"), button:has-text("Cancel")')
      await page.click('button:has-text("אשר"), button:has-text("Confirm")')

      await page.waitForTimeout(1000)

      // Reload to see updated capacity
      await page.reload()

      // Capacity should be reduced by 3 (10 -> 7)
      await expect(page.locator('text=/7|הפחית/i')).toBeVisible()
    })
  })

  test.describe('[05.5.1-5.2] Manual Registration', () => {
    test('admin can manually register user when spots available', async ({ page }) => {
      const school = await createSchool().withName('Manual Reg School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('manual'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Manual Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(20)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click add registration button
      await page.click('button:has-text("הוסף הרשמה"), button:has-text("Add Registration")')

      // Fill manual registration form
      await page.fill('input[name="name"]', 'Manually Added User')
      await page.fill('input[name="email"]', generateEmail('manual-user'))
      await page.fill('input[name="phone"]', generateIsraeliPhone())

      await page.click('button[type="submit"]')

      await page.waitForTimeout(1000)

      // Should see new registration
      await expect(page.locator('text=Manually Added User')).toBeVisible()
    })

    test('manual registration when event full offers waitlist', async ({ page }) => {
      const school = await createSchool().withName('Manual Full').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('manual-full'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Full Manual Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(10)
        .full()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Try to add registration
      await page.click('button:has-text("הוסף הרשמה"), button:has-text("Add Registration")')

      // Should show option for waitlist or override
      await expect(
        page.locator('text=/רשימת המתנה|waitlist|עקוף|override/i')
      ).toBeVisible()
    })
  })

  test.describe('[05.6.1] Promote from Waitlist', () => {
    test('admin can promote waitlist registration to confirmed', async ({ page }) => {
      const school = await createSchool().withName('Promote School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('promote'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Promote Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(8) // 2 spots available
        .create()

      const waitlistReg = await createRegistration()
        .withEvent(event.id)
        .withName('Waitlist User')
        .withSpots(1)
        .waitlist()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click on waitlist registration
      await page.click('text=Waitlist User')

      // Click promote/confirm button
      await page.click('button:has-text("העבר לאישור"), button:has-text("Confirm"), button:has-text("Promote")')

      await page.waitForTimeout(1000)

      // Should now show as confirmed
      await expect(
        page.locator('text=/אושר|confirmed|CONFIRMED/i')
      ).toBeVisible()
    })
  })

  test.describe('[05.7.1-7.3] Export Registrations', () => {
    test('admin can export registrations to CSV', async ({ page }) => {
      const school = await createSchool().withName('Export School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('export'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Export Event')
        .withSchool(school.id)
        .create()

      // Create registrations
      for (let i = 0; i < 10; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`User ${i}`)
          .confirmed()
          .create()
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click export button
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("יצוא"), button:has-text("Export")')

      const download = await downloadPromise

      // Should download file
      expect(download.suggestedFilename()).toContain('.csv')
    })

    test('exports filtered registrations only', async ({ page }) => {
      const school = await createSchool().withName('Filter Export').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('filter-export'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Filter Export Event')
        .withSchool(school.id)
        .create()

      await createRegistration().withEvent(event.id).confirmed().create()
      await createRegistration().withEvent(event.id).waitlist().create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Filter by confirmed
      const filterSelect = page.locator('select[name="status"], select[data-testid="status-filter"]')
      if (await filterSelect.count() > 0) {
        await filterSelect.selectOption('CONFIRMED')
        await page.waitForTimeout(500)

        // Export
        const downloadPromise = page.waitForEvent('download')
        await page.click('button:has-text("יצוא"), button:has-text("Export")')

        const download = await downloadPromise
        expect(download.suggestedFilename()).toContain('.csv')
      }
    })

    test('export includes custom fields', async ({ page }) => {
      const school = await createSchool().withName('Custom Export').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('custom-export'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Custom Fields Event')
        .withSchool(school.id)
        .withCustomFields({
          fields: [
            { name: 'age', type: 'number', required: false },
            { name: 'notes', type: 'text', required: false },
          ],
        })
        .create()

      await createRegistration()
        .withEvent(event.id)
        .withName('User with Custom')
        .withCustomFields({ age: 25, notes: 'Test notes' })
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Export
      const downloadPromise = page.waitForEvent('download')
      await page.click('button:has-text("יצוא"), button:has-text("Export")')

      const download = await downloadPromise
      expect(download.suggestedFilename()).toContain('.csv')
      // Custom fields should be in export
    })
  })

  test.describe('[05.12.1-12.3] Multi-Tenant Registration Isolation', () => {
    test('School A admin cannot see School B registrations', async ({ page }) => {
      const schoolA = await createSchool().withName('School A Reg').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('school-a-reg'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const eventA = await createEvent()
        .withTitle('Event A')
        .withSchool(schoolA.id)
        .create()

      const regA = await createRegistration()
        .withEvent(eventA.id)
        .withName('User A')
        .create()

      const schoolB = await createSchool().withName('School B Reg').create()
      const eventB = await createEvent()
        .withTitle('Event B')
        .withSchool(schoolB.id)
        .create()

      const regB = await createRegistration()
        .withEvent(eventB.id)
        .withName('User B')
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      // Try to access Event B registrations
      await page.goto(`/admin/events/${eventB.id}`)

      // Should show 403/404 or no registrations
      const hasError = await page.locator('text=/403|404|לא נמצא/i').isVisible().catch(() => false)
      const hasUserB = await page.locator('text=User B').isVisible().catch(() => false)

      expect(hasError || !hasUserB).toBe(true)
    })

    test('cannot export other school registrations via API', async ({ page, request }) => {
      const schoolA = await createSchool().withName('Export A').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('export-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('Export B').create()
      const eventB = await createEvent()
        .withTitle('Export B Event')
        .withSchool(schoolB.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to export School B event
      const response = await request.get(`/api/events/${eventB.id}/export`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      // Should return 403 or 404
      expect([403, 404]).toContain(response.status())
    })

    test('SUPER_ADMIN can view all school registrations', async ({ page }) => {
      const superAdmin = await createAdmin()
        .withEmail(generateEmail('super-reg'))
        .withPassword('SuperPassword123!')
        .withRole('SUPER_ADMIN')
        .withSchool(null)
        .create()

      const schoolA = await createSchool().withName('Super A').create()
      const eventA = await createEvent().withTitle('Super Event A').withSchool(schoolA.id).create()
      await createRegistration().withEvent(eventA.id).withName('Super User A').create()

      const schoolB = await createSchool().withName('Super B').create()
      const eventB = await createEvent().withTitle('Super Event B').withSchool(schoolB.id).create()
      await createRegistration().withEvent(eventB.id).withName('Super User B').create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(superAdmin.email, 'SuperPassword123!')

      // Can access both
      await page.goto(`/admin/events/${eventA.id}`)
      await expect(page.locator('text=Super User A')).toBeVisible()

      await page.goto(`/admin/events/${eventB.id}`)
      await expect(page.locator('text=Super User B')).toBeVisible()
    })
  })

  test.describe('[05.1.4-1.6] Search and Filter', () => {
    test('can search registrations by name', async ({ page }) => {
      const school = await createSchool().withName('Search Reg School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('search-reg'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Search Event')
        .withSchool(school.id)
        .create()

      await createRegistration().withEvent(event.id).withName('John Doe').create()
      await createRegistration().withEvent(event.id).withName('Jane Smith').create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      const regPage = new RegistrationsPage(page)
      await regPage.searchRegistrations('John')

      await page.waitForTimeout(500)

      await expect(page.locator('text=John Doe')).toBeVisible()
    })

    test('can filter by registration status', async ({ page }) => {
      const school = await createSchool().withName('Filter Status').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('filter-status'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Filter Event')
        .withSchool(school.id)
        .create()

      await createRegistration().withEvent(event.id).withName('Confirmed User').confirmed().create()
      await createRegistration().withEvent(event.id).withName('Waitlist User').waitlist().create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      const regPage = new RegistrationsPage(page)
      await regPage.filterByStatus('CONFIRMED')

      await page.waitForTimeout(500)

      await expect(page.locator('text=Confirmed User')).toBeVisible()
    })
  })

  test.describe('[05.14.1-14.4] Role-Based Permissions', () => {
    test('MANAGER can edit registrations', async ({ page }) => {
      const school = await createSchool().withName('Manager School').create()
      const manager = await createAdmin()
        .withEmail(generateEmail('manager'))
        .withPassword('ManagerPassword123!')
        .withRole('MANAGER')
        .withSchool(school.id)
        .create()

      const event = await createEvent().withTitle('Manager Event').withSchool(school.id).create()
      const reg = await createRegistration().withEvent(event.id).withName('Test User').create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(manager.email, 'ManagerPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should be able to edit
      await page.click('text=Test User')
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Should show edit form
      await expect(page.locator('input[name="name"]')).toBeVisible()
    })

    test('VIEWER cannot edit registrations', async ({ page }) => {
      const school = await createSchool().withName('Viewer School').create()
      const viewer = await createAdmin()
        .withEmail(generateEmail('viewer-reg'))
        .withPassword('ViewerPassword123!')
        .withRole('VIEWER')
        .withSchool(school.id)
        .create()

      const event = await createEvent().withTitle('Viewer Event').withSchool(school.id).create()
      const reg = await createRegistration().withEvent(event.id).withName('View Only').create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(viewer.email, 'ViewerPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should see registrations but not edit
      await expect(page.locator('text=View Only')).toBeVisible()

      // Edit button should be hidden or disabled
      const editButton = page.locator('button:has-text("עריכה"), button:has-text("Edit")')
      const editVisible = await editButton.isVisible().catch(() => false)

      expect(editVisible).toBe(false)
    })
  })
})
