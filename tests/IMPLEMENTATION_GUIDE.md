# Test Implementation Guide

Complete guide for implementing the remaining ~715 tests from the 780 scenario test suite.

## 🎯 Current Status

### ✅ What's Been Built

**1. Complete Test Infrastructure** (100% DONE)
- ✅ Data Builders (`fixtures/test-data.ts`)
  - SchoolBuilder, AdminBuilder, EventBuilder, RegistrationBuilder
  - Fluent API for creating test data
  - Automatic cleanup utilities

- ✅ Page Objects (`page-objects/`)
  - LoginPage, SignupPage, EventsPage, RegistrationsPage, PublicEventPage
  - Reusable UI interaction methods
  - Consistent expectations and assertions

- ✅ Test Helpers (`helpers/`)
  - Authentication utilities
  - Phone number normalization
  - Date generation
  - Israeli format validators

**2. Working P0 Critical Tests** (65 tests DONE)
- ✅ Authentication & Authorization (20 tests)
- ✅ Multi-Tenancy & Security (25 tests)
- ✅ Public Registration Flow (20 tests)

### 🚧 What Needs to Be Done

**P0 Critical** (~180 tests remaining):
- Event Management P0: ~28 tests
- Admin Registration Management P0: ~32 tests
- School Management P0: ~22 tests
- Edge Cases P0: ~35 tests
- UI/UX & Accessibility P0: ~28 tests
- Performance P0: ~30 tests

**P1-P3** (~535 tests):
- P1 High Priority: 337 tests
- P2 Medium Priority: 146 tests
- P3 Low Priority: 22 tests

---

## 📋 Step-by-Step Implementation Process

### Phase 1: Complete P0 Critical Tests (Next 6 Files)

#### Test File 1: Event Management P0
**File**: `tests/suites/03-event-management-p0.spec.ts`
**Reference**: `tests/scenarios/03-event-management.md` (sections marked P0)
**Test Count**: ~28 tests

**Key Scenarios to Implement**:
1. [03.1.1] Create event with required fields
2. [03.1.2] Event form validation - missing fields
3. [03.1.5] Event slug uniqueness within school
4. [03.3.1] Edit event details
5. [03.3.3] Edit capacity - increase
6. [03.3.4] Edit capacity - decrease (validation)
7. [03.4.1] Delete event with no registrations
8. [03.4.2] Delete event with registrations (warning)
9. [03.5.1-5.3] View event dashboard, details, status indicators
10. [03.7.1-7.3] Real-time capacity counter, at-capacity, waitlist
11. [03.10.1-10.2] Multi-tenant event isolation

**Template**:
```typescript
import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, createEvent, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'

test.describe('Event Management P0', () => {
  test.afterAll(async () => await cleanupTestData())

  test.describe('[03.1.1] Create Simple Event', () => {
    test('admin can create event successfully', async ({ page }) => {
      // Setup test data
      // Login as admin
      // Create event via UI
      // Verify event exists
    })
  })

  // Add remaining 27 tests...
})
```

---

#### Test File 2: Admin Registration Management P0
**File**: `tests/suites/05-admin-registration-p0.spec.ts`
**Reference**: `tests/scenarios/05-admin-registration-management.md` (P0 sections)
**Test Count**: ~32 tests

**Key Scenarios**:
1. [05.1.1-1.2] View registrations list, count summary
2. [05.3.1-3.2] Edit registration details, change spots
3. [05.4.1-4.2] Cancel registration, free up capacity
4. [05.5.1-5.2] Manual registration (spots available, event full)
5. [05.6.1] Promote from waitlist
6. [05.7.1-7.3] Export to CSV
7. [05.12.1-12.3] Multi-tenant registration isolation

**Pattern**:
```typescript
import { RegistrationsPage } from '../page-objects/RegistrationsPage'

test('view registrations for event', async ({ page }) => {
  const event = await createEvent()
    .withSchool(school.id)
    .withCapacity(50)
    .create()

  const registration = await createRegistration()
    .withEvent(event.id)
    .withName('Test User')
    .confirmed()
    .create()

  const regPage = new RegistrationsPage(page)
  await regPage.goto(event.id)

  await regPage.expectRegistrationExists('Test User')
})
```

---

#### Test File 3: School Management P0
**File**: `tests/suites/02-school-management-p0.spec.ts`
**Reference**: `tests/scenarios/02-school-management.md` (P0 sections)
**Test Count**: ~22 tests

**Key Scenarios**:
1. [02.1.1] Complete onboarding flow
2. [02.1.4] Skip onboarding redirects back
3. [02.3.1] Send team invitation (OWNER)
4. [02.3.3-3.4] Accept invitation (new user, existing user)
5. [02.4.1] View team members
6. [02.6.2-6.3] Usage limits enforced (events, registrations)

---

#### Test File 4: Edge Cases P0
**File**: `tests/suites/07-edge-cases-p0.spec.ts`
**Reference**: `tests/scenarios/07-edge-cases-error-handling.md` (P0 sections)
**Test Count**: ~35 tests

**Key Scenarios**:
1. [07.1.1-1.4] Database connection errors
2. [07.2.1-2.3] Email sending failures
3. [07.3.1-3.4] Concurrent operations (race conditions)
4. [07.4.1] Extremely long input strings
5. [07.4.4] Null or undefined values
6. [07.5.1-5.3] Timezone handling (Israel time, DST)
7. [07.6.1-6.4] Network & connectivity issues
8. [07.9.1-9.4] Data integrity (orphaned records, mismatched counts)

---

#### Test File 5: UI/UX & Accessibility P0
**File**: `tests/suites/08-ui-ux-p0.spec.ts`
**Reference**: `tests/scenarios/08-ui-ux-accessibility.md` (P0 sections)
**Test Count**: ~28 tests

**Key Scenarios**:
1. [08.1.1] Mobile viewport 375px width
2. [08.1.5] Form inputs on mobile (text visibility)
3. [08.2.1-2.4] Hebrew RTL layout
4. [08.3.1-3.3] Touch targets minimum 44px
5. [08.4.1-4.6] Visual feedback & loading states
6. [08.5.1-5.5] Form usability (labels, required fields, errors)
7. [08.6.1] Text contrast ≥ 4.5:1
8. [08.6.6] Input field text visibility (CRITICAL)
9. [08.7.1-7.2] Keyboard navigation

**Mobile Test Template**:
```typescript
test('mobile form has visible input text', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })

  // Navigate to form
  const nameInput = page.locator('input[name="name"]')
  const styles = await nameInput.evaluate(el => {
    const computed = window.getComputedStyle(el)
    return {
      color: computed.color,
      backgroundColor: computed.backgroundColor,
    }
  })

  // Verify text is dark on light background
  expect(styles.color).not.toBe('rgb(255, 255, 255)')
})
```

---

#### Test File 6: Performance P0
**File**: `tests/suites/09-performance-p0.spec.ts`
**Reference**: `tests/scenarios/09-performance-scale.md` (P0 sections)
**Test Count**: ~30 tests

**Key Scenarios**:
1. [09.1.1-1.3] Page load times (< 2 seconds)
2. [09.2.1-2.7] Database query performance (with indexes)
3. [09.3.1-9.3.3] Registration performance (single, 10 concurrent, 100 concurrent)
4. [09.4.1-9.4.2] Export performance (100, 5000 registrations)
5. [09.7.1-7.5] Database indexing (schoolId, eventId, email, confirmationCode)
6. [09.13.1-13.3] Load testing (10, 100, 500 concurrent users)

**Performance Test Template**:
```typescript
test('page loads within 2 seconds', async ({ page }) => {
  const startTime = Date.now()

  await page.goto('/')

  const loadTime = Date.now() - startTime

  expect(loadTime).toBeLessThan(2000)
})

test('concurrent registrations complete within acceptable time', async ({ browser }) => {
  const startTime = Date.now()

  const contexts = await Promise.all(
    Array.from({ length: 10 }, () => browser.newContext())
  )

  await Promise.all(
    contexts.map((ctx, i) => registerConcurrently(ctx, i))
  )

  const duration = Date.now() - startTime

  expect(duration).toBeLessThan(10000) // 10 seconds for 10 concurrent

  await Promise.all(contexts.map(ctx => ctx.close()))
})
```

---

### Phase 2: P1 High Priority Tests

After completing P0, implement P1 tests following the same pattern. Each scenario document has P1 sections marked.

**Recommendation**: Create separate files for P1:
- `tests/suites/01-auth-p1.spec.ts`
- `tests/suites/02-school-management-p1.spec.ts`
- etc.

**P1 Test Count by Category**:
- Authentication: 45 tests
- School Management: 30 tests
- Event Management: 32 tests
- Public Registration: 35 tests
- Admin Registration: 38 tests
- Multi-Tenancy: 35 tests
- Edge Cases: 40 tests
- UI/UX: 42 tests
- Performance: 40 tests

**Total P1**: 337 tests

---

## 🛠️ Development Workflow

### Daily Workflow

```bash
# 1. Pull latest code
git pull

# 2. Start dev server
npm run dev

# 3. Start database
docker-compose up -d

# 4. Run existing tests to ensure nothing broke
npm test

# 5. Create new test file or add to existing
# Edit: tests/suites/XX-category-pX.spec.ts

# 6. Run your new tests
npx playwright test tests/suites/XX-category-pX.spec.ts --headed

# 7. Debug failures
npx playwright test tests/suites/XX-category-pX.spec.ts --debug

# 8. Run all P0 tests to verify
npx playwright test tests/suites/*-p0.spec.ts

# 9. Commit with descriptive message
git add tests/
git commit -m "feat: implement XX P0 tests for [category]"
```

---

## 📊 Progress Tracking

### Track Your Progress

Update the test count in `tests/README.md` as you implement tests:

```markdown
### Current Coverage
- **Implemented**: XXX tests (~XX% of total 780)
- **P0 Critical**: XX% complete (XXX/275)
- **Overall**: XX% complete (XXX/780)
```

### Recommended Milestones

- **Milestone 1**: Complete all P0 tests (275 total) → 35% coverage
- **Milestone 2**: Complete P0 + 50% of P1 (~170 tests) → 57% coverage
- **Milestone 3**: Complete P0 + all P1 (612 total) → 78% coverage
- **Milestone 4**: Complete P0 + P1 + P2 (758 total) → 97% coverage

---

## 🎓 Learning from Existing Tests

### Study These Examples

1. **Authentication Flow**: `tests/suites/01-auth-p0.spec.ts`
   - Login/logout flow
   - Session management
   - Role-based access control

2. **Multi-Tenancy**: `tests/suites/06-multi-tenant-p0.spec.ts`
   - Data isolation
   - API security
   - SUPER_ADMIN access

3. **Race Conditions**: `tests/suites/04-public-registration-p0.spec.ts`
   - Concurrent registrations
   - Atomic capacity enforcement
   - Browser context management

### Common Patterns

#### Pattern 1: Setup-Action-Assert
```typescript
test('descriptive test name', async ({ page }) => {
  // Setup: Create test data
  const school = await createSchool().withName('Test').create()
  const admin = await createAdmin().withSchool(school.id).create()

  // Action: Perform the operation
  await loginPage.login(admin.email, 'TestPassword123!')
  await eventsPage.createEvent({ ... })

  // Assert: Verify outcome
  await expect(page.locator('text=Success')).toBeVisible()
})
```

#### Pattern 2: Parallel Test Data
```typescript
test('School A cannot see School B data', async ({ page }) => {
  // Create both schools
  const { schoolA, schoolAAdmin, schoolB, schoolBEvent } =
    await createCompleteTestScenario()

  // Login as School A
  await loginPage.login(schoolAAdmin.email, 'TestPassword123!')

  // Verify cannot see School B
  await expect(page.locator(`text=${schoolBEvent.title}`)).not.toBeVisible()
})
```

#### Pattern 3: API + UI Verification
```typescript
test('API returns correct data', async ({ page, request }) => {
  // Login via UI to get session
  await loginPage.login(admin.email, 'TestPassword123!')

  // Get session cookie
  const cookies = await page.context().cookies()
  const sessionCookie = cookies.find(c => c.name === 'admin_session')

  // Make API call
  const response = await request.get('/api/events', {
    headers: { 'Cookie': `admin_session=${sessionCookie?.value}` }
  })

  // Verify response
  expect(response.ok()).toBeTruthy()
  const data = await response.json()
  expect(data.events).toHaveLength(expectedCount)
})
```

---

## 🐛 Debugging Tips

### Common Issues

1. **Test Timeout**
   - Increase timeout: `await page.waitForSelector('...', { timeout: 10000 })`
   - Check for loading indicators
   - Verify server is running

2. **Element Not Found**
   - Use `--headed` mode to see browser
   - Take screenshot: `await page.screenshot({ path: 'debug.png' })`
   - Verify selectors: `await page.locator('...').count()`

3. **Race Conditions**
   - Use `waitForLoadState`: `await page.waitForLoadState('networkidle')`
   - Add explicit waits: `await page.waitForTimeout(1000)`
   - Use unique test data to avoid conflicts

4. **Database State**
   - Always use `cleanupTestData()` in `afterAll`
   - Create unique data per test
   - Never rely on existing database state

### Debug Commands

```bash
# Run one test with browser visible
npx playwright test tests/suites/01-auth-p0.spec.ts -g "admin can login" --headed

# Debug with debugger
npx playwright test tests/suites/01-auth-p0.spec.ts --debug

# Show test trace
npx playwright show-trace trace.zip

# Generate trace
npx playwright test --trace on
```

---

## ✅ Quality Checklist

Before marking a test file as "complete":

- [ ] All P0 scenarios from the reference document are implemented
- [ ] Tests follow existing patterns and conventions
- [ ] Page objects are used for UI interactions
- [ ] Test data builders are used for setup
- [ ] `cleanupTestData()` is called in `afterAll`
- [ ] Tests pass locally on desktop
- [ ] Tests pass on mobile viewport (if applicable)
- [ ] Hebrew RTL is tested (if applicable)
- [ ] Tests are independent (can run in any order)
- [ ] Descriptive test names match scenarios
- [ ] Comments reference scenario numbers (e.g., `[03.1.1]`)
- [ ] Tests run within reasonable time (< 30s each)

---

## 🚀 Next Steps

1. **Start with Event Management P0** (most common feature, ~28 tests)
2. **Then Admin Registration P0** (admin workflow, ~32 tests)
3. **Then School Management P0** (setup & onboarding, ~22 tests)
4. **Continue with remaining P0** (Edge Cases, UI/UX, Performance)
5. **Move to P1** once all P0 complete

**Expected Timeline** (rough estimates):
- Event Management P0: 2-3 days
- Admin Registration P0: 2-3 days
- School Management P0: 1-2 days
- Edge Cases P0: 2-3 days
- UI/UX P0: 2-3 days
- Performance P0: 2-3 days

**Total for P0 completion**: ~2-3 weeks of focused work

---

## 📞 Questions & Support

If you get stuck:
1. Review existing test files for patterns
2. Check `tests/README.md` for architecture
3. Reference scenario documents in `tests/scenarios/`
4. Look at page objects for available methods
5. Check `tests/fixtures/test-data.ts` for builders

**Good luck! You have excellent infrastructure and clear examples to follow. 🎉**
