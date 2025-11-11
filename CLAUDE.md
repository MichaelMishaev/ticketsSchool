# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TicketCap is a multi-tenant event registration system built for Israeli schools, clubs, and organizations managing limited-capacity events (especially sports/soccer). The system features atomic capacity enforcement, waitlist management, real-time registration tracking, and Hebrew RTL interface.

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
- Local: PostgreSQL runs in Docker on port 6000
- Connection: `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`
- Production: Uses DATABASE_URL environment variable (Railway auto-provides)

## Architecture

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
- `/api/admin/*` - Admin operations (requires auth + schoolId)
- `/api/events/*` - Event CRUD (requires auth + schoolId)
- `/api/dashboard/*` - Dashboard stats (requires auth + schoolId)
- `/api/p/[schoolSlug]/[eventSlug]/*` - Public registration (no auth)

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
Israeli phone format normalization:
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

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for JWT signing (min 32 characters)
- `RESEND_API_KEY` - Resend API key for emails
- `EMAIL_FROM` - From address for emails (must be verified domain in production)

**Optional:**
- `GOOGLE_CLIENT_ID` - Google OAuth (if using OAuth)
- `GOOGLE_CLIENT_SECRET` - Google OAuth secret
- `NEXTAUTH_URL` - Base URL for callbacks (auto-detected in dev)

**Production (Railway):**
- Set `JWT_SECRET` before first deploy
- Verify domain at resend.com/domains before sending emails to users
- `DATABASE_URL` auto-provided by Railway PostgreSQL service

## Testing Considerations

### Playwright Tests
- Tests located in `/tests` directory
- Configuration: `playwright.config.ts`
- Mobile viewport: 375x667 (iPhone SE)
- Tests cover: event creation, registration flow, admin dashboard
- Use `--headed` to debug visual issues

### Critical Test Scenarios
1. Multi-tenant isolation (can't see other schools' data)
2. Capacity enforcement (concurrent registrations)
3. Role-based access (SUPER_ADMIN vs regular admin)
4. Mobile form visibility (input field text colors)
5. Session updates (schoolId changes reflected immediately)

## Code Style & Conventions

- TypeScript strict mode enabled
- ESLint with Next.js config
- Prefer server components (use `'use client'` only when needed)
- Server-only code: Use `import 'server-only'` at top
- API routes: Always handle errors, return proper HTTP status codes
- Logging: Use `console.error` for errors (gets captured in production)

## Production Deployment (Railway)

1. Push to GitHub
2. Railway auto-detects Node.js project
3. Runs `npm run build` (includes Prisma generate)
4. Sets DATABASE_URL from PostgreSQL service
5. Runs `npm run start:prod` (migrates DB + starts server)
6. Health check: `/api/health`

**Pre-launch Checklist:**
- [ ] Set JWT_SECRET environment variable
- [ ] Verify domain at Resend
- [ ] Update EMAIL_FROM to verified domain
- [ ] Test email verification flow
- [ ] Test multi-tenant data isolation
- [ ] Run Playwright tests on staging
- [ ] Verify mobile registration form works

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

See `scripts/` directory for utility scripts:
- `school-manager.ts` - Create/manage schools interactively
- `list-admins.ts` - List all admins in database
- `clean-orphaned-events.ts` - Remove events with null schoolId

## Support & Documentation

- README.md - Setup instructions
- This file (CLAUDE.md) - Development guide
- `/app/docs/bugs/bugs.md` - Bug tracking
- `/app/admin/help/page.tsx` - User-facing help (soccer-focused examples)
