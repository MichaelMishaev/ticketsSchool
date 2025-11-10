# Bug Report - Authentication & Onboarding Flow
**Date:** 2025-11-10
**Severity Levels:** =4 CRITICAL | =� MODERATE | =� LOW

---

## =4 CRITICAL BUGS

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
      { email },  // � DANGEROUS: No password check
    ],
  },
})
```

**Fix:**
```typescript
// Safe approach: Only link if password is not set (OAuth-only account)
let admin = await prisma.admin.findUnique({
  where: { googleId }
})

if (!admin) {
  const existingByEmail = await prisma.admin.findUnique({
    where: { email }
  })

  if (existingByEmail && existingByEmail.passwordHash) {
    // Require password confirmation before linking
    return NextResponse.redirect(
      new URL('/admin/link-google?email=' + encodeURIComponent(email), BASE_URL)
    )
  }

  // Only auto-link if no password is set (OAuth-only account)
  admin = existingByEmail || await prisma.admin.create({
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
  })
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
  matcher: ['/admin/:path*', '/api/:path*']
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
    email: email.toLowerCase(),  // Add this
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
const emailSent = await sendVerificationEmail(
  email.toLowerCase(),
  verificationToken,
  name
)

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

| Severity | Count | Status |
|----------|-------|--------|
| =4 CRITICAL | 4 | All OPEN |
| =� MODERATE | 4 | All OPEN |
| =� LOW | 2 | Enhancement backlog |

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
  schoolName: '',      // ✅ NEW
  schoolSlug: '',      // ✅ NEW
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
    schoolSlug: generateSlug(name),  // ✅ Auto-generate URL-friendly slug
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
    <input
      name="schoolSlug"
      placeholder="my-organization"
      value={formData.schoolSlug}
    />
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
  schoolName?: string     // ✅ NEW - Optional for backward compatibility
  schoolSlug?: string     // ✅ NEW - Optional for backward compatibility
}

export async function POST(request: NextRequest) {
  const { email, password, name, schoolName, schoolSlug } = body

  // Create school if provided
  let createdSchoolId: string | null = null
  let requiresOnboarding = true

  if (schoolName && schoolSlug) {
    // ✅ Check if slug already taken
    const existingSchool = await prisma.school.findUnique({
      where: { slug: schoolSlug }
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
      }
    })
    createdSchoolId = school.id
    requiresOnboarding = false  // ✅ Onboarding complete!
  }

  // Create admin with schoolId if school was created
  const admin = await prisma.admin.create({
    data: {
      email: email.toLowerCase(),
      passwordHash,
      name,
      role: 'OWNER',
      schoolId: createdSchoolId,           // ✅ Set immediately if provided
      onboardingCompleted: !requiresOnboarding,  // ✅ True if school created
      emailVerified: false,
      verificationToken,
    },
  })

  return NextResponse.json({
    success: true,
    requiresOnboarding,  // ✅ False if school info was provided
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
2. ❌ FROM address `noreply@ticketcap.com` is not a verified domain
3. ❌ All other recipients are blocked with error: "You can only send testing emails to your own email address"

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
✗ FROM address 'noreply@ticketcap.com' not verified
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
- `.env.local:6` - Changed `EMAIL_FROM` from `noreply@ticketcap.com` to `onboarding@resend.dev`
- `/app/api/admin/resend-verification/route.ts` - New endpoint for resending verification emails
- `/app/admin/signup/page.tsx:20-21` - Added `isResending` and `resendMessage` state
- `/app/admin/signup/page.tsx:24-51` - Added `handleResendEmail()` function
- `/app/admin/signup/page.tsx:164-177` - Added resend button to success page UI

**Long-term Solution (For Production):**

To send emails to all users in production:

1. **Verify a Domain:**
   ```
   1. Go to https://resend.com/domains
   2. Add your domain (e.g., ticketcap.com)
   3. Add DNS records they provide:
      - SPF: TXT record
      - DKIM: TXT record
   4. Wait for verification (~5-10 minutes)
   ```

2. **Update Environment Variable:**
   ```env
   EMAIL_FROM="noreply@ticketcap.com"  # Now will work!
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

**Report Generated:** 2025-11-10
**Last Updated:** 2025-11-10
**Tested By:** Claude Code QA
**Next Review:** After critical fixes implemented
