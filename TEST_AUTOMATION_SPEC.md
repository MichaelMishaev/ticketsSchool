# Comprehensive Test Automation Specification
**Project:** TicketCap - Event Registration System
**Created:** 2025-11-11
**Purpose:** Complete mapping of all UI interactions, flows, and test scenarios

---

## Table of Contents
1. [Public User Flows](#1-public-user-flows)
2. [Admin Authentication Flows](#2-admin-authentication-flows)
3. [Admin Dashboard & Event Management](#3-admin-dashboard--event-management)
4. [Super Admin Features](#4-super-admin-features)
5. [Mobile & Responsive Tests](#5-mobile--responsive-tests)
6. [Edge Cases & Error Scenarios](#6-edge-cases--error-scenarios)
7. [Multi-Tenant Isolation Tests](#7-multi-tenant-isolation-tests)
8. [Performance & Load Tests](#8-performance--load-tests)

---

## 1. Public User Flows

### 1.1 Landing Page (`/`)
**File:** `app/page.tsx`, `components/landing/LandingPage.tsx`

#### Click Events
- [ ] **"התחבר" button** (Login) → Navigate to `/admin/login`
- [ ] **"כניסה למערכת" button** (Enter System) → Navigate to `/admin/login`
- [ ] **Logo click** → Scroll to top / reload page

#### Navigation Tests
- [ ] Verify navigation bar is fixed on scroll
- [ ] Test scroll-to-section behavior (if present)
- [ ] Verify all footer links work

#### Responsive Tests
- [ ] Mobile nav hamburger menu (if applicable)
- [ ] Breakpoints: 375px (mobile), 768px (tablet), 1024px (desktop)
- [ ] Hero section text sizing: 4xl → 6xl → 8xl
- [ ] Button sizing and touch targets (min 44px height)

---

### 1.2 Event Registration Page (`/p/[schoolSlug]/[eventSlug]`)
**File:** `app/p/[schoolSlug]/[eventSlug]/page.tsx`

#### Page Load Tests
- [ ] Fetch event data via `/api/p/[schoolSlug]/[eventSlug]`
- [ ] Handle 404 for non-existent event
- [ ] Handle 404 for non-existent school
- [ ] Display event details (title, description, location, date/time)
- [ ] Show capacity indicator (X/Y spots taken)
- [ ] Display custom fields from `fieldsSchema`

#### Input Field Tests
All fields must have `text-gray-900 bg-white` classes (Bug #18 fix)

**Dynamic Fields from Schema:**
- [ ] **Text input** - Validate required fields, max length
- [ ] **Number input** - Validate numeric only, min/max values
- [ ] **Dropdown/Select** - Validate selection required, options render
- [ ] **Checkbox** - Validate boolean state

**Fixed Fields:**
- [ ] **Spots count input** (type=number)
  - Min: 1
  - Max: `event.maxSpotsPerPerson`
  - Default: 1
  - Increment/decrement buttons
  - Validation on blur

- [ ] **Terms acceptance checkbox** (if `requireAcceptance: true`)
  - Must be checked to submit
  - Link to terms opens in new tab

#### Form Validation Tests (Bug #19 fix)
- [ ] **Missing required fields** → Show red notification box
  - List specific field names missing
  - Disable submit button
  - Button text: "נא למלא את כל השדות החובה"
- [ ] **Partial completion** → Update missing fields list in real-time
- [ ] **All fields filled** → Hide notification, enable submit
- [ ] **Terms not accepted** (if required) → "אישור תנאי השתתפות" in missing list

#### Submit Button States
- [ ] **Default state** (form valid, event OPEN): "שלח הרשמה"
- [ ] **Full capacity**: "הרשמה לרשימת המתנה"
- [ ] **Submitting**: Loader icon + "שולח..."
- [ ] **Disabled (invalid form)**: Grayed out + custom text
- [ ] **Disabled (event closed)**: Show closed message

#### API Integration Tests
**Endpoint:** `POST /api/p/[schoolSlug]/[eventSlug]/register`

- [ ] **Successful registration** (capacity available)
  - Status 200
  - Returns `confirmationCode`
  - Shows success screen with confirmation code
  - Screenshot-friendly design
  - Display custom `completionMessage` if set

- [ ] **Waitlist registration** (full capacity)
  - Status 200
  - Returns `confirmationCode`, `isWaitlist: true`
  - Shows waitlist message

- [ ] **Duplicate registration** (same phone number)
  - Status 409
  - Error message shown
  - Form not cleared

- [ ] **Event closed** (status !== 'OPEN')
  - Status 400
  - Error message shown

- [ ] **Validation errors** (server-side)
  - Status 400
  - Display error messages

#### Phone Number Handling
Israeli format normalization:
- [ ] Accept formats: `050-1234567`, `0501234567`, `+972501234567`
- [ ] Normalize to: `0501234567` (10 digits starting with 0)
- [ ] Validate: Must be 10 digits starting with 0
- [ ] Error for invalid formats

#### Responsive Tests
- [ ] **Mobile (375px)**
  - All input fields visible and tappable
  - Text color visible (dark on white) - Bug #18
  - Submit button full width, 44px+ height
  - Capacity bar renders correctly
  - Event details stack vertically

- [ ] **Tablet (768px)**
  - Form centered with max-width
  - Two-column layout for fields (if applicable)

- [ ] **Desktop (1024px+)**
  - Form max-width constraint
  - Proper spacing and typography

#### Visual Tests
- [ ] **Capacity indicator**
  - Progress bar color: green → yellow → red
  - Percentage calculation correct
  - "X/Y spots taken" text

- [ ] **School branding** (if applicable)
  - School logo displays
  - Primary color applied to theme

- [ ] **Success screen**
  - Confirmation code large and readable
  - Copy button for confirmation code
  - Share/screenshot friendly layout

---

## 2. Admin Authentication Flows

### 2.1 Signup Page (`/admin/signup`)
**File:** `app/admin/signup/page.tsx`

#### Two-Step Form (Bug #13 fix)

**Step 1: Organization Info**
- [ ] **School name input**
  - Required validation
  - Max length
  - Hebrew and English support
  - Real-time slug generation

- [ ] **School slug input**
  - Auto-generated from school name
  - Lowercase, alphanumeric + hyphens
  - Editable by user
  - Preview: `ticketcap.com/p/{slug}`
  - Unique validation via API

**Step 2: Personal Info**
- [ ] **Name input** - Required, Hebrew/English
- [ ] **Email input** - Required, email format validation
- [ ] **Password input** - Min 8 chars, toggle visibility
- [ ] **Confirm password** - Must match password

#### Navigation Between Steps
- [ ] **"המשך" button** → Validate Step 1, move to Step 2
- [ ] **"חזור" button** → Go back to Step 1 without losing data
- [ ] **Progress indicator** - Show current step (1/2, 2/2)

#### Submit Tests
**Endpoint:** `POST /api/admin/signup`

- [ ] **Success (all fields valid)**
  - Status 201
  - School created with unique slug
  - Admin created with `onboardingCompleted: true`
  - Verification email sent (or test mode notification)
  - Show success screen with email verification instructions

- [ ] **Slug already taken**
  - Status 409
  - Error: "הקישור הזה כבר תפוס. אנא בחר קישור אחר."
  - Stay on Step 1, highlight slug field

- [ ] **Email already exists**
  - Status 409
  - Error message shown
  - Link to login page

- [ ] **Password mismatch**
  - Client-side validation before submit
  - Error shown

- [ ] **Email send failure** (Bug #8)
  - Account still created
  - Warning shown
  - "Resend verification email" button available

#### Email Verification Flow
**Endpoint:** `GET /api/admin/verify-email?token={token}`

- [ ] **Valid token**
  - Sets `emailVerified: true`
  - Redirects to `/admin/login?message=verified`
  - Success message: "המייל אומת בהצלחה! ניתן להתחבר עכשיו."

- [ ] **Invalid token**
  - Redirects to `/admin/login?error=invalid_token`
  - Error shown

- [ ] **Expired token**
  - Redirects to `/admin/login?error=token_expired`
  - Show "request new verification email" link

- [ ] **Already verified**
  - Redirects to `/admin/login?message=already_verified`

#### Resend Verification Email (Bug #14 fix)
**Endpoint:** `POST /api/admin/resend-verification`

- [ ] Button visible on signup success screen
- [ ] Loading state while sending
- [ ] Success: "מייל האימות נשלח מחדש!"
- [ ] Error handling (rate limiting, invalid email)

#### Responsive Tests
- [ ] Mobile: Single column form
- [ ] Tablet: Centered with max-width
- [ ] Desktop: Centered card layout
- [ ] All touch targets 44px+

---

### 2.2 Login Page (`/admin/login`)
**File:** `app/admin/login/page.tsx`

#### Input Fields
- [ ] **Email input** - Required, email format
- [ ] **Password input** - Required, toggle visibility

#### Submit Tests
**Endpoint:** `POST /api/admin/login`

- [ ] **Success (valid credentials)**
  - Status 200
  - Session cookie (`admin_session`) set with JWT
  - JWT contains: `adminId`, `email`, `role`, `schoolId`, `schoolName`
  - Redirect based on `onboardingCompleted`:
    - `false` or `!schoolId` → `/admin/onboarding`
    - `true` → `/admin`
  - `localStorage.setItem('admin_logged_in', 'true')` set

- [ ] **Invalid credentials**
  - Status 401
  - Error: "אימייל או סיסמה שגויים"
  - Form not cleared (email retained)

- [ ] **Email not verified**
  - Status 403
  - Error message
  - Show "resend verification" link

- [ ] **OAuth user (no password)**
  - Error: Must use Google OAuth
  - Link to OAuth login

#### URL Parameters Handling
- [ ] `?message=verified` → Success: "המייל אומת בהצלחה!"
- [ ] `?message=already_verified` → Info message
- [ ] `?message=password_reset` → Success: "הסיסמה שונתה בהצלחה!"
- [ ] `?error=missing_token` → Error shown
- [ ] `?error=invalid_token` → Error shown
- [ ] `?error=email_exists_with_password` → Error shown
- [ ] `?error=oauth_failed` → Error shown

#### Google OAuth Flow
**Button:** "Sign in with Google"

- [ ] Click → Redirect to `/api/auth/google`
- [ ] OAuth callback → `/api/auth/google/callback`
- [ ] State cookie validation (CSRF protection)

**New user (no account):**
- [ ] Create admin with `googleId`, `emailVerified: true`
- [ ] Session created
- [ ] Redirect to `/admin/onboarding`

**Existing user (OAuth only, no password):**
- [ ] Login successful
- [ ] Session updated
- [ ] Redirect based on `onboardingCompleted`

**Existing user (with password) - Bug #1 security fix:**
- [ ] Should NOT auto-link
- [ ] Redirect to login with error
- [ ] Must login with password first, then link Google in settings

#### Session Cookie Tests
- [ ] Cookie name: `admin_session`
- [ ] HttpOnly: true
- [ ] Secure: true (production only)
- [ ] SameSite: 'lax'
- [ ] Max-Age: 7 days
- [ ] JWT signed with `JWT_SECRET`

#### Responsive Tests
- [ ] Mobile: Full-width form, large buttons
- [ ] Desktop: Centered card with max-width

---

### 2.3 Onboarding Page (`/admin/onboarding`)
**File:** `app/admin/onboarding/page.tsx`

**Note:** Only accessible if `onboardingCompleted: false` or `!schoolId`

#### Page Load Tests
- [ ] Fetch current admin via `/api/admin/me`
- [ ] If already onboarded → Redirect to `/admin`
- [ ] If not authenticated → Redirect to `/admin/login`

#### Form Fields
- [ ] **School name input** - Required, Hebrew/English
- [ ] **School slug input** - Auto-generated, editable

#### Submit Tests
**Endpoint:** `POST /api/admin/onboarding`

- [ ] **Success**
  - School created
  - Admin updated: `schoolId`, `onboardingCompleted: true`
  - **Session cookie updated** with new `schoolId` and `schoolName` (Bug #10 fix)
  - Redirect to `/admin`

- [ ] **Slug already taken**
  - Status 409
  - Error shown
  - Suggest alternative slug

- [ ] **Name already taken** (if enforced)
  - Status 409
  - Error message

#### Session Update Verification (Bug #10 fix)
After onboarding:
- [ ] Fetch `/api/admin/me` → should return new `schoolId`
- [ ] Fetch `/api/events` → should only show events from new school (not "Default School")
- [ ] Cookie contains updated JWT with `schoolId` and `schoolName`

---

### 2.4 Forgot Password Flow
**File:** `app/admin/forgot-password/page.tsx`

#### Request Reset
**Endpoint:** `POST /api/admin/forgot-password`

- [ ] **Email input** - Required
- [ ] **Success**
  - Email sent with reset link
  - Message: "קישור לאיפוס סיסמה נשלח למייל"
  - Don't reveal if email exists (security)

- [ ] **Email not found**
  - Same success message (don't leak user existence)

- [ ] **Rate limiting**
  - Max 3 requests per hour per email
  - Error shown after limit

#### Reset Password Page
**File:** `app/admin/reset-password/page.tsx`
**URL:** `/admin/reset-password?token={token}`

- [ ] **Token validation** on page load
- [ ] **New password input** - Min 8 chars, toggle visibility
- [ ] **Confirm password** - Must match

**Endpoint:** `POST /api/admin/reset-password`

- [ ] **Success**
  - Password hash updated
  - `resetToken` and `resetTokenExpiry` cleared
  - Redirect to `/admin/login?message=password_reset`

- [ ] **Invalid token**
  - Error: "קישור לא תקין"

- [ ] **Expired token** (>1 hour old)
  - Error: "קישור פג תוקף"
  - Link to request new one

---

## 3. Admin Dashboard & Event Management

### 3.1 Admin Dashboard (`/admin`)
**File:** `app/admin/page.tsx`

#### Authentication
- [ ] Middleware check: `/middleware.ts` validates JWT
- [ ] If not authenticated → Redirect to `/admin/login`
- [ ] Admin layout check: If not in public pages → Redirect to login (Bug #9 fix)

#### Data Loading
**Endpoints:**
- `/api/dashboard/stats`
- `/api/events`
- `/api/admin/me`

- [ ] Fetch stats in parallel
- [ ] Loading states shown
- [ ] Error handling for failed requests

#### Stats Cards (Clickable for Drilldown)
- [ ] **Active Events Card**
  - Display count
  - Click → Open modal with `/api/dashboard/active-events` data
  - Modal shows: Event titles, dates, capacity info

- [ ] **Total Registrations Card**
  - Display count
  - Click → Open modal with `/api/dashboard/registrations` data
  - Modal shows: Recent registrations, event breakdown

- [ ] **Waitlist Count Card**
  - Display count
  - Click → Open modal with `/api/dashboard/waitlist` data
  - Modal shows: Waitlisted users by event

- [ ] **Occupancy Rate Card**
  - Display percentage
  - Click → Open modal with `/api/dashboard/occupancy` data
  - Modal shows: Occupancy per event

#### Recent Events List
- [ ] Show last 5 events
- [ ] Display: Title, date, status, capacity (X/Y)
- [ ] Click event → Navigate to `/admin/events/[id]`

#### Super Admin Button (Bug #12 fix)
- [ ] **Visible ONLY if `role === 'SUPER_ADMIN'`**
- [ ] Button text: "AdminProd"
- [ ] Click → Navigate to `/admin-prod`
- [ ] **NOT visible for:** OWNER, ADMIN, MANAGER, VIEWER

#### Responsive Tests
- [ ] **Mobile (375px)**
  - Stats cards: 2 columns grid
  - Card height: min 88px
  - Touch targets: 44px+
  - Recent events stack vertically

- [ ] **Tablet (768px)**
  - Stats cards: 3 columns grid
  - Recent events: 2 columns

- [ ] **Desktop (1024px+)**
  - Stats cards: 4 columns grid
  - Recent events: Table view

---

### 3.2 Events List (`/admin/events`)
**File:** `app/admin/events/page.tsx`

#### Page Load
**Endpoint:** `GET /api/events`

- [ ] Multi-tenant filter applied: Only show events where `schoolId === admin.schoolId`
- [ ] **Data isolation test (Bug #11 fix):**
  - Create events in School A
  - Login as School B admin
  - Should see 0 events (not School A's events)
- [ ] SUPER_ADMIN: Can see all events (optional school filter)

#### Event Cards - Mobile-Optimized (Bug #16 fix)
Each card must have:
- [ ] **Header (stacks mobile → row desktop)**
  - Event title: `text-lg sm:text-xl`
  - Status dropdown: `min-h-[44px]`
  - Responsive layout: `flex-col sm:flex-row`

- [ ] **Event Details (vertical list mobile)**
  - Calendar icon + date
  - MapPin icon + location
  - Users icon + capacity (X/Y)
  - Each row: `min-h-[40px]`

- [ ] **Action Buttons (wrap naturally)**
  - "ערוך וצפה בהרשמות" button
  - "צפה בקישור הציבורי" button
  - "העתק קישור" button
  - All buttons: `min-h-[44px]` with text + icon
  - Wrap to new line on mobile

- [ ] **Event Code Section**
  - Show slug on mobile
  - Show full URL on desktop (sm:block hidden)
  - Prevent horizontal overflow: `break-all`

#### Status Dropdown
**Endpoint:** `PATCH /api/events/[id]`

- [ ] **OPEN** → Green badge, accepting registrations
- [ ] **PAUSED** → Yellow badge, registration form hidden
- [ ] **CLOSED** → Red badge, registration form shows closed message
- [ ] Change status → Optimistic update + API call
- [ ] Error → Revert to previous status

#### Click Events
- [ ] **"ערוך וצפה בהרשמות" button** → Navigate to `/admin/events/[id]`
- [ ] **"צפה בקישור הציבורי" button** → Open `/p/[schoolSlug]/[eventSlug]` in new tab
- [ ] **"העתק קישור" button** → Copy to clipboard, show success toast

#### Create New Event Button
- [ ] Fixed position on scroll (or always visible)
- [ ] Navigate to `/admin/events/new`
- [ ] 44px+ height on mobile

#### Responsive Tests
- [ ] Mobile: All content stacks, no horizontal scroll
- [ ] Tablet: Some horizontal layout
- [ ] Desktop: Full horizontal layout with all info visible

---

### 3.3 Create Event Page (`/admin/events/new`)
**File:** `app/admin/events/new/page.tsx`

#### Multi-Step Wizard
**Steps:**
1. Details (פרטים) - Basic info
2. Timing (תזמון) - Dates/times
3. Capacity (מקומות) - Limits
4. Advanced (מתקדם) - Custom fields, conditions

#### Step Navigation
- [ ] **Step indicator** - Show current step (1/4)
- [ ] **Progress bar** - Visual completion
- [ ] **"הבא" button** → Validate current step, move to next
- [ ] **"הקודם" button** → Go back without losing data
- [ ] **Completed steps badge** - Visual indicator

#### Step 1: Details
- [ ] **Title input**
  - Required
  - Max 100 chars
  - Character counter
  - Focus on page load

- [ ] **Description textarea**
  - Optional
  - Max 500 chars
  - Character counter
  - RTL support

- [ ] **Game type input** (optional)
  - Text input
  - Examples shown

- [ ] **Location input**
  - Required
  - Text input
  - Hebrew address support

#### Step 2: Timing
- [ ] **Start date/time picker**
  - Required
  - DateTime component: `<DateTimePicker />`
  - Validation: Must be future date
  - Hebrew calendar support

- [ ] **End date/time picker** (optional)
  - DateTime component
  - Validation: Must be after start date

#### Step 3: Capacity
- [ ] **Capacity input** (type=number)
  - Required
  - Min: 1, Max: 10000
  - Default: 50

- [ ] **Max spots per person** (type=number)
  - Required
  - Min: 1, Max: capacity
  - Default: 1

#### Step 4: Advanced

**Custom Fields Builder:**
- [ ] **Add field button** → Open field config modal
- [ ] **Field types:** Text, Number, Dropdown, Checkbox
- [ ] **Field config:**
  - Field name (internal)
  - Field label (display)
  - Required toggle
  - Dropdown options (if type=dropdown)
- [ ] **Reorder fields** - Drag and drop
- [ ] **Delete field** - Confirmation required
- [ ] **Edit field** - Open config modal with existing data

**Default fields included:**
- Full Name (text, required)
- Phone Number (text, required)

**Conditions textarea:**
- [ ] Optional
- [ ] Max 500 chars
- [ ] RTL support
- [ ] Shown on registration form

**Require acceptance checkbox:**
- [ ] Toggle on/off
- [ ] If enabled, shows checkbox on registration form

**Completion message:**
- [ ] Optional
- [ ] Max 300 chars
- [ ] Shown after successful registration

#### Preview Button
- [ ] Open preview modal
- [ ] Shows event as users will see it
- [ ] All fields, capacity, custom fields
- [ ] Public URL preview

#### Draft Autosave (Bug fix feature)
- [ ] Save to localStorage every 10 seconds
- [ ] If draft exists on page load → Show modal
- [ ] Options: "Load draft" or "Discard"
- [ ] Last saved timestamp shown

#### Submit Tests
**Endpoint:** `POST /api/events`

- [ ] **Success**
  - Event created with unique slug (generated from title)
  - `schoolId` set from JWT session
  - `spotsReserved: 0` (atomic counter initialized)
  - Usage tracking: `trackUsage(schoolId, 'EVENT_CREATED', 1)`
  - Clear localStorage draft
  - Show success modal with:
    - Event title
    - Public URL
    - "View registrations" button → `/admin/events/[id]`
    - "Create another event" button → Stay on page, reset form

- [ ] **Validation errors**
  - Highlight invalid fields
  - Show error messages
  - Stay on relevant step

- [ ] **Plan limit exceeded** (Bug check)
  - If FREE plan: Max 3 events/month
  - Status 403
  - Error: "הגעת למגבלת האירועים החודשית"
  - Prompt to upgrade plan

- [ ] **Duplicate slug**
  - Server generates unique slug
  - Append number if needed: `event-title-2`

#### Responsive Tests
- [ ] Mobile: Single column, full width
- [ ] Step nav fixed at bottom
- [ ] All inputs 44px+ height
- [ ] DateTime picker mobile-friendly

---

### 3.4 Event Management Page (`/admin/events/[id]`)
**File:** `app/admin/events/[id]/page.tsx`

#### Page Load
**Endpoint:** `GET /api/events/[id]`

- [ ] Fetch event with registrations
- [ ] **Authorization check:**
  - If `admin.role !== 'SUPER_ADMIN'` AND `event.schoolId !== admin.schoolId`
  - Status 403 → Redirect to `/admin`
- [ ] Display event details
- [ ] Show registrations table

#### Event Header
- [ ] Event title
- [ ] Status badge (OPEN/PAUSED/CLOSED)
- [ ] Capacity: X/Y spots taken
- [ ] Progress bar (visual capacity indicator)

#### Status Dropdown
Same as Events List - change event status

#### Public Link Section
- [ ] Display full URL: `/p/[schoolSlug]/[eventSlug]`
- [ ] **"צפה בקישור" button** → Open in new tab
- [ ] **"העתק קישור" button** → Copy to clipboard
- [ ] **Copy feedback:** Checkmark icon for 2 seconds

#### Registrations Table

**Filter & Search:**
- [ ] **Search input** - Filter by name, email, phone
- [ ] **Status filter dropdown**
  - All (default)
  - CONFIRMED
  - WAITLIST
  - CANCELLED

**Table Columns (Desktop):**
- Confirmation code
- Status badge (color-coded)
- Name (from custom fields)
- Phone number (if collected)
- Email (if collected)
- Spots count
- Registration date
- Actions (Expand, Promote, Delete)

**Mobile View:**
- [ ] Card layout instead of table
- [ ] Tap to expand full details
- [ ] Action buttons stacked

**Row Actions:**
- [ ] **Expand/Collapse** - Show all custom field data
  - Toggle with ChevronDown/ChevronUp icon
  - Expanded row shows all fields from `fieldsSchema`

- [ ] **Promote to Confirmed** (if status === WAITLIST)
  - Button: "קידום למאושרים"
  - Confirmation modal
  - **Endpoint:** `PATCH /api/events/[id]/registrations/[registrationId]`
  - Update status to CONFIRMED
  - Increment `spotsReserved` atomically
  - Check capacity before promoting

- [ ] **Delete Registration**
  - Button: Trash icon
  - Confirmation: "האם למחוק הרשמה זו?"
  - **Endpoint:** `DELETE /api/events/[id]/registrations/[registrationId]`
  - If status was CONFIRMED → Decrement `spotsReserved`
  - Refresh table

#### Export CSV
- [ ] **"ייצא ל-CSV" button**
- [ ] **Endpoint:** `GET /api/events/[id]/export`
- [ ] Download CSV file with Hebrew encoding (UTF-8 BOM)
- [ ] Filename: `event_{slug}_registrations.csv`
- [ ] Columns: All custom fields + meta (status, spots, date)

#### Edit Event
- [ ] **"ערוך אירוע" button**
- [ ] Navigate to `/admin/events/[id]/edit`
- [ ] (If edit page exists, test separately)

#### Responsive Tests
- [ ] **Mobile (375px)**
  - Registrations as cards
  - Search bar full width
  - Filters stack vertically
  - Actions as dropdown menu per card
  - Touch targets 44px+

- [ ] **Tablet (768px)**
  - Table with horizontal scroll if needed
  - Fixed action column

- [ ] **Desktop (1024px+)**
  - Full table view
  - All columns visible
  - Hover effects on rows

---

### 3.5 Team Management (`/admin/team`)
**File:** `app/admin/team/page.tsx`

#### Authorization
- [ ] Only accessible to: OWNER, ADMIN, SUPER_ADMIN
- [ ] MANAGER, VIEWER → Redirect with error

#### Page Load
**Endpoint:** `GET /api/admin/team/invitations`

- [ ] Fetch all team invitations for current school
- [ ] Show: Pending, Accepted, Expired, Revoked
- [ ] Group by status

#### Invite New Member
- [ ] **"הזמן חבר צוות" button** → Show invite form modal

**Invite Form:**
- [ ] **Email input** - Required, validation
- [ ] **Role dropdown** - Select role
  - Options: ADMIN, MANAGER, VIEWER
  - OWNER role cannot be assigned via invite
- [ ] **Submit button**

**Endpoint:** `POST /api/admin/team/invitations`

- [ ] **Success**
  - Invitation created with:
    - Unique token (UUID)
    - `expiresAt`: 7 days from now
    - Status: PENDING
  - Email sent with invite link
  - Refresh invitations list
  - Success message: "Invitation sent to {email}"

- [ ] **Email already has pending invite**
  - Status 409
  - Error shown

- [ ] **Email already member of school**
  - Status 409
  - Error shown

#### Invitations Table
**Columns:**
- Email
- Role
- Status (badge)
- Invited by (name)
- Created date
- Expires date
- Actions

**Actions:**
- [ ] **Resend invitation** (if status === PENDING)
  - Send new email with same token
  - Update `expiresAt` (+7 days)

- [ ] **Revoke invitation** (if status === PENDING)
  - Confirmation: "Are you sure?"
  - **Endpoint:** `DELETE /api/admin/team/invitations/[id]`
  - Update status to REVOKED
  - Invitation link no longer works

#### Accept Invitation Flow
**Page:** `/admin/accept-invitation?token={token}`

- [ ] **Token validation**
  - Check expiration
  - Check status === PENDING

- [ ] **If user not logged in:**
  - Show signup/login options
  - After auth, resume acceptance

- [ ] **If user logged in:**
  - Show invitation details: School name, role
  - "Accept" and "Decline" buttons

**Endpoint:** `POST /api/team/accept-invitation`

- [ ] **Accept**
  - Update invitation status to ACCEPTED
  - Add user to school with specified role
  - Update user's `schoolId`
  - Redirect to `/admin`

- [ ] **Decline**
  - Update status to REVOKED
  - Redirect to `/admin/login`

---

### 3.6 Settings Page (`/admin/settings`)
**File:** `app/admin/settings/page.tsx`

#### Profile Section
- [ ] Display: Name, Email, Role
- [ ] **Change name** - Edit and save
- [ ] **Change password** - Current password + new password
- [ ] **Link Google account** (if not linked)

#### School Settings (OWNER only)
- [ ] **School name** - Edit and save
- [ ] **School slug** - Show current, warn if changing (breaks URLs)
- [ ] **Logo upload** - Upload image, preview
- [ ] **Primary color** - Color picker

#### Plan & Billing (OWNER only)
- [ ] Current plan display
- [ ] Usage stats:
  - Events this month / Limit
  - Registrations this month / Limit
  - Progress bars
- [ ] **Upgrade plan button** (if not ENTERPRISE)

#### Danger Zone (OWNER only)
- [ ] **Delete school** - Requires confirmation, password entry

---

## 4. Super Admin Features

### 4.1 Super Admin Dashboard (`/admin/super`)
**File:** `app/admin/super/page.tsx`

#### Authorization
- [ ] **CRITICAL:** Only accessible if `role === 'SUPER_ADMIN'`
- [ ] Middleware check
- [ ] Client-side check
- [ ] API checks in all endpoints
- [ ] If not SUPER_ADMIN → Redirect to `/admin` with 403

#### Statistics Cards
**Endpoint:** `GET /api/admin/super/overview`

- [ ] **Total Schools** - Count of all schools
- [ ] **Total Events** - All events across all schools
- [ ] **Total Registrations** - All registrations
- [ ] **Active Events** - Events with status = OPEN

#### Tabs
- [ ] **Events Tab** (default)
- [ ] **Admins Tab**
- [ ] **Schools Tab**

### Tab 1: Events (Cross-School)
**Endpoint:** `GET /api/admin/super/overview` (events array)

**Table Columns:**
- Event title
- School name
- School slug
- Start date
- Status
- Capacity: X/Y
- Registrations count
- Waitlist count

**Filters:**
- [ ] **Search** - By event title or school name
- [ ] **School dropdown** - Filter by specific school (or "All")
- [ ] **Status dropdown** - OPEN, PAUSED, CLOSED, All
- [ ] **Sort** - By registrations count (high to low)

**Actions:**
- [ ] Click event → Navigate to `/admin/events/[id]` (can view any school's event)

### Tab 2: Admins
**Endpoint:** `GET /api/admin/super/admins`

**Table Columns:**
- Email
- Name
- Role
- School name (or "No school")
- Email verified (✓/✗)
- Active status (✓/✗)
- Last login date
- Created date
- Actions

**Actions:**
- [ ] **View admin details** - Modal with full info
- [ ] **Deactivate admin** - Set `isActive: false`
- [ ] **Delete admin** - Confirmation required
  - **Endpoint:** `DELETE /api/admin/super/admins/[id]`

**Filters:**
- [ ] Search by email or name
- [ ] Filter by role
- [ ] Filter by school
- [ ] Filter by verification status

### Tab 3: Schools
**Endpoint:** `GET /api/admin/super/schools`

**Table Columns:**
- School name
- Slug
- Plan (FREE, STARTER, PRO, ENTERPRISE)
- Status (ACTIVE, TRIAL, PAUSED, CANCELED)
- Event count
- Admin count
- Created date
- Actions

**Expandable Row:**
- [ ] Click to expand
- [ ] Show all admins in school
- [ ] Show recent events
- [ ] Show usage stats

**Actions:**
- [ ] **View school details** - Full modal
- [ ] **Deactivate school** - Set `isActive: false`
- [ ] **Change plan** - Dropdown to upgrade/downgrade
- [ ] **Delete school** - Confirmation, cascade delete events/admins

---

### 4.2 AdminProd Page (`/admin-prod`)
**File:** `app/admin-prod/page.tsx`

**Note:** Legacy admin panel, likely for direct database access.

#### Authorization
- [ ] SUPER_ADMIN only (same as `/admin/super`)

#### Features (if implemented)
- [ ] View all database tables
- [ ] Run raw SQL queries
- [ ] View logs
- [ ] Database health checks

---

### 4.3 Feedback Management (`/admin/feedback`)
**File:** `app/admin/feedback/page.tsx`

#### Authorization (Bug #15 fix)
- [ ] **Visible ONLY to SUPER_ADMIN**
- [ ] Navigation link hidden for non-super admins
- [ ] Client-side redirect if not SUPER_ADMIN
- [ ] API endpoints protected with `requireSuperAdmin()`

#### Page Load
**Endpoint:** `GET /api/admin/feedback`

- [ ] Fetch all feedback entries
- [ ] Check role === SUPER_ADMIN
  - If true: Load feedback
  - If false: Redirect to `/admin` with error

#### Feedback Table
**Columns:**
- Feedback message
- Email (if provided)
- Status: PENDING, REVIEWED, RESOLVED, DISMISSED
- Created date
- Actions

**Actions:**
- [ ] **Update status**
  - **Endpoint:** `PATCH /api/admin/feedback/[id]`
  - Dropdown: PENDING → REVIEWED → RESOLVED
  - Add admin notes

- [ ] **Delete feedback**
  - **Endpoint:** `DELETE /api/admin/feedback/[id]`
  - Confirmation required

#### Visual Indicators
- [ ] **"Super Admin Only" badge** - Purple badge on header
- [ ] **Shield icon** - During authorization check loading

---

## 5. Mobile & Responsive Tests

### 5.1 Viewports to Test
- [ ] **Mobile - iPhone SE:** 375px x 667px
- [ ] **Mobile - iPhone 12 Pro:** 390px x 844px
- [ ] **Tablet - iPad:** 768px x 1024px
- [ ] **Desktop - Small:** 1024px x 768px
- [ ] **Desktop - Large:** 1920px x 1080px

### 5.2 General Mobile Requirements
All pages must meet:
- [ ] **Touch targets:** Min 44px height (iOS accessibility)
- [ ] **Text size:** Min 16px for body text (prevents zoom on iOS)
- [ ] **Input fields:** Always `text-gray-900 bg-white` (Bug #18 fix)
- [ ] **Horizontal scroll:** Never (except intentional carousels)
- [ ] **RTL support:** Hebrew text right-aligned
- [ ] **Viewport meta tag:** `width=device-width, initial-scale=1`

### 5.3 Navigation Menu (Mobile)
**File:** `app/admin/layout.tsx`

- [ ] **Hamburger icon** - Visible on mobile (< 768px)
- [ ] **Click to open** - Slide-in menu from right (RTL)
- [ ] **Menu items:**
  - ראשי (Home)
  - אירועים (Events)
  - צוות (Team) - If authorized
  - הגדרות (Settings)
  - עזרה (Help)
  - יציאה (Logout)
  - משובים (Feedback) - SUPER_ADMIN only
  - Super Admin - SUPER_ADMIN only

- [ ] **Close menu:**
  - Click outside → Close
  - Click menu item → Navigate and close
  - Swipe right → Close

- [ ] **Backdrop** - Semi-transparent overlay when open

### 5.4 Form Inputs (Mobile)
All forms must test:
- [ ] **Labels visible** - Not overlapping input
- [ ] **Input height** - Min 44px
- [ ] **Font size** - Min 16px (prevents zoom)
- [ ] **Autofocus** - Not on mobile (causes scroll issues)
- [ ] **Autocomplete** - Appropriate attributes set
- [ ] **Keyboard type:**
  - Email inputs → `type="email"`
  - Phone inputs → `type="tel"`
  - Number inputs → `type="number"` with pattern
- [ ] **iOS styling:** `-webkit-appearance: none` for selects

### 5.5 Tables (Mobile)
Desktop tables → Mobile cards:
- [ ] **Events list** - Each event as card
- [ ] **Registrations** - Each registration as card
- [ ] **Team invitations** - Card layout
- [ ] **Expandable details** - Tap to show more
- [ ] **Actions** - Visible and tappable

### 5.6 Modals (Mobile)
- [ ] **Full screen on mobile** - Or near full-screen
- [ ] **Close button** - Top-right, 44px+ tap area
- [ ] **Backdrop** - Tap to close (with confirmation if form dirty)
- [ ] **Scroll** - Modal content scrollable if taller than viewport
- [ ] **iOS safe areas** - Padding for notch

### 5.7 Landscape Mode
- [ ] All pages usable in landscape
- [ ] Navigation still accessible
- [ ] Forms don't break
- [ ] Modals still fit

---

## 6. Edge Cases & Error Scenarios

### 6.1 Network Errors
- [ ] **API request fails** - Show error toast, retry button
- [ ] **Timeout** - After 30 seconds, show timeout message
- [ ] **Offline** - Detect and show offline banner
- [ ] **Reconnect** - Auto-retry when back online

### 6.2 Session Expiration
- [ ] **JWT expired** (after 7 days)
  - Middleware returns 401
  - Redirect to `/admin/login`
  - Show message: "Session expired, please login again"
- [ ] **Cookie deleted** - Same as expired
- [ ] **Invalid JWT signature** - Clear cookie, redirect to login

### 6.3 Concurrent Registration (Race Condition)
**Critical Test for Atomic Capacity:**

Setup:
- Create event with capacity = 10
- 9 spots already taken (spotsReserved = 9)

Test:
- [ ] **Simulate 5 concurrent registration requests** (last available spot)
  - Use Promise.all with 5 fetch requests
  - All submit at exact same time
  - Only 1 should get CONFIRMED
  - Other 4 should get WAITLIST
  - `spotsReserved` should be exactly 10 (not 14)

**Verification:**
- Database transaction must be atomic
- `spotsReserved` incremented with `{ increment: 1 }` in transaction
- No race condition

### 6.4 Invalid Data
- [ ] **SQL Injection** - Sanitize all inputs
  - Try: `'; DROP TABLE events; --` in text fields
  - Should be escaped/sanitized
- [ ] **XSS Attacks** - Escape HTML in user content
  - Try: `<script>alert('XSS')</script>` in event description
  - Should be rendered as text, not executed
- [ ] **Path Traversal** - Validate slugs
  - Try: `../../../etc/passwd` as event slug
  - Should be rejected

### 6.5 Browser Compatibility
- [ ] **Chrome** (latest)
- [ ] **Safari** (latest, iOS Safari)
- [ ] **Firefox** (latest)
- [ ] **Edge** (latest)
- [ ] **Old browsers** - Show "unsupported browser" message

### 6.6 Slow Network (3G)
- [ ] All pages load within 10 seconds
- [ ] Loading indicators shown
- [ ] Critical content prioritized
- [ ] Images lazy-loaded

### 6.7 Large Data Sets
- [ ] **Event with 1000+ registrations**
  - Table pagination works
  - Search/filter responsive
  - Export CSV succeeds
- [ ] **Admin with 100+ events**
  - Events list paginated or virtualized
  - Dashboard stats accurate

### 6.8 Date/Time Edge Cases
- [ ] **Timezone handling** - All dates in UTC
- [ ] **Daylight saving time** - Consistent behavior
- [ ] **Hebrew calendar dates** - Display correctly
- [ ] **Past events** - Still visible in admin, but registration closed
- [ ] **Leap year** - Feb 29 handled correctly

### 6.9 Empty States
- [ ] **New school, no events** - Show onboarding message
- [ ] **Event with no registrations** - Show "No registrations yet"
- [ ] **No team members** - Prompt to invite first member
- [ ] **Search returns 0 results** - "No results found"

---

## 7. Multi-Tenant Isolation Tests

**CRITICAL SECURITY TESTS**

### 7.1 Data Isolation Verification
Setup:
- School A: `schoolId: 'school-a-id'`
- School B: `schoolId: 'school-b-id'`
- Admin A: `schoolId: 'school-a-id'`, `role: 'ADMIN'`
- Admin B: `schoolId: 'school-b-id'`, `role: 'ADMIN'`

**Events Isolation:**
- [ ] School A creates Event X
- [ ] School B creates Event Y
- [ ] Admin A logs in
  - GET `/api/events` → Should return only Event X
  - GET `/api/events/event-y-id` → Should return 403
- [ ] Admin B logs in
  - GET `/api/events` → Should return only Event Y
  - GET `/api/events/event-x-id` → Should return 403

**Registrations Isolation:**
- [ ] User registers for Event X (School A)
- [ ] Admin A can see registration
- [ ] Admin B **cannot** see registration
- [ ] Direct API call: GET `/api/events/event-x-id` as Admin B → 403

**Dashboard Isolation:**
- [ ] Admin A dashboard stats → Only School A data
- [ ] Admin B dashboard stats → Only School B data

### 7.2 Session Tampering Tests (Bug #2 fix)
- [ ] **JWT signature validation**
  - Modify JWT payload (change `schoolId`)
  - Send request with tampered JWT
  - Expected: 401 Unauthorized, session invalid

- [ ] **Role escalation attempt**
  - Modify JWT: `role: 'ADMIN'` → `role: 'SUPER_ADMIN'`
  - Expected: 401 Unauthorized, signature mismatch

### 7.3 Admin Without schoolId (Bug #11 fix)
- [ ] Create admin with `schoolId: null`
- [ ] Login as this admin
- [ ] Attempt to access `/api/events`
- [ ] Expected:
  - Status 403
  - Error: "Admin must have a school assigned"
  - **NOT:** Return all events from all schools

### 7.4 SUPER_ADMIN Access
- [ ] SUPER_ADMIN can:
  - View all schools' events
  - View all schools' registrations
  - Access any `/api/events/[id]` regardless of schoolId
  - Access `/admin/super` dashboard
  - Access `/admin/feedback`

- [ ] SUPER_ADMIN cannot (without explicit school context):
  - Should not accidentally modify other schools' data
  - Must select school explicitly in UI

### 7.5 School Switching (if feature exists)
- [ ] Admin belongs to multiple schools
- [ ] Switch active school in UI
- [ ] Session updated with new `schoolId`
- [ ] All API calls filtered by new school
- [ ] Cannot see previous school's data

---

## 8. Performance & Load Tests

### 8.1 Page Load Performance
Target: Under 3 seconds on 3G

- [ ] **Landing page** - Initial load
- [ ] **Admin dashboard** - After login
- [ ] **Event registration page** - Public form
- [ ] **Event management** - With 100+ registrations

### 8.2 API Response Times
Target: Under 500ms

- [ ] `GET /api/events` - Under 200ms
- [ ] `GET /api/events/[id]` - Under 300ms (with registrations)
- [ ] `POST /api/p/[schoolSlug]/[eventSlug]/register` - Under 500ms
- [ ] `GET /api/dashboard/stats` - Under 200ms

### 8.3 Concurrent Users
- [ ] **10 concurrent registrations** - All succeed or waitlist correctly
- [ ] **50 concurrent dashboard loads** - No errors
- [ ] **100 concurrent event views** - No performance degradation

### 8.4 Database Query Optimization
- [ ] All queries use indexes
- [ ] N+1 query issues resolved
- [ ] Pagination implemented for large datasets
- [ ] Database connection pooling configured

### 8.5 Client-Side Performance
- [ ] **Lighthouse score** - 90+ for all pages
- [ ] **First Contentful Paint** - Under 1.5s
- [ ] **Time to Interactive** - Under 3s
- [ ] **No console errors** - Clean console on all pages

---

## Test Execution Strategy

### Phase 1: Critical Path (Priority 1)
1. User registration flow (public)
2. Admin login flow
3. Event creation
4. Multi-tenant data isolation
5. Mobile registration form

### Phase 2: Admin Features (Priority 2)
6. Dashboard and stats
7. Event management (view registrations)
8. Team invitations
9. Role-based access

### Phase 3: Edge Cases (Priority 3)
10. Concurrent registrations (race conditions)
11. Session expiration
12. Error handling
13. Browser compatibility

### Phase 4: Non-Functional (Priority 4)
14. Performance tests
15. Load tests
16. Accessibility (WCAG)
17. SEO validation

---

## Test Data Setup

### Schools
```typescript
const testSchools = [
  { name: 'School A', slug: 'school-a', plan: 'FREE' },
  { name: 'School B', slug: 'school-b', plan: 'PRO' },
  { name: 'School C', slug: 'school-c', plan: 'ENTERPRISE' },
]
```

### Admins
```typescript
const testAdmins = [
  { email: 'admin-a@test.com', password: 'Test1234', role: 'ADMIN', schoolId: 'school-a' },
  { email: 'admin-b@test.com', password: 'Test1234', role: 'ADMIN', schoolId: 'school-b' },
  { email: 'super@test.com', password: 'Test1234', role: 'SUPER_ADMIN', schoolId: null },
]
```

### Events
```typescript
const testEvents = [
  {
    title: 'Soccer Game - Finals',
    schoolId: 'school-a',
    capacity: 50,
    startAt: futureDate,
    status: 'OPEN',
  },
  {
    title: 'Basketball Tournament',
    schoolId: 'school-b',
    capacity: 100,
    startAt: futureDate,
    status: 'OPEN',
  },
]
```

---

## Automation Tools & Framework

### Recommended Stack
- **Framework:** Playwright (already configured)
- **Assertion Library:** Expect (Playwright built-in)
- **Test Runner:** Playwright Test
- **Reporting:** Playwright HTML Reporter
- **CI/CD:** GitHub Actions

### Test Organization
```
/tests
  /auth
    - login.spec.ts
    - signup.spec.ts
    - oauth.spec.ts
    - password-reset.spec.ts
  /public
    - landing.spec.ts
    - event-registration.spec.ts
    - event-not-found.spec.ts
  /admin
    /dashboard
      - stats.spec.ts
      - drilldown-modals.spec.ts
    /events
      - events-list.spec.ts
      - event-creation.spec.ts
      - event-management.spec.ts
      - registrations.spec.ts
    /team
      - invitations.spec.ts
  /super-admin
    - super-dashboard.spec.ts
    - feedback.spec.ts
  /mobile
    - registration-mobile.spec.ts
    - admin-mobile-nav.spec.ts
  /security
    - multi-tenant-isolation.spec.ts
    - session-tampering.spec.ts
    - role-based-access.spec.ts
  /performance
    - load-times.spec.ts
    - concurrent-registrations.spec.ts
```

### Utilities
```typescript
// /tests/helpers/auth.ts
export async function loginAsAdmin(page, email, password) { ... }
export async function loginAsSuperAdmin(page) { ... }

// /tests/helpers/test-data.ts
export async function createTestSchool() { ... }
export async function createTestEvent(schoolId) { ... }

// /tests/helpers/api.ts
export async function makeAuthenticatedRequest(endpoint, options) { ... }
```

---

## Success Criteria

✅ **All tests pass** - 100% pass rate
✅ **Code coverage** - Minimum 80% for critical paths
✅ **Performance** - All pages load under 3s on 3G
✅ **Mobile compatibility** - All features work on 375px viewport
✅ **Security** - Multi-tenant isolation verified
✅ **Accessibility** - WCAG AA compliance
✅ **Browser support** - Latest Chrome, Safari, Firefox, Edge

---

**Document Version:** 1.0
**Last Updated:** 2025-11-11
**Owner:** Test Automation Team
