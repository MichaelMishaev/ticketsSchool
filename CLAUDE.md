# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

kartis.info is a multi-tenant event registration system built for Israeli schools, clubs, and organizations managing limited-capacity events (especially sports/soccer). The system features atomic capacity enforcement, waitlist management, real-time registration tracking, payment processing (YaadPay), and Hebrew RTL interface.

**Tech Stack:**

- Next.js 15.5.3 (App Router) with TypeScript (strict mode)
- React 19.1.0
- Prisma 6.16.2 with PostgreSQL
- TailwindCSS 4 with RTL support
- Playwright for E2E testing (38/38 passing Suite 08)
- JWT authentication (jsonwebtoken + jose)
- YaadPay payment gateway (Israeli)

## Common Commands

```bash
# Development
npm run dev                    # Start dev server on port 9000
npm run build                  # Production build
npm run start:prod             # Start production server

# Database
docker-compose up -d           # Start PostgreSQL container
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run migrations (dev)
npm run db:migrate             # Deploy migrations (production)
npx prisma studio              # Open database GUI

# Testing
npm test                       # Run all Playwright tests
npm run test:ui                # Run tests with Playwright UI
npm run test:headed            # Run tests in headed mode (see browser)
npm run test:mobile            # Run mobile-only tests
npx playwright test tests/suites/08-event-tabs-navigation-p0.spec.ts  # Single suite
npx playwright test -g "should switch tabs"  # Single test by name

# Utilities
npm run school                 # Interactive school manager CLI
npm run lint                   # Run ESLint
npm run lint:fix               # Auto-fix ESLint issues
```

## Architecture

### Multi-Tenant Data Isolation (CRITICAL)

**JWT-based multi-tenancy with school-level data isolation.** This is the most critical architectural concept:

**Session Management** (`/lib/auth.server.ts`):

- JWT tokens in HTTP-only cookies (`admin_session`)
- Session contains: `adminId`, `email`, `role`, `schoolId`, `schoolName`
- Uses `jsonwebtoken` (Server Components) and `jose` (Edge Runtime/Middleware)
- Secret: `JWT_SECRET` environment variable (REQUIRED - no fallback)

**Data Filtering Pattern (MANDATORY in ALL API routes):**

```typescript
// CORRECT - Enforce schoolId for non-super admins
if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
  }
  where.schoolId = admin.schoolId // Filter by school
}

// WRONG - Silent bypass if schoolId is undefined
if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
  where.schoolId = admin.schoolId
}
```

**Session Updates:**

- ALWAYS update session cookie when `schoolId` changes (e.g., after onboarding)
- Use `encodeSession()` and `SESSION_COOKIE_NAME` from `/lib/auth.server.ts`
- Set session on NextResponse object before returning

**Middleware Protection** (`/middleware.ts`):

- Protects `/admin/*` and `/api/*` routes
- Public paths: `/api/auth/*`, `/api/admin/signup`, `/api/admin/login`, `/p/*`
- Uses `jose` library (Edge Runtime compatible)

### Atomic Capacity Enforcement

**Critical race condition prevention** using Prisma transactions and atomic counters:

```typescript
// CORRECT - Atomic transaction prevents double-booking
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({
    where: { id: eventId }
  })

  if (event.spotsReserved + spotsCount > event.capacity) {
    status = 'WAITLIST'  // Put on waitlist
  } else {
    // Increment atomic counter (safe for concurrent requests)
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

### Payment System (YaadPay + Mock Mode)

**YaadPay Integration** for upfront event payments:

**Mock Mode (Local Development):**

- Set `YAADPAY_MOCK_MODE="true"` in `.env` to bypass YaadPay gateway
- Simulates successful payments without external API calls
- Shows green screen with "🧪 MOCK MODE - Development Only" badge
- Auto-redirects to success page after 2 seconds
- Creates real database records (registration + payment)
- **REQUIRED for localhost** (YaadPay validates domain and can't reach localhost)

**Production Mode:**

- Set `YAADPAY_MOCK_MODE="false"` or remove the variable
- Requires YaadPay credentials: MASOF, API_SECRET, DOMAIN_ID
- Domain must be whitelisted in YaadPay dashboard
- Callback URLs must be publicly accessible

**Payment Flow:**

```
User submits registration
↓
POST /api/payment/create
  - Creates registration (paymentStatus="PROCESSING")
  - Creates payment record (status="PROCESSING")
  - Generates unique payment intent ID (cuid)
↓
IF YAADPAY_MOCK_MODE="true":
  Returns green mock screen (2 seconds)
  Auto-redirect to /api/payment/callback with success params
ELSE:
  Returns YaadPay payment form (auto-submit)
  User completes payment on YaadPay site
  YaadPay redirects to /api/payment/callback
↓
Callback processes payment
  - Validates callback signature
  - Updates payment status to "COMPLETED"
  - Updates registration paymentStatus to "COMPLETED"
  - Sends confirmation email with QR code
↓
Redirect to /payment/success?code=[confirmationCode]
```

**Key Files:**

- `/lib/yaadpay.ts` - YaadPay client library
- `/app/api/payment/create/route.ts` - Payment creation (lines 299-394 for mock mode)
- `/app/api/payment/callback/route.ts` - Payment callback handler
- `/docs/features/mock-payment-system.md` - Full documentation

### Database Schema (Prisma)

**Core Models:**

- `School` - Multi-tenant organization (has unique slug)
- `Admin` - User accounts (linked to School via schoolId)
- `Event` - Events with capacity and custom fields
  - `spotsReserved` - Atomic counter (never decrement directly)
  - `fieldsSchema` - JSON schema for dynamic registration fields
  - `paymentRequired`, `paymentTiming`, `pricingModel` - Payment settings
- `Registration` - User registrations
  - Status: CONFIRMED, WAITLIST, CANCELLED
  - `confirmationCode` - Unique code for check-in
  - `paymentStatus`, `paymentIntentId`, `amountDue`, `amountPaid` - Payment tracking
- `Payment` - Payment transactions (YaadPay)
  - `status`: PROCESSING, COMPLETED, FAILED, REFUNDED
  - `yaadPayOrderId` - Links to payment intent (Order in callback)
  - `yaadPayTransactionId` - YaadPay transaction ID (Id in callback)
  - `yaadPayConfirmCode` - Confirmation code from YaadPay
- `Table` - For table-based events (seats, reservations)
- `TableReservation` - Table bookings
- `TeamInvitation` - Invite team members to school
- `UsageRecord` - Track resource usage per school/month
- `UserBan` - Ban management (time-based or game-based)

### Role-Based Access Control

Roles (from most to least privileged):

- `SUPER_ADMIN` - Platform owner, access to all schools
- `OWNER` - School owner, billing & team management
- `ADMIN` - School admin, all event operations
- `MANAGER` - School manager, view events & edit registrations
- `VIEWER` - School viewer, read-only access

**Authorization helpers** (`/lib/auth.server.ts`):

- `getCurrentAdmin()` - Get session (returns null if not authenticated)
- `requireAdmin()` - Throws if not authenticated
- `requireSuperAdmin()` - Throws if not SUPER_ADMIN
- `requireSchoolAccess(schoolId)` - Throws if admin can't access school

### Table Management Features

**Advanced features for managing 30-40+ tables efficiently:**

1. **Duplicate Tables** - Create 1 table → Duplicate 29 times in 30 seconds
   - Smart auto-increment naming ("שולחן 5" → "שולחן 6")
   - API: `POST /api/events/[id]/tables/[tableId]/duplicate`

2. **Template System** - Reusable table configurations
   - Save current tables as template
   - Apply template to new events
   - APIs: `GET /api/templates`, `POST /api/templates`, `POST /api/events/[id]/tables/from-template`

3. **Bulk Edit** - Select multiple tables, edit all at once
   - Edit capacity, minimum order, status
   - Bulk delete (protected: can't delete reserved tables)
   - APIs: `PATCH /api/events/[id]/tables/bulk-edit`, `DELETE /api/events/[id]/tables/bulk-delete`

See `/docs/features/table-management.md` for full documentation.

## Testing (MANDATORY)

**NO CODE IS COMPLETE WITHOUT PASSING TESTS.**

### E2E Testing with Playwright

**Test Status (Suite 08 - Event Tabs Navigation):**

- ✅ 38/38 tests passing (100%)
- Desktop Chrome: 14/14 passing
- Mobile Chrome: 12/12 passing
- Mobile Safari: 12/12 passing

**Critical Pattern - Avoid Force Clicks:**

```typescript
// WRONG - Bypasses React event handlers
await page.click('[role="tab"]', { force: true })

// CORRECT - Triggers React synthetic events
await page.locator('[role="tab"]').evaluate((el: any) => el.click())
```

**Running Tests:**

```bash
npm test                       # All tests
npm run test:mobile            # Mobile viewports only
npx playwright test tests/suites/08-event-tabs-navigation-p0.spec.ts  # Specific suite
npx playwright test -g "should switch tabs on mobile"  # Single test
```

**Test Configuration** (`playwright.config.ts`):

- Sequential execution (`workers: 1`, `fullyParallel: false`)
- Projects: Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- Mobile Safari has automatic retries (2 attempts) for flaky login timeouts
- Base URL: http://localhost:9000 (dev server must be running)

**Writing Tests:**
Use page objects and fixtures for consistency:

```typescript
import { test, expect } from '@playwright/test'
import { LoginPage } from '../page-objects/LoginPage'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'

test.describe('My Feature', () => {
  test.afterAll(async () => {
    await cleanupTestData() // ALWAYS cleanup
  })

  test('should do something', async ({ page }) => {
    const school = await createSchool().withName('Test School').create()
    const admin = await createAdmin().withEmail('test@test.com').create()

    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'Password123!')

    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})
```

**Mobile Testing Notes:**

- Keyboard navigation tests are skipped on mobile (not applicable to touch devices)
- Use `:visible` selector for viewport-agnostic element targeting
- Pulsing indicators require both desktop and mobile to have matching components

See `/tests/README.md` for comprehensive testing guide.

## Critical Patterns & Rules

### Next.js 15 Specific

**Async Components:**

- Server Components can be async (use `async` keyword freely)
- Use `await cookies()` and `await headers()` in Server Components
- API routes: `export async function POST(request: Request)` (synchronous export)

**Cookie Management:**

- Server Components: `const cookieStore = await cookies(); cookieStore.get('name')`
- API routes with redirects: Set cookies on NextResponse object
  ```typescript
  const response = NextResponse.redirect(url)
  response.cookies.set('session', token, options)
  return response
  ```

**Middleware:**

- Uses `jose` library (Edge Runtime compatible, not `jsonwebtoken`)
- Convert JWT secret: `new TextEncoder().encode(secret)`

### Phone Number Normalization

Israeli phone format (10 digits starting with 0):

```typescript
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, '')

  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }

  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('Invalid Israeli phone number')
  }

  return normalized
}
```

### Mobile-First Design

- Minimum width: 375px
- Touch targets: minimum 44px height (iOS accessibility)
- Hebrew RTL: `dir="rtl"` on parent elements
- Input fields: ALWAYS include `text-gray-900 bg-white` classes (prevents white-on-white on mobile)
- Use responsive Tailwind classes: `sm:`, `md:`, `lg:`

### Form Validation

- Client-side: Use `getMissingFields()` helper
- Server-side: ALWAYS validate + sanitize
- Show missing fields in red notification box
- Disable submit button when invalid
- Update button text: "נא למלא את כל השדות החובה"

### API Error Handling

Standard pattern:

```typescript
try {
  // ... operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json({ error: 'User-friendly Hebrew message' }, { status: 500 })
}
```

**Status codes:**

- 200 - Success
- 400 - Bad request (validation error)
- 401 - Unauthorized (not logged in)
- 403 - Forbidden (insufficient permissions)
- 404 - Not found
- 500 - Internal server error

## Environment Variables

**Required:**

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret (min 32 chars, generate: `openssl rand -base64 32`)
- `RESEND_API_KEY` - Email service API key (https://resend.com/api-keys)
- `EMAIL_FROM` - From address (must be verified domain in production)

**Payment Gateway (YaadPay):**

- `YAADPAY_MASOF` - Terminal number
- `YAADPAY_API_SECRET` - API secret (DO NOT SHARE)
- `YAADPAY_DOMAIN_ID` - Domain ID
- `YAADPAY_BASE_URL` - Payment page URL (default: https://yaadpay.co.il/p/)
- `YAADPAY_TEST_MODE` - Set to "true" for test terminal
- `YAADPAY_MOCK_MODE` - Set to "true" for local development (bypasses YaadPay)

**Optional:**

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth
- `NEXT_PUBLIC_BASE_URL` - Public base URL (default: http://localhost:9000)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` - Google Analytics

**Production (Railway):**

- `DATABASE_URL` auto-provided by Railway PostgreSQL service
- Set `JWT_SECRET` manually before first deploy
- Verify domain at resend.com/domains for email sending
- **CRITICAL:** Set `YAADPAY_MOCK_MODE="false"` or remove it entirely

## Database Operations

**Local Development:**

```bash
docker-compose up -d           # Start PostgreSQL (port 6000)
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run migrations
npx prisma studio              # Open GUI
```

**Connection:**

- Local: `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`
- Production: Uses `DATABASE_URL` from Railway

**Migrations:**

```bash
# Development
npx prisma migrate dev --name descriptive_name

# Production (Railway)
railway run npm run db:migrate
```

**Schema Changes:**

- Always commit schema changes in separate commit
- Update test fixtures in `/tests/fixtures/test-data.ts` for new models
- Restart dev server after migrations to pick up new types

## Production Deployment (Railway)

**Current Setup:**

- Project: TicketsSchool
- Service: Tickets_Pre_Prod
- Database: PostgreSQL (auto-provided)

**Railway CLI:**

```bash
railway status                 # Check deployment
railway logs --follow          # Live logs
railway up                     # Deploy from local
railway run npm run db:migrate # Run migrations on prod
railway open                   # Open app in browser
```

**Build Configuration:**

- Output mode: `standalone` (80% smaller Docker images)
- Build command: `npm run build`
- Start command: `npm run start:prod`
- Health check: `/api/health`

**Pre-Deploy Checklist:**

- [ ] All tests pass (`npm test`)
- [ ] Set `JWT_SECRET` in Railway
- [ ] Verify email domain at resend.com
- [ ] Set `YAADPAY_MOCK_MODE="false"` (or remove)
- [ ] Test basic flow in production after deploy

## Common Workflows

### Adding a New API Endpoint

1. Write test first (TDD approach)
2. Create route file in `/app/api/[path]/route.ts`
3. Import auth helpers: `import { requireAdmin } from '@/lib/auth.server'`
4. Enforce multi-tenant isolation (see pattern above)
5. Add error handling and proper status codes
6. Run tests: `npm test`

### Fixing a Bug

1. Document in `/docs/bugs/bugs.md`
2. Write failing test that reproduces bug
3. Fix the bug
4. Verify test passes
5. Update bug documentation with fix
6. Run full suite: `npm test`

### Testing Payment Flow (Local)

1. Set `YAADPAY_MOCK_MODE="true"` in `.env`
2. Restart dev server: `npm run dev`
3. Create event with payment required (admin dashboard)
4. Navigate to `/p/[schoolSlug]/[eventSlug]`
5. Fill form and submit payment
6. Should see green mock screen → auto-redirect to success

## Security

### Security Master Sub-Agent

A world-class security specialist is available as a sub-agent to audit and protect the application.

**Quick Usage:**

```bash
# Full security audit (run before production deploy)
/security-master --audit-all

# Focus on critical areas
/security-master --focus payment           # Payment security (YaadPay)
/security-master --focus multi-tenant      # Data isolation
/security-master --focus auth              # JWT & sessions

# Code review for security issues
/security-master --review app/api/events/

# Penetration testing guidance
/security-master --pentest payment-tampering
```

**Critical Security Checks:**

1. **Multi-Tenant Isolation** - schoolId filtering in ALL API routes
2. **Payment Security** - YaadPay callback signature validation (HMAC-SHA256)
3. **JWT Secret** - Must be 32+ bytes, NEVER use default
4. **Race Conditions** - Atomic `spotsReserved` increment with `$transaction`
5. **Mock Mode** - YAADPAY_MOCK_MODE must be "false" or removed in production

**Documentation:**

- `.claude/skills/security-master/SKILL.md` - Full security guide
- `.claude/skills/security-master/README.md` - Usage guide
- `.claude/skills/security-master/QUICK_REFERENCE.md` - Quick reference

## Known Issues

See `/docs/bugs/bugs.md` for full list. Key items:

1. **Email (Development):** Resend test mode only sends to account owner email
2. **Session Cookies:** Set cookies on NextResponse object when redirecting
3. **YaadPay Localhost:** Cannot use real gateway from localhost (use mock mode)
4. **Dev Server Load:** May become unresponsive after ~40 continuous tests (restart)

## Code Style

- TypeScript strict mode enabled
- Path aliases: `@/*` maps to project root
- ESLint with Next.js config
- Prefer Server Components (use `'use client'` only when needed)
- Server-only code: `import 'server-only'` at top of file
- Logging: Use `console.error` for errors (captured in production)

## Documentation

- `README.md` - Setup instructions
- This file - Development guide
- `/docs/bugs/bugs.md` - Bug tracking
- `/docs/features/table-management.md` - Table management system
- `/docs/features/mock-payment-system.md` - Payment mock mode
- `/tests/README.md` - Testing guide
- `.env.example` - Environment variables
