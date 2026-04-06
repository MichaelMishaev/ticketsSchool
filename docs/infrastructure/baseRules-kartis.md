# 📜 AI DEVELOPMENT CONSTITUTION - kartis.info
**Next.js + Tailwind + Prisma + PostgreSQL**
**Automation-First · Regression-Resistant · CI-Safe · Multi-Tenant Secure**

**Status:** ACTIVE
**Priority:** NON-NEGOTIABLE
**Audience:** AI assistants and developers
**Scope:** Entire project lifecycle

> **If any rule below is violated, the solution is considered INVALID, even if it works.**

---

## 1. PURPOSE

This document exists to:

- Prevent regression bugs
- Ensure predictable CI builds (Railway)
- Enforce automation-safe UI
- Eliminate hidden coupling and magic behavior
- Protect multi-tenant data isolation
- Make AI output boring, stable, and correct

Speed without control is damage.
This document intentionally adds friction.

---

## 2. STACK LOCK (NO EXCEPTIONS)

The following stack is locked unless explicitly approved:

- **Framework**: Next.js 15.5.3+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **Database**: PostgreSQL + Prisma 6.16.2+
- **Authentication**: JWT (jsonwebtoken + jose)
- **Testing**: Playwright (automation-first)
- **Deployment**: Railway
- **UI Components**: Custom components with Tailwind (no library)

❌ No shadcn/ui
❌ No Radix UI
❌ No MUI
❌ No Chakra
❌ No Ant Design
❌ No CSS-in-JS
❌ No inline styles
❌ No additional UI libraries

---

## 3. CORE PRINCIPLES

- Behavior > implementation
- Contracts > files
- Tests are public APIF
- Refactors must not change behavior
- Predictability beats elegance
- Multi-tenant isolation is non-negotiable

---

## 4. UI & STYLING RULES (CRITICAL)

### 4.1 Styling

- ✅ Tailwind utility classes only
- ✅ Custom components built with Tailwind
- ✅ Mobile-first (375px minimum width)
- ✅ RTL support (Hebrew) via `dir="rtl"` and RTL-aware classes
- ✅ Input fields MUST include `text-gray-900 bg-white` (prevents white-on-white on mobile)
- ❌ No custom CSS files unless approved
- ❌ No generated or dynamic class names
- ❌ No reliance on DOM structure

### 4.2 Mobile-First Requirements

- Touch targets: minimum 44px height (iOS accessibility standard)
- Use responsive Tailwind classes: `sm:`, `md:`, `lg:`
- Hebrew RTL: use `dir="rtl"` and right-to-left flex/grid
- Test on mobile viewport: `npm run test:mobile`

---

## 5. AUTOMATION & TESTABILITY CONTRACT (MANDATORY)

Every interactive element MUST be testable.

### 5.1 Selectors

- ✅ `data-testid` is mandatory for:
  - Buttons
  - Inputs
  - Forms
  - Modals
  - Menus
  - Dialogs
  - Navigation elements
- ✅ Semantic roles when applicable
- ❌ No class-based selectors
- ❌ No auto-generated selectors
- ❌ No text-only selectors unless approved

### 5.2 Stability

- UI refactors must not break selectors
- Tests are considered part of the contract
- Visual change ≠ selector change
- All Playwright tests must pass before commit

### 5.3 Test Naming Convention

```typescript
// GOOD
data-testid="login-email-input"
data-testid="event-create-submit-button"
data-testid="registration-confirm-modal"

// BAD
data-testid="input1"
data-testid="btn"
data-testid="modal"
```

---

## 6. HARD-CODED VALUES — CONTROLLED EXCEPTIONS

### 6.1 Not Allowed (General)

- ❌ Magic numbers in business logic
- ❌ Business rules embedded in UI
- ❌ Temporary text without documentation
- ❌ Hard-coded API endpoints
- ❌ Hard-coded configuration values

### 6.2 kartis.info EXCEPTION: Hebrew Strings

**kartis.info is a Hebrew-only application. Hard-coded Hebrew strings are ALLOWED but MUST follow these rules:**

✅ **Allowed:**
```typescript
// Component with Hebrew labels
<label className="block text-sm font-medium">שם מלא</label>
<button>שמירה</button>
<h1>ניהול אירועים</h1>
```

❌ **Not Allowed:**
```typescript
// Mixed languages
<label>Name שם</label>

// English fallbacks in Hebrew app
const title = data.title || "Event"

// Business logic values
const MAX_CAPACITY = 100 // Should be from config/DB
```

**Documentation Requirement:**
- If adding new user-facing screens, document all Hebrew strings in component comments
- If planning future i18n, mark strings with `// i18n-ready` comment

### 6.3 Allowed Sources for Configuration

- ✅ Environment variables (documented & validated)
- ✅ Database-driven content
- ✅ Constants files with clear naming (`/lib/constants.ts`)
- ✅ Hard-coded Hebrew UI text (Hebrew-only app)

---

## 7. INTERNATIONALIZATION (i18n) - FUTURE CONSIDERATION

**Current State:** kartis.info is Hebrew-only with hard-coded strings (see Section 6.2).

**If multi-language support is added in the future:**
- All user-facing text must be externalized
- RTL/LTR support must be explicit
- Translation keys must be:
  - Stable
  - Descriptive
  - Reusable
- No mixed languages
- No inline fallback strings

**Until then:** Hebrew hard-coded strings are acceptable per Section 6.2.

---

## 8. FILE & SCOPE DISCIPLINE

### 8.1 File Rules

- One responsibility per file
- One exported component per file
- No mixed UI + business logic
- Files must be understandable without excessive scrolling
- Use `import 'server-only'` for server-only utilities

### 8.2 Truth (Honest)

- Smaller files reduce regression risk
- Over-fragmentation increases confusion
- Split by behavior, not by line count

### 8.3 kartis.info-Specific Structure

```
/app/api                    # API routes (multi-tenant isolation required)
/app/admin                  # Admin dashboard (protected routes)
/app/p/[schoolSlug]/[eventSlug]  # Public registration pages
/components                 # Reusable React components
/lib                        # Utilities (auth, prisma, usage tracking)
/prisma                     # Database schema & migrations
/tests                      # Playwright E2E tests (fixtures, page objects, suites)
```

---

## 9. CI / RAILWAY SURVIVAL RULES

- Build must pass in a clean environment
- No reliance on:
  - Local Node version
  - Implicit environment variables
  - Local file system paths
- All env vars must be:
  - Declared in `.env.example`
  - Validated in code
  - Documented in CLAUDE.md

❌ No suppressing build errors
❌ No "quick fixes" for CI
✅ Test locally with `npm run build` before pushing
✅ Check Railway logs immediately after deployment

### 9.1 Railway-Specific Requirements

- `DATABASE_URL` auto-provided by Railway PostgreSQL service
- `JWT_SECRET` MUST be set before first deploy (min 32 chars)
- Run migrations: `railway run npm run db:migrate`
- Health check endpoint: `/api/health`

---

## 10. REGRESSION PREVENTION RULES

- ❌ No refactoring outside task scope
- ❌ No silent behavior changes
- ❌ No "while I was here" changes
- ✅ One logical change per task
- ✅ Additive changes preferred

If behavior changes:
- Explain what changed
- Explain why
- Explain impact
- Update tests to match

---

## 11. CHANGE BOUNDARY DECLARATION (MANDATORY)

Every task MUST declare its change boundary before code is written.

### 11.1 Required Declaration

The AI must explicitly state:

- ✅ Files allowed to change
- ❌ Files forbidden to change
- 🎯 Golden Paths involved (if any)
- 🔒 Locked flows affected (if any)

**Example:**

```
CHANGE BOUNDARY:

Allowed:
  * app/admin/events/new/page.tsx
  * app/api/events/route.ts
  * tests/suites/03-event-management-p0.spec.ts

Forbidden:
  * app/api/auth/* (authentication flows)
  * lib/auth.server.ts (session management)
  * Any registration flows

Golden Paths:
  * EVENT_CREATE_V1 (LOCKED - do not modify)

Multi-Tenant Impact:
  * New API route requires schoolId enforcement
```

### 11.2 Enforcement

- Changes outside the declared boundary are invalid
- "While I was here" changes are forbidden
- If boundary needs to expand, re-declare and get approval

---

## 12. LOCKED / UNLOCKED MECHANISM (MANDATORY)

### 12.1 Purpose

Locking exists to protect:

- Approved UI flows
- Automation contracts (data-testid)
- Business-critical flows
- Multi-tenant security boundaries

**We lock behavior, not files.**

### 12.2 LOCKED Declaration Syntax

**File Header (Preferred):**

```typescript
/**
 * @LOCKED
 * Reason: Approved flow - registration capacity enforcement
 * Scope:
 *   - Atomic transaction pattern
 *   - spotsReserved increment logic
 *   - Waitlist vs CONFIRMED status logic
 *   - data-testid selectors
 * See: /docs/infrastructure/GOLDEN_PATHS.md#REGISTRATION_SUBMIT_V1
 */
```

**Or Reference Registry:**

```typescript
/**
 * @LOCKED
 * See: /docs/infrastructure/GOLDEN_PATHS.md#AUTH_LOGIN_V1
 */
```

### 12.3 What LOCKED Means

When something is LOCKED, AI MUST NOT:

- ❌ Change data-testid
- ❌ Change flow or navigation
- ❌ Change user-visible behavior
- ❌ Change i18n keys or Hebrew text meaning
- ❌ Remove steps, buttons, or fields
- ❌ Modify multi-tenant isolation logic
- ❌ Change atomic transaction patterns

AI MAY:

- ✅ Refactor internals
- ✅ Improve readability
- ✅ Optimize performance
- ✅ Add TypeScript types

**Only if all tests pass unchanged.**

If unsure → **STOP AND ASK**.

### 12.4 UNLOCK Protocol (REQUIRED)

To modify LOCKED behavior, AI MUST request explicit unlock in this exact format:

```
REQUEST UNLOCK: REGISTRATION_SUBMIT_V1

Reason: Add table selection feature
Impact:
  - New field in registration form
  - Database schema change (add tableId)
  - Tests need update (new data-testid)
  - Capacity logic unchanged

Risks:
  - May break existing tests
  - Requires migration

Approval needed before proceeding.
```

No changes are allowed until explicit approval is given.

❌ Implicit unlocks forbidden
❌ Temporary unlocks forbidden
❌ Partial unlocks forbidden

---

## 13. GOLDEN PATH REGISTRY (MANDATORY)

### 13.1 Definition

A Golden Path is a business-critical flow that must remain stable.

**kartis.info Golden Paths (Examples):**
- Authentication (login, signup, password reset)
- Event creation
- Public registration submission
- Capacity enforcement (atomic transactions)
- Multi-tenant data isolation
- Waitlist management
- Team invitations

### 13.2 Registry File

**Location:** `/docs/infrastructure/GOLDEN_PATHS.md`

This file is authoritative. Create it if it doesn't exist.

### 13.3 Registry Format (STRICT)

```markdown
## REGISTRATION_SUBMIT_V1

**Status:** LOCKED

**Scope:**
- Route: `/p/[schoolSlug]/[eventSlug]`
- Component: `RegistrationForm`
- API: `/api/p/[schoolSlug]/[eventSlug]/register`

**Selectors:**
- `registration-name-input`
- `registration-email-input`
- `registration-phone-input`
- `registration-submit-button`
- `registration-confirmation-modal`

**Hebrew UI Text (LOCKED):**
- "הרשמה לאירוע"
- "שם מלא"
- "אימייל"
- "טלפון"
- "שליחת הרשמה"

**Flow:**
1. User fills form (name, email, phone)
2. Client validates required fields
3. Submit → API checks capacity atomically
4. If spots available → CONFIRMED status
5. If full → WAITLIST status
6. Success → Show confirmation code
7. Failure → Show inline error

**Multi-Tenant Enforcement:**
- API route validates schoolSlug + eventSlug match
- No cross-school data leakage

**Tests:**
- `tests/suites/04-public-registration-p0.spec.ts`
- `tests/critical/atomic-capacity.spec.ts`

**Invariants Protected:**
- INVARIANT_MT_001 (multi-tenant isolation)
- INVARIANT_CAP_001 (atomic capacity)
```

### 13.4 AI Obligations

- AI MUST check registry before modifying flows
- LOCKED → ask before change
- UNLOCKED → update registry after change
- Document new Golden Paths immediately

**Ignoring the registry is a protocol violation.**

### 13.5 Lock Implementation Status

**kartis.info Implementation Status (Updated: 2025-12-22):**

| Golden Path | Registry Status | @LOCKED Header | Files Locked |
|-------------|----------------|----------------|--------------|
| AUTH_LOGIN_V1 | 🔒 LOCKED | ✅ DONE | app/admin/login/page.tsx, app/api/admin/login/route.ts |
| AUTH_SIGNUP_V1 | 🔒 LOCKED | ✅ DONE | app/admin/signup/page.tsx, app/api/admin/signup/route.ts |
| AUTH_GOOGLE_OAUTH_V1 | 🔒 LOCKED | ✅ DONE | app/api/auth/google/route.ts, app/api/auth/google/callback/route.ts |
| EVENT_CREATE_V1 | 🔒 LOCKED | ✅ DONE | app/admin/events/new/page.tsx, app/api/events/route.ts |
| REGISTRATION_SUBMIT_V1 | 🔒 LOCKED | ✅ DONE | app/p/[schoolSlug]/[eventSlug]/page.tsx, app/api/p/[schoolSlug]/[eventSlug]/register/route.ts |
| REGISTRATION_ADMIN_VIEW_V1 | 🔒 LOCKED | ✅ DONE | app/admin/events/[id]/page.tsx, app/api/events/[id]/route.ts |
| MULTI_TENANT_ISOLATION_GLOBAL | 🔒 LOCKED | ✅ DONE | lib/auth.server.ts, middleware.ts |
| TABLE_MANAGEMENT_V1 | 🔓 UNLOCKED | N/A | (New feature - not locked yet) |

**Progress:** 🎉 7/7 Golden Paths have @LOCKED headers (100%)

**Legend:**
- ✅ = @LOCKED header added to code files
- ⚠️ = Documented but header not added yet
- ❌ = Not implemented

**To verify lock status in code:**
```bash
# Search for @LOCKED headers in codebase
grep -r "@LOCKED" app/ lib/ --include="*.ts" --include="*.tsx"
```

---

## 14. TEST LOCKING & OWNERSHIP RULES (MANDATORY)

- Tests covering LOCKED paths are LOCKED by default
- AI MUST NOT:
  - Modify tests to "make them pass"
  - Update snapshots without approval
  - Weaken assertions
  - Remove negative tests
  - Skip failing tests

**If a test fails after a change:**
1. The change is wrong (not the test)
2. Revert the change
3. Re-evaluate approach
4. Get approval if test needs updating

Test changes require explicit permission, just like code unlocks.

---

## 15. NON-FUNCTIONAL REGRESSION GUARDRAILS (MANDATORY)

The following must never degrade silently:

**Performance:**
- API response times
- Database query efficiency
- Atomic transaction overhead
- Page load times

**Accessibility:**
- Keyboard navigation
- Focus management
- Touch target sizes (≥44px)
- Hebrew RTL layout

**Security:**
- Multi-tenant isolation (schoolId enforcement)
- Authentication checks
- Input validation
- JWT verification

**Error Handling:**
- Swallowed errors
- Removed validation
- Silent failures

**If any of these change → it is a behavior change and must be declared.**

---

## 16. ASSUMPTION DECLARATION REQUIREMENT (MANDATORY)

AI MUST explicitly state assumptions before coding.

**kartis.info-Specific Examples:**

**GOOD:**
```
Assumptions:
- This screen is admin-only (requires authentication)
- This flow is Hebrew-only (no i18n needed)
- This API route requires schoolId enforcement
- This component is used only in /admin (not public pages)
- Phone numbers follow Israeli format (10 digits, starts with 0)
```

**BAD:**
```
// No assumptions stated - AI just starts coding
```

Unstated assumptions are forbidden.

If assumptions are unclear → **ASK FIRST**.

---

## 17. MULTI-TENANT SECURITY (CRITICAL - KARTIS.INFO SPECIFIC)

### 17.1 Non-Negotiable Rules

**Every API route in `/app/api/events`, `/app/api/dashboard`, `/app/api/admin/*` MUST:**

1. Get current admin session
2. Verify admin.schoolId exists (unless SUPER_ADMIN)
3. Enforce schoolId in ALL database queries

**Pattern (STRICT):**

```typescript
// CORRECT
const admin = await requireAdmin()

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

// WRONG - Silent bypass if schoolId is undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}
```

### 17.2 Session Updates

When `schoolId` changes (e.g., after onboarding):
1. Update database
2. Create new JWT with updated schoolId
3. Set cookie on NextResponse object
4. Return response

```typescript
import { encodeSession, SESSION_COOKIE_NAME } from '@/lib/auth.server'

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
  maxAge: 60 * 60 * 24 * 7 // 7 days
})

return response
```

### 17.3 Tests Required

Every multi-tenant feature MUST have:
- ✅ Positive test (authorized access works)
- ✅ Negative test (unauthorized access blocked)
- ✅ Cross-tenant isolation test

**See:** `tests/suites/06-multi-tenant-p0.spec.ts`

---

## 18. DEFINITION OF DONE (KARTIS.INFO)

A task is DONE only if:

✅ Code builds (`npm run build`)
✅ CI passes (Railway deployment successful)
✅ All Playwright tests pass (`npm test`)
✅ Mobile tests pass (if UI changes: `npm run test:mobile`)
✅ No hard-coded configuration values (use env vars)
✅ Automation selectors exist (`data-testid`)
✅ Golden Paths respected (no LOCKED violations)
✅ Change boundary respected (no scope creep)
✅ Multi-tenant isolation enforced (if applicable)
✅ Bug documented (if bug fix: `/docs/bugs/bugs.md`)
✅ No unrelated changes ("while I was here" forbidden)

---

## 19. BUG KNOWLEDGE BASE (MANDATORY)

### 19.1 Purpose

kartis.info maintains a persistent bug knowledge base to prevent repeated regressions.

**Goals:**
- Capture real failures
- Preserve lessons learned
- Prevent AI from reintroducing known bugs

This is not optional.

### 19.2 Required Docs

**Location:** `/docs/bugs/bugs.md` (ALREADY EXISTS)

### 19.3 When a Bug MUST Be Documented

A bug MUST be documented when:

- CI fails unexpectedly
- A regression is discovered
- A Golden Path breaks
- Playwright tests catch a real defect
- Production-only or environment-specific issues occur
- Multi-tenant isolation violated
- Atomic capacity enforcement failed
- A bug took more than trivial effort to diagnose

❌ Cosmetic issues do not require documentation.

### 19.4 Bug Entry Format (STRICT & SHORT)

**Example from kartis.info:**

```markdown
## BUG-2025-01-MULTI-TENANT-LEAK

**What happened:**
Admin from School A could see events from School B via GET /api/events.

**Root cause:**
API route used `admin.schoolId` without checking if it was undefined.
When undefined, WHERE clause was empty, returning all events.

**Impact:**
Multi-tenant data isolation violated. Security vulnerability.

**Fix:**
Added explicit check: if (!admin.schoolId) return 403.
File: app/api/events/route.ts:45

**Prevention:**
- Added negative test in tests/suites/06-multi-tenant-p0.spec.ts
- Documented in INVARIANT_MT_001
```

### 19.5 AI Obligations Regarding Bugs

Before implementing any fix or refactor, AI MUST:
1. Scan `/docs/bugs/bugs.md` for related issues
2. If similar bug exists:
   - Mention it
   - Avoid repeating the pattern
3. Document new bugs immediately after fixing

**Ignoring documented bugs is a protocol violation.**

---

## 20. 🔐 SYSTEM INVARIANTS (MANDATORY)

### 20.1 Definition

A System Invariant is a rule that MUST remain true across all features, refactors, and fixes.

Invariants:
- Are stronger than features
- Are stronger than refactors
- Are stronger than tests
- Protect correctness, security, and data integrity

**If an invariant is violated, the system is broken, even if it "works".**

### 20.2 Invariant Registry

**Location:** `/docs/infrastructure/invariants.md`

This file is authoritative. Create it if it doesn't exist.

**kartis.info Required Invariants (Minimum):**

```markdown
## INVARIANT_MT_001: Multi-Tenant Isolation

**Rule:**
No admin can access data from a school they don't belong to
(unless SUPER_ADMIN role).

**Enforcement:**
- API route pattern: check admin.schoolId before queries
- Tests: tests/suites/06-multi-tenant-p0.spec.ts
- Runtime guard: requireSchoolAccess() in lib/auth.server.ts

---

## INVARIANT_CAP_001: Atomic Capacity Enforcement

**Rule:**
Registration capacity checks and spotsReserved increments
MUST happen in a single atomic transaction.

**Enforcement:**
- Prisma transaction pattern in registration API
- Tests: tests/critical/atomic-capacity.spec.ts
- No external locks or race condition vulnerabilities

---

## INVARIANT_AUTH_001: Session Integrity

**Rule:**
JWT tokens MUST include: adminId, email, role, schoolId.
schoolId MUST be updated when admin completes onboarding.

**Enforcement:**
- encodeSession() in lib/auth.server.ts validates all fields
- Tests: tests/suites/01-auth-p0.spec.ts
```

### 20.3 AI Obligations Regarding Invariants

- AI MUST read `/docs/infrastructure/invariants.md` before making changes
- AI MUST check whether a task may affect any invariant
- If a change might violate an invariant → **STOP AND ASK**
- Invariants may NOT be changed implicitly

Changing or removing an invariant requires explicit approval.

---

## 21. 🧪 NEGATIVE TESTING REQUIREMENT (MANDATORY)

### 21.1 Rule

Every permission, validation, or boundary MUST have a negative test.

Happy-path-only testing is insufficient.

### 21.2 Applies To (kartis.info)

- **Multi-tenancy:** Cross-school access attempts
- **Authorization:** Role-based access (OWNER vs ADMIN vs VIEWER)
- **Input validation:** Invalid phone formats, missing required fields
- **State transitions:** Can't cancel already-cancelled registration
- **Capacity enforcement:** Can't exceed event capacity

### 21.3 Negative Test Definition

A negative test explicitly verifies that:

- ❌ Forbidden access is rejected (403)
- ❌ Invalid input is blocked (400)
- ❌ Illegal state transitions fail
- ❌ Unauthorized actions return errors (401)
- ❌ Cross-tenant queries return empty results

**Example:**

```typescript
test('admin cannot access another schools events', async ({ page }) => {
  const school1 = await createSchool().withName('School 1').create()
  const school2 = await createSchool().withName('School 2').create()
  const admin1 = await createAdmin().withSchool(school1.id).create()
  const event2 = await createEvent().withSchool(school2.id).create()

  await loginAs(page, admin1)

  const response = await page.request.get(`/api/events/${event2.id}`)
  expect(response.status()).toBe(403) // NEGATIVE TEST
})
```

### 21.4 Enforcement

- Missing negative tests for critical logic → task is NOT DONE
- Fixing a security bug without negative test → protocol violation

---

## 22. 🛡️ RUNTIME INVARIANT GUARDS (CRITICAL FOR KARTIS.INFO)

### 22.1 Purpose

Runtime guards act as a last line of defense for:
- Multi-tenant boundaries
- Data integrity
- Security violations
- Atomic capacity enforcement

### 22.2 Required Runtime Guards (kartis.info)

**1. Multi-Tenant Isolation:**

```typescript
// lib/auth.server.ts
export async function requireSchoolAccess(schoolId: string) {
  const admin = await requireAdmin()

  if (admin.role === 'SUPER_ADMIN') {
    return admin // SUPER_ADMIN can access all schools
  }

  if (admin.schoolId !== schoolId) {
    throw new Error(`Access denied: Admin ${admin.id} cannot access school ${schoolId}`)
  }

  return admin
}
```

**2. Atomic Capacity Validation:**

```typescript
// app/api/p/[schoolSlug]/[eventSlug]/register/route.ts
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id: eventId } })

  // RUNTIME GUARD
  if (event.spotsReserved + spotsCount > event.capacity) {
    status = 'WAITLIST'
  } else {
    await tx.event.update({
      where: { id: eventId },
      data: { spotsReserved: { increment: spotsCount } }
    })
    status = 'CONFIRMED'
  }

  // RUNTIME GUARD: Verify no overflow happened
  const updated = await tx.event.findUnique({ where: { id: eventId } })
  if (updated.spotsReserved > event.capacity) {
    throw new Error('Capacity overflow detected - transaction will rollback')
  }

  return tx.registration.create({ ... })
})
```

### 22.3 AI Guidance

- Runtime guards must:
  - Fail fast
  - Log clearly
  - Never silently correct invalid state
- Guards must not be removed without approval
- If a guard fires in production → log + alert

---

## 23. 📊 RISK-BASED CHANGE CLASSIFICATION (MANDATORY)

Before implementation, AI MUST classify the task:

### 23.1 🔴 HIGH RISK

Changes that may affect:
- System invariants (multi-tenant, capacity, auth)
- Authorization / security
- Data isolation
- Critical flows (registration, authentication)
- Database schema migrations

**Requirements:**
- Explicit plan
- Tests before or alongside code
- Negative tests
- Runtime guards (if applicable)
- Manual QA in staging (if available)

### 23.2 🟡 MEDIUM RISK

Changes that affect:
- Business logic
- Forms (new fields, validation)
- APIs (new endpoints)
- Shared components

**Requirements:**
- Integration tests
- E2E tests for affected flows
- Mobile testing (if UI changes)

### 23.3 🟢 LOW RISK

Changes limited to:
- Pure functions
- Types
- Constants
- Non-behavioral UI styling
- Documentation

**Requirements:**
- Unit tests (if applicable)
- Basic smoke test

### 23.4 Enforcement

**If risk level is not declared → AI MUST STOP AND ASK.**

---

## 24. 🔁 BUG FIX DISCIPLINE (MANDATORY)

When fixing a bug, AI MUST:

1. **Identify root cause** (not symptoms)
2. **Add a regression test** (must fail before fix)
3. **Apply minimal fix**
4. **Verify no invariants or Golden Paths violated**
5. **Document the bug** in `/docs/bugs/bugs.md`
6. **Run full test suite** (`npm test`)

**A bug fix without documentation or a regression test is incomplete.**

---

## 25. KARTIS.INFO PHONE NUMBER NORMALIZATION (MANDATORY)

All Israeli phone numbers MUST be normalized to 10 digits starting with 0.

**Pattern (STRICT):**

```typescript
function normalizePhone(phone: string): string {
  // Remove spaces, dashes, parentheses
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  // Convert international prefix (+972) to 0
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  // Validate: should be 10 digits starting with 0
  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('מספר טלפון לא תקין') // "Invalid phone number" in Hebrew
  }

  return normalized
}
```

**This pattern is LOCKED and must not be modified without approval.**

---

## 26. DEPLOYMENT CHECKLIST (RAILWAY)

Before deploying to production:

### 26.1 Environment Variables

- ✅ `JWT_SECRET` set (min 32 chars)
- ✅ `DATABASE_URL` auto-provided by Railway
- ✅ `RESEND_API_KEY` configured
- ✅ `EMAIL_FROM` using verified domain
- ✅ `NEXT_PUBLIC_BASE_URL` set

### 26.2 Testing

- ✅ All P0 critical tests pass (`tests/suites/*-p0.spec.ts`)
- ✅ Critical security tests pass (`tests/critical/`)
- ✅ Mobile tests pass (`npm run test:mobile`)
- ✅ Full test suite passes (`npm test`)
- ✅ Build succeeds locally (`npm run build`)

### 26.3 Verification

- ✅ Railway deployment successful (no build errors)
- ✅ Health check passes: `/api/health`
- ✅ Database migrations applied
- ✅ No errors in Railway logs
- ✅ Test basic user flow in production

---

## FINAL NOTE (READ THIS)

This document is strict by design.

It exists because:
- AI is fast
- Fast without rules creates regressions
- Regressions destroy trust and velocity
- Multi-tenant systems are security-critical
- kartis.info handles real user data and payments

**This is not bureaucracy. This is damage control.**

**When in doubt:**
1. Stop
2. Ask
3. Wait for approval
4. Then proceed

**Speed is nothing without correctness.**

---

## 28. ARCHITECTURE (KARTIS.INFO)

### 27.1 Project Structure

```
/app
  /admin                          # Admin dashboard (protected, Hebrew RTL)
    /dashboard                    # Main dashboard
    /events                       # Event management
      /new                        # Create event
      /[id]                       # Event details & registrations
    /help                         # User help page
    /login, /signup               # Auth pages
    /onboarding                   # New school onboarding
  /api                            # API routes
    /admin                        # Admin operations
      /signup, /login, /logout    # Authentication
      /verify-email, /forgot-password, /reset-password
      /onboarding                 # School setup
      /team                       # Team management
      /super                      # SUPER_ADMIN only routes
    /auth/google                  # Google OAuth
    /dashboard                    # Dashboard stats APIs
    /events                       # Event CRUD
      /[id]                       # Event operations
        /registrations/[registrationId]
        /export                   # CSV export
    /p/[schoolSlug]/[eventSlug]  # Public registration APIs
      /register                   # Submit registration
    /health                       # Health check endpoint
  /p/[schoolSlug]/[eventSlug]    # Public registration pages
  /page.tsx                       # Landing page
/components                       # Reusable React components (custom, no library)
/lib                              # Utility functions
  auth.server.ts                  # Authentication helpers
  prisma.ts                       # Prisma client
  usage.ts                        # Usage tracking
/prisma                           # Database schema & migrations
  schema.prisma                   # Prisma schema
  /migrations                     # Database migrations
/scripts                          # Utility scripts
/tests                            # Playwright E2E tests
  /suites                         # Test suites (P0, P1, P2, P3)
  /fixtures                       # Data builders
  /page-objects                   # Reusable UI interactions
  /critical                       # Core security tests
/types                            # TypeScript type definitions
/docs                             # Project documentation
  /infrastructure                 # Infrastructure docs (THIS FILE)
  /bugs                           # Bug tracking
```

### 27.2 Role-Based Access Control

**Roles (from most to least privileged):**
- `SUPER_ADMIN` - Platform owner, access to all schools/features
- `OWNER` - School owner, billing & team management
- `ADMIN` - School admin, all event operations
- `MANAGER` - School manager, view events & edit registrations
- `VIEWER` - School viewer, read-only access

**Authorization Helpers (`/lib/auth.server.ts`):**
- `getCurrentAdmin()` - Get current session (returns null if not authenticated)
- `requireAdmin()` - Throws if not authenticated
- `requireSuperAdmin()` - Throws if not SUPER_ADMIN
- `requireSchoolAccess(schoolId)` - Throws if admin can't access school

### 27.3 Subscription & Usage Tracking

**Plan-based limits system (`/lib/usage.ts`):**
- Plans: FREE, STARTER, PRO, ENTERPRISE
- Tracks: events, registrations, emails, SMS, API calls, storage
- Monthly quotas with automatic reset

**Key functions:**
- `trackUsage(schoolId, resourceType, amount)` - Record usage
- `canUseResource(schoolId, resourceType, amount)` - Check if within limits
- `hasFeature(schoolId, feature)` - Check feature access
- `getSchoolPlanDetails(schoolId)` - Get plan + usage stats

### 27.4 Database Schema (Prisma)

**Core Models:**
- `School` - Organization/tenant (has slug for public URLs)
- `Admin` - User accounts (linked to School via schoolId)
- `Event` - Events created by schools
  - `spotsReserved` - Atomic counter for capacity enforcement
  - `fieldsSchema` - JSON schema for custom registration fields
- `Registration` - User registrations for events
  - Status: CONFIRMED, WAITLIST, CANCELLED
  - `confirmationCode` - Unique code for attendees
- `TeamInvitation` - Invite team members to school
- `UsageRecord` - Track resource usage per school/month
- `Feedback` - User feedback (SUPER_ADMIN only)

### 27.5 Public URLs & Routing

**Events have slugs for public registration:**
- Pattern: `/p/[schoolSlug]/[eventSlug]`
- Example: `kartis.info/p/beeri/soccer-game-2024`
- School slug must be unique globally
- Event slug must be unique within school

**API Structure:**
- `/api/admin/*` - Admin operations (requires auth)
  - `/api/admin/super/*` - SUPER_ADMIN only endpoints
  - `/api/admin/team/*` - Team management (invitations)
- `/api/events/*` - Event CRUD (requires auth + schoolId enforcement)
- `/api/dashboard/*` - Dashboard stats (requires auth + schoolId enforcement)
- `/api/p/[schoolSlug]/[eventSlug]/*` - Public registration (no auth required)
- `/api/auth/google/*` - OAuth callback handlers
- `/api/health` - Health check (public)

### 27.6 Authentication Flows

**1. Email/Password Signup:**
1. User fills form with email, password, name, schoolName, schoolSlug
2. System creates school + admin in transaction
3. Sends verification email via Resend
4. User verifies email → redirected to login
5. After login → redirected to dashboard (onboarding skipped if school created)

**2. Google OAuth:**
1. User clicks "Sign in with Google"
2. OAuth callback creates/links account
3. If new user: creates account, sets `emailVerified: true`, redirects to onboarding
4. If existing (no password): auto-links Google account
5. If existing (with password): REQUIRES password confirmation before linking (security)
6. Session cookie updated with `schoolId` after onboarding

**3. Session Lifecycle:**
- Duration: 7 days
- Storage: HTTP-only cookie (`admin_session`)
- Validation: JWT signature with `JWT_SECRET`
- Renewal: No automatic renewal (user must re-login)

---

## 29. DEVELOPMENT SETUP (KARTIS.INFO)

### 28.1 Prerequisites

- Node.js 18+
- Docker Desktop (for PostgreSQL)
- Railway CLI (for deployment)

### 28.2 Local Development

```bash
# Clone repository
git clone <repo-url>
cd ticketsSchool

# Install dependencies
npm install

# Start PostgreSQL in Docker
docker-compose up -d

# Run database migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate

# Start development server
npm run dev  # http://localhost:9000
```

### 28.3 Common Commands

```bash
# Development
npm run dev                    # Start dev server (port 9000)
npm run build                  # Build for production
npm run build:production       # Production build (skip env validation)

# Database
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run migrations (development)
npm run db:migrate             # Deploy migrations (production)
npm run db:status              # Check migration status
docker-compose up -d           # Start PostgreSQL container
docker-compose down            # Stop PostgreSQL container

# Testing
npm test                       # Run all Playwright tests
npm run test:ui                # Run tests with UI
npm run test:debug             # Run tests with debugger
npm run test:headed            # Run tests in headed mode
npm run test:mobile            # Run tests on mobile viewport
npm run test:p0                # Run P0 critical tests only

# School Management
npm run school                 # Interactive school manager CLI
npm run school:seed            # Seed schools from script

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Auto-fix ESLint issues

# Deployment
railway up                     # Deploy to Railway
railway logs --follow          # Monitor deployment logs
railway status                 # Check deployment status
```

### 28.4 Database Connection

- **Local:** PostgreSQL runs in Docker on port 6000 (mapped from container's 5432)
- **Connection:** `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`
- **Docker container:** `ticketcap-db`
- **Production:** Uses `DATABASE_URL` environment variable (Railway auto-provides)
- **Container management:**
  - Start: `docker-compose up -d`
  - Stop: `docker-compose down`
  - Logs: `docker-compose logs -f`

### 28.5 Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 characters, generate with `openssl rand -base64 32`)
- `RESEND_API_KEY` - Resend API key for emails
- `EMAIL_FROM` - From address for emails (must be verified domain in production)

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `NEXTAUTH_URL` - Base URL for callbacks (auto-detected in dev)
- `NEXT_PUBLIC_BASE_URL` - Public base URL (defaults to http://localhost:9000)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics tracking ID
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` - For billing (future)

**Production (Railway):**
- Set `JWT_SECRET` before first deploy
- Verify domain at resend.com/domains before sending emails to users
- `DATABASE_URL` auto-provided by Railway PostgreSQL service
- See `.env.example` for full reference

---

## 30. COMMON WORKFLOWS (KARTIS.INFO)

### 29.1 Adding a New API Endpoint

1. **Check Golden Paths** (`/docs/infrastructure/GOLDEN_PATHS.md`)
   - Is this affecting a LOCKED path?
   - If yes → Request UNLOCK first

2. **Write test first (TDD approach)**:
   ```typescript
   // tests/suites/03-event-management-p0.spec.ts
   test('admin can create event', async ({ page }) => {
     const school = await createSchool().create()
     const admin = await createAdmin().withSchool(school.id).create()
     
     await loginAs(page, admin)
     // ... test implementation
   })
   ```

3. **Create route file** in `/app/api/[path]/route.ts`

4. **Import required auth helpers**:
   ```typescript
   import { requireAdmin } from '@/lib/auth.server'
   ```

5. **Enforce multi-tenant isolation** with schoolId filtering:
   ```typescript
   const admin = await requireAdmin()
   
   if (admin.role !== 'SUPER_ADMIN') {
     if (!admin.schoolId) {
       return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
     }
     where.schoolId = admin.schoolId
   }
   ```

6. **Add proper error handling and status codes**

7. **Run tests to verify**: `npm test`

8. **Test on mobile** if user-facing: `npm run test:mobile`

### 29.2 Adding a New Database Model

1. **Update `/prisma/schema.prisma`**

2. **Run migration**:
   ```bash
   npx prisma migrate dev --name descriptive_name
   ```

3. **Update TypeScript types** if needed

4. **Restart dev server** to pick up new Prisma client types

5. **Update test fixtures** in `/tests/fixtures/test-data.ts` to support new model

6. **Write tests** for any new API endpoints using the model

7. **Run tests**: `npm test`

### 29.3 Creating a New Protected Page

1. **Write test first**:
   ```typescript
   test('admin can access events page', async ({ page }) => {
     const admin = await createAdmin().create()
     await loginAs(page, admin)
     
     await page.goto('/admin/events')
     await expect(page.locator('h1')).toContainText('אירועים')
   })
   ```

2. **Create page** in `/app/admin/[path]/page.tsx`

3. **Middleware automatically protects** `/admin/*` routes

4. **Use Server Component** to fetch initial data

5. **Add to navigation** if needed

6. **Test mobile responsiveness**: `npm run test:mobile`

7. **Run tests**: `npm test`

### 29.4 Fixing a Bug

1. **Document bug** in `/docs/bugs/bugs.md` with severity and description:
   ```markdown
   ## BUG-2025-01-DESCRIPTION
   
   **What happened:** ...
   **Root cause:** ...
   **Impact:** ...
   **Fix:** ...
   **Prevention:** ...
   ```

2. **Write failing test** that reproduces the bug:
   ```typescript
   test('bug: admin should not see other schools events', async ({ page }) => {
     const school1 = await createSchool().create()
     const school2 = await createSchool().create()
     const admin1 = await createAdmin().withSchool(school1.id).create()
     const event2 = await createEvent().withSchool(school2.id).create()
     
     await loginAs(page, admin1)
     const response = await page.request.get(`/api/events/${event2.id}`)
     expect(response.status()).toBe(403) // Should fail before fix
   })
   ```

3. **Run test to verify it fails**: `npm test`

4. **Fix the bug**

5. **Run test to verify it passes**: `npm test`

6. **Update bug documentation** with fix details and file:line references

7. **Run full suite** to ensure no regressions: `npm test`

### 29.5 Testing Registration Flow (Manual)

1. **Start dev server**: `npm run dev`

2. **Create school**: `npm run school`

3. **Create event** in admin dashboard

4. **Access public URL**: `/p/[schoolSlug]/[eventSlug]`

5. **Test registration** with Israeli phone format

6. **Always follow up with automated tests** - don't rely only on manual testing

### 29.6 Deploying to Production (Railway)

1. **Test locally**:
   ```bash
   npm run build && npm run start:prod
   ```

2. **Check Railway connection**:
   ```bash
   railway status
   ```

3. **Deploy**:
   ```bash
   railway up
   ```

4. **Monitor deployment**:
   ```bash
   railway logs --follow
   ```

5. **Verify health**:
   - Visit: `https://[your-domain].railway.app/api/health`
   - Should return: `{ "status": "ok" }`

6. **Run migrations** (if needed):
   ```bash
   railway run npm run db:migrate
   ```

---

## 31. NEXT.JS 15 SPECIFIC PATTERNS

### 30.1 Async Components & APIs

- Server Components can be async (use `async` keyword freely)
- Use `await cookies()` and `await headers()` in Server Components/Actions
- API routes remain synchronous function exports (`export async function POST(request: Request)`)

### 30.2 Cookie Management

**In Server Components:**
```typescript
const cookieStore = await cookies()
const session = cookieStore.get('admin_session')
```

**In API routes with redirects:**
```typescript
const response = NextResponse.redirect(url)
response.cookies.set('session', token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 7
})
return response
```

### 30.3 Middleware

- Uses `jose` library (not `jsonwebtoken`) for Edge Runtime compatibility
- Convert JWT secret to Uint8Array: `new TextEncoder().encode(secret)`

---

## 32. KNOWN ISSUES & WORKAROUNDS

See `/docs/bugs/bugs.md` for comprehensive bug list. Key items:

1. **Email Sending (Development):**
   - Resend test mode: can only send to account owner email
   - Production: MUST verify domain at resend.com/domains
   - Workaround: Use `EMAIL_FROM="onboarding@resend.dev"` in dev

2. **Google OAuth:**
   - Account linking requires password confirmation (security feature)
   - Don't auto-link OAuth to password-protected accounts

3. **Session Cookie Persistence:**
   - When setting cookies + redirecting, set cookies on NextResponse object (not via `cookies()` API)
   - Next.js 15 requires explicit cookie setting on response for redirects

---

## 33. USEFUL SCRIPTS

See `scripts/` directory for utility scripts (run with `tsx scripts/<script-name>.ts`):

- `school-manager.ts` - Create/manage schools interactively (also: `npm run school`)
- `list-admins.ts` - List all admins in database
- `clean-orphaned-events.ts` - Remove events with null schoolId
- `list-events.ts` - List all events
- `fix-registration-status.ts` - Fix registration status issues
- `delete-admin-by-email.ts` - Delete admin by email
- `check-user-school.ts` - Check user school assignment
- `test-email.ts` - Test email configuration

---

**END OF baseRules-kartis.md**

**This is the PRIMARY development guide for kartis.info.**
**For quick reference, see `/CLAUDE.md`.**

---

## 27. 🛡️ BUG PREVENTION HARDENING (CRITICAL)

**Purpose:** These configurations catch bugs at compile/lint time BEFORE they reach production.

**Current State:** kartis.info has basic TypeScript strict mode but **missing critical safety nets**.

---

### 27.1 TypeScript Compiler Hardening (HIGH PRIORITY)

**Current `tsconfig.json` has:**
```json
{
  "compilerOptions": {
    "strict": true  // ✅ Good start, but NOT enough
  }
}
```

**Missing Safety Flags (ADD THESE):**

```jsonc
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // Already present ✅
    
    // CRITICAL ADDITIONS:
    "noUncheckedIndexedAccess": true,    // Prevents: array[0] bugs (undefined access)
    "noImplicitOverride": true,          // Prevents: accidental method shadowing
    "noUnusedLocals": true,              // Catches: dead code, logic errors
    "noUnusedParameters": true,          // Catches: incomplete refactors
    "noFallthroughCasesInSwitch": true,  // Prevents: switch statement bugs
    "exactOptionalPropertyTypes": true    // Prevents: undefined vs missing confusion
  }
}
```

**Real Bug Examples These Prevent:**

1. **`noUncheckedIndexedAccess`** - Prevents crashes:
   ```typescript
   // WITHOUT flag - compiles, crashes at runtime:
   const event = events[0]  // Could be undefined!
   console.log(event.title) // 💥 Runtime error
   
   // WITH flag - forces explicit check:
   const event = events[0]
   if (event) {  // Must check!
     console.log(event.title) // ✅ Safe
   }
   ```

2. **`noUnusedLocals`** - Catches logic errors:
   ```typescript
   // WITHOUT flag - compiles with dead code:
   function updateEvent(id: string, title: string) {
     const event = await prisma.event.findUnique({ where: { id } })
     // Forgot to use 'title' - BUG!
     await prisma.event.update({ where: { id }, data: { /* missing title */ } })
   }
   
   // WITH flag - compile error forces fix
   ```

3. **`noFallthroughCasesInSwitch`** - Prevents accidental fallthrough:
   ```typescript
   // WITHOUT flag - silent bug:
   switch (status) {
     case 'CONFIRMED':
       sendConfirmationEmail() // Runs for both CONFIRMED and WAITLIST!
     case 'WAITLIST':          // Missing break - BUG!
       addToWaitlist()
   }
   
   // WITH flag - compile error forces explicit break or comment
   ```

**Migration Path:**
1. Add flags to `tsconfig.json`
2. Run `npm run type-check` to see errors
3. Fix errors one file at a time (or use `// @ts-expect-error` with TODO comment)
4. Clean up temporary ignores over time

---

### 27.2 ESLint Bug Prevention Rules (CRITICAL)

**Current `.eslintrc.json` - DANGEROUS:**

```json
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "off",     // ❌ Allows type safety holes!
    "@typescript-eslint/no-unused-vars": "off",      // ❌ Allows dead code!
    "react-hooks/exhaustive-deps": "off",            // ❌ VERY DANGEROUS - hook bugs!
    "react/no-unescaped-entities": "off"             // ❌ Minor but allows HTML issues
  }
}
```

**Why These Are Off:** Probably to get legacy code building. **This is a major bug source.**

**Recommended Configuration (HIGH PRIORITY):**

```jsonc
// .eslintrc.json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked"  // ADD THIS
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"  // Enable type-aware linting
  },
  "plugins": ["@typescript-eslint"],
  "rules": {
    // CRITICAL - Turn these back ON:
    "@typescript-eslint/no-explicit-any": "error",          // Prevent type safety holes
    "@typescript-eslint/no-floating-promises": "error",     // Catch un-awaited async calls (MAJOR BUG SOURCE)
    "@typescript-eslint/no-unused-vars": "error",           // Catch dead code
    "react-hooks/exhaustive-deps": "error",                 // Prevent hook dependency bugs (CRITICAL for React)
    
    // Allow intentional ignores with underscore prefix:
    "@typescript-eslint/no-unused-vars": ["error", {
      "argsIgnorePattern": "^_",
      "varsIgnorePattern": "^_"
    }]
  }
}
```

**Real Bug Examples These Prevent:**

1. **`no-floating-promises`** - Catches un-awaited async (VERY COMMON BUG):
   ```typescript
   // WITHOUT rule - compiles, silently fails:
   async function createEvent() {
     prisma.event.create({ data: {...} })  // Forgot 'await' - NOT executed! 💥
     router.push('/events')                // Redirects before DB write completes
   }
   
   // WITH rule - compile error forces fix:
   async function createEvent() {
     await prisma.event.create({ data: {...} })  // ✅ Must await
     router.push('/events')
   }
   ```

2. **`exhaustive-deps`** - Prevents stale closure bugs (REACT HOOKS):
   ```typescript
   // WITHOUT rule - compiles, uses stale data:
   const [count, setCount] = useState(0)
   
   useEffect(() => {
     const interval = setInterval(() => {
       console.log(count)  // Always logs 0! 💥 Stale closure
     }, 1000)
     return () => clearInterval(interval)
   }, [])  // Missing 'count' dependency
   
   // WITH rule - compile error forces fix:
   useEffect(() => {
     const interval = setInterval(() => {
       console.log(count)  // ✅ Uses current count
     }, 1000)
     return () => clearInterval(interval)
   }, [count])  // Must include dependency
   ```

3. **`no-explicit-any`** - Prevents type safety holes:
   ```typescript
   // WITHOUT rule - compiles, type safety lost:
   async function getEvent(id: any) {  // Accepts anything!
     const event = await prisma.event.findUnique({ where: { id } })
     return event.title.toUpperCase()  // Crashes if id is wrong type 💥
   }
   
   // WITH rule - compile error forces proper types:
   async function getEvent(id: string) {  // ✅ Type-safe
     const event = await prisma.event.findUnique({ where: { id } })
     if (!event) throw new Error('Event not found')
     return event.title.toUpperCase()
   }
   ```

**Migration Path:**
1. Install type-aware ESLint:
   ```bash
   npm install --save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin
   ```

2. Update `.eslintrc.json` with recommended config above

3. Run `npm run lint` to see errors

4. Fix errors gradually:
   - Start with `no-floating-promises` (critical async bugs)
   - Then `exhaustive-deps` (React hook bugs)
   - Then `no-explicit-any` (type safety)

5. Use `// eslint-disable-next-line` with justification for legitimate exceptions

**DO NOT suppress all warnings to "get green builds" - you're hiding real bugs!**

---

### 27.3 Database Migration Safety (MANDATORY)

**Current Status:** ✅ Already using migrations correctly.

**Explicit Rule (DOCUMENT THIS):**

```markdown
❌ FORBIDDEN: prisma db push
✅ REQUIRED: prisma migrate dev (development)
✅ REQUIRED: prisma migrate deploy (production)
```

**Why This Matters:**

```bash
# WRONG - Can cause data loss:
npx prisma db push  # ❌ No migration history, risky schema changes

# CORRECT - Safe, trackable migrations:
npx prisma migrate dev --name add_table_field  # ✅ Creates migration
npx prisma migrate deploy                      # ✅ Applies in production
```

**Real Risk Example:**
```sql
-- prisma db push might do this:
ALTER TABLE "Event" DROP COLUMN "oldField";  -- 💥 Data loss!
ALTER TABLE "Event" ADD COLUMN "newField" TEXT;

-- prisma migrate allows review before applying:
-- Migration: 20250122_add_new_field.sql
-- You review the SQL before running migrate deploy
```

**Already Enforced in package.json:**
```json
{
  "scripts": {
    "db:migrate": "npx prisma migrate deploy",  // ✅ Correct
    "db:status": "npx prisma migrate status"    // ✅ Check status
  }
}
```

**Rule:** If someone suggests `prisma db push` → **REJECT** unless explicitly approved for throwaway dev environments.

---

### 27.4 Pre-Commit Type Checking (RECOMMENDED)

**Current `lint-staged` config:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",         // ✅ Already present
      "prettier --write"      // ✅ Already present
      // ❌ Missing: type checking
    ]
  }
}
```

**Recommended Addition:**
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix --max-warnings 0",        // Fail on warnings
      "prettier --write",
      "bash -c 'tsc --noEmit'"                // ADD: Type check before commit
    ]
  }
}
```

**Why Add This:**
- Catches type errors BEFORE they hit CI
- Fast (only type checking, no compilation)
- Prevents "forgot to run type-check" commits

**Trade-off:**
- ✅ Pro: Catches bugs early
- ⚠️ Con: Slows commits slightly (~2-5 seconds)

**Decision:** RECOMMENDED but not mandatory. Add if team prefers early bug detection over commit speed.

---

### 27.5 Bug Prevention Checklist (Quick Reference)

**Before deploying ANY code, verify:**

| Check | Status | Priority |
|-------|--------|----------|
| TypeScript hardening flags added | ⚠️ TODO | P0 |
| ESLint type-aware rules enabled | ⚠️ TODO | P0 |
| `no-floating-promises` turned on | ⚠️ TODO | P0 |
| `exhaustive-deps` turned on | ⚠️ TODO | P0 |
| `no-explicit-any` turned on | ⚠️ TODO | P1 |
| No `prisma db push` in scripts | ✅ DONE | P0 |
| Pre-commit type checking | ⚠️ OPTIONAL | P2 |

**Migration Order (Safest):**
1. ✅ Add TypeScript hardening flags → Fix errors
2. ✅ Enable `no-floating-promises` → Fix un-awaited async calls
3. ✅ Enable `exhaustive-deps` → Fix React hook dependencies
4. ✅ Enable `no-explicit-any` → Add proper types
5. ⚠️ (Optional) Add pre-commit type checking

**This will prevent 80% of production bugs before they happen.** 🛡️

---

## 28. ARCHITECTURE (KARTIS.INFO)
