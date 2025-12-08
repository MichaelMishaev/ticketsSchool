# 🔴 Critical Test Suite - TicketCap

> **These tests MUST pass before production deployment.**

This directory contains critical security, data integrity, and business logic tests for the TicketCap multi-tenant event registration system.

---

## 📊 Test Files Overview

| File | Purpose | Priority | Tests |
|------|---------|----------|-------|
| `multi-tenant-isolation.spec.ts` | Data isolation between schools | 🔴 CRITICAL | 15+ |
| `atomic-capacity.spec.ts` | Race condition prevention | 🔴 CRITICAL | 12+ |
| `registration-edge-cases.spec.ts` | Input validation & edge cases | 🔴 CRITICAL | 25+ |
| `security-validation.spec.ts` | OWASP Top 10 vulnerabilities | 🔴 CRITICAL | 30+ |

**Total: 80+ critical tests**

---

## 🔴 1. Multi-Tenant Isolation Tests

**File:** `multi-tenant-isolation.spec.ts`
**Why Critical:** Prevents School A from accessing School B's data

### Test Coverage:

#### Event Isolation
- ✅ School A admin sees only School A events
- ✅ Cannot access other school events by URL manipulation
- ✅ SUPER_ADMIN sees all schools

#### Registration Isolation
- ✅ School A admin sees only School A registrations
- ✅ Cannot export other school registrations

#### API Endpoint Isolation
- ✅ GET /api/events returns only current school data
- ✅ POST /api/events cannot specify different schoolId
- ✅ DELETE /api/events/:id cannot delete other school events

#### Dashboard Stats Isolation
- ✅ Dashboard shows only current school statistics

#### Session Security
- ✅ JWT tokens contain schoolId (cannot be hijacked)

### Expected Behavior:
```typescript
// CORRECT - Enforces schoolId
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) throw new Error('No school assigned')
  where.schoolId = admin.schoolId
}

// WRONG - Silent bypass if undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}
```

---

## ⚛️ 2. Atomic Capacity Enforcement Tests

**File:** `atomic-capacity.spec.ts`
**Why Critical:** Prevents overbooking and race conditions

### Test Coverage:

#### Race Condition Prevention
- ✅ 5 concurrent users registering for 3 spots → 3 confirmed, 2 waitlisted
- ✅ 3 concurrent users for 1 spot → 1 confirmed, 2 waitlisted
- ✅ spotsReserved increments atomically (no double-booking)

#### Capacity Boundaries
- ✅ Registration at exact capacity succeeds
- ✅ Registration exceeding capacity goes to waitlist
- ✅ Multi-spot registration respects capacity

#### Waitlist Management
- ✅ Cancellation frees spots for waitlist
- ✅ Waitlist order preserved (FIFO)

#### Database Consistency
- ✅ spotsReserved = sum of confirmed registrations
- ✅ No negative spotsReserved values
- ✅ spotsReserved never exceeds capacity

#### Transaction Rollback
- ✅ Failed operations don't reserve spots
- ✅ Database errors roll back transactions

#### Performance Under Load
- ✅ 100 concurrent registrations complete in <30 seconds

### Expected Pattern:
```typescript
// CORRECT - Atomic transaction
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id } })

  if (event.spotsReserved + spots > event.capacity) {
    status = 'WAITLIST'
  } else {
    await tx.event.update({
      where: { id },
      data: { spotsReserved: { increment: spots } }
    })
    status = 'CONFIRMED'
  }

  return await tx.registration.create({ data: {..., status} })
})
```

---

## 📝 3. Registration Edge Cases Tests

**File:** `registration-edge-cases.spec.ts`
**Why Critical:** Ensures data quality and user experience

### Test Coverage:

#### Israeli Phone Normalization (8 tests)
- ✅ Accepts: `050 123 4567` (with spaces)
- ✅ Accepts: `050-123-4567` (with dashes)
- ✅ Accepts: `(050) 123-4567` (with parentheses)
- ✅ Converts: `+972501234567` → `0501234567`
- ✅ Rejects: Too short (6 digits)
- ✅ Rejects: Too long (12 digits)
- ✅ Rejects: Not starting with 0
- ✅ Normalizes all formats to `0XXXXXXXXX`

#### Required Field Validation (3 tests)
- ✅ Cannot submit without name
- ✅ Cannot submit without phone
- ✅ Email optional (if configured)

#### Email Validation (2 tests)
- ✅ Accepts valid formats: `user@example.com`, `user+tag@example.co.il`
- ✅ Rejects invalid formats: `notanemail`, `missing@domain`

#### Duplicate Prevention (2 tests)
- ✅ Prevents duplicate phone registration
- ✅ Allows same name with different phone

#### Special Characters (5 tests)
- ✅ Accepts Hebrew names: `משה כהן`
- ✅ Accepts apostrophes: `O'Connor`
- ✅ Accepts hyphens: `Jean-Pierre`
- ✅ Sanitizes XSS: `<script>alert("XSS")</script>`
- ✅ Escapes SQL: `'; DROP TABLE--`

#### Boundary Values (5 tests)
- ✅ Minimum name length (2 chars)
- ✅ Maximum name length (100 chars)
- ✅ Zero spots request handled
- ✅ Maximum spots request validated
- ✅ Negative spots rejected

#### Form State & UX (2 tests)
- ✅ Submit button disabled while submitting
- ✅ Loading state shown during submission

### Phone Normalization Function:
```typescript
function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  // Convert +972 to 0
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  // Validate: 10 digits starting with 0
  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('Invalid Israeli phone number')
  }

  return normalized
}
```

---

## 🔒 4. Security Validation Tests

**File:** `security-validation.spec.ts`
**Why Critical:** Protects against OWASP Top 10 vulnerabilities

### Test Coverage:

#### SQL Injection (OWASP #1) - 3 tests
- ✅ Login form resistant: `' OR '1'='1`
- ✅ Registration form sanitizes: `'; DROP TABLE--`
- ✅ URL parameters safe: `/events/test'; DROP TABLE--`

#### XSS Protection (OWASP #3) - 3 tests
- ✅ Confirmation page escapes: `<script>alert("XSS")</script>`
- ✅ Event titles escaped: `<img src=x onerror="alert(1)">`
- ✅ No dangerouslySetInnerHTML misuse

#### Authentication Bypass - 4 tests
- ✅ Admin dashboard requires login
- ✅ API endpoints return 401 without session
- ✅ Fake session tokens rejected
- ✅ Session expires after logout

#### Authorization Bypass - 3 tests
- ✅ Regular admin blocked from SUPER_ADMIN routes
- ✅ Regular admin cannot call SUPER_ADMIN APIs
- ✅ VIEWER role cannot create events

#### Session Security - 3 tests
- ✅ Session cookie has `httpOnly` flag
- ✅ Session cookie has `secure` flag (HTTPS)
- ✅ Session not accessible from JavaScript

#### Information Disclosure - 3 tests
- ✅ Error messages don't leak sensitive info
- ✅ API errors don't expose internals
- ✅ User enumeration not possible

#### CSRF Protection - 2 tests
- ✅ POST requests require authentication
- ✅ DELETE requests require authentication

#### Input Sanitization - 2 tests
- ✅ Path traversal blocked: `../../../etc/passwd`
- ✅ Null bytes handled: `test\x00user`

#### Rate Limiting (TODO) - 2 tests
- ⏳ Login attempts rate limited
- ⏳ Registration endpoint rate limited

### Security Checklist:
```typescript
// ✅ Authentication
const admin = await requireAdmin()

// ✅ Authorization
if (admin.role !== 'SUPER_ADMIN') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ✅ Input validation
if (!email || !email.includes('@')) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
}

// ✅ Multi-tenant isolation
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) throw new Error('No school assigned')
  where.schoolId = admin.schoolId
}

// ✅ Error handling
catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}
```

---

## 🚀 Running the Tests

### Run All Critical Tests
```bash
npm run test tests/critical/
```

### Run Specific Test File
```bash
npx playwright test tests/critical/multi-tenant-isolation.spec.ts
npx playwright test tests/critical/atomic-capacity.spec.ts
npx playwright test tests/critical/registration-edge-cases.spec.ts
npx playwright test tests/critical/security-validation.spec.ts
```

### Run with UI (Debug Mode)
```bash
npm run test:ui tests/critical/
```

### Run in Headed Mode (See Browser)
```bash
npm run test:headed tests/critical/
```

### Run on Mobile Devices
```bash
npm run test:mobile tests/critical/
```

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure:

### Multi-Tenant Isolation ✅
- [ ] All tests in `multi-tenant-isolation.spec.ts` pass
- [ ] School A cannot access School B data
- [ ] SUPER_ADMIN can access all schools
- [ ] JWT tokens contain schoolId
- [ ] All API routes enforce schoolId filtering

### Atomic Capacity ✅
- [ ] All tests in `atomic-capacity.spec.ts` pass
- [ ] Race conditions handled (5 concurrent users tested)
- [ ] spotsReserved = sum of confirmed registrations
- [ ] No negative or over-capacity values
- [ ] Transactions roll back on error

### Registration Quality ✅
- [ ] All tests in `registration-edge-cases.spec.ts` pass
- [ ] Phone normalization works (all formats)
- [ ] Duplicate prevention active
- [ ] XSS payloads sanitized
- [ ] Hebrew names supported
- [ ] Boundary values handled

### Security ✅
- [ ] All tests in `security-validation.spec.ts` pass
- [ ] SQL injection blocked
- [ ] XSS protection working
- [ ] Authentication required for admin routes
- [ ] Authorization enforced (role-based)
- [ ] Session cookies secured (httpOnly, secure)
- [ ] Error messages don't leak info
- [ ] CSRF protection active

---

## 🐛 Test Failures

### If Tests Fail:

1. **Multi-Tenant Isolation Failures:**
   - 🔴 **CRITICAL** - DO NOT deploy to production
   - Check all API routes have `requireAdmin()` or `requireSuperAdmin()`
   - Verify schoolId filtering is enforced
   - Review `/lib/auth.server.ts` for logic errors

2. **Atomic Capacity Failures:**
   - 🔴 **CRITICAL** - DO NOT deploy to production
   - Check registration API uses `prisma.$transaction()`
   - Verify `spotsReserved: { increment: spots }` pattern
   - Review capacity logic in registration endpoints

3. **Registration Edge Case Failures:**
   - 🟡 **HIGH** - Fix before production
   - Check `normalizePhone()` function in `/lib/utils.ts`
   - Verify input validation on registration form
   - Test XSS sanitization

4. **Security Validation Failures:**
   - 🔴 **CRITICAL** - DO NOT deploy to production
   - Audit all input points for injection risks
   - Verify authentication middleware
   - Check session cookie configuration

---

## 📊 Test Metrics

### Coverage Goals:
- **Multi-Tenant Isolation:** 100% (all routes tested)
- **Atomic Capacity:** 100% (all race conditions covered)
- **Registration:** 95% (common edge cases)
- **Security:** 90% (OWASP Top 10)

### Performance Targets:
- ✅ 100 concurrent registrations < 30 seconds
- ✅ Individual test < 10 seconds
- ✅ Full suite < 5 minutes

---

## 🔄 Continuous Integration

### GitHub Actions (Recommended)
```yaml
name: Critical Tests
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npx playwright install
      - run: npm run test tests/critical/

      # Block merge if critical tests fail
      - name: Check test results
        if: failure()
        run: exit 1
```

---

## 📚 Additional Resources

- [CLAUDE.md](/CLAUDE.md) - Project documentation
- [Playwright Docs](https://playwright.dev)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Transactions](https://www.prisma.io/docs/concepts/components/prisma-client/transactions)

---

## ✅ Success Criteria

These tests are successful when:
1. ✅ All 80+ tests pass
2. ✅ No security vulnerabilities detected
3. ✅ Multi-tenant isolation enforced
4. ✅ Race conditions prevented
5. ✅ Data quality maintained

**When all critical tests pass, the system is ready for production deployment.**

---

*Last Updated: 2025-12-05*
*Created by: green-test-writer agent (Claude Code)*
