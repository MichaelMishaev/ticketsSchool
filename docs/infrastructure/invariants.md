# 🔐 SYSTEM INVARIANTS - kartis.info

**Last Updated:** 2025-12-21
**Status:** ACTIVE
**Purpose:** Define rules that MUST remain true across all features, refactors, and fixes

---

## 📖 WHAT IS A SYSTEM INVARIANT?

A System Invariant is a rule that protects:
- **Correctness** - The system behaves as expected
- **Security** - Data is protected from unauthorized access
- **Data Integrity** - Data remains consistent and valid
- **Compliance** - Legal/business requirements are met

**If an invariant is violated, the system is broken, even if it "works".**

Invariants are:
- Stronger than features
- Stronger than refactors
- Stronger than tests
- **NON-NEGOTIABLE**

---

## 🚦 INVARIANT PRIORITY LEVELS

- **P0 (CRITICAL)** - Security, data integrity, legal compliance
- **P1 (HIGH)** - Correctness, user experience, money/payments
- **P2 (MEDIUM)** - Performance, maintainability
- **P3 (LOW)** - Nice-to-have rules

---

## MULTI-TENANT INVARIANTS

### INVARIANT_MT_001: School Data Isolation

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
No admin can access data from a school they don't belong to, unless they have the `SUPER_ADMIN` role.

**Applies To:**
- Events
- Registrations
- Team members
- Invitations
- Usage records
- Any school-scoped data

**Enforcement:**

**Code Pattern (MANDATORY):**
```typescript
// lib/auth.server.ts
export async function requireSchoolAccess(schoolId: string) {
  const admin = await requireAdmin()

  if (admin.role === 'SUPER_ADMIN') {
    return admin
  }

  if (admin.schoolId !== schoolId) {
    throw new Error(`Access denied: Admin ${admin.id} cannot access school ${schoolId}`)
  }

  return admin
}
```

**API Pattern (MANDATORY):**
```typescript
export async function GET(request: Request) {
  const admin = await requireAdmin()

  const where: Prisma.EventWhereInput = {}

  if (admin.role !== 'SUPER_ADMIN') {
    if (!admin.schoolId) {
      return NextResponse.json(
        { error: 'Admin must have a school assigned' },
        { status: 403 }
      )
    }
    where.schoolId = admin.schoolId
  }

  const events = await prisma.event.findMany({ where })
  return NextResponse.json({ events })
}
```

**Tests:**
- `tests/suites/06-multi-tenant-p0.spec.ts`
- `tests/critical/multi-tenant-isolation.spec.ts`

**Violation Examples (FORBIDDEN):**
```typescript
// WRONG - Silent bypass if schoolId is undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}

// WRONG - Trusting client input
const { schoolId } = await request.json()
where.schoolId = schoolId

// WRONG - No validation
const events = await prisma.event.findMany() // Returns ALL schools' events
```

**Consequences of Violation:**
- Data breach (admin sees competitor's data)
- Privacy violation
- GDPR compliance failure
- Loss of customer trust
- Potential legal liability

---

### INVARIANT_MT_002: School Association Required

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
Every admin (except during initial signup flow) MUST have a `schoolId` assigned before accessing school-scoped features.

**Enforcement:**

**Code Pattern:**
```typescript
// After onboarding completes
if (!admin.schoolId) {
  return NextResponse.redirect(new URL('/admin/onboarding', request.url))
}
```

**Middleware Protection:**
```typescript
// middleware.ts handles redirection to onboarding if schoolId is null
```

**Tests:**
- `tests/suites/01-auth-p0.spec.ts`
- Tests verify onboarding flow completes before dashboard access

**Consequences of Violation:**
- Admin can't create events (403 errors)
- API queries return empty results
- Poor user experience

---

### INVARIANT_MT_003: School Slug Uniqueness

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
Every school MUST have a unique `slug` globally. No two schools can share the same slug.

**Reason:**
Public URLs are `/p/[schoolSlug]/[eventSlug]`. Duplicate slugs would cause routing conflicts.

**Enforcement:**

**Database Schema:**
```prisma
model School {
  id   String @id @default(cuid())
  slug String @unique // UNIQUE constraint
}
```

**API Validation:**
```typescript
// Before creating school
const existing = await prisma.school.findUnique({ where: { slug } })
if (existing) {
  return NextResponse.json({ error: 'School slug already exists' }, { status: 400 })
}
```

**Tests:**
- `tests/suites/01-auth-p0.spec.ts` - Duplicate school slug rejected

**Consequences of Violation:**
- Public registration pages break (wrong school's events shown)
- Data integrity compromised

---

## CAPACITY ENFORCEMENT INVARIANTS

### INVARIANT_CAP_001: Atomic Capacity Enforcement

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
Registration capacity checks and `spotsReserved` increments MUST happen in a single atomic transaction. No race conditions allowed.

**Why This Matters:**
If 2 users register simultaneously for the last spot, WITHOUT atomic transactions:
- Both read `spotsReserved = 99` (capacity = 100)
- Both see "spot available"
- Both get CONFIRMED status
- Final `spotsReserved = 100` (only incremented once due to race condition)
- **Result: 101 people registered for 100 spots (OVERBOOKING)**

**Enforcement:**

**Code Pattern (MANDATORY):**
```typescript
// app/api/p/[schoolSlug]/[eventSlug]/register/route.ts
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id: eventId } })

  let status: 'CONFIRMED' | 'WAITLIST'

  if (event.spotsReserved + spotsCount > event.capacity) {
    status = 'WAITLIST'
  } else {
    // ATOMIC INCREMENT
    await tx.event.update({
      where: { id: eventId },
      data: { spotsReserved: { increment: spotsCount } }
    })
    status = 'CONFIRMED'
  }

  const registration = await tx.registration.create({
    data: { eventId, status, name, email, phone, spotsCount }
  })

  return { registration, status }
})
```

**Runtime Guard (RECOMMENDED):**
```typescript
// After increment, verify no overflow
const updated = await tx.event.findUnique({ where: { id: eventId } })
if (updated.spotsReserved > event.capacity) {
  throw new Error('Capacity overflow detected - transaction will rollback')
}
```

**Tests:**
- `tests/critical/atomic-capacity.spec.ts`
- Simulates concurrent registrations
- Verifies `spotsReserved` never exceeds `capacity`

**Violation Examples (FORBIDDEN):**
```typescript
// WRONG - Separate queries (race condition)
const event = await prisma.event.findUnique({ where: { id } })
if (event.spotsReserved < event.capacity) {
  await prisma.event.update({
    where: { id },
    data: { spotsReserved: event.spotsReserved + 1 }
  })
}

// WRONG - No transaction
const event = await prisma.event.findUnique({ where: { id } })
await prisma.event.update({ ... }) // Another request could interleave here
```

**Consequences of Violation:**
- Overbooking (more registrations than capacity)
- Customer complaints
- Revenue loss (refunds)
- Reputation damage

---

### INVARIANT_CAP_002: Valid Capacity Initialization

**Priority:** 🟡 P1 (HIGH)

**Rule:**
When creating an event, `capacity` MUST be > 0 and `spotsReserved` MUST be initialized to 0.

**Enforcement:**

**API Validation:**
```typescript
if (capacity <= 0) {
  return NextResponse.json({ error: 'Capacity must be greater than 0' }, { status: 400 })
}

await prisma.event.create({
  data: {
    ...eventData,
    capacity,
    spotsReserved: 0 // ALWAYS initialize to 0
  }
})
```

**Database Schema:**
```prisma
model Event {
  capacity      Int     @default(0)
  spotsReserved Int     @default(0)
}
```

**Tests:**
- `tests/suites/03-event-management-p0.spec.ts`

**Consequences of Violation:**
- Negative capacity (event can't accept registrations)
- Logic errors in availability checks

---

## AUTHENTICATION & SECURITY INVARIANTS

### INVARIANT_AUTH_001: Session Integrity

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
Every JWT session token MUST include these fields:
- `adminId` (string)
- `email` (string)
- `role` (Role enum)
- `schoolId` (string | null)
- `schoolName` (string | null)

**Reason:**
Missing fields cause runtime errors. `schoolId` is required for multi-tenant isolation.

**Enforcement:**

**Code Pattern:**
```typescript
// lib/auth.server.ts
export function encodeSession(payload: SessionPayload): string {
  // Validate required fields
  if (!payload.adminId || !payload.email || !payload.role) {
    throw new Error('Invalid session payload: missing required fields')
  }

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}
```

**Session Update After Onboarding:**
```typescript
// MUST update session when schoolId changes
const token = encodeSession({
  adminId: admin.id,
  email: admin.email,
  role: admin.role,
  schoolId: school.id,
  schoolName: school.name
})

const response = NextResponse.json({ success: true })
response.cookies.set(SESSION_COOKIE_NAME, token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
})
return response
```

**Tests:**
- `tests/suites/01-auth-p0.spec.ts`
- Verify session includes all required fields
- Verify session updated after onboarding

**Consequences of Violation:**
- Runtime errors (`Cannot read property 'schoolId' of undefined`)
- Multi-tenant isolation bypassed
- Authorization checks fail

---

### INVARIANT_AUTH_002: Password Security

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
All passwords MUST be hashed with bcrypt (min 10 rounds). Passwords MUST NEVER be stored in plaintext or logged.

**Enforcement:**

**Code Pattern:**
```typescript
import bcrypt from 'bcrypt'

// Signup
const hashedPassword = await bcrypt.hash(password, 10)
await prisma.admin.create({
  data: { email, passwordHash: hashedPassword }
})

// Login
const admin = await prisma.admin.findUnique({ where: { email } })
const isValid = await bcrypt.compare(password, admin.passwordHash)
if (!isValid) {
  return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
}
```

**Database Schema:**
```prisma
model Admin {
  passwordHash String?  // Nullable (for OAuth-only accounts)
}
```

**Logging Protection:**
```typescript
// NEVER log passwords
console.log({ email, password }) // ❌ FORBIDDEN
console.log({ email }) // ✅ ALLOWED
```

**Tests:**
- `tests/suites/01-auth-p0.spec.ts`
- Verify password hashed on signup
- Verify login validates hashed password

**Consequences of Violation:**
- Security breach (passwords leaked)
- Legal liability (GDPR violation)
- Loss of customer trust

---

### INVARIANT_AUTH_003: JWT Secret Security

**Priority:** 🔴 P0 (CRITICAL)

**Rule:**
`JWT_SECRET` environment variable MUST:
- Be set before first deployment
- Be at least 32 characters
- Be randomly generated (not a default value)
- Never be committed to git
- Never be logged

**Enforcement:**

**Code Validation:**
```typescript
// lib/auth.server.ts
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is not set')
}
if (JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters')
}
```

**Generation:**
```bash
# Generate secure secret
openssl rand -base64 32
```

**Consequences of Violation:**
- JWT tokens can be forged
- Unauthorized access
- Complete security breach

---

## DATA VALIDATION INVARIANTS

### INVARIANT_DATA_001: Phone Number Normalization

**Priority:** 🟡 P1 (HIGH)

**Rule:**
All Israeli phone numbers MUST be normalized to 10 digits starting with 0 before storage.

**Format:**
- Input: `050-123-4567`, `+972-50-123-4567`, `0501234567`
- Output: `0501234567`

**Enforcement:**

**Code Pattern (MANDATORY):**
```typescript
function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  // Convert international prefix (+972) to 0
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  // Validate: 10 digits starting with 0
  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('מספר טלפון לא תקין') // Invalid phone number in Hebrew
  }

  return normalized
}
```

**Usage:**
```typescript
// Before saving to database
const normalizedPhone = normalizePhone(phone)
await prisma.registration.create({
  data: { phone: normalizedPhone, ... }
})
```

**Tests:**
- `tests/suites/04-public-registration-p0.spec.ts`
- Tests various phone formats (+972, 050-, etc.)

**Consequences of Violation:**
- Duplicate registrations (same phone, different formats)
- SMS sending failures
- Data inconsistency

---

### INVARIANT_DATA_002: Email Validation

**Priority:** 🟡 P1 (HIGH)

**Rule:**
All email addresses MUST be validated before storage and converted to lowercase.

**Enforcement:**

**Code Pattern:**
```typescript
function validateEmail(email: string): string {
  const normalized = email.toLowerCase().trim()
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(normalized)) {
    throw new Error('כתובת אימייל לא תקינה') // Invalid email in Hebrew
  }

  return normalized
}
```

**Database Schema:**
```prisma
model Admin {
  email String @unique // UNIQUE constraint prevents duplicates
}
```

**Consequences of Violation:**
- Duplicate accounts (same email, different casing)
- Email delivery failures

---

### INVARIANT_DATA_003: Slug Format Validation

**Priority:** 🟡 P1 (HIGH)

**Rule:**
School slugs and event slugs MUST:
- Be lowercase
- Contain only letters, numbers, hyphens
- Not start/end with hyphen
- Be 3-50 characters

**Enforcement:**

**Code Pattern:**
```typescript
function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length >= 3 && slug.length <= 50
}
```

**Consequences of Violation:**
- URL routing failures
- Broken public registration pages

---

## BUSINESS LOGIC INVARIANTS

### INVARIANT_BIZ_001: Registration Status Transitions

**Priority:** 🟡 P1 (HIGH)

**Rule:**
Registration status transitions MUST follow valid state machine:

```
CONFIRMED → CANCELLED ✅
WAITLIST → CANCELLED ✅
WAITLIST → CONFIRMED ✅ (when spot opens)
CANCELLED → CONFIRMED ❌ (must create new registration)
CANCELLED → WAITLIST ❌
```

**Enforcement:**

**Code Pattern:**
```typescript
// When updating registration status
if (currentStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
  throw new Error('Cannot reactivate cancelled registration')
}
```

**Consequences of Violation:**
- Capacity accounting errors
- Confusion in registration status

---

### INVARIANT_BIZ_002: Confirmation Code Uniqueness

**Priority:** 🟡 P1 (HIGH)

**Rule:**
Every registration MUST have a unique confirmation code (6 digits).

**Enforcement:**

**Code Pattern:**
```typescript
function generateConfirmationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

// With retry on collision
async function createRegistrationWithCode() {
  let attempts = 0
  while (attempts < 10) {
    try {
      const code = generateConfirmationCode()
      return await prisma.registration.create({
        data: { confirmationCode: code, ... }
      })
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint violation
        attempts++
        continue
      }
      throw error
    }
  }
  throw new Error('Failed to generate unique confirmation code')
}
```

**Database Schema:**
```prisma
model Registration {
  confirmationCode String @unique
}
```

**Consequences of Violation:**
- Two users get same confirmation code
- Check-in confusion at event

---

## PERFORMANCE INVARIANTS

### INVARIANT_PERF_001: Database Query Optimization

**Priority:** 🟢 P2 (MEDIUM)

**Rule:**
All list queries (events, registrations) MUST use pagination or limit to prevent timeout.

**Enforcement:**

**Code Pattern:**
```typescript
// GOOD - With limit
const events = await prisma.event.findMany({
  where,
  take: 100,
  orderBy: { startDate: 'desc' }
})

// BAD - No limit (could return 10,000+ events)
const events = await prisma.event.findMany({ where })
```

**Consequences of Violation:**
- API timeouts (Railway 60s timeout)
- Poor user experience
- Database overload

---

## COMPLIANCE INVARIANTS

### INVARIANT_COMP_001: Email Verification (Future)

**Priority:** 🟢 P2 (MEDIUM - Not yet enforced)

**Rule:**
In production, emails MUST be sent only from verified domains (Resend requirement).

**Current State:**
- Development: Uses `onboarding@resend.dev` (test mode)
- Production: Requires verified domain at resend.com/domains

**Enforcement (Future):**
```typescript
// Validate EMAIL_FROM is not test domain in production
if (process.env.NODE_ENV === 'production' && EMAIL_FROM.includes('resend.dev')) {
  throw new Error('Must use verified domain in production')
}
```

**Consequences of Violation:**
- Emails rejected by Resend
- Users don't receive confirmations

---

## 📋 ADDING A NEW INVARIANT

When adding a new system rule:

1. **Document it here** using the template:

```markdown
### INVARIANT_[CATEGORY]_[NUMBER]: [Name]

**Priority:** [P0/P1/P2/P3]

**Rule:**
[Clear, concise statement of the rule]

**Enforcement:**
[Code pattern, tests, runtime guards]

**Consequences of Violation:**
[What breaks if this is violated]
```

2. **Add enforcement** (tests + runtime guards)
3. **Link to Golden Paths** (if applicable)
4. **Update baseRules-kartis.md** (if needed)

---

## 🔄 MODIFYING AN INVARIANT

Invariants are NON-NEGOTIABLE by default.

To modify or remove an invariant:

1. **Request approval** with justification:
   ```
   REQUEST INVARIANT CHANGE: INVARIANT_CAP_001

   Current Rule: Atomic capacity enforcement
   Proposed Change: Add table-level capacity tracking
   Reason: Support table reservations
   Impact: More complex transaction logic
   Risks: Potential race conditions if not careful
   Mitigation: Extend atomic transaction pattern
   ```

2. **Wait for explicit approval**

3. **After approval:**
   - Update invariant documentation
   - Update enforcement code
   - Update tests
   - Update related Golden Paths

---

## 📊 INVARIANT ENFORCEMENT SUMMARY

| Invariant | Priority | Enforcement | Test Coverage |
|-----------|----------|-------------|---------------|
| INVARIANT_MT_001 | P0 | Code + Tests | ✅ 100% |
| INVARIANT_MT_002 | P0 | Middleware | ✅ 100% |
| INVARIANT_MT_003 | P0 | DB Schema | ✅ 100% |
| INVARIANT_CAP_001 | P0 | Code + Tests | ✅ 100% |
| INVARIANT_CAP_002 | P1 | Code | ✅ 100% |
| INVARIANT_AUTH_001 | P0 | Code | ✅ 100% |
| INVARIANT_AUTH_002 | P0 | Code + DB | ✅ 100% |
| INVARIANT_AUTH_003 | P0 | Code | ✅ Manual |
| INVARIANT_DATA_001 | P1 | Code + Tests | ✅ 100% |
| INVARIANT_DATA_002 | P1 | Code + DB | ✅ 100% |
| INVARIANT_DATA_003 | P1 | Code | 🚧 Partial |
| INVARIANT_BIZ_001 | P1 | Code | 🚧 In Progress |
| INVARIANT_BIZ_002 | P1 | DB Schema | ✅ 100% |
| INVARIANT_PERF_001 | P2 | Code Review | 🚧 Manual |
| INVARIANT_COMP_001 | P2 | Not Yet | ❌ Future |

---

**Last Review:** 2025-12-21
**Next Review:** After any P0 invariant modification
