# System Assumptions (Living Document)

**Purpose:** Document ALL critical system assumptions. Test them explicitly. Prevent violations through automated guards.

**Last Updated:** 2026-01-12
**Maintainer:** TicketsSchool Development Team
**Review Schedule:** Monthly or when changing core architecture

---

## Table of Contents

1. [Multi-Tenant Data Isolation](#assumption-1-multi-tenant-data-isolation-via-schoolid)
2. [Phone Numbers in Israeli Format](#assumption-2-phone-numbers-in-israeli-format)
3. [Event Capacity Enforced Atomically](#assumption-3-event-capacity-enforced-atomically)
4. [Payment Amounts in Cents (Not Floats)](#assumption-4-payment-amounts-in-cents-not-floats)
5. [JWT Secret Minimum 32 Bytes](#assumption-5-jwt-secret-minimum-32-bytes)
6. [Mock Payment Disabled in Production](#assumption-6-mock-payment-disabled-in-production)
7. [Session Updated After schoolId Changes](#assumption-7-session-updated-after-schoolid-changes)
8. [Hebrew Text Uses RTL Direction](#assumption-8-hebrew-text-uses-rtl-direction)
9. [Confirmation Codes Are Globally Unique](#assumption-9-confirmation-codes-are-globally-unique)
10. [YaadPay Callback Signatures Validated](#assumption-10-yaadpay-callback-signatures-validated)
11. [Sessions Expire After 7 Days](#assumption-11-sessions-expire-after-7-days)
12. [spotsReserved Never Decremented Directly](#assumption-12-spotsreserved-never-decremented-directly)

---

## ASSUMPTION #1: Multi-Tenant Data Isolation via schoolId

**Rule:** ALL database queries for non-SUPER_ADMIN users MUST filter by `schoolId`. Non-SUPER_ADMIN users MUST have a `schoolId` assigned (cannot be null).

**Enforced by:**

- Runtime guards in `/lib/auth.server.ts` (`requireSchoolAccess()` function)
- JWT session contains `schoolId` field
- API route middleware checks admin role and applies filter:
  ```typescript
  if (admin.role !== 'SUPER_ADMIN') {
    if (!admin.schoolId) {
      throw new Error('Data isolation violation: Admin missing schoolId')
    }
    where.schoolId = admin.schoolId // Filter all queries
  }
  ```
- Database indexes on `schoolId` for performance (`@@index([schoolId])`)

**Tested in:**

- `/lib/__tests__/auth.server.test.ts` (unit tests for session validation)
- `/lib/__tests__/prisma-guards.test.ts` (runtime guard tests)
- `/tests/critical/behavior-locks.spec.ts` (E2E multi-tenant isolation tests)

**Risk if violated:**

- **CRITICAL SECURITY**: Data leakage across schools
- School A admin could access/modify School B's events, registrations, users
- Privacy violation (Israeli PPL compliance breach)
- Financial impact: wrong school charged for events
- Legal liability: GDPR/PPL violations

**Prevention:**

- Code review checklist: "Does this API route enforce schoolId filtering?"
- ESLint rule (TODO): Detect unfiltered Prisma queries in `/app/api/*` routes
- Onboarding requirement: All new API routes must call `requireSchoolAccess()`
- Security audit: Monthly scan for `prisma.event.findMany()` without `where.schoolId`

---

## ASSUMPTION #2: Phone Numbers in Israeli Format

**Rule:** All phone numbers MUST be stored in E.164 format: `+972XXXXXXXXX` (12 digits total). Input accepts multiple formats but normalizes to E.164.

**Enforced by:**

- `normalizePhoneNumber()` function in `/lib/utils.ts`:
  ```typescript
  // Accepts: 0541234567, 972541234567, +972 54 123 4567
  // Normalizes to: +972541234567
  ```
- Database constraint (TODO): Add CHECK constraint `phoneNumber ~ '^\+972\d{9}$'`
- Server-side validation in registration APIs
- Client-side input masking (optional, UX enhancement)

**Tested in:**

- `/lib/__tests__/phone-normalization.test.ts` (unit tests for normalization logic)
- `/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts` (integration test for registration)

**Risk if violated:**

- SMS delivery failures (wrong country code)
- Duplicate registrations (same user with different phone formats)
- Ban system failures (can't match user across events)
- WhatsApp integration failures (Israeli business accounts expect +972)

**Prevention:**

- Pre-commit hook: Validate phone format in test fixtures
- Database migration: Add CHECK constraint on `phoneNumber` field
- API documentation: Document required phone format for external integrations
- Monitoring: Alert on registration failures with phone validation errors

---

## ASSUMPTION #3: Event Capacity Enforced Atomically

**Rule:** `event.spotsReserved` counter MUST NEVER exceed `event.capacity` for CONFIRMED registrations. Increment operations MUST be atomic (inside Prisma transaction).

**Enforced by:**

- Prisma `$transaction` wrapper in registration API:

  ```typescript
  await prisma.$transaction(async (tx) => {
    const event = await tx.event.findUnique({ where: { id: eventId } })

    if (event.spotsReserved + spotsCount > event.capacity) {
      status = 'WAITLIST'  // Don't increment
    } else {
      await tx.event.update({
        where: { id: eventId },
        data: { spotsReserved: { increment: spotsCount } }  // Atomic
      })
      status = 'CONFIRMED'
    }

    await tx.registration.create({...})
  })
  ```

- Database constraint (TODO): Add CHECK constraint `spotsReserved <= capacity`
- Isolation level: READ COMMITTED (PostgreSQL default, prevents dirty reads)

**Tested in:**

- `/lib/__tests__/capacity-validation.test.ts` (unit tests for capacity logic)
- `/tests/critical/atomic-capacity.spec.ts` (E2E concurrent registration tests)
- Playwright test: "should handle race conditions when capacity is 1"

**Risk if violated:**

- **CRITICAL BUSINESS LOGIC**: Double-booking (overselling events)
- Customer complaints: confirmed registration but no seat available
- Refund liabilities: must refund excess registrations
- Reputation damage: "unreliable ticketing system"
- Revenue loss: must honor confirmed registrations even if overbooked

**Prevention:**

- Never use `prisma.event.update({ spotsReserved: currentValue + 1 })` (race condition)
- Always use `{ increment: spotsCount }` syntax (atomic)
- Load testing: Simulate 100 concurrent registrations for capacity=1 event
- Monitoring: Alert when `spotsReserved > capacity` (should never happen)
- Database trigger (TODO): Block updates where `spotsReserved > capacity`

---

## ASSUMPTION #4: Payment Amounts in Cents (Not Floats)

**Rule:** ALL monetary amounts MUST be stored as INTEGER cents (agorot). Never use FLOAT or DECIMAL for calculations. 1 ILS = 100 cents.

**Enforced by:**

- Prisma schema: `amount Int` (not Float or Decimal)
- YaadPay API expects amounts in ILS with 2 decimal places (e.g., "150.00")
- Database stores in cents (15000) for internal calculations
- Conversion only at API boundaries:
  ```typescript
  // Store in DB: 15000 (cents)
  // Send to YaadPay: (15000 / 100).toFixed(2) = "150.00"
  ```
- Type guard: `if (!Number.isInteger(amount))` throws error

**Tested in:**

- `/lib/__tests__/payment-calculation.test.ts` (unit tests for cent-based calculations)
- Test case: "prevents floating-point precision errors (0.1 + 0.2)"
- Test case: "calculates 2.5% processing fee without rounding errors"

**Risk if violated:**

- **CRITICAL FINANCIAL**: Floating-point precision errors (0.1 + 0.2 = 0.30000000000000004)
- Incorrect charges: User charged 150.01 ILS instead of 150.00 ILS
- Revenue discrepancies: Daily totals don't match transaction sums
- Payment gateway rejections: YaadPay rejects amounts with >2 decimal places
- Accounting nightmares: Can't reconcile payments due to rounding errors

**Prevention:**

- ESLint rule (TODO): Detect `parseFloat()` or `toFixed()` in payment code
- Code review: Flag any `Decimal` type usage in payment models
- Integration tests: Verify YaadPay API receives exactly 2 decimal places
- Monitoring: Alert on payment amount mismatches (DB vs. YaadPay callback)

---

## ASSUMPTION #5: JWT Secret Minimum 32 Bytes

**Rule:** `JWT_SECRET` environment variable MUST be at least 32 characters (256 bits). No default fallback allowed. Server MUST NOT start without a valid secret.

**Enforced by:**

- Lazy validation in `/lib/auth.server.ts`:
  ```typescript
  function getJWTSecret(): string {
    const secret = process.env.JWT_SECRET
    if (!secret) {
      throw new Error('JWT_SECRET environment variable is not set')
    }
    // TODO: Add length check (if secret.length < 32)
    return secret
  }
  ```
- Middleware validation in `/middleware.ts` (Edge Runtime):
  ```typescript
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is not set')
  }
  ```

**Tested in:**

- `/lib/__tests__/auth.server.test.ts` (unit tests for session encoding/decoding)
- Startup test (TODO): Add validation on server start to check secret length

**Risk if violated:**

- **CRITICAL SECURITY**: JWT token brute-forcing (weak secrets can be cracked)
- Session hijacking: Attacker forges valid admin session tokens
- Account takeover: Attacker gains SUPER_ADMIN access
- Data breach: Full database access via forged sessions
- Israeli PPL compliance violation: Unauthorized access to personal data

**Prevention:**

- Generate secure secret: `openssl rand -base64 32` (produces 44-char string)
- Railway deployment checklist: Verify `JWT_SECRET` is set before first deploy
- Startup validation (TODO): Add `if (secret.length < 32) throw new Error()`
- Documentation: Add to `/.env.example` with generation instructions
- Security audit: Check Railway environment variables monthly

---

## ASSUMPTION #6: Mock Payment Disabled in Production

**Rule:** `YAADPAY_MOCK_MODE` environment variable MUST be "false" or undefined in production. Mock mode MUST throw fatal error if enabled in `NODE_ENV=production`.

**Enforced by:**

- Runtime check in `/lib/yaadpay.ts`:

  ```typescript
  const mockMode = process.env.YAADPAY_MOCK_MODE === 'true'

  if (process.env.NODE_ENV === 'production' && mockMode) {
    console.error('FATAL: YAADPAY_MOCK_MODE is TRUE in production!')
    console.error('This allows free registrations without payment.')
    console.error('Remove YAADPAY_MOCK_MODE from production environment IMMEDIATELY.')
    throw new Error('SECURITY VIOLATION: Mock payment mode cannot be enabled in production.')
  }
  ```

- Railway deployment check: Environment variable review before deploy

**Tested in:**

- Manual verification: Check Railway environment variables
- Deployment checklist: "YAADPAY_MOCK_MODE removed from production?"
- Integration test (TODO): Test that production build throws error if mock mode enabled

**Risk if violated:**

- **CRITICAL FINANCIAL**: Complete revenue loss (all payments bypass gateway)
- Users receive confirmation codes and QR codes without paying
- No audit trail: Payment records show "COMPLETED" but no money received
- YaadPay integration never tested in production (broken real payments)
- Business impact: Event organizers lose thousands of ILS per event

**Prevention:**

- Railway environment variable naming: Use `YAADPAY_MOCK_MODE_DEV` (won't match "true" check)
- Pre-deploy script: `if grep -q "YAADPAY_MOCK_MODE" .env.production; then exit 1; fi`
- Monitoring: Alert if payment callback success rate is 100% (suspicious)
- Monthly audit: Review Railway environment variables for mock mode

---

## ASSUMPTION #7: Session Updated After schoolId Changes

**Rule:** When `admin.schoolId` changes (e.g., after onboarding), the session cookie MUST be updated immediately. Session contains schoolId for multi-tenant isolation.

**Enforced by:**

- Onboarding API updates session after school creation:

  ```typescript
  const session: AuthSession = {
    ...admin,
    schoolId: school.id,
    schoolName: school.name,
  }

  const response = NextResponse.redirect('/admin/dashboard')
  response.cookies.set('admin_session', encodeSession(session), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  })
  return response
  ```

**Tested in:**

- `/lib/__tests__/auth.server.test.ts` (unit tests for session encoding)
- E2E test (TODO): "should update session after completing onboarding"

**Risk if violated:**

- Admin can't access school after onboarding (schoolId=null in session)
- Multi-tenant isolation fails (queries have no schoolId filter)
- User sees "Admin must have a school assigned" error after onboarding
- Poor UX: User must logout and re-login to access their school

**Prevention:**

- Code review: Check all API routes that modify `admin.schoolId`
- Pattern: Always update session when changing `schoolId` or `role`
- Use `encodeSession()` helper (centralized session creation logic)
- E2E test: Verify dashboard loads immediately after onboarding completes

---

## ASSUMPTION #8: Hebrew Text Uses RTL Direction

**Rule:** All Hebrew text containers MUST have `dir="rtl"` attribute. Text inputs and forms for Hebrew content MUST use right-to-left layout.

**Enforced by:**

- Root layout: `<html dir="rtl" lang="he">`
- TailwindCSS RTL utilities: `flex-row-reverse`, `text-right`
- Component design: Hebrew labels positioned to the right of inputs
- Visual testing (manual): Review all pages at 375px width (iPhone SE)

**Tested in:**

- Visual regression tests (TODO): Capture screenshots of Hebrew UI
- Playwright test (TODO): "should display Hebrew text right-aligned"
- Manual testing: Test on iOS Safari (Safari handles RTL differently)

**Risk if violated:**

- Text alignment issues: Hebrew text appears left-aligned (wrong)
- Poor UX: Forms look broken (labels on wrong side)
- Readability issues: Sentences read backwards
- Professional appearance: System looks unprofessional
- Accessibility: Screen readers may read text in wrong order

**Prevention:**

- Component library: Create `<HebrewText>` wrapper with `dir="rtl"` default
- Design system: Document RTL patterns in UI kit
- Visual regression: Screenshot every page on PR (Percy, Chromatic)
- Code review: Check for `dir="rtl"` in new Hebrew components

---

## ASSUMPTION #9: Confirmation Codes Are Globally Unique

**Rule:** `registration.confirmationCode` MUST be globally unique (not just per-event). Uses 6-character base36 code with cryptographic randomness.

**Enforced by:**

- Database unique constraint: `@@unique` on `confirmationCode` field
- Code generation in `/lib/utils.ts`:
  ```typescript
  export function generateConfirmationCode(): string {
    const bytes = randomBytes(4) // 32 bits of entropy
    const num = bytes.readUInt32BE(0)
    return num.toString(36).substring(0, 6).toUpperCase().padStart(6, '0')
  }
  ```
- Prisma will throw on duplicate (rare: 1 in 2 billion collision rate)
- Retry logic (TODO): Catch unique constraint error and regenerate

**Tested in:**

- Database schema test (TODO): "should enforce unique constraint on confirmationCode"
- Load test (TODO): Generate 1 million codes, verify no duplicates

**Risk if violated:**

- Registration lookup failures: Multiple registrations with same code
- Check-in errors: QR code matches multiple registrations
- Security issue: User can access other people's registrations
- Customer confusion: "Your confirmation code is A3F9B2" (but which event?)

**Prevention:**

- Increase entropy (TODO): Use 5 bytes (40 bits) instead of 4 bytes
- Retry logic on collision: Catch `P2002` error code, regenerate, retry
- Monitoring: Alert on duplicate confirmationCode errors
- Database index: Unique index on `confirmationCode` (already exists)

---

## ASSUMPTION #10: YaadPay Callback Signatures Validated

**Rule:** ALL YaadPay payment callbacks MUST validate HMAC-SHA256 signature before processing. Unsigned callbacks MUST be rejected immediately.

**Enforced by:**

- Signature validation in `/lib/yaadpay.ts`:

  ```typescript
  function validateSignature(params: YaadPayCallback, secret: string): boolean {
    const dataToSign = `${params.Order}${params.Amount}${params.CCode}`
    const expectedSignature = crypto.createHmac('sha256', secret).update(dataToSign).digest('hex')

    return params.signature === expectedSignature
  }
  ```

- Callback handler rejects invalid signatures:
  ```typescript
  if (!signature || !isValidSignature) {
    console.error('[YaadPay] Invalid signature - potential tampering detected')
    return {
      isValid: false,
      errorMessage: 'Invalid signature - request rejected',
    }
  }
  ```

**Tested in:**

- Integration test (TODO): "should reject callback with invalid signature"
- Integration test (TODO): "should reject callback with missing signature"
- Penetration test (TODO): Attempt payment tampering (change amount in callback)

**Risk if violated:**

- **CRITICAL SECURITY**: Payment tampering (attacker changes amount in callback)
- Attacker could register for 100 ILS event but pay 1 ILS (YaadPay processes 1 ILS)
- Callback claims "100 ILS paid" but YaadPay only received 1 ILS
- Revenue loss: Event organizers lose money on every tampered registration
- Fraud detection failure: No audit trail shows tampering occurred

**Prevention:**

- MANDATORY signature validation (never skip, even in test mode)
- Secret rotation: Change `YAADPAY_API_SECRET` quarterly
- Monitoring: Alert on rejected callbacks (potential attack)
- Logging: Log full callback data for forensic analysis
- Israeli PPL compliance: Report security incidents to Privacy Protection Authority

---

## ASSUMPTION #11: Sessions Expire After 7 Days

**Rule:** Admin sessions MUST expire after 7 days from login. No automatic renewal. User MUST re-login after expiration.

**Enforced by:**

- JWT expiration in `/lib/auth.server.ts`:

  ```typescript
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

  export function encodeSession(session: AuthSession): string {
    return jwt.sign(session, getJWTSecret(), {
      expiresIn: '7d',
      algorithm: 'HS256',
    })
  }
  ```

- Cookie max-age set to 7 days:
  ```typescript
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {
    maxAge: SESSION_DURATION / 1000, // Convert to seconds
  })
  ```
- Middleware validates JWT expiration on every request (`jwtVerify` checks `exp` claim)

**Tested in:**

- Unit test (TODO): "should reject expired session tokens"
- E2E test (TODO): "should redirect to login after session expires"

**Risk if violated:**

- Sessions never expire (security risk if account compromised)
- Cookie persists forever (user stays logged in indefinitely)
- Stale school data in session (schoolName changed but session has old value)
- Compliance issue: GDPR requires session expiration for inactive users

**Prevention:**

- Configurable session duration (environment variable: `SESSION_DURATION_DAYS`)
- Automatic logout warning (TODO): Show "Session expires in 1 hour" notification
- Session refresh option (TODO): Extend session on user activity
- Monitoring: Track average session duration (detect anomalies)

---

## ASSUMPTION #12: spotsReserved Never Decremented Directly

**Rule:** `event.spotsReserved` counter MUST NEVER be decremented directly. Only increment on CONFIRMED registration. Cancellations do NOT decrement (soft delete pattern).

**Enforced by:**

- Registration cancellation sets `status='CANCELLED'` but keeps `spotsReserved`:
  ```typescript
  // CORRECT - Mark as cancelled, don't decrement counter
  await prisma.registration.update({
    where: { id: registrationId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancellationReason: reason,
    },
  })
  // event.spotsReserved remains unchanged
  ```
- Manual admin action to free spot (TODO): Admin must manually assign from waitlist
- No database trigger allows decrement (PostgreSQL constraint: TODO)

**Tested in:**

- Unit test (TODO): "cancellation does not decrement spotsReserved"
- E2E test: "cancelled registration remains in database with CANCELLED status"
- `/tests/critical/atomic-capacity.spec.ts` (capacity enforcement tests)

**Risk if violated:**

- Race conditions: Decrement conflicts with concurrent registration increments
- Incorrect capacity: `spotsReserved` becomes negative or inconsistent
- Audit trail lost: Can't track how many spots were originally reserved
- Waitlist confusion: System thinks spots available but they're not
- Business logic failure: Capacity calculations break down

**Prevention:**

- Code review: Flag any `{ decrement: }` syntax on `spotsReserved`
- ESLint rule (TODO): Detect `spotsReserved: { decrement }` in API routes
- Documentation: Add comment above `spotsReserved` field in schema:
  ```prisma
  spotsReserved Int @default(0) // NEVER decrement - increment only!
  ```
- Database migration (TODO): Add CHECK constraint `spotsReserved >= 0`

---

## How to Use This Document

### For Developers

**Before writing code:**

1. Search this document for assumptions related to your feature
2. Understand the constraints and risks
3. Follow the enforced patterns (don't reinvent)

**When changing assumptions:**

1. Update this document FIRST (document new behavior)
2. Add behavior lock tests to prevent regressions
3. Update all dependent code
4. Add migration guide if breaking change

**During code review:**

1. Check if new code violates any assumptions
2. Suggest adding new assumptions if code has implicit behaviors
3. Verify prevention measures are in place

### For Onboarding

**Day 1:** Read assumptions #1-4 (critical security and business logic)
**Day 2:** Read assumptions #5-8 (authentication and UX)
**Day 3:** Read assumptions #9-12 (data integrity and payments)

### When Debugging

1. Search this document for keywords related to the bug
2. Check if assumption was violated
3. Review "Risk if violated" section to understand impact
4. Apply "Prevention" measures to avoid recurrence

### Monthly Maintenance

**Review checklist:**

- [ ] Are all assumptions still valid? (Mark outdated ones)
- [ ] Were new assumptions discovered this month? (Add them)
- [ ] Do all assumptions have tests? (Add missing tests)
- [ ] Are prevention measures working? (Check monitoring alerts)

---

## Related Documentation

- [`/CLAUDE.md`](/Users/michaelmishayev/Desktop/Projects/ticketsSchool/CLAUDE.md) - Complete development guide
- [`/prisma/schema.prisma`](/Users/michaelmishayev/Desktop/Projects/ticketsSchool/prisma/schema.prisma) - Database schema and constraints
- [`/lib/auth.server.ts`](/Users/michaelmishayev/Desktop/Projects/ticketsSchool/lib/auth.server.ts) - Authentication patterns
- [`/tests/README.md`](/Users/michaelmishayev/Desktop/Projects/ticketsSchool/tests/README.md) - Testing guide
- [`/docs/infrastructure/ASSUMPTIONS.md`](/Users/michaelmishayev/Desktop/Projects/ticketsSchool/docs/infrastructure/ASSUMPTIONS.md) - Infrastructure assumptions (existing document)

---

## Maintenance Log

| Date       | Author      | Changes                                       |
| ---------- | ----------- | --------------------------------------------- |
| 2026-01-12 | Claude Code | Initial creation with 12 critical assumptions |

---

**⚠️ CRITICAL:** This document is part of the security audit trail. Any changes to assumptions MUST be reviewed by senior developer and reflected in tests.

**Next Review Date:** 2026-02-12 (monthly)
