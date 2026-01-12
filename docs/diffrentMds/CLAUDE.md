# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TicketCap is a multi-tenant event registration system built for Israeli schools, clubs, and organizations managing limited-capacity events (especially sports/soccer). The system features atomic capacity enforcement, waitlist management, real-time registration tracking, and Hebrew RTL interface.

**Tech Stack:**
- Next.js 15.5.3 (App Router) with TypeScript (strict mode)
- React 19.1.0
- Prisma 6.16.2 with PostgreSQL
- TailwindCSS 4 with RTL support
- Playwright for E2E testing
- JWT authentication (jsonwebtoken + jose)

## Advanced Table Management (NEW!)

**TicketCap now supports managing 30-40+ tables efficiently with three powerful features:**

### 🔄 1. Duplicate Tables
- Create 1 table → Duplicate 29 times → 30 tables in 30 seconds
- Smart auto-increment naming ("שולחן 5" → "שולחן 6", "שולחן 7"...)
- Live preview before creation
- API: `POST /api/events/[id]/tables/[tableId]/duplicate`

### ✨ 2. Template System
- Save common table configurations as reusable templates
- Apply templates to new events with one click
- Support for private (school-specific) and public templates
- APIs:
  - `GET /api/templates` - List all templates
  - `POST /api/templates` - Create template
  - `POST /api/events/[id]/tables/from-template` - Apply template
  - `POST /api/events/[id]/tables/save-as-template` - Save current tables

### 📝 3. Bulk Edit
- Select multiple tables with checkboxes
- Edit capacity, minimum order, or status for all at once
- Bulk delete multiple tables (protected: can't delete reserved tables)
- APIs:
  - `PATCH /api/events/[id]/tables/bulk-edit` - Update multiple tables
  - `DELETE /api/events/[id]/tables/bulk-delete` - Delete multiple tables

**📖 Full Documentation**: `/docs/features/table-management.md`
**🧪 E2E Tests**: `/tests/suites/07-table-management-p0.spec.ts`

**Quick Workflow** (40 tables in 2 minutes):
```
1. Create first table: "1", 8 seats, min 4
2. Click Copy icon (📋)
3. Enter "39" → Duplicate
4. Done! Tables 1-40 created
5. (Optional) Save as template for reuse
```

## Development Setup

### Prerequisites
- Node.js 18+
- Docker Desktop (for PostgreSQL)
- PostgreSQL via Docker Compose

### Common Commands

```bash
# Development
npm run dev                    # Start dev server on port 9000 (http://localhost:9000)
npm run build                  # Build for production (includes prisma generate)
npm run build:production       # Production build with env validation skipped

# Database
npx prisma generate            # Generate Prisma client
npx prisma migrate dev         # Run migrations in development
npm run db:migrate             # Deploy migrations (production)
npm run db:status              # Check migration status
docker-compose up -d           # Start PostgreSQL container

# Testing
npm run test                   # Run Playwright tests
npm run test:ui                # Run tests with UI
npm run test:debug             # Run tests with debugger
npm run test:headed            # Run tests in headed mode
npm run test:mobile            # Run tests on mobile viewport

# School Management
npm run school                 # Interactive school manager CLI
npm run school:seed            # Seed schools from script

# Code Quality
npm run lint                   # Run ESLint
npm run lint:fix               # Auto-fix ESLint issues
```

### Database Connection
- Local: PostgreSQL runs in Docker on port 6000 (mapped from container's 5432)
- Connection: `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`
- Docker container name: `ticketcap-db`
- Production: Uses DATABASE_URL environment variable (Railway auto-provides)
- Container management: `docker-compose up -d` (start), `docker-compose down` (stop)

## Architecture

### Project Structure

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
/components                       # Reusable React components
/lib                              # Utility functions
  auth.server.ts                  # Authentication helpers
  prisma.ts                       # Prisma client
  usage.ts                        # Usage tracking
/prisma                           # Database schema & migrations
  schema.prisma                   # Prisma schema
  /migrations                     # Database migrations
/scripts                          # Utility scripts
/tests                            # Playwright E2E tests
/types                            # TypeScript type definitions
```

### Multi-Tenant Data Isolation (CRITICAL)

This application uses **JWT-based multi-tenancy with school-level data isolation**. Understanding this is crucial:

1. **Session Management** (`/lib/auth.server.ts`)
   - JWT tokens stored in HTTP-only cookies (`admin_session`)
   - Session contains: `adminId`, `email`, `role`, `schoolId`, `schoolName`
   - Uses `jsonwebtoken` library with HS256 algorithm
   - Secret: `JWT_SECRET` environment variable (REQUIRED - no fallback)

2. **Data Filtering Pattern**
   ```typescript
   // CORRECT - Enforce schoolId for non-super admins
   if (admin.role !== 'SUPER_ADMIN') {
     if (!admin.schoolId) {
       return NextResponse.json(
         { error: 'Admin must have a school assigned' },
         { status: 403 }
       )
     }
     where.schoolId = admin.schoolId
   }

   // WRONG - Silent filter bypass if schoolId is undefined
   if (admin.role !== 'SUPER_ADMIN' && admin.schoolId) {
     where.schoolId = admin.schoolId
   }
   ```

3. **Session Updates**
   - ALWAYS update session cookie when `schoolId` changes (e.g., after onboarding)
   - Import `encodeSession()` and `SESSION_COOKIE_NAME` from `/lib/auth.server.ts`
   - Set session on NextResponse object before returning

4. **Middleware Protection** (`/middleware.ts`)
   - Uses `jose` library (Edge Runtime compatible) for JWT verification
   - Protects `/admin/*` and `/api/*` routes
   - Public paths: `/api/auth/*`, `/api/admin/signup`, `/api/admin/login`, `/p/*`

### Role-Based Access Control

Roles (from most to least privileged):
- `SUPER_ADMIN` - Platform owner, access to all schools/features
- `OWNER` - School owner, billing & team management
- `ADMIN` - School admin, all event operations
- `MANAGER` - School manager, view events & edit registrations
- `VIEWER` - School viewer, read-only access

Authorization helpers in `/lib/auth.server.ts`:
- `getCurrentAdmin()` - Get current session (returns null if not authenticated)
- `requireAdmin()` - Throws if not authenticated
- `requireSuperAdmin()` - Throws if not SUPER_ADMIN
- `requireSchoolAccess(schoolId)` - Throws if admin can't access school

### Subscription & Usage Tracking

Plan-based limits system (`/lib/usage.ts`):
- Plans: FREE, STARTER, PRO, ENTERPRISE
- Tracks: events, registrations, emails, SMS, API calls, storage
- Monthly quotas with automatic reset

Key functions:
- `trackUsage(schoolId, resourceType, amount)` - Record usage
- `canUseResource(schoolId, resourceType, amount)` - Check if within limits
- `hasFeature(schoolId, feature)` - Check feature access
- `getSchoolPlanDetails(schoolId)` - Get plan + usage stats

### Database Schema (Prisma)

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

**Atomic Capacity Enforcement:**
```typescript
// CORRECT - Atomic transaction prevents race conditions
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({
    where: { id: eventId }
  })

  if (event.spotsReserved + spotsCount > event.capacity) {
    // Put on waitlist
    status = 'WAITLIST'
  } else {
    // Increment atomic counter
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

### Public URLs & Routing

Events have slugs for public registration:
- Pattern: `/p/[schoolSlug]/[eventSlug]`
- Example: `ticketcap.com/p/beeri/soccer-game-2024`
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

### Authentication Flows

**1. Email/Password Signup:**
- User fills form with email, password, name, schoolName, schoolSlug
- System creates school + admin in transaction
- Sends verification email via Resend
- User verifies email → redirected to login
- After login → redirected to dashboard (onboarding skipped if school created)

**2. Google OAuth:**
- User clicks "Sign in with Google"
- OAuth callback creates/links account
- If new user: creates account, sets `emailVerified: true`, redirects to onboarding
- If existing (no password): auto-links Google account
- If existing (with password): REQUIRES password confirmation before linking (security)
- Session cookie updated with `schoolId` after onboarding

**3. Session Lifecycle:**
- Duration: 7 days
- Storage: HTTP-only cookie (`admin_session`)
- Validation: JWT signature with `JWT_SECRET`
- Renewal: No automatic renewal (user must re-login)

## Important Rules & Patterns

### ⚠️ CRITICAL: Testing is Mandatory

**NO CODE IS COMPLETE WITHOUT PASSING TESTS.**

- **Every feature** must have automated tests
- **Every bug fix** must have a test that would have caught the bug
- **All tests must pass** before committing (`npm test`)
- **Update tests** when changing existing behavior
- **Test on mobile** for UI changes (`npm run test:mobile`)

See the **QA Automation** section above for complete testing guidelines.

---

### Next.js 15 Specific Patterns

**Async Components & APIs:**
- Server Components can be async (use `async` keyword freely)
- Use `await cookies()` and `await headers()` in Server Components/Actions
- API routes remain synchronous function exports (`export async function POST(request: Request)`)

**Cookie Management:**
- In Server Components: `const cookieStore = await cookies(); cookieStore.get('name')`
- In API routes with redirects: Set cookies on NextResponse object
  ```typescript
  const response = NextResponse.redirect(url)
  response.cookies.set('session', token, options)
  return response
  ```

**Middleware:**
- Uses `jose` library (not `jsonwebtoken`) for Edge Runtime compatibility
- Convert JWT secret to Uint8Array: `new TextEncoder().encode(secret)`

### Bug Documentation
- Every bug found and its fix MUST be documented in `/app/docs/bugs/bugs.md`
- Include: file path, line numbers, severity, description, fix, status
- See existing bugs for format examples

### Git Workflow
- DO NOT push to git without explicit permission from user
- Use conventional commits when creating commits
- Add Co-Authored-By: Claude footer to commits

### Mobile-First Design
- All forms and UI must work on mobile (375px width minimum)
- Touch targets: minimum 44px height (iOS accessibility standard)
- Use responsive Tailwind classes: `sm:`, `md:`, `lg:`
- Hebrew RTL: use `dir="rtl"` and right-to-left flex/grid
- Input fields: ALWAYS include `text-gray-900 bg-white` classes (prevents white-on-white on mobile)

### Form Validation Pattern
- Client-side: Use `getMissingFields()` helper to validate required fields
- Server-side: ALWAYS validate + sanitize input
- Show missing fields in red notification box above submit button
- Disable submit button when form invalid
- Update button text when disabled: "נא למלא את כל השדות החובה"

### Phone Number Handling
Israeli phone format normalization (10 digits starting with 0):
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
    throw new Error('Invalid Israeli phone number')
  }

  return normalized
}
```

### API Error Handling Pattern
Standard error response format:
```typescript
try {
  // ... operation
  return NextResponse.json({ success: true, data })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { error: 'User-friendly error message' },
    { status: 500 }
  )
}
```

**Common status codes:**
- 200 - Success
- 400 - Bad request (validation error)
- 401 - Unauthorized (not logged in)
- 403 - Forbidden (insufficient permissions)
- 404 - Not found
- 500 - Internal server error

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 characters, generate with `openssl rand -base64 32`)
- `RESEND_API_KEY` - Resend API key for emails (get from https://resend.com/api-keys)
- `EMAIL_FROM` - From address for emails (must be verified domain in production)

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth (if using OAuth)
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

## QA Automation (CRITICAL)

### ⚠️ MANDATORY Test Requirements

**ALL development work MUST include automated tests. No feature is complete until tests pass.**

#### Rules:
1. **Extend tests while developing** - Add new test scenarios for every feature/bug fix
2. **All tests must pass** - Run full test suite before considering work complete
3. **Write tests first** - For new features, write failing tests before implementation (TDD approach recommended)
4. **Update existing tests** - If changing behavior, update affected tests
5. **Mobile + Desktop** - Test on both viewports for UI changes

#### Test Coverage Status
- **Current**: 65/780 tests (8% complete)
- **P0 Critical**: 65/275 tests (24% complete)
- **Infrastructure**: ✅ 100% complete (fixtures, page objects, helpers)

### Playwright Test Architecture

**Test Organization:**
```
/tests
├── suites/                    # Priority-based test suites
│   ├── 01-auth-p0.spec.ts           ✅ Authentication (~20 tests)
│   ├── 04-public-registration-p0.spec.ts  ✅ Public registration (~20 tests)
│   ├── 06-multi-tenant-p0.spec.ts   ✅ Multi-tenancy (~25 tests)
│   ├── 03-event-management-p0.spec.ts     🚧 TO BE COMPLETED
│   ├── 05-admin-registration-p0.spec.ts   🚧 TO BE COMPLETED
│   └── [other test suites]          🚧 See /tests/README.md
├── critical/                  # Core security tests
│   ├── multi-tenant-isolation.spec.ts
│   ├── atomic-capacity.spec.ts
│   ├── registration-edge-cases.spec.ts
│   └── security-validation.spec.ts
├── fixtures/                  # Data builders (SchoolBuilder, AdminBuilder, etc.)
├── page-objects/              # Reusable UI interactions
├── helpers/                   # Auth & test utilities
└── scenarios/                 # Test plan documentation (780 scenarios)
```

**Configuration:**
- Projects: Desktop Chrome, Mobile Chrome (Pixel 5), Mobile Safari (iPhone 12)
- Base URL: http://localhost:9000 (dev server must be running)
- Screenshot on failure, trace on retry
- Full parallel execution

### Running Tests

```bash
# ALWAYS run before committing code
npm test                       # Run all tests
npm run test:ui                # Run with Playwright UI
npm run test:headed            # See browser (debug visual issues)
npm run test:mobile            # Mobile viewport only
npm run test:debug             # Debug specific test

# Run critical tests only (P0)
npx playwright test tests/suites/*-p0.spec.ts

# Run specific suite
npx playwright test tests/suites/01-auth-p0.spec.ts

# Run single test
npx playwright test -g "admin can login"
```

### Writing New Tests

**Use existing patterns from `/tests/fixtures/` and `/tests/page-objects/`:**

```typescript
import { test, expect } from '@playwright/test'
import { createSchool, createAdmin, cleanupTestData } from '../fixtures/test-data'
import { LoginPage } from '../page-objects/LoginPage'
import { EventsPage } from '../page-objects/EventsPage'

test.describe('My Feature Tests', () => {
  test.afterAll(async () => {
    await cleanupTestData() // ALWAYS cleanup test data
  })

  test('should do something', async ({ page }) => {
    // Setup: Create test data
    const school = await createSchool().withName('Test School').create()
    const admin = await createAdmin()
      .withEmail('test@test.com')
      .withSchool(school.id)
      .create()

    // Action: Perform test
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(admin.email, 'Password123!')

    // Assert: Verify result
    await expect(page.locator('text=Dashboard')).toBeVisible()
  })
})
```

**See `/tests/README.md` for comprehensive guide on:**
- Data builders pattern (fluent API for creating test data)
- Page objects pattern (reusable UI interactions)
- Test cleanup strategies
- Mobile testing best practices
- Priority implementation order (P0 → P1 → P2 → P3)

### Critical Test Scenarios (Must Always Pass)

1. **Multi-tenant isolation** - Can't access other schools' data
2. **Atomic capacity enforcement** - No race conditions in concurrent registrations
3. **Role-based access control** - SUPER_ADMIN vs regular admin permissions
4. **Mobile responsiveness** - Forms work on 375px width, touch targets ≥44px
5. **Session persistence** - schoolId changes reflected immediately
6. **Hebrew RTL** - Proper text direction and layout
7. **Phone normalization** - Israeli phone format (10 digits, starts with 0)
8. **Security** - SQL injection, XSS, CSRF protection

### Test-Driven Development Workflow

**For new features:**
1. Read scenario from `/tests/scenarios/`
2. Write failing test in appropriate `/tests/suites/` file
3. Run test to verify it fails: `npm test`
4. Implement feature code
5. Run test to verify it passes: `npm test`
6. Refactor if needed
7. Run full suite to ensure no regressions: `npm test`

**For bug fixes:**
1. Document bug in `/app/docs/bugs/bugs.md`
2. Write failing test that reproduces the bug
3. Fix the bug
4. Verify test passes
5. Update bug documentation with fix details
6. Run full suite to ensure no regressions

### Pre-Commit Checklist

**Before committing ANY code:**
- [ ] All existing tests pass (`npm test`)
- [ ] New tests added for new features/bug fixes
- [ ] Tests pass on both desktop and mobile (if UI changes)
- [ ] Test cleanup implemented (`test.afterAll()`)
- [ ] No console errors in test output
- [ ] Bug documented in `/app/docs/bugs/bugs.md` (if bug fix)

**Before deploying to production:**
- [ ] Full test suite passes (all 65+ tests)
- [ ] Critical tests pass (`npx playwright test tests/critical/`)
- [ ] Mobile tests pass (`npm run test:mobile`)
- [ ] No failing tests in Railway deployment logs

## Code Style & Conventions

- TypeScript strict mode enabled (`tsconfig.json`)
- Path aliases: Use `@/*` for imports (maps to project root)
  - Example: `import { prisma } from '@/lib/prisma'`
- ESLint with Next.js config
- Prefer server components (use `'use client'` only when needed)
- Server-only code: Use `import 'server-only'` at top of file (prevents client-side bundling)
- API routes: Always handle errors, return proper HTTP status codes
- Logging: Use `console.error` for errors (gets captured in production)
- Next.js 15: Use `cookies()` API only in Server Components/Actions, not in API route redirects

## Production Deployment (Railway)

**Current Deployment:**
- **Project:** TicketsSchool
- **Environment:** production
- **Service:** Tickets_Pre_Prod
- **Database:** PostgreSQL (Railway-provided)

### Railway CLI Commands

```bash
# Check current deployment status
railway status

# View deployment logs
railway logs                    # Recent logs
railway logs --follow           # Live tail logs

# Environment variables
railway variables               # List all variables
railway variables set KEY=value # Set variable

# Deploy current code
railway up                      # Deploy from local code
railway up --detach            # Deploy without streaming logs

# Database operations
railway run npm run db:migrate  # Run migrations on production DB
railway run npx prisma studio   # Open Prisma Studio for prod DB

# Open deployed application
railway open                    # Open app in browser

# Connect to production database
railway connect postgres        # Direct PostgreSQL connection

# Check who you're logged in as
railway whoami

# Link to different project/environment
railway link                    # Interactive project selection
```

### Deployment Workflow

1. **Test locally:**
   ```bash
   npm run build && npm run start:prod
   ```

2. **Check Railway connection:**
   ```bash
   railway status
   ```

3. **Deploy:**
   ```bash
   railway up
   ```

4. **Monitor deployment:**
   ```bash
   railway logs --follow
   ```

5. **Verify health:**
   - Visit: `https://[your-domain].railway.app/api/health`
   - Should return: `{ "status": "ok" }`

6. **Run migrations (if needed):**
   ```bash
   railway run npm run db:migrate
   ```

### Automatic Deployment (GitHub Integration)

Railway automatically deploys when you push to GitHub:
1. Push to GitHub repository
2. Railway detects changes
3. Runs `npm run build` (includes `prisma generate`)
4. Sets `DATABASE_URL` from PostgreSQL service
5. Runs `npm run start:prod` (migrates DB + starts server)
6. Health check: `/api/health`

### Build Configuration

- **Output mode:** `standalone` (reduces Docker image size by 80%)
- **ESLint:** Disabled during builds (`ignoreDuringBuilds: true`)
- **TypeScript:** Strict checking enabled (`ignoreBuildErrors: false`)
- **Build command:** `npm run build`
- **Start command:** `npm run start:prod`

### Environment Variables (Production)

Required variables in Railway dashboard:
- `DATABASE_URL` - Auto-provided by Railway PostgreSQL service
- `JWT_SECRET` - Set manually (generate: `openssl rand -base64 32`)
- `RESEND_API_KEY` - From https://resend.com/api-keys
- `EMAIL_FROM` - Verified domain email (e.g., `noreply@yourdomain.com`)
- `NEXT_PUBLIC_BASE_URL` - Your Railway app URL

Optional:
- `GOOGLE_CLIENT_ID` - For Google OAuth
- `GOOGLE_CLIENT_SECRET` - For Google OAuth
- `NEXTAUTH_URL` - Auto-detected from Railway

### Pre-launch Checklist

**Environment & Configuration:**
- [ ] Set `JWT_SECRET` environment variable in Railway
- [ ] Verify domain at resend.com/domains
- [ ] Update `EMAIL_FROM` to verified domain
- [ ] Configure custom domain (optional)
- [ ] Set up monitoring/alerts

**Testing (MANDATORY):**
- [ ] ✅ All P0 critical tests pass (`npx playwright test tests/suites/*-p0.spec.ts`)
- [ ] ✅ All critical security tests pass (`npx playwright test tests/critical/`)
- [ ] ✅ Mobile tests pass (`npm run test:mobile`)
- [ ] ✅ Full test suite passes (`npm test`)
- [ ] Test email verification flow (manual)
- [ ] Test multi-tenant data isolation (manual)
- [ ] Verify mobile registration form works (manual)
- [ ] Test on real iOS and Android devices (manual)
- [ ] Load test with concurrent registrations (if high traffic expected)

**Deployment Verification:**
- [ ] Successful Railway deployment (no build errors)
- [ ] Health check passes: `https://[domain].railway.app/api/health`
- [ ] Database migrations applied successfully
- [ ] No errors in Railway logs
- [ ] Test basic user flow in production (create event, register)

### Troubleshooting

**Build failures:**
```bash
railway logs --deployment [deployment-id]
```

**Database connection issues:**
```bash
railway run npx prisma db push --accept-data-loss  # Force sync schema
railway variables | grep DATABASE_URL              # Verify connection string
```

**Rollback deployment:**
- Use Railway dashboard to redeploy previous successful deployment
- Or fix locally and run `railway up` again

## Known Issues & Workarounds

See `/app/docs/bugs/bugs.md` for comprehensive bug list. Key items:

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

## Useful Scripts

See `scripts/` directory for utility scripts (run with `tsx scripts/<script-name>.ts`):
- `school-manager.ts` - Create/manage schools interactively (also: `npm run school`)
- `list-admins.ts` - List all admins in database
- `clean-orphaned-events.ts` - Remove events with null schoolId
- `list-events.ts` - List all events
- `fix-registration-status.ts` - Fix registration status issues
- `delete-admin-by-email.ts` - Delete admin by email
- `check-user-school.ts` - Check user school assignment
- `test-email.ts` - Test email configuration

## Common Development Workflows

### Adding a New API Endpoint
1. **Write test first** (TDD approach):
   - Create test in appropriate suite file (e.g., `/tests/suites/03-event-management-p0.spec.ts`)
   - Use fixtures to create test data
   - Write failing test that calls the new endpoint
2. Create route file in `/app/api/[path]/route.ts`
3. Import required auth helpers: `import { requireAdmin } from '@/lib/auth.server'`
4. Enforce multi-tenant isolation with schoolId filtering
5. Add proper error handling and status codes
6. **Run tests to verify**: `npm test`
7. **Test on mobile** if user-facing: `npm run test:mobile`

### Adding a New Database Model
1. Update `/prisma/schema.prisma`
2. Run `npx prisma migrate dev --name descriptive_name`
3. Update TypeScript types if needed
4. Restart dev server to pick up new Prisma client types
5. **Update test fixtures** in `/tests/fixtures/test-data.ts` to support new model
6. **Write tests** for any new API endpoints using the model
7. **Run tests**: `npm test`

### Creating a New Protected Page
1. **Write test first**:
   - Add test in appropriate suite file
   - Test authentication, authorization, data rendering
2. Create page in `/app/admin/[path]/page.tsx`
3. Middleware automatically protects `/admin/*` routes
4. Use Server Component to fetch initial data
5. Add to navigation if needed
6. **Test mobile responsiveness**: `npm run test:mobile`
7. **Run tests**: `npm test`

### Fixing a Bug
1. **Document bug** in `/app/docs/bugs/bugs.md` with severity and description
2. **Write failing test** that reproduces the bug
3. Run test to verify it fails: `npm test`
4. Fix the bug
5. Run test to verify it passes: `npm test`
6. **Update bug documentation** with fix details and file:line references
7. **Run full suite** to ensure no regressions: `npm test`

### Testing Registration Flow (Manual)
1. Start dev server: `npm run dev`
2. Create school via: `npm run school`
3. Create event in admin dashboard
4. Access public URL: `/p/[schoolSlug]/[eventSlug]`
5. Test registration with Israeli phone format
6. **Always follow up with automated tests** - don't rely only on manual testing

## Support & Documentation

- README.md - Setup instructions
- This file (CLAUDE.md) - Development guide
- `/app/docs/bugs/bugs.md` - Bug tracking
- `/app/admin/help/page.tsx` - User-facing help (soccer-focused examples)
- `.env.example` - Environment variables reference
- when have schema change, add it to next commit, for the reason that we do not want to have bugs cos of schema change