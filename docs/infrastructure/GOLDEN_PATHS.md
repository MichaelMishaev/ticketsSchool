# 🏆 GOLDEN PATH REGISTRY - kartis.info

**Last Updated:** 2025-12-21
**Status:** ACTIVE
**Purpose:** Protect business-critical flows from regression

---

## 📖 WHAT IS A GOLDEN PATH?

A Golden Path is a **business-critical user flow** that must remain stable and predictable.

Breaking a Golden Path means:
- Users can't complete essential tasks
- Revenue is lost
- Trust is damaged
- Support tickets spike

**All Golden Paths are LOCKED by default unless explicitly UNLOCKED.**

---

## 🚦 STATUS DEFINITIONS

- **LOCKED** - No changes allowed without explicit approval
- **UNLOCKED** - Changes allowed, update this doc after
- **DEPRECATED** - Being replaced, don't enhance
- **PLANNED** - Not yet implemented

---

## AUTH_LOGIN_V1

**Status:** 🔒 LOCKED

### Scope
- **Route:** `/admin/login`
- **Component:** `app/admin/login/page.tsx`
- **API:** `POST /api/admin/login`

### Selectors (LOCKED)
```
login-email-input
login-password-input
login-submit-button
login-error-message
```

### Hebrew UI Text (LOCKED)
- "התחברות" (Login)
- "אימייל" (Email)
- "סיסמה" (Password)
- "התחבר" (Login button)
- "אימייל או סיסמה שגויים" (Invalid credentials error)

### Flow
1. User navigates to `/admin/login`
2. Enters email + password
3. Submits form
4. API validates credentials (bcrypt compare)
5. **Success:**
   - Creates JWT session with `adminId`, `email`, `role`, `schoolId`, `schoolName`
   - Sets HTTP-only cookie (`admin_session`)
   - Redirects to `/admin/dashboard` (if schoolId exists) OR `/admin/onboarding` (if null)
6. **Failure:**
   - Shows inline error: "אימייל או סיסמה שגויים"
   - No redirect

### Security Requirements
- Password validation via bcrypt
- JWT signed with `JWT_SECRET`
- HTTP-only cookie (prevents XSS)
- No sensitive data in error messages

### Multi-Tenant Enforcement
- Session includes `schoolId` (may be null before onboarding)
- Middleware validates JWT on protected routes

### Tests
- `tests/suites/01-auth-p0.spec.ts`
  - Valid login succeeds
  - Invalid credentials rejected
  - Missing fields rejected
  - Session persists after login

### Invariants Protected
- `INVARIANT_AUTH_001` - Session integrity
- `INVARIANT_AUTH_002` - Password security

---

## AUTH_SIGNUP_V1

**Status:** 🔒 LOCKED

### Scope
- **Route:** `/admin/signup`
- **Component:** `app/admin/signup/page.tsx`
- **API:** `POST /api/admin/signup`

### Selectors (LOCKED)
```
signup-name-input
signup-email-input
signup-password-input
signup-school-name-input
signup-school-slug-input
signup-submit-button
signup-error-message
```

### Hebrew UI Text (LOCKED)
- "הרשמה" (Signup)
- "שם מלא" (Full name)
- "אימייל" (Email)
- "סיסמה" (Password)
- "שם בית הספר/ארגון" (School/Org name)
- "כתובת URL ייעודית" (Dedicated URL)
- "צור חשבון" (Create account)

### Flow
1. User navigates to `/admin/signup`
2. Fills form: name, email, password, schoolName, schoolSlug
3. Submits form
4. API validates:
   - Email not already registered
   - School slug unique
   - Password meets requirements (min 8 chars)
5. **Success:**
   - Creates school + admin in transaction
   - Sends verification email via Resend
   - Shows success message: "חשבון נוצר בהצלחה! נשלח אימייל אימות"
   - Redirects to `/admin/login`
6. **Failure:**
   - Shows inline error (e.g., "אימייל כבר קיים")

### Security Requirements
- Password hashed with bcrypt (10 rounds)
- Email verification required before full access (future)
- Unique constraint on email + schoolSlug

### Multi-Tenant Enforcement
- Creates new school + links admin via `schoolId`
- Transaction ensures atomicity (both created or neither)

### Tests
- `tests/suites/01-auth-p0.spec.ts`
  - Successful signup
  - Duplicate email rejected
  - Duplicate school slug rejected
  - Missing fields rejected

### Invariants Protected
- `INVARIANT_AUTH_001` - Session integrity
- `INVARIANT_MT_001` - Multi-tenant isolation (new school created)

---

## AUTH_GOOGLE_OAUTH_V1

**Status:** 🔒 LOCKED

### Scope
- **Route:** `/admin/login` (Google button)
- **API:** `GET /api/auth/google`, `GET /api/auth/google/callback`

### Flow
1. User clicks "התחבר עם Google" button
2. Redirects to Google OAuth consent screen
3. User approves
4. Callback receives auth code
5. Exchanges code for Google user info
6. **If new user:**
   - Creates account with `emailVerified: true`
   - Redirects to `/admin/onboarding`
7. **If existing user (no password):**
   - Auto-links Google account
   - Creates session
   - Redirects to `/admin/dashboard`
8. **If existing user (with password):**
   - REQUIRES password confirmation before linking (security)
   - Shows warning: "חשבון זה כבר קיים עם סיסמה. אנא התחבר עם סיסמה"

### Security Requirements
- OAuth state parameter validated (CSRF protection)
- No auto-linking to password-protected accounts without confirmation

### Tests
- `tests/suites/01-auth-p0.spec.ts`
  - New user signup via Google
  - Existing user login via Google
  - Password-protected account requires confirmation

---

## EVENT_CREATE_V1

**Status:** 🔒 LOCKED

### Scope
- **Route:** `/admin/events/new`
- **Component:** `app/admin/events/new/page.tsx`
- **API:** `POST /api/events`

### Selectors (LOCKED)
```
event-title-input
event-slug-input
event-description-textarea
event-capacity-input
event-start-date-input
event-submit-button
event-error-message
```

### Hebrew UI Text (LOCKED)
- "יצירת אירוע חדש" (Create new event)
- "כותרת" (Title)
- "כתובת URL" (URL)
- "תיאור" (Description)
- "כמות מקומות" (Capacity)
- "תאריך ושעה" (Date and time)
- "צור אירוע" (Create event)

### Flow
1. Admin navigates to `/admin/events/new`
2. Fills form: title, slug, description, capacity, startDate
3. Submits form
4. API validates:
   - Admin is authenticated
   - Admin has `schoolId` (not null)
   - Event slug unique within school
   - Capacity > 0
5. **Success:**
   - Creates event with `schoolId = admin.schoolId`
   - Initializes `spotsReserved = 0`
   - Shows success message
   - Redirects to `/admin/events/[id]`
6. **Failure:**
   - Shows inline error

### Multi-Tenant Enforcement (CRITICAL)
- API MUST set `schoolId = admin.schoolId`
- API MUST reject if `admin.schoolId` is null
- No cross-school event creation

### Tests
- `tests/suites/03-event-management-p0.spec.ts`
  - Successful event creation
  - Duplicate slug rejected (within school)
  - Missing required fields rejected
  - schoolId properly set

### Invariants Protected
- `INVARIANT_MT_001` - Multi-tenant isolation
- `INVARIANT_CAP_002` - Valid capacity initialization

---

## REGISTRATION_SUBMIT_V1

**Status:** 🔒 LOCKED (MOST CRITICAL FLOW)

### Scope
- **Route:** `/p/[schoolSlug]/[eventSlug]`
- **Component:** `app/p/[schoolSlug]/[eventSlug]/RegistrationForm.tsx`
- **API:** `POST /api/p/[schoolSlug]/[eventSlug]/register`

### Selectors (LOCKED)
```
registration-name-input
registration-email-input
registration-phone-input
registration-spots-input
registration-submit-button
registration-confirmation-modal
registration-confirmation-code
registration-error-message
```

### Hebrew UI Text (LOCKED)
- "הרשמה לאירוע" (Register for event)
- "שם מלא" (Full name)
- "אימייל" (Email)
- "טלפון" (Phone)
- "כמות מקומות" (Number of spots)
- "שלח הרשמה" (Submit registration)
- "קוד אישור" (Confirmation code)

### Flow
1. User navigates to public event page
2. Fills form: name, email, phone, spotsCount
3. Client validates required fields
4. Normalizes phone (Israeli format: 10 digits, starts with 0)
5. Submits to API
6. **API executes atomic transaction:**
   ```typescript
   await prisma.$transaction(async (tx) => {
     const event = await tx.event.findUnique({ where: { id: eventId } })

     if (event.spotsReserved + spotsCount > event.capacity) {
       status = 'WAITLIST'
     } else {
       await tx.event.update({
         where: { id: eventId },
         data: { spotsReserved: { increment: spotsCount } }
       })
       status = 'CONFIRMED'
     }

     const registration = await tx.registration.create({
       data: {
         eventId,
         status,
         name,
         email,
         phone: normalizedPhone,
         spotsCount,
         confirmationCode: generateCode()
       }
     })

     return { registration, status }
   })
   ```
7. **Success:**
   - Shows confirmation modal with code
   - Sends confirmation email (future)
8. **Failure:**
   - Shows inline error

### Multi-Tenant Enforcement
- API validates `schoolSlug` + `eventSlug` match
- No cross-school registration possible

### Critical Requirements
- **Atomic capacity check** (no race conditions)
- **Phone normalization** (Israeli format)
- **Unique confirmation code** (6 digits)

### Tests
- `tests/suites/04-public-registration-p0.spec.ts`
  - Successful registration (CONFIRMED status)
  - Capacity full → WAITLIST status
  - Phone normalization works
  - Missing fields rejected
- `tests/critical/atomic-capacity.spec.ts`
  - Concurrent registrations don't exceed capacity
  - Transaction rollback on error

### Invariants Protected
- `INVARIANT_CAP_001` - Atomic capacity enforcement
- `INVARIANT_MT_001` - Multi-tenant isolation
- `INVARIANT_DATA_001` - Phone normalization

---

## REGISTRATION_ADMIN_VIEW_V1

**Status:** 🔒 LOCKED

### Scope
- **Route:** `/admin/events/[id]`
- **Component:** `app/admin/events/[id]/page.tsx`
- **API:** `GET /api/events/[id]/registrations`

### Selectors (LOCKED)
```
registrations-table
registration-row-{id}
registration-status-badge
registration-export-button
```

### Hebrew UI Text (LOCKED)
- "רשימת נרשמים" (Registrations list)
- "אושר" (Confirmed)
- "רשימת המתנה" (Waitlist)
- "בוטל" (Cancelled)

### Flow
1. Admin navigates to event details page
2. API fetches registrations WHERE `eventId = [id]` AND `event.schoolId = admin.schoolId`
3. Displays table with: name, email, phone, status, confirmationCode
4. Admin can export to CSV

### Multi-Tenant Enforcement (CRITICAL)
- API MUST verify event belongs to admin's school
- Pattern:
  ```typescript
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { registrations: true }
  })

  if (admin.role !== 'SUPER_ADMIN' && event.schoolId !== admin.schoolId) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }
  ```

### Tests
- `tests/suites/06-multi-tenant-p0.spec.ts`
  - Admin can view own school's registrations
  - Admin CANNOT view other school's registrations (403)

### Invariants Protected
- `INVARIANT_MT_001` - Multi-tenant isolation

---

## TABLE_MANAGEMENT_V1

**Status:** 🔓 UNLOCKED (New Feature - Recently Added)

### Scope
- **Routes:**
  - `/admin/events/[id]/tables` (table management page)
- **APIs:**
  - `POST /api/events/[id]/tables` - Create table
  - `PATCH /api/events/[id]/tables/[tableId]` - Update table
  - `DELETE /api/events/[id]/tables/[tableId]` - Delete table
  - `POST /api/events/[id]/tables/[tableId]/duplicate` - Duplicate tables
  - `POST /api/events/[id]/tables/bulk-edit` - Bulk edit tables
  - `DELETE /api/events/[id]/tables/bulk-delete` - Bulk delete tables

### Features
1. **Duplicate Tables** - Copy 1 table → 30+ tables with auto-increment naming
2. **Template System** - Save/apply table configurations
3. **Bulk Edit** - Update capacity/status for multiple tables at once

### Multi-Tenant Enforcement
- All APIs verify event belongs to admin's school
- Pattern:
  ```typescript
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (admin.role !== 'SUPER_ADMIN' && event.schoolId !== admin.schoolId) {
    return 403
  }
  ```

### Tests
- `tests/suites/07-table-management-p0.spec.ts`
  - Duplicate tables feature
  - Template save/apply
  - Bulk edit/delete
  - Multi-tenant isolation

### Invariants Protected
- `INVARIANT_MT_001` - Multi-tenant isolation
- `INVARIANT_TABLE_001` - Can't delete reserved tables

### Documentation
- `/docs/features/table-management.md`

---

## MULTI_TENANT_ISOLATION_GLOBAL

**Status:** 🔒 LOCKED (HIGHEST PRIORITY)

### Scope
**ALL API routes in:**
- `/app/api/events/*`
- `/app/api/dashboard/*`
- `/app/api/admin/team/*`

### Required Pattern (NON-NEGOTIABLE)
```typescript
import { requireAdmin } from '@/lib/auth.server'

export async function GET(request: Request) {
  const admin = await requireAdmin()

  const where: Prisma.EventWhereInput = {}

  // CRITICAL: Enforce schoolId for non-SUPER_ADMIN
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

### Common Violations (FORBIDDEN)
```typescript
// WRONG - Silent bypass if schoolId is undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}

// WRONG - No check for undefined schoolId
where.schoolId = admin.schoolId

// WRONG - Trusting client-provided schoolId
const { schoolId } = await request.json()
where.schoolId = schoolId // SECURITY VULNERABILITY
```

### Tests
- `tests/suites/06-multi-tenant-p0.spec.ts`
- `tests/critical/multi-tenant-isolation.spec.ts`

### Invariants Protected
- `INVARIANT_MT_001` - Multi-tenant isolation
- `INVARIANT_MT_002` - No cross-school data access

---

## 📋 ADDING A NEW GOLDEN PATH

When implementing a new critical flow:

1. **Implement the feature**
2. **Add entry to this file** using the template:

```markdown
## FEATURE_NAME_V1

**Status:** 🔓 UNLOCKED (or 🔒 LOCKED if immediately critical)

### Scope
- Route:
- Component:
- API:

### Selectors (if LOCKED)
[List all data-testid]

### Hebrew UI Text (if LOCKED)
[List all user-facing strings]

### Flow
[Step-by-step user flow]

### Multi-Tenant Enforcement
[How schoolId is enforced]

### Tests
[Link to test files]

### Invariants Protected
[List affected invariants]
```

3. **Write comprehensive tests**
4. **Mark as LOCKED if business-critical**

---

## 🔄 UPDATING A GOLDEN PATH

To modify a LOCKED Golden Path:

1. **Request UNLOCK** in this format:
   ```
   REQUEST UNLOCK: REGISTRATION_SUBMIT_V1

   Reason: Add table selection feature
   Impact: New field in form, DB schema change
   Risks: May break existing tests
   ```

2. **Wait for explicit approval**

3. **After approval:**
   - Make changes
   - Update this document
   - Update tests
   - Re-LOCK if still critical

---

## 📊 GOLDEN PATH STATUS SUMMARY

| Golden Path | Status | Priority | Test Coverage |
|-------------|--------|----------|---------------|
| AUTH_LOGIN_V1 | 🔒 LOCKED | P0 | ✅ 100% |
| AUTH_SIGNUP_V1 | 🔒 LOCKED | P0 | ✅ 100% |
| AUTH_GOOGLE_OAUTH_V1 | 🔒 LOCKED | P0 | ✅ 100% |
| EVENT_CREATE_V1 | 🔒 LOCKED | P0 | 🚧 In Progress |
| REGISTRATION_SUBMIT_V1 | 🔒 LOCKED | P0 | ✅ 100% |
| REGISTRATION_ADMIN_VIEW_V1 | 🔒 LOCKED | P0 | ✅ 100% |
| TABLE_MANAGEMENT_V1 | 🔓 UNLOCKED | P1 | ✅ 100% |
| MULTI_TENANT_ISOLATION_GLOBAL | 🔒 LOCKED | P0 | ✅ 100% |

---

**Last Review:** 2025-12-21
**Next Review:** After any LOCKED path modification
