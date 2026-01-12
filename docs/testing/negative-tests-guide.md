# Negative Tests Guide - Security-Critical Forbidden Paths

## Overview

The **negative tests** (`tests/critical/negative-tests.spec.ts`) are security-critical tests that ensure **unauthorized actions are BLOCKED** and **invalid operations fail gracefully**. These tests verify that forbidden paths remain closed, catching 20% of bugs that happy-path testing misses — often **security-critical bugs**.

## Why Negative Testing is Critical

> "Testing the happy path catches 80% of bugs. Testing forbidden paths catches the remaining 20% — often security-critical bugs." — baseRules.md

**Most regressions re-open forbidden paths.** A single missed authorization check can expose:
- Cross-tenant data leaks (School A viewing School B's events)
- Privilege escalation (VIEWER creating events)
- Data integrity violations (deleting events with registrations)
- Injection attacks (SQL injection, XSS)

## Test Coverage: 38 Security Tests

### 1. Authentication Negative Tests (5 tests) - 401 Unauthorized

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N1.1 | Unauthenticated user CANNOT access GET /api/events | 401 | ✓ |
| N1.2 | Unauthenticated user CANNOT access POST /api/events | 401 | ✓ |
| N1.3 | Invalid JWT token rejected | 401 | ✓ |
| N1.4 | Malformed JWT token rejected | 401 | ✓ |
| N1.5 | Missing session cookie rejected | 401 | ✓ |

**What's Protected:**
- All `/api/events/*` endpoints require authentication
- All `/api/dashboard/*` endpoints require authentication
- All `/api/admin/*` endpoints (except signup/login) require authentication
- Invalid/expired/malformed tokens are rejected immediately

### 2. Authorization (RBAC) Negative Tests (8 tests) - 403 Forbidden

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N2.1 | ADMIN CANNOT access other school events | 403 | ✓ |
| N2.2 | ADMIN CANNOT create event for other school | 403 | ✓ |
| N2.3 | MANAGER CANNOT create events (read-only) | 403 | ✓ |
| N2.4 | VIEWER CANNOT create events | 403 | ✓ |
| N2.5 | VIEWER CANNOT delete events | 403 | ✓ |
| N2.6 | Non-SuperAdmin CANNOT access SuperAdmin routes | 403 | ✓ |
| N2.7 | ADMIN CANNOT edit other school event | 403 | ✓ |
| N2.8 | ADMIN CANNOT view other school registrations | 403 | ✓ |

**RBAC Hierarchy:**
```
SUPER_ADMIN  → All schools, all operations
OWNER        → Own school, billing & team management
ADMIN        → Own school, all event operations
MANAGER      → Own school, read + edit registrations (no create/delete events)
VIEWER       → Own school, read-only
```

### 3. Input Validation Negative Tests (7 tests) - 400 Bad Request

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N3.1 | Event creation with missing title rejected | 400 | ✓ |
| N3.2 | Event with negative capacity rejected | 400 | ✓ |
| N3.3 | Event with zero capacity rejected | 400 | ✓ |
| N3.4 | Event with invalid date format rejected | 400 | ✓ |
| N3.5 | Registration with invalid Israeli phone rejected | 400 | ✓ |
| N3.6 | Registration with missing name rejected | 400 | ✓ |
| N3.7 | Invalid email format rejected | 400 | ✓ |

**Validation Rules:**
- Event: title (required), capacity (>0 for CAPACITY_BASED), valid dates
- Registration: name (required), valid email, Israeli phone (10 digits, starts with 0)
- Phone format: `0501234567` or `050-123-4567` (normalized to 10 digits)

### 4. Data Integrity Negative Tests (5 tests) - 409/400

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N4.1 | Cannot delete event with confirmed registrations | 400 | ✓ |
| N4.2 | Cannot reduce capacity below current registrations | 400 | ✓ |
| N4.3 | Cannot create registration for non-existent event | 404 | ✓ |
| N4.4 | Cannot create event for non-existent school | 400/404 | ✓ |
| N4.5 | Cannot update event schoolId after creation | 400/403 | ✓ |

**Data Integrity Rules:**
- Events with registrations: Cannot delete (must cancel registrations first)
- Capacity changes: Cannot reduce below confirmed spots count
- School assignment: Cannot change after creation (multi-tenant isolation)
- Foreign keys: All references must exist (school, event)

### 5. Business Logic Negative Tests (5 tests) - 400

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N5.1 | Cannot register for CLOSED event | 400 | ✓ |
| N5.2 | Cannot register with more spots than available | 400/waitlist | ✓ |
| N5.3 | Cannot cancel already-cancelled registration | 400 | ✓ |
| N5.4 | Cannot register past event end date | 400 | ✓ |
| N5.5 | Cannot register with spots exceeding maxSpotsPerPerson | 400 | ✓ |

**Business Rules:**
- Event status: OPEN (accept), CLOSED (reject)
- Capacity overflow: Redirect to waitlist (not reject)
- Past events: No new registrations allowed
- Spot limits: Enforce `maxSpotsPerPerson` setting

### 6. Cross-Tenant Access Negative Tests (8 tests) - 403 Forbidden

| Test ID | Description | Status Code | Critical Path |
|---------|-------------|-------------|---------------|
| N6.1 | School A admin CANNOT view School B events list | 403 | ✓ |
| N6.2 | School A admin CANNOT delete School B event | 403 | ✓ |
| N6.3 | School A admin CANNOT view School B registrations | 403 | ✓ |
| N6.4 | API auto-filters by schoolId (no cross-tenant data leak) | - | ✓ |
| N6.5 | Direct API call with other schoolId rejected | 403 | ✓ |

**Multi-Tenant Isolation:**
- **Automatic filtering:** All queries auto-filter by `admin.schoolId`
- **Runtime guards:** Non-SuperAdmin MUST have `schoolId` assigned
- **No data leaks:** API never returns data from other schools
- **Direct access blocked:** Cannot manipulate schoolId in query params

## Running Negative Tests

### Prerequisites

**Start dev server first:**
```bash
npm run dev
```

Server must be running on `http://localhost:9000` before running tests.

### Run All Negative Tests

```bash
# Full suite (38 tests across 3 browsers = 114 test runs)
npx playwright test tests/critical/negative-tests.spec.ts

# With UI (recommended for debugging)
npx playwright test tests/critical/negative-tests.spec.ts --ui

# Desktop only (faster)
npx playwright test tests/critical/negative-tests.spec.ts --project=chromium

# See detailed output
npx playwright test tests/critical/negative-tests.spec.ts --reporter=list
```

### Run Specific Test Categories

```bash
# Authentication tests only
npx playwright test tests/critical/negative-tests.spec.ts --grep "Authentication"

# Authorization/RBAC tests only
npx playwright test tests/critical/negative-tests.spec.ts --grep "Authorization"

# Input validation tests only
npx playwright test tests/critical/negative-tests.spec.ts --grep "Input Validation"

# Cross-tenant isolation tests only
npx playwright test tests/critical/negative-tests.spec.ts --grep "Cross-Tenant"

# Run single test by ID
npx playwright test tests/critical/negative-tests.spec.ts --grep "N2.1"
```

### Expected Results

**All tests should PASS** - meaning all forbidden operations are properly BLOCKED.

```
✓ N1.1: Unauthenticated user CANNOT access GET /api/events (401)
✓ N2.1: ADMIN CANNOT access other school events (403)
✓ N3.1: Event creation with missing title rejected (400)
✓ N4.1: Cannot delete event with confirmed registrations (400)
✓ N5.1: Cannot register for CLOSED event (400)
✓ N6.1: School A admin CANNOT view School B events list (403)

38 passed (114 total across 3 browsers)
```

**If a test FAILS** → A forbidden path has been opened (security regression!)

## Test Pattern Explained

### Negative Test Pattern

```typescript
test('N2.1: ADMIN CANNOT access other school events', async ({ browser }) => {
  // 1. SETUP: Create test data
  const school1 = await createSchool().withName('School 1').create()
  const school2 = await createSchool().withName('School 2').create()
  const admin1 = await createAdmin()
    .withRole('ADMIN')
    .withSchool(school1.id)
    .create()
  const event2 = await createEvent()
    .withSchool(school2.id)
    .create()

  // 2. ACTION: Try forbidden operation
  const context = await browser.newContext()
  await loginViaAPI(context, admin1.email, admin1.password)
  const response = await context.request.get(`/api/events/${event2.id}`)

  // 3. ASSERT: Operation is BLOCKED
  expect(response.status()).toBe(403)
  const body = await response.json()
  expect(body.error).toContain('Forbidden')
})
```

**Key Elements:**
1. **Setup:** Create minimal test data (2 schools, 1 admin, 1 event)
2. **Action:** Attempt forbidden operation (cross-tenant access)
3. **Assert:** Verify correct HTTP status code (403) + clear error message

### Error Response Validation

Always check error messages are helpful:

```typescript
expect(body.error).toBeDefined()
expect(body.error).not.toBe('Internal server error') // Not generic
expect(body.error).toContain('Forbidden') // Clear reason
```

**Good error messages:**
- ✓ `"Forbidden: No access to this school's events"`
- ✓ `"Capacity must be a positive number"`
- ✓ `"Cannot delete event with existing registrations"`

**Bad error messages:**
- ✗ `"Internal server error"` (too generic)
- ✗ `"Error"` (no context)
- ✗ `"Something went wrong"` (unhelpful)

## Integration with CI/CD

### Pre-Commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running negative tests..."
npm run dev &
SERVER_PID=$!
sleep 5

npx playwright test tests/critical/negative-tests.spec.ts --project=chromium

TEST_EXIT=$?
kill $SERVER_PID

if [ $TEST_EXIT -ne 0 ]; then
  echo "❌ Negative tests failed! Commit blocked."
  exit 1
fi

echo "✅ All negative tests passed!"
exit 0
```

### GitHub Actions

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Negative Tests
  run: |
    npm run dev &
    SERVER_PID=$!
    sleep 10
    npx playwright test tests/critical/negative-tests.spec.ts
    kill $SERVER_PID
```

## Common Failures & Fixes

### 1. Test Fails: 200 instead of 403

**Problem:** Authorization check missing or bypassed.

**Fix:**
```typescript
// WRONG: Missing school access check
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin()
  const event = await prisma.event.findUnique({ where: { id: params.id } })
  return NextResponse.json(event)
}

// CORRECT: Enforce school access
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const admin = await getCurrentAdmin()
  const event = await prisma.event.findUnique({ where: { id: params.id } })

  if (admin.role !== 'SUPER_ADMIN' && admin.schoolId !== event.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json(event)
}
```

### 2. Test Fails: Data Leak Detected

**Problem:** API returning data from other schools.

**Fix:**
```typescript
// WRONG: No schoolId filter
const events = await prisma.event.findMany()

// CORRECT: Auto-filter by schoolId
const where: any = {}
if (admin.role !== 'SUPER_ADMIN') {
  where.schoolId = admin.schoolId
}
const events = await prisma.event.findMany({ where })
```

### 3. Test Fails: Invalid Input Accepted

**Problem:** Server-side validation missing.

**Fix:**
```typescript
// WRONG: No validation
const capacity = data.capacity

// CORRECT: Validate input
const capacity = Number(data.capacity)
if (isNaN(capacity) || capacity < 1) {
  return NextResponse.json(
    { error: 'Capacity must be a positive number' },
    { status: 400 }
  )
}
```

## Test Maintenance

### When to Update Negative Tests

1. **New API endpoint added** → Add authentication + authorization negative tests
2. **New role added** → Add RBAC negative tests for new role
3. **Business rule changed** → Update business logic negative tests
4. **Security incident** → Add regression test for the vulnerability

### Adding New Negative Tests

Follow the existing pattern:

```typescript
test('N7.1: Description of what CANNOT be done', async ({ browser }) => {
  // Setup: Create minimal test data
  const school = await createSchool().create()
  const admin = await createAdmin().withSchool(school.id).create()

  // Action: Try forbidden operation
  const context = await browser.newContext()
  await loginViaAPI(context, admin.email, admin.password)
  const response = await context.request.post('/api/forbidden-operation', {
    data: { malicious: 'payload' }
  })

  // Assert: Operation blocked
  expect(response.status()).toBe(403)
  const body = await response.json()
  expect(body.error).toContain('specific reason')

  await context.close()
})
```

## Security Best Practices Enforced

### Multi-Tenant Isolation

All API routes MUST enforce school-level data isolation:

```typescript
// Get current admin session
const admin = await getCurrentAdmin()

// Non-SuperAdmin: MUST filter by schoolId
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned' },
      { status: 403 }
    )
  }
  where.schoolId = admin.schoolId
}
```

### RBAC Enforcement

Check role permissions BEFORE operations:

```typescript
// Check role before destructive operations
if (!['ADMIN', 'OWNER', 'SUPER_ADMIN'].includes(admin.role)) {
  return NextResponse.json(
    { error: 'Insufficient permissions' },
    { status: 403 }
  )
}
```

### Input Validation

Validate EVERYTHING from clients:

```typescript
// Never trust client input
if (!data.title || typeof data.title !== 'string') {
  return NextResponse.json({ error: 'Title is required' }, { status: 400 })
}

const capacity = Number(data.capacity)
if (isNaN(capacity) || capacity < 1) {
  return NextResponse.json({ error: 'Invalid capacity' }, { status: 400 })
}
```

## Summary

**Negative tests are the last line of defense against security vulnerabilities.**

- ✅ **38 critical security tests** covering authentication, authorization, validation, and isolation
- ✅ **Fast execution** (<2 minutes for full suite)
- ✅ **Clear failure messages** help identify regression source immediately
- ✅ **Integration-ready** for CI/CD pipelines
- ✅ **Pattern-based** for easy expansion as system grows

**Run before every commit:**
```bash
npm run dev
npx playwright test tests/critical/negative-tests.spec.ts
```

**If any test fails → DO NOT COMMIT. Fix the security issue first.**

---

**Related Documentation:**
- `/tests/README.md` - Playwright test architecture
- `/CLAUDE.md` - Development guidelines
- `/docs/infrastructure/multi-tenant-security.md` - Multi-tenant isolation details
