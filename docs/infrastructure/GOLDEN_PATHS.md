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
- **API:** `POST /api/events`, `GET /api/events`
- **Helper Functions:**
  - `transliterateHebrew()` (Hebrew → English slug conversion)
  - `createSlugFromText()` (URL-friendly slug generation)
  - `generateUniqueSlug()` (Unique slug with counter)

### Selectors (LOCKED)
**Step 1 - Details (`currentStep === 0`):**
```
(No data-testid yet - needs to be added for automation)
Inputs:
- gameType (id: "gameType")
- title (id: "title")
- description (id: "description")
- location (id: "location")
```

**Step 2 - Timing (`currentStep === 1`):**
```
DateTimePicker components for:
- startAt (required)
- endAt (optional)
```

**Step 3 - Capacity (`currentStep === 2`):**
```
Inputs:
- capacity (id: "capacity")
- maxSpotsPerPerson (id: "maxSpots")
```

**Step 4 - Advanced (`currentStep === 3`):**
```
- FieldBuilder component (custom fields)
- conditions (id: "conditions")
- requireAcceptance (checkbox)
- completionMessage (id: "completionMessage")
```

**Navigation & Actions:**
```
- Save Draft button
- Preview button
- Cancel button
- Next Step button
- Previous Step button
- Submit button (final step only)
```

### Hebrew UI Text (LOCKED)
**Main Headers:**
- "יצירת אירוע חדש" (Create new event)
- "פרטי האירוע" (Event details)
- "תזמון האירוע" (Event timing)
- "הגדרות כמות" (Capacity settings)
- "שדות נוספים להרשמה" (Additional registration fields)
- "תנאים והגבלות" (Terms and conditions)
- "הודעה לנרשמים" (Message to registrants)

**Step 1 - Details:**
- "סוג אירוע" (Event type) - **REQUIRED**
- "כותרת האירוע" (Event title) - **REQUIRED**
- "תיאור" (Description)
- "מיקום" (Location)
- Placeholder: "כדורגל, כדורסל, טיול, הרצאה, מסיבה..." (Soccer, basketball, trip, lecture, party...)
- Placeholder: "משחק כדורגל נגד בית ספר..." (Soccer game against school...)

**Step 2 - Timing:**
- "תאריך ושעת התחלה" (Start date and time) - **REQUIRED**
- "תאריך ושעת סיום (אופציונלי)" (End date and time - optional)
- "משך האירוע מוגדר בהצלחה" (Event duration set successfully)

**Step 3 - Capacity:**
- "מספר מקומות כולל" (Total number of spots) - **REQUIRED**
- "מקסימום מקומות לנרשם" (Maximum spots per registrant) - **REQUIRED**

**Step 4 - Advanced:**
- "תנאי השתתפות" (Participation conditions)
- "דרוש אישור תנאי השתתפות בעת ההרשמה" (Require acceptance of conditions during registration)
- "הודעה לאחר השלמת הרשמה" (Message after registration completion)

**Buttons:**
- "שמור טיוטה" (Save draft)
- "תצוגה מקדימה" (Preview)
- "ביטול" (Cancel)
- "חזור" (Back)
- "המשך" (Continue)
- "צור אירוע" (Create event)
- "יוצר אירוע..." (Creating event...)

**Success Messages:**
- "האירוע נוצר בהצלחה!" (Event created successfully!)
- "מעביר לדף האירוע..." (Redirecting to event page...)
- "טיוטה נשמרה בהצלחה" (Draft saved successfully)
- "טיוטה נטענה בהצלחה" (Draft loaded successfully)

**Error Messages:**
- "אנא השלם את כל השדות הנדרשים" (Please complete all required fields)
- "סוג אירוע הוא שדה חובה" (Event type is required)
- "כותרת קצרה מדי (מינימום 3 תווים)" (Title too short - minimum 3 characters)
- "כותרת ארוכה מדי (מקסימום 100 תווים)" (Title too long - maximum 100 characters)
- "תאריך הסיום חייב להיות אחרי תאריך ההתחלה" (End date must be after start date)
- "מספר המקומות חייב להיות לפחות 1" (Number of spots must be at least 1)

**Draft Recovery Modal:**
- "נמצאה טיוטה שמורה" (Saved draft found)
- "מצאנו טיוטה שמורה מהפעם האחרונה. האם ברצונך להמשיך מאיפה שעצרת?" (We found a saved draft from last time. Do you want to continue where you left off?)
- "התחל מחדש ומחק טיוטה" (Start over and delete draft)
- "טען טיוטה והמשך לעבוד" (Load draft and continue working)

### Flow (Multi-Step Wizard)

**Initial Load:**
1. Admin navigates to `/admin/events/new`
2. System checks localStorage for saved draft (`AUTOSAVE_KEY`)
3. If draft exists → Show draft recovery modal
4. User chooses: Load draft OR Start fresh

**Step 1 - Details (`currentStep === 0`):**
1. User fills required fields:
   - `gameType` (min 2 chars) - **REQUIRED**
   - `title` (min 3 chars, max 100 chars) - **REQUIRED**
2. User fills optional fields:
   - `description` (max 500 chars)
   - `location`
3. Real-time validation on blur/change
4. Click "המשך" (Continue) → Validates step → Advances to Step 2
5. Validation errors block advancement with toast: "אנא השלם את כל השדות הנדרשים"

**Step 2 - Timing (`currentStep === 1`):**
1. User selects `startAt` (datetime-local input) - **REQUIRED**
2. User optionally selects `endAt`
3. Validation: `endAt` must be after `startAt` (if provided)
4. Click "המשך" → Advances to Step 3
5. Click "חזור" (Back) → Returns to Step 1

**Step 3 - Capacity (`currentStep === 2`):**
1. User sets `capacity` (min 1) - **REQUIRED**
2. User sets `maxSpotsPerPerson` (min 1, max 10) - **REQUIRED**
3. Auto-select on focus for easy replacement
4. Validation on blur: Clamps to valid range
5. Click "המשך" → Advances to Step 4

**Step 4 - Advanced (`currentStep === 3`):**
1. User builds custom fields via `FieldBuilder` component
2. User optionally adds:
   - `conditions` (max 500 chars)
   - `requireAcceptance` (checkbox)
   - `completionMessage` (max 300 chars)
3. Click "צור אירוע" (Create event) → Final submission

**Submission (`handleSubmit`):**
1. Prevent submission if not on final step (`currentStep < 3`)
2. Final validation:
   - No validation errors
   - `gameType` exists and >= 2 chars
   - `startAt` exists
3. Convert datetime-local strings to ISO with timezone
4. POST to `/api/events` with payload
5. **API executes:**
   ```typescript
   // Get admin session
   const admin = await getCurrentAdmin()

   // Enforce multi-tenant isolation
   if (admin.role !== 'SUPER_ADMIN') {
     if (!admin.schoolId) {
       return 403 "Admin must have a school assigned"
     }
     schoolId = admin.schoolId  // MUST use admin's school
   }

   // Validate required fields
   if (!data.title || !data.startAt) {
     return 400 "Title and start date are required"
   }

   // Generate unique slug from Hebrew title
   const slug = await generateUniqueSlug(data.title, schoolId)
   // Example: "כדורגל משחק 2024" → "kdvrgl-mschk-2024"
   // If slug exists → "kdvrgl-mschk-2024-2", "kdvrgl-mschk-2024-3", etc.

   // Create event
   await prisma.event.create({
     data: {
       slug,
       schoolId,  // CRITICAL: Always set from admin session
       title,
       description,
       gameType,
       location,
       startAt,
       endAt,
       capacity,
       maxSpotsPerPerson,
       fieldsSchema,
       conditions,
       requireAcceptance,
       completionMessage,
       eventType: 'CAPACITY_BASED',  // Default
       spotsReserved: 0  // Initialize atomic counter
     }
   })
   ```
6. **Success:**
   - Track event creation in Google Analytics
   - Show full-screen success animation (green gradient, checkmark icon)
   - Clear localStorage draft
   - Display: "האירוע נוצר בהצלחה! מעביר לדף האירוע..."
   - Redirect to `/admin/events/[id]` after 2.5 seconds
7. **Failure:**
   - Show toast with error message
   - User remains on form to fix issues

**Autosave Mechanism:**
- Interval: Every 10 seconds (`AUTOSAVE_INTERVAL`)
- Triggers: If `hasUnsavedChanges === true` and `formData.title` is not empty
- Saves to localStorage:
  ```json
  {
    "formData": { ... },
    "currentStep": 2,
    "completedSteps": [0, 1],
    "savedAt": "2025-01-22T10:30:00Z"
  }
  ```
- Manual save: Ctrl+S or "שמור טיוטה" button
- Clear draft: On successful submission or explicit discard

**Keyboard Shortcuts:**
- `Ctrl+S` / `Cmd+S` → Save draft manually
- `Ctrl+P` / `Cmd+P` → Open preview modal
- `Enter` → Blocked in inputs (prevents accidental submission), allowed in textareas/buttons

### Multi-Tenant Enforcement (CRITICAL)

**POST /api/events:**
```typescript
// CORRECT PATTERN (LOCKED)
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned' },
      { status: 400 }
    )
  }
  schoolId = admin.schoolId  // MUST use admin's school
}

// For SUPER_ADMIN only:
if (admin.role === 'SUPER_ADMIN') {
  schoolId = data.schoolId || admin.schoolId
}

// Final validation
if (!schoolId) {
  return NextResponse.json(
    { error: 'School ID is required' },
    { status: 400 }
  )
}

// Create event with schoolId
await prisma.event.create({
  data: {
    schoolId,  // CRITICAL: Always from admin session
    // ... other fields
  }
})
```

**GET /api/events (for event list page):**
```typescript
// CORRECT PATTERN (LOCKED)
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned' },
      { status: 403 }
    )
  }
  where.schoolId = admin.schoolId  // FILTER by admin's school
}

// SUPER_ADMIN can filter by query param or see all
if (admin.role === 'SUPER_ADMIN') {
  const schoolId = url.searchParams.get('schoolId')
  if (schoolId) {
    where.schoolId = schoolId
  }
  // No filter → see all schools
}
```

**FORBIDDEN Patterns:**
```typescript
// WRONG - Silent bypass if schoolId is undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}

// WRONG - Trusting client-provided schoolId
const { schoolId } = await request.json()
where.schoolId = schoolId  // SECURITY VULNERABILITY

// WRONG - No check for undefined
where.schoolId = admin.schoolId  // Could be undefined!
```

### Validation Rules (LOCKED)

**Character Limits:**
- `title`: Max 100 chars, min 3 chars
- `gameType`: Min 2 chars (required)
- `description`: Max 500 chars
- `conditions`: Max 500 chars
- `completionMessage`: Max 300 chars

**Number Validation:**
- `capacity`: Min 1, must be positive integer
- `maxSpotsPerPerson`: Min 1, max 10, must be positive integer

**Date Validation:**
- `startAt`: Required, must be valid ISO date
- `endAt`: Optional, if provided must be after `startAt`

**Step Validation (`validateStep`):**
- Step 0: `title.length >= 3` AND `gameType.length >= 2` AND no validation errors
- Step 1: `startAt !== ''` AND no `endAt` errors
- Step 2: `capacity >= 1` AND `maxSpotsPerPerson >= 1`
- Step 3: Always valid (optional fields)

**Slug Generation Rules:**
1. Transliterate Hebrew to English:
   - א→a, ב→b, ג→g, ד→d, ה→h, ו→v, ז→z, ח→ch, etc.
   - Example: "כדורגל" → "kdvrgl"
2. Convert to lowercase, remove special chars, replace spaces with hyphens
3. Limit to 60 characters
4. If slug exists, append counter: `slug-2`, `slug-3`, etc.
5. Safety limit: After 100 attempts, use random suffix

### Tests
- `tests/suites/03-event-management-p0.spec.ts`
  - ✅ Successful event creation (all steps)
  - ✅ Step validation prevents skipping required fields
  - ✅ Duplicate slug auto-increments (slug-2, slug-3)
  - ✅ Missing required fields rejected at each step
  - ✅ `schoolId` properly set from admin session
  - ✅ Non-SUPER_ADMIN cannot create events for other schools
  - ✅ Hebrew slug transliteration works correctly
  - 🚧 Draft autosave and recovery (TO BE ADDED)
  - 🚧 Keyboard shortcuts (Ctrl+S, Ctrl+P) (TO BE ADDED)

### Invariants Protected
- `INVARIANT_MT_001` - Multi-tenant isolation (schoolId enforcement)
- `INVARIANT_CAP_002` - Valid capacity initialization (>= 1)
- `INVARIANT_SLUG_001` - Unique event slugs (with auto-increment)

### Technical Implementation Notes

**Autosave Storage:**
- Key: `'eventFormDraft'` in localStorage
- Interval: 10 seconds
- Cleared: On successful submission or explicit discard

**Form State Management:**
- 4-step wizard with `currentStep` (0-3)
- `completedSteps` Set tracks validated steps
- `hasUnsavedChanges` triggers beforeunload warning
- `validationErrors` object stores field-level errors

**Number Input UX:**
- String inputs for capacity/maxSpots (better UX)
- Auto-select on focus for easy replacement
- Blur validation clamps to valid range
- Prevents invalid values

**Components Used:**
- `StepWizard` - Progress indicator
- `DateTimePicker` - Hebrew RTL datetime picker
- `FieldBuilder` - Custom field schema editor
- `EventPreviewModal` - Preview before submission
- `Modal` - Draft recovery dialog
- `Toast` - Notifications system

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

| Golden Path | Status | Priority | Test Coverage | Files Locked |
|-------------|--------|----------|---------------|--------------|
| AUTH_LOGIN_V1 | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |
| AUTH_SIGNUP_V1 | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |
| AUTH_GOOGLE_OAUTH_V1 | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |
| EVENT_CREATE_V1 | 🔒 LOCKED | P0 | 🚧 In Progress | ✅ @LOCKED header added |
| REGISTRATION_SUBMIT_V1 | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |
| REGISTRATION_ADMIN_VIEW_V1 | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |
| TABLE_MANAGEMENT_V1 | 🔓 UNLOCKED | P1 | ✅ 100% | N/A |
| MULTI_TENANT_ISOLATION_GLOBAL | 🔒 LOCKED | P0 | ✅ 100% | ✅ @LOCKED header |

---

**Last Review:** 2025-12-22 (EVENT_CREATE_V1 fully documented and locked)
**Next Review:** After any LOCKED path modification
