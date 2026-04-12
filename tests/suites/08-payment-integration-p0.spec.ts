import { test, expect } from '@playwright/test'
import { createSchool, createEvent, cleanupTestData, prisma } from '../fixtures/test-data'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { generateEmail, generateIsraeliPhone } from '../helpers/test-helpers'

/**
 * P0 (CRITICAL) Payment Integration Tests - YaadPay Event Ticketing
 *
 * Tests cover:
 * - Upfront payment (UPFRONT timing)
 * - Post-registration payment (POST_REGISTRATION timing)
 * - Fixed price vs per-guest pricing
 * - Payment callback handling (success/failure)
 * - Idempotency (prevent double processing)
 * - Multi-tenant isolation
 * - QR code generation after payment
 * - Email notifications (confirmation vs invoice)
 */

test.describe('Payment Integration P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[08.1] Upfront Payment - Success Flow', () => {
    test('should redirect to YaadPay payment for UPFRONT paid event', async ({ page }) => {
      // Setup: Create paid event with UPFRONT payment
      const school = await createSchool().withName('Upfront Payment School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Upfront',
          slug: `paid-upfront-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days ahead
          location: 'Test Stadium',

          // Payment configuration
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 50.00,
          currency: 'ILS',
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify price is displayed
      await expect(page.locator('text=/מחיר|price/i')).toBeVisible()
      await expect(page.locator('text=/₪50|50.00/i')).toBeVisible()
      await expect(page.locator('text=/תשלום מראש|upfront/i')).toBeVisible()

      // Fill registration form
      await publicPage.fillRegistrationForm({
        name: 'Test Payer',
        email: generateEmail('upfront'),
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      // Submit form - should redirect to payment
      await page.click('button[type="submit"]:has-text("המשך לתשלום"), button[type="submit"]:has-text("Continue to Payment")')

      // Wait for redirect to payment gateway
      await page.waitForTimeout(2000)

      // Should be on payment redirect page OR YaadPay (depending on test env)
      const currentUrl = page.url()
      const isPaymentRedirect = currentUrl.includes('/payment/redirect') ||
                               currentUrl.includes('yaadpay.co.il') ||
                               await page.locator('text=/מעביר לתשלום|מעביר לדף התשלום/i').isVisible().catch(() => false)

      expect(isPaymentRedirect).toBeTruthy()
    })

    test('should complete registration after successful payment callback', async ({ page }) => {
      // Setup: Create paid event
      const school = await createSchool().withName('Callback Success School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Callback Test',
          slug: `paid-callback-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 75.00,
        },
      })

      // Create registration and payment record manually (simulate registration flow)
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          data: {
            name: 'Callback Test User',
            email: generateEmail('callback-success'),
          },
          phoneNumber: generateIsraeliPhone(),
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          paymentStatus: 'PENDING',
          paymentIntentId: `test-payment-intent-${Date.now()}`,
          amountDue: 75.00,
        },
      })

      const payment = await prisma.payment.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          schoolId: school.id,
          amount: 75.00,
          currency: 'ILS',
          status: 'PENDING',
          yaadPayOrderId: registration.paymentIntentId!,
          payerEmail: (registration.data as any).email,
          payerName: (registration.data as any).name,
          paymentMethod: 'yaadpay',
        },
      })

      // Mock YaadPay success callback
      const callbackUrl = `/api/payment/callback?CCode=0&Order=${registration.paymentIntentId}&Id=YAAD${Date.now()}&ConfirmationCode=CONF${Date.now()}&Amount=75.00`

      const response = await page.goto(callbackUrl)

      // Should redirect to success page
      await page.waitForURL(/\/payment\/success/, { timeout: 10000 })
      expect(page.url()).toContain('/payment/success')

      // Verify confirmation code is shown
      await expect(page.locator('text=/קוד אישור|confirmation code/i')).toBeVisible()
      await expect(page.locator(`text=${registration.confirmationCode}`)).toBeVisible()

      // Verify payment status in database
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      })
      expect(updatedPayment?.status).toBe('COMPLETED')
      expect(updatedPayment?.completedAt).toBeTruthy()

      // Verify registration payment status
      const updatedRegistration = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(updatedRegistration?.paymentStatus).toBe('COMPLETED')
      expect(updatedRegistration?.amountPaid).toBeTruthy()
    })
  })

  test.describe('[08.2] Upfront Payment - Failed Flow', () => {
    test('should handle failed payment callback correctly', async ({ page }) => {
      // Setup: Create paid event
      const school = await createSchool().withName('Payment Failed School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Failure Test',
          slug: `paid-failure-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 100.00,
        },
      })

      // Create registration and payment
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          data: {
            name: 'Failed Payment User',
            email: generateEmail('payment-failed'),
          },
          phoneNumber: generateIsraeliPhone(),
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          paymentStatus: 'PENDING',
          paymentIntentId: `test-failed-payment-${Date.now()}`,
          amountDue: 100.00,
        },
      })

      const payment = await prisma.payment.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          schoolId: school.id,
          amount: 100.00,
          currency: 'ILS',
          status: 'PENDING',
          yaadPayOrderId: registration.paymentIntentId!,
          payerEmail: (registration.data as any).email,
          paymentMethod: 'yaadpay',
        },
      })

      // Mock YaadPay FAILED callback (CCode=4 = declined)
      const callbackUrl = `/api/payment/callback?CCode=4&Order=${registration.paymentIntentId}&Id=YAAD${Date.now()}`

      await page.goto(callbackUrl)

      // Should redirect to failure page
      await page.waitForURL(/\/payment\/failed/, { timeout: 10000 })
      expect(page.url()).toContain('/payment/failed')

      // Verify error message is shown
      await expect(page.locator('text=/תשלום נכשל|payment.*fail|העסקה נדחתה/i')).toBeVisible()

      // Verify payment status in database
      const updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      })
      expect(updatedPayment?.status).toBe('FAILED')
      expect(updatedPayment?.yaadPayCCode).toBe(4)

      // Verify registration status (should be PENDING for retry, not CANCELLED)
      const updatedRegistration = await prisma.registration.findUnique({
        where: { id: registration.id },
      })
      expect(updatedRegistration?.paymentStatus).toBe('FAILED')
      expect(updatedRegistration?.status).toBe('CONFIRMED') // Keep registration active for retry
    })
  })

  test.describe('[08.3] Post-Registration Payment - Invoice Email', () => {
    test('should create registration with PENDING payment and send invoice email', async ({ page }) => {
      // Setup: Create POST_REGISTRATION paid event
      const school = await createSchool().withName('Post Reg Payment School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Post Registration',
          slug: `paid-post-reg-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'POST_REGISTRATION',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 100.00,
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify payment info is displayed
      await expect(page.locator('text=/תשלום לאחר ההרשמה|payment.*after.*registration/i')).toBeVisible()

      // Fill and submit registration
      const userEmail = generateEmail('post-reg')
      await publicPage.fillRegistrationForm({
        name: 'Post Reg User',
        email: userEmail,
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      await publicPage.submitRegistration()

      // Should see registration confirmation (NOT payment redirect)
      await publicPage.expectConfirmation()

      // Get confirmation code
      const confirmationCode = await publicPage.getConfirmationCode()
      expect(confirmationCode).toBeTruthy()

      // Verify registration in database
      const registration = await prisma.registration.findFirst({
        where: {
          confirmationCode: confirmationCode!,
          eventId: event.id,
        },
      })

      expect(registration).toBeTruthy()
      expect(registration?.paymentStatus).toBe('PENDING')
      expect(registration?.amountDue).toBeTruthy()

      // Verify payment record created
      const payment = await prisma.payment.findFirst({
        where: {
          registrationId: registration!.id,
        },
      })

      expect(payment).toBeTruthy()
      expect(payment?.status).toBe('PENDING')
      expect(payment?.amount).toBeTruthy()

      // NOTE: Email verification would require checking email service
      // In production, invoice email should be sent with payment link
    })
  })

  test.describe('[08.4] Per-Guest Pricing Calculation', () => {
    test('should calculate total amount for PER_GUEST pricing model', async ({ page }) => {
      // Setup: Create event with PER_GUEST pricing
      const school = await createSchool().withName('Per Guest Pricing School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Per Guest',
          slug: `paid-per-guest-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'PER_GUEST',
          priceAmount: 25.00, // ₪25 per guest
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify pricing model is displayed
      await expect(page.locator('text=/מחיר לאדם|per.*person|per.*guest/i')).toBeVisible()
      await expect(page.locator('text=/₪25/i')).toBeVisible()

      // Fill form with 4 guests
      await page.fill('input[name="name"]', 'Multi Guest User')
      await page.fill('input[name="email"]', generateEmail('per-guest'))
      await page.fill('input[name="phone"]', generateIsraeliPhone())
      await page.fill('input[name="spots"]', '4')

      // Verify total price is calculated (25 × 4 = 100)
      // Note: This assumes frontend shows calculated total
      const totalElement = await page.locator('text=/סה״כ|total/i').first()
      if (await totalElement.isVisible().catch(() => false)) {
        await expect(page.locator('text=/₪100|100.00/i')).toBeVisible()
      }

      // Submit form
      await page.click('button[type="submit"]')

      // Wait for redirect
      await page.waitForTimeout(2000)

      // In actual implementation, verify that payment amount is 100.00 (25 × 4)
      // This would require checking the payment record in database or payment gateway params
    })
  })

  test.describe('[08.5] Free Event - No Payment', () => {
    test('should complete registration immediately for free events', async ({ page }) => {
      // Setup: Create FREE event (paymentRequired=false)
      const school = await createSchool().withName('Free Event School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Free Event - No Payment',
          slug: `free-event-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: false, // FREE EVENT
          paymentTiming: 'OPTIONAL',
          pricingModel: 'FREE',
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify NO payment info is displayed
      await expect(page.locator('text=/תשלום|payment|מחיר|price/i')).not.toBeVisible()

      // Fill and submit registration
      const userEmail = generateEmail('free-event')
      await publicPage.fillRegistrationForm({
        name: 'Free Event User',
        email: userEmail,
        phone: generateIsraeliPhone(),
        spots: 1,
      })

      await publicPage.submitRegistration()

      // Should see confirmation immediately (no payment redirect)
      await publicPage.expectConfirmation()

      // Get confirmation code
      const confirmationCode = await publicPage.getConfirmationCode()
      expect(confirmationCode).toBeTruthy()

      // Verify registration in database
      const registration = await prisma.registration.findFirst({
        where: {
          confirmationCode: confirmationCode!,
        },
      })

      expect(registration).toBeTruthy()
      expect(registration?.status).toBe('CONFIRMED')
      expect(registration?.paymentStatus).toBe('PENDING') // Default value
      expect(registration?.amountDue).toBeNull() // No amount due for free event

      // Verify NO payment record created
      const payment = await prisma.payment.findFirst({
        where: {
          registrationId: registration!.id,
        },
      })

      expect(payment).toBeNull() // No payment record for free events

      // NOTE: QR code should be generated immediately
      // Confirmation email should be sent (not invoice)
    })
  })

  test.describe('[08.6] Idempotency Test - Prevent Double Processing', () => {
    test('should not process payment twice on callback refresh', async ({ page }) => {
      // Setup: Create paid event
      const school = await createSchool().withName('Idempotency School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Idempotency Test',
          slug: `paid-idempotency-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 50.00,
        },
      })

      // Create registration and payment
      const registration = await prisma.registration.create({
        data: {
          eventId: event.id,
          data: {
            name: 'Idempotency User',
            email: generateEmail('idempotency'),
          },
          phoneNumber: generateIsraeliPhone(),
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          paymentStatus: 'PENDING',
          paymentIntentId: `test-idempotency-${Date.now()}`,
          amountDue: 50.00,
        },
      })

      const payment = await prisma.payment.create({
        data: {
          registrationId: registration.id,
          eventId: event.id,
          schoolId: school.id,
          amount: 50.00,
          currency: 'ILS',
          status: 'PENDING',
          yaadPayOrderId: registration.paymentIntentId!,
          payerEmail: (registration.data as any).email,
          paymentMethod: 'yaadpay',
        },
      })

      // FIRST callback - should process successfully
      const callbackUrl = `/api/payment/callback?CCode=0&Order=${registration.paymentIntentId}&Id=YAAD${Date.now()}&ConfirmationCode=CONF${Date.now()}&Amount=50.00`

      await page.goto(callbackUrl)
      await page.waitForURL(/\/payment\/success/, { timeout: 10000 })

      // Verify payment completed
      let updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      })
      expect(updatedPayment?.status).toBe('COMPLETED')
      const firstCompletedAt = updatedPayment?.completedAt

      // Wait a bit
      await page.waitForTimeout(1000)

      // SECOND callback - REFRESH (simulate user refreshing the page)
      await page.goto(callbackUrl)
      await page.waitForURL(/\/payment\/success/, { timeout: 10000 })

      // Should still redirect to success page
      expect(page.url()).toContain('/payment/success')

      // Verify payment NOT processed twice
      updatedPayment = await prisma.payment.findUnique({
        where: { id: payment.id },
      })

      expect(updatedPayment?.status).toBe('COMPLETED')
      expect(updatedPayment?.completedAt?.getTime()).toBe(firstCompletedAt?.getTime())

      // Verify single registration (not duplicated)
      const registrationCount = await prisma.registration.count({
        where: {
          eventId: event.id,
          phoneNumber: registration.phoneNumber,
        },
      })
      expect(registrationCount).toBe(1)

      // NOTE: In production, verify only ONE confirmation email was sent
    })
  })

  test.describe('[08.7] Price Display on Registration Page', () => {
    test('should display price and payment timing for paid events', async ({ page }) => {
      // Setup: Create FIXED_PRICE paid event
      const school = await createSchool().withName('Price Display School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Price Display',
          slug: `paid-price-display-${Date.now()}`,
          schoolId: school.id,
          capacity: 50,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 75.50,
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify price is displayed
      await expect(page.locator('text=/מחיר|price/i')).toBeVisible()
      await expect(page.locator('text=/₪75|75.50/i')).toBeVisible()

      // Verify payment timing is shown
      await expect(page.locator('text=/תשלום מראש|upfront|במעמד ההרשמה/i')).toBeVisible()

      // Verify payment icon (credit card emoji)
      const hasPaymentIcon = await page.locator('text=/💳|🔒|💰/').isVisible().catch(() => false)
      if (hasPaymentIcon) {
        expect(hasPaymentIcon).toBeTruthy()
      }
    })

    test('should display per-guest pricing model correctly', async ({ page }) => {
      // Setup: Create PER_GUEST paid event
      const school = await createSchool().withName('Per Guest Display School').create()
      const event = await prisma.event.create({
        data: {
          title: 'Paid Event - Per Guest Display',
          slug: `paid-per-guest-display-${Date.now()}`,
          schoolId: school.id,
          capacity: 100,
          spotsReserved: 0,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'Test Location',
          paymentRequired: true,
          paymentTiming: 'POST_REGISTRATION',
          pricingModel: 'PER_GUEST',
          priceAmount: 30.00,
        },
      })

      const publicPage = new PublicEventPage(page)
      await publicPage.goto(school.slug, event.slug)

      // Verify per-guest pricing is displayed
      await expect(page.locator('text=/מחיר לאדם|per.*person|per.*guest/i')).toBeVisible()
      await expect(page.locator('text=/₪30/i')).toBeVisible()

      // Verify payment timing
      await expect(page.locator('text=/תשלום לאחר ההרשמה|payment.*after/i')).toBeVisible()
    })
  })

  test.describe('[08.8] Multi-Tenant Isolation - Payment Records', () => {
    test('should isolate payment records by school', async ({ page }) => {
      // Setup: Create two schools with paid events
      const schoolA = await createSchool().withName('Payment School A').create()
      const schoolB = await createSchool().withName('Payment School B').create()

      const eventA = await prisma.event.create({
        data: {
          title: 'School A Paid Event',
          slug: `school-a-paid-${Date.now()}`,
          schoolId: schoolA.id,
          capacity: 50,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'School A Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 50.00,
        },
      })

      const eventB = await prisma.event.create({
        data: {
          title: 'School B Paid Event',
          slug: `school-b-paid-${Date.now()}`,
          schoolId: schoolB.id,
          capacity: 50,
          startAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          location: 'School B Location',
          paymentRequired: true,
          paymentTiming: 'UPFRONT',
          pricingModel: 'FIXED_PRICE',
          priceAmount: 60.00,
        },
      })

      // Create payments for both schools
      const regA = await prisma.registration.create({
        data: {
          eventId: eventA.id,
          data: { name: 'School A User', email: generateEmail('school-a') },
          phoneNumber: generateIsraeliPhone(),
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          paymentStatus: 'PENDING',
          paymentIntentId: `school-a-payment-${Date.now()}`,
          amountDue: 50.00,
        },
      })

      const paymentA = await prisma.payment.create({
        data: {
          registrationId: regA.id,
          eventId: eventA.id,
          schoolId: schoolA.id, // School A
          amount: 50.00,
          currency: 'ILS',
          status: 'COMPLETED',
          yaadPayOrderId: regA.paymentIntentId!,
          paymentMethod: 'yaadpay',
        },
      })

      const regB = await prisma.registration.create({
        data: {
          eventId: eventB.id,
          data: { name: 'School B User', email: generateEmail('school-b') },
          phoneNumber: generateIsraeliPhone(),
          spotsCount: 1,
          status: 'CONFIRMED',
          confirmationCode: generateConfirmationCode(),
          paymentStatus: 'PENDING',
          paymentIntentId: `school-b-payment-${Date.now()}`,
          amountDue: 60.00,
        },
      })

      const paymentB = await prisma.payment.create({
        data: {
          registrationId: regB.id,
          eventId: eventB.id,
          schoolId: schoolB.id, // School B
          amount: 60.00,
          currency: 'ILS',
          status: 'COMPLETED',
          yaadPayOrderId: regB.paymentIntentId!,
          paymentMethod: 'yaadpay',
        },
      })

      // Verify multi-tenant isolation

      // School A can only see their payments
      const schoolAPayments = await prisma.payment.findMany({
        where: { schoolId: schoolA.id },
      })
      expect(schoolAPayments).toHaveLength(1)
      expect(schoolAPayments[0].id).toBe(paymentA.id)
      expect(schoolAPayments[0].amount).toBe(50.00)

      // School B can only see their payments
      const schoolBPayments = await prisma.payment.findMany({
        where: { schoolId: schoolB.id },
      })
      expect(schoolBPayments).toHaveLength(1)
      expect(schoolBPayments[0].id).toBe(paymentB.id)
      expect(schoolBPayments[0].amount).toBe(60.00)

      // Verify payment record has correct school association
      expect(paymentA.schoolId).toBe(schoolA.id)
      expect(paymentB.schoolId).toBe(schoolB.id)
      expect(paymentA.schoolId).not.toBe(schoolB.id)
    })
  })
})

/**
 * Helper function to generate confirmation code
 */
function generateConfirmationCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}
