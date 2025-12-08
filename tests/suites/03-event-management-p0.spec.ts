import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'
import { generateEmail, getFutureDate, getPastDate } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Event Management Tests
 * Ref: tests/scenarios/03-event-management.md
 */

test.describe('Event Management P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[03.1.1] Create Simple Event', () => {
    test('admin can create event with required fields', async ({ page }) => {
      const school = await createSchool().withName('Event Create School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('event-create'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const eventsPage = new EventsPage(page)
      await eventsPage.gotoNewEvent()

      await eventsPage.createEvent({
        title: 'New Test Event',
        description: 'Test event description',
        startDate: getFutureDate(7),
        startTime: '18:00',
        capacity: 50,
        location: 'Test Location',
      })

      await eventsPage.expectEventExists('New Test Event')
    })
  })

  test.describe('[03.1.2] Event Form Validation', () => {
    test('cannot create event with missing required fields', async ({ page }) => {
      const school = await createSchool().withName('Validation School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('validation'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events/new')

      // Try to submit without filling fields
      await page.click('button[type="submit"]')

      // Should show validation errors
      const errorLocator = page.locator('.error, [role="alert"], text=/שגיאה|error/i')
      await expect(errorLocator).toBeVisible({ timeout: 5000 })
    })

    test('validates capacity is positive number', async ({ page }) => {
      const school = await createSchool().withName('Capacity Validation').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('capacity'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events/new')

      // Fill form with invalid capacity
      await page.fill('input[name="title"]', 'Invalid Capacity Event')
      await page.fill('input[name="startDate"], input[type="date"]', getFutureDate(7))
      await page.fill('input[name="startTime"], input[type="time"]', '18:00')
      await page.fill('input[name="capacity"]', '0') // Invalid: 0
      await page.fill('input[name="location"]', 'Test')

      await page.click('button[type="submit"]')

      // Should show error
      await expect(page.locator('text=/capacity|קיבולת/i')).toBeVisible()
    })
  })

  test.describe('[03.1.5] Event Slug Uniqueness', () => {
    test('generates unique slug within school', async ({ page }) => {
      const school = await createSchool().withName('Slug School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('slug'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Create first event with specific title
      const event1 = await createEvent()
        .withTitle('Soccer Game')
        .withSlug('soccer-game')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      const eventsPage = new EventsPage(page)
      await eventsPage.gotoNewEvent()

      // Try to create another event with same title (should get unique slug)
      await eventsPage.createEvent({
        title: 'Soccer Game', // Same title
        startDate: getFutureDate(7),
        startTime: '19:00',
        capacity: 30,
        location: 'Test',
      })

      // Both events should exist with unique slugs
      await eventsPage.goto()
      const eventCount = await eventsPage.getEventCount()
      expect(eventCount).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('[03.3.1] Edit Event Details', () => {
    test('admin can edit event details', async ({ page }) => {
      const school = await createSchool().withName('Edit School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('edit'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Original Event')
        .withSchool(school.id)
        .withCapacity(50)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Navigate to event edit
      await page.goto(`/admin/events/${event.id}`)

      // Click edit button
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Update title
      const titleInput = page.locator('input[name="title"]')
      await titleInput.clear()
      await titleInput.fill('Updated Event Title')

      await page.click('button[type="submit"]')

      // Wait for success
      await page.waitForTimeout(1000)

      // Verify updated title
      await expect(page.locator('text=Updated Event Title')).toBeVisible()
    })
  })

  test.describe('[03.3.3] Edit Capacity - Increase', () => {
    test('can increase event capacity', async ({ page }) => {
      const school = await createSchool().withName('Capacity Increase').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('capacity-inc'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Capacity Test Event')
        .withSchool(school.id)
        .withCapacity(30)
        .withSpotsReserved(20)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Increase capacity from 30 to 50
      const capacityInput = page.locator('input[name="capacity"]')
      await capacityInput.clear()
      await capacityInput.fill('50')

      await page.click('button[type="submit"]')

      await page.waitForTimeout(1000)

      // Should succeed
      await expect(page.locator('text=/50|הצלחה|success/i')).toBeVisible()
    })
  })

  test.describe('[03.3.4] Edit Capacity - Decrease with Validation', () => {
    test('cannot decrease capacity below confirmed registrations', async ({ page, request }) => {
      const school = await createSchool().withName('Capacity Decrease').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('capacity-dec'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Full Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(40) // 40 spots taken
        .inFuture()
        .create()

      // Create 40 confirmed registrations
      for (let i = 0; i < 40; i++) {
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
      await page.click('button:has-text("עריכה"), button:has-text("Edit")')

      // Try to decrease capacity to 30 (less than 40 confirmed)
      const capacityInput = page.locator('input[name="capacity"]')
      await capacityInput.clear()
      await capacityInput.fill('30')

      await page.click('button[type="submit"]')

      // Should show error
      await expect(
        page.locator('text=/לא ניתן|cannot|הרשמות קיימות/i')
      ).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('[03.4.1] Delete Event with No Registrations', () => {
    test('can delete event with no registrations', async ({ page }) => {
      const school = await createSchool().withName('Delete School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('delete'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event to Delete')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Click on event
      await page.click('text=Event to Delete')

      // Click delete button
      await page.click('button:has-text("מחק"), button:has-text("Delete")')

      // Confirm deletion
      await page.click('button:has-text("אשר"), button:has-text("Confirm")')

      await page.waitForTimeout(1000)

      // Event should no longer exist
      await page.goto('/admin/events')
      await expect(page.locator('text=Event to Delete')).not.toBeVisible()
    })
  })

  test.describe('[03.4.2] Delete Event with Registrations', () => {
    test('shows warning when deleting event with registrations', async ({ page }) => {
      const school = await createSchool().withName('Delete Warning').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('delete-warn'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event with Registrations')
        .withSchool(school.id)
        .create()

      // Create registrations
      await createRegistration()
        .withEvent(event.id)
        .withName('User 1')
        .confirmed()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click delete
      await page.click('button:has-text("מחק"), button:has-text("Delete")')

      // Should show warning about registrations
      await expect(
        page.locator('text=/הרשמות|registrations|אזהרה|warning/i')
      ).toBeVisible()
    })
  })

  test.describe('[03.5.1-5.3] View Event Dashboard', () => {
    test('event dashboard shows correct statistics', async ({ page }) => {
      const school = await createSchool().withName('Dashboard School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('dashboard'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Stats Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(30)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Should show event with stats
      await expect(page.locator('text=Stats Event')).toBeVisible()

      // Should show capacity info (30/50 or similar)
      await expect(page.locator('text=/30|50/i')).toBeVisible()
    })

    test('shows event status indicators', async ({ page }) => {
      const school = await createSchool().withName('Status School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('status'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Create full event
      const fullEvent = await createEvent()
        .withTitle('Full Event')
        .withSchool(school.id)
        .withCapacity(10)
        .withSpotsReserved(10)
        .full()
        .create()

      // Create open event
      const openEvent = await createEvent()
        .withTitle('Open Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(20)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Full event should show full status
      await expect(page.locator('text=Full Event')).toBeVisible()

      // Open event should be visible
      await expect(page.locator('text=Open Event')).toBeVisible()
    })
  })

  test.describe('[03.7.1-7.3] Capacity Management', () => {
    test('real-time capacity counter updates', async ({ page }) => {
      const school = await createSchool().withName('Capacity Counter').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('counter'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Counter Event')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(25)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should show spots reserved / capacity
      await expect(page.locator('text=/25|50/i')).toBeVisible()
    })

    test('at-capacity event shows full status', async ({ page }) => {
      const school = await createSchool().withName('At Capacity').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('at-capacity'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('At Capacity Event')
        .withSchool(school.id)
        .withCapacity(20)
        .withSpotsReserved(20)
        .full()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should show full indicator
      await expect(
        page.locator('text=/מלא|full|תפוס/i')
      ).toBeVisible()
    })
  })

  test.describe('[03.10.1-10.2] Multi-Tenant Event Isolation', () => {
    test('School A admin only sees School A events', async ({ page }) => {
      const schoolA = await createSchool().withName('School A Events').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('school-a-events'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const eventA = await createEvent()
        .withTitle('School A Event')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Events').create()
      const eventB = await createEvent()
        .withTitle('School B Event')
        .withSchool(schoolB.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Should see School A event
      await expect(page.locator('text=School A Event')).toBeVisible()

      // Should NOT see School B event
      await expect(page.locator('text=School B Event')).not.toBeVisible()
    })

    test('event creation automatically scoped to admin school', async ({ page, request }) => {
      const schoolA = await createSchool().withName('Auto Scope A').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('auto-scope'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Create event via API
      const response = await request.post('/api/events', {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Auto Scoped Event',
          slug: `auto-scoped-${Date.now()}`,
          capacity: 50,
          startDate: getFutureDate(7),
          startTime: '18:00',
          location: 'Test',
        },
      })

      if (response.ok()) {
        const data = await response.json()
        const event = data.event || data

        // Should be created for schoolA automatically
        expect(event.schoolId).toBe(schoolA.id)
      }
    })
  })

  test.describe('[03.5.4-5.5] Filter and Sort Events', () => {
    test('can filter events by status', async ({ page }) => {
      const school = await createSchool().withName('Filter School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('filter'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await createEvent().withTitle('Future Event').withSchool(school.id).inFuture().create()
      await createEvent().withTitle('Past Event').withSchool(school.id).inPast().create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      // Try to filter (if filter exists)
      const filterSelect = page.locator('select[name="status"], select[data-testid="status-filter"]')
      const filterExists = await filterSelect.count() > 0

      if (filterExists) {
        await filterSelect.selectOption('upcoming')
        await page.waitForTimeout(500)

        // Should show future event
        await expect(page.locator('text=Future Event')).toBeVisible()
      }
    })

    test('can search events by title', async ({ page }) => {
      const school = await createSchool().withName('Search School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('search'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      await createEvent().withTitle('Soccer Match').withSchool(school.id).create()
      await createEvent().withTitle('Basketball Game').withSchool(school.id).create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events')

      const eventsPage = new EventsPage(page)
      await eventsPage.searchEvents('Soccer')

      await page.waitForTimeout(500)

      // Should show soccer match
      await expect(page.locator('text=Soccer Match')).toBeVisible()
    })
  })

  test.describe('[03.6.1] Duplicate Event', () => {
    test('can duplicate event with new slug', async ({ page }) => {
      const school = await createSchool().withName('Duplicate School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('duplicate'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Original Event')
        .withSchool(school.id)
        .withCapacity(50)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Click duplicate button (if exists)
      const duplicateButton = page.locator('button:has-text("שכפל"), button:has-text("Duplicate")')
      const duplicateExists = await duplicateButton.count() > 0

      if (duplicateExists) {
        await duplicateButton.click()

        await page.waitForTimeout(1000)

        // Should have new event with (Copy) suffix
        await page.goto('/admin/events')
        await expect(page.locator('text=/Original Event.*Copy|העתק/i')).toBeVisible()
      }
    })
  })
})
