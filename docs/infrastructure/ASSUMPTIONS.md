# System Assumptions

**Last Updated:** 2025-12-18
**Version:** 1.0
**Maintainer:** TicketCap Development Team

## Purpose

This document captures **implicit system behaviors** that developers depend on but aren't explicitly documented elsewhere. Understanding these assumptions prevents bugs, enables safe refactoring, and accelerates onboarding.

**When assumptions change**, update this document AND add behavior lock tests to prevent regressions.

---

## Table of Contents

1. [API Behavior](#api-behavior)
2. [Security & Permissions](#security--permissions)
3. [Data Integrity](#data-integrity)
4. [UI/UX Patterns](#uiux-patterns)
5. [Business Logic](#business-logic)
6. [Infrastructure](#infrastructure)
7. [When to Update This Document](#when-to-update-this-document)
8. [Related Documentation](#related-documentation)

---

## API Behavior

### Default Sort Orders

**Events:**
- **Default:** `createdAt DESC` (newest first) when listing all events
- **Public pages:** Implicit chronological order by `startAt ASC` (upcoming events first)
- **Example:**
  ```typescript
  // In /api/events/route.ts
  const events = await prisma.event.findMany({
    orderBy: { createdAt: 'desc' }
  })
  ```

**Registrations:**
- **Default:** `createdAt DESC` (newest first) in admin views
- **Waitlist:** Ordered by `waitlistPriority ASC` (lower number = higher priority)
- **Example:**
  ```typescript
  // In /api/events/[id]/export/route.ts
  orderBy: { createdAt: 'desc' }
  ```

**Tables:**
- **Admin view:** `tableOrder ASC` (custom sort set by admin)
- **Public registration:** `tableOrder ASC` then smallest-fit algorithm applied
- **Smallest-fit algorithm:** When assigning tables, system finds smallest available table that fits guest count

**Admins:**
- **Default:** No explicit sort (database insertion order)
- **Team list:** Typically displayed by role hierarchy

---

### Pagination

**Default Behavior:**
- **No built-in pagination** for most endpoints (returns all results)
- **Admin prod endpoints** limit to 100 records for performance
- **Example:**
  ```typescript
  // In /api/admin-prod/table-data/route.ts
  take: 100 // Limit to 100 records for performance
  ```

**Future Implementation:**
- When adding pagination, use `take` (page size) and `skip` (offset)
- Recommended default: 20 items per page for lists, 50 for exports

---

### Response Formats

**Success Responses:**
```typescript
// Standard success format
{
  success: true,
  data: { ... },
  message?: "Optional success message" // Hebrew for user-facing messages
}
```

**Error Responses:**
```typescript
// Standard error format
{
  error: "User-friendly error message in Hebrew",
  details?: "Technical details (dev only)"
}
```

**HTTP Status Codes:**
- `200` - Success
- `201` - Created (rarely used, usually return 200)
- `400` - Bad request (validation errors, missing fields)
- `401` - Unauthorized (not logged in)
- `403` - Forbidden (insufficient permissions, multi-tenant violation)
- `404` - Not found (resource doesn't exist)
- `500` - Internal server error (unexpected failures)

---

### Soft Delete Behavior

**Current Implementation:**
- **NO soft deletes** - all deletions are permanent
- Schools, events, registrations, admins are hard deleted
- **Exception:** Registration `status` field acts like soft delete:
  - `CONFIRMED` → `CANCELLED` (preserves data, changes status)
  - Cancelled registrations remain in database for reporting

**Cascade Deletes:**
- School deleted → All events, admins, invitations cascade delete
- Event deleted → All registrations, tables cascade delete
- Admin deleted → All sent invitations cascade delete
- Table deleted → Registration `assignedTable` set to NULL

---

### Timestamp Handling

**Storage:**
- All timestamps stored in **UTC** in PostgreSQL
- Prisma `DateTime` fields default to `@default(now())` in UTC

**Display:**
- **Client-side conversion required** for Hebrew/Israeli timezone display
- **No automatic timezone conversion** in API responses
- Example:
  ```typescript
  // Client must format for display
  const localTime = new Date(event.startAt).toLocaleString('he-IL', {
    timeZone: 'Asia/Jerusalem'
  })
  ```

---

### Error Handling Pattern

**Standard Pattern:**
```typescript
try {
  // ... operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'הפעולה נכשלה. נסה שוב מאוחר יותר' },
    { status: 500 }
  )
}
```

**Usage Tracking Errors:**
- Usage tracking failures are **logged but not thrown**
- Prevents usage tracking from breaking core flows
- Example in `/lib/usage.ts`:
  ```typescript
  catch (error) {
    console.error('Failed to track usage:', error)
    // Don't throw - usage tracking should not break the main flow
  }
  ```

---

## Security & Permissions

### Multi-Tenant Isolation

**Automatic schoolId Filtering:**
- **Non-SuperAdmin:** `schoolId` is **always** applied to queries
- **SuperAdmin:** Can access all schools (no filter applied)
- **Critical Rule:** Non-SuperAdmin **MUST** have `schoolId` assigned (runtime guard enforced)

**Runtime Guards:**
```typescript
// From /lib/auth.server.ts - requireSchoolAccess()
if (admin.role !== 'SUPER_ADMIN') {
  // GUARD: Non-SuperAdmin MUST have schoolId
  if (!admin.schoolId) {
    throw new Error('Data isolation violation: Admin missing schoolId')
  }

  // GUARD: Can only access their own school
  if (admin.schoolId !== requestedSchoolId) {
    throw new Error('Forbidden: No access to this school')
  }
}
```

**Where This Applies:**
- Event queries (filter by `schoolId`)
- Registration queries (via event's `schoolId`)
- Admin queries (filter by `schoolId`)
- Usage records (filter by `schoolId`)

---

### SuperAdmin Bypass Rules

**SuperAdmin Can:**
- Access **all schools** without schoolId filter
- View/edit events from any school
- View/manage admins from any school
- Access `/api/admin/super/*` endpoints
- Access Feedback model (SUPER_ADMIN only feature)

**SuperAdmin Cannot:**
- Bypass feature limits (still subject to plan checks in some flows)
- Delete production data without user permission (per CLAUDE.md rules)

---

### Session Management

**Session Duration:**
- **7 days** from login
- No automatic renewal (user must re-login after expiration)
- Defined in `/lib/auth.server.ts`:
  ```typescript
  const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
  ```

**Session Storage:**
- HTTP-only cookie named `admin_session`
- JWT signed with HS256 algorithm
- Secret: `JWT_SECRET` environment variable (REQUIRED, min 32 chars)

**Session Validation:**
- **Middleware:** Uses `jose` library (Edge Runtime compatible) at `/middleware.ts`
- **Server Actions:** Uses `jsonwebtoken` library at `/lib/auth.server.ts`
- Session verified on **every protected route** request

**Session Updates:**
- **Must update** when `schoolId` changes (e.g., after onboarding)
- Use `encodeSession()` and set on `NextResponse` object for redirects
- Example:
  ```typescript
  const response = NextResponse.redirect(url)
  response.cookies.set('admin_session', encodeSession(session), {...})
  ```

---

### Password Requirements

**Current Requirements:**
- **Minimum 8 characters** (enforced client-side only)
- No complexity requirements (uppercase, symbols, etc.)
- Hashed with bcrypt before storage (10 rounds)

**OAuth Users:**
- `passwordHash` field is **NULL** for OAuth-only users
- Can add password later (allows both OAuth + password login)

---

### Email Verification

**Verification Required:**
- Email verification **required** for email/password signups
- OAuth users bypass verification (`emailVerified: true` set automatically)

**Verification Flow:**
1. User signs up → `emailVerified: false`, `verificationToken` generated
2. Email sent with verification link
3. User clicks link → `emailVerified: true`, `verificationToken` cleared
4. User can now login

**Token Expiration:**
- **No explicit expiration** on verification tokens (TODO: should add)
- Tokens are single-use (cleared after verification)

---

### Hard Delete Restrictions

**Cannot Delete:**
- Events with confirmed registrations (soft close instead: `status: 'CLOSED'`)
- Tables with reservations (must cancel registration first)
- Schools with active subscriptions (must cancel subscription first)

**Protected by:**
- Client-side UI disables delete buttons
- Server-side validation checks (TODO: add explicit guards)

---

## Data Integrity

### Immutable Fields

**After Creation, These CANNOT Change:**

**School:**
- `id` (CUID, generated once)
- `slug` (unique identifier for public URLs, set once)

**Event:**
- `id` (CUID)
- `slug` (unique per school, set once)
- **Can change:** All other fields including `capacity`, `startAt`, etc.

**Registration:**
- `id` (CUID)
- `confirmationCode` (6-char unique code, generated once)
- `cancellationToken` (unique token for self-service cancellation)

**Admin:**
- `id` (CUID)
- `email` (unique, but can be updated via profile edit - TODO: should email be immutable?)

**Table:**
- `id` (CUID)

---

### Required Fields

**School (Minimum Viable):**
```typescript
{
  name: string,           // Required, display name
  slug: string,           // Required, unique globally
  plan: SubscriptionPlan  // Defaults to FREE
}
```

**Event (Minimum Viable):**
```typescript
{
  title: string,      // Required
  schoolId: string,   // Required (FK to School)
  slug: string,       // Required, unique per school
  startAt: DateTime,  // Required
  capacity: number,   // Required (capacity-based) or 0 (table-based)
  eventType: EventType // Defaults to CAPACITY_BASED
}
```

**Registration (Minimum Viable):**
```typescript
{
  eventId: string,          // Required (FK to Event)
  data: Json,               // Required, stores form field values
  spotsCount: number,       // Defaults to 1
  status: RegistrationStatus, // Defaults to CONFIRMED
  confirmationCode: string,  // Auto-generated (6 chars, uppercase)
  phoneNumber: string?       // Optional (made nullable for production data compatibility)
}
```

**Admin (Minimum Viable):**
```typescript
{
  email: string,         // Required, unique
  name: string,          // Required
  role: AdminRole,       // Defaults to SCHOOL_ADMIN
  passwordHash: string?, // Nullable for OAuth users
  schoolId: string?      // Nullable only for SUPER_ADMIN
}
```

---

### Foreign Key Constraints

**Cascade Deletes:**
- `School.id` → `Event.schoolId` (ON DELETE CASCADE)
- `School.id` → `Admin.schoolId` (ON DELETE CASCADE)
- `School.id` → `TeamInvitation.schoolId` (ON DELETE CASCADE)
- `School.id` → `UsageRecord.schoolId` (ON DELETE CASCADE)
- `Event.id` → `Registration.eventId` (ON DELETE CASCADE)
- `Event.id` → `Table.eventId` (ON DELETE CASCADE)
- `Admin.id` → `TeamInvitation.invitedById` (ON DELETE CASCADE)

**Set Null on Delete:**
- `Registration.id` → `Table.reservedById` (ON DELETE SET NULL)
  - When registration deleted, table becomes available again

**Prevents Orphan Data:**
- Deleting a school removes all its events, admins, invitations, usage records
- Deleting an event removes all registrations and tables
- Cannot delete referenced records (e.g., can't delete event if registrations exist - soft close instead)

---

### Unique Constraints

**Global Uniqueness:**
- `School.slug` - Must be unique across all schools (public URL identifier)
- `Admin.email` - Must be unique across all admins
- `Registration.confirmationCode` - Must be unique globally
- `Registration.cancellationToken` - Must be unique globally

**School-Scoped Uniqueness:**
- `Event.slug` - Unique per school (enforced by schema unique constraint)

**Composite Uniqueness:**
- `UsageRecord(schoolId, resourceType, year, month)` - One usage record per resource per month per school
- `TeamInvitation(email, schoolId)` - One pending invitation per email per school

---

### Atomic Operations

**Capacity Enforcement (Race Condition Prevention):**
```typescript
// CRITICAL: Use transaction + atomic increment
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id: eventId } })

  if (event.spotsReserved + spotsCount > event.capacity) {
    status = 'WAITLIST'
  } else {
    // Atomic increment prevents double-booking
    await tx.event.update({
      where: { id: eventId },
      data: { spotsReserved: { increment: spotsCount } }
    })
    status = 'CONFIRMED'
  }

  const registration = await tx.registration.create({...})
  return { registration, status }
})
```

**Why Atomic:**
- Multiple users registering simultaneously
- Without transaction: both check capacity (10/20), both create registrations → 22/20 (overbooked)
- With transaction: first increments to 11, second sees 11 and gets waitlisted

---

### Usage Tracking Atomicity

**Usage records use UPSERT:**
```typescript
// Atomic increment for monthly usage counters
await prisma.usageRecord.upsert({
  where: {
    schoolId_resourceType_year_month: {
      schoolId, resourceType, year, month
    }
  },
  update: {
    amount: { increment: amount } // Atomic
  },
  create: {
    schoolId, resourceType, year, month, amount
  }
})
```

**Prevents:**
- Lost updates when tracking usage concurrently
- Ensures accurate usage counts for plan limits

---

## UI/UX Patterns

### Mobile-First Design

**Minimum Width:**
- **375px** - iPhone SE minimum supported width
- All forms, tables, modals must work at this width

**Responsive Breakpoints:**
- `sm:` 640px - Small tablets
- `md:` 768px - Tablets
- `lg:` 1024px - Desktop
- `xl:` 1280px - Large desktop

**Testing Requirement:**
- All UI changes **must** run mobile tests: `npm run test:mobile`

---

### Touch Target Sizes

**iOS Accessibility Standard:**
- **Minimum 44px height** for all interactive elements
- Applies to: buttons, links, form inputs, checkboxes, radio buttons

**Implementation:**
```tsx
// Correct
<button className="min-h-[44px] px-4 py-2">Submit</button>

// Incorrect
<button className="h-8 px-2 py-1">Submit</button> // Too small!
```

**Examples from codebase:**
```tsx
// ShareLinkCard buttons
className="min-h-[44px] min-w-[44px]"

// Form inputs
className="min-h-[44px]"
```

---

### RTL (Right-to-Left) Layout

**Hebrew Interface:**
- Main admin interface uses `dir="rtl"`
- Flex layouts reverse: `flex-row-reverse`, `justify-end` becomes left-aligned
- Text alignment: `text-right` by default for Hebrew text

**Examples:**
```tsx
// Correct RTL button group
<div className="flex gap-2 flex-row-reverse">
  <button>ביטול</button>
  <button>שמירה</button>
</div>
```

**English Content in RTL:**
- Confirmation codes, emails, phone numbers remain LTR
- Use `dir="ltr"` for English-only content blocks

---

### Color Contrast Requirements

**WCAG 2.1 AA Compliance:**
- Text: 4.5:1 contrast ratio minimum
- Large text (18pt+): 3:1 contrast ratio minimum

**Common Patterns:**
- Primary buttons: White text on `bg-blue-600`
- Secondary buttons: `text-gray-700` on `bg-gray-100`
- Input fields: `text-gray-900` on `bg-white` (prevents white-on-white)

---

### Input Field Styling (Mobile Critical)

**Prevents White-on-White Issue:**
```tsx
// ALWAYS include these classes on inputs
<input
  className="text-gray-900 bg-white border border-gray-300"
/>
```

**Why:**
- iOS Safari defaults to white text in dark mode
- Without explicit `text-gray-900`, text invisible on white background

---

### Form Validation Patterns

**Client-Side Validation:**
1. Use `getMissingFields()` helper to check required fields
2. Show missing fields in **red notification box** above submit button
3. **Disable submit button** when form invalid
4. Update button text when disabled: `"נא למלא את כל השדות החובה"` (Hebrew)

**Example:**
```typescript
const missingFields = getMissingFields(formData, requiredFields)
if (missingFields.length > 0) {
  setNotification({
    type: 'error',
    message: `שדות חסרים: ${missingFields.join(', ')}`
  })
  return
}
```

**Server-Side Validation:**
- **ALWAYS validate** even if client validates
- Check required fields, format (email, phone), length limits
- Return 400 status with Hebrew error message

---

### Error Message Display

**User-Facing Errors:**
- **Always in Hebrew** for admin interface
- Shown in notification box (red background, white text)
- Auto-dismiss after 5 seconds (or manual close)

**Technical Errors:**
- Logged to console with `console.error()`
- Not shown to user (generic message instead)

**Example:**
```typescript
try {
  await registerUser(data)
} catch (error) {
  console.error('Registration failed:', error) // Technical
  setNotification({
    type: 'error',
    message: 'הרישום נכשל. נסה שוב' // User-facing (Hebrew)
  })
}
```

---

## Business Logic

### Phone Number Normalization

**Israeli Phone Format:**
- **Storage:** Always stored as `+972XXXXXXXXX` (E.164 format)
- **Input:** Accepts `05X-XXX-XXXX`, `972-5X-XXX-XXXX`, `+972 5X XXX XXXX`
- **Output:** Normalized to `+972XXXXXXXXX`

**Normalization Function:**
```typescript
// From /lib/utils.ts
export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '') // Remove non-digits
  if (cleaned.startsWith('972')) {
    return '+' + cleaned
  }
  if (cleaned.startsWith('0')) {
    return '+972' + cleaned.substring(1) // 05X → +9725X
  }
  return '+972' + cleaned
}
```

**Validation:**
- Must be 10 digits starting with 0 (Israeli format)
- Or 12 digits starting with 972 (international format)
- Examples: `0541234567` → `+9725412345567`, `972541234567` → `+972541234567`

---

### Event Capacity Rules

**Capacity-Based Events:**
- `capacity` field sets maximum registrations
- `spotsReserved` counter tracks confirmed spots
- When `spotsReserved >= capacity`, new registrations go to `WAITLIST`

**Table-Based Events:**
- `capacity` set to 0 (ignored)
- Total capacity = sum of all table capacities
- Registration assigns to smallest available table that fits

**Atomic Enforcement:**
- Uses Prisma transaction + atomic increment
- Prevents race conditions when multiple users register simultaneously

---

### Waitlist Behavior

**When Capacity Full:**
- New registration status: `WAITLIST`
- `waitlistPriority` assigned (lower = higher priority)
- `spotsReserved` NOT incremented

**When Spot Becomes Available:**
- Admin manually assigns from waitlist (priority order)
- OR automatic assignment (TODO: not implemented yet)
- Increments `spotsReserved`, changes status to `CONFIRMED`

**Waitlist Priority:**
- Currently: order of registration (`createdAt ASC`)
- Admin can manually adjust priority (drag-and-drop UI)

---

### Confirmation Code Generation

**Format:**
- **6 characters**, uppercase alphanumeric
- Uses base36 encoding (0-9, A-Z)
- Cryptographically secure random (via `crypto.randomBytes`)

**Example Codes:**
- `A3F9B2`, `7K2M1P`, `9XZ4Q0`

**Implementation:**
```typescript
// From /lib/utils.ts
export function generateConfirmationCode(): string {
  const bytes = randomBytes(4) // 4 bytes = 32 bits of entropy
  const num = bytes.readUInt32BE(0)
  return num.toString(36).substring(0, 6).toUpperCase().padStart(6, '0')
}
```

**Uniqueness:**
- Globally unique (enforced by database constraint)
- Collision rate: ~1 in 2 billion (36^6 = 2,176,782,336 combinations)

---

### Registration Status Flow

**Valid Transitions:**
```
CONFIRMED → CANCELLED (user/admin cancels)
WAITLIST → CONFIRMED (admin assigns from waitlist)
WAITLIST → CANCELLED (user/admin cancels)
```

**Invalid Transitions:**
```
CANCELLED → CONFIRMED (cannot un-cancel)
CONFIRMED → WAITLIST (cannot demote)
```

**Implementation:**
- Status change tracked in `updatedAt` timestamp
- Cancellation records: `cancelledAt`, `cancellationReason`, `cancelledBy`

---

### Event Status Transitions

**Valid Transitions:**
```
OPEN → PAUSED (admin pauses registrations)
PAUSED → OPEN (admin re-opens)
OPEN → CLOSED (event ended or cancelled)
PAUSED → CLOSED (close paused event)
```

**Invalid Transitions:**
```
CLOSED → OPEN (cannot re-open closed event)
CLOSED → PAUSED (cannot pause closed event)
```

**Behavior by Status:**
- `OPEN`: Accept new registrations
- `PAUSED`: Show "Registration paused" message, no new registrations
- `CLOSED`: Show "Event closed" message, no new registrations, no cancellations

---

## Infrastructure

### Database: PostgreSQL

**Source of Truth:**
- PostgreSQL is the **single source of truth** for all data
- No caching layer (Redis, Memcached) currently implemented
- All queries go directly to database

**Connection Pooling:**
- Prisma Client manages connection pool internally
- Default pool size: 10 connections (Prisma default)
- Railway provides DATABASE_URL with connection limits

---

### Local Development

**Docker PostgreSQL:**
- Container name: `ticketcap-db`
- Host port: **6000** (mapped from container's 5432)
- Connection: `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`

**Start/Stop:**
```bash
docker-compose up -d    # Start PostgreSQL
docker-compose down     # Stop PostgreSQL
```

**Database Reset:**
```bash
npx prisma migrate reset  # WARNING: Deletes all data
npx prisma db push        # Sync schema without migrations
```

---

### Production: Railway

**Auto-Managed Database:**
- Railway PostgreSQL service auto-creates `DATABASE_URL`
- No manual connection string needed
- Automatic backups (Railway manages)

**Deployment Process:**
1. Push to GitHub
2. Railway detects changes
3. Runs `npm run build` (includes `prisma generate`)
4. Runs `npm run start:prod` (migrates DB + starts server)
5. Health check: `/api/health`

**Migration on Deploy:**
- Migrations run automatically via `npm run start:prod`
- Uses `npx prisma migrate deploy` (production-safe)

---

### JWT Secret Requirements

**REQUIRED Environment Variable:**
- `JWT_SECRET` must be set (no fallback)
- **Minimum 32 characters** recommended
- Generate: `openssl rand -base64 32`

**Why Required:**
- Signs admin session cookies (HS256 algorithm)
- Validates every protected route request
- Changing secret invalidates all existing sessions

---

### Email Provider: Resend

**Domain Verification Required (Production):**
- Must verify domain at https://resend.com/domains
- Can only send from verified domains in production
- Development: Can use `onboarding@resend.dev` (sends to account owner only)

**Environment Variables:**
- `RESEND_API_KEY` - API key from Resend dashboard
- `EMAIL_FROM` - Sender address (must be verified domain)

**Example:**
```bash
# Development
EMAIL_FROM="onboarding@resend.dev"

# Production
EMAIL_FROM="noreply@ticketcap.com"
```

---

### Build Process

**Build Command:** `npm run build`
- Runs `prisma generate` (generates Prisma Client)
- Runs `next build` (builds Next.js app)
- Output mode: `standalone` (reduces Docker image size by 80%)

**TypeScript Checking:**
- **Strict mode enabled** (`tsconfig.json`)
- Build fails on type errors (`ignoreBuildErrors: false`)

**ESLint:**
- Runs during build (warnings don't fail build)
- Can disable: `ignoreDuringBuilds: true` (currently disabled)

---

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Session signing secret (min 32 chars)
- `RESEND_API_KEY` - Email service API key
- `EMAIL_FROM` - Verified sender address

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth
- `GOOGLE_CLIENT_SECRET` - Google OAuth
- `NEXTAUTH_URL` - Base URL (auto-detected in dev)
- `NEXT_PUBLIC_BASE_URL` - Public URL (defaults to http://localhost:9000)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics

**Production (Railway):**
- `DATABASE_URL` auto-provided by Railway PostgreSQL service
- Must manually set: `JWT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`

---

## When to Update This Document

Update ASSUMPTIONS.md when:

1. **Adding Implicit Behaviors**
   - New default sort orders, pagination, filters
   - New validation rules or constraints
   - Session/auth behavior changes

2. **Changing Existing Assumptions** (CRITICAL)
   - Document old behavior → new behavior
   - Add **behavior lock tests** to prevent regressions
   - Update all dependent code

3. **Discovering Undocumented Assumptions**
   - During bug fixes ("I didn't know X worked this way!")
   - During code reviews ("This wasn't clear to me")
   - During onboarding (new developer confusion)

4. **Breaking Changes**
   - Database schema changes affecting queries
   - API response format changes
   - Security/permissions changes

5. **Infrastructure Changes**
   - New database, caching layer, email provider
   - Deployment process changes
   - Environment variable changes

---

## Related Documentation

### Core Documentation
- [`/CLAUDE.md`](../../CLAUDE.md) - Complete development guide, architecture, testing
- [`/prisma/schema.prisma`](../../prisma/schema.prisma) - Database schema, models, constraints
- [`/lib/auth.server.ts`](../../lib/auth.server.ts) - Authentication patterns, session management
- [`/middleware.ts`](../../middleware.ts) - Route protection, JWT validation

### Feature Documentation
- [`/docs/features/table-management.md`](../features/table-management.md) - Table duplication, templates, bulk edit
- [`/docs/bugs/bugs.md`](../../app/docs/bugs/bugs.md) - Known bugs, fixes, prevention rules

### Testing Documentation
- [`/tests/README.md`](../../tests/README.md) - Playwright testing guide, patterns, priority
- [`/tests/scenarios/`](../../tests/scenarios/) - Complete test scenario matrix (780 tests)

### Infrastructure
- [`/.env.example`](../../.env.example) - Environment variables reference
- [`/next.config.ts`](../../next.config.ts) - Next.js configuration
- [`/tsconfig.json`](../../tsconfig.json) - TypeScript configuration

---

**Document Version History:**

| Version | Date       | Changes                     | Author           |
|---------|------------|-----------------------------|------------------|
| 1.0     | 2025-12-18 | Initial creation            | Claude (AI)      |

---

*This document is maintained by the TicketCap development team. When in doubt about an assumption, check here first, then verify in code, then update this document.*
