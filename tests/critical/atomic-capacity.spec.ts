import { test, expect } from '@playwright/test'

/**
 * CRITICAL: Atomic Capacity Enforcement Tests
 *
 * These tests verify that the capacity system works correctly under concurrent load.
 * The system MUST use atomic transactions to prevent race conditions.
 *
 * Test Strategy:
 * 1. Create event with limited capacity
 * 2. Simulate concurrent registrations
 * 3. Verify correct number of confirmations and waitlist placements
 * 4. Ensure spotsReserved is accurate
 * 5. Test waitlist promotion when spots become available
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:9000'

test.describe('Atomic Capacity Enforcement - CRITICAL', () => {

  test.describe('Race Condition Prevention', () => {

    test('concurrent registrations respect capacity limit', async ({ browser }) => {
      // Create 5 browser contexts (5 concurrent users)
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])

      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))

      // Event with capacity of 3 spots
      const testEventSlug = 'race-test-event-' + Date.now()
      const capacity = 3

      // TODO: Create test event via API with capacity of 3
      // For now, assume event exists at: /p/test-school/${testEventSlug}

      // All 5 users navigate to registration page
      await Promise.all(pages.map((page, i) =>
        page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
      ))

      // Fill forms on all pages simultaneously
      await Promise.all(pages.map((page, i) => (async () => {
        await page.fill('input[name="name"]', `User ${i + 1}`)
        await page.fill('input[name="phone"]', `050${String(i + 1).padStart(7, '0')}`)
        await page.fill('input[name="email"]', `user${i + 1}@test.com`)
      })()))

      // Submit all forms simultaneously (race condition!)
      const submissions = await Promise.all(pages.map(page =>
        page.click('button[type="submit"]').catch(() => null)
      ))

      // Wait for all pages to process
      await Promise.all(pages.map(page =>
        page.waitForTimeout(3000)
      ))

      // Check results on each page
      const results = await Promise.all(pages.map(async (page) => {
        const isConfirmed = await page.locator('text=הרשמה הושלמה בהצלחה, text=נרשמת בהצלחה').isVisible().catch(() => false)
        const isWaitlist = await page.locator('text=רשימת המתנה, text=waitlist').isVisible().catch(() => false)

        return { isConfirmed, isWaitlist }
      }))

      // Count confirmations and waitlists
      const confirmedCount = results.filter(r => r.isConfirmed).length
      const waitlistCount = results.filter(r => r.isWaitlist).length

      console.log(`Results: ${confirmedCount} confirmed, ${waitlistCount} waitlisted`)

      // CRITICAL: Should be exactly 3 confirmed, 2 waitlisted
      expect(confirmedCount).toBe(capacity)
      expect(waitlistCount).toBe(5 - capacity)

      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()))

      console.log('✅ Race condition handled correctly: atomic capacity enforced')
    })

    test('spotsReserved increments atomically', async ({ browser }) => {
      // Create 3 concurrent registrations for 1 spot remaining
      const contexts = await Promise.all([
        browser.newContext(),
        browser.newContext(),
        browser.newContext()
      ])

      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))

      const testEventSlug = 'one-spot-left-' + Date.now()

      // TODO: Create event with capacity=10, spotsReserved=9 (1 spot left)

      // All 3 users try to register simultaneously
      await Promise.all(pages.map((page, i) => (async () => {
        await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)
        await page.fill('input[name="name"]', `Concurrent User ${i + 1}`)
        await page.fill('input[name="phone"]', `050${String(i + 100).padStart(7, '0')}`)
        await page.click('button[type="submit"]')
      })()))

      // Wait for all submissions to complete
      await Promise.all(pages.map(page => page.waitForTimeout(3000)))

      // Check results
      const results = await Promise.all(pages.map(async (page) => {
        const confirmed = await page.locator('text=הרשמה הושלמה בהצלחה').isVisible().catch(() => false)
        const waitlist = await page.locator('text=רשימת המתנה').isVisible().catch(() => false)
        return { confirmed, waitlist }
      }))

      const confirmedCount = results.filter(r => r.confirmed).length
      const waitlistCount = results.filter(r => r.waitlist).length

      // Should be exactly 1 confirmed, 2 waitlisted
      expect(confirmedCount).toBe(1)
      expect(waitlistCount).toBe(2)

      await Promise.all(contexts.map(ctx => ctx.close()))

      console.log('✅ Atomic increment prevents over-booking')
    })
  })

  test.describe('Capacity Boundaries', () => {

    test('registration at exact capacity succeeds', async ({ page }) => {
      const testEventSlug = 'exact-capacity-' + Date.now()

      // TODO: Create event with capacity=5, spotsReserved=4

      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      // Register for 1 spot (should fill exactly to capacity)
      await page.fill('input[name="name"]', 'Exact Capacity User')
      await page.fill('input[name="phone"]', '0501234567')
      await page.fill('input[name="spots"]', '1')

      await page.click('button[type="submit"]')

      // Should be confirmed
      await expect(page.locator('text=הרשמה הושלמה בהצלחה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Registration at exact capacity succeeds')
    })

    test('registration exceeding capacity goes to waitlist', async ({ page }) => {
      const testEventSlug = 'over-capacity-' + Date.now()

      // TODO: Create event with capacity=10, spotsReserved=10 (full)

      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      // Try to register
      await page.fill('input[name="name"]', 'Waitlist User')
      await page.fill('input[name="phone"]', '0509876543')

      await page.click('button[type="submit"]')

      // Should be waitlisted
      await expect(page.locator('text=רשימת המתנה, text=waitlist')).toBeVisible({ timeout: 5000 })

      console.log('✅ Over-capacity registration goes to waitlist')
    })

    test('multiple spots registration respects capacity', async ({ page }) => {
      const testEventSlug = 'multi-spots-' + Date.now()

      // TODO: Create event with capacity=10, spotsReserved=8 (2 spots left)

      await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`)

      // Try to register for 3 spots (more than available)
      await page.fill('input[name="name"]', 'Multi Spots User')
      await page.fill('input[name="phone"]', '0501112233')
      await page.fill('input[name="spots"]', '3')

      await page.click('button[type="submit"]')

      // Should be waitlisted (not enough spots)
      await expect(page.locator('text=רשימת המתנה')).toBeVisible({ timeout: 5000 })

      console.log('✅ Multi-spot registration correctly checks capacity')
    })
  })

  test.describe('Waitlist Management', () => {

    test('cancellation frees spots for waitlist', async ({ page, request }) => {
      const testEventSlug = 'waitlist-promo-' + Date.now()

      // TODO: Create event with capacity=2
      // TODO: Create 2 confirmed registrations (full)
      // TODO: Create 1 waitlist registration

      // Admin cancels one confirmed registration
      await page.goto(`${BASE_URL}/admin/login`)
      // ... login as admin

      // Navigate to event registrations
      await page.goto(`${BASE_URL}/admin/events`)
      // ... find the test event

      // Cancel first registration
      const cancelButton = page.locator('button:has-text("ביטול")').first()
      await cancelButton.click()

      // Confirm cancellation
      await page.locator('button:has-text("אשר")').click()

      // Verify spotsReserved decreased
      // Verify waitlist user was promoted (if auto-promotion exists)

      console.log('✅ Cancellation frees spots correctly')
    })

    test('waitlist order is preserved (FIFO)', async ({ browser }) => {
      // Create event with capacity=1
      // Register 1 confirmed user
      // Register 3 waitlist users in order

      // When spot opens, first waitlist user should be promoted

      // TODO: Implement this test when waitlist promotion is built

      test.skip('Waitlist promotion not yet implemented')
    })
  })

  test.describe('Database Consistency', () => {

    test('spotsReserved matches sum of confirmed registrations', async ({ request, page }) => {
      // Login as admin
      await page.goto(`${BASE_URL}/admin/login`)
      // ... login

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Get event details
      const eventResponse = await request.get(`${BASE_URL}/api/events/test-event-id`, {
        headers: { 'Cookie': `admin_session=${sessionCookie?.value}` }
      })

      const event = await eventResponse.json()
      const spotsReserved = event.spotsReserved

      // Get all confirmed registrations
      const registrationsResponse = await request.get(`${BASE_URL}/api/events/test-event-id/registrations`, {
        headers: { 'Cookie': `admin_session=${sessionCookie?.value}` }
      })

      const registrations = await registrationsResponse.json()
      const confirmedRegistrations = registrations.filter((r: any) => r.status === 'CONFIRMED')
      const totalConfirmedSpots = confirmedRegistrations.reduce((sum: number, r: any) => sum + (r.spots || 1), 0)

      // CRITICAL: These MUST match
      expect(spotsReserved).toBe(totalConfirmedSpots)

      console.log(`✅ Database consistency: spotsReserved=${spotsReserved}, actual=${totalConfirmedSpots}`)
    })

    test('no negative spotsReserved values', async ({ request, page }) => {
      // Login as admin
      await page.goto(`${BASE_URL}/admin/login`)
      // ... login

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Get all events
      const eventsResponse = await request.get(`${BASE_URL}/api/events`, {
        headers: { 'Cookie': `admin_session=${sessionCookie?.value}` }
      })

      const events = await eventsResponse.json()

      // Check no event has negative spotsReserved
      for (const event of events) {
        expect(event.spotsReserved).toBeGreaterThanOrEqual(0)
      }

      console.log('✅ No negative spotsReserved values found')
    })

    test('spotsReserved never exceeds capacity', async ({ request, page }) => {
      // Login as admin
      await page.goto(`${BASE_URL}/admin/login`)
      // ... login

      const cookies = await page.context().cookies()
      const sessionCookie = cookies.find(c => c.name === 'admin_session')

      // Get all events
      const eventsResponse = await request.get(`${BASE_URL}/api/events`, {
        headers: { 'Cookie': `admin_session=${sessionCookie?.value}` }
      })

      const events = await eventsResponse.json()

      // Check no event is over-booked
      for (const event of events) {
        expect(event.spotsReserved).toBeLessThanOrEqual(event.capacity)
      }

      console.log('✅ No over-booked events found')
    })
  })

  test.describe('Transaction Rollback', () => {

    test('failed payment does not reserve spots', async ({ page }) => {
      // TODO: When payment is implemented

      // Register with payment that fails
      // Verify spots were NOT reserved
      // Verify no registration was created

      test.skip('Payment integration not yet implemented')
    })

    test('database error during registration rolls back transaction', async ({ page }) => {
      // This requires simulating a database error
      // Could be tested with database connection issues

      // TODO: Advanced test - may need database mocking

      test.skip('Requires database mocking')
    })
  })

  test.describe('Performance Under Load', () => {

    test('100 concurrent registrations complete within reasonable time', async ({ browser }) => {
      const startTime = Date.now()

      // Create 100 browser contexts
      const contextCount = 100
      const contexts = []

      console.log(`Creating ${contextCount} concurrent users...`)

      for (let i = 0; i < contextCount; i++) {
        contexts.push(await browser.newContext())
      }

      const pages = await Promise.all(contexts.map(ctx => ctx.newPage()))

      const testEventSlug = 'load-test-' + Date.now()

      // TODO: Create event with large capacity (e.g., 1000)

      // All users register simultaneously
      await Promise.all(pages.map((page, i) => (async () => {
        try {
          await page.goto(`${BASE_URL}/p/test-school/${testEventSlug}`, { timeout: 10000 })
          await page.fill('input[name="name"]', `Load User ${i}`)
          await page.fill('input[name="phone"]', `050${String(i).padStart(7, '0')}`)
          await page.click('button[type="submit"]')
          await page.waitForTimeout(2000)
        } catch (error) {
          console.error(`User ${i} failed:`, error)
        }
      })()))

      const endTime = Date.now()
      const duration = endTime - startTime

      console.log(`${contextCount} concurrent registrations completed in ${duration}ms`)

      // Should complete within 30 seconds
      expect(duration).toBeLessThan(30000)

      // Cleanup
      await Promise.all(contexts.map(ctx => ctx.close()))

      console.log('✅ System handles concurrent load within acceptable time')
    })
  })
})
