# TicketCap Test Suite

Comprehensive Playwright E2E test suite implementing all 780 scenarios from `/tests/scenarios/`.

## 📊 Current Status

### ✅ Completed (Infrastructure + 65 P0 Tests)

- **Test Infrastructure** ✅ COMPLETE
  - Fixtures: Data builders for schools, admins, events, registrations
  - Page Objects: Reusable UI interactions (Login, Signup, Events, Registrations, Public Event)
  - Helpers: Authentication helpers, test utilities, phone normalization
  - Database cleanup utilities

- **P0 Critical Tests Implemented** ✅ ~65 tests
  - `suites/01-auth-p0.spec.ts` - Authentication & Authorization (~20 tests)
  - `suites/06-multi-tenant-p0.spec.ts` - Multi-Tenancy & Security (~25 tests)
  - `suites/04-public-registration-p0.spec.ts` - Public Registration Flow (~20 tests)

### 🚧 Remaining Work (~715 tests)

- **P0 Critical** (~180 tests remaining):
  - Event Management P0 (~28 tests)
  - Admin Registration Management P0 (~32 tests)
  - School Management P0 (~22 tests)
  - Edge Cases & Error Handling P0 (~35 tests)
  - UI/UX & Accessibility P0 (~28 tests)
  - Performance P0 (~30 tests)

- **P1 High Priority** (~337 tests)
- **P2 Medium Priority** (~146 tests)
- **P3 Low Priority** (~22 tests)

---

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure development server is running on port 9000
npm run dev

# In another terminal, ensure database is running
docker-compose up -d
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npx playwright test tests/suites/01-auth-p0.spec.ts

# Run with UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Run on mobile
npm run test:mobile

# Run with debug
npm run test:debug
```

### Running Critical Tests Only

```bash
npx playwright test tests/suites/*-p0.spec.ts
```

---

## 📁 Project Structure

```
tests/
├── README.md (this file)
├── fixtures/
│   └── test-data.ts              # Data builders (SchoolBuilder, AdminBuilder, etc.)
├── helpers/
│   ├── auth-helpers.ts           # Authentication utilities
│   └── test-helpers.ts           # General test utilities
├── page-objects/
│   ├── LoginPage.ts              # Login page interactions
│   ├── SignupPage.ts             # Signup page interactions
│   ├── EventsPage.ts             # Admin events page
│   ├── RegistrationsPage.ts     # Admin registrations page
│   └── PublicEventPage.ts       # Public registration page
├── suites/
│   ├── 01-auth-p0.spec.ts        # ✅ P0 Authentication tests
│   ├── 04-public-registration-p0.spec.ts  # ✅ P0 Public registration
│   ├── 06-multi-tenant-p0.spec.ts         # ✅ P0 Multi-tenancy
│   └── [TO BE CREATED]           # Remaining test suites
├── scenarios/                     # Test scenario documentation (780 scenarios)
│   ├── README.md                 # Scenario overview
│   ├── 01-authentication-authorization.md
│   ├── 02-school-management.md
│   ├── 03-event-management.md
│   ├── 04-public-registration-flow.md
│   ├── 05-admin-registration-management.md
│   ├── 06-multi-tenancy-security.md
│   ├── 07-edge-cases-error-handling.md
│   ├── 08-ui-ux-accessibility.md
│   └── 09-performance-scale.md
├── critical/                      # Legacy critical tests (reference)
│   ├── multi-tenant-isolation.spec.ts
│   ├── atomic-capacity.spec.ts
│   └── [other legacy tests]
└── [Various debug/experimental tests]
```

---

## 🏗️ Architecture & Patterns

### Data Builders Pattern

Use fluent builder pattern for creating test data:

```typescript
import { createSchool, createAdmin, createEvent, createRegistration } from '../fixtures/test-data'

// Create school
const school = await createSchool()
  .withName('Test School')
  .withSlug('test-school-123')
  .withPlan('STARTER')
  .create()

// Create admin
const admin = await createAdmin()
  .withEmail('admin@test.com')
  .withPassword('Password123!')
  .withRole('ADMIN')
  .withSchool(school.id)
  .create()

// Create event
const event = await createEvent()
  .withTitle('Test Event')
  .withCapacity(50)
  .withSchool(school.id)
  .inFuture()
  .create()

// Create registration
const registration = await createRegistration()
  .withName('Test User')
  .withEvent(event.id)
  .confirmed()
  .create()
```

### Page Objects Pattern

Use page objects for UI interactions:

```typescript
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'
import { PublicEventPage } from '../page-objects/PublicEventPage'

// Login
const loginPage = new LoginPage(page)
await loginPage.goto()
await loginPage.login('admin@test.com', 'Password123!')

// Manage events
const eventsPage = new EventsPage(page)
await eventsPage.goto()
await eventsPage.createEvent({
  title: 'New Event',
  startDate: '2025-12-25',
  startTime: '18:00',
  capacity: 100,
  location: 'Test Location',
})

// Public registration
const publicPage = new PublicEventPage(page)
await publicPage.goto('school-slug', 'event-slug')
await publicPage.register({
  name: 'Test User',
  email: 'test@test.com',
  phone: '0501234567',
})
await publicPage.expectConfirmation()
```

### Test Cleanup

Always clean up test data:

```typescript
import { cleanupTestData } from '../fixtures/test-data'

test.afterAll(async () => {
  await cleanupTestData() // Deletes all test data (emails with @test.com, slugs starting with test-)
})
```

---

## 📝 Implementing Remaining Tests

### Step-by-Step Guide

1. **Choose a scenario category** from `/tests/scenarios/`
2. **Create a new test file** in `/tests/suites/`
3. **Reference the scenario document** for test cases
4. **Use existing patterns** from implemented tests
5. **Follow the template below**

### Template for New Test Suite

```typescript
import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { EventsPage } from '../page-objects/EventsPage'
import { generateEmail } from '../helpers/test-helpers'

/**
 * [Priority] [Category] Tests
 * Ref: tests/scenarios/XX-category-name.md
 */

test.describe('[Category] [Priority] - [Description]', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[Scenario.Section.Number] Section Name', () => {
    test('test description from scenario', async ({ page }) => {
      // Setup: Create test data
      const school = await createSchool().withName('Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('test'))
        .withPassword('TestPassword123!')
        .withSchool(school.id)
        .create()

      // Action: Perform test steps
      // ... your test code here

      // Assert: Verify expected outcome
      await expect(page.locator('...')).toBeVisible()
    })
  })
})
```

### Example: Implementing Event Management P0

```typescript
// File: tests/suites/03-event-management-p0.spec.ts

import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'
import { generateEmail, getFutureDate } from '../helpers/test-helpers'

test.describe('Event Management P0 - Critical Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test.describe('[03.1.1] Create Simple Event', () => {
    test('admin can create event with required fields', async ({ page }) => {
      // Setup
      const school = await createSchool().withName('Event Test School').create()
      const admin = await createAdmin()
        .withEmail(generateEmail('event'))
        .withPassword('TestPassword123!')
        .withRole('ADMIN')
        .withSchool(school.id)
        .create()

      // Login
      const loginPage = new LoginPage(page)
      await loginPage.goto()
      await loginPage.login(admin.email, 'TestPassword123!')

      // Create event
      const eventsPage = new EventsPage(page)
      await eventsPage.gotoNewEvent()
      await eventsPage.createEvent({
        title: 'Test Event',
        startDate: getFutureDate(7),
        startTime: '18:00',
        capacity: 50,
        location: 'Test Location',
      })

      // Verify
      await eventsPage.expectEventExists('Test Event')
    })
  })

  test.describe('[03.1.2] Event Form Validation', () => {
    test('cannot create event with missing required fields', async ({ page }) => {
      // TODO: Implement this test
      // Ref: scenarios/03-event-management.md section 03.1.2
    })
  })

  // Add more tests following the scenario document...
})
```

---

## 🎯 Priority Implementation Order

### Phase 1: Complete P0 Critical (Next 180 tests)

1. **Event Management P0** (~28 tests) - Core CRUD operations
2. **Admin Registration Management P0** (~32 tests) - Admin managing registrations
3. **School Management P0** (~22 tests) - Onboarding, team management
4. **Edge Cases P0** (~35 tests) - Database failures, race conditions
5. **UI/UX P0** (~28 tests) - Mobile, RTL, accessibility
6. **Performance P0** (~30 tests) - Load times, capacity testing

### Phase 2: P1 High Priority (337 tests)

Follow same pattern for P1 scenarios from each category

### Phase 3: P2 Medium Priority (146 tests)

Implement medium priority scenarios

### Phase 4: P3 Low Priority (22 tests)

Nice-to-have features and edge cases

---

## 🧪 Test Data Management

### Generated Test Data

All test data uses:

- Emails: `test-{timestamp}-{random}@test.com`
- School slugs: `test-school-{timestamp}`
- Event slugs: `test-event-{timestamp}`

### Cleanup Strategy

The `cleanupTestData()` function removes:

- All registrations with emails containing `@test.com`
- All events with slugs starting with `test-`
- All admins with emails containing `@test.com`
- All schools with slugs starting with `test-`

### Database State

Tests should be idempotent and not depend on specific database state. Each test creates its own data and cleans up after.

---

## 🔧 Useful Commands

### Database Management

```bash
# Check database schema
npx prisma studio

# Run migrations
npm run db:migrate

# Reset database (development only!)
npx prisma migrate reset
```

### Test Debugging

```bash
# Run single test with debug
npx playwright test tests/suites/01-auth-p0.spec.ts -g "admin can login" --debug

# Show browser
npx playwright test --headed

# Show test report
npx playwright show-report
```

### Performance Testing

```bash
# Run performance tests only
npx playwright test tests/suites/09-performance-p0.spec.ts

# Run with trace (for debugging slow tests)
npx playwright test --trace on
```

---

## 📊 Test Metrics

### Current Coverage

- **Implemented**: 65 tests (~8% of total 780)
- **Infrastructure**: 100% complete
- **P0 Critical**: ~24% complete (65/275)
- **Overall**: ~8% complete (65/780)

### Target Coverage

- **Critical Path** (P0): 100% (275 tests)
- **High Priority** (P1): 80% (~270 tests)
- **Medium Priority** (P2): 50% (~73 tests)
- **Low Priority** (P3): 30% (~7 tests)

**Total Target**: ~625 tests (80% of 780 scenarios)

---

## 🐛 Known Issues & Workarounds

### Issue: Race Conditions in Concurrent Tests

**Workaround**: Use separate browser contexts and unique test data per test

### Issue: Hebrew Text Rendering

**Workaround**: Check for `dir="rtl"` attribute and ensure proper character encoding

### Issue: Session Cookie in API Tests

**Solution**: Extract cookie from page context after login:

```typescript
const cookies = await page.context().cookies()
const sessionCookie = cookies.find((c) => c.name === 'admin_session')
```

---

## 📚 Resources

- **Scenario Documentation**: `/tests/scenarios/README.md`
- **CLAUDE.md**: Project architecture and patterns
- **Playwright Docs**: https://playwright.dev
- **Test Infrastructure**: `/tests/fixtures/`, `/tests/helpers/`, `/tests/page-objects/`

---

## 🤝 Contributing Tests

1. **Read the scenario document** for the category you're implementing
2. **Follow existing patterns** from completed test files
3. **Use page objects and helpers** for reusability
4. **Add cleanup** in `test.afterAll()` block
5. **Run tests locally** before committing
6. **Document any new patterns** in this README

---

## 🎓 Examples for Common Scenarios

### Testing Multi-Tenancy

```typescript
// Create two schools with data
const { schoolA, schoolAAdmin, schoolB, schoolBEvent } = await createCompleteTestScenario()

// Login as School A
await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

// Try to access School B resource - should fail
const response = await page.goto(`/admin/events/${schoolBEvent.id}`)
expect([403, 404]).toContain(response?.status())
```

### Testing Concurrent Registrations

```typescript
// Create multiple browser contexts
const contexts = await Promise.all([
  browser.newContext(),
  browser.newContext(),
  browser.newContext(),
])

// Run registrations in parallel
await Promise.all(contexts.map((ctx, i) => registerUser(ctx, i)))

// Verify atomic capacity enforcement
expect(confirmedCount + waitlistCount).toBe(totalAttempts)
```

### Testing Mobile UI

```typescript
// Set mobile viewport
await page.setViewportSize({ width: 375, height: 667 })

// Test touch targets
const button = page.locator('button[type="submit"]')
const box = await button.boundingBox()
expect(box?.height).toBeGreaterThanOrEqual(44)
```

---

## ✅ Checklist for New Test Suites

- [ ] Read corresponding scenario document
- [ ] Create test file in `/tests/suites/` following naming convention
- [ ] Import necessary fixtures and page objects
- [ ] Add `test.afterAll()` cleanup
- [ ] Implement P0 tests first
- [ ] Use descriptive test names matching scenarios
- [ ] Add scenario reference numbers in test.describe()
- [ ] Test on both desktop and mobile (where applicable)
- [ ] Verify tests pass locally
- [ ] Update this README with test count

---

**Last Updated**: 2025-12-05
**Test Coverage**: 65/780 tests (8%)
**P0 Coverage**: 65/275 tests (24%)
