# aiRules.md Implementation Action Plan

**Status:** 🔴 7 Critical Gaps Identified
**Priority:** HIGH - Fix test pyramid to reduce CI time from 35min to 5min
**Created:** 2026-01-12
**Based on:** `/docs/development/aiRules.md` (20 Universal Principles)

---

## 📊 Current vs. Recommended State

| Metric                   | Current       | Recommended      | Status      |
| ------------------------ | ------------- | ---------------- | ----------- |
| **Unit Tests**           | 5 (7%)        | 50-70 (70%)      | 🔴 CRITICAL |
| **Integration Tests**    | 0 (0%)        | 15-20 (20%)      | 🔴 MISSING  |
| **E2E Tests**            | 71 (93%)      | 7-10 (10%)       | 🔴 TOO MANY |
| **Visual Regression**    | 0             | 5-10 key pages   | 🔴 MISSING  |
| **Golden Path Canaries** | ✅ 2 (hourly) | 3-5 (hourly)     | 🟡 GOOD     |
| **Bug Fix Protocol**     | ❌ Informal   | 6-field template | 🔴 MISSING  |
| **Assumptions Doc**      | ❌ None       | Documented       | 🔴 MISSING  |
| **API Contract Tests**   | ❌ None       | Snapshot tests   | 🔴 MISSING  |

---

## 🚨 CRITICAL ISSUE: Inverted Test Pyramid

### The Problem

```
Your Current Pyramid (ANTI-PATTERN):
        /\
       /E2E\      71 tests (93%) ❌ SLOW (35 min CI)
      /──────\
     /  Unit  \   5 tests (7%) ❌ LOW COVERAGE
    /──────────\

Impact:
- CI takes 35 minutes (71 tests × ~30 sec each)
- Developers bypass CI ("too slow")
- UI changes break 20+ tests at once
- Business logic barely tested (only 5 unit tests)
- High maintenance cost (E2E tests constantly break)
```

### The Solution

```
Recommended Pyramid:
        /\
       /E2E\      10 tests (10%) ✅ FAST (5 min)
      /──────\
     / Intgr.\ 20 tests (20%) ✅ RELIABLE (3 min)
    /──────────\
   /  Unit Tests \ 70 tests (70%) ✅ INSTANT (1 min)
  /──────────────\

Benefits:
- CI finishes in 9 minutes (down from 35 min)
- 80%+ code coverage (up from ~20%)
- Fewer brittle tests (E2E only for critical flows)
- Faster feedback loop (unit tests run in < 1 min)
- Lower maintenance burden
```

---

## 📋 7-Day Action Plan (Copy-Paste Tasks)

### **Day 1: Fix Test Pyramid - Unit Tests (PRIORITY 1)**

**Goal:** Add 20 unit tests for business logic (70% target)

**Tasks:**

- [x] Create `lib/__tests__/phone-normalization.test.ts` (15 tests)
- [x] Create `lib/__tests__/capacity-validation.test.ts` (20 tests)
- [ ] Create `lib/__tests__/payment-calculation.test.ts` (12 tests)
- [ ] Create `lib/__tests__/date-formatting.test.ts` (10 tests)
- [ ] Create `lib/__tests__/validation-helpers.test.ts` (15 tests)

**Expected Coverage After Day 1:**

- Unit tests: 72 (target achieved ✅)
- CI time for unit tests: < 1 minute

---

### **Day 2: Add Integration Tests (API + DB)**

**Goal:** Add 20 integration tests for API endpoints

**Tasks:**

- [ ] Create `lib/__tests__/api/event-creation.test.ts` (5 tests)
- [ ] Create `lib/__tests__/api/registration.test.ts` (5 tests)
- [ ] Create `lib/__tests__/api/payment.test.ts` (5 tests)
- [ ] Create `lib/__tests__/api/school-management.test.ts` (5 tests)

**Example Test:**

```typescript
// lib/__tests__/api/event-creation.test.ts
import { describe, test, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'

describe('Event Creation API', () => {
  beforeEach(async () => {
    await prisma.event.deleteMany() // Clean slate
  })

  test('creates event with valid data', async () => {
    const eventData = {
      name: 'Test Event',
      capacity: 100,
      schoolId: 'school-123',
    }

    const event = await prisma.event.create({ data: eventData })

    expect(event.id).toBeDefined()
    expect(event.name).toBe('Test Event')
    expect(event.capacity).toBe(100)
    expect(event.spotsReserved).toBe(0) // Default value
  })

  test('REJECTS event with negative capacity', async () => {
    const eventData = {
      name: 'Invalid Event',
      capacity: -10, // Invalid
      schoolId: 'school-123',
    }

    await expect(prisma.event.create({ data: eventData })).rejects.toThrow(/check constraint/i)
  })
})
```

**Expected Coverage After Day 2:**

- Integration tests: 20
- CI time for integration tests: 2-3 minutes

---

### **Day 3: Reduce E2E Tests (Remove Redundant Tests)**

**Goal:** Reduce E2E tests from 71 to 10-15 (keep only CRITICAL user flows)

**Critical E2E Tests to KEEP:**

1. ✅ `04-public-registration-p0.spec.ts` - User registration flow
2. ✅ `09-payment-regression-p0.spec.ts` - Payment flow
3. ✅ `08-check-in-system-p0.spec.ts` - Check-in flow
4. ✅ `08-mobile-navigation-p0.spec.ts` - Mobile navigation
5. ✅ `golden-path/admin-canary.spec.ts` - Admin login
6. ✅ `golden-path/registration-canary.spec.ts` - Public registration
7. ✅ `12-admin-logo-upload-p0.spec.ts` - File upload
8. [ ] Create `event-creation-e2e.spec.ts` - Admin creates event
9. [ ] Create `table-management-e2e.spec.ts` - Table CRUD operations
10. [ ] Create `team-invitation-e2e.spec.ts` - Team management

**E2E Tests to DELETE or CONVERT to Unit/Integration:**

- ❌ `verify-navigation-works.spec.ts` → Convert to unit test
- ❌ `signup-section-screenshot.spec.ts` → Delete (redundant)
- ❌ `real-user-click-test.spec.ts` → Delete (redundant)
- ❌ `qa-full-app.spec.ts` → Delete (too broad)
- ❌ `hero-with-badge.spec.ts` → Delete (UI-only, no business logic)
- ❌ `step2-signup-box.spec.ts` → Convert to integration test
- ❌ `event-flow.spec.ts` → Already covered by 04-public-registration
- ❌ `simple-working-e2e.spec.ts` → Delete (test test)
- ❌ `ultra-debug-test.spec.ts` → Delete (debug artifact)
- ❌ `landing-inspect.spec.ts` → Delete (manual inspection)
- ❌ `purple-box-layout.spec.ts` → Convert to visual regression
- ❌ `final-test-with-cache-bust.spec.ts` → Delete (redundant)

**Commands:**

```bash
# Archive non-critical E2E tests
mkdir tests/archived-e2e
mv tests/verify-navigation-works.spec.ts tests/archived-e2e/
mv tests/signup-section-screenshot.spec.ts tests/archived-e2e/
# ... (move 50+ redundant tests)

# Keep only critical E2E tests in tests/suites/
# Result: 10-15 E2E tests instead of 71
```

**Expected Result After Day 3:**

- E2E tests: 10-15 (down from 71)
- CI time for E2E tests: 3-5 minutes (down from 35 min)

---

### **Day 4: Add Visual Regression Testing**

**Goal:** Add screenshot-based testing for critical UI components

**Install Percy (Free Tier: 5,000 screenshots/month):**

```bash
npm install --save-dev @percy/cli @percy/playwright
```

**Create Visual Regression Tests:**

```typescript
// tests/visual/homepage.visual.spec.ts
import { test } from '@playwright/test'
import percySnapshot from '@percy/playwright'

test('Homepage - Desktop', async ({ page }) => {
  await page.goto('/')
  await percySnapshot(page, 'Homepage - Desktop')
})

test('Homepage - Mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/')
  await percySnapshot(page, 'Homepage - Mobile')
})

test('Registration Form - Desktop', async ({ page }) => {
  await page.goto('/p/test-school/test-event')
  await percySnapshot(page, 'Registration Form - Desktop')
})

test('Admin Dashboard - Desktop', async ({ page }) => {
  // Login as admin
  await page.goto('/admin/login')
  await page.fill('[name="email"]', 'admin@test.com')
  await page.fill('[name="password"]', 'password123')
  await page.click('[type="submit"]')

  await percySnapshot(page, 'Admin Dashboard - Desktop')
})
```

**Configure Percy in CI:**

```yaml
# .github/workflows/visual-regression.yml
name: Visual Regression Tests

on: [pull_request]

jobs:
  visual-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps chromium

      # Run visual tests
      - run: npx percy exec -- npx playwright test tests/visual/
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
```

**Critical Pages to Test:**

- [ ] Homepage (desktop + mobile)
- [ ] Public registration form
- [ ] Admin dashboard
- [ ] Admin login page
- [ ] Event list page
- [ ] Payment form
- [ ] Check-in QR code page

**Expected Coverage After Day 4:**

- Visual regression tests: 10 (key pages)
- Auto-detects UI regressions on every PR

---

### **Day 5: Document Assumptions (Principle #17)**

**Goal:** Create formal assumptions ledger

**Create File:**

```bash
touch docs/assumptions.md
```

**Template:**

````markdown
# System Assumptions (Living Document)

**Purpose:** Document ALL assumptions. Test them explicitly.

---

## ASSUMPTION #1: Multi-Tenant Isolation via schoolId

**Rule:** ALL database queries MUST filter by `schoolId` for non-SUPER_ADMIN users.

**Enforced by:**

- JWT session contains `schoolId`
- API routes check `admin.role !== 'SUPER_ADMIN' && admin.schoolId`
- Middleware validates session before API access

**Tested in:**

- `lib/__tests__/auth.server.test.ts`
- `lib/__tests__/prisma-guards.test.ts`

**Risk if violated:**

- Data leakage across schools (CRITICAL SECURITY BUG)
- User from School A sees data from School B

**Prevention:**

- Code review checklist: "Does this query filter by schoolId?"
- ESLint rule: `no-unfiltered-prisma-queries` (TODO)

---

## ASSUMPTION #2: Phone Numbers in Israeli Format (10 digits, starting with 0)

**Rule:** All phone numbers stored as `0XXXXXXXXX` (10 digits, no formatting)

**Enforced by:**

- `normalizePhone()` function in registration
- Database CHECK constraint: `phone ~ '^0\\d{9}$'`

**Tested in:**

- `lib/__tests__/phone-normalization.test.ts`

**Risk if violated:**

- SMS delivery failures
- Duplicate registrations (same user, different formats)

**Prevention:**

- Always use `normalizePhone()` before DB insert
- Database constraint blocks invalid formats

---

## ASSUMPTION #3: Event Capacity Enforced Atomically

**Rule:** `spotsReserved` NEVER exceeds `capacity` for CONFIRMED registrations.

**Enforced by:**

- Prisma transaction: `event.update({ data: { spotsReserved: { increment: N } } })`
- Database CHECK constraint: `spotsReserved <= capacity`

**Tested in:**

- `lib/__tests__/capacity-validation.test.ts`
- `tests/suites/04-public-registration-p0.spec.ts` (E2E race condition test)

**Risk if violated:**

- Double-booking (overselling event)
- Revenue loss (cancellations, refunds)
- User trust erosion

**Prevention:**

- ALWAYS use transaction for registration
- NEVER decrement `spotsReserved` directly (use CANCELLED status instead)

---

## ASSUMPTION #4: Payment Amounts in Cents (not Dollars)

**Rule:** All monetary amounts stored as **cents** (integers, not floats).

**Enforced by:**

- Prisma schema: `amount Int` (not `Decimal`)
- YaadPay API expects cents

**Tested in:**

- `lib/__tests__/payment-calculation.test.ts` (TODO)

**Risk if violated:**

- Floating-point precision errors (e.g., $0.01 difference = lost revenue)
- Incorrect charges (user expects $10.00, charged $10.99)

**Prevention:**

- Always multiply dollar amounts by 100 before storing
- Always divide by 100 when displaying to users

---

## ASSUMPTION #5: JWT Secret is 32+ Bytes

**Rule:** `JWT_SECRET` MUST be 32+ characters for security.

**Enforced by:**

- Startup validation: `if (JWT_SECRET.length < 32) throw new Error()`
- Environment variable check in `lib/auth.server.ts`

**Tested in:**

- `lib/__tests__/auth.server.test.ts`

**Risk if violated:**

- JWT tokens can be brute-forced
- Session hijacking (attackers forge tokens)

**Prevention:**

- Railway/production: Set `JWT_SECRET` to output of `openssl rand -base64 32`
- Never use default/weak secrets

---

## ASSUMPTION #6: YAADPAY_MOCK_MODE="false" in Production

**Rule:** Mock mode MUST be disabled in production.

**Enforced by:**

- Environment variable check in payment API
- Warning logged if `YAADPAY_MOCK_MODE !== "false"` in production

**Tested in:**

- Manual verification during deployment
- TODO: Add automated check in CI

**Risk if violated:**

- No real payments processed (users think they paid, but didn't)
- Revenue loss

**Prevention:**

- Production deployment checklist: Verify `YAADPAY_MOCK_MODE="false"`
- Railway env var validation

---

## How to Use This Document

1. **Before implementing a feature:** Check if assumptions are affected
2. **When bugs occur:** Add new assumptions based on root cause
3. **During code review:** Verify assumptions are not violated
4. **In tests:** Reference assumption numbers in test descriptions

**Example Test:**

```typescript
test('ASSUMPTION #1: Filters events by schoolId for non-super-admin', async () => {
  // Test implementation
})
```
````

---

**Last Updated:** 2026-01-12
**Maintained by:** Engineering Team
**Review Frequency:** Monthly

````

**Expected Coverage After Day 5:**
- All critical assumptions documented
- Tests reference assumption numbers
- Code reviews check assumption violations

---

### **Day 6: Implement Bug Fix Protocol (Principle #2)**

**Goal:** Every bug has 6 mandatory fields

**Update Bug Template:**
```bash
# Edit docs/bugs/bugs.md to add template
````

**6-Field Bug Fix Protocol:**

```markdown
## Bug Fix Template (MANDATORY - All 6 Fields Required)

### Bug ID: #[NUMBER]

### Title: [Brief Description]

### Reported: [YYYY-MM-DD HH:MM UTC]

### Fixed: [YYYY-MM-DD HH:MM UTC]

### Severity: [Low | Medium | High | Critical]

---

### 1. ✅ Repro Steps (Exact steps to reproduce)

1. Navigate to [URL]
2. Click [Button]
3. Expected: [Expected behavior]
4. Actual: [Actual behavior]

---

### 2. ✅ Root Cause (WHY it happened, not just WHAT)

**Analysis:**

- [Explain the underlying cause]
- [Why did the code allow this?]
- [Was validation missing? Logic error? Race condition?]

**Example:**
```

Frontend validation checked price > 0, but backend did NOT validate
total amount. Attacker bypassed frontend validation using browser DevTools.

````

---

### 3. ✅ Regression Test (MUST fail before fix, pass after fix)
**Test File:** `[path/to/test.ts]`
**Line:** `[Line number]`

**Test Code:**
```typescript
test('REGRESSION: Bug #[NUMBER] - [Description]', async () => {
  // This test FAILED before the fix
  // This test PASSES after the fix
  const result = await problematicFunction()
  expect(result).toBe(expected)
})
````

**Verification:**

```bash
# Before fix (test FAILS):
npm test -- [test-file]
# Output: ❌ Expected X, got Y

# After fix (test PASSES):
npm test -- [test-file]
# Output: ✅ All tests passed
```

---

### 4. ✅ Fix Summary (What changed: code/config/data)

**Files Modified:**

- `[file1.ts]` - [Description of change]
- `[file2.ts]` - [Description of change]

**Changes:**

```typescript
// BEFORE (buggy code):
if (data.total > 0) {
  return createOrder(data)
}

// AFTER (fixed code):
if (!data.total || data.total <= 0) {
  throw new ValidationError('Order total must be greater than zero')
}
return createOrder(data)
```

---

### 5. ✅ Prevention Rule (How to avoid this pattern forever)

**Actions Taken:**

- [ ] Added regression test: `[test-file:line]`
- [ ] Updated validation schema (Zod): `total: z.number().min(0.01)`
- [ ] Added database constraint: `CHECK (total > 0)`
- [ ] Documented in API spec: "Minimum order total = $0.01"
- [ ] Added to code review checklist: "Validate money amounts server-side"
- [ ] Added ESLint rule (if applicable): `no-client-only-validation`

**Documentation Updates:**

- Updated `docs/api/orders.md` with validation rules
- Added to `docs/assumptions.md`: ASSUMPTION #X

---

### 6. ✅ Git Commit Hash (Traceability for audits/rollbacks)

**Commit:** `[abc123def456]`
**Branch:** `[main | development | hotfix/bug-123]`
**PR:** `#[PR number]`

**Commit Message:**

```
fix(orders): reject zero-total orders (security) [Bug #123]

- Root cause: Missing backend validation for order total
- Fix: Add validation in createOrder() - reject if total <= 0
- Security: Prevents revenue loss from tampered frontend
- Test: lib/__tests__/orders/validation.test.ts:67
- Prevention: Added to Zod schema, documented in API spec

Regression test ensures this security bug can NEVER recur.

Closes #123
```

---

## Example Complete Bug Fix

### Bug ID: #456

### Title: Orders accepted with $0 total

### Reported: 2026-01-12 14:30 UTC

### Fixed: 2026-01-12 16:15 UTC

### Severity: High (revenue loss, security)

---

### 1. ✅ Repro Steps

1. Navigate to `/products`
2. Add product to cart
3. Open browser DevTools → Console
4. Run: `document.querySelector('[name="total"]').value = 0`
5. Submit order
6. Expected: Validation error "Order total must be greater than zero"
7. Actual: Order created successfully with $0 total

---

### 2. ✅ Root Cause

Frontend validation checked `price > 0` for individual items, but backend did NOT validate
the final `total` amount. Attacker bypassed frontend validation using browser DevTools
and sent `total: 0` directly to the API.

This is a **client-side validation bypass vulnerability** (CWE-602).

---

### 3. ✅ Regression Test

**Test File:** `lib/__tests__/orders/validation.test.ts`
**Line:** 67

```typescript
describe('Order Validation - Bug #456', () => {
  test('REJECTS order with zero total', async () => {
    const order = {
      items: [{ productId: 'prod1', quantity: 1, price: 10 }],
      total: 0, // Attacker tampered with this
    }

    await expect(createOrder(order)).rejects.toThrow('Order total must be greater than zero')
  })
})
```

**Verification:**

```bash
# Before fix:
npm test -- lib/__tests__/orders/validation.test.ts
# Output: ❌ Expected error, but order was created

# After fix:
npm test -- lib/__tests__/orders/validation.test.ts
# Output: ✅ All tests passed
```

---

### 4. ✅ Fix Summary

**Files Modified:**

- `app/api/orders/create/route.ts` - Added backend validation

**Changes:**

```typescript
// BEFORE (buggy code):
export async function POST(request: Request) {
  const data = await request.json()
  const order = await db.orders.create({ data }) // No validation!
  return NextResponse.json({ order })
}

// AFTER (fixed code):
import { z } from 'zod'

const CreateOrderSchema = z.object({
  total: z.number().min(0.01, 'Order total must be greater than zero'),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      price: z.number().min(0),
    })
  ),
})

export async function POST(request: Request) {
  const data = await request.json()

  // Validate with Zod schema
  const validated = CreateOrderSchema.parse(data)

  const order = await db.orders.create({ data: validated })
  return NextResponse.json({ order })
}
```

---

### 5. ✅ Prevention Rule

**Actions Taken:**

- [x] Added regression test: `lib/__tests__/orders/validation.test.ts:67`
- [x] Updated validation schema (Zod): `total: z.number().min(0.01)`
- [x] Added to API spec: "Minimum order total = $0.01"
- [x] Added to code review checklist: "Always validate money amounts server-side"
- [x] Documented in `docs/assumptions.md`: ASSUMPTION #7 - Order totals >= $0.01

**Future Prevention:**

- ESLint rule: `@typescript-eslint/no-unsafe-assignment` (catches missing validation)
- Security audit: All POST/PUT endpoints must validate input with Zod schemas

---

### 6. ✅ Git Commit Hash

**Commit:** `a3f8d2b7c1e4f9d2a8b3c5e7f1a2d4b6c8e9f1a3`
**Branch:** `development`
**PR:** `#789`

**Commit Message:**

```
fix(orders): reject zero-total orders (security) [Bug #456]

- Root cause: Missing backend validation for order total
- Fix: Add Zod schema validation in createOrder() - reject if total <= 0
- Security: Prevents revenue loss from tampered frontend (CWE-602)
- Test: lib/__tests__/orders/validation.test.ts:67
- Prevention: Added to Zod schema, documented in API spec, code review checklist

Regression test ensures this security bug can NEVER recur.

Closes #456
```

---

**End of Template**

````

**Expected Coverage After Day 6:**
- All future bugs follow 6-field template
- Regression tests prevent recurring bugs
- Git history fully traceable

---

### **Day 7: Add API Contract Tests (Principle #10)**

**Goal:** Lock API response shapes with snapshot tests

**Create Contract Tests:**
```typescript
// lib/__tests__/api-contracts/events.contract.test.ts
import { describe, test, expect } from 'vitest'

describe('API Contracts - Events', () => {
  test('GET /api/events/:id returns expected shape (BEHAVIOR LOCK)', async () => {
    const event = await prisma.event.create({
      data: {
        name: 'Test Event',
        capacity: 100,
        schoolId: 'school-123'
      }
    })

    const response = await fetch(`/api/events/${event.id}`)
    const data = await response.json()

    // Snapshot test: ANY change to object shape breaks this test
    expect(data).toMatchSnapshot()

    // Explicit shape validation
    expect(data).toHaveProperty('id')
    expect(data).toHaveProperty('name')
    expect(data).toHaveProperty('capacity')
    expect(data).toHaveProperty('spotsReserved')
    expect(data).toHaveProperty('schoolId')
    expect(data).toHaveProperty('createdAt')
    expect(data).toHaveProperty('updatedAt')

    // Type validation
    expect(typeof data.id).toBe('string')
    expect(typeof data.name).toBe('string')
    expect(typeof data.capacity).toBe('number')
    expect(typeof data.spotsReserved).toBe('number')
  })

  test('GET /api/events returns array of events (BEHAVIOR LOCK)', async () => {
    const response = await fetch('/api/events')
    const data = await response.json()

    expect(Array.isArray(data.events)).toBe(true)
    expect(data).toMatchSnapshot()
  })

  test('POST /api/events creates event (BEHAVIOR LOCK)', async () => {
    const eventData = {
      name: 'New Event',
      capacity: 50,
      schoolId: 'school-123'
    }

    const response = await fetch('/api/events', {
      method: 'POST',
      body: JSON.stringify(eventData)
    })

    const data = await response.json()

    // Snapshot ensures response shape never changes silently
    expect(data).toMatchSnapshot()
  })
})
````

**Expected Coverage After Day 7:**

- All API endpoints have contract tests
- Breaking changes caught immediately in CI
- API versioning required for intentional changes

---

## 🎯 Success Metrics (After 7 Days)

| Metric                     | Before   | After 7 Days     | Improvement                |
| -------------------------- | -------- | ---------------- | -------------------------- |
| **CI Time**                | 35 min   | 9 min            | 74% faster                 |
| **Unit Tests**             | 5        | 72               | 14x increase               |
| **Integration Tests**      | 0        | 20               | New capability             |
| **E2E Tests**              | 71       | 10-15            | 80% reduction              |
| **Visual Regression**      | 0        | 10 pages         | New capability             |
| **Code Coverage**          | ~20%     | 80%+             | 4x increase                |
| **Bug Fix Protocol**       | Informal | 6-field template | Standardized               |
| **Assumptions Documented** | 0        | 6+               | Risk mitigation            |
| **API Contract Tests**     | 0        | 15+              | Breaking change protection |

---

## 📊 Long-Term Benefits (aiRules.md Compliance)

### Reliability

- **Regression bugs:** < 1% (down from ~5%)
- **Mean time to detect (MTTD):** < 1 hour (golden path canaries)
- **Mean time to recovery (MTTR):** < 30 minutes (fast CI, good tests)

### Velocity

- **Deploy frequency:** 10+ times/day (fast CI enables continuous deployment)
- **Lead time for changes:** < 1 day (fast feedback loop)
- **Change failure rate:** < 5% (comprehensive testing)

### Quality

- **Test coverage:** 80%+ (100% for auth/payment/validation)
- **Zero flaky tests** (already achieved ✅)
- **PR merge time:** < 4 hours (fast CI, clear test failures)

---

## 🚀 Next Steps

1. **Commit this plan:**

   ```bash
   git add docs/development/AIRULES_ACTION_PLAN.md
   git commit -m "docs: add aiRules.md implementation action plan"
   ```

2. **Start Day 1 tasks:**

   ```bash
   # Run new unit tests
   npm test lib/__tests__/phone-normalization.test.ts
   npm test lib/__tests__/capacity-validation.test.ts
   ```

3. **Review progress weekly:**
   - Day 7: Review metrics vs. targets
   - Day 14: Adjust plan based on learnings
   - Day 21: Finalize test pyramid
   - Day 30: Full aiRules.md compliance

---

**Questions? Check:**

- `/docs/development/aiRules.md` - 20 Universal Principles
- `/docs/bugs/bugs.md` - Current bug tracking
- `/docs/assumptions.md` - System assumptions (create on Day 5)

**Status:** 🟢 READY TO EXECUTE
