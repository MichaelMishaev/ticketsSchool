# Multi-School Implementation Status

## ✅ COMPLETED (Phase 1 - Core Infrastructure)

### 1. Database Schema ✅
- **File:** `prisma/schema.prisma`
- Added `School` model (name, slug, logo, primaryColor)
- Added `Admin` model (email, password, role, schoolId)
- Added `schoolId` foreign key to `Event` model
- Added proper indexes for performance
- Prisma client generated successfully

### 2. Authentication System ✅
- **File:** `lib/auth.ts`
- Replaced sessionStorage with database-backed auth
- Implemented bcrypt password hashing
- HTTP-only cookie sessions (7-day expiration)
- Role-based functions:
  - `requireAdmin()` - any authenticated admin
  - `requireSuperAdmin()` - super admin only
  - `requireSchoolAccess(schoolId)` - validates school access
- Client-side auth helpers

### 3. Admin Login ✅
- **Files:**
  - `app/api/admin/login/route.ts` - Updated to use new auth
  - `app/api/admin/logout/route.ts` - New logout endpoint
  - `app/admin/login/page.tsx` - Changed to email-based login
  - `app/admin/layout.tsx` - Updated logout handling

### 4. Automation CLI Tool ✅
- **File:** `scripts/school-manager.ts`
- Commands:
  - `npm run school -- list` - List all schools
  - `npm run school -- create <name> <slug>` - Create school
  - `npm run school -- create-admin <email> <name> <pass> [school]` - Create admin
  - `npm run school -- migrate-events <school-slug>` - Migrate events
  - `npm run school:seed` - Initial setup with default data
- Beautiful colored CLI output
- Comprehensive error handling

### 5. Documentation ✅
- **File:** `MIGRATION_GUIDE.md`
- Complete migration instructions
- CLI usage examples
- Troubleshooting guide
- Security notes

### 6. Dependencies ✅
- Installed `bcryptjs` for password hashing
- Installed `tsx` for TypeScript script execution
- Installed type definitions

---

## 🚧 TODO (Phase 2 - API Routes)

### 1. Update Event API Routes ⏳

**File:** `app/api/events/route.ts`

```typescript
// GET - Filter events by admin's school
export async function GET(request: NextRequest) {
  const admin = await getCurrentAdmin()

  const where: any = {}
  if (admin.role === 'SCHOOL_ADMIN' && admin.schoolId) {
    where.schoolId = admin.schoolId
  }
  if (admin.role === 'SUPER_ADMIN') {
    const schoolId = url.searchParams.get('schoolId')
    if (schoolId) where.schoolId = schoolId
  }

  const events = await prisma.event.findMany({ where, ... })
  return NextResponse.json(events)
}

// POST - Set schoolId when creating event
export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  const data = await request.json()

  let schoolId = data.schoolId
  if (admin.role === 'SCHOOL_ADMIN') {
    schoolId = admin.schoolId  // Force school admin's school
  }

  const event = await prisma.event.create({
    data: { ...data, schoolId, slug: generateSlug() }
  })
  return NextResponse.json(event)
}
```

**File:** `app/api/events/[id]/route.ts`

```typescript
// GET/PATCH/DELETE - Verify school access
export async function GET/PATCH/DELETE(request, { params }) {
  const admin = await getCurrentAdmin()
  const event = await prisma.event.findUnique({
    where: { id: params.id },
    include: { school: true }
  })

  // Verify access
  if (admin.role === 'SCHOOL_ADMIN' && admin.schoolId !== event.schoolId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ... rest of logic
}
```

---

## 🚧 TODO (Phase 3 - SuperAdmin UI)

### 1. SuperAdmin School Management ⏳

**File:** `app/superadmin/schools/page.tsx`

Features:
- List all schools with stats (events count, admins count)
- Create new school button
- Edit school (logo, color, name)
- Deactivate/activate school
- View school details

**File:** `app/superadmin/schools/new/page.tsx`

Form fields:
- School name
- Slug (auto-generate from name)
- Primary color picker
- Logo upload/URL
- Active toggle

**File:** `app/superadmin/schools/[id]/edit/page.tsx`

- Edit school details
- Assign/remove admins
- View school statistics

### 2. SuperAdmin Admin Management ⏳

**File:** `app/superadmin/admins/page.tsx`

Features:
- List all admins
- Filter by school
- Create new admin
- Edit admin (change school, role)
- Reset password

### 3. SuperAdmin Layout ⏳

**File:** `app/superadmin/layout.tsx`

- Navigation: Schools, Admins, Events, Stats
- School filter dropdown (affects all views)
- Breadcrumbs
- Require super admin middleware

---

## 🚧 TODO (Phase 4 - School Admin Updates)

### 1. Update Admin Dashboard ⏳

**File:** `app/admin/page.tsx`

- Show only current school's stats
- Display school name/logo in header
- Filter dashboard widgets by schoolId

### 2. Update Admin Events List ⏳

**File:** `app/admin/events/page.tsx`

- Filter events by admin's schoolId
- Show school context in breadcrumb

### 3. Update Event Creation ⏳

**File:** `app/admin/events/new/page.tsx`

- Auto-set schoolId from admin's school
- Remove school selector for school admins
- Show school context

---

## 🚧 TODO (Phase 5 - Public Pages)

### 1. Add School Branding to Event Pages ⏳

**File:** `app/p/[slug]/page.tsx`

```typescript
const event = await prisma.event.findUnique({
  where: { slug },
  include: { school: true }
})

// Apply school branding
<div style={{
  background: `linear-gradient(to br, ${event.school.primaryColor}20, ...)`
}}>
  <div className="flex items-center gap-3">
    {event.school.logo && (
      <img src={event.school.logo} className="w-12 h-12" />
    )}
    <div>
      <div className="text-sm text-gray-500">{event.school.name}</div>
      <h1>{event.title}</h1>
    </div>
  </div>
</div>
```

---

## 🎯 IMMEDIATE NEXT STEPS

### 1. Run Migration (REQUIRED!)

```bash
# This creates the database tables
npx prisma migrate dev --name add-multi-school-support
```

### 2. Seed Initial Data

```bash
# This creates default school and admins
npm run school:seed
```

### 3. Test Login

1. Go to `http://localhost:9000/admin/login`
2. Login with:
   - Email: `admin@beeri.com`
   - Password: `beeri123`
3. Verify admin panel loads

### 4. Update Event API Routes

Follow the examples in "TODO (Phase 2)" above to add school filtering.

---

## 📊 Progress Summary

| Phase | Status | Completion |
|-------|--------|------------|
| Phase 1: Core Infrastructure | ✅ Complete | 100% |
| Phase 2: API Routes | ⏳ Pending | 0% |
| Phase 3: SuperAdmin UI | ⏳ Pending | 0% |
| Phase 4: School Admin Updates | ⏳ Pending | 0% |
| Phase 5: Public Pages | ⏳ Pending | 0% |

**Overall Progress: ~20%**

---

## 🚀 Estimated Remaining Time

- **Phase 2 (API Routes):** ~1 hour
- **Phase 3 (SuperAdmin UI):** ~2-3 hours
- **Phase 4 (School Admin Updates):** ~1 hour
- **Phase 5 (Public Pages):** ~30 minutes

**Total Remaining: ~5 hours of development**

---

## 🔒 Security Checklist

- [x] Password hashing with bcrypt
- [x] HTTP-only cookies
- [x] Role-based access control
- [ ] CSRF protection (add for production)
- [ ] Rate limiting on login (add for production)
- [ ] Proper JWT signing (currently base64, upgrade for production)
- [ ] Environment variable validation

---

## 📝 Notes

- **Backward Compatible:** Public URLs (`/p/{slug}`) unchanged
- **No Breaking Changes:** Existing QR codes still work
- **Migration Safe:** Can rollback if needed
- **Minimal Dependencies:** Only added bcryptjs and tsx
- **Simple Architecture:** 2 new models, clean separation

---

## 🎉 Ready to Test!

Run these commands:

```bash
# 1. Generate migration
npx prisma migrate dev --name add-multi-school-support

# 2. Seed data
npm run school:seed

# 3. Start dev server
npm run dev

# 4. Login at http://localhost:9000/admin/login
```

Default credentials:
- Email: `admin@beeri.com`
- Password: `beeri123`

**IMPORTANT: Change passwords in production!**
