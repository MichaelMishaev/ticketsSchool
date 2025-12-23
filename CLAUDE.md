# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 📜 MANDATORY READING BEFORE ANY CODE CHANGES

**Read these documents in order (NON-NEGOTIABLE):**

1. **`/docs/infrastructure/baseRules-kartis.md`** ⭐ **PRIMARY GUIDE**
   - All development rules, patterns, and workflows
   - LOCKED mechanism, testing requirements, stack lock
   - Multi-tenant security, regression prevention

2. **`/docs/infrastructure/GOLDEN_PATHS.md`**
   - Business-critical flows (LOCKED by default)
   - Authentication, registration, multi-tenant isolation patterns

3. **`/docs/infrastructure/invariants.md`**
   - System invariants (MUST remain true)
   - Multi-tenant isolation, atomic capacity, security rules

**If any rule in these documents is violated, the solution is considered INVALID, even if it works.**

---

## ⚡ Quick Reference

### Project Overview

**kartis.info** - Multi-tenant event registration system for Israeli schools, clubs, and organizations. Features atomic capacity enforcement, waitlist management, and Hebrew RTL interface.

### Tech Stack

- **Framework:** Next.js 15.5.3 (App Router)
- **Language:** TypeScript (strict mode)
- **UI:** React 19.1.0
- **Styling:** Tailwind CSS 4 (custom components, no UI library)
- **Database:** PostgreSQL + Prisma 6.16.2
- **Auth:** JWT (jsonwebtoken + jose)
- **Testing:** Playwright (E2E)
- **Deployment:** Railway

### Key Commands

```bash
# Development
npm run dev                    # Start dev server (http://localhost:9000)
npm run build                  # Production build
npm test                       # Run Playwright tests (MUST pass before commit)

# Database
docker-compose up -d           # Start PostgreSQL
npx prisma migrate dev         # Run migrations
npx prisma generate            # Generate Prisma client

# Testing
npm run test:ui                # Playwright UI
npm run test:mobile            # Mobile viewport tests
npm run test:p0                # P0 critical tests only

# Deployment
railway up                     # Deploy to production
railway logs --follow          # Monitor deployment
```

### Critical Patterns (Quick Lookup)

**Multi-Tenant Isolation (MANDATORY):**
```typescript
const admin = await requireAdmin()

if (admin.role !== 'SUPER_ADMIN') {
  if (!admin.schoolId) {
    return NextResponse.json({ error: 'Admin must have a school assigned' }, { status: 403 })
  }
  where.schoolId = admin.schoolId
}
```

**Atomic Capacity Enforcement:**
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

  return tx.registration.create({ ... })
})
```

**Phone Normalization (Israeli Format):**
```typescript
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[\s\-\(\)]/g, '')
  if (normalized.startsWith('+972')) {
    normalized = '0' + normalized.substring(4)
  }
  if (!/^0\d{9}$/.test(normalized)) {
    throw new Error('מספר טלפון לא תקין')
  }
  return normalized
}
```

### Essential Links

- **Complete Development Guide:** `/docs/infrastructure/baseRules-kartis.md`
- **Bug Prevention Guide:** `/docs/infrastructure/baseRules-kartis.md#27-bug-prevention-hardening-critical`
- **Architecture Details:** `/docs/infrastructure/baseRules-kartis.md#28-architecture-kartisinfo`
- **API Patterns:** `/docs/infrastructure/baseRules-kartis.md#17-multi-tenant-security-critical---kartisinfo-specific`
- **Common Workflows:** `/docs/infrastructure/baseRules-kartis.md#30-common-workflows-kartisinfo`
- **Testing Guide:** `/tests/README.md`
- **Deployment Guide:** `/docs/infrastructure/baseRules-kartis.md#26-deployment-checklist-railway`
- **Bug Tracking:** `/docs/bugs/bugs.md`
- **Golden Paths Registry:** `/docs/infrastructure/GOLDEN_PATHS.md`
- **System Invariants:** `/docs/infrastructure/invariants.md`

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection (Railway auto-provides)
- `JWT_SECRET` - Min 32 chars (generate: `openssl rand -base64 32`)
- `RESEND_API_KEY` - Email API key
- `EMAIL_FROM` - Verified domain email

**Optional:**
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXT_PUBLIC_BASE_URL` - Public URL (defaults to localhost:9000)

See `.env.example` for full reference.

### Database Connection

- **Local:** PostgreSQL in Docker on port 6000
- **Connection:** `postgres://ticketcap_user:ticketcap_password@localhost:6000/ticketcap`
- **Container:** `ticketcap-db`
- **Production:** Railway auto-provides `DATABASE_URL`

### Pre-Commit Checklist

Before committing ANY code:

- [ ] All tests pass (`npm test`)
- [ ] New tests added for new features/bug fixes
- [ ] Mobile tests pass (if UI changes: `npm run test:mobile`)
- [ ] No LOCKED paths violated (check `/docs/infrastructure/GOLDEN_PATHS.md`)
- [ ] No invariants broken (check `/docs/infrastructure/invariants.md`)
- [ ] Multi-tenant isolation enforced (if API changes)
- [ ] Bug documented (if bug fix: `/docs/bugs/bugs.md`)

### Getting Help

- **Development rules:** Read `/docs/infrastructure/baseRules-kartis.md`
- **Workflow examples:** See `/docs/infrastructure/baseRules-kartis.md#common-workflows`
- **Test patterns:** See `/tests/README.md`
- **Production deployment:** See `/docs/infrastructure/baseRules-kartis.md#deployment-checklist`

---

**Remember:** The PRIMARY development guide is `/docs/infrastructure/baseRules-kartis.md`. This file is just a quick reference and navigation document.
- never push unless i say so