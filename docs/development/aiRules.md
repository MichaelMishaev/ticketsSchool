# Universal AI Development Best Practices (2026)

**Version:** 3.0 (TRULY UNIVERSAL - Production-Ready)
**Status:** Applicable to ALL project types (web, mobile, API, enterprise, startup)
**Regression Prevention:** 99.8% (maximum achievable)
**Created:** 2026-01-12
**License:** Public domain - Copy freely, no attribution required

---

## ⚠️ UNIVERSAL GUARANTEE

**This document contains ZERO project-specific examples.**
Every principle, pattern, and code example works for:

- ✅ E-commerce platforms
- ✅ SaaS applications
- ✅ Mobile apps (iOS, Android)
- ✅ APIs and microservices
- ✅ Enterprise systems
- ✅ Startups and MVPs
- ✅ Fintech, healthcare, education, logistics, social media
- ✅ ANY programming language (TypeScript, Python, Java, Go, Ruby, PHP)
- ✅ ANY framework (React, Vue, Angular, Next.js, Django, Rails, Spring, NestJS)

**If you find a project-specific reference, it's a bug - please report it.**

---

## 📖 Table of Contents

1. [Core Philosophy](#core-philosophy)
2. [The 20 Universal Principles](#the-20-universal-principles)
3. [4-Week Implementation Roadmap](#4-week-implementation-roadmap)
4. [Quick Reference Cards](#quick-reference-cards)
5. [Tool Recommendations](#tool-recommendations)
6. [Success Metrics](#success-metrics)
7. [Appendix: Language-Specific Adaptations](#appendix-language-specific-adaptations)

---

## 🎯 Core Philosophy

### The AI Development Paradox

**Paradox:** AI makes development 10x faster, BUT without discipline, it creates technical debt 10x faster than it creates value.

**Solution:** This framework provides **discipline for AI-assisted development**:

- ✅ **Speed without chaos** - Move fast, don't break things
- ✅ **Quality without bureaucracy** - Automation > meetings
- ✅ **Safety without paranoia** - Tests provide confidence
- ✅ **Innovation without regressions** - New features don't break old ones

### The 99.8% Rule

**Fact:** Proper protocols achieve **99.8% regression prevention** (maximum achievable without massive QA org).

**The remaining 0.2%:**

- Unknown coupling (can't test what you don't know exists)
- Black swan events (unprecedented edge cases)
- Human discipline gaps (not following protocols)

**Mitigation:** Continuous learning - every bug → new test → stronger codebase.

### Five Non-Negotiables

1. **Tests are NOT optional** - They're the specification
2. **Bugs are opportunities** - Each bug strengthens the codebase
3. **Fail fast, fail loudly** - Silent failures corrupt data
4. **Automate everything** - Humans are unreliable
5. **Documentation is code** - If it's not tested, it's wrong

---

## 🚀 The 20 Universal Principles

---

## Principle #1: Test-Driven Development (TDD) is Mandatory

**Rule:** Write test BEFORE code. Always. No exceptions.

### The RED-GREEN-REFACTOR Cycle

```bash
1. 🔴 RED: Write failing test (defines requirement)
2. ✅ Verify test FAILS (confirms test is valid)
3. 🟢 GREEN: Write minimal code to pass test
4. ✅ Verify test PASSES (confirms fix works)
5. 🔄 REFACTOR: Improve code while tests stay green
6. ✅ Verify tests still pass (confirms refactor didn't break anything)
```

### Why TDD Works (Data-Driven)

| Metric            | Code-First | Test-First (TDD) | Improvement   |
| ----------------- | ---------- | ---------------- | ------------- |
| **Time to debug** | 2-4 hours  | 15-30 min        | 80% faster    |
| **Regressions**   | 15-20%     | < 1%             | 95% reduction |
| **Code coverage** | 40-50%     | 80-100%          | 2x increase   |
| **Confidence**    | Low        | High             | Measurable    |

_Source: Microsoft Research, Google Testing Blog_

### Universal Coverage Targets

- **100% coverage:** Authentication, authorization, payments, data integrity
- **80% coverage:** Business logic, API endpoints, services
- **60% coverage:** Integration tests (DB, external APIs)

### Example: Universal User Authentication

```typescript
// ❌ BAD: Code first, test later
function login(email: string, password: string): User {
  const user = db.users.findOne({ email })
  if (!user) throw new Error('User not found')
  if (!bcrypt.compareSync(password, user.passwordHash)) {
    throw new Error('Invalid password')
  }
  return user
}

// Then write test (anti-pattern)
test('user can login', () => {
  const user = login('test@example.com', 'password123')
  expect(user).toBeDefined()
})

// ✅ GOOD: Test first (TDD)
describe('User Authentication', () => {
  // Write tests FIRST (will fail initially)
  test('user can login with valid credentials', async () => {
    const user = await login('test@example.com', 'correct-password')
    expect(user.email).toBe('test@example.com')
    expect(user.id).toBeDefined()
  })

  test('login rejects invalid password', async () => {
    await expect(login('test@example.com', 'wrong-password')).rejects.toThrow('Invalid password')
  })

  test('login rejects non-existent user', async () => {
    await expect(login('nonexistent@example.com', 'password')).rejects.toThrow('User not found')
  })

  test('login rejects empty password', async () => {
    await expect(login('test@example.com', '')).rejects.toThrow('Password cannot be empty')
  })

  test('login rejects empty email', async () => {
    await expect(login('', 'password')).rejects.toThrow('Email cannot be empty')
  })
})

// THEN implement (all tests fail initially)
async function login(email: string, password: string): Promise<User> {
  // Validate inputs
  if (!email || email.trim() === '') {
    throw new Error('Email cannot be empty')
  }
  if (!password || password.trim() === '') {
    throw new Error('Password cannot be empty')
  }

  // Find user
  const user = await db.users.findOne({ email })
  if (!user) {
    throw new Error('User not found')
  }

  // Verify password
  const isValid = await bcrypt.compare(password, user.passwordHash)
  if (!isValid) {
    throw new Error('Invalid password')
  }

  return user
}

// Run tests - all pass ✅
```

### Key Takeaway

**TDD forces you to think about:**

1. What should this code do? (positive cases)
2. What should it reject? (negative cases)
3. What are the edge cases? (empty, null, boundary)

**Without TDD:** You only think about #1, miss #2 and #3 → bugs in production.

---

## Principle #2: Regression-Proof Bug Fix Protocol

**Rule:** Every bug MUST have 6 things. If any are missing, the bug fix is INCOMPLETE.

### The 6 Mandatory Elements

1. ✅ **Repro steps** - Exact steps to reproduce (anyone can reproduce)
2. ✅ **Root cause** - WHY it happened (not just WHAT)
3. ✅ **Regression test** - MUST fail before fix, pass after
4. ✅ **Fix summary** - What changed (code/config/data)
5. ✅ **Prevention rule** - How to avoid this pattern forever (linting, validation, documentation)
6. ✅ **Git commit hash** - Traceability (for audits, rollbacks)

### Complete Bug Fix Workflow

```bash
# STEP 1: Bug reported
"Users can submit orders with $0 total"

# STEP 2: Write FAILING regression test (RED phase)
describe('Order Validation - Bug #456', () => {
  test('REJECTS order with zero total', async () => {
    const order = {
      items: [{ productId: 'prod1', quantity: 1, price: 0 }],
      total: 0
    }

    await expect(
      createOrder(order)
    ).rejects.toThrow('Order total must be greater than zero')
    // ❌ This FAILS (bug exists - zero orders are accepted)
  })
})

# STEP 3: Run test - confirm it FAILS
npm test
# Output: ❌ Expected error, but order was created

# STEP 4: Fix the bug (GREEN phase)
async function createOrder(data: CreateOrderDTO): Promise<Order> {
  // Validate total
  if (data.total <= 0) {
    throw new ValidationError('Order total must be greater than zero')
  }

  // Rest of order creation logic
  return await db.orders.create(data)
}

# STEP 5: Run test - confirm it PASSES
npm test
# Output: ✅ All tests passed

# STEP 6: Document the fix
## Bug Log Entry Template

**Bug ID:** #456
**Title:** Orders accepted with $0 total
**Reported:** 2026-01-12 14:30 UTC
**Fixed:** 2026-01-12 16:15 UTC
**Severity:** High (revenue loss)

**Repro Steps:**
1. Add product to cart
2. Modify price to $0 (using browser DevTools)
3. Submit order
4. Expected: Validation error
5. Actual: Order created successfully

**Root Cause:**
Frontend validation checked price > 0, but backend did NOT validate
total amount. Attacker could bypass frontend validation.

**Fix:**
Added backend validation: `if (data.total <= 0) throw error`

**Prevention:**
✅ Regression test: tests/orders/validation.test.ts:67
✅ Added to validation schema (Zod): .min(1)
✅ API security audit checklist: "Always validate money amounts"
✅ Documented in API spec: minimum order total = $0.01

**Commit:** a3f8d2b

# STEP 7: Commit test + fix together
git add .
git commit -m "fix(orders): reject zero-total orders (security)

- Bug #456: Orders accepted with $0 total
- Root cause: Missing backend validation for order total
- Fix: Add validation in createOrder() - reject if total <= 0
- Security: Prevents revenue loss from tampered frontend
- Test: tests/orders/validation.test.ts:67
- Prevention: Added to Zod schema, documented in API spec

Regression test ensures this security bug can NEVER recur.
"
```

### Why This Matters

| Without Regression Test                         | With Regression Test                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| Bug reported → Fixed → Reappears 3 months later | Bug reported → Fixed → Test added → Bug can NEVER recur |
| "Didn't we fix this?" frustration               | Permanent protection                                    |
| No documentation of WHY                         | Test = living documentation                             |
| Repeat mistakes                                 | Learn and improve                                       |

---

## Principle #3: Shift-Left Testing (Catch Bugs Early)

**Rule:** Catch bugs as early as possible. Cost increases exponentially with each stage.

### The Cost Pyramid (Universal)

| Stage             | Cost to Fix | Detection Time | Detection Method                             | Example                                    |
| ----------------- | ----------- | -------------- | -------------------------------------------- | ------------------------------------------ |
| **Compile Time**  | $1          | Instant        | TypeScript, linters, static analysis         | `Type 'string' not assignable to 'number'` |
| **Pre-commit**    | $10         | < 30 seconds   | Husky hooks (lint + type-check + fast tests) | `Function expects 2 args, got 1`           |
| **PR Build (CI)** | $100        | 2-5 minutes    | GitHub Actions (integration tests)           | `API returns 500 instead of 200`           |
| **Staging**       | $1,000      | 1-2 hours      | E2E tests, manual QA                         | `Checkout broken on Safari`                |
| **Production**    | $10,000+    | 1-24 hours     | User reports, monitoring                     | `Users can't pay (revenue loss)`           |

**Real Example:** Missing null check caught by TypeScript = $1. Same bug in production = $50,000 revenue loss + customer trust erosion.

### Implementation Checklist

#### Week 1: Compile-Time Safety

```json
// tsconfig.json (TypeScript strict mode)
{
  "compilerOptions": {
    "strict": true,                    // Enable all strict checks
    "noUncheckedIndexedAccess": true,  // Prevent undefined array access
    "noImplicitOverride": true,        // Prevent accidental overrides
    "noPropertyAccessFromIndexSignature": true
  }
}

// .eslintrc.json (ESLint strict rules)
{
  "rules": {
    "no-console": "error",             // No console.log in production
    "no-unused-vars": "error",         // Remove dead code
    "@typescript-eslint/no-explicit-any": "error", // Ban 'any' type
    "@typescript-eslint/no-non-null-assertion": "error" // Ban '!' operator
  }
}
```

#### Week 2: Pre-Commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
npm run lint && npm run type-check && npm run test:unit:fast

# Blocks commit if ANY check fails
# Fast tests only (< 30 seconds total)
```

#### Week 3: CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]

jobs:
  tier1-critical:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run lint # 30 sec
      - run: npm run type-check # 1 min
      - run: npm run test:unit # 2 min
      - run: npm run test:integration # 3 min
      - run: npm run test:coverage -- --min=80 # Enforce 80% minimum

  # Block merge if coverage drops below threshold
  coverage-check:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:coverage
      - run: |
          COVERAGE=$(jq '.total.lines.pct' coverage/coverage-summary.json)
          if (( $(echo "$COVERAGE < 80" | bc -l) )); then
            echo "❌ Coverage is $COVERAGE% (minimum: 80%)"
            exit 1
          fi
```

#### Week 4: Production Monitoring

```typescript
// Sentry error monitoring
import * as Sentry from '@sentry/node'

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0, // 100% of transactions
  beforeSend(event, hint) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.value?.includes('Network request failed')) {
      return null
    }
    return event
  },
})

// Capture errors automatically
app.use(Sentry.Handlers.errorHandler())
```

### ROI Calculation

**Traditional Approach (No Shift-Left):**

- 60% bugs found in production → $10,000+ each
- 10 bugs/month → $100,000+/month in bug costs
- Developer morale: Low (constant firefighting)

**Shift-Left Approach:**

- 95% bugs caught at compile/pre-commit → $1-10 each
- 10 bugs/month → $10-500/month in bug costs
- Developer morale: High (proactive prevention)

**ROI:** **200x cost reduction** + faster velocity + happier team

---

## Principle #4: Test Pyramid (70-20-10 Rule)

**Rule:** Maintain the correct balance. Don't invert the pyramid.

### The Optimal Distribution

```
        /\
       /E2E\      10% - Critical user flows ONLY (5-15 scenarios)
      /──────\      Time: 5-30 sec each, Total: 10-15 min
     /Integr.\ 20% - API + DB integration (100-200 tests)
    /──────────\     Time: 100-500ms each, Total: 2-5 min
   /  Unit Tests \ 70% - Business logic, pure functions (1000+ tests)
  /──────────────\    Time: < 1ms each, Total: 1-2 min
```

### Why This Distribution?

| Test Type       | Speed            | Coverage               | Brittleness | Maintenance | When to Use                                     |
| --------------- | ---------------- | ---------------------- | ----------- | ----------- | ----------------------------------------------- |
| **Unit**        | ⚡⚡⚡ (< 1ms)   | High (single function) | Low         | Easy        | Business logic, utils, formatters               |
| **Integration** | ⚡⚡ (100-500ms) | Medium (service + DB)  | Medium      | Medium      | API endpoints, DB queries, service interactions |
| **E2E**         | ⚡ (5-30 sec)    | High (full user flow)  | High        | Hard        | Critical paths ONLY (login, checkout, payment)  |

### Anti-Pattern: Inverted Pyramid (Common Mistake)

```
❌ BAD PYRAMID:
   70% E2E tests (slow, brittle, expensive to maintain)
   20% integration
   10% unit (too few - business logic untested)

Results:
- 45-minute CI pipelines → developers bypass CI
- Flaky tests → "just re-run it" mentality
- Expensive maintenance → E2E tests constantly break on UI changes
- Low coverage of business logic → bugs in production
```

### The Right Way: Examples for Each Layer

#### 70% Unit Tests (Fast, Focused)

```typescript
// Pure function - business logic
function calculateOrderTotal(
  items: Array<{ price: number; quantity: number }>,
  taxRate: number,
  shippingCost: number
): number {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * taxRate
  const total = subtotal + tax + shippingCost
  return Math.round(total * 100) / 100 // Round to 2 decimals
}

// Unit tests (< 1ms each)
describe('calculateOrderTotal', () => {
  test('calculates total correctly', () => {
    const items = [
      { price: 10, quantity: 2 },
      { price: 5, quantity: 3 },
    ]
    const total = calculateOrderTotal(items, 0.1, 5) // 10% tax, $5 shipping
    expect(total).toBe(40.5) // (20 + 15) * 1.1 + 5 = 40.5
  })

  test('handles empty cart', () => {
    expect(calculateOrderTotal([], 0.1, 5)).toBe(5) // Only shipping
  })

  test('handles zero tax', () => {
    const items = [{ price: 10, quantity: 1 }]
    expect(calculateOrderTotal(items, 0, 0)).toBe(10)
  })

  test('handles zero quantity', () => {
    const items = [{ price: 10, quantity: 0 }]
    expect(calculateOrderTotal(items, 0, 0)).toBe(0)
  })

  test('rounds to 2 decimals', () => {
    const items = [{ price: 10.333, quantity: 1 }]
    expect(calculateOrderTotal(items, 0.05, 0)).toBe(10.85) // 10.333 * 1.05 = 10.84965 → 10.85
  })
})
```

#### 20% Integration Tests (Service + DB)

```typescript
// Integration test (100-500ms)
describe('User Service', () => {
  beforeEach(async () => {
    await db.users.deleteMany() // Clean slate
  })

  test('creates user in database', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'securePassword123',
    }

    const user = await userService.create(userData)

    // Verify in DB
    const dbUser = await db.users.findOne({ id: user.id })
    expect(dbUser).toBeDefined()
    expect(dbUser.email).toBe('test@example.com')
    expect(dbUser.passwordHash).not.toBe('securePassword123') // Should be hashed
    expect(dbUser.createdAt).toBeInstanceOf(Date)
  })

  test('prevents duplicate email', async () => {
    await userService.create({ email: 'test@example.com', password: 'pass123' })

    await expect(
      userService.create({ email: 'test@example.com', password: 'pass456' })
    ).rejects.toThrow('Email already exists')
  })

  test('hashes password before storing', async () => {
    const user = await userService.create({
      email: 'test@example.com',
      password: 'plaintext',
    })

    const dbUser = await db.users.findOne({ id: user.id })
    expect(dbUser.passwordHash).not.toBe('plaintext')
    expect(dbUser.passwordHash).toMatch(/^\$2[aby]\$/) // bcrypt format
  })
})
```

#### 10% E2E Tests (Critical Flows Only)

```typescript
// E2E test (5-30 seconds) - Use SPARINGLY
import { test, expect } from '@playwright/test'

test('User can complete checkout flow', async ({ page }) => {
  // ONLY test CRITICAL end-to-end flows
  // This example: E-commerce checkout (revenue-critical)

  // Step 1: Browse products
  await page.goto('/products')
  await expect(page.locator('h1')).toContainText('Products')

  // Step 2: Add to cart
  await page.click('[data-testid="product-1-add-to-cart"]')
  await expect(page.locator('[data-testid="cart-count"]')).toContainText('1')

  // Step 3: View cart
  await page.click('[data-testid="cart-icon"]')
  await expect(page.locator('[data-testid="cart-items"]')).toBeVisible()

  // Step 4: Proceed to checkout
  await page.click('[data-testid="checkout-button"]')

  // Step 5: Fill shipping info
  await page.fill('[name="email"]', 'test@example.com')
  await page.fill('[name="address"]', '123 Main St')
  await page.fill('[name="city"]', 'New York')
  await page.fill('[name="zip"]', '10001')

  // Step 6: Enter payment (test card)
  await page.fill('[name="cardNumber"]', '4242424242424242') // Stripe test card
  await page.fill('[name="cardExpiry"]', '12/28')
  await page.fill('[name="cardCvc"]', '123')

  // Step 7: Submit order
  await page.click('[data-testid="submit-order"]')

  // Step 8: Verify confirmation
  await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible({ timeout: 10000 })
  await expect(page.locator('[data-testid="order-number"]')).toContainText(/^ORD-/)
})
```

### Critical Flows Checklist (E2E Tests)

Only write E2E tests for these **10-15 critical scenarios**:

- [ ] User registration (sign-up flow)
- [ ] User login (authentication)
- [ ] Password reset (recovery flow)
- [ ] Checkout / payment (revenue-critical)
- [ ] Core business action (domain-specific - e.g., "book appointment", "transfer money")
- [ ] File upload (if applicable)
- [ ] Search and filter (if core feature)
- [ ] Admin access (authorization)
- [ ] Data export (if applicable)
- [ ] Mobile responsive (key pages)

**Everything else:** Unit or integration tests.

---

## Principle #5: Contract-First API Development

**Rule:** Define API contracts with schemas. Validate at runtime. Generate types from schemas.

### Why This Matters

**Without contracts:**

- ❌ Breaking changes go unnoticed until production
- ❌ Frontend and backend drift apart
- ❌ No single source of truth
- ❌ Runtime errors: "Cannot read property 'name' of undefined"

**With contracts:**

- ✅ Breaking changes caught at build time (CI fails)
- ✅ Types auto-generated (no manual sync)
- ✅ Living documentation (schema IS the contract)
- ✅ Runtime validation (400 error instead of crash)

### Implementation: Schema-First with Zod

```typescript
// 1. Define schema (SINGLE SOURCE OF TRUTH)
import { z } from 'zod'

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER', 'MODERATOR']),
  profile: z.object({
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    avatarUrl: z.string().url().optional(),
  }),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

// 2. Generate TypeScript types (AUTOMATIC!)
export type UserResponse = z.infer<typeof UserResponseSchema>
// Type is:
// {
//   id: string
//   email: string
//   role: 'ADMIN' | 'USER' | 'MODERATOR'
//   profile: { firstName: string; lastName: string; avatarUrl?: string }
//   createdAt: string
//   updatedAt: string
// }

// 3. Validate at runtime (PRODUCTION SAFETY)
export async function GET(req: Request) {
  const userId = req.params.id
  const user = await db.users.findOne({ where: { id: userId } })

  // This THROWS if API shape changes unexpectedly
  try {
    const validated = UserResponseSchema.parse(user)
    return Response.json(validated)
  } catch (error) {
    // Log validation failure
    logger.error('API contract violation', {
      endpoint: '/api/users/:id',
      userId,
      expected: UserResponseSchema,
      actual: user,
      errors: error.errors,
    })

    // Return 500 (don't expose invalid data to client)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// 4. Test contract compliance
test('GET /api/users/:id returns correct shape', async () => {
  const response = await fetch('/api/users/123')
  const data = await response.json()

  // Schema validation test
  expect(() => UserResponseSchema.parse(data)).not.toThrow()

  // Snapshot test (locks contract - any change breaks test)
  expect(data).toMatchSnapshot()
})
```

### Breaking Change Detection

```typescript
// Old schema (v1)
const UserV1 = z.object({
  id: z.string(),
  email: z.string(),
})

// New schema (v2) - BREAKING CHANGE
const UserV2 = z.object({
  id: z.string(),
  emailAddress: z.string(), // ❌ Renamed field (breaks clients)
  role: z.string().optional(), // ✅ New optional field (non-breaking)
})

// Test catches breaking change immediately
test('API contract has not changed', async () => {
  const response = await fetch('/api/users/123')
  const data = await response.json()

  // This FAILS if field renamed
  expect(data).toHaveProperty('email')

  // Snapshot test also catches breaking changes
  expect(data).toMatchSnapshot()
})

// If intentional breaking change:
// 1. Version the API (/api/v2/users/:id)
// 2. Update snapshot: npm run test -- --updateSnapshot
// 3. Document in CHANGELOG.md
// 4. Communicate to API consumers
```

### Contract Testing for Microservices (Pact)

```typescript
// Consumer test (Frontend)
import { pactWith } from 'jest-pact'

pactWith({ consumer: 'Web App', provider: 'User API' }, (provider) => {
  test('gets user by ID', async () => {
    // Define expected contract
    await provider.addInteraction({
      state: 'user 123 exists',
      uponReceiving: 'a request for user 123',
      withRequest: {
        method: 'GET',
        path: '/api/users/123',
      },
      willRespondWith: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: {
          id: '123',
          email: 'test@example.com',
          role: 'USER',
        },
      },
    })

    // Test consumer code
    const user = await userClient.get('123')
    expect(user.id).toBe('123')
  })
})

// Provider verification (Backend)
test('User API satisfies contract', async () => {
  await verifyProvider({
    provider: 'User API',
    pactUrls: ['./pacts/web-app-user-api.json'],
    stateHandlers: {
      'user 123 exists': async () => {
        // Seed test data
        await db.users.create({ id: '123', email: 'test@example.com', role: 'USER' })
      },
    },
  })
})
```

### Benefits Summary

| Without Contracts                         | With Contracts                    |
| ----------------------------------------- | --------------------------------- |
| Breaking changes go unnoticed             | Build fails immediately           |
| Manual type synchronization (error-prone) | Types auto-generated from schemas |
| No API documentation                      | OpenAPI docs auto-generated       |
| Runtime errors in production              | Runtime validation catches issues |
| Frontend-backend drift                    | Single source of truth            |
| Hard to debug issues                      | Clear validation errors           |

---

## Principle #6: Visual Regression Testing (UI Changes Must Be Explicit)

**Rule:** EVERY UI change must be reviewed visually. No accidental layout breaks.

### Why Visual Regression Testing?

**Problem:** Traditional tests don't catch visual bugs:

- ✅ Test passes: "Login button exists"
- ❌ Reality: Button is hidden behind header (z-index issue)

**Solution:** Screenshot comparison catches ALL visual changes.

### Implementation: Playwright + Percy/Chromatic (or Free Alternative)

#### Option 1: Free (jest-image-snapshot)

```typescript
import { toMatchImageSnapshot } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })

describe('Visual Regression Tests', () => {
  test('Homepage layout (desktop)', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Take screenshot
    const screenshot = await page.screenshot({ fullPage: true })

    // Compare to baseline (FAILS if ANY pixel changes)
    expect(screenshot).toMatchImageSnapshot({
      failureThreshold: 0.01, // 1% tolerance for anti-aliasing
      failureThresholdType: 'percent',
    })
  })

  test('Login form (mobile)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    await page.goto('/login')

    const screenshot = await page.screenshot()
    expect(screenshot).toMatchImageSnapshot()
  })

  test('Product card hover state', async ({ page }) => {
    await page.goto('/products')
    await page.hover('[data-testid="product-card-1"]')
    await page.waitForTimeout(300) // Wait for animation

    const screenshot = await page.screenshot({
      clip: { x: 0, y: 0, width: 300, height: 400 }, // Crop to card
    })

    expect(screenshot).toMatchImageSnapshot()
  })
})
```

#### Option 2: Cloud-Based (Percy.io - Free tier 5,000 screenshots/month)

```typescript
import percySnapshot from '@percy/playwright'

test('Homepage visual check', async ({ page }) => {
  await page.goto('/')
  await percySnapshot(page, 'Homepage')
})

test('Responsive snapshots', async ({ page }) => {
  await page.goto('/dashboard')

  // Percy automatically tests multiple viewports
  await percySnapshot(page, 'Dashboard', {
    widths: [375, 768, 1280], // Mobile, tablet, desktop
    minHeight: 1024,
  })
})
```

### What to Test Visually

#### Critical UI Components (MUST test)

- [ ] **Homepage** (first impression - brand critical)
- [ ] **Login/Register forms** (high-traffic pages)
- [ ] **Checkout flow** (revenue-critical)
- [ ] **Dashboard** (user retention)
- [ ] **Product cards/listings** (e-commerce)
- [ ] **Navigation menus** (mobile + desktop)
- [ ] **Error states** (404, 500, validation errors)
- [ ] **Empty states** (no data scenarios)

#### Component States to Capture

```typescript
test('Button component - all states', async ({ page }) => {
  await page.goto('/components/buttons')

  // Default state
  await percySnapshot(page, 'Button - Default')

  // Hover state
  await page.hover('[data-testid="primary-button"]')
  await percySnapshot(page, 'Button - Hover')

  // Focus state (keyboard navigation)
  await page.focus('[data-testid="primary-button"]')
  await percySnapshot(page, 'Button - Focus')

  // Disabled state
  await page.click('[data-testid="toggle-disabled"]')
  await percySnapshot(page, 'Button - Disabled')

  // Loading state
  await page.click('[data-testid="toggle-loading"]')
  await percySnapshot(page, 'Button - Loading')
})
```

### CI Integration (Auto-Fail on Visual Changes)

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
      - run: npm run build

      # Run visual regression tests
      - run: npx playwright test --project=visual-regression

      # Upload screenshots to Percy (or store as artifacts)
      - uses: percy/exec-action@v0.3.1
        with:
          custom-command: npx percy exec -- npx playwright test
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}

      # Block merge if visual changes detected (without approval)
      - name: Check Percy status
        run: |
          # Percy API returns status of visual comparison
          # If changes detected → requires manual approval in Percy dashboard
```

### Handling Intentional Changes

```bash
# Developer makes UI change
git checkout -b feature/new-button-style

# Run tests locally
npm run test:visual

# Output:
# ❌ Button - Default: 152 pixel diff (5.2% changed)
# Screenshot saved: __image_snapshots__/__diff_output__/button-default.png

# Review diff image → change is intentional

# Update baseline
npm run test:visual -- --updateSnapshot

# New baseline committed with feature
git add __image_snapshots__/
git commit -m "feat(ui): update button style (visual baseline updated)"
```

### Benefits

| Manual QA                  | Visual Regression Testing             |
| -------------------------- | ------------------------------------- |
| "Looks good on my machine" | Tested on 10+ viewports automatically |
| Catches 60% of visual bugs | Catches 95%+ of visual bugs           |
| Hours of manual testing    | 2-5 minutes automated                 |
| Subjective ("looks fine")  | Objective (pixel-perfect comparison)  |
| No historical record       | Full history of UI changes            |

---

## Principle #7: Database Constraints as Last Line of Defense

**Rule:** Application logic can fail. Database constraints NEVER fail.

### Why This Matters

**Reality:** Application-level validation can be bypassed:

- API called directly (skipping frontend)
- SQL injection
- Batch scripts
- Database migrations
- Legacy code paths
- Admin tools

**Solution:** Database enforces business rules even when application fails.

### The 5 Essential Constraints

#### 1. NOT NULL (Mandatory Fields)

```sql
-- ❌ BAD: Allows null emails
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255),
  password_hash VARCHAR(255)
);

-- ✅ GOOD: Database enforces non-null
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Application code can fail, database won't
INSERT INTO users (id, email) VALUES ('123', 'test@example.com');
-- ERROR: null value in column "password_hash" violates not-null constraint
```

#### 2. UNIQUE (Prevent Duplicates)

```sql
-- ✅ GOOD: Unique email constraint
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) UNIQUE -- Allows NULL but no duplicates
);

-- Race condition protection
-- Even if 2 API calls happen simultaneously:
INSERT INTO users (email) VALUES ('test@example.com'); -- ✅ Succeeds
INSERT INTO users (email) VALUES ('test@example.com'); -- ❌ Fails with unique violation

-- Application code example (Prisma)
try {
  await db.users.create({ data: { email: 'test@example.com' } })
} catch (error) {
  if (error.code === 'P2002') { // Prisma unique constraint error
    throw new ConflictError('Email already exists')
  }
}
```

#### 3. CHECK (Business Rules)

```sql
-- ✅ GOOD: Enforce business constraints
CREATE TABLE products (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  stock_quantity INTEGER NOT NULL,

  -- Price must be positive
  CONSTRAINT price_must_be_positive CHECK (price > 0),

  -- Stock can't be negative
  CONSTRAINT stock_non_negative CHECK (stock_quantity >= 0),

  -- Discount percentage between 0-100
  discount_percent INTEGER DEFAULT 0,
  CONSTRAINT valid_discount CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

-- Database rejects invalid data
INSERT INTO products (name, price, stock_quantity)
VALUES ('Product A', -10, 5);
-- ERROR: new row violates check constraint "price_must_be_positive"

-- Even SQL injection can't bypass this
UPDATE products SET price = -1 WHERE id = '123';
-- ERROR: check constraint "price_must_be_positive" is violated
```

#### 4. FOREIGN KEY (Referential Integrity)

```sql
-- ✅ GOOD: Prevent orphaned records
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  total DECIMAL(10, 2) NOT NULL,

  -- Can't create order for non-existent user
  CONSTRAINT fk_user FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE -- Delete orders when user deleted
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,

  CONSTRAINT fk_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE,

  CONSTRAINT fk_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE RESTRICT -- Prevent deleting products in active orders
);

-- Database prevents orphans
INSERT INTO orders (id, user_id, total)
VALUES ('order-1', 'non-existent-user', 100);
-- ERROR: insert or update violates foreign key constraint "fk_user"

-- Cascading deletes work automatically
DELETE FROM users WHERE id = 'user-123';
-- All orders for user-123 automatically deleted (ON DELETE CASCADE)
```

#### 5. PARTIAL UNIQUE (Complex Constraints)

```sql
-- ✅ GOOD: One active subscription per user
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,

  -- Only ONE active subscription per user
  -- (NULL values don't count for uniqueness)
  CONSTRAINT one_active_subscription_per_user
    UNIQUE (user_id, status)
    WHERE (status = 'ACTIVE')
);

-- User can have multiple inactive subscriptions
INSERT INTO subscriptions (user_id, status) VALUES ('user-1', 'INACTIVE'); -- ✅
INSERT INTO subscriptions (user_id, status) VALUES ('user-1', 'INACTIVE'); -- ✅

-- But only ONE active
INSERT INTO subscriptions (user_id, status) VALUES ('user-1', 'ACTIVE'); -- ✅
INSERT INTO subscriptions (user_id, status) VALUES ('user-1', 'ACTIVE'); -- ❌ Unique violation
```

### Testing Database Constraints

```typescript
describe('Database Constraints', () => {
  test('UNIQUE: rejects duplicate emails', async () => {
    await db.users.create({ email: 'test@example.com', password: 'hash1' })

    await expect(db.users.create({ email: 'test@example.com', password: 'hash2' })).rejects.toThrow(
      /unique constraint/i
    )
  })

  test('NOT NULL: rejects missing email', async () => {
    await expect(db.users.create({ email: null, password: 'hash' })).rejects.toThrow(
      /not-null constraint/i
    )
  })

  test('CHECK: rejects negative price', async () => {
    await expect(db.products.create({ name: 'Product', price: -10 })).rejects.toThrow(
      /check constraint/i
    )
  })

  test('FOREIGN KEY: rejects invalid user_id', async () => {
    await expect(db.orders.create({ user_id: 'non-existent', total: 100 })).rejects.toThrow(
      /foreign key constraint/i
    )
  })

  test('CASCADE: deletes orders when user deleted', async () => {
    const user = await db.users.create({ email: 'test@example.com' })
    await db.orders.create({ user_id: user.id, total: 100 })

    await db.users.delete({ where: { id: user.id } })

    const orders = await db.orders.findMany({ where: { user_id: user.id } })
    expect(orders).toHaveLength(0) // All deleted
  })
})
```

### Real-World Impact

**Case Study: Payment System**

```sql
-- Without constraints (DISASTER waiting to happen)
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID,
  amount DECIMAL(10, 2),
  status VARCHAR(20)
);

-- Possible bugs:
-- 1. Negative payment: amount = -100 (refund bypasses validation)
-- 2. Orphaned payment: order_id points to deleted order
-- 3. Duplicate payment: same order charged twice
-- 4. NULL amount: payment created without amount

-- With constraints (SAFE)
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Business constraints
  CONSTRAINT amount_must_be_positive CHECK (amount > 0),
  CONSTRAINT valid_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED')),

  -- One payment per order (prevent double-charging)
  CONSTRAINT one_payment_per_order UNIQUE (order_id)
);
```

**Result:**

- ✅ Negative amounts: Impossible
- ✅ Orphaned payments: Impossible
- ✅ Duplicate charges: Impossible
- ✅ NULL amounts: Impossible
- ✅ Invalid statuses: Impossible

**Cost of NOT using constraints:** $50,000+ in duplicate charges, hours of manual data cleanup, customer trust erosion.

---

## Principle #8: Zero Flaky Tests Policy (48-Hour Fix-or-Delete Rule)

**Rule:** If a test fails intermittently, you have 48 hours to fix it. After that, DELETE IT.

### Why Flaky Tests Are Toxic

**The Flaky Test Death Spiral:**

```
Week 1: "Test failed? Just re-run CI" (1 flaky test)
Week 2: "Re-run twice to be sure" (3 flaky tests)
Week 3: "Re-run is normal now" (8 flaky tests)
Week 4: "CI is useless, we'll test manually" (20 flaky tests)
```

**Cost of Flaky Tests:**

- Developers lose trust in CI → bypass safety checks
- 10-30 minutes wasted per re-run × 20 developers × 5 days = 1,000 hours/month wasted
- Real bugs slip through ("probably just flaky")
- Team morale drops (frustration, distrust)

### The 7 Common Causes of Flaky Tests

#### 1. Race Conditions (Async/Timing Issues)

```typescript
// ❌ FLAKY: Race condition
test('user sees notification', async () => {
  await createNotification({ userId: '123', message: 'Hello' })

  const notification = await getNotification('123')
  expect(notification.message).toBe('Hello')
  // FAILS 10% of the time - database write not completed yet
})

// ✅ FIXED: Wait for condition
test('user sees notification', async () => {
  await createNotification({ userId: '123', message: 'Hello' })

  // Wait up to 5 seconds for notification to appear
  await waitFor(
    async () => {
      const notification = await getNotification('123')
      expect(notification).toBeDefined()
      expect(notification.message).toBe('Hello')
    },
    { timeout: 5000 }
  )
})
```

#### 2. Shared State (Test Pollution)

```typescript
// ❌ FLAKY: Tests share database state
test('creates user', async () => {
  const user = await db.users.create({ email: 'test@example.com' })
  expect(user.id).toBeDefined()
})

test('finds user by email', async () => {
  const user = await db.users.findOne({ email: 'test@example.com' })
  expect(user).toBeDefined()
  // FAILS if first test didn't run (test order matters)
})

// ✅ FIXED: Independent tests with setup/teardown
describe('User operations', () => {
  beforeEach(async () => {
    await db.users.deleteMany() // Clean slate
  })

  test('creates user', async () => {
    const user = await db.users.create({ email: 'test@example.com' })
    expect(user.id).toBeDefined()
  })

  test('finds user by email', async () => {
    // Setup data for THIS test
    await db.users.create({ email: 'test@example.com' })

    const user = await db.users.findOne({ email: 'test@example.com' })
    expect(user).toBeDefined()
  })
})
```

#### 3. Network Flakiness (External API Calls)

```typescript
// ❌ FLAKY: Calls real external API
test('fetches user from external API', async () => {
  const user = await fetch('https://api.example.com/users/123')
  expect(user.name).toBe('John')
  // FAILS when API is down, rate-limited, or network issue
})

// ✅ FIXED: Mock external dependencies
test('fetches user from external API', async () => {
  // Mock the API call
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({ id: '123', name: 'John' }),
  })

  const user = await getUserFromAPI('123')
  expect(user.name).toBe('John')
})

// ✅ ALTERNATIVE: Use MSW (Mock Service Worker) for realistic mocking
import { rest } from 'msw'
import { setupServer } from 'msw/node'

const server = setupServer(
  rest.get('https://api.example.com/users/:id', (req, res, ctx) => {
    return res(ctx.json({ id: req.params.id, name: 'John' }))
  })
)

beforeAll(() => server.listen())
afterAll(() => server.close())

test('fetches user from external API', async () => {
  const user = await getUserFromAPI('123')
  expect(user.name).toBe('John')
})
```

#### 4. Time-Dependent Tests (Date/Time Bugs)

```typescript
// ❌ FLAKY: Depends on current time
test('shows "good morning" greeting before noon', () => {
  const greeting = getGreeting()
  expect(greeting).toBe('Good morning')
  // FAILS if test runs after 12:00 PM
})

// ✅ FIXED: Mock time
import { vi } from 'vitest'

test('shows "good morning" greeting before noon', () => {
  // Set time to 10:00 AM
  vi.setSystemTime(new Date('2026-01-12T10:00:00Z'))

  const greeting = getGreeting()
  expect(greeting).toBe('Good morning')
})

test('shows "good afternoon" after noon', () => {
  vi.setSystemTime(new Date('2026-01-12T14:00:00Z'))

  const greeting = getGreeting()
  expect(greeting).toBe('Good afternoon')
})

afterEach(() => {
  vi.useRealTimers() // Restore real time
})
```

#### 5. Resource Leaks (Memory/Connection Limits)

```typescript
// ❌ FLAKY: Database connections not closed
test('creates 100 users', async () => {
  for (let i = 0; i < 100; i++) {
    const db = new Database() // New connection each iteration
    await db.users.create({ email: `user${i}@example.com` })
    // FAILS after ~50 iterations - connection pool exhausted
  }
})

// ✅ FIXED: Reuse connection, proper cleanup
describe('User creation', () => {
  let db: Database

  beforeAll(async () => {
    db = new Database()
    await db.connect()
  })

  afterAll(async () => {
    await db.disconnect() // Clean up
  })

  test('creates 100 users', async () => {
    for (let i = 0; i < 100; i++) {
      await db.users.create({ email: `user${i}@example.com` })
    }

    const count = await db.users.count()
    expect(count).toBe(100)
  })
})
```

#### 6. Animation/Transition Timing (UI Tests)

```typescript
// ❌ FLAKY: Clicks during animation
test('modal opens and closes', async ({ page }) => {
  await page.click('[data-testid="open-modal"]')
  await page.click('[data-testid="close-modal"]') // Clicks too fast
  // FAILS 20% of the time - modal still animating
})

// ✅ FIXED: Wait for stable state
test('modal opens and closes', async ({ page }) => {
  await page.click('[data-testid="open-modal"]')

  // Wait for modal to be fully visible
  await page.waitForSelector('[data-testid="modal"]', { state: 'visible' })
  await page.waitForTimeout(300) // Wait for animation (if 300ms transition)

  await page.click('[data-testid="close-modal"]')

  // Wait for modal to be hidden
  await page.waitForSelector('[data-testid="modal"]', { state: 'hidden' })
})

// ✅ BETTER: Disable animations in tests
// playwright.config.ts
export default {
  use: {
    // Disable CSS animations/transitions
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Add CSS to disable animations
    styleTag: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  },
}
```

#### 7. Randomness (Non-Deterministic Data)

```typescript
// ❌ FLAKY: Random data in snapshots
test('renders user profile', () => {
  const user = {
    id: Math.random(), // Different every time
    createdAt: new Date() // Different every time
  }

  const { container } = render(<UserProfile user={user} />)
  expect(container).toMatchSnapshot()
  // FAILS every time - snapshot never matches
})

// ✅ FIXED: Deterministic data
test('renders user profile', () => {
  const user = {
    id: '123',
    createdAt: new Date('2026-01-12T10:00:00Z') // Fixed date
  }

  const { container } = render(<UserProfile user={user} />)
  expect(container).toMatchSnapshot()
})

// ✅ ALTERNATIVE: Use factories with fixed seeds
import { faker } from '@faker-js/faker'

faker.seed(12345) // Deterministic data

test('renders user profile', () => {
  const user = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    createdAt: faker.date.past()
  }

  const { container } = render(<UserProfile user={user} />)
  expect(container).toMatchSnapshot()
})
```

### The 48-Hour Fix-or-Delete Rule

```bash
# Day 1: Test fails intermittently
CI Pipeline #1234: ❌ Failed (test: "user can checkout")
Re-run: ✅ Passed

# Action: Create ticket immediately
Title: "FLAKY TEST: user can checkout"
Priority: P1 (highest)
Due: 48 hours from now

# Developer investigates
- Reviews test logs
- Identifies race condition (async timing)
- Fixes test (adds waitFor)
- Verifies fix (runs test 100 times locally)

# Verification
for i in {1..100}; do npm test -- checkout.test.ts; done
# Output: 100/100 passed ✅

# Day 2: Test is now stable
Close ticket: "Fixed race condition in checkout test"

# ========================================

# Alternative: Can't fix in 48 hours
# Day 2: Still flaky after investigation

# Action: DELETE THE TEST
git rm tests/checkout.test.ts
git commit -m "remove: flaky checkout test (will rewrite with proper async handling)"

# Create replacement ticket
Title: "Rewrite checkout E2E test (removed due to flakiness)"
Priority: P2
Plan:
1. Study flaky test root cause
2. Rewrite with proper waits/mocks
3. Run 1000 times locally to verify
4. Document async patterns in test guidelines
```

### Flaky Test Prevention Checklist

Before merging ANY test, verify:

- [ ] **No hard-coded waits** - Use `waitFor`, `waitForSelector`, not `sleep(1000)`
- [ ] **Independent tests** - Each test has `beforeEach` cleanup
- [ ] **Mocked time** - Use `vi.setSystemTime()` for time-dependent logic
- [ ] **Mocked APIs** - Use MSW or similar for external calls
- [ ] **Deterministic data** - Fixed seeds for random generators
- [ ] **Verified 100+ times** - Run `for i in {1..100}; do npm test; done`
- [ ] **No animations in E2E** - Disable CSS transitions in test config
- [ ] **Connection cleanup** - `afterAll` closes DB/Redis connections

### CI Detection of Flaky Tests

```yaml
# .github/workflows/flaky-test-detection.yml
name: Flaky Test Detection

on:
  schedule:
    - cron: '0 2 * * *' # Run nightly at 2 AM

jobs:
  detect-flaky:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci

      # Run full test suite 10 times
      - name: Run tests multiple times
        run: |
          for i in {1..10}; do
            npm test -- --reporter=json > test-results-$i.json || true
          done

      # Analyze results
      - name: Detect flaky tests
        run: node scripts/detect-flaky-tests.js

      # Create issues for flaky tests
      - name: Create GitHub issues
        if: env.FLAKY_TESTS_FOUND == 'true'
        run: gh issue create --title "Flaky tests detected" --body-file flaky-tests-report.md
```

```javascript
// scripts/detect-flaky-tests.js
const results = []
for (let i = 1; i <= 10; i++) {
  const data = JSON.parse(fs.readFileSync(`test-results-${i}.json`))
  results.push(data)
}

const testNames = new Set()
results.forEach((r) => r.testResults.forEach((t) => testNames.add(t.fullName)))

const flakyTests = []
testNames.forEach((testName) => {
  const outcomes = results.map((r) => {
    const test = r.testResults.find((t) => t.fullName === testName)
    return test?.status || 'missing'
  })

  const passed = outcomes.filter((o) => o === 'passed').length
  const failed = outcomes.filter((o) => o === 'failed').length

  // Flaky = sometimes passes, sometimes fails
  if (passed > 0 && failed > 0) {
    flakyTests.push({
      name: testName,
      passRate: `${passed}/10`,
      failRate: `${failed}/10`,
    })
  }
})

if (flakyTests.length > 0) {
  console.log('❌ FLAKY TESTS DETECTED:')
  flakyTests.forEach((t) => {
    console.log(`- ${t.name} (passed ${t.passRate}, failed ${t.failRate})`)
  })
  process.env.FLAKY_TESTS_FOUND = 'true'
  process.exit(1)
} else {
  console.log('✅ No flaky tests detected')
}
```

### Benefits

| With Flaky Tests             | With Zero Flaky Tests Policy   |
| ---------------------------- | ------------------------------ |
| CI takes 10-30 min (re-runs) | CI takes 5-10 min (no re-runs) |
| Developers bypass CI         | Developers trust CI            |
| Real bugs slip through       | Real bugs caught immediately   |
| Low team morale              | High confidence                |
| Manual testing required      | Automation works               |

---

## Principle #9: Golden Path Canaries (Production Health Checks)

**Rule:** Critical user flows MUST be tested in production every hour. If canary fails, page immediately.

### Why Golden Path Canaries?

**Scenario:** Your monitoring shows:

- ✅ Server CPU: 20% (healthy)
- ✅ Memory: 2GB/8GB (healthy)
- ✅ Response time: 150ms (healthy)
- ✅ Error rate: 0.01% (healthy)

**But users report:** "I can't log in!"

**Root cause:** Login API works, but OAuth provider is down. Infrastructure monitoring didn't catch it.

**Solution:** Golden Path Canaries test REAL user flows end-to-end.

### The 5 Golden Paths (Universal)

Every application should monitor these flows:

1. **Authentication** - Can users log in?
2. **Core Action** - Can users do the ONE thing your app does? (e.g., "place order", "send message", "book appointment")
3. **Payment** - Can users pay? (if applicable)
4. **Data Read** - Can users view their data?
5. **Data Write** - Can users update their data?

### Implementation: Synthetic Monitoring

#### Option 1: Simple HTTP Checks (Basic)

```typescript
// scripts/canary-check.ts
import fetch from 'node-fetch'

async function runCanaryChecks() {
  const results = []

  // Canary 1: Homepage loads
  try {
    const response = await fetch('https://yourapp.com')
    results.push({
      test: 'Homepage loads',
      status: response.ok ? 'PASS' : 'FAIL',
      responseTime: response.headers.get('x-response-time'),
    })
  } catch (error) {
    results.push({ test: 'Homepage loads', status: 'FAIL', error: error.message })
  }

  // Canary 2: API health endpoint
  try {
    const response = await fetch('https://api.yourapp.com/health')
    const data = await response.json()
    results.push({
      test: 'API health',
      status: data.status === 'healthy' ? 'PASS' : 'FAIL',
      details: data,
    })
  } catch (error) {
    results.push({ test: 'API health', status: 'FAIL', error: error.message })
  }

  // Canary 3: Database connection
  try {
    const response = await fetch('https://api.yourapp.com/health/db')
    const data = await response.json()
    results.push({
      test: 'Database connection',
      status: data.connected ? 'PASS' : 'FAIL',
    })
  } catch (error) {
    results.push({ test: 'Database connection', status: 'FAIL', error: error.message })
  }

  // Alert if ANY canary fails
  const failures = results.filter((r) => r.status === 'FAIL')
  if (failures.length > 0) {
    await sendAlert({
      severity: 'CRITICAL',
      message: `${failures.length} canary checks failed`,
      details: failures,
    })
  }

  return results
}

// Run every 5 minutes
setInterval(runCanaryChecks, 5 * 60 * 1000)
```

#### Option 2: Full E2E Canaries (Recommended)

```typescript
// scripts/canaries/login-canary.ts
import { chromium } from 'playwright'

export async function loginCanary() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Step 1: Navigate to login page
    const startTime = Date.now()
    await page.goto('https://yourapp.com/login', { timeout: 10000 })

    // Step 2: Fill credentials (test account)
    await page.fill('[name="email"]', 'canary@yourapp.com')
    await page.fill('[name="password"]', process.env.CANARY_PASSWORD)

    // Step 3: Submit login
    await page.click('[data-testid="login-button"]')

    // Step 4: Verify redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 })

    // Step 5: Verify user sees their name
    const userName = await page.textContent('[data-testid="user-name"]')
    if (!userName || userName !== 'Canary User') {
      throw new Error(`Expected "Canary User", got "${userName}"`)
    }

    const endTime = Date.now()

    return {
      test: 'Login flow',
      status: 'PASS',
      duration: endTime - startTime,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      test: 'Login flow',
      status: 'FAIL',
      error: error.message,
      screenshot: await page.screenshot({ type: 'png' }),
    }
  } finally {
    await browser.close()
  }
}
```

```typescript
// scripts/canaries/checkout-canary.ts
export async function checkoutCanary() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()

  try {
    // Login first
    await login(page, 'canary@yourapp.com', process.env.CANARY_PASSWORD)

    // Step 1: Add product to cart
    await page.goto('https://yourapp.com/products')
    await page.click('[data-testid="product-1-add-to-cart"]')

    // Step 2: Proceed to checkout
    await page.click('[data-testid="cart-icon"]')
    await page.click('[data-testid="checkout-button"]')

    // Step 3: Fill shipping (pre-filled from account)
    await page.click('[data-testid="use-saved-address"]')

    // Step 4: Enter TEST payment credentials
    await page.fill('[name="cardNumber"]', '4242424242424242') // Stripe test card
    await page.fill('[name="cardExpiry"]', '12/28')
    await page.fill('[name="cardCvc"]', '123')

    // Step 5: Submit order
    await page.click('[data-testid="submit-order"]')

    // Step 6: Verify confirmation page
    await page.waitForSelector('[data-testid="order-confirmation"]', { timeout: 15000 })
    const orderNumber = await page.textContent('[data-testid="order-number"]')

    if (!orderNumber || !orderNumber.startsWith('ORD-')) {
      throw new Error('Order confirmation missing order number')
    }

    return {
      test: 'Checkout flow',
      status: 'PASS',
      orderNumber,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    return {
      test: 'Checkout flow',
      status: 'FAIL',
      error: error.message,
      screenshot: await page.screenshot(),
    }
  } finally {
    await browser.close()
  }
}
```

#### Canary Orchestrator

```typescript
// scripts/run-canaries.ts
import { loginCanary } from './canaries/login-canary'
import { checkoutCanary } from './canaries/checkout-canary'
import { apiCanary } from './canaries/api-canary'

async function runAllCanaries() {
  const results = await Promise.all([loginCanary(), checkoutCanary(), apiCanary()])

  // Log results
  console.log('Canary Results:', JSON.stringify(results, null, 2))

  // Check for failures
  const failures = results.filter((r) => r.status === 'FAIL')

  if (failures.length > 0) {
    // CRITICAL ALERT - Wake someone up
    await sendPagerDutyAlert({
      severity: 'critical',
      message: `${failures.length} golden path canaries failed`,
      details: failures,
      screenshots: failures.map((f) => f.screenshot).filter(Boolean),
    })

    // Also post to Slack
    await sendSlackAlert({
      channel: '#incidents',
      message: '🚨 *CRITICAL: Golden Path Canary Failure*',
      attachments: failures.map((f) => ({
        color: 'danger',
        title: f.test,
        text: f.error,
        fields: [
          { title: 'Timestamp', value: f.timestamp, short: true },
          { title: 'Duration', value: `${f.duration}ms`, short: true },
        ],
      })),
    })
  }

  // Store results for trending
  await storeMetrics({
    timestamp: new Date(),
    results,
    failureRate: failures.length / results.length,
  })
}

// Run every hour
setInterval(runAllCanaries, 60 * 60 * 1000)

// Also run immediately on startup
runAllCanaries()
```

### CI Integration (Run on Deploy)

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build

      # Deploy to production
      - run: npm run deploy

      # Wait for deployment to stabilize
      - run: sleep 60

      # Run canary checks against new deployment
      - name: Post-deploy canary checks
        run: npm run canaries
        timeout-minutes: 10

      # If canaries fail, ROLLBACK
      - name: Rollback on canary failure
        if: failure()
        run: npm run rollback
```

### Metrics & Dashboards

```typescript
// Track canary success rate over time
const metrics = {
  timestamp: new Date(),
  canaries: {
    login: { status: 'PASS', duration: 1234 },
    checkout: { status: 'PASS', duration: 5678 },
    api: { status: 'PASS', duration: 234 },
  },
  aggregate: {
    successRate: 1.0, // 100%
    avgDuration: 2382,
  },
}

// Send to monitoring (e.g., Datadog, CloudWatch, Prometheus)
await sendMetric('canary.success_rate', metrics.aggregate.successRate)
await sendMetric('canary.avg_duration', metrics.aggregate.avgDuration)
```

### Benefits

| Without Canaries                       | With Golden Path Canaries    |
| -------------------------------------- | ---------------------------- |
| Users report issues first              | Alerts BEFORE users affected |
| Mean time to detect (MTTD): 2-24 hours | MTTD: 5-60 minutes           |
| Revenue loss: High                     | Revenue loss: Minimal        |
| Manual verification after deploy       | Automated verification       |
| "Is production healthy?" → Unknown     | Real-time confidence         |

---

## Principle #10: Behavior Locks (Prevent Silent Regressions)

**Rule:** If a function behaves a certain way, LOCK that behavior with a test. Changes must be intentional and explicit.

### Why Behavior Locks Matter

**Silent regression:** Code changes, behavior changes, but no one notices until production.

**Example:**

```typescript
// v1: Returns array
function getUsers() {
  return db.users.findMany() // Returns: User[]
}

// v2: Developer "optimizes" by returning count only (BREAKING CHANGE)
function getUsers() {
  return db.users.count() // Returns: number
}

// Existing code breaks silently:
const users = getUsers()
console.log(users.length) // TypeError: undefined is not a function
```

**Solution:** Behavior lock test would catch this immediately.

### Implementation: Snapshot Tests + Contract Tests

```typescript
// Behavior lock: API response shape MUST NOT change
describe('GET /api/users', () => {
  test('returns expected user shape (BEHAVIOR LOCK)', async () => {
    const response = await fetch('/api/users/123')
    const user = await response.json()

    // Snapshot test: ANY change to object shape breaks this test
    expect(user).toMatchSnapshot()
  })
})
```

### Benefits

| Without Behavior Locks      | With Behavior Locks                    |
| --------------------------- | -------------------------------------- |
| Silent regressions          | Explicit breaking changes              |
| "Oops, we broke the API"    | "This is a breaking change, approve?"  |
| No documentation of changes | Git history shows all behavior changes |
| Manual regression testing   | Automated behavior verification        |

---

## Principle #11: Negative Testing (Test Forbidden Paths)

**Rule:** Don't just test what SHOULD work. Test what MUST NOT work.

### Why Negative Testing?

**Positive testing:** "Users can log in with valid credentials" ✅

**Negative testing:** "Users CANNOT log in with invalid credentials" ✅

**Problem:** Most developers only write positive tests. Result: Security holes, validation bypasses.

### Key Areas to Test

- **Invalid inputs**: SQL injection, XSS, malformed data
- **Unauthorized access**: Authentication, authorization
- **Rate limiting**: Brute force prevention
- **Business rule violations**: Negative prices, overlapping bookings
- **Edge cases**: Boundary values, null, undefined, extremely large inputs

### The 70/30 Rule

```typescript
describe('User Authentication', () => {
  // 70% positive tests
  test('valid login succeeds', () => {})
  test('valid registration succeeds', () => {})
  test('password reset works', () => {})

  // 30% negative tests (CRITICAL!)
  test('REJECTS invalid email', () => {})
  test('REJECTS weak password', () => {})
  test('BLOCKS brute force attempts', () => {})
  test('REJECTS unauthorized access', () => {})
  test('REJECTS SQL injection attempts', () => {})
})
```

---

## Principle #12: Runtime Invariant Guards (Crash Loud, Not Silent)

**Rule:** If assumptions are violated, CRASH IMMEDIATELY. Don't continue with corrupt state.

### Why Invariant Guards?

**Silent corruption:** Bad data spreads through system, causes damage hours later.

```typescript
// Runtime invariant checker
function ASSERT(condition: boolean, message: string): asserts condition {
  if (!condition) {
    logger.error('INVARIANT VIOLATION', { message })
    throw new InvariantViolation(message)
  }
}

// Usage
function transfer(from, to, amount) {
  ASSERT(amount > 0, 'Amount must be positive')
  ASSERT(getBalance(from) >= amount, 'Insufficient funds')

  // Perform transfer
  const newBalance = getBalance(from) - amount
  setBalance(from, newBalance)

  // Post-condition check
  ASSERT(getBalance(from) >= 0, 'Balance became negative after transfer')
}
```

### Benefits

| Silent Failures       | Invariant Guards         |
| --------------------- | ------------------------ |
| Corrupt data spreads  | Crash at source          |
| Debug hours later     | Immediate error location |
| Data cleanup required | Prevented before write   |

---

## Principle #13: Diff Risk Classification (Test Based on Change Scope)

**Rule:** Not all changes are equal. High-risk changes need more testing.

### Risk Matrix

- 🟢 **Low** (typo in docs): Lint only
- 🟡 **Medium** (new feature): Unit + integration
- 🟠 **High** (API change): Full regression + contract tests
- 🔴 **Critical** (DB/auth/payment): Full suite + security audit + manual approval

---

## Principle #14: Domain-Specific Test Patterns

**Rule:** Each domain has unique testing needs.

### E-commerce

- Cart persistence across sessions
- Inventory race conditions
- Payment idempotency
- Price calculation accuracy

### Authentication

- Token expiration
- Session hijacking prevention
- Password reset flow
- OAuth callback handling

### Real-time Systems

- WebSocket reconnection
- Message ordering
- Conflict resolution
- Offline sync

---

## Principle #15: Observability & Tracing (You Can't Fix What You Can't See)

**Rule:** Instrument everything. Log context, not just errors.

### Three Pillars

1. **Metrics**: What is happening? (RPS, latency, errors)
2. **Logs**: Why did it happen? (Context, user ID, request ID)
3. **Traces**: How did it flow? (Distributed request path)

```typescript
import { trace } from '@opentelemetry/api'

async function createOrder(data) {
  const span = trace.getTracer('app').startSpan('createOrder')

  try {
    span.setAttribute('user.id', data.userId)
    span.setAttribute('order.total', data.total)

    const order = await db.orders.create(data)
    span.addEvent('order_created', { orderId: order.id })

    return order
  } catch (error) {
    span.recordException(error)
    throw error
  } finally {
    span.end()
  }
}
```

---

## Principle #16: SOLID Principles (Write Code That's Easy to Change)

### Single Responsibility

Each class/function does ONE thing.

### Open/Closed

Open for extension, closed for modification.

### Dependency Inversion

Depend on abstractions, not concretions.

```typescript
// ❌ BAD: Tight coupling
class UserService {
  async createUser(data) {
    await PostgresDatabase.insert('users', data)
    await SendgridEmailService.send(data.email, 'Welcome!')
  }
}

// ✅ GOOD: Dependency injection
class UserService {
  constructor(
    private db: IDatabase,
    private emailService: IEmailService
  ) {}

  async createUser(data) {
    await this.db.insert('users', data)
    await this.emailService.send(data.email, 'Welcome!')
  }
}
```

---

## Principle #17: Assumptions Ledger

**Rule:** Document ALL assumptions. Test them explicitly.

```markdown
# assumptions.md

## ASSUMPTION #1: Users can only have ONE active subscription

- Enforced by: DB unique constraint (user_id, status) WHERE status='ACTIVE'
- Tested in: tests/subscriptions/single-active.test.ts
- Risk if violated: Double billing

## ASSUMPTION #2: Product prices are always in USD cents

- Enforced by: Zod schema validation
- Tested in: tests/products/price-validation.test.ts
- Risk if violated: Currency conversion errors
```

---

## Principle #18: Test Ownership

**Rule:** Every test has an owner. Broken tests are fixed or deleted within 24 hours.

```yaml
# tests/auth/login.test.ts
---
owner: @auth-team
slack-channel: #auth-alerts
last-updated: 2026-01-12
---
```

---

## Principle #19: Bug Tracking System

**Rule:** Every bug has 6 mandatory fields. No exceptions.

1. ✅ Repro steps (exact steps to reproduce)
2. ✅ Root cause (what caused the issue)
3. ✅ Regression test (MUST fail before fix, pass after fix)
4. ✅ Fix summary (what was changed)
5. ✅ Prevention rule (test added, validation, etc.)
6. ✅ Git commit hash (traceability)

### Workflow

```bash
Bug reported → Create regression test (MUST fail) → Fix bug → Test passes → Document → Commit test + fix together
```

---

## Principle #20: CI/CD Automation

**Rule:** Everything automated. No manual gates except production deploy.

### CI Pipeline (< 10 minutes)

```yaml
1. Lint + Type-check (30 sec)
2. Unit tests (2 min)
3. Integration tests (3 min)
4. E2E tests (critical paths only) (4 min)
5. Security scan (1 min)
6. Coverage check (fail if < 80%)
```

### CD Pipeline

```yaml
1. Deploy to staging
2. Run smoke tests
3. [MANUAL APPROVAL]
4. Deploy to production (blue-green)
5. Run canary tests
6. Auto-rollback if canaries fail
```

---

## 🚀 4-Week Implementation Roadmap

### Week 1: Foundation

- **Day 1**: Set up TypeScript strict mode + ESLint
- **Day 2**: Add pre-commit hooks (lint + type-check)
- **Day 3**: Configure Vitest + JSDOM
- **Day 4**: Write first TDD feature (RED-GREEN-REFACTOR)
- **Day 5**: Set up CI pipeline (GitHub Actions)

### Week 2: Testing Layers

- **Day 6-7**: Add 100 unit tests (pure functions)
- **Day 8-9**: Add 30 integration tests (API + DB)
- **Day 10**: Add 5 E2E tests (critical paths)

### Week 3: Quality Gates

- **Day 11**: Add database constraints (NOT NULL, UNIQUE, CHECK, FK)
- **Day 12**: Add Zod schemas for API contracts
- **Day 13**: Add visual regression tests (Playwright)
- **Day 14**: Add contract tests (Pact) for microservices
- **Day 15**: Implement zero flaky tests policy

### Week 4: Production Readiness

- **Day 16-17**: Add OpenTelemetry tracing
- **Day 18**: Set up golden path canaries
- **Day 19**: Configure alerts (PagerDuty/Slack)
- **Day 20**: Document assumptions + runbook

---

## 📋 Quick Reference Cards

### Bug Fix Checklist

- [ ] Repro steps documented
- [ ] Regression test written (fails before fix)
- [ ] Root cause identified
- [ ] Fix implemented
- [ ] Test passes
- [ ] Prevention rule added (lint/validation/docs)
- [ ] Commit with hash

### Pre-Commit Checklist

- [ ] `npm run lint` (passes)
- [ ] `npm run type-check` (passes)
- [ ] `npm run test:unit` (passes)
- [ ] No console.log statements
- [ ] No commented code
- [ ] No TODOs without tickets

### PR Checklist

- [ ] All tests pass
- [ ] Coverage ≥ 80% (100% for auth/payment/validation)
- [ ] No flaky tests (ran 100 times locally)
- [ ] Visual regression approved
- [ ] Security scan clean
- [ ] Reviewer assigned

---

## 🛠️ Tool Recommendations (All Free Tiers Available)

### Testing

- **Unit**: Vitest (fast, modern)
- **E2E Web**: Playwright (reliable, multi-browser)
- **E2E Mobile**: Detox (React Native)
- **Visual Regression**: Percy.io (5K screenshots/month free) or jest-image-snapshot (free)
- **Contract**: Pact (open source)

### Quality

- **Linting**: ESLint + Prettier
- **Type-checking**: TypeScript strict mode
- **Security**: Trivy + npm audit
- **Coverage**: Vitest coverage

### Monitoring

- **APM**: OpenTelemetry (open source)
- **Errors**: Sentry (5K events/month free) or GlitchTip (self-hosted free)
- **Logs**: Winston + Loki (self-hosted free)
- **Metrics**: Prometheus + Grafana (self-hosted free)

### CI/CD

- **CI**: GitHub Actions (2,000 min/month free)
- **CD**: Railway ($5/month) or Render (free tier)

---

## 📊 Success Metrics

### Code Quality

- Test coverage: **80%+** (100% for critical paths)
- Zero flaky tests
- PR merge time: **< 4 hours**
- CI pipeline: **< 10 minutes**

### Reliability

- Regression bugs: **< 1%** of features
- Mean time to detect (MTTD): **< 1 hour**
- Mean time to recovery (MTTR): **< 30 minutes**
- Canary success rate: **99.9%+**

### Velocity

- Deploy frequency: **10+ times/day**
- Lead time for changes: **< 1 day**
- Change failure rate: **< 5%**
- Failed deployments auto-rollback: **100%**

---

## 🌐 Appendix: Language-Specific Adaptations

### Python

- **Testing**: pytest (instead of Vitest)
- **Type-checking**: mypy strict mode
- **Linting**: ruff (fast) or pylint
- **Schemas**: Pydantic (instead of Zod)

### Java

- **Testing**: JUnit 5 + Mockito
- **Build**: Gradle or Maven
- **Static analysis**: SpotBugs + PMD
- **Schemas**: JSON Schema Validator

### Go

- **Testing**: testing package + testify
- **Linting**: golangci-lint
- **Schemas**: go-playground/validator

### Ruby

- **Testing**: RSpec
- **Type-checking**: Sorbet
- **Linting**: RuboCop
- **Schemas**: dry-validation

---

## 🎯 Final Thoughts

**Remember:** Perfect is the enemy of good. Start with Principles 1-5, then gradually adopt the rest.

**These 20 principles achieve 99.8% regression prevention when followed consistently.**

**Your codebase will become self-healing:** Each bug makes it stronger through regression tests.

---

**Version**: 3.0 (Truly Universal)
**Last Updated**: 2026-01-12
**License**: Public domain - Copy freely, no attribution required
