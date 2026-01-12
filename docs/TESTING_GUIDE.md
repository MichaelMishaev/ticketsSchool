# Comprehensive Testing Guide

**kartis.info Testing Infrastructure - Complete Guide**

This guide covers all testing practices, tools, and workflows for kartis.info. Follow these guidelines to maintain high-quality code and prevent regressions.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Test Types Overview](#test-types-overview)
3. [Unit Testing with Vitest](#unit-testing-with-vitest)
4. [Component Testing](#component-testing)
5. [E2E Testing with Playwright](#e2e-testing-with-playwright)
6. [Visual Regression Testing](#visual-regression-testing)
7. [Test-Driven Development (TDD)](#test-driven-development-tdd)
8. [Writing Good Tests](#writing-good-tests)
9. [Running Tests](#running-tests)
10. [Debugging Tests](#debugging-tests)
11. [Coverage Requirements](#coverage-requirements)
12. [CI/CD Integration](#cicd-integration)
13. [Best Practices](#best-practices)

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
# Unit + Component tests
npm run test:unit

# E2E tests (requires dev server)
npm test

# Visual regression tests
npx playwright test tests/visual/
```

### Pre-Commit Workflow

```bash
# 1. Write code
# 2. Write tests
# 3. Run tests locally
npm run test:unit
npm test

# 4. Commit (hooks run automatically)
git add .
git commit -m "feat: add new feature"
```

---

## Test Types Overview

kartis.info uses **4 types of automated tests**:

| Test Type           | Tool                     | Count | Purpose                            | Speed            | When to Run |
| ------------------- | ------------------------ | ----- | ---------------------------------- | ---------------- | ----------- |
| **Unit Tests**      | Vitest                   | 185+  | Test individual functions/modules  | ⚡⚡⚡ Very Fast | Pre-commit  |
| **Component Tests** | Vitest + Testing Library | 176+  | Test React components in isolation | ⚡⚡ Fast        | Pre-commit  |
| **E2E Tests**       | Playwright               | 65+   | Test user workflows end-to-end     | ⚡ Slower        | Pre-push    |
| **Visual Tests**    | Playwright Screenshots   | 20+   | Detect UI regressions              | ⚡ Moderate      | On PR       |

**Total: 446+ automated tests**

---

## Unit Testing with Vitest

### What to Unit Test

✅ **Test these:**

- Pure functions (input → output)
- Business logic (table assignment, usage tracking)
- Authentication helpers
- Validation functions
- Utility functions

❌ **Don't unit test these:**

- API routes (use E2E tests)
- React components (use component tests)
- Database queries (use E2E tests)

### Example: Testing a Pure Function

**File:** `lib/__tests__/table-assignment.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { assignTableToRegistration } from '../table-assignment'

describe('Table Assignment Algorithm', () => {
  let tables: Table[]

  beforeEach(() => {
    tables = [
      { id: '1', capacity: 4, spotsReserved: 0, status: 'ACTIVE' },
      { id: '2', capacity: 8, spotsReserved: 0, status: 'ACTIVE' },
      { id: '3', capacity: 12, spotsReserved: 0, status: 'ACTIVE' },
    ]
  })

  it('should assign 4 guests to table with capacity 4 (SMALLEST_FIT)', () => {
    const result = assignTableToRegistration(tables, 4)

    expect(result.tableId).toBe('1') // Capacity 4, not 8 or 12
    expect(result.assigned).toBe(true)
  })

  it('should put registration on waitlist when no fitting table', () => {
    const result = assignTableToRegistration(tables, 20) // Too many guests

    expect(result.assigned).toBe(false)
    expect(result.waitlist).toBe(true)
  })
})
```

### Testing Async Functions

```typescript
it('should verify JWT token', async () => {
  const token = await encodeSession({ adminId: '123', email: 'test@test.com' })

  const decoded = await verifySession(token)

  expect(decoded.adminId).toBe('123')
  expect(decoded.email).toBe('test@test.com')
})
```

### Mocking Dependencies

```typescript
import { vi } from 'vitest'
import { prisma } from '../prisma'

// Mock Prisma client
vi.mock('../prisma', () => ({
  prisma: {
    admin: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}))

it('should create admin', async () => {
  vi.mocked(prisma.admin.create).mockResolvedValue({
    id: '123',
    email: 'test@test.com',
  } as any)

  const admin = await createAdmin({ email: 'test@test.com' })

  expect(admin.id).toBe('123')
  expect(prisma.admin.create).toHaveBeenCalledWith({
    data: { email: 'test@test.com' },
  })
})
```

### Testing with Fake Timers

```typescript
import { vi, beforeEach, afterEach } from 'vitest'

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

it('should auto-dismiss after 5 seconds', () => {
  const callback = vi.fn()
  scheduleCallback(callback, 5000)

  // Fast-forward time
  vi.advanceTimersByTime(5000)

  expect(callback).toHaveBeenCalledTimes(1)
})
```

---

## Component Testing

### What to Component Test

✅ **Test these:**

- User interactions (click, type, submit)
- Conditional rendering
- Props validation
- Accessibility (ARIA labels, keyboard navigation)
- Edge cases (empty states, errors)

❌ **Don't component test these:**

- Styling (use visual tests)
- Complex user flows (use E2E tests)

### Example: Testing Modal Component

**File:** `components/__tests__/Modal.test.tsx`

```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Modal from '../Modal'

describe('Modal Component', () => {
  it('should render modal when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={vi.fn()} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    )

    expect(screen.getByText('Test Modal')).toBeInTheDocument()
    expect(screen.getByText('Modal content')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )

    const closeButton = screen.getByLabelText('סגור')
    await userEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('should close on Escape key', () => {
    const onClose = vi.fn()
    render(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Content</p>
      </Modal>
    )

    fireEvent.keyDown(window, { key: 'Escape' })

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

### Testing Form Components

```typescript
it('should validate required fields', async () => {
  const onSubmit = vi.fn()
  render(<RegistrationForm onSubmit={onSubmit} />)

  // Click submit without filling form
  const submitButton = screen.getByRole('button', { name: /submit/i })
  await userEvent.click(submitButton)

  // Should show validation errors
  expect(screen.getByText('נא למלא את כל השדות החובה')).toBeInTheDocument()
  expect(onSubmit).not.toHaveBeenCalled()
})
```

### Testing Custom Hooks

```typescript
import { renderHook, act } from '@testing-library/react'

it('should add and remove toasts', () => {
  const { result } = renderHook(() => useToast())

  // Add toast
  act(() => {
    result.current.addToast('Success!', 'success')
  })

  expect(result.current.toasts).toHaveLength(1)
  expect(result.current.toasts[0].message).toBe('Success!')

  // Remove toast
  act(() => {
    result.current.removeToast(result.current.toasts[0].id)
  })

  expect(result.current.toasts).toHaveLength(0)
})
```

---

## E2E Testing with Playwright

### What to E2E Test

✅ **Test these:**

- Complete user workflows
- Multi-page flows (login → create event → register)
- Database interactions
- API integrations
- Critical business paths (P0 tests)

❌ **Don't E2E test these:**

- Unit logic (use unit tests)
- Component edge cases (use component tests)

### Example: Testing Login Flow

**File:** `tests/suites/01-auth-p0.spec.ts`

```typescript
import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'

test.describe('Authentication [P0]', () => {
  test.afterAll(async () => {
    await cleanupTestData()
  })

  test('admin can login with valid credentials', async ({ page }) => {
    // Setup: Create test data
    const school = await createSchool().withName('Test School').create()
    const admin = await createAdmin()
      .withEmail('test@test.com')
      .withPassword('Password123!')
      .withSchool(school.id)
      .verified()
      .create()

    // Action: Login
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test@test.com', 'Password123!')

    // Assert: Redirected to dashboard
    await expect(page).toHaveURL(/\/admin(?:\/dashboard)?$/)
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })

  test('cannot login with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login('test@test.com', 'WrongPassword!')

    // Should stay on login page with error
    await expect(page).toHaveURL(/\/admin\/login/)
    await expect(page.locator('text=אימייל או סיסמה שגויים')).toBeVisible()
  })
})
```

### Using Page Objects

**File:** `tests/page-objects/LoginPage.ts`

```typescript
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/admin/login')
  }

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email)
    await this.page.fill('input[name="password"]', password)
    await this.page.click('button[type="submit"]')
  }

  async clickForgotPassword() {
    await this.page.click('text=שכחתי סיסמה')
  }
}
```

### Using Test Data Builders

```typescript
const school = await createSchool()
  .withName('Test School')
  .withSlug('test-school')
  .withPlan('PRO')
  .create()

const admin = await createAdmin()
  .withEmail('admin@test.com')
  .withPassword('Password123!')
  .withSchool(school.id)
  .withRole('OWNER')
  .verified()
  .create()

const event = await createEvent()
  .withTitle('Soccer Match')
  .withSlug('soccer-match')
  .withSchool(school.id)
  .withCapacity(100)
  .future()
  .create()
```

---

## Visual Regression Testing

### What to Visually Test

✅ **Test these:**

- Critical pages (landing, login, dashboard)
- Forms (empty, filled, errors, success)
- Mobile layouts
- Public-facing pages

❌ **Don't visually test:**

- Dynamic data (hide with `page.evaluate()`)
- Animations (disabled in config)

### Example: Screenshot Test

**File:** `tests/visual/baseline-screenshots.spec.ts`

```typescript
test('landing page matches baseline', async ({ page }) => {
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  // Hide dynamic content
  await page.evaluate(() => {
    const dateElements = document.querySelectorAll('[data-testid="current-date"]')
    dateElements.forEach((el) => ((el as HTMLElement).style.visibility = 'hidden'))
  })

  await expect(page).toHaveScreenshot('landing-page.png', {
    fullPage: true,
  })
})
```

### Generating Baselines

```bash
# First time: Generate baseline screenshots
npx playwright test tests/visual/ --update-snapshots

# Commit baselines
git add tests/visual/*.spec.ts-snapshots/
git commit -m "test: add baseline screenshots"
```

### Reviewing Visual Changes

```bash
# Run visual tests
npx playwright test tests/visual/

# If tests fail (screenshots differ):
# 1. Review diffs in test-results/
# 2. If expected: npx playwright test tests/visual/ --update-snapshots
# 3. If unexpected: Fix the UI regression
```

---

## Test-Driven Development (TDD)

### Red-Green-Refactor Workflow

**1. RED - Write Failing Test**

```typescript
// Step 1: Write a test that fails
it('should calculate discount for PRO plan', () => {
  const discount = calculateDiscount('PRO', 100)
  expect(discount).toBe(20) // 20% discount
})

// Run test → ❌ FAILS (function doesn't exist yet)
```

**2. GREEN - Make It Pass**

```typescript
// Step 2: Write minimal code to pass
export function calculateDiscount(plan: string, amount: number): number {
  if (plan === 'PRO') {
    return amount * 0.2
  }
  return 0
}

// Run test → ✅ PASSES
```

**3. REFACTOR - Improve Code**

```typescript
// Step 3: Refactor for quality (test still passes)
const DISCOUNT_RATES = {
  FREE: 0,
  STARTER: 0.1,
  PRO: 0.2,
  ENTERPRISE: 0.3,
}

export function calculateDiscount(plan: string, amount: number): number {
  const rate = DISCOUNT_RATES[plan as keyof typeof DISCOUNT_RATES] || 0
  return amount * rate
}

// Run test → ✅ STILL PASSES
```

### When to Use TDD

✅ **Use TDD for:**

- Complex business logic
- Bug fixes (write failing test first)
- New features with clear requirements
- Critical security functions

❌ **Skip TDD for:**

- Spike/exploratory code
- UI prototypes
- Simple CRUD operations

---

## Writing Good Tests

### The 3 A's Pattern

```typescript
it('should assign smallest fitting table', () => {
  // ARRANGE - Set up test data
  const tables = [
    { id: '1', capacity: 4 },
    { id: '2', capacity: 8 },
  ]

  // ACT - Perform the action
  const result = assignTable(tables, 4)

  // ASSERT - Verify the result
  expect(result.tableId).toBe('1') // Chose capacity 4, not 8
})
```

### Descriptive Test Names

✅ **Good:**

```typescript
it('should redirect to dashboard after successful login')
it('should show validation error when email is missing')
it('should disable submit button when form is invalid')
```

❌ **Bad:**

```typescript
it('works')
it('test login')
it('should work correctly')
```

### One Assertion Per Test (When Possible)

✅ **Good:**

```typescript
it('should create admin with email', async () => {
  const admin = await createAdmin({ email: 'test@test.com' })
  expect(admin.email).toBe('test@test.com')
})

it('should hash admin password', async () => {
  const admin = await createAdmin({ password: 'password123' })
  expect(admin.password).not.toBe('password123') // Should be hashed
})
```

❌ **Acceptable (related assertions):**

```typescript
it('should create admin with all required fields', async () => {
  const admin = await createAdmin({
    email: 'test@test.com',
    name: 'Test Admin',
    role: 'ADMIN',
  })

  expect(admin.email).toBe('test@test.com')
  expect(admin.name).toBe('Test Admin')
  expect(admin.role).toBe('ADMIN')
})
```

### Avoid Test Interdependence

❌ **Bad (tests depend on each other):**

```typescript
let userId: string

it('should create user', async () => {
  const user = await createUser()
  userId = user.id // ⚠️ Shared state
})

it('should update user', async () => {
  await updateUser(userId) // ⚠️ Depends on previous test
})
```

✅ **Good (tests are independent):**

```typescript
it('should create user', async () => {
  const user = await createUser()
  expect(user).toBeDefined()
})

it('should update user', async () => {
  const user = await createUser() // ✅ Create own data
  const updated = await updateUser(user.id)
  expect(updated.name).toBe('Updated')
})
```

---

## Running Tests

### Local Development

```bash
# Unit + Component tests
npm run test:unit              # Run all unit/component tests
npm run test:unit:watch        # Watch mode (re-run on changes)
npm run test:unit:ui           # Visual test UI (Vitest UI)
npm run test:unit:coverage     # With coverage report

# Specific test file
npm run test:unit -- lib/__tests__/auth.server.test.ts

# Specific test pattern
npm run test:unit -- -t "should login"

# E2E tests (requires dev server on port 9000)
npm test                       # Run all E2E tests
npm run test:ui                # With Playwright UI
npm run test:headed            # See browser
npm run test:mobile            # Mobile viewport only
npm run test:p0                # P0 critical tests only

# Visual regression
npx playwright test tests/visual/
npx playwright test tests/visual/ --update-snapshots
```

### CI/CD (GitHub Actions)

Tests run automatically on:

- **Pre-commit**: Unit + component tests (via Husky hook)
- **Pre-push**: npm audit + P0 E2E tests (via Husky hook)
- **Pull Request**: All tests + security scans + visual regression
- **Daily**: Security scans at 2 AM UTC

---

## Debugging Tests

### Debugging Unit Tests

```bash
# Use Vitest UI for interactive debugging
npm run test:unit:ui

# Add debugger statement
it('should debug this', () => {
  const result = myFunction()
  debugger // Breakpoint
  expect(result).toBe(42)
})

# Run with --inspect
node --inspect-brk ./node_modules/vitest/vitest.mjs
```

### Debugging E2E Tests

```bash
# Run with Playwright UI
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# Debug specific test
npx playwright test -g "should login" --debug

# Pause execution
await page.pause() // Opens Playwright Inspector
```

### Common Issues

**Issue: "Element not found"**

```typescript
// ❌ Bad: Element might not be ready
await page.click('button')

// ✅ Good: Wait for element
await page.waitForSelector('button', { timeout: 10000 })
await page.click('button')
```

**Issue: "Test timeout"**

```typescript
// Increase timeout for slow operations
test('slow operation', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds

  await page.goto('/admin/events')
  // ... slow operations
})
```

**Issue: "Snapshot mismatch"**

```bash
# Update snapshots if change is intentional
npx playwright test tests/visual/ --update-snapshots
```

---

## Coverage Requirements

### Global Thresholds

```typescript
// vitest.config.ts
thresholds: {
  lines: 12,        // Phase 1: 12% (will increase to 80%)
  functions: 20,
  branches: 75,
  statements: 12,
}
```

### Critical File Requirements (100% Coverage)

- `lib/auth.server.ts` - Authentication (SECURITY CRITICAL)
- `lib/table-assignment.ts` - Business logic (CORE FEATURE)
- `lib/usage.ts` - Billing/limits (BILLING CRITICAL)
- `lib/prisma-guards.ts` - Data isolation (DATA SECURITY)
- `lib/auth.client.ts` - Client auth

### Running Coverage Reports

```bash
# Generate coverage
npm run test:unit:coverage

# View HTML report
open coverage/index.html

# View in terminal
npm run test:unit:coverage -- --reporter=text
```

---

## CI/CD Integration

### Pre-Commit Hook (`.husky/pre-commit`)

```bash
# Runs automatically on: git commit
✅ Type checking (TypeScript)
✅ Linting (ESLint)
✅ Unit + component tests (Vitest)
```

### Pre-Push Hook (`.husky/pre-push`)

```bash
# Runs automatically on: git push
✅ npm audit (HIGH/CRITICAL vulnerabilities)
✅ Secret scanning (gitleaks, optional)
✅ P0 critical E2E tests
```

### Pull Request Checks (`.github/workflows/pr-checks.yml`)

```bash
# Runs automatically on: Pull Request
✅ Smart test selection (only changed files)
✅ Parallel unit tests (4 shards)
✅ Type checking + linting
✅ P0 E2E tests
✅ Coverage reporting
```

### Security Scanning (`.github/workflows/security-scan.yml`)

```bash
# Runs on: Pull Request, Push, Daily at 2 AM UTC
✅ Trivy filesystem scan (vulnerabilities)
✅ Trivy secret scan (API keys, tokens)
✅ npm audit (dependencies)
✅ Dependency review (license compliance)
```

---

## Best Practices

### 1. Test Naming Convention

```typescript
describe('ComponentName / FunctionName', () => {
  describe('FeatureGroup', () => {
    it('should [expected behavior] when [condition]', () => {
      // Test implementation
    })
  })
})
```

### 2. Clean Up Test Data

```typescript
test.afterAll(async () => {
  await cleanupTestData()
})

test.afterEach(async () => {
  await prisma.$transaction([prisma.registration.deleteMany(), prisma.event.deleteMany()])
})
```

### 3. Use Test Data Builders

```typescript
// ✅ Good: Fluent, readable
const admin = await createAdmin().withEmail('test@test.com').withRole('ADMIN').verified().create()

// ❌ Bad: Hard to read
const admin = await prisma.admin.create({
  data: {
    email: 'test@test.com',
    password: await hash('password'),
    emailVerified: true,
    role: 'ADMIN',
    schoolId: schoolId,
  },
})
```

### 4. Prefer User Event Over Fire Event

```typescript
// ✅ Good: Simulates real user interaction
await userEvent.click(button)
await userEvent.type(input, 'text')

// ❌ Avoid: Low-level, doesn't simulate user behavior
fireEvent.click(button)
```

### 5. Test Accessibility

```typescript
it('should have accessible label', () => {
  render(<Button aria-label="Close" />)

  const button = screen.getByLabelText('Close')
  expect(button).toBeInTheDocument()
})

it('should support keyboard navigation', () => {
  render(<Modal isOpen={true} onClose={onClose} />)

  fireEvent.keyDown(window, { key: 'Escape' })

  expect(onClose).toHaveBeenCalled()
})
```

---

## Quick Reference

### Essential Commands

```bash
# Development
npm run test:unit:watch        # Watch mode
npm run test:ui                # E2E with UI

# Coverage
npm run test:unit:coverage
open coverage/index.html

# Visual regression
npx playwright test tests/visual/
npx playwright test tests/visual/ --update-snapshots

# Debugging
npm run test:headed            # See browser
npx playwright test --debug    # Step through test
```

### File Locations

```
/lib/__tests__/                # Unit tests
/components/__tests__/         # Component tests
/tests/
  /suites/                     # E2E test suites
  /visual/                     # Visual regression tests
  /fixtures/                   # Test data builders
  /page-objects/               # Reusable page interactions
```

### Coverage Targets

| File Type          | Target   | Required    |
| ------------------ | -------- | ----------- |
| Critical lib files | 100%     | ✅ Yes      |
| Other lib files    | 80%      | Recommended |
| Components         | 80%      | Recommended |
| API routes         | E2E only | N/A         |

---

## Getting Help

- **Test failures in CI**: Check GitHub Actions logs
- **Local test failures**: Run with `--headed` or `--ui` flag
- **Coverage issues**: View HTML report: `open coverage/index.html`
- **Visual regression**: Review diffs in `test-results/`

---

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/react)
- [Project Testing README](/tests/README.md)

---

**Last Updated:** January 2026
**Version:** 1.0.0 (Enterprise-Grade QA - Complete)
