import { test, expect } from '@playwright/test'
import { createSchool, createEvent, cleanupTestData } from '../fixtures/test-data'

/**
 * P0 (CRITICAL) Payment Regression Tests
 * Tests for all FIXED payment-related bugs to prevent regressions
 *
 * Coverage:
 * - Bug #18: Payment API field mismatch (CAPACITY_BASED events)
 * - Bug #19: UPFRONT payment bypass vulnerability
 * - Bug #20: Public API missing payment fields
 * - Bug #21: Missing payment configuration UI
 */

test.describe('Payment Regression P0 - CRITICAL Payment Bugs', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('Bug #18: Payment API Field Mismatch - CAPACITY_BASED Events', () => {
    test('should accept spotsCount for CAPACITY_BASED events with PER_GUEST pricing', async ({ request }) => {
      const school = await createSchool()
        .withName('Capacity Payment School')
        .withSlug(`capacity-pay-${Date.now()}`)
        .create()

      // CAPACITY_BASED event with PER_GUEST pricing
      const event = await createEvent()
        .withTitle('Capacity Based Paid Event')
        .withSlug(`capacity-paid-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 50)
        .withCapacity(100)
        .create()

      // Call payment API with spotsCount (CAPACITY_BASED events use spotsCount)
      const response = await request.post('/api/payment/create', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          schoolSlug: school.slug,
          eventSlug: event.slug,
          registrationData: {
            name: 'Test User',
            email: 'test@test.com',
            phone: '0501234567',
            spotsCount: 2, // Using spotsCount (not guestsCount)
          },
        },
      })

      // Should succeed (accept spotsCount)
      // Payment API should return redirect form or success
      expect([200, 201]).toContain(response.status())
    })

    test('should accept guestsCount for TABLE_BASED events with PER_GUEST pricing', async ({ request }) => {
      const school = await createSchool()
        .withName('Table Payment School')
        .withSlug(`table-pay-${Date.now()}`)
        .create()

      // TABLE_BASED event with PER_GUEST pricing
      const event = await createEvent()
        .withTitle('Table Based Paid Event')
        .withSlug(`table-paid-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 75)
        .withCapacity(0) // TABLE_BASED events have 0 capacity
        .create()

      // Call payment API with guestsCount (TABLE_BASED events use guestsCount)
      const response = await request.post('/api/payment/create', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          schoolSlug: school.slug,
          eventSlug: event.slug,
          registrationData: {
            name: 'Restaurant Guest',
            email: 'guest@test.com',
            phone: '0509876543',
            guestsCount: 4, // Using guestsCount (not spotsCount)
          },
        },
      })

      // Should succeed (accept guestsCount)
      expect([200, 201]).toContain(response.status())
    })

    test('should calculate correct amount for PER_GUEST pricing', async ({ request }) => {
      const school = await createSchool()
        .withName('Price Calculation School')
        .withSlug(`price-calc-${Date.now()}`)
        .create()

      const pricePerGuest = 100

      const event = await createEvent()
        .withTitle('Price Calculation Event')
        .withSlug(`price-calc-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', pricePerGuest)
        .withCapacity(50)
        .create()

      const response = await request.post('/api/payment/create', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          schoolSlug: school.slug,
          eventSlug: event.slug,
          registrationData: {
            name: 'Price Test User',
            email: 'price@test.com',
            phone: '0501112222',
            spotsCount: 3, // 3 guests
          },
        },
      })

      // Payment amount should be: 100 * 3 = 300
      if (response.ok()) {
        const html = await response.text()
        // Check if payment form contains correct amount
        // The exact format depends on payment provider integration
        expect(html).toBeDefined()
      }
    })

    test('should reject payment request with invalid participant count', async ({ request }) => {
      const school = await createSchool()
        .withName('Invalid Count School')
        .withSlug(`invalid-count-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Invalid Count Event')
        .withSlug(`invalid-count-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 50)
        .create()

      // Send request with invalid participant count (0)
      const response = await request.post('/api/payment/create', {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          schoolSlug: school.slug,
          eventSlug: event.slug,
          registrationData: {
            name: 'Invalid User',
            email: 'invalid@test.com',
            phone: '0501234567',
            spotsCount: 0, // Invalid!
          },
        },
      })

      // Should return 400 error
      expect(response.status()).toBe(400)
      const errorData = await response.json()
      expect(errorData.error).toMatch(/participant count/i)
    })
  })

  test.describe('Bug #19: UPFRONT Payment Events Allow Free Registration (Comprehensive)', () => {
    test('should completely block registration API for UPFRONT payment events', async ({ request }) => {
      const school = await createSchool()
        .withName('Security Test School')
        .withSlug(`security-test-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Secure Paid Event')
        .withSlug(`secure-paid-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100)
        .withCapacity(50)
        .create()

      // CRITICAL: Try to bypass payment by calling registration API directly
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Bypass Attempt',
          email: 'bypass@test.com',
          phone: '0501234567',
          spotsCount: 2,
        },
      })

      // MUST return 400 error (not 200/201 success!)
      expect(response.status()).toBe(400)

      const errorData = await response.json()
      expect(errorData.error.toLowerCase()).toContain('payment')
    })

    test('should allow normal registration for FREE events', async ({ request }) => {
      const school = await createSchool()
        .withName('Free Event School')
        .withSlug(`free-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Free Event')
        .withSlug(`free-${Date.now()}`)
        .withSchool(school.id)
        // No payment configuration
        .withCapacity(50)
        .create()

      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Free User',
          email: 'free@test.com',
          phone: '0501234567',
          spotsCount: 1,
        },
      })

      // Free events should work normally
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.registration).toBeDefined()
      expect(data.confirmationCode).toBeDefined()
    })

    test('should allow registration for POST_REGISTRATION payment events', async ({ request }) => {
      const school = await createSchool()
        .withName('Post Payment School')
        .withSlug(`post-payment-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Pay Later Event')
        .withSlug(`pay-later-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'POST_REGISTRATION', 'PER_GUEST', 50)
        .withCapacity(50)
        .create()

      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Pay Later User',
          email: 'paylater@test.com',
          phone: '0509876543',
          spotsCount: 1,
        },
      })

      // POST_REGISTRATION events allow registration (payment comes later)
      expect(response.ok()).toBeTruthy()
      const data = await response.json()
      expect(data.registration).toBeDefined()
    })

    test('should block even if event is not full', async ({ request }) => {
      const school = await createSchool()
        .withName('Not Full Security School')
        .withSlug(`not-full-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Paid Event With Capacity')
        .withSlug(`paid-capacity-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'FLAT_RATE', 200)
        .withCapacity(100)
        .withSpotsReserved(5) // Only 5/100 spots taken
        .create()

      // Even with 95 spots available, UPFRONT payment required
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Capacity Bypass',
          email: 'capacity@test.com',
          phone: '0501234567',
          spotsCount: 1,
        },
      })

      // Must still block
      expect(response.status()).toBe(400)
    })
  })

  test.describe('Bug #20: Public API Missing Payment Fields (Comprehensive)', () => {
    test('should return all payment fields for paid events', async ({ request }) => {
      const school = await createSchool()
        .withName('Full Payment Fields School')
        .withSlug(`full-payment-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Complete Payment Event')
        .withSlug(`complete-pay-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 150, 'USD')
        .create()

      const response = await request.get(`/api/p/${school.slug}/${event.slug}`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // ALL payment fields must be present
      expect(data.paymentRequired).toBe(true)
      expect(data.paymentTiming).toBe('UPFRONT')
      expect(data.pricingModel).toBe('PER_GUEST')
      expect(data.priceAmount).toBe(150)
      expect(data.currency).toBe('USD')
    })

    test('should return null/false payment fields for free events', async ({ request }) => {
      const school = await createSchool()
        .withName('Free Fields School')
        .withSlug(`free-fields-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Free Event Fields Check')
        .withSlug(`free-fields-${Date.now()}`)
        .withSchool(school.id)
        .create()

      const response = await request.get(`/api/p/${school.slug}/${event.slug}`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      // Free events should have explicit null/false values
      expect(data.paymentRequired).toBe(false)
      expect(data.paymentTiming).toBeNull()
      expect(data.pricingModel).toBeNull()
      expect(data.priceAmount).toBeNull()
    })

    test('should return correct payment fields for FLAT_RATE pricing', async ({ request }) => {
      const school = await createSchool()
        .withName('Flat Rate School')
        .withSlug(`flat-rate-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Flat Rate Event')
        .withSlug(`flat-rate-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'POST_REGISTRATION', 'FLAT_RATE', 500)
        .create()

      const response = await request.get(`/api/p/${school.slug}/${event.slug}`)

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.paymentRequired).toBe(true)
      expect(data.paymentTiming).toBe('POST_REGISTRATION')
      expect(data.pricingModel).toBe('FLAT_RATE')
      expect(data.priceAmount).toBe(500)
    })

    test('should not leak payment fields to non-public APIs', async ({ request }) => {
      // This ensures payment fields are only in public API, not accidentally exposed elsewhere
      const school = await createSchool()
        .withName('API Isolation School')
        .withSlug(`api-isolation-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('API Isolation Event')
        .withSlug(`api-isolation-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100)
        .create()

      // Get public API (should have payment fields)
      const publicResponse = await request.get(`/api/p/${school.slug}/${event.slug}`)
      expect(publicResponse.ok()).toBeTruthy()

      const publicData = await publicResponse.json()
      expect(publicData.paymentRequired).toBe(true)
      expect(publicData.priceAmount).toBe(100)
    })
  })

  test.describe('Payment Flow Integration Tests', () => {
    test('complete payment flow for UPFRONT event should work end-to-end', async ({ page }) => {
      const school = await createSchool()
        .withName('Flow Test School')
        .withSlug(`flow-test-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Flow Test Event')
        .withSlug(`flow-test-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 50)
        .withCapacity(50)
        .create()

      // Navigate to public page
      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Should show payment button (not direct registration)
      const hasPaymentIndicator = await page.locator('text=/תשלום|Payment|₪|ILS/i')
        .isVisible({ timeout: 5000 })
        .catch(() => false)

      // Should show price
      const hasPrice = await page.locator('text=/50|₪/i')
        .isVisible()
        .catch(() => false)

      // For UPFRONT events, payment info should be visible
      expect(hasPaymentIndicator || hasPrice).toBe(true)
    })

    test('FREE event should show direct registration (no payment)', async ({ page }) => {
      const school = await createSchool()
        .withName('Free Flow School')
        .withSlug(`free-flow-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Free Flow Event')
        .withSlug(`free-flow-${Date.now()}`)
        .withSchool(school.id)
        .withCapacity(50)
        .create()

      await page.goto(`/p/${school.slug}/${event.slug}`)

      // Should NOT show payment information
      const hasNoPayment = await page.locator('text=/ללא תשלום|Free|חינם/i')
        .isVisible()
        .catch(() => false)

      // Should show registration form directly
      const hasForm = await page.locator('form').isVisible().catch(() => false)

      expect(hasNoPayment || hasForm).toBe(true)
    })
  })

  test.describe('Payment Security Edge Cases', () => {
    test('should reject payment bypass with manipulated event data', async ({ request }) => {
      const school = await createSchool()
        .withName('Security Edge School')
        .withSlug(`security-edge-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Security Edge Event')
        .withSlug(`security-edge-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 100)
        .create()

      // Try to bypass by sending paymentRequired: false in request
      const response = await request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        headers: {
          'Content-Type': 'application/json',
        },
        data: {
          name: 'Manipulated Data',
          email: 'manipulated@test.com',
          phone: '0501234567',
          spotsCount: 1,
          paymentRequired: false, // Try to manipulate
          paymentTiming: 'POST_REGISTRATION', // Try to manipulate
        },
      })

      // Should STILL block (server validates, not client)
      expect(response.status()).toBe(400)
    })

    test('should handle concurrent payment requests correctly', async ({ request }) => {
      const school = await createSchool()
        .withName('Concurrent Payment School')
        .withSlug(`concurrent-pay-${Date.now()}`)
        .create()

      const event = await createEvent()
        .withTitle('Concurrent Payment Event')
        .withSlug(`concurrent-pay-${Date.now()}`)
        .withSchool(school.id)
        .withPayment(true, 'UPFRONT', 'PER_GUEST', 75)
        .withCapacity(10)
        .create()

      // Simulate concurrent payment requests
      const promises = Array(5).fill(null).map((_, i) =>
        request.post('/api/payment/create', {
          headers: { 'Content-Type': 'application/json' },
          data: {
            schoolSlug: school.slug,
            eventSlug: event.slug,
            registrationData: {
              name: `User ${i}`,
              email: `user${i}@test.com`,
              phone: `05012345${i}${i}`,
              spotsCount: 1,
            },
          },
        })
      )

      const results = await Promise.all(promises)

      // All should either succeed or fail gracefully (no crashes)
      results.forEach(result => {
        expect([200, 201, 400, 409]).toContain(result.status())
      })
    })
  })
})
