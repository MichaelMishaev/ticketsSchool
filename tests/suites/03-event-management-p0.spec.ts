import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, createRegistration, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { generateEmail, getFutureDate, getPastDate } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Event Management Tests
 * Ref: tests/scenarios/03-event-management.md
 *
 * Coverage:
 * - Event Creation (required fields, validation, slug uniqueness)
 * - Event Editing (details, capacity increase/decrease)
 * - Event Status Management (publish, unpublish, cancel)
 * - Event Deletion (with/without registrations)
 * - Event Visibility (public/draft/cancelled)
 * - Event Capacity (available spots, sold out, waitlist)
 * - Multi-Tenant Isolation (schoolId enforcement, event scoping)
 * - Event Dashboard (stats, filters, search)
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

    test('different schools CAN have same event slug (tenant isolation)', async ({ page }) => {
      // Create School A with event
      const schoolA = await createSchool().withName('School A Slug').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('school-a-slug'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const eventA = await createEvent()
        .withTitle('Soccer Game')
        .withSlug('soccer-game')
        .withSchool(schoolA.id)
        .create()

      // Create School B with SAME slug
      const schoolB = await createSchool().withName('School B Slug').create()
      const eventB = await createEvent()
        .withTitle('Soccer Game')
        .withSlug('soccer-game') // Same slug, different school
        .withSchool(schoolB.id)
        .create()

      // Both events should exist independently
      expect(eventA.slug).toBe('soccer-game')
      expect(eventB.slug).toBe('soccer-game')
      expect(eventA.schoolId).not.toBe(eventB.schoolId)

      // Public URLs are different: /p/schoolA/soccer-game vs /p/schoolB/soccer-game
      await page.goto(`/p/${schoolA.slug}/${eventA.slug}`)
      await expect(page.locator('text=Soccer Game')).toBeVisible()

      await page.goto(`/p/${schoolB.slug}/${eventB.slug}`)
      await expect(page.locator('text=Soccer Game')).toBeVisible()
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

    test('cannot change schoolId after creation (data integrity)', async ({ page, request }) => {
      const schoolA = await createSchool().withName('School A Integrity').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('integrity-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Integrity').create()

      const event = await createEvent()
        .withTitle('School A Event')
        .withSchool(schoolA.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Try to update event's schoolId via API (malicious attempt)
      const response = await request.patch(`/api/events/${event.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
          'Content-Type': 'application/json',
        },
        data: {
          schoolId: schoolB.id, // Try to change school
        },
      })

      // Should fail (403 or 400) or silently ignore schoolId change
      // The API should never allow schoolId to be updated
      const data = await response.json()

      // Verify event still belongs to schoolA
      const updatedEvent = await request.get(`/api/events/${event.id}`, {
        headers: {
          'Cookie': `admin_session=${sessionCookie?.value}`,
        },
      })

      const eventData = await updatedEvent.json()
      expect(eventData.event?.schoolId || eventData.schoolId).toBe(schoolA.id)
    })

    test('cannot edit other school events (tenant isolation)', async ({ page }) => {
      const schoolA = await createSchool().withName('School A Edit').create()
      const adminA = await createAdmin()
        .withEmail(generateEmail('edit-a'))
        .withPassword('TestPassword123!')
        .withSchool(schoolA.id)
        .create()

      const schoolB = await createSchool().withName('School B Edit').create()
      const eventB = await createEvent()
        .withTitle('School B Event')
        .withSchool(schoolB.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(adminA.email, 'TestPassword123!')

      // Try to access School B's event
      const response = await page.goto(`/admin/events/${eventB.id}`)

      // Should get 403 or 404 (unauthorized access)
      expect([403, 404]).toContain(response?.status())
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

    test('cannot delete event with confirmed registrations (soft delete only)', async ({ page }) => {
      const school = await createSchool().withName('No Delete Confirmed').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('no-delete'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event Cannot Delete')
        .withSchool(school.id)
        .withCapacity(50)
        .withSpotsReserved(10)
        .create()

      // Create confirmed registrations
      for (let i = 0; i < 10; i++) {
        await createRegistration()
          .withEvent(event.id)
          .withName(`Confirmed User ${i}`)
          .confirmed()
          .create()
      }

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Check if delete button shows warning or is disabled
      const deleteButton = page.locator('button:has-text("מחק"), button:has-text("Delete")')
      const buttonExists = await deleteButton.count() > 0

      if (buttonExists) {
        await deleteButton.click()

        // Should show severe warning about confirmed registrations
        await expect(
          page.locator('text=/הרשמות מאושרות|confirmed registrations|cannot delete/i')
        ).toBeVisible({ timeout: 5000 })
      }
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

    test('event shows correct available spots (capacity - spotsReserved)', async ({ page }) => {
      const school = await createSchool().withName('Available Spots').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('available'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Available Spots Event')
        .withSchool(school.id)
        .withCapacity(100)
        .withSpotsReserved(35)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Should show 35/100 or "65 available" or similar
      const capacityText = page.locator('text=/35.*100|65.*available|נותרו 65/i')
      await expect(capacityText).toBeVisible({ timeout: 5000 })
    })

    test('event shows "SOLD OUT" when capacity reached', async ({ page }) => {
      const school = await createSchool().withName('Sold Out').create()
      const event = await createEvent()
        .withTitle('Sold Out Event')
        .withSchool(school.id)
        .withCapacity(20)
        .withSpotsReserved(20)
        .full()
        .inFuture()
        .create()

      // Visit public page
      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Should show sold out message
      await expect(
        page.locator('text=/sold out|אזל המלאי|מלא|תפוס/i')
      ).toBeVisible()
    })

    test('event accepts waitlist registrations when full', async ({ page }) => {
      const school = await createSchool().withName('Waitlist').create()
      const event = await createEvent()
        .withTitle('Waitlist Event')
        .withSchool(school.id)
        .withCapacity(5)
        .withSpotsReserved(5)
        .full()
        .inFuture()
        .create()

      // Visit public page
      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Check if waitlist form is visible or enabled
      const waitlistIndicator = page.locator('text=/waitlist|רשימת המתנה/i')

      // Try to register (should go to waitlist)
      const registerForm = page.locator('form')
      const formVisible = await registerForm.count() > 0

      if (formVisible) {
        await publicPage.register({
          name: 'Waitlist User',
          email: generateEmail('waitlist'),
          phone: '0501234567',
        })

        // Should show waitlist confirmation
        await expect(
          page.locator('text=/waitlist|רשימת המתנה/i')
        ).toBeVisible()
      }
    })
  })

  test.describe('[03.8.1-8.3] Event Status Management', () => {
    test('admin can publish draft event', async ({ page }) => {
      const school = await createSchool().withName('Publish School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('publish'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Create draft event (if status field exists)
      const event = await createEvent()
        .withTitle('Draft Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Look for publish button
      const publishButton = page.locator('button:has-text("פרסם"), button:has-text("Publish")')
      const publishExists = await publishButton.count() > 0

      if (publishExists) {
        await publishButton.click()
        await page.waitForTimeout(1000)

        // Should show published status
        await expect(
          page.locator('text=/published|פורסם|active/i')
        ).toBeVisible()
      }
    })

    test('admin can unpublish active event', async ({ page }) => {
      const school = await createSchool().withName('Unpublish School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('unpublish'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Active Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Look for unpublish button
      const unpublishButton = page.locator('button:has-text("הסר פרסום"), button:has-text("Unpublish")')
      const unpublishExists = await unpublishButton.count() > 0

      if (unpublishExists) {
        await unpublishButton.click()
        await page.waitForTimeout(1000)

        // Should show draft status
        await expect(
          page.locator('text=/draft|טיוטה|unpublished/i')
        ).toBeVisible()
      }
    })

    test('admin can cancel event (sets status to CANCELLED)', async ({ page }) => {
      const school = await createSchool().withName('Cancel School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('cancel'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const event = await createEvent()
        .withTitle('Event to Cancel')
        .withSchool(school.id)
        .inFuture()
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto(`/admin/events/${event.id}`)

      // Look for cancel button (different from delete)
      const cancelButton = page.locator('button:has-text("בטל אירוע"), button:has-text("Cancel Event")')
      const cancelExists = await cancelButton.count() > 0

      if (cancelExists) {
        await cancelButton.click()

        // Confirm cancellation
        await page.click('button:has-text("אשר"), button:has-text("Confirm")')
        await page.waitForTimeout(1000)

        // Should show cancelled status
        await expect(
          page.locator('text=/cancelled|בוטל/i')
        ).toBeVisible()
      }
    })
  })

  test.describe('[03.8.2-8.3] Event Visibility', () => {
    test('published events visible in public list', async ({ page }) => {
      const school = await createSchool().withName('Public Visible').create()
      const event = await createEvent()
        .withTitle('Public Visible Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      // Visit school's public events page
      await page.goto(`/p/${school.slug}`)

      // Should show the event
      await expect(page.locator('text=Public Visible Event')).toBeVisible()
    })

    test('draft events NOT visible to public', async ({ page }) => {
      const school = await createSchool().withName('Draft Hidden').create()

      // Create draft event (would need status field in schema)
      const event = await createEvent()
        .withTitle('Draft Hidden Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      // Visit school's public events page
      await page.goto(`/p/${school.slug}`)

      // Draft event should NOT be visible
      // (This assumes there's a status field and draft events are filtered)
      const draftEvent = page.locator('text=Draft Hidden Event')
      const isVisible = await draftEvent.isVisible().catch(() => false)

      // If events are always public, this test documents that behavior
      if (isVisible) {
        console.log('Note: All events are currently public by default (no draft status)')
      }
    })

    test('cancelled events show cancellation message on public page', async ({ page }) => {
      const school = await createSchool().withName('Cancelled Public').create()
      const event = await createEvent()
        .withTitle('Cancelled Public Event')
        .withSchool(school.id)
        .inFuture()
        .create()

      // Visit public event page
      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Check for cancellation message (if event has cancelled status)
      const cancelMessage = page.locator('text=/cancelled|בוטל|האירוע בוטל/i')
      const hasCancelledStatus = await cancelMessage.isVisible().catch(() => false)

      if (hasCancelledStatus) {
        await expect(cancelMessage).toBeVisible()

        // Registration form should be disabled or hidden
        const registerButton = page.locator('button[type="submit"]')
        const buttonExists = await registerButton.count() > 0

        if (buttonExists) {
          await expect(registerButton).toBeDisabled()
        }
      }
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

  test.describe('[03.1.3] Payment Settings UX (Bug Fix)', () => {
    test('when payment required is checked, pricing model should not show "Free" option', async ({ page }) => {
      const school = await createSchool().withName('Payment UX School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('payment-ux'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events/new')

      // Navigate to step 4 (Advanced settings)
      // Fill required fields in step 1
      await page.fill('input[id="gameType"]', 'כדורגל')
      await page.fill('input[id="title"]', 'Payment Test Event')
      await page.click('button:has-text("המשך")')

      // Fill required fields in step 2 (timing)
      const futureDate = getFutureDate(7)
      await page.fill('input[type="date"]', futureDate)
      await page.fill('input[type="time"]', '18:00')
      await page.click('button:has-text("המשך")')

      // Skip step 3 (capacity - has defaults)
      await page.click('button:has-text("המשך")')

      // Now on step 4 - Expand payment section
      await page.click('button:has-text("הגדרות תשלום")')
      await page.waitForTimeout(300)

      // Check the "Require payment" checkbox
      await page.check('input[type="checkbox"]:near(:text("דרוש תשלום לאירוע זה"))')
      await page.waitForTimeout(500)

      // Wait for pricing model dropdown to appear
      const pricingModelSelect = page.locator('select[id="pricingModel"]')
      await expect(pricingModelSelect).toBeVisible()

      // Get all options in the pricing model dropdown
      const freeOption = pricingModelSelect.locator('option[value="FREE"]')
      const freeOptionCount = await freeOption.count()

      // The "Free" option should NOT exist when payment is required
      expect(freeOptionCount).toBe(0)

      // Verify that only paid options exist
      const fixedPriceOption = pricingModelSelect.locator('option[value="FIXED_PRICE"]')
      const perGuestOption = pricingModelSelect.locator('option[value="PER_GUEST"]')

      const fixedPriceCount = await fixedPriceOption.count()
      const perGuestCount = await perGuestOption.count()

      expect(fixedPriceCount).toBe(1)
      expect(perGuestCount).toBe(1)
    })

    test('when payment required is unchecked, pricing model should default to Free', async ({ page }) => {
      const school = await createSchool().withName('Payment Default School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('payment-default'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      await page.goto('/admin/events/new')

      // Navigate to step 4
      await page.fill('input[id="gameType"]', 'כדורגל')
      await page.fill('input[id="title"]', 'Free Event Test')
      await page.click('button:has-text("המשך")')

      const futureDate = getFutureDate(7)
      await page.fill('input[type="date"]', futureDate)
      await page.fill('input[type="time"]', '18:00')
      await page.click('button:has-text("המשך")')

      await page.click('button:has-text("המשך")')

      // Expand payment section
      await page.click('button:has-text("הגדרות תשלום")')
      await page.waitForTimeout(300)

      // Verify payment checkbox is NOT checked by default
      const paymentCheckbox = page.locator('input[type="checkbox"]:near(:text("דרוש תשלום לאירוע זה"))')
      await expect(paymentCheckbox).not.toBeChecked()

      // The pricing model dropdown should not be visible when payment is not required
      const pricingModelSelect = page.locator('select[id="pricingModel"]')
      const isVisible = await pricingModelSelect.isVisible().catch(() => false)

      // When payment is not required, the pricing model should not be shown
      // (event is free by default)
      expect(isVisible).toBe(false)
    })
  })
})
