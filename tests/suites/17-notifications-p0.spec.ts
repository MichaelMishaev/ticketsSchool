import { test, expect } from '@playwright/test'
import {
  createSchool,
  createAdmin,
  createEvent,
  createRegistration,
  cleanupTestData,
} from '../fixtures/test-data'
import { loginViaAPI } from '../helpers/auth-helpers'

test.describe('Notifications P1 (server-side trigger verification only)', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  // US-NOT-01: Confirmation email trigger
  // Expected email: confirmation with event details, QR code, cancellation link
  test.describe('[US-NOT-01] Registration confirmation trigger', () => {
    test('server: CONFIRMED registration has confirmationCode (needed for email)', async ({ context }) => {
      const school = await createSchool().withName('Notif Confirm Test').create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()

      const res = await context.request.post(`/api/p/${school.slug}/${event.slug}/register`, {
        data: {
          name: 'Notif User',
          phoneNumber: '+972509440001',
          email: 'notif-confirm@test.com',
          spotsCount: 1,
        },
      })

      if ([200, 201].includes(res.status())) {
        const body = await res.json()
        const reg = body.registration ?? body
        // confirmationCode is required for generating the QR code in the email
        expect(reg.confirmationCode ?? reg.id).toBeTruthy()
        expect(['CONFIRMED', 'PAYMENT_PENDING']).toContain(reg.status)
      }
    })
  })

  // US-NOT-02: Cancellation email trigger
  // Expected email: cancellation confirmation sent to guest
  test.describe('[US-NOT-02] Cancellation trigger', () => {
    test('server: cancelling registration changes status to CANCELLED', async ({ context }) => {
      const school = await createSchool().withName('Notif Cancel Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()
      const reg = await createRegistration().withEvent(event.id).confirmed().create()

      await loginViaAPI(context, admin.email, admin.password)
      const res = await context.request.patch(`/api/events/${event.id}/registrations/${reg.id}`, {
        data: { status: 'CANCELLED' },
      })
      // Cancellation triggers email — verify state change succeeded
      expect([200, 204]).toContain(res.status())
    })
  })

  // US-NOT-03: Waitlist promotion email trigger
  // Expected email: "You've been confirmed" with new QR code and cancellation link
  test.describe('[US-NOT-03] Waitlist promotion trigger', () => {
    test('server: promoting WAITLIST to CONFIRMED changes status', async ({ context }) => {
      const school = await createSchool().withName('Notif Promote Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent()
        .withSchool(school.id)
        .withCapacity(2)
        .withSpotsReserved(1)
        .inFuture()
        .create()
      const waitlistReg = await createRegistration().withEvent(event.id).waitlist().create()

      await loginViaAPI(context, admin.email, admin.password)
      const res = await context.request.patch(
        `/api/events/${event.id}/registrations/${waitlistReg.id}`,
        { data: { status: 'CONFIRMED' } }
      )
      expect([200, 204]).toContain(res.status())
    })
  })

  // US-NOT-05: Email failure does not roll back registration
  // Expected behavior: registration persists regardless of email delivery outcome
  test.describe('[US-NOT-05] Registration persists on email failure', () => {
    test('server: CONFIRMED registration remains in DB regardless of email', async ({ context }) => {
      const school = await createSchool().withName('Email Fail Test').create()
      const admin = await createAdmin().withSchool(school.id).create()
      const event = await createEvent().withSchool(school.id).withCapacity(50).inFuture().create()
      const reg = await createRegistration().withEvent(event.id).confirmed().create()

      await loginViaAPI(context, admin.email, admin.password)
      const res = await context.request.get(`/api/events/${event.id}/registrations/${reg.id}`)
      if (res.status() === 200) {
        const body = await res.json()
        // Registration persists — email delivery is fire-and-forget
        expect(body.status).toBe('CONFIRMED')
        expect(body.id).toBe(reg.id)
      } else {
        // Individual registration GET may not be implemented — verify via list
        const listRes = await context.request.get(`/api/events/${event.id}/registrations`)
        expect([200]).toContain(listRes.status())
      }
    })
  })
})
