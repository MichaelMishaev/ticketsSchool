# Bug Report - Authentication & Onboarding Flow

**Date:** 2025-11-10
**Last Updated:** 2026-01-11
**Severity Levels:** 🔴 CRITICAL | 🟠 MODERATE | 🟡 LOW

---

### Bug #1: Payment Required UX - "Free" Option Shown When Payment Required ✅ FIXED

**Files:**

- `/app/admin/events/new/page.tsx:278-289` (handleChange function)
- `/app/admin/events/new/page.tsx:1271-1289` (Pricing model dropdown)
- `/app/admin/events/new/page.tsx:459-467` (Payment validation)

**Severity:** 🟡 LOW (UX confusion, no data loss)
**Status:** ✅ FIXED (2026-01-11)

**Description:**
When creating a paid event, the "הגדרות תשלום" (Payment Settings) section showed contradictory UX:

- User checks "דרוש תשלום לאירוע זה" (Require payment for this event)
- The "מודל תמחור" (Pricing Model) dropdown still displays "חינם (ללא תשלום)" (Free - no payment) as an option
- This creates confusion: if payment is required, why is "free" an option?

**User Report:**
"on http://localhost:9000/admin/events/new set payment requre: and the third dropdown suggest free, i think its ux cinfuse bug,?"

**Impact:**

- 🟡 **LOW:** UX confusion (contradictory options)
- 🟡 **LOW:** User might question if payment is actually required
- 🟡 **LOW:** Looks like a bug even though technically payment settings would override pricing model

**Root Cause:**
The pricing model dropdown always showed all three options (FIXED_PRICE, PER_GUEST, FREE) regardless of whether payment was required. The default `pricingModel` value was 'FREE', so when checking "payment required", the dropdown still showed "Free" as selected.

**Before:**

```typescript
<select id="pricingModel" value={formData.pricingModel} onChange={...}>
  <option value="FIXED_PRICE">מחיר קבוע להרשמה</option>
  <option value="PER_GUEST">מחיר לכל אורח (טבלאות)</option>
  <option value="FREE">חינם (ללא תשלום)</option>  {/* ❌ Confusing when payment required */}
</select>
```

**Fix Applied:**

1. **Auto-switch pricing model** (lines 278-289): When `paymentRequired` is toggled to `true` and `pricingModel` is `FREE`, automatically change `pricingModel` to `FIXED_PRICE`
2. **Remove FREE option** (lines 1271-1289): Removed the `FREE` option from the pricing model dropdown entirely (only show FIXED_PRICE and PER_GUEST when payment is required)
3. **Simplified validation** (lines 459-467): Updated validation to always require a price amount when payment is required (since FREE is no longer an option)

**After:**

```typescript
// 1. Auto-switch when enabling payment
const handleChange = (name: string, value: string | number | boolean) => {
  if (name === 'paymentRequired' && value === true && formData.pricingModel === 'FREE') {
    setFormData((prev) => ({ ...prev, [name]: value, pricingModel: 'FIXED_PRICE' }))
  } else {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }
  // ...
}

// 2. Dropdown without FREE option
<select id="pricingModel" value={formData.pricingModel} onChange={...}>
  <option value="FIXED_PRICE">מחיר קבוע להרשמה</option>
  <option value="PER_GUEST">מחיר לכל אורח (טבלאות)</option>
  {/* FREE option removed - only shown when payment is NOT required */}
</select>

// 3. Simplified validation
if (formData.paymentRequired) {
  if (!formData.priceAmount || formData.priceAmount <= 0) {
    addToast('יש להזין מחיר חיובי כאשר האירוע בתשלום', 'error')
    return
  }
}
```

**Regression Prevention:**

- ✅ Created test: `/tests/suites/03-event-management-p0.spec.ts:1057-1156`
- ✅ Test verifies FREE option is NOT shown when payment required
- ✅ Test verifies only FIXED_PRICE and PER_GUEST options are available
- ✅ Test verifies pricing model is hidden when payment NOT required

**User Experience Improvement:**

- ✅ Clear UX: when payment is required, only paid pricing models are shown
- ✅ Auto-correction: system automatically switches from FREE to FIXED_PRICE
- ✅ Better validation: clearer error message when price is missing
- ✅ No confusion: contradictory options eliminated

---

### Bug #0: Event Creation API Ignores Payment Fields ✅ FIXED

**Files:**

- `/app/api/events/route.ts:294-325` (CREATE endpoint - FIXED)
- `/app/api/events/[id]/route.ts:152-157` (UPDATE endpoint - already correct)

**Severity:** 🔴 CRITICAL (data loss, payment system broken)
**Status:** ✅ FIXED (2026-01-11)

**Description:**
When creating a paid event through the admin dashboard, the event creation API completely ignored all payment-related fields (`paymentRequired`, `paymentTiming`, `pricingModel`, `priceAmount`, `currency`), causing events to be saved as FREE even when configured as PAID.

**User Report:**
Admin created event with "payment required for each user" but event was saved with:

- `paymentRequired: false` (should be `true`)
- `paymentTiming: OPTIONAL` (should be `UPFRONT`)
- `priceAmount: null` (should be configured amount)

This caused registrations to have inconsistent `paymentStatus: PENDING` on a free event.

**Impact:**

- 🔴 **CRITICAL:** Payment configuration lost on event creation
- 🔴 **CRITICAL:** Revenue loss - paid events became free
- 🟠 **MODERATE:** Data inconsistency (pending payments on free events)
- 🟠 **MODERATE:** Admin confusion about event status

**Root Cause:**
In `/app/api/events/route.ts:294-319`, the `prisma.event.create()` call only saved basic event fields but completely omitted the payment fields that were sent by the frontend form.

**Before (Lines 294-319):**

```typescript
const event = await prisma.event.create({
  data: {
    slug,
    schoolId,
    title: data.title,
    // ... other fields ...
    // ❌ Payment fields completely missing!
  },
})
```

**Fix Applied:**
Added payment fields to event creation (lines 315-320):

```typescript
const event = await prisma.event.create({
  data: {
    // ... existing fields ...
    // Payment fields (Tier 2: Event Ticketing - YaadPay)
    paymentRequired: (data as any).paymentRequired ?? false,
    paymentTiming: (data as any).paymentTiming ?? 'OPTIONAL',
    pricingModel: (data as any).pricingModel ?? 'FREE',
    priceAmount: (data as any).priceAmount ? Number((data as any).priceAmount) : null,
    currency: (data as any).currency || 'ILS',
  },
})
```

**Note:** The UPDATE endpoint (`/app/api/events/[id]/route.ts:152-157`) was already correctly handling payment fields, so this bug only affected event creation, not updates.

**Regression Prevention:**

- ✅ Created test: `/__tests__/payment-event-creation.test.ts`
- ✅ Tests both paid and free event creation
- ✅ Tests verify payment fields are saved correctly
- ⚠️ **TODO:** Add E2E Playwright test for full event creation flow with payment

**Future Improvement:**
Add `NOT_REQUIRED` value to `PaymentStatus` enum for better data semantics on free events (currently defaults to `PENDING` which is misleading).

---

### Bug #-1: Payment Error Messages in English Instead of Hebrew ✅ FIXED

**Files:**

- `/app/api/payment/create/route.ts` (17 error messages translated)

**Severity:** 🟠 MODERATE (poor UX, language inconsistency)
**Status:** ✅ FIXED (2026-01-11)

**Description:**
Payment creation API returned error messages in English while the entire application is Hebrew RTL. User screenshot showed error modal with:

- Hebrew title: "שגיאה בתשלום" (Payment error)
- English message: "Phone number already registered for this event"

This created a confusing mixed-language experience.

**Impact:**

- Inconsistent user experience (Hebrew UI with English errors)
- Reduced comprehension for Hebrew-only speakers
- Unprofessional appearance (language mismatch)
- Confusion between error source (payment vs registration)

**Root Cause:**
All error messages in `/app/api/payment/create/route.ts` were hardcoded in English, while the registration API (`/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts`) had proper Hebrew translations.

**Fix Applied:**
Translated all 17 error messages in payment creation API from English to Hebrew:

1. ✅ "Missing required parameters" → "חסרים פרמטרים נדרשים"
2. ✅ "Invalid registration data" → "נתוני הרשמה לא תקינים"
3. ✅ "Missing required fields: name and phone" → "חסרים שדות חובה: שם וטלפון"
4. ✅ "Email is required for payment events" → "אימייל נדרש לאירועים עם תשלום"
5. ✅ "School not found" → "בית הספר לא נמצא"
6. ✅ "Event not found" → "האירוע לא נמצא"
7. ✅ "Event does not require upfront payment" → "האירוע לא דורש תשלום מראש"
8. ✅ "Event registration is closed" → "ההרשמה לאירוע נסגרה"
9. ✅ "Event registration is paused" → "ההרשמה לאירוע מושהית"
10. ✅ "Event pricing not configured" → "התמחור לא הוגדר לאירוע זה"
11. ✅ "Invalid participant count for per-guest pricing" → "מספר משתתפים לא תקין"
12. ✅ "Event is free, payment not required" → "האירוע חינמי, תשלום לא נדרש"
13. ✅ "Invalid pricing model" → "מודל תמחור לא תקין"
14. ✅ "Invalid phone number format" → "פורמט מספר טלפון לא תקין"
15. ✅ "Phone number already registered for this event" → "מספר הטלפון כבר רשום לאירוע זה"
16. ✅ "Payment already initiated for this request" → "תשלום כבר יזם עבור בקשה זו"
17. ✅ "Payment system not configured. Please contact support." → "מערכת התשלומים לא מוגדרת. אנא פנה לתמיכה."
18. ✅ "Failed to create payment session" → "נכשל ביצירת הפעלת תשלום"

**Prevention Strategies:**

1. **Code Review Checklist:** Add "All error messages in Hebrew" to PR checklist
2. **ESLint Plugin:** Create custom rule to detect English strings in error responses
3. **i18n System:** Consider implementing react-i18n for centralized translation management
4. **Developer Guidelines:** Document requirement: "All user-facing text must be in Hebrew"
5. **Test Coverage:** Add E2E tests that verify error messages are in Hebrew

**Files Changed:**

- ✅ `/app/api/payment/create/route.ts` (lines 23, 30, 38, 45, 58, 88, 96, 104, 111, 119, 138, 147, 153, 164, 180, 301, 351, 358)

---

### Bug #0: Unprofessional Browser Alerts in Public Registration Flow ✅ FIXED

**Files:**

- `/app/p/[schoolSlug]/[eventSlug]/page.tsx` (6 alerts removed)
- `/app/cancel/[token]/page.tsx` (3 alerts removed)
- `/components/ui/Modal.tsx` (NEW - 306 lines)
- `/components/ui/Toast.tsx` (NEW - 244 lines)

**Severity:** 🔴 CRITICAL (poor UX, unprofessional appearance, mobile UX issues)
**Status:** ✅ FIXED (2026-01-11)

**Description:**
Public-facing registration pages used browser `alert()`, `window.confirm()` dialogs that blocked user interaction and created an unprofessional appearance. Screenshot from user showed alert "Email is required for payment events" interrupting registration flow.

**Impact:**

- Unprofessional user experience (browser default styling)
- Blocked all page interaction during alerts
- No Hebrew RTL support
- Poor mobile UX (alerts too small on mobile)
- Not accessible (no WCAG compliance)
- Didn't match Design System 2026 aesthetics

**Root Causes:**

1. No centralized modal/notification component system
2. Missing client-side email validation for payment events
3. No ESLint rules preventing browser alerts
4. No code review checklist for UX patterns

**Fix Applied:**
Created professional Modal and Toast notification systems:

**Modal Component** (`/components/ui/Modal.tsx`):

- 5 types: info, error, success, warning, confirmation
- Hebrew RTL support (`dir="rtl"`)
- WCAG AAA accessible (keyboard nav, focus trap, ARIA labels)
- Mobile-responsive (375px minimum, 44px touch targets)
- Smooth animations with `prefers-reduced-motion` support
- Portal rendering for proper z-index stacking

**Toast Component** (`/components/ui/Toast.tsx`):

- 4 types: success, error, info, warning
- Auto-dismiss with configurable duration (default 5s)
- Global state management (no props drilling)
- Stackable notifications
- Slide-in animations

**Also Fixed:**

- Added automatic email field injection for payment events
- Improved all error messages (user-friendly Hebrew)
- Replaced all 6 alerts in registration page
- Replaced all 3 alerts in cancellation page

**Prevention Strategies:**

1. **ESLint Rule:** Add `no-restricted-globals` to prohibit alert/confirm/prompt
2. **Pre-commit Hook:** Detect browser alerts in staged files
3. **PR Checklist:** Verify Modal/Toast usage for all notifications
4. **Documentation:** Created comprehensive guide at `/app/docs/bugs/ALERT_REPLACEMENT_SUMMARY.md`
5. **Developer Training:** Onboarding includes notification pattern training

**Files Changed:**

- ✅ `/components/ui/Modal.tsx` (NEW - complete modal system)
- ✅ `/components/ui/Toast.tsx` (NEW - toast notifications)
- ✅ `/app/p/[schoolSlug]/[eventSlug]/page.tsx` (replaced 6 alerts)
- ✅ `/app/cancel/[token]/page.tsx` (replaced 3 alerts)

**Full Documentation:** `/app/docs/bugs/ALERT_REPLACEMENT_SUMMARY.md`

---

### Bug #1: User Session Isolation - Previous User's Menu Shows After Logout/Login ✅ FIXED

**Files:**

- `/app/admin/layout.tsx` (lines 35-70)
- `/lib/auth.server.ts` (line 183)

**Severity:** 🔴 CRITICAL (multi-tenancy data leak vulnerability)
**Status:** ✅ FIXED (2025-12-09)

**Description:**
When switching users (logout → login with different account), the new user saw the previous user's menu, navigation items, and school name. This is a **severe multi-tenancy security vulnerability** that could expose:

- School names from other tenants
- Navigation items the user shouldn't see
- Role information from previous user
- Potential access to unauthorized features

**Root Cause:**
The AdminLayout component fetched admin info **only once on mount** using `useEffect` with empty dependency array `[]`. When a user logged out and another logged in:

```typescript
// BEFORE (BROKEN):
useEffect(() => {
  // Fetch admin info
  fetch('/api/admin/me').then((data) => setAdminInfo(data.admin))
}, []) // ❌ Only runs once - never updates!
```

**What Happened:**

1. User A logs in → `adminInfo` state set to User A's data
2. User A logs out → redirects to `/admin/login` (but layout stays mounted!)
3. User B logs in → redirects to `/admin`
4. **`useEffect` doesn't run again** (empty dependency array)
5. User B sees User A's school name and menu 🚨

**Fix Applied:**

```typescript
// AFTER (FIXED):
useEffect(() => {
  if (isPublicPage) {
    // Clear admin info when on public pages (logout scenario)
    setAdminInfo(null) // ✅ Clear state
    setIsChecking(false)
    return
  }

  // Fetch admin info from server
  setIsChecking(true)
  fetch('/api/admin/me')
    .then((data) => setAdminInfo(data.admin))
    .finally(() => setIsChecking(false))
}, [pathname]) // ✅ Refetch when pathname changes!
```

**Additional Fix - Logout Cookie Cleanup:**

```typescript
// lib/auth.server.ts
export async function logout(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
  cookieStore.delete('admin_logged_in') // ✅ Also clear client hint cookie
}
```

**Impact:**

- **BEFORE:** Multi-tenant data leakage - users could see other schools' data
- **AFTER:** Proper session isolation - each login fetches fresh user data

**Testing Checklist:**

- ✅ Logout as User A
- ✅ Login as User B
- ✅ Verify menu shows User B's school name
- ✅ Verify navigation matches User B's role
- ✅ Test with different roles (OWNER, ADMIN, MANAGER, SUPER_ADMIN)
- ✅ Test on mobile and desktop

**Files Modified:**

- `/app/admin/layout.tsx:35-70` - Clear state on public pages, refetch on protected pages
- `/lib/auth.server.ts:183` - Delete both session and hint cookies on logout

---

## =4 CRITICAL BUGS

### Bug #0: TABLE_BASED Events Show "No Spots Available" on Public Page ✅ FIXED

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx` (lines 244-248)
**Severity:** =4 CRITICAL (blocks all table-based event registrations)
**Status:** ✅ FIXED (2025-12-06)

**Description:**
When users try to register for TABLE_BASED (restaurant) events, the public registration page incorrectly shows "אין מקומות פנויים" (no spots available) even when tables are available. This completely blocks all registrations for table-based events.

**Root Cause:**
The page calculates availability by checking `event.capacity` field, which is **0** for TABLE_BASED events (capacity is managed through individual tables, not a global counter). This causes:

```typescript
spotsLeft = event.capacity - event.totalSpotsTaken // 0 - 0 = 0
isFull = spotsLeft <= 0 // true ❌
```

**Impact:**

- Users cannot register for any TABLE_BASED event
- Restaurants cannot accept bookings
- System shows misleading "no spots" message when 4+ tables are available

**Fix Applied:**

```typescript
// Before (BROKEN):
const spotsLeft = event.capacity - event.totalSpotsTaken
const isFull = spotsLeft <= 0

// After (FIXED):
const spotsLeft =
  event.eventType === 'TABLE_BASED' ? Infinity : event.capacity - event.totalSpotsTaken
const isFull = event.eventType === 'TABLE_BASED' ? false : spotsLeft <= 0
const percentage =
  event.eventType === 'TABLE_BASED'
    ? 0
    : Math.min(100, (event.totalSpotsTaken / event.capacity) * 100)
```

**UI Changes:**

- TABLE_BASED events now show "סטטוס: ✓ פתוח" instead of capacity bar
- Form title: "הרשמה לאירוע" instead of "הרשמה לרשימת המתנה"
- Submit button: "אשר הזמנה" instead of "הרשמה לרשימת המתנה"
- Backend `reserveTableForGuests()` handles actual table availability

**Files Modified:**

- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:244-248` - Capacity check logic
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:447-476` - Capacity indicator UI
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:483-485` - Form title
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:668-672` - Submit button text

**Verification:**

- Event ID: `cmiu88wvi0003itshqi3m12mi`
- Type: `TABLE_BASED`
- Tables: 4 available (capacity 4-8 guests each)
- Before fix: Showed "אין מקומות פנויים" ❌
- After fix: Shows "✓ פתוח" with registration form ✅

**Additional Fix - Dynamic Max Guest Count:**

- **Issue:** Guest selector showed "1-12 אורחים" regardless of actual table capacity
- **Root Cause:** Hardcoded max value in GuestCountSelector component
- **Fix:** API now returns `maxTableCapacity` (max from all tables = 8 guests)
- **Files Modified:**
  - `/app/api/p/[schoolSlug]/[eventSlug]/route.ts:89-99` - Calculate max table capacity
  - `/app/api/p/[schoolSlug]/[eventSlug]/route.ts:114` - Add to API response
  - `/app/p/[schoolSlug]/[eventSlug]/page.tsx:31` - Add to Event interface
  - `/app/p/[schoolSlug]/[eventSlug]/page.tsx:534` - Use dynamic max
- **Result:** Now shows "1-8 אורחים" matching largest table (שולחן 2: 8 guests) ✅

---

### Bug #1: Account Takeover via OAuth Auto-Linking

**File:** `/app/api/auth/google/callback/route.ts` (lines 84-92)
**Severity:** =4 CRITICAL

**Description:**
When a user authenticates via Google OAuth, the system automatically links their Google account to any existing account with the same email address, without requiring password verification. This allows an attacker to take over accounts.

**Attack Scenario:**

1. Victim has account: `victim@example.com` (password: `MySecurePass123`)
2. Attacker creates Google account: `victim@example.com`
3. Attacker clicks "Sign in with Google" on our app
4. System auto-links attacker's Google account to victim's account
5. Attacker now has full access to victim's account without knowing the password

**Current Code:**

```typescript
let admin = await prisma.admin.findFirst({
  where: {
    OR: [
      { googleId },
      { email }, // � DANGEROUS: No password check
    ],
  },
})
```

**Fix:**

```typescript
// Safe approach: Only link if password is not set (OAuth-only account)
let admin = await prisma.admin.findUnique({
  where: { googleId },
})

if (!admin) {
  const existingByEmail = await prisma.admin.findUnique({
    where: { email },
  })

  if (existingByEmail && existingByEmail.passwordHash) {
    // Require password confirmation before linking
    return NextResponse.redirect(
      new URL('/admin/link-google?email=' + encodeURIComponent(email), BASE_URL)
    )
  }

  // Only auto-link if no password is set (OAuth-only account)
  admin =
    existingByEmail ||
    (await prisma.admin.create({
      data: {
        email,
        name,
        googleId,
        emailVerified: true,
        passwordHash: null,
        role: 'OWNER',
        onboardingCompleted: false,
        lastLoginAt: new Date(),
      },
    }))
}
```

**Status:** =4 OPEN

---

### Bug #2: Session Tampering via Unsigned Cookies

**File:** `/lib/auth.server.ts` (lines 20-30)
**Severity:** =4 CRITICAL

**Description:**
User sessions are stored in cookies as base64-encoded JSON without signing or encryption. This allows attackers to decode, modify, and re-encode sessions to escalate privileges or impersonate other users.

**Attack Scenario:**

1. Attacker logs in as normal user
2. Gets session cookie: `eyJhZG1pbklkIjoiY2x4eXo...` (base64)
3. Decodes: `{"adminId":"clxyz123","email":"attacker@evil.com","role":"SCHOOL_ADMIN",...}`
4. Changes role to `SUPER_ADMIN`
5. Re-encodes and replaces cookie
6. Now has super admin access

**Current Code:**

```typescript
function encodeSession(session: AuthSession): string {
  return Buffer.from(JSON.stringify(session)).toString('base64')
}

function decodeSession(token: string): AuthSession | null {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf8')
    return JSON.parse(decoded) as AuthSession
  } catch {
    return null
  }
}
```

**Fix:**

```typescript
import * as jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}

function encodeSession(session: AuthSession): string {
  return jwt.sign(session, JWT_SECRET, { expiresIn: '7d' })
}

function decodeSession(token: string): AuthSession | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthSession
  } catch {
    return null
  }
}
```

**Status:** =4 OPEN

---

### Bug #3: No Server-Side Route Protection

**File:** Missing `/middleware.ts`
**Severity:** =4 CRITICAL

**Description:**
Admin routes are only protected client-side via React useEffect. Attackers can bypass this by directly calling admin API endpoints.

**Attack Scenario:**

```bash
# No authentication required for these:
curl http://localhost:9000/api/events
curl http://localhost:9000/api/dashboard/stats
curl http://localhost:9000/api/admin/feedback
```

**Fix:**
Create `/middleware.ts` in project root:

```typescript
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Public paths
  const isPublicPath =
    path.startsWith('/api/auth') ||
    path.startsWith('/api/admin/signup') ||
    path.startsWith('/api/admin/login') ||
    path.startsWith('/api/admin/verify-email') ||
    path.startsWith('/api/admin/forgot-password') ||
    path.startsWith('/api/admin/reset-password') ||
    path.startsWith('/p/') ||
    path === '/admin/login' ||
    path === '/admin/signup' ||
    path === '/admin/forgot-password' ||
    path === '/admin/reset-password'

  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check for admin session cookie
  const sessionCookie = request.cookies.get('admin_session')

  if (!sessionCookie) {
    if (path.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/admin/login', request.url))
  }

  // TODO: Verify JWT signature here after fixing Bug #2

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
}
```

**Status:** =4 OPEN

---

### Bug #4: Weak JWT Secret Fallback

**File:** `/app/api/admin/signup/route.ts` (line 7)
**Severity:** =4 CRITICAL (if deployed without JWT_SECRET)

**Description:**
If `JWT_SECRET` environment variable is not set, a hardcoded fallback secret is used for email verification tokens.

**Current Code:**

```typescript
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev'
```

**Attack Scenario:**

1. App deployed to production without setting `JWT_SECRET`
2. Attacker knows fallback secret (from public GitHub repo)
3. Attacker generates verification tokens for any email
4. Takes over any account by "verifying" their email

**Fix:**

```typescript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
```

**Status:** =4 OPEN

---

## =� MODERATE BUGS

### Bug #5: Cookie Operations Not Awaited

**File:** `/app/api/auth/google/callback/route.ts` (lines 36, 45, 145)
**Severity:** =� MODERATE

**Description:**
In Next.js 15, the `cookies()` function returns a Promise, but cookie operations like `delete()` and `set()` may also return Promises. Not awaiting these could cause race conditions.

**Fix:**
Check Next.js 15 documentation and add `await` if necessary:

```typescript
await cookieStore.delete('oauth_state')
await cookieStore.set(SESSION_COOKIE_NAME, encodeSession(session), {...})
```

**Status:** =� OPEN

---

### Bug #6: Email Case Inconsistency

**File:** `/app/api/admin/signup/route.ts` (lines 51, 78)
**Severity:** =� MODERATE

**Description:**
Email is lowercased when checking for duplicates but not when creating the admin record. This could lead to database containing both `User@Example.com` and `user@example.com`.

**Current Code:**

```typescript
// Line 51 - Query with lowercase
const existingAdmin = await prisma.admin.findUnique({
  where: { email: email.toLowerCase() },
})

// Line 78 - Create with original case
email: email.toLowerCase(),  // This is correct but missing!
```

**Fix:**

```typescript
// Line 78
const admin = await prisma.admin.create({
  data: {
    email: email.toLowerCase(), // Add this
    passwordHash,
    name,
    // ...
  },
})
```

**Status:** =� OPEN

---

### Bug #7: School Name Uniqueness May Cause UX Issues

**File:** `/app/api/admin/onboarding/route.ts` (lines 44-58)
**Severity:** =� MODERATE

**Description:**
School names must be globally unique (case-insensitive). This may cause issues for legitimate organizations with common names like "High School" or "Community Center".

**Error Message:**

```
"�� ������ ��� ��� ���� ������, ��� �� ���"
```

**Recommendation:**
Consider one of:

1. Remove school name uniqueness constraint (only enforce slug uniqueness)
2. Suggest alternative names with numbers ("High School 2")
3. Use namespace/region-based uniqueness

**Status:** =� OPEN - Needs product decision

---

### Bug #8: Email Send Failure Ignored During Signup

**File:** `/app/api/admin/signup/route.ts` (lines 92-102)
**Severity:** =� MODERATE

**Description:**
If email verification fails to send (Resend API down, invalid API key, etc.), the account is still created but user cannot verify their email. User is stuck in unverified state.

**Current Code:**

```typescript
const emailSent = await sendVerificationEmail(email.toLowerCase(), verificationToken, name)

if (!emailSent) {
  console.warn('[Signup] Verification email failed to send, but account was created')
}
// Returns success anyway!
```

**Fix Options:**

1. **Fail signup if email can't be sent:**

```typescript
if (!emailSent) {
  await prisma.admin.delete({ where: { id: admin.id } })
  return NextResponse.json(
    { error: 'Failed to send verification email. Please try again.' },
    { status: 500 }
  )
}
```

2. **Add "Resend Verification Email" feature** (better UX)

**Status:** =� OPEN

---

### Bug #9: Create Event Dropdown Clipped on Desktop (Empty State)

**File:** `/app/admin/page.tsx` (line 211)
**Severity:** =� MODERATE
**Status:** ✅ FIXED (2025-12-08)

**Description:**
When the admin dashboard has no events (empty state), clicking the "צור אירוע חדש" button opens a dropdown menu that gets visually cut off on desktop. The bottom portion of the dropdown (restaurant event option) is clipped and not fully visible.

**Root Cause:**
The parent container has `overflow-hidden` class which clips the absolutely-positioned dropdown menu:

```tsx
// /app/admin/page.tsx:211
<div className="bg-white shadow overflow-hidden sm:rounded-md">
  {/* ... */}
  <CreateEventDropdown variant="page" />
</div>
```

The dropdown uses `sm:absolute` positioning on desktop, which positions it relative to the parent. When the parent has `overflow-hidden`, any content extending beyond the container boundaries is clipped.

**Impact:**

- Users cannot see the full dropdown content on desktop
- Restaurant event option is partially or fully hidden
- Poor UX - appears broken or buggy
- Mobile is unaffected (uses `fixed` positioning)

**Fix Applied:**

```tsx
// Before:
<div className="bg-white shadow overflow-hidden sm:rounded-md">

// After:
<div className="bg-white shadow sm:rounded-md">
```

Removed `overflow-hidden` from the parent container since it's not necessary for the rounded corners styling.

**Files Modified:**

- `/app/admin/page.tsx:211` - Removed `overflow-hidden` class

**Test Added:**

- `/tests/create-event-dropdown.spec.ts` - New test "dropdown is fully visible when opened on desktop (no clipping)"
- Verifies all dropdown options are visible and not cut off by parent overflow

**Why It Passed Existing Tests:**
The existing test at line 251-273 checked if the dropdown was "visible" but didn't verify that ALL content within the dropdown was fully visible. The test passed because the top of the dropdown was visible, even though the bottom was clipped.

---

## =� LOW PRIORITY / ENHANCEMENTS

### Enhancement #1: No Auto-Login After Email Verification

**File:** `/app/api/admin/verify-email/route.ts` (lines 82-85)
**Severity:** =� LOW (UX enhancement)

**Description:**
After verifying email, user must manually log in again. Could be improved by auto-creating session.

**Comment in Code:**

```typescript
// Note: We can't use the login() function directly here because
// it sets cookies and we're in an API route
// Instead, we'll return success and let the frontend handle login
```

**Recommendation:**
Implement one-time login token or auto-redirect to login with credentials pre-filled.

**Status:** =� ENHANCEMENT

---

### Enhancement #2: Missing Composite Unique Index

**File:** `/prisma/schema.prisma`
**Severity:** =� LOW (performance)

**Description:**
No composite unique index on `[email, schoolId]` to prevent duplicate school memberships (though business logic may allow this).

**Recommendation:**

```prisma
model Admin {
  // ...
  @@unique([email, schoolId])
}
```

**Status:** =� ENHANCEMENT

---

## Summary

| Severity    | Count | Status              |
| ----------- | ----- | ------------------- |
| =4 CRITICAL | 4     | All OPEN            |
| =� MODERATE | 4     | All OPEN            |
| =� LOW      | 2     | Enhancement backlog |

**Priority Fix Order:**

1. Bug #2 (Session Tampering) - Most exploitable
2. Bug #3 (Missing Middleware) - Most exposed
3. Bug #1 (Account Takeover) - Requires specific attack
4. Bug #4 (JWT Secret) - Only if misconfigured
5. Moderate bugs - Lower impact
6. Enhancements - Nice to have

---

## FIXED BUGS

### Bug #9: Google OAuth Session Using Base64 Instead of JWT + Edge Runtime Compatibility + Cookie Persistence + Layout Redirect

**Files:** `/app/api/auth/google/callback/route.ts`, `/middleware.ts`, `/app/admin/layout.tsx`
**Severity:** =4 CRITICAL
**Fixed Date:** 2025-11-10

**Description:**
After successful Google OAuth authentication, users were redirected back to login page. Four related issues were discovered and fixed:

**Issue 1: Base64 vs JWT Tokens**
The Google OAuth callback was using a different `encodeSession()` function that created base64-encoded JSON strings instead of proper JWT tokens.

**Error Log:**

```
[Middleware] Invalid session token: JsonWebTokenError: jwt malformed
    at middleware (middleware.ts:70:21)
```

**Issue 2: Edge Runtime Incompatibility**
After fixing Issue 1, middleware failed because `jsonwebtoken` library uses Node.js `crypto` module, which is not available in Edge Runtime.

**Error Log:**

```
[Middleware] Invalid session token: Error: The edge runtime does not support Node.js 'crypto' module.
Learn More: https://nextjs.org/docs/messages/node-module-in-edge-runtime
    at middleware (middleware.ts:70:21)
```

**Issue 3: Session Cookie Not Persisting Across Redirects**
After fixing Issues 1 & 2, OAuth callback was setting cookies using `cookies().set()` then immediately redirecting. In Next.js 15, cookies set via the `cookies()` API are not automatically included in redirect responses. Result: Session cookie was lost during redirect, causing authentication to fail.

**Playwright Test Result:**

```
=== Navigating to /admin/onboarding ===
← RESPONSE: 307 http://localhost:9000/admin/onboarding
→ REQUEST: GET http://localhost:9000/admin/login

=== Session Cookies ===
  admin_session: MISSING  ❌
  admin_logged_in: MISSING

❌ PROBLEM: Redirected to login page
   This means the onboarding page auth check failed
```

**Issue 4: Admin Layout Redirecting Based on localStorage**
After fixing Issues 1-3, cookies were being set correctly and middleware was allowing the onboarding page, BUT the admin layout (`/app/admin/layout.tsx`) was checking `localStorage.getItem('admin_logged_in')` which was empty after OAuth login. The layout's `useEffect` ran before the page's `useEffect`, causing an immediate redirect to login.

**Terminal Logs Showing the Problem:**

```
[Middleware] ✅ Session valid, allowing: /admin/onboarding
GET /admin/onboarding 200 in 240ms
GET /admin/login 200 in 20ms  ← Only 20ms later, no /api/admin/me call!
```

**Root Cause:**

- OAuth callback sets HTTP-only cookies ✅
- BUT doesn't set `localStorage.setItem('admin_logged_in', 'true')` ❌
- Layout checks `isAuthenticatedSync()` which reads localStorage ❌
- Returns `false` → redirects to login ❌

**Root Cause:**

1. `lib/auth.server.ts` uses `jwt.sign()` to create proper JWT tokens (Node.js runtime)
2. `app/api/auth/google/callback/route.ts` defined its own `encodeSession()` that used base64
3. `middleware.ts` runs in Edge Runtime but used `jsonwebtoken` library (requires Node.js `crypto`)
4. OAuth callback used `cookies().set()` then immediately returned a redirect
5. In Next.js 15, cookies set via `cookies()` API are not included in redirect responses unless set on the NextResponse object
6. Result: Session cookie was lost, authentication failed after redirect

**Fix Applied:**

1. **Phase 1 - JWT Token Creation:**
   - Exported `encodeSession()` function from `/lib/auth.server.ts:26`
   - Updated `/app/api/auth/google/callback/route.ts` to import and use JWT-based `encodeSession()`
   - Removed duplicate base64 encoding function

2. **Phase 2 - Edge Runtime Compatibility:**
   - Installed `jose` package (Edge Runtime compatible JWT library)
   - Updated `/middleware.ts` to use `jose` instead of `jsonwebtoken`
   - Converted middleware to async function to support `jwtVerify()`
   - Both libraries use HS256 algorithm for compatibility

3. **Phase 3 - Cookie Persistence in Redirects:**
   - Changed OAuth callback to NOT mix `cookies()` API with `response.cookies`
   - Read OAuth state from `request.cookies.get()` instead of `await cookies()`
   - Set all cookies on `NextResponse` object consistently
   - Ensures cookies are included in redirect headers

4. **Phase 4 - Admin Layout Public Pages:**
   - Added `/admin/onboarding` to public pages list in `/app/admin/layout.tsx:27`
   - This bypasses the `isAuthenticatedSync()` localStorage check
   - Lets onboarding page handle its own authentication via server-side API call
   - Also added `credentials: 'include'` to fetch calls in onboarding page

**Files Changed:**

- `/lib/auth.server.ts:26` - Exported `encodeSession` function (uses `jsonwebtoken` for Node.js runtime)
- `/app/api/auth/google/callback/route.ts:4` - Import `encodeSession` from auth.server (removed `cookies` import)
- `/app/api/auth/google/callback/route.ts:33` - Read OAuth state from `request.cookies.get()` instead of `await cookies()`
- `/app/api/auth/google/callback/route.ts:154-177` - Set cookies consistently on NextResponse object
- `/middleware.ts:2` - Import `jwtVerify` from `jose` instead of `jsonwebtoken`
- `/middleware.ts:11` - Added secret encoding for Edge Runtime: `new TextEncoder().encode(JWT_SECRET)`
- `/middleware.ts:39` - Made middleware async
- `/middleware.ts:36` - Added `/api/auth/google/callback` to public paths
- `/app/admin/layout.tsx:27` - **Added `/admin/onboarding` to public pages list** (KEY FIX)
- `/app/admin/onboarding/page.tsx:22` - Added `credentials: 'include'` to fetch call
- `/package.json` - Added `jose` dependency

**Testing:**

```bash
# 1. Install dependencies
npm install jose

# 2. Server auto-reloads with new middleware

# 3. Manual test in browser:
#    - Navigate to http://localhost:9000/admin/login
#    - Click "Sign in with Google"
#    - Complete OAuth flow
#    - EXPECTED: Stay on /admin/onboarding (NOT redirect to /admin/login)
#    - EXPECTED: See onboarding form (school name, slug)

# 4. Automated test to verify cookie behavior:
npx playwright test debug-oauth-cookies --headed
#    - Should show: admin_session: MISSING (without OAuth)
#    - After OAuth: Cookies should persist across redirect
```

**Status:** ✅ FIXED

---

### Bug #10: Session Not Updated After Onboarding - Users See Wrong School Events

**File:** `/app/api/admin/onboarding/route.ts`
**Severity:** 🔴 CRITICAL
**Fixed Date:** 2025-11-10

**Description:**
After a user completes the onboarding process and creates their school, the database was correctly updated with the new `schoolId`, but the JWT session cookie was NOT updated. This caused all subsequent API calls to use the old session (with `schoolId: undefined`), resulting in users seeing events from wrong schools or the "Default School".

**User Report:**

```
"created new: 345287info@gmail.com, why i see the default school??"
User created school "tempppp" but dashboard showed 3 events from "Default School" instead of 0 events (correct for new school).
```

**Investigation:**

1. ✅ Database correctly showed: User linked to school "tempppp" (schoolId: cmhtby6uq0008mt01718tlxup)
2. ✅ Events API correctly filters by schoolId from JWT session
3. ❌ **JWT session cookie still had `schoolId: undefined` from initial OAuth login**
4. ❌ Result: API filtering failed, showed events from all schools or wrong school

**Root Cause:**
The onboarding API route updated the database with `schoolId` but did not create and set a new JWT session cookie with the updated school information. The old session cookie persisted across requests, causing data isolation to break.

**Code Before Fix:**

```typescript
// app/api/admin/onboarding/route.ts
export async function POST(request: NextRequest) {
  // ... validation ...

  const result = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({...})
    const admin = await tx.admin.update({
      where: { id: currentAdmin.adminId },
      data: {
        schoolId: school.id,  // ✅ Database updated
        onboardingCompleted: true,
      },
    })
    return { school, admin }
  })

  // ❌ Session cookie NOT updated - still has old schoolId!

  return NextResponse.json({
    success: true,
    school: {...},
    admin: {...},
  })
}
```

**Fix Applied:**

```typescript
// app/api/admin/onboarding/route.ts
import { getCurrentAdmin, encodeSession, SESSION_COOKIE_NAME, AuthSession } from '@/lib/auth.server'

export async function POST(request: NextRequest) {
  // ... validation and database update ...

  const result = await prisma.$transaction(async (tx) => {
    const school = await tx.school.create({...})
    const admin = await tx.admin.update({
      where: { id: currentAdmin.adminId },
      data: {
        schoolId: school.id,
        onboardingCompleted: true,
      },
      include: { school: true },
    })
    return { school, admin }
  })

  // ✅ Create updated session with new school information
  const updatedSession: AuthSession = {
    adminId: result.admin.id,
    email: result.admin.email,
    name: result.admin.name,
    role: result.admin.role,
    schoolId: result.school.id,      // NEW: Include school ID
    schoolName: result.school.name,   // NEW: Include school name
  }

  const response = NextResponse.json({
    success: true,
    message: 'הארגון נוצר בהצלחה!',
    school: {...},
    admin: {...},
  })

  // ✅ Update session cookie with new school information
  response.cookies.set(SESSION_COOKIE_NAME, encodeSession(updatedSession), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60, // 7 days
    path: '/',
  })

  return response
}
```

**Files Changed:**

- `/app/api/admin/onboarding/route.ts:3` - Added imports: `encodeSession`, `SESSION_COOKIE_NAME`, `AuthSession`
- `/app/api/admin/onboarding/route.ts:92` - Added `include: { school: true }` to admin update query
- `/app/api/admin/onboarding/route.ts:101-108` - Created `updatedSession` object with new school information
- `/app/api/admin/onboarding/route.ts:127-133` - Set session cookie with updated JWT before returning response

**Impact:**

- Multi-tenant data isolation now works correctly immediately after onboarding
- Users see only their own school's events without needing to logout/login
- Session state matches database state throughout the onboarding flow

**Testing:**

```bash
# 1. Build succeeds
npm run build

# 2. Manual test on production:
#    - Create new account via OAuth
#    - Complete onboarding with unique school name
#    - Dashboard should show 0 events (not Default School events)
#    - Create new event
#    - Event should appear in dashboard (correct school filtering)
```

**Status:** ✅ FIXED

---

### Bug #11: Data Isolation Bypass - Users Without schoolId See All Events

**Files:** Multiple API routes (`/api/events/route.ts`, `/api/dashboard/*/route.ts`)
**Severity:** 🔴 CRITICAL - Data Breach
**Fixed Date:** 2025-11-10

**Description:**
All dashboard and event API routes had weak validation that allowed users with `schoolId: undefined` in their JWT session to bypass multi-tenant data isolation and see events from ALL schools, including private data from other organizations.

**User Report:**

```
"why 345287info@gmail.com see Default School events???"
User with their own school seeing 3 events from "Default School" that belonged to a different organization.
```

**Root Cause:**
The filtering logic in API routes used this pattern:

```typescript
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}
```

The problem: `&& admin.schoolId` means if `schoolId` is `undefined`, the entire condition is FALSE, and NO filter is applied. Result: User sees ALL events from ALL schools.

**Attack Scenario:**

1. Attacker creates account via OAuth
2. JWT session has `schoolId: undefined` (before onboarding or from old session)
3. Attacker calls `/api/events` or `/api/dashboard/stats`
4. Validation checks: `admin.role !== 'SUPER_ADMIN'` ✅ AND `admin.schoolId` ❌ undefined
5. Condition FALSE → No filter applied
6. **Attacker sees all events from all schools** (data breach)

**Security Impact:**

- ⚠️ **Data Breach**: Unauthorized access to other schools' events, registrations, and statistics
- ⚠️ **Privacy Violation**: User emails, registration data exposed across tenant boundaries
- ⚠️ **Compliance Risk**: GDPR/privacy violations for exposing user data to wrong organizations

**Affected Endpoints:**

1. `/api/events` - List all events
2. `/api/dashboard/stats` - Dashboard statistics
3. `/api/dashboard/active-events` - Active events list
4. `/api/dashboard/registrations` - Registration data
5. `/api/dashboard/waitlist` - Waitlist data
6. `/api/dashboard/occupancy` - Occupancy statistics

**Code Before Fix:**

```typescript
// app/api/events/route.ts:25
// Regular admins can only see their school's events
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}
// ❌ If schoolId is undefined, filter is NOT applied → sees ALL schools
```

**Fix Applied:**

```typescript
// Regular admins MUST have a schoolId
if (admin.role !== 'SUPER_ADMIN') {
  // CRITICAL: Non-super admins MUST have a schoolId to prevent seeing all events
  if (!admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have a school assigned. Please logout and login again.' },
      { status: 403 }
    )
  }
  where.schoolId = admin.schoolId
}
// ✅ Now explicitly rejects requests from users without schoolId
```

**Files Changed:**

- `/app/api/events/route.ts:25-34` - Added strict schoolId validation
- `/app/api/dashboard/stats/route.ts:20-29` - Added strict schoolId validation
- `/app/api/dashboard/active-events/route.ts:22-31` - Added strict schoolId validation
- `/app/api/dashboard/registrations/route.ts:22-33` - Added strict schoolId validation
- `/app/api/dashboard/waitlist/route.ts:22-33` - Added strict schoolId validation
- `/app/api/dashboard/occupancy/route.ts:20-29` - Added strict schoolId validation

**How Users Are Affected:**

- Users with old session cookies (created before Bug #10 fix) will get a 403 error
- Error message: "Admin must have a school assigned. Please logout and login again."
- After logout/login, new session will have correct schoolId from database

**Testing:**

```bash
# 1. Test that users without schoolId are rejected
# Simulate by temporarily setting JWT session with schoolId: undefined
# Expected: 403 Forbidden

# 2. Test that users with valid schoolId see only their events
# Login as user with schoolId
# Expected: Only events from their school

# 3. Test that SUPER_ADMIN can see all schools
# Login as SUPER_ADMIN
# Expected: Can see all events (optional schoolId filter)
```

**Prevention:**
This bug highlights the importance of:

1. **Fail-secure validation**: Always reject invalid states, don't silently skip filters
2. **Explicit checks**: Use `if (!value)` instead of relying on truthy/falsy in complex conditions
3. **Session integrity**: Ensure JWT sessions are always updated when database state changes (see Bug #10)

**Related Bugs:**

- Bug #10: Session not updated after onboarding (root cause of undefined schoolId)

**Status:** ✅ FIXED

---

### Bug #12: AdminProd Button Visible to All Users - Missing Super Admin Check

**File:** `/app/admin/page.tsx`
**Severity:** 🟡 MODERATE - Security/Access Control
**Fixed Date:** 2025-11-10

**Description:**
The "AdminProd" button in the admin dashboard header was visible to all authenticated users, not just super admins. This button provides access to production admin tools and should only be visible to users with `SUPER_ADMIN` role.

**Security Impact:**

- ⚠️ **Unauthorized Access**: Regular admins and managers could see and potentially access super admin production tools
- ⚠️ **Information Disclosure**: Button visibility reveals existence of admin production features
- ⚠️ **Principle of Least Privilege**: Users seeing controls they shouldn't have access to

**Code Before Fix:**

```typescript
// app/admin/page.tsx:91-98
return (
  <div>
    <div className="flex justify-between items-center mb-4 sm:mb-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900">לוח בקרה</h2>
      <Link
        href="/admin-prod"
        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
      >
        AdminProd
      </Link>
    </div>
// ❌ Button always visible to all authenticated users
```

**Fix Applied:**

```typescript
// app/admin/page.tsx:9-13
interface AdminInfo {
  role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER'
  schoolId?: string
  schoolName?: string
}

export default function AdminDashboard() {
  // ... other state ...
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)

  useEffect(() => {
    fetchDashboardData()
    fetchAdminInfo()  // ✅ Fetch user role
  }, [])

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch('/api/admin/me')
      const data = await response.json()
      if (data.authenticated && data.admin) {
        setAdminInfo(data.admin)
      }
    } catch (error) {
      console.error('Error fetching admin info:', error)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">לוח בקרה</h2>
        {adminInfo?.role === 'SUPER_ADMIN' && (  // ✅ Only show for super admins
          <Link
            href="/admin-prod"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            AdminProd
          </Link>
        )}
      </div>
```

**Files Changed:**

- `/app/admin/page.tsx:9-13` - Added `AdminInfo` interface with role types
- `/app/admin/page.tsx:24` - Added `adminInfo` state to track user role
- `/app/admin/page.tsx:34` - Added call to `fetchAdminInfo()` in useEffect
- `/app/admin/page.tsx:59-69` - Added `fetchAdminInfo()` function to fetch user role from API
- `/app/admin/page.tsx:113-120` - Added conditional rendering `{adminInfo?.role === 'SUPER_ADMIN' && (...)}`

**How This Works:**

1. Component fetches current admin info from `/api/admin/me` on mount
2. Response includes `role` field from JWT session
3. Button only renders if `role === 'SUPER_ADMIN'`
4. Regular admins, managers, and owners won't see the button at all

**Server-Side Protection:**
Note: This is a UI-level restriction. The actual `/admin-prod` routes should also have server-side middleware protection using `requireSuperAdmin()` from `/lib/auth.server.ts:149-155`.

**Testing:**

```bash
# 1. Test as regular admin (OWNER/ADMIN/MANAGER)
# Login with regular credentials
# Expected: No "AdminProd" button visible in dashboard

# 2. Test as super admin
# Login with SUPER_ADMIN credentials
# Expected: "AdminProd" button visible in top-right of dashboard
```

**Status:** ✅ FIXED

---

### Bug #13: Signup Form Missing Organization Fields - Requires Separate Onboarding Step

**Files:** `/app/admin/signup/page.tsx`, `/app/api/admin/signup/route.ts`
**Severity:** 🟡 MODERATE - UX/Onboarding
**Fixed Date:** 2025-11-10

**Description:**
The signup form only collected personal information (name, email, password) but not organization details (school name and slug). Users had to complete a separate onboarding step after signup to provide organization information. This created a disjointed user experience with an extra step in the registration flow.

**User Report:**

```
"when create mail manual: there is no organization name and slug"
User showing signup form missing organization fields that appeared in the onboarding step.
```

**UX Impact:**

- ⚠️ **Extra Steps**: Users must fill out two separate forms (signup + onboarding)
- ⚠️ **Confusion**: Users not understanding why they need another form after signup
- ⚠️ **Drop-off Risk**: Some users might abandon registration during the onboarding step

**Previous Flow:**

1. User fills signup form (name, email, password)
2. Account created with `schoolId: null`, `onboardingCompleted: false`
3. User verifies email
4. User redirected to `/admin/onboarding` to enter school name/slug
5. School created and linked to user

**Fix Applied - Single-Step Signup:**
Now the signup form includes organization fields inline, allowing users to complete everything in one step.

**Frontend Changes:**

```typescript
// app/admin/signup/page.tsx:9-16
const [formData, setFormData] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  schoolName: '', // ✅ NEW
  schoolSlug: '', // ✅ NEW
})

// Auto-generate slug from school name
const generateSlug = (name: string) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

const handleSchoolNameChange = (name: string) => {
  setFormData({
    ...formData,
    schoolName: name,
    schoolSlug: generateSlug(name), // ✅ Auto-generate URL-friendly slug
  })
}
```

**UI Structure:**

```jsx
<form>
  {/* NEW: Organization Info Section */}
  <div className="space-y-4 pb-4 border-b border-gray-200">
    <h3>פרטי ארגון</h3>

    {/* School Name Field */}
    <input
      name="schoolName"
      placeholder="בית ספר דוגמה"
      onChange={(e) => handleSchoolNameChange(e.target.value)}
    />

    {/* School Slug Field (auto-generated, editable) */}
    <input name="schoolSlug" placeholder="my-organization" value={formData.schoolSlug} />
    <p>הקישור שלך: ticketcap.com/p/{formData.schoolSlug}</p>
  </div>

  {/* Personal Info Section */}
  <div className="space-y-4">
    <h3>פרטים אישיים</h3>
    {/* Name, Email, Password fields */}
  </div>
</form>
```

**Backend Changes:**

```typescript
// app/api/admin/signup/route.ts:16-22
interface SignupRequest {
  email: string
  password: string
  name: string
  schoolName?: string // ✅ NEW - Optional for backward compatibility
  schoolSlug?: string // ✅ NEW - Optional for backward compatibility
}

export async function POST(request: NextRequest) {
  const { email, password, name, schoolName, schoolSlug } = body

  // Create school if provided
  let createdSchoolId: string | null = null
  let requiresOnboarding = true

  if (schoolName && schoolSlug) {
    // ✅ Check if slug already taken
    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug },
    })

    if (existingSchool) {
      return NextResponse.json(
        { error: 'הקישור הזה כבר תפוס. אנא בחר קישור אחר.' },
        { status: 409 }
      )
    }

    // ✅ Create school during signup
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        slug: schoolSlug,
      },
    })
    createdSchoolId = school.id
    requiresOnboarding = false // ✅ Onboarding complete!
  }

  // Create admin with schoolId if school was created
  const admin = await prisma.admin.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'OWNER',
      schoolId: createdSchoolId, // ✅ Set immediately if provided
      onboardingCompleted: !requiresOnboarding, // ✅ True if school created
      emailVerified: false,
      verificationToken,
    },
  })

  return NextResponse.json({
    success: true,
    requiresOnboarding, // ✅ False if school info was provided
  })
}
```

**New Flow:**

1. User fills ONE form (name, email, password, school name, slug)
2. Account + School created in same request
3. User verifies email
4. User redirected directly to `/admin` dashboard (no onboarding needed)

**Backward Compatibility:**

- Fields are optional (`schoolName?: string`)
- If not provided, old onboarding flow still works
- Existing onboarding page remains functional for edge cases

**Files Changed:**

- `/app/admin/signup/page.tsx:3` - Added imports: `Building2`, `Link as LinkIcon`
- `/app/admin/signup/page.tsx:9-16` - Added `schoolName` and `schoolSlug` to form state
- `/app/admin/signup/page.tsx:22-37` - Added `generateSlug()` and `handleSchoolNameChange()` functions
- `/app/admin/signup/page.tsx:44-47` - Added validation for school fields
- `/app/admin/signup/page.tsx:67-73` - Added school fields to API request body
- `/app/admin/signup/page.tsx:198-258` - Added organization info section to form UI
- `/app/api/admin/signup/route.ts:16-22` - Added `schoolName` and `schoolSlug` to interface
- `/app/api/admin/signup/route.ts:28` - Added fields to request destructuring
- `/app/api/admin/signup/route.ts:83-112` - Added school creation logic with slug validation
- `/app/api/admin/signup/route.ts:122` - Set `schoolId` on admin if school created
- `/app/api/admin/signup/route.ts:125` - Set `onboardingCompleted` based on school creation
- `/app/api/admin/signup/route.ts:154` - Return `requiresOnboarding` in response

**User Experience Improvements:**

- ✅ One form instead of two
- ✅ Real-time slug generation from school name
- ✅ Visual preview of final URL: `ticketcap.com/p/my-school`
- ✅ Clear validation (slug format requirements shown)
- ✅ No extra page navigation needed

**Testing:**

```bash
# 1. Test new signup flow with school info
# Navigate to /admin/signup
# Fill all fields including school name
# Expected: Account + school created, onboarding skipped

# 2. Test backward compatibility (no school info)
# Navigate to /admin/signup
# Fill only personal info (leave school fields empty)
# Expected: Account created, redirected to /admin/onboarding

# 3. Test slug uniqueness validation
# Try to create account with existing school slug
# Expected: Error "הקישור הזה כבר תפוס"
```

**Status:** ✅ FIXED

---

### Bug #14: Verification Emails Not Sending - Resend API Test Mode Restrictions

**Files:** `/lib/email.ts`, `.env.local`
**Severity:** 🔴 CRITICAL - User Onboarding Blocker
**Fixed Date:** 2025-11-10

**Description:**
Users were not receiving verification emails after signup. Investigation revealed that the Resend API was in test mode with strict limitations that prevented emails from being sent to most recipients.

**User Report:**

```
"when sign in, no mail sent, resend problem?"
```

**Root Cause:**
The Resend API key is in **test/free tier mode** with these restrictions:

1. ❌ Can only send to the verified account owner email (`345287@gmail.com`)
2. ✅ FROM address `noreply@kartis.info` is now verified (domain verified in Resend)
3. ✅ Domain verification complete - emails can now be sent to all recipients

**API Error Response:**

```json
{
  "error": {
    "statusCode": 403,
    "name": "validation_error",
    "message": "You can only send testing emails to your own email address (345287@gmail.com).
    To send emails to other recipients, please verify a domain at resend.com/domains,
    and change the `from` address to an email using this domain."
  }
}
```

**Testing Results:**

```bash
$ node test-resend-api.js
✓ Resend API is working
✗ Sending restricted: Can only send to 345287@gmail.com
✗ FROM address 'noreply@kartis.info' not verified
```

**Fix Applied (Short-term for Development):**

Changed FROM email to use Resend's test domain which works in test mode:

```env
# .env.local
EMAIL_FROM="onboarding@resend.dev"  # ✅ Works in test mode
```

**Additional Improvements:**

1. **Created Resend Verification Email API Endpoint**
   - New endpoint: `/api/admin/resend-verification`
   - Allows users to request email resend if they didn't receive it
   - Validates account exists and is unverified
   - Security: Doesn't reveal if account exists (prevents enumeration)

2. **Added Resend Button to Signup Success Page**
   - Users can click "שלח מייל שוב" (Send Email Again)
   - Shows success/error feedback
   - Helps users who checked spam, waited too long, etc.

**Files Changed:**

- `.env.local:6` - Changed `EMAIL_FROM` from `noreply@kartis.info` to `onboarding@resend.dev`
- `/app/api/admin/resend-verification/route.ts` - New endpoint for resending verification emails
- `/app/admin/signup/page.tsx:20-21` - Added `isResending` and `resendMessage` state
- `/app/admin/signup/page.tsx:24-51` - Added `handleResendEmail()` function
- `/app/admin/signup/page.tsx:164-177` - Added resend button to success page UI

**Long-term Solution (For Production):**

To send emails to all users in production:

1. **Verify Your Domain at Resend:**

   ```
   1. Go to https://resend.com/domains
   2. Click "Add Domain"
   3. Enter: kartis.info
   4. Add the DNS records they provide to your domain registrar:
      - SPF Record (TXT)
      - DKIM Record (TXT)
   5. Wait for verification (~5-10 minutes)
   ```

2. **Update Environment Variable:**

   ```env
   EMAIL_FROM="noreply@kartis.info"  # Now will work!
   ```

3. **Or Upgrade Resend Plan:**
   - Free tier: 3,000 emails/month, test mode only
   - Pro tier ($20/month): 50,000 emails/month, verified domains
   - https://resend.com/pricing

**Current Limitations (Test Mode):**

- ⚠️ Can only send to: `345287@gmail.com`
- ⚠️ Other emails will fail silently or return 403
- ⚠️ Suitable for development/testing only
- ⚠️ Must verify domain before production launch

**Testing After Fix:**

```bash
# Test with account owner email (should work)
curl -X POST http://localhost:9000/api/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "345287@gmail.com",
    "password": "test123",
    "name": "Test User",
    "schoolName": "Test School",
    "schoolSlug": "test-school"
  }'

# Expected: Email sent successfully ✓

# Test resend endpoint
curl -X POST http://localhost:9000/api/admin/resend-verification \
  -H "Content-Type: application/json" \
  -d '{"email": "345287@gmail.com"}'

# Expected: "מייל האימות נשלח מחדש!" ✓
```

**Status:** ✅ FIXED (for development)
**Production Readiness:** ⚠️ Requires domain verification before launch

---

### Bug #15: Feedback Section Accessible to All Admins - Missing Super Admin Authorization

**Files:** `/app/admin/layout.tsx`, `/app/admin/feedback/page.tsx`, `/app/api/admin/feedback/route.ts`, `/app/api/admin/feedback/[id]/route.ts`
**Severity:** 🟡 MODERATE - Access Control
**Fixed Date:** 2025-11-11

**Description:**
The feedback (משובים) section was accessible to all authenticated admins, not just super admins. This section contains sensitive user feedback and should only be accessible to users with the `SUPER_ADMIN` role.

**Security Impact:**

- ⚠️ **Unauthorized Access**: Regular admins could view all user feedback
- ⚠️ **Information Disclosure**: Feedback may contain sensitive information about bugs, feature requests, or user complaints
- ⚠️ **Principle of Least Privilege**: Regular admins don't need access to system-wide feedback

**Code Before Fix:**

```typescript
// app/admin/layout.tsx - Navigation showed feedback link to all admins
<Link href="/admin/feedback">משובים</Link>

// app/admin/feedback/page.tsx - No role check
export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  // ... loads all feedback without checking role
}

// app/api/admin/feedback/route.ts - No authorization
export async function GET(request: NextRequest) {
  const feedbacks = await prisma.feedback.findMany({...})
  return NextResponse.json(feedbacks)
}
```

**Fix Applied:**

**1. Client-Side Navigation Hiding:**

```typescript
// app/admin/layout.tsx:102-155
{adminInfo?.role === 'SUPER_ADMIN' ? (
  <Link href="/admin/super">
    <Shield className="w-4 h-4 ml-2" />
    לוח בקרה Super Admin
  </Link>
) : (
  <>
    <Link href="/admin">ראשי</Link>
    <Link href="/admin/events">אירועים</Link>
    {/* ❌ Removed feedback link for non-super admins */}
    <Link href="/admin/team">צוות</Link>
    <Link href="/admin/settings">הגדרות</Link>
  </>
)}
```

**2. Client-Side Page Protection:**

```typescript
// app/admin/feedback/page.tsx:19-43
const [isAuthorized, setIsAuthorized] = useState(false)

useEffect(() => {
  fetch('/api/admin/me')
    .then(res => res.json())
    .then(data => {
      if (data.authenticated && data.admin && data.admin.role === 'SUPER_ADMIN') {
        setIsAuthorized(true)
        fetchFeedbacks()
      } else {
        router.push('/admin')  // ✅ Redirect non-super admins
      }
    })
}, [])

if (!isAuthorized) {
  return (
    <div className="flex flex-col items-center justify-center h-64">
      <Shield className="h-12 w-12 text-gray-400 mb-4" />
      <p className="text-lg text-gray-600">בודק הרשאות...</p>
    </div>
  )
}
```

**3. Server-Side API Protection:**

```typescript
// app/api/admin/feedback/route.ts:3-8
import { requireSuperAdmin } from '@/lib/auth'

export async function GET(request: NextRequest) {
  // ✅ Only super admins can access feedback
  await requireSuperAdmin()

  const feedbacks = await prisma.feedback.findMany({...})
  return NextResponse.json(feedbacks)
}

// app/api/admin/feedback/[id]/route.ts:11-40
export async function PATCH(...) {
  await requireSuperAdmin()  // ✅ Only super admins can update
  // ...
}

export async function DELETE(...) {
  await requireSuperAdmin()  // ✅ Only super admins can delete
  // ...
}
```

**Files Changed:**

- `/app/admin/layout.tsx:141-146` - Removed feedback navigation link for non-super admins
- `/app/admin/layout.tsx:247-254` - Removed feedback mobile menu link for non-super admins
- `/app/admin/feedback/page.tsx:1-6` - Added imports: `Shield`, `useRouter`
- `/app/admin/feedback/page.tsx:19-20` - Added authorization state
- `/app/admin/feedback/page.tsx:27-43` - Added role check with redirect
- `/app/admin/feedback/page.tsx:141-148` - Added authorization loading state
- `/app/admin/feedback/page.tsx:153-157` - Added "Super Admin Only" badge
- `/app/api/admin/feedback/route.ts:3` - Added `requireSuperAdmin` import
- `/app/api/admin/feedback/route.ts:6-8` - Added super admin check
- `/app/api/admin/feedback/[id]/route.ts:3` - Added `requireSuperAdmin` import
- `/app/api/admin/feedback/[id]/route.ts:10-11` - Added super admin check to PATCH
- `/app/api/admin/feedback/[id]/route.ts:39-40` - Added super admin check to DELETE

**Visual Improvements:**

- Added "Super Admin Only" purple badge to feedback page header
- Shield icon during authorization check
- Smooth redirect for unauthorized access

**Testing:**

```bash
# 1. Test as regular admin (OWNER/ADMIN)
# Expected: No "משובים" link in navigation
# Expected: Direct URL access redirects to /admin

# 2. Test as super admin
# Expected: "משובים" link visible
# Expected: Can view, update, delete feedback
# Expected: See "Super Admin Only" badge
```

**Status:** ✅ FIXED

---

### Bug #16: Admin Events Page Mobile UI Not Optimized - Poor Touch Targets and Layout

**File:** `/app/admin/events/page.tsx`
**Severity:** 🟡 MODERATE - UX/Mobile
**Fixed Date:** 2025-11-11

**Description:**
The admin events list page had poor mobile UI/UX with cramped buttons, horizontal overflow risks, and content that didn't stack well on small screens. Touch targets were too small and important information was hard to read.

**UX Impact:**

- ⚠️ **Touch Targets**: Buttons smaller than 44px (iOS accessibility minimum)
- ⚠️ **Horizontal Overflow**: Long event names and URLs could cause scrolling
- ⚠️ **Cramped Layout**: Too much horizontal content on mobile
- ⚠️ **Poor Readability**: Small fonts and inconsistent spacing

**Code Before Fix:**

```typescript
// Cramped layout with poor mobile support
<div className="flex items-center justify-between">
  <div className="flex-1">
    <h3 className="text-lg">{event.title}</h3>
    <div className="flex gap-4">
      {/* Too many items in one row */}
    </div>
  </div>
  <div className="flex gap-2">
    <Link href={...} className="p-2">
      <Edit className="w-5 h-5" />  {/* ❌ Touch target too small */}
    </Link>
  </div>
</div>
```

**Fix Applied:**

**1. Proper Touch Targets (44px minimum):**

```typescript
// All interactive elements >= 44px height
<select className="min-h-[44px] min-w-[100px]" />
<Link className="min-h-[44px] px-4 py-2">
  <Edit className="w-4 h-4" />
  <span>ערוך וצפה בהרשמות</span>
</Link>
```

**2. Responsive Layout Stacking:**

```typescript
// Header - stack title and status vertically on mobile
<div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
  <h3 className="text-lg sm:text-xl">{event.title}</h3>
  <select className="min-h-[44px]" />
</div>

// Event details - vertical list on mobile
<div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4">
  <div className="flex items-center min-h-[40px]">
    <Calendar />
    <span>{date}</span>
  </div>
</div>

// Action buttons - wrap naturally
<div className="flex flex-wrap gap-2">
  <Link className="min-h-[44px]">Button 1</Link>
  <Link className="min-h-[44px]">Button 2</Link>
</div>
```

**3. Prevent Horizontal Overflow:**

```typescript
// Hide full URL on mobile, show only slug
<div className="text-xs text-gray-500 space-y-1">
  <div>קוד אירוע: <span className="font-mono">{event.slug}</span></div>
  <div className="hidden sm:block break-all">
    קישור: <span className="font-mono">{fullUrl}</span>
  </div>
</div>
```

**4. Improved Visual Hierarchy:**

```typescript
// Larger text, better spacing, clearer badges
<h3 className="text-lg sm:text-xl font-medium">  {/* Responsive sizing */}
<span className="px-3 py-1.5 bg-purple-50 rounded-md">  {/* Larger badges */}
<div className="space-y-2">  {/* Consistent vertical spacing */}
```

**5. Better Button Labels:**

```typescript
// Before: Icon-only buttons (unclear)
<Link>
  <Edit className="w-5 h-5" />
</Link>

// After: Icon + text (clear purpose)
<Link className="flex items-center gap-2">
  <Edit className="w-4 h-4" />
  <span>ערוך וצפה בהרשמות</span>
</Link>
```

**Files Changed:**

- `/app/admin/events/page.tsx:114-218` - Complete mobile-first redesign of event card
- `/app/admin/events/page.tsx:116-135` - Responsive header with stacking
- `/app/admin/events/page.tsx:137-167` - Vertical event details layout
- `/app/admin/events/page.tsx:169-201` - Large touch target buttons with labels
- `/app/admin/events/page.tsx:203-213` - Overflow-safe event code section

**Mobile Improvements:**

- ✅ All buttons >= 44px height (iOS accessibility standard)
- ✅ Content stacks vertically on small screens
- ✅ No horizontal overflow
- ✅ Clear button labels (not just icons)
- ✅ Responsive typography (text-lg → text-xl on desktop)
- ✅ Proper spacing with Tailwind gap utilities
- ✅ Status badge hidden on mobile (redundant with dropdown)

**Testing:**

```bash
# 1. Test on mobile viewport (375px width)
# Expected: All content readable, no horizontal scroll
# Expected: Buttons easy to tap (not cramped)

# 2. Test on tablet (768px width)
# Expected: Layout uses more horizontal space
# Expected: Status badge appears next to dropdown

# 3. Test on desktop (1024px+)
# Expected: Full layout with all information visible
```

**Status:** ✅ FIXED

---

### Bug #17: Help Page Not Soccer-Focused - Generic Examples and No Real-World Context

**File:** `/app/admin/help/page.tsx`
**Severity:** 🟢 LOW - UX/Content
**Fixed Date:** 2025-11-11

**Description:**
The help page had generic examples (parties, birthdays, trips) instead of soccer-specific examples. Since the system is built for sports events (especially soccer), the documentation should reflect this with practical, realistic examples that users can relate to.

**UX Impact:**

- ⚠️ **Confusing Examples**: Users managing soccer games seeing party examples
- ⚠️ **Missing Context**: No explanation of why soccer-specific features exist
- ⚠️ **Poor Onboarding**: New users don't understand the system was built for sports

**Content Before Fix:**

- Generic title: "המדריך המלא ליצירת אירועים"
- Party examples: "מסיבת פיצה וחברים", "יום הולדת"
- General capacity: "15-25 ילדים (תלוי בגודל הבית)"
- Mixed event types without focus

**Fix Applied:**

**1. Soccer-Focused Header:**

```markdown
Before: 🎉 המדריך המלא ליצירת אירועים 🎉
After: ⚽ המדריך המלא לניהול משחקי כדורגל ⚽

Subtitle: "המערכת שלנו נבנתה במיוחד למשחקי כדורגל, אבל אפשר להשתמש בה לכל סוג אירוע!"
```

**2. Soccer Examples Throughout:**

```typescript
// Event title examples
⚽ משחק ידידות - נוער נגד מבוגרים
⚽ כיתה ו' נגד כיתה ז' - גמר הגביע
⚽ אימון קבוצתי - הכנה למשחק חשוב
⚽ טורניר ליגת הכיתות - שלב א'

// Event description example
⚽ משחק ידידות 11 נגד 11 במגרש העירוני
🥅 הביאו: נעלי ספורט, בקבוק מים, מדים אם יש
⏰ נפתח בשעה 16:00, מתחילים 16:30, סיום 18:00
📌 חובה להגיע בזמן! אם מאחרים - תתקשרו

// Location examples
⚽ מגרש כדורגל עירוני, שדרות ירושלים 50, תל אביב
⚽ מגרש כדורגל בבית הספר "אורט", רחוב הרצל 15
⚽ מתחם ספורט "אלפא", מגרש 3, חולון

// Capacity examples
⚽ משחק 11 נגד 11: 22 שחקנים (11 בכל קבוצה)
⚽ משחק 11 נגד 11 עם ספסל: 30 שחקנים
⚽ משחק 7 נגד 7: 14 שחקנים
⚽ טורניר: 50-100 שחקנים
```

**3. Practical Tips for Soccer:**

```typescript
💡 טיפים חשובים למשחק כדורגל מושלם

⚽ שמות ברורים: "משחק כדורגל 11 נגד 11 - גמר הליגה"
📍 מיקום מדויק: כתובת + הנחיות ("ליד החנייה, מגרש 3")
🎯 מספר שחקנים: תוסיפו מקומות נוספים למקרה של ביטולים
⏰ זמנים הגיוניים: 16:00-18:00 (אחרי בית הספר)
👕 מה להביא: נעליים, מים, מדים, מגיני שוקיים
```

**4. Completion Messages:**

```typescript
// Before: Generic party messages
// After: Soccer-specific
⚽ "מעולה! נרשמת בהצלחה למשחק! תזכור להביא נעלי ספורט, בקבוק מים ומדים."
⚽ "כל הכבוד! אתה במשחק! נתחיל בשעה 16:30 - הגיע 15 דקות קודם!"
⚽ "ברכות! אתה חלק מהקבוצה! המאמן יצור איתך קשר בקרוב."
```

**5. Clear System Flexibility:**

```typescript
// Added prominent reminder at end
💡 זכרו: המערכת נבנתה במיוחד למשחקי כדורגל,
אבל אפשר להשתמש בה לכל סוג אירוע -
טיולים, מסיבות, אימונים, וכל דבר אחר!
```

**Color Scheme Changes:**

- Changed from purple/pink to green/blue (soccer colors)
- Updated gradients to match sports theme
- Green accent color for soccer elements

**Files Changed:**

- `/app/admin/help/page.tsx:9-22` - Soccer-focused header and subtitle
- `/app/admin/help/page.tsx:24-51` - Added use case explanations with soccer examples
- `/app/admin/help/page.tsx:61-80` - Soccer title examples with tips
- `/app/admin/help/page.tsx:82-106` - Soccer description examples with checklist
- `/app/admin/help/page.tsx:125-143` - Soccer location examples with landmarks
- `/app/admin/help/page.tsx:171-196` - Soccer capacity calculations
- `/app/admin/help/page.tsx:198-220` - Max spots per registration for teams
- `/app/admin/help/page.tsx:434-439` - Soccer completion message examples
- `/app/admin/help/page.tsx:447-490` - Soccer-specific tips section
- `/app/admin/help/page.tsx:493-515` - Soccer call-to-action with reminder

**Content Improvements:**

- ✅ Soccer examples in every section
- ✅ Clear explanation of system purpose
- ✅ Practical venue and capacity examples
- ✅ Real-world tips (what to bring, timing, etc.)
- ✅ Prominent reminder about flexibility
- ✅ Non-technical language throughout
- ✅ Visual hierarchy with soccer-themed colors

**Testing:**

```bash
# 1. Test readability
# Expected: Soccer coaches/organizers understand examples
# Expected: No technical jargon

# 2. Test flexibility messaging
# Expected: Clear that system works for other events too
# Expected: Soccer examples don't limit perceived use cases
```

**Status:** ✅ FIXED

---

### Bug #18: White Text on White Background in Mobile Registration Form - Invisible Input Fields

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx`
**Severity:** 🔴 CRITICAL - User Registration Blocker
**Fixed Date:** 2025-11-11

**Description:**
On mobile devices, users filling out the event registration form could not see what they were typing because the input text color was white on a white background. This made the form completely unusable on mobile devices, blocking all new registrations from mobile users.

**User Report:**

```
"on prod, after admin created url, users get in and fill data, the font is white n white background:
[screenshot showing Hebrew form with invisible text in input fields]
and people do not see what they type. problem ONLY on mobile"
```

**Visual Issue:**

- Form fields: "שם מלא" (Full Name), "טלפון" (Phone), "שם הילד" (Child's Name)
- Input text appeared invisible when typing
- Only affected mobile browsers (likely iOS Safari, Chrome Mobile)
- Desktop browsers worked fine (had default text color)

**Root Cause:**
The input fields in the registration form were missing explicit `text-gray-900` and `bg-white` CSS classes. On mobile browsers, especially with certain accessibility or dark mode settings, the default text color can be white. Without explicit styling, this resulted in white text on white background.

**Code Before Fix:**

```typescript
// Line 372 - Dropdown select
<select
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
>
// ❌ No text color or background specified

// Line 393 - Text/number input
<input
  type={field.type === 'number' ? 'number' : 'text'}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
/>
// ❌ No text color or background specified

// Line 416 - Spots count input
<input
  type="number"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
/>
// ❌ No text color or background specified
```

**Fix Applied:**
Added explicit `text-gray-900` (dark text) and `bg-white` (white background) to all input elements:

```typescript
// Line 372 - Dropdown select
<select
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
>
// ✅ Dark text on white background

// Line 393 - Text/number input
<input
  type={field.type === 'number' ? 'number' : 'text'}
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
/>
// ✅ Dark text on white background

// Line 416 - Spots count input
<input
  type="number"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
/>
// ✅ Dark text on white background
```

**Files Changed:**

- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:372` - Added `text-gray-900 bg-white` to dropdown select
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:393` - Added `text-gray-900 bg-white` to text/number input
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:416` - Added `text-gray-900 bg-white` to spots count input

**Impact:**

- ✅ Mobile users can now see what they're typing
- ✅ Consistent styling across all browsers and devices
- ✅ Proper contrast meets accessibility standards
- ✅ Registration form fully functional on mobile

**Testing:**

```bash
# 1. Manual test on mobile device
# Navigate to any event registration page on iPhone/Android
# Expected: Text is dark and clearly visible in all input fields
# Expected: No white-on-white text issue

# 2. Test on desktop
# Expected: No visual regression, still works as before

# 3. Test with different mobile browsers
# Safari iOS, Chrome Mobile, Firefox Mobile
# Expected: All show dark text on white background
```

**Why This Was Critical:**

- 🚫 **Complete Registration Failure**: Mobile users (majority of traffic) couldn't complete registration
- 🚫 **Revenue Loss**: Events couldn't accept registrations from mobile users
- 🚫 **Poor User Experience**: Users had to type blindly or give up
- 🚫 **Accessibility Issue**: Violated WCAG contrast guidelines

**Prevention:**
Always specify explicit text colors and backgrounds for form inputs, especially for mobile:

```typescript
// Good pattern for all inputs
className = '... text-gray-900 bg-white ...'

// Never rely on browser defaults for production forms
```

**Status:** ✅ FIXED

---

### Bug #19: Missing Form Validation - Submit Button Active Without Required Fields

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx`
**Severity:** 🟡 MODERATE - UX/Validation
**Fixed Date:** 2025-11-11

**Description:**
Users could submit event registration forms without filling in all mandatory fields. The submit button was enabled even when required fields were empty, leading to failed submissions and poor user experience. There was no clear feedback about which fields needed to be completed.

**UX Impact:**

- ⚠️ **Poor User Feedback**: Users clicking submit without knowing what was missing
- ⚠️ **Wasted Time**: Users had to guess which fields were required
- ⚠️ **Frustration**: Form submission failing without clear guidance
- ⚠️ **Higher Bounce Rate**: Users potentially abandoning registration

**User Request:**

```
"on the event: http://localhost:9000/p/schooltest/asd-2 when not all mandatory fields filled,
the submit button must be disabled and near it the missing fields that missing, as text. follow ui ux"
```

**Code Before Fix:**

```typescript
// app/p/[schoolSlug]/[eventSlug]/page.tsx:442-455
<button
  type="submit"
  disabled={submitting || (event.status !== 'OPEN')}
  className="..."
>
  {submitting ? 'שולח...' : (isFull ? 'הרשמה לרשימת המתנה' : 'שלח הרשמה')}
</button>
// ❌ Button enabled even when required fields are empty
// ❌ No feedback about which fields are missing
```

**Fix Applied:**

**1. Validation Logic (lines 77-102):**

```typescript
// Get missing required fields for validation
const getMissingFields = () => {
  if (!event) return []

  const missing: string[] = []

  // Check all required fields in schema
  event.fieldsSchema.forEach((field: any) => {
    if (field.required) {
      const value = formData[field.name]
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        missing.push(field.label) // ✅ Collect missing field labels
      }
    }
  })

  // Check terms acceptance if required
  if (event.requireAcceptance && !acceptedTerms) {
    missing.push('אישור תנאי השתתפות')
  }

  return missing
}

const missingFields = getMissingFields()
const isFormValid = missingFields.length === 0
```

**2. Missing Fields Indicator (lines 469-489):**

```typescript
{/* Missing Fields Indicator */}
{!isFormValid && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <div className="flex items-start gap-2">
      <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-semibold text-red-800 mb-2">
          יש למלא את השדות הבאים כדי להמשיך:
        </p>
        <ul className="text-sm text-red-700 space-y-1">
          {missingFields.map((field, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
              {field}  {/* ✅ Show specific field name */}
            </li>
          ))}
        </ul>
      </div>
    </div>
  </div>
)}
```

**3. Submit Button Updates (lines 491-506):**

```typescript
<button
  type="submit"
  disabled={submitting || (event.status !== 'OPEN') || !isFormValid}  // ✅ Disabled when invalid
  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
>
  {submitting ? (
    <span className="flex items-center justify-center">
      <Loader2 className="w-5 h-5 animate-spin ml-2" />
      שולח...
    </span>
  ) : !isFormValid ? (
    'נא למלא את כל השדות החובה'  // ✅ Clear disabled state message
  ) : (
    isFull ? 'הרשמה לרשימת המתנה' : 'שלח הרשמה'
  )}
</button>
```

**Files Changed:**

- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:77-102` - Added `getMissingFields()` validation function
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:101-102` - Added `missingFields` and `isFormValid` computed values
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:469-489` - Added missing fields indicator UI
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:493` - Added `!isFormValid` to button disabled condition
- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:501-502` - Added disabled state button text

**Features:**

- ✅ **Real-time Validation**: Form validity updates as user fills fields
- ✅ **Clear Feedback**: Red notification box lists all missing fields
- ✅ **Visual Indicators**: AlertCircle icon and bullet points for each missing field
- ✅ **Disabled State**: Button visually disabled (50% opacity) when invalid
- ✅ **Button Text Change**: "נא למלא את כל השדות החובה" when disabled
- ✅ **Accessibility**: Proper ARIA states through disabled attribute
- ✅ **RTL Support**: Hebrew text with proper right-to-left layout

**UI/UX Best Practices:**

1. **Progressive Disclosure**: Error message only appears when needed
2. **Specific Feedback**: Lists exact field names, not generic "fill all fields"
3. **Visual Hierarchy**: Red color (error), icon (attention), list (clarity)
4. **Consistent Behavior**: Button disabled state matches validation state
5. **Helpful Text**: Button text explains why it's disabled

**Testing:**

```bash
# 1. Test empty form
# Navigate to event registration page
# Expected: Red notification visible with all required fields listed
# Expected: Button disabled with text "נא למלא את כל השדות החובה"

# 2. Test partial completion
# Fill some but not all required fields
# Expected: Notification updates to show remaining missing fields
# Expected: Button still disabled

# 3. Test complete form
# Fill all required fields
# Expected: Red notification disappears
# Expected: Button enabled with "שלח הרשמה" text
# Expected: Can submit successfully

# 4. Test terms checkbox
# Fill all fields but don't check terms (if requireAcceptance is true)
# Expected: "אישור תנאי השתתפות" appears in missing fields list
```

**Impact:**

- ✅ Reduced form abandonment (users know what to fill)
- ✅ Fewer failed submissions (validation before submit)
- ✅ Better user experience (clear, actionable feedback)
- ✅ Improved accessibility (disabled states properly communicated)
- ✅ Professional UI (matches modern web standards)

**Status:** ✅ FIXED

---

### Bug #20: Admin Panel Displaying Field IDs Instead of Field Labels in Registration Data

**File:** `/app/admin/events/[id]/page.tsx`
**Severity:** 🟡 MODERATE - UX/Data Display
**Fixed Date:** 2025-11-11

**Description:**
When viewing registration details in the admin panel, custom field names were displaying as technical IDs (e.g., `field_1762863496708`) instead of the human-readable labels that admins set up when creating the event. This made it difficult for admins to understand what information users had submitted.

**User Report:**

```
"work, but admin see: [screenshots showing field IDs]
Registration data:
- name: asdads
- phone: 123123
- field_1762863496708: asdads  ❌ (should show actual question)
- field_1762863500589: asdad   ❌
- field_1762863506443: 111     ❌
- field_1762863527445: שדגשדגשד ❌
```

**Visual Issue:**

- User registration worked correctly ✅
- User received confirmation code ✅
- BUT admin panel showed field IDs instead of field labels ❌
- Example: `field_1762863496708` instead of "שם הילד" or "כיתה"

**Root Cause:**
The admin panel's expanded registration view was directly displaying keys from `registration.data` object without mapping them to their corresponding labels from the event's `fieldsSchema`.

**How Custom Fields Work:**

1. Admin creates event with custom fields via FieldBuilder
2. Each field gets a unique ID: `field_1762863496708`
3. Field has a `label` (human-readable, e.g., "שם הילד")
4. User submits registration → data saved with field ID as key
5. Admin views registration → needs to map field ID back to label

**Code Before Fix:**

```typescript
// app/admin/events/[id]/page.tsx:435-440
{expandedRow === registration.id && (
  <tr>
    <td colSpan={7} className="px-3 sm:px-6 py-4 bg-gray-50">
      <div className="space-y-2 text-sm">
        {Object.entries(registration.data).map(([key, value]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-gray-700">{key}:</span>  {/* ❌ Shows field ID */}
            <span className="text-gray-900">{String(value)}</span>
          </div>
        ))}
      </div>
    </td>
  </tr>
)}
```

**Fix Applied:**

**1. Created Helper Function (lines 200-221):**

```typescript
// Helper function to get field label from fieldsSchema
const getFieldLabel = (fieldKey: string): string => {
  if (!event?.fieldsSchema) return fieldKey

  // Check if this is a custom field (starts with "field_")
  if (fieldKey.startsWith('field_')) {
    const field = event.fieldsSchema.find((f: any) => f.id === fieldKey)
    return field?.label || fieldKey // ✅ Return human-readable label
  }

  // Return common field labels in Hebrew
  const commonFields: Record<string, string> = {
    name: 'שם',
    phone: 'טלפון',
    email: 'אימייל',
    spotsCount: 'מספר מקומות',
    message: 'הודעה',
    notes: 'הערות',
  }

  return commonFields[fieldKey] || fieldKey
}
```

**2. Updated Registration Data Display (line 460):**

```typescript
{Object.entries(registration.data).map(([key, value]) => (
  <div key={key} className="flex gap-2">
    <span className="font-medium text-gray-700">{getFieldLabel(key)}:</span>  {/* ✅ Uses label */}
    <span className="text-gray-900">{String(value)}</span>
  </div>
))}
```

**How It Works:**

1. Admin clicks row to expand registration details
2. System iterates through `registration.data` object
3. For each field key:
   - If starts with `field_`, looks up label in `event.fieldsSchema`
   - If common field (name, phone), translates to Hebrew
   - If not found, falls back to original key (safe default)
4. Displays human-readable label instead of technical ID

**Before/After Comparison:**

```
BEFORE:
- field_1762863496708: asdads
- field_1762863500589: asdad
- field_1762863506443: 111
- field_1762863527445: שדגשדגשד

AFTER:
- שם הילד: asdads
- כיתה: asdad
- גיל: 111
- הערות: שדגשדגשד
```

**Files Changed:**

- `/app/admin/events/[id]/page.tsx:200-221` - Added `getFieldLabel()` helper function
- `/app/admin/events/[id]/page.tsx:460` - Updated registration data display to use `getFieldLabel(key)`

**Features:**

- ✅ **Custom Field Mapping**: Maps `field_*` IDs to their labels from fieldsSchema
- ✅ **Common Field Translation**: Translates standard fields to Hebrew (שם, טלפון, etc.)
- ✅ **Fallback Safety**: Returns original key if no label found
- ✅ **No Breaking Changes**: Works with all existing registration data
- ✅ **Schema Validation**: Handles missing or malformed fieldsSchema gracefully

**Testing:**

```bash
# 1. Test with custom fields
# Create event with custom fields (via FieldBuilder)
# Add registration with custom field data
# View registration in admin panel
# Expected: Field labels show correctly (not IDs)

# 2. Test with common fields only
# Create event with default fields (name, phone)
# Add registration
# Expected: Shows "שם" and "טלפון" (translated)

# 3. Test with missing schema
# If fieldsSchema is null/undefined
# Expected: Falls back to field keys (no crash)

# 4. Test with mixed field types
# Event with both custom and common fields
# Expected: Both display with proper labels
```

**Impact:**

- ✅ Admins can now understand registration data at a glance
- ✅ No need to cross-reference field IDs with event schema
- ✅ More professional admin experience
- ✅ Consistent with UX expectations (labels, not IDs)

**Status:** ✅ FIXED

---

### Bug #21: Missing Payment Configuration UI in Event Creation Form

**File:** `/app/admin/events/new/page.tsx`
**Severity:** 🔴 CRITICAL - Missing Feature
**Fixed Date:** 2026-01-10

**Description:**
The event creation form is completely missing payment configuration options, even though the database schema fully supports payment settings for event ticketing via YaadPay. Users cannot configure paid events during creation, limiting the platform to free events only.

**User Report:**

```
"when create event, there is no add payment options! its a bug"
```

**Technical Context:**
The Prisma schema includes comprehensive payment support (Event model, lines 201-206):

- `paymentRequired` (Boolean) - Whether payment is required
- `paymentTiming` (Enum: OPTIONAL, UPFRONT, POST_REGISTRATION)
- `pricingModel` (Enum: FIXED_PRICE, PER_GUEST, FREE)
- `priceAmount` (Decimal) - Price in ILS
- `currency` (String) - Currency code

These fields exist in:

- ✅ Database schema (`/prisma/schema.prisma:201-206`)
- ✅ FormData state (`/app/admin/events/new/page.tsx:66-70`)
- ✅ API endpoint (accepts payment fields)
- ❌ **UI Form** - COMPLETELY MISSING

**Impact:**

- 🚫 **Revenue Loss**: Schools cannot create paid events
- 🚫 **Feature Gap**: YaadPay integration exists but unusable
- 🚫 **Manual Workaround Required**: Admins must edit events after creation via database
- 🚫 **Poor UX**: Users expect payment options but can't find them

**Code Before Fix:**

```typescript
// app/admin/events/new/page.tsx:52-70
const [formData, setFormData] = useState<EventFormData>({
  title: '',
  description: '',
  // ... other fields ...

  // Payment settings (Tier 2: Event Ticketing - YaadPay)
  paymentRequired: false, // ✅ Exists in state
  paymentTiming: 'OPTIONAL', // ✅ Exists in state
  pricingModel: 'FREE', // ✅ Exists in state
  currency: 'ILS', // ✅ Exists in state
  // priceAmount: missing from formData
})

// ❌ NO UI FOR THESE FIELDS IN ANY OF THE 4 STEPS
```

**Fix Applied:**

**1. Added Payment Configuration Section to Step 3 (Advanced):**

Added comprehensive payment UI after the "Field Builder" section with:

- Payment requirement toggle
- Payment timing selector (conditional - only if payment required)
- Pricing model selector (conditional)
- Price amount input (conditional - only if not FREE)
- Visual indicators and help text

**2. Updated FormData State:**

```typescript
// Added priceAmount to initial state
const [formData, setFormData] = useState<EventFormData>({
  // ... existing fields ...
  paymentRequired: false,
  paymentTiming: 'OPTIONAL',
  pricingModel: 'FREE',
  priceAmount: undefined, // ✅ NEW
  currency: 'ILS',
})
```

**3. UI Components Added (Step 3, Advanced Tab):**

```typescript
{/* Payment Configuration - NEW SECTION */}
<div className="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
  <div className="flex items-center gap-2 mb-4">
    <CreditCard className="w-6 h-6 text-green-600" />
    <h2 className="text-xl font-bold text-gray-900">הגדרות תשלום</h2>
  </div>

  {/* Payment Required Toggle */}
  <label className="flex items-center gap-3 cursor-pointer">
    <input type="checkbox" checked={formData.paymentRequired} />
    <span>דרוש תשלום לאירוע זה</span>
  </label>

  {/* Conditional: Payment Timing */}
  {formData.paymentRequired && (
    <select value={formData.paymentTiming}>
      <option value="UPFRONT">תשלום מראש (לפני ההרשמה)</option>
      <option value="POST_REGISTRATION">תשלום לאחר ההרשמה</option>
      <option value="OPTIONAL">אופציונלי</option>
    </select>
  )}

  {/* Conditional: Pricing Model */}
  {formData.paymentRequired && (
    <select value={formData.pricingModel}>
      <option value="FIXED_PRICE">מחיר קבוע להרשמה</option>
      <option value="PER_GUEST">מחיר לכל אורח</option>
      <option value="FREE">חינם</option>
    </select>
  )}

  {/* Conditional: Price Amount */}
  {formData.paymentRequired && formData.pricingModel !== 'FREE' && (
    <input
      type="number"
      step="0.01"
      min="0"
      value={formData.priceAmount || ''}
      placeholder="מחיר באגורות (לדוגמה: 50.00)"
    />
  )}
</div>
```

**4. Validation Logic:**

```typescript
// Added validation for payment fields
const validatePaymentFields = () => {
  if (formData.paymentRequired) {
    if (formData.pricingModel !== 'FREE' && !formData.priceAmount) {
      return 'יש להזין מחיר כאשר האירוע בתשלום'
    }
    if (formData.priceAmount && formData.priceAmount < 0) {
      return 'המחיר חייב להיות חיובי'
    }
  }
  return null
}
```

**Files Changed:**

- `/app/admin/events/new/page.tsx:52-70` - Added `priceAmount` to formData state
- `/app/admin/events/new/page.tsx:849-960` - Added payment configuration section in step 3
- `/app/admin/events/new/page.tsx:344-362` - Updated validation to include payment fields
- `/app/docs/bugs/bugs.md` - Documented bug

**Features Added:**

- ✅ **Payment Required Toggle**: Enable/disable payment for event
- ✅ **Payment Timing Selector**: Choose when users pay (upfront, post-registration, optional)
- ✅ **Pricing Model Selector**: Fixed price vs per-guest pricing
- ✅ **Price Amount Input**: Enter price in ILS with validation
- ✅ **Conditional Rendering**: Only show relevant fields based on selections
- ✅ **Visual Feedback**: Icons, help text, and validation messages
- ✅ **Hebrew RTL Support**: Proper right-to-left layout
- ✅ **Validation**: Ensures price is set when payment required

**UI/UX Improvements:**

1. **Logical Grouping**: Payment settings in Advanced step with other optional features
2. **Progressive Disclosure**: Only show payment options when "Payment Required" is checked
3. **Clear Labels**: Hebrew labels with descriptive text
4. **Validation Feedback**: Real-time validation for price fields
5. **Icons**: CreditCard icon for visual clarity
6. **Help Text**: Explains each option and when to use it

**Testing:**

```bash
# 1. Test free event (default)
# Navigate to /admin/events/new
# Expected: Payment section collapsed, paymentRequired unchecked

# 2. Test enabling payment
# Check "דרוש תשלום לאירוע זה"
# Expected: Payment timing and pricing model selectors appear

# 3. Test fixed price
# Select "מחיר קבוע להרשמה"
# Enter price: 50.00
# Expected: Price input visible, accepts decimal values

# 4. Test per-guest pricing (table-based)
# Select "מחיר לכל אורח"
# Enter price: 100.00
# Expected: Price per guest calculated at registration time

# 5. Test validation
# Enable payment, select FIXED_PRICE, leave price empty
# Expected: Validation error when trying to create event

# 6. Test event creation
# Fill all fields including payment settings
# Submit form
# Expected: Event created with payment configuration saved
```

**Why This Was Critical:**

- 🚫 **Missing Core Feature**: Payment is Tier 2 feature but completely unusable
- 🚫 **Revenue Impact**: Schools cannot monetize events
- 🚫 **Platform Limitation**: Forced all events to be free
- 🚫 **Poor Developer Experience**: Payment fields in schema but no UI

**Prevention:**
When adding database schema fields, always ensure corresponding UI exists:

1. Check all forms that create/edit the model
2. Add UI components for new fields
3. Update validation logic
4. Test full create/edit flow
5. Document new features in help pages

**Related Features:**

- YaadPay Integration (payment gateway)
- Registration payment flow (existing backend logic)
- Payment status tracking (exists in schema, needs admin UI)

**Status:** ✅ FIXED

---

**Report Generated:** 2025-11-10
**Last Updated:** 2026-01-10
**Tested By:** Claude Code QA
**Next Review:** After critical fixes implemented

---

### Bug #18: Payment API Field Mismatch - CAPACITY_BASED Events Cannot Process Payment ✅ FIXED

**Files:**

- `/app/api/payment/create/route.ts` (lines 131-143)

**Severity:** 🔴 CRITICAL (revenue loss - prevents payment processing)
**Status:** ✅ FIXED (2026-01-10)

**Description:**
Events configured with PER_GUEST pricing model and CAPACITY_BASED event type cannot process upfront payments because the payment API expects `guestsCount` but CAPACITY_BASED events send `spotsCount`. This causes payment creation to fail with "Invalid guest count" error.

**Root Cause:**
The payment API was written with TABLE_BASED events in mind, which use `guestsCount` to represent the number of participants. However, CAPACITY_BASED events use `spotsCount` for the same purpose.

```typescript
// BEFORE (BROKEN):
} else if (event.pricingModel === 'PER_GUEST') {
  const guestsCount = Number(registrationData.guestsCount)  // ❌ Expects guestsCount

  if (!guestsCount || guestsCount < 1) {
    return NextResponse.json(
      { error: 'Invalid guest count for per-guest pricing' },
      { status: 400 }
    )
  }

  amountDue = event.priceAmount.mul(guestsCount)
}
```

**What Happened:**

1. User configures event: CAPACITY_BASED + PER_GUEST pricing + UPFRONT payment
2. User tries to register through public page
3. Frontend sends `{ spotsCount: 2 }` to payment API
4. Payment API looks for `guestsCount` → finds `undefined`
5. Validation fails → Returns 400 error
6. Payment creation fails
7. User cannot complete registration

**Fix Applied:**

```typescript
// AFTER (FIXED):
} else if (event.pricingModel === 'PER_GUEST') {
  // Price per guest/spot (works for both TABLE_BASED and CAPACITY_BASED events)
  // TABLE_BASED events send 'guestsCount', CAPACITY_BASED events send 'spotsCount'
  const participantCount = Number(registrationData.guestsCount || registrationData.spotsCount)  // ✅ Accept both

  if (!participantCount || participantCount < 1) {
    return NextResponse.json(
      { error: 'Invalid participant count for per-guest pricing' },
      { status: 400 }
    )
  }

  amountDue = event.priceAmount.mul(participantCount)
}
```

**Verification:**

- ✅ TABLE_BASED events: Still works with `guestsCount`
- ✅ CAPACITY_BASED events: Now works with `spotsCount`
- ✅ Error message updated to "participant count" (generic)
- ✅ Payment calculation correct for both event types

**Testing:**

```bash
# Test CAPACITY_BASED event with payment
curl -X POST http://localhost:9000/api/payment/create \
  -H "Content-Type: application/json" \
  -d '{
    "schoolSlug": "tests",
    "eventSlug": "paid-event",
    "registrationData": {
      "name": "Test User",
      "phone": "0501234567",
      "email": "test@test.com",
      "spotsCount": 2
    }
  }'

# Should return HTML redirect form (success)
```

---

### Bug #19: Registration API Security Hole - UPFRONT Payment Events Allow Free Registration 🔴 CRITICAL ✅ FIXED

**Files:**

- `/app/api/p/[schoolSlug]/[eventSlug]/register/route.ts` (lines 275-276)

**Severity:** 🔴🔴🔴 CRITICAL (revenue loss + security vulnerability)
**Status:** ✅ FIXED (2026-01-10)

**Description:**
Events configured with `paymentRequired: true` and `paymentTiming: UPFRONT` allow users to register for free by directly calling the registration API, bypassing payment entirely. This is a critical security vulnerability that results in direct revenue loss.

**Root Cause:**
The registration API only validates POST_REGISTRATION payment events. It does NOT reject UPFRONT payment events, treating them as free events instead.

```typescript
// BEFORE (BROKEN):
// Detect POST_REGISTRATION payment mode
const requiresPostPayment = event.paymentRequired && event.paymentTiming === 'POST_REGISTRATION'

// ❌ UPFRONT events: requiresPostPayment = false
// ❌ Proceeds as FREE event - no payment validation!
// ❌ Creates registration with status='CONFIRMED'
// ❌ Generates QR code
// ❌ Sends confirmation email
// ❌ User gets full access WITHOUT PAYMENT!
```

**What Happened:**

1. Admin configures event: paymentRequired=true, paymentTiming=UPFRONT, priceAmount=10
2. User loads public registration page
3. User clicks "המשך לתשלום" button
4. Frontend calls `/api/payment/create` → Fails (due to Bug #18)
5. **User manually calls `/api/p/{school}/{event}/register` endpoint**
6. Registration API checks: `requiresPostPayment = false` (UPFRONT !== POST_REGISTRATION)
7. API treats it as FREE event → Creates confirmed registration
8. QR code generated, email sent, user gets in for free!

**Impact:**

- **Revenue loss:** Users attend paid events without paying
- **Data integrity:** Confirmed registrations without payment records
- **Audit trail broken:** No way to track who paid vs who bypassed
- **Business logic:** Payment timing (UPFRONT) completely ignored
- **Security:** API endpoint can be called directly by anyone

**Fix Applied:**

```typescript
// AFTER (FIXED):
// Check event status
if (event.status === 'CLOSED') {
  throw new Error('Event registration is closed')
}

if (event.status === 'PAUSED') {
  throw new Error('Event registration is paused')
}

// CRITICAL SECURITY CHECK: Reject UPFRONT payment events
// UPFRONT payment events must go through the payment API first (/api/payment/create)
// This prevents users from bypassing payment by calling the registration API directly
if (event.paymentRequired && event.paymentTiming === 'UPFRONT') {
  throw new Error('This event requires upfront payment. Please complete payment first.')
}
```

**Verification:**

- ✅ UPFRONT events: Registration API returns 400 error
- ✅ FREE events: Registration API works normally
- ✅ POST_REGISTRATION events: Registration API works normally
- ✅ Security: Users cannot bypass payment by calling API directly

**Testing:**

```bash
# Test UPFRONT payment event - Should REJECT
curl -X POST http://localhost:9000/api/p/tests/paid-event/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0501234567",
    "email": "test@test.com",
    "spotsCount": 2
  }'

# Expected: 400 error "This event requires upfront payment. Please complete payment first."

# Test FREE event - Should ACCEPT
curl -X POST http://localhost:9000/api/p/tests/free-event/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "0501234567",
    "spotsCount": 1
  }'

# Expected: 200 success with confirmationCode and QR code
```

**Related Bugs:**

- Bug #18: Payment API field mismatch (fixed together)
- These two bugs worked together to create the payment bypass

**Lessons Learned:**

1. **Always validate payment requirements** in ALL registration endpoints
2. **Defense in depth:** Multiple layers of validation needed
3. **API security:** Don't trust frontend to enforce business logic
4. **Test negative cases:** What happens if user bypasses frontend?
5. **Audit critical paths:** Payment flows need extra scrutiny

---

### Bug #20: Public Event API Missing Payment Fields - Frontend Payment Flow Broken 🔴 CRITICAL ✅ FIXED

**Files:**

- `/app/api/p/[schoolSlug]/[eventSlug]/route.ts` (lines 101-129)

**Severity:** 🔴 CRITICAL (payment flow completely broken)
**Status:** ✅ FIXED (2026-01-10)

**Description:**
The public event API endpoint was not returning payment-related fields (paymentRequired, paymentTiming, pricingModel, priceAmount, currency). This caused the frontend to think ALL events were free, bypassing the payment flow entirely.

**Root Cause:**
When the public event API was built, payment fields were not included in the response object. The API only returned basic event info, capacity, and registration fields.

```typescript
// BEFORE (BROKEN):
const response = NextResponse.json({
  type: 'event',
  id: event.id,
  title: event.title,
  // ... other fields ...
  school: event.school,
  _count: event._count,
  totalSpotsTaken,
  // ❌ Missing: paymentRequired, paymentTiming, pricingModel, priceAmount, currency
})
```

**What Happened:**

1. Admin configures event: paymentRequired=true, paymentTiming=UPFRONT, priceAmount=10
2. Database stores: ✅ All payment fields saved correctly
3. User loads public page: `GET /api/p/tests/ntnyh-tl-abyb`
4. API returns: `{ paymentRequired: null, paymentTiming: null, ... }` ❌
5. Frontend checks: `if (event?.paymentRequired && event?.paymentTiming === 'UPFRONT')`
6. Evaluates to: `if (null && null)` → FALSE
7. Frontend skips payment flow → Calls registration API directly
8. Registration API blocks it (Bug #19 fix) → User sees error

**Chain Reaction with Other Bugs:**

- Bug #18: Payment API field mismatch
- Bug #19: Registration API security hole
- **Bug #20: API missing payment fields** (THIS BUG - root cause!)

All three bugs working together prevented payment flow from working.

**Fix Applied:**

```typescript
// AFTER (FIXED):
const response = NextResponse.json({
  type: 'event',
  id: event.id,
  title: event.title,
  // ... other fields ...
  // CRITICAL: Payment fields must be included for frontend payment flow
  paymentRequired: event.paymentRequired,
  paymentTiming: event.paymentTiming,
  pricingModel: event.pricingModel,
  priceAmount: event.priceAmount ? Number(event.priceAmount) : null,
  currency: event.currency,
  school: event.school,
  _count: event._count,
  totalSpotsTaken,
})
```

**Verification:**

```bash
# Test public API returns payment fields
curl -s http://localhost:9000/api/p/tests/ntnyh-tl-abyb | jq '{paymentRequired, paymentTiming, pricingModel, priceAmount}'

# Expected:
{
  "paymentRequired": true,
  "paymentTiming": "UPFRONT",
  "pricingModel": "PER_GUEST",
  "priceAmount": 10
}
```

**Testing:**

```bash
# 1. Configure event with payment
# Admin dashboard → Events → Edit → Payment step
# - Payment Required: Yes
# - Payment Timing: UPFRONT
# - Pricing Model: PER_GUEST
# - Price: 10 ILS

# 2. Load public registration page
http://localhost:9000/p/tests/ntnyh-tl-abyb

# 3. Verify payment info displayed:
# - Should show: "₪10 למשתתף"
# - Should show: "💳 תשלום מראש נדרש"
# - Button should say: "המשך לתשלום (₪20)" (for 2 participants)

# 4. Fill form and submit
# - Should call: POST /api/payment/create (NOT /api/p/.../register)
# - Should redirect to YaadPay (or show "Payment system not configured" in dev)
```

**Impact:**

- **Before:** ALL events treated as free (payment fields missing)
- **After:** Payment flow works correctly

**Lessons Learned:**

1. **Always include all relevant fields in API responses**
2. **Test the full user flow, not just individual endpoints**
3. **API contracts should be documented and validated**
4. **TypeScript interfaces should match API responses**

---

### Bug #22: Event Overview Page Shows Incorrect "No Participants" Message Despite Active Registrations ✅ FIXED

**File:** `/components/admin/event-details/tabs/OverviewTab.tsx` (lines 507-581)
**Severity:** 🟡 MODERATE (UI inconsistency, confuses admins)
**Status:** ✅ FIXED (2026-01-11)

**Description:**
The Event Overview page displayed contradictory information:

- **Top stats** correctly show: "1 מאושרים" (1 confirmed), "1/10 תפוסה" (1/10 capacity)
- **Recent Activity section** incorrectly shows: "טרם נרשמו משתתפים" (no participants registered yet)

This created confusion for event administrators who saw registrations in the stats but got a "no activity" message below.

**Root Cause:**
The Recent Activity section displayed a hardcoded empty state regardless of actual registrations. The component had access to `event.registrations` and calculated stats correctly, but the Recent Activity section didn't use this data.

**Fix Applied:**
Updated the Recent Activity section to:

1. ✅ Check if there are any registrations
2. ✅ Display latest 5 registrations (excluding cancelled) with:
   - Participant name (extracted from registration data)
   - Number of spots
   - Status badge (confirmed = green, waitlist = amber)
   - Relative timestamp ("לפני 2 שעות", "לפני 3 ימים")
3. ✅ Show "View all X registrations" link if more than 5
4. ✅ Only show empty state when truly empty

**Code Changes:**

```typescript
// AFTER (FIXED):
// Added Registration interface
interface Registration {
  id: string
  data: Record<string, unknown>
  phoneNumber: string
  spotsCount: number
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  confirmationCode: string
  createdAt: string | Date
}

// Added helper functions
const formatRelativeTime = (date: Date | string) => { /* ... */ }
const getParticipantName = (registration: Registration) => { /* ... */ }
const recentRegistrations = registrations.filter(r => r.status !== 'CANCELLED').slice(0, 5)

// Updated rendering logic
{recentRegistrations.length === 0 ? (
  /* Empty state */
  <div className="text-center py-8">
    <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <p className="text-sm text-gray-500">טרם נרשמו משתתפים</p>
    <p className="text-xs text-gray-400 mt-1">פעילות אחרונה תוצג כאן</p>
  </div>
) : (
  /* Show recent registrations */
  recentRegistrations.map(registration => (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      {/* User icon with status color */}
      <div className={registration.status === 'CONFIRMED' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}>
        <User className="w-5 h-5" />
      </div>
      {/* Participant name, spots, status, timestamp */}
      <div>{getParticipantName(registration)}</div>
      <span>{formatRelativeTime(registration.createdAt)}</span>
    </div>
  ))
)}
```

**User Impact:**

- **Before:** Admins saw conflicting information and might doubt the system's accuracy
- **After:**
  - ✅ Consistent messaging throughout the page
  - ✅ Recent Activity shows actual registrations with names and timestamps
  - ✅ Status indicators match top stats
  - ✅ Builds trust in the platform

**Files Modified:**

- `/components/admin/event-details/tabs/OverviewTab.tsx:21-195,507-581` - Added Registration interface, helper functions, and conditional rendering

---

### Bug #23: Public Registration Page Allows Overbooking - Users Can Select More Spots Than Available 🔴 CRITICAL

**File:** `/app/p/[schoolSlug]/[eventSlug]/page.tsx` (lines 760-834)
**Severity:** 🔴 CRITICAL (allows capacity violations, breaks core business logic)
**Status:** ✅ FIXED (2026-01-12)
**Fixed By:** Claude (green-bug-fixer agent)

**Description:**
The public registration form allows users to select more spots than are actually available, causing overbooking. For example:

- Event capacity: 20
- Spots taken: 13
- Spots available: 7
- **BUG:** User can select 9 spots in the dropdown (should be max 7)

This violates atomic capacity enforcement and could lead to event overbooking, breaking the core promise of the system.

**Root Cause:**
The dropdown selector logic has two issues:

1. **When event is full (`isFull`), it uses `maxSpotsPerPerson` directly:**

   ```typescript
   // Line 791 - WRONG
   {
     length: isFull ? event.maxSpotsPerPerson : Math.min(event.maxSpotsPerPerson, spotsLeft)
   }
   ```

   This allows waitlist users to select more spots than available.

2. **The logic doesn't correctly calculate available spots:**
   When `spotsLeft = 7` and `maxSpotsPerPerson = 10`, it should cap at 7, but in some edge cases it allows selecting up to 10.

**Expected Behavior:**

- If 7 spots are available, dropdown should show options: 1, 2, 3, 4, 5, 6, 7 (max 7)
- If event is full, waitlist users should have a reasonable limit (e.g., max 5 or maxSpotsPerPerson, whichever is smaller)
- Increment/decrement buttons should also respect this limit

**Fix Applied:**
Refactored the spots selector component to use an IIFE (Immediately Invoked Function Expression) that calculates `maxSelectable` once and uses it throughout all UI elements:

```typescript
// BEFORE (WRONG - Lines 790-827):
// Dropdown
{ length: isFull ? event.maxSpotsPerPerson : Math.min(event.maxSpotsPerPerson, spotsLeft) }

// Increment button max check
const max = isFull ? event.maxSpotsPerPerson : Math.min(event.maxSpotsPerPerson, spotsLeft)

// Info text
{isFull
  ? `ניתן לבחור עד ${event.maxSpotsPerPerson} מקומות`
  : `זמינים ${spotsLeft} מקומות • מקסימום ${event.maxSpotsPerPerson} לאדם`
}

// AFTER (FIXED - Lines 760-834):
{event.eventType === 'CAPACITY_BASED' && event.maxSpotsPerPerson > 1 && (() => {
  // Calculate max selectable spots ONCE
  const maxSelectable = isFull
    ? Math.min(5, event.maxSpotsPerPerson) // Waitlist: reasonable limit (max 5)
    : Math.min(event.maxSpotsPerPerson, spotsLeft) // Normal: available spots only

  return (
    <div>
      {/* Dropdown uses maxSelectable */}
      <select>
        {Array.from({ length: maxSelectable }, (_, i) => i + 1).map(...)}
      </select>

      {/* Increment button uses maxSelectable */}
      <button
        onClick={() => { if (spotsCount < maxSelectable) { ... } }}
        disabled={spotsCount >= maxSelectable}
      >

      {/* Info text uses maxSelectable */}
      <p>
        {isFull
          ? `ניתן לבחור עד ${maxSelectable} מקומות לרשימת המתנה`
          : `זמינים ${spotsLeft} מקומות • מקסימום ${maxSelectable} לאדם`
        }
      </p>
    </div>
  )
})()}
```

**Key Changes:**

1. **Lines 760-764:** Added IIFE wrapper with `maxSelectable` calculation
2. **Line 797:** Dropdown length now uses `maxSelectable` (was complex inline expression)
3. **Lines 809-814:** Increment button logic simplified to use `maxSelectable`
4. **Lines 825-827:** Info text now shows `maxSelectable` for consistency

**Testing:**

1. Create event with capacity 20
2. Register 13 spots
3. Try to register as new user
4. ✅ Dropdown should show max 7 options (1-7)
5. ✅ Cannot select 8, 9, or 10
6. ✅ Fill event to capacity (20/20)
7. ✅ Waitlist users can select up to 5 spots (or maxSpotsPerPerson if lower)

**User Impact:**

- **Before:** Users could register for more spots than available, causing overbooking
- **After:**
  - ✅ Dropdown strictly enforces available spots
  - ✅ Cannot select more spots than the event can accommodate
  - ✅ Atomic capacity enforcement preserved
  - ✅ Waitlist users have reasonable limits

**Files Modified:**

- `/app/p/[schoolSlug]/[eventSlug]/page.tsx:760-834` - Fixed dropdown generation, increment/decrement buttons, and info text to properly enforce available spot limits

**Code Quality Improvements:**

- DRY principle: Calculated `maxSelectable` once instead of repeating logic in 3 places
- Cleaner code: IIFE pattern allows scoped variable for the component
- Consistency: All UI elements (dropdown, buttons, text) now use the same calculated value

**Related Issues:**

- Atomic capacity enforcement (core feature)
- Race condition prevention
- Waitlist management

**E2E Test Coverage:**

- ✅ 21/21 tests passing (100%)
- **Test Suite:** `/tests/suites/04-public-registration-p0.spec.ts` (lines 411-920)
- **Scenarios tested:**
  1. Limit dropdown to 7 spots when 7 available
  2. Prevent selecting more than available spots
  3. Limit waitlist registrations to max 5 spots
  4. Respect maxSpotsPerPerson even when more spots available
  5. Dynamically update available spots after registration
  6. Show "Event Full" when no spots available
  7. Handle edge case: exactly 1 spot remaining
- **Browsers:** Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- **Test Pattern:** Creates actual database registrations to occupy spots (not `.withSpotsReserved()`)
- **Date Fixed:** 2026-01-12
- **Tests Added By:** Claude (green-test-writer agent)

---
