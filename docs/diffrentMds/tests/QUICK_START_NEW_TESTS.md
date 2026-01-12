# Quick Start Guide - Running New Event Management Tests

## TL;DR - Run Tests Now

```bash
# Run all 3 new test suites (~45 tests)
npx playwright test tests/suites/08-event-tabs-navigation-p0.spec.ts tests/suites/09-sse-realtime-updates-p0.spec.ts tests/suites/10-mobile-event-management-p0.spec.ts

# Or use the UI (recommended for first run)
npm run test:ui
# Then select the test files in the UI
```

---

## What Was Created

### 3 New Test Suites (P0 Critical)

1. **08-event-tabs-navigation-p0.spec.ts** (15 tests, 569 lines)
   - Tab switching between Overview/Registrations/Check-In/Reports
   - URL parameter synchronization (?tab=registrations)
   - Keyboard navigation (Arrow keys, Home, End)
   - Accessibility (ARIA attributes)

2. **09-sse-realtime-updates-p0.spec.ts** (15 tests, 659 lines)
   - SSE connection establishment
   - Real-time registration updates (2-4 second latency)
   - Toast notifications
   - Green highlights and NEW badges
   - Auto-reconnection logic
   - Multiple admins scenario

3. **10-mobile-event-management-p0.spec.ts** (15 tests, 744 lines)
   - Bottom sheet on mobile
   - Floating Action Button (FAB)
   - Responsive design (mobile vs desktop)
   - Touch interactions

**Total:** ~45 tests, 1,972 lines of code

---

## Prerequisites

### 1. Start Development Server
```bash
npm run dev
# Server must be running on http://localhost:9000
```

### 2. Database Running
```bash
docker-compose up -d
# PostgreSQL must be running
```

### 3. Install Dependencies (if not already)
```bash
npm install
npx playwright install
```

---

## Running Tests

### Option 1: UI Mode (Recommended)
Best for viewing test execution step-by-step:
```bash
npm run test:ui
```

Then:
1. Select test file on left sidebar
2. Click test to run
3. See live browser on right side
4. Debug with time travel

### Option 2: Headed Mode
See browser while tests run:
```bash
npx playwright test --headed tests/suites/08-event-tabs-navigation-p0.spec.ts
```

### Option 3: Headless (CI/CD Mode)
Fast execution without browser UI:
```bash
npx playwright test tests/suites/08-event-tabs-navigation-p0.spec.ts
```

### Option 4: Run All P0 Tests
Includes existing + new tests:
```bash
npx playwright test tests/suites/*-p0.spec.ts
```

---

## Run Specific Test Categories

### Tab Navigation Only
```bash
npx playwright test tests/suites/08-event-tabs-navigation-p0.spec.ts -g "Tab Switching"
```

### SSE Real-Time Updates Only
```bash
npx playwright test tests/suites/09-sse-realtime-updates-p0.spec.ts -g "Real-Time"
```

### Mobile Bottom Sheet Only
```bash
npx playwright test tests/suites/10-mobile-event-management-p0.spec.ts -g "Bottom Sheet"
```

---

## Understanding Test Output

### ✅ Success
```
✓ should switch between all tabs correctly (2.3s)
✓ should update URL with ?tab parameter when switching tabs (1.8s)
```

### ❌ Failure
```
✗ should show new registration in admin dashboard within 2-4 seconds (5.2s)
  Expected: 1
  Received: 0
```

### 🔍 Debugging Failed Tests
```bash
# Run failed test with trace
npx playwright test --trace on tests/suites/09-sse-realtime-updates-p0.spec.ts

# Open trace viewer
npx playwright show-trace test-results/[test-name]/trace.zip
```

---

## Common Issues & Solutions

### ❌ Test Timeout
**Error:** `Timeout 30000ms exceeded`

**Solution:**
```bash
# Increase timeout for specific test
npx playwright test --timeout 60000 tests/suites/09-sse-realtime-updates-p0.spec.ts
```

### ❌ Server Not Running
**Error:** `net::ERR_CONNECTION_REFUSED`

**Solution:**
```bash
# Start dev server in separate terminal
npm run dev
```

### ❌ Database Connection Error
**Error:** `Can't reach database server`

**Solution:**
```bash
# Start PostgreSQL
docker-compose up -d

# Verify it's running
docker ps | grep ticketcap-db
```

### ❌ Stale Test Data
**Error:** `Duplicate key error` or `Registration already exists`

**Solution:**
```bash
# Clean up test data manually
npx prisma studio
# Delete records with email containing "@test.com"
```

---

## Test Data Cleanup

Tests automatically clean up after themselves, but if needed:

```typescript
// Manual cleanup in test
test.afterAll(async () => {
  await cleanupTestData() // Removes all test-* data
})
```

Or via Prisma Studio:
```bash
npx prisma studio
# Navigate to tables (School, Admin, Event, Registration)
# Delete records with test data (email: *@test.com, slug: test-*)
```

---

## Test Structure (For Reference)

### Typical Test Pattern
```typescript
test('should do something', async ({ page }) => {
  // 1. Setup - Create test data
  const school = await createSchool().withName('Test School').create()
  const admin = await createAdmin()
    .withEmail(generateEmail('test'))
    .withPassword('TestPassword123!')
    .withSchool(school.id)
    .create()

  // 2. Login
  const loginPage = new LoginPage(page)
  await loginPage.goto()
  await loginPage.login(admin.email, 'TestPassword123!')

  // 3. Navigate to feature
  await page.goto('/admin/events')

  // 4. Perform action
  await page.click('button:has-text("Create Event")')

  // 5. Assert result
  await expect(page.locator('text=Event created')).toBeVisible()
})
```

---

## Mobile Testing

### Run on Mobile Viewports
```bash
# Run mobile tests only
npx playwright test tests/suites/10-mobile-event-management-p0.spec.ts --project="Mobile Chrome"

# Or both mobile browsers
npx playwright test tests/suites/10-mobile-event-management-p0.spec.ts --project="Mobile Chrome" --project="Mobile Safari"
```

### Mobile Viewport Sizes
- **Mobile Chrome (Pixel 5):** 393 x 851
- **Mobile Safari (iPhone 12):** 390 x 844
- **Tests use iPhone SE:** 375 x 667 (minimum size)

---

## SSE Testing (Special Notes)

### How SSE Tests Work

1. **Admin Page** - Opens Registrations tab, establishes SSE connection
2. **Public Page** - Submits new registration
3. **Admin Page** - Receives update via SSE within 2-4 seconds

### Multi-Context Pattern
```typescript
// Admin context (main page)
await page.goto(`/admin/events/${event.id}?tab=registrations`)

// Public context (separate browser)
const publicContext = await browser.newContext()
const publicPage = await publicContext.newPage()
await publicPage.goto(`/p/${school.slug}/${event.slug}`)
await publicPage.fill('input[name="name"]', 'Test User')
await publicPage.click('button[type="submit"]')

// Admin receives update
await page.waitForTimeout(4000) // Wait for SSE
await expect(page.locator('text=Test User')).toBeVisible()
```

---

## Debugging Tips

### 1. Use --debug Flag
```bash
npx playwright test --debug tests/suites/08-event-tabs-navigation-p0.spec.ts
```
Opens Playwright Inspector for step-by-step debugging.

### 2. Add Console Logs
```typescript
test('debug test', async ({ page }) => {
  page.on('console', msg => console.log('BROWSER:', msg.text()))

  await page.goto('/admin/events')
  // Logs appear in terminal
})
```

### 3. Take Screenshots
```typescript
test('failing test', async ({ page }) => {
  await page.goto('/admin/events')
  await page.screenshot({ path: 'debug-screenshot.png' })
})
```

### 4. Pause Test Execution
```typescript
test('pause test', async ({ page }) => {
  await page.goto('/admin/events')
  await page.pause() // Opens Playwright Inspector
})
```

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: docker-compose up -d
      - run: npm run build
      - run: npm run test
```

---

## Next Steps

### After Tests Pass
1. ✅ Review test coverage in Playwright HTML report:
   ```bash
   npx playwright show-report
   ```

2. ✅ Run full test suite to ensure no regressions:
   ```bash
   npm test
   ```

3. ✅ Commit test files:
   ```bash
   git add tests/suites/08-*.spec.ts tests/suites/09-*.spec.ts tests/suites/10-*.spec.ts
   git commit -m "test: add event management E2E tests (tabs, SSE, mobile)"
   ```

### If Tests Fail
1. ❌ Check prerequisites (server running, DB connected)
2. ❌ Run in UI mode to see visual failures
3. ❌ Check test output for specific error messages
4. ❌ Review implementation code vs test expectations
5. ❌ Check browser console for errors (use `page.on('console')`)

---

## Summary of Files

### Test Files
- `/tests/suites/08-event-tabs-navigation-p0.spec.ts` - Tab navigation tests
- `/tests/suites/09-sse-realtime-updates-p0.spec.ts` - SSE real-time tests
- `/tests/suites/10-mobile-event-management-p0.spec.ts` - Mobile UI tests

### Documentation
- `/tests/TEST_SUITES_SUMMARY.md` - Comprehensive test documentation
- `/tests/QUICK_START_NEW_TESTS.md` - This file

### Supporting Files (Already Exist)
- `/tests/fixtures/test-data.ts` - Test data builders
- `/tests/page-objects/LoginPage.ts` - Login page object
- `/tests/page-objects/PublicEventPage.ts` - Public registration page object
- `/tests/helpers/test-helpers.ts` - Helper functions

---

## Questions?

See:
- **Full Documentation:** `/tests/TEST_SUITES_SUMMARY.md`
- **Test Plan:** `/tests/scenarios/` (780 scenarios)
- **Project Guidelines:** `/CLAUDE.md`
- **Playwright Docs:** https://playwright.dev

---

**Ready to run? Start here:**
```bash
npm run test:ui
```

Then select `08-event-tabs-navigation-p0.spec.ts` and click any test to run! 🚀
