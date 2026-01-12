# Multi-School System Migration Guide

## Overview

This guide will help you migrate your existing single-school ticketing system to a multi-school architecture.

## What's New?

### 1. **School Model**
- Each school has: name, slug, logo, primaryColor
- Schools can be activated/deactivated
- All events are now linked to a school

### 2. **Admin Model**
- Replaces old sessionStorage authentication
- Two roles: `SUPER_ADMIN` and `SCHOOL_ADMIN`
- Super admins can manage all schools
- School admins can only manage their school's events

### 3. **Automation Tool**
- CLI tool for managing schools and admins
- Quick commands for common operations
- Seed script for initial setup

---

## Step-by-Step Migration

### Step 1: Install Dependencies

```bash
npm install
```

This installs `bcryptjs` and `tsx` needed for the new auth system.

### Step 2: Generate Prisma Migration

```bash
npx prisma migrate dev --name add-multi-school-support
```

This will:
- Create `School` and `Admin` tables
- Add `schoolId` to `Event` table
- Create necessary indexes

### Step 3: Seed Initial Data

```bash
npm run school:seed
```

This will:
1. Create default "Beeri School"
2. Create super admin account
3. Create school admin for Beeri
4. Migrate all existing events to Beeri school

**Default Credentials (CHANGE IN PRODUCTION!):**

```
Super Admin:
  Email: superadmin@ticketsschool.com
  Password: admin123

Beeri School Admin:
  Email: admin@beeri.com
  Password: beeri123
```

### Step 4: Test Login

1. Go to `/admin/login`
2. Login with one of the accounts above
3. Verify you can access the admin panel

---

## Automation Tool Usage

### Available Commands

```bash
# List all schools
npm run school -- list

# Create a new school
npm run school -- create "Herzl School" herzl --color "#3b82f6" --logo "https://example.com/logo.png"

# Create a super admin
npm run school -- create-admin superadmin@school.com "Super Admin" password123

# Create a school admin
npm run school -- create-admin admin@herzl.com "Herzl Admin" password123 herzl

# Migrate existing events to a school
npm run school -- migrate-events herzl

# Run complete seed (initial setup)
npm run school:seed
```

### Examples

**Creating a new school:**

```bash
npm run school -- create "Rabin High School" rabin --color "#10b981"
```

**Adding an admin to that school:**

```bash
npm run school -- create-admin admin@rabin.com "Rabin Admin" secure123 rabin
```

**Viewing all schools:**

```bash
npm run school -- list
```

Output:
```
📋 Listing all schools...

1. Beeri School ✓
   Slug: beeri
   Color: #10b981
   Events: 5
   Admins: 1
   Created: 11/7/2025

2. Herzl School ✓
   Slug: herzl
   Color: #3b82f6
   Events: 0
   Admins: 1
   Created: 11/7/2025

📊 Total schools: 2
```

---

## What Changed?

### Authentication

**Before:**
- Simple username/password in sessionStorage
- No database validation
- No roles

**After:**
- Email/password with bcrypt hashing
- Database-backed authentication
- Role-based access control (RBAC)
- Secure HTTP-only cookies

### Admin Panel

**Before:**
- All admins see all events
- No school context

**After:**
- School admins see only their school's events
- Super admins see all schools
- School branding in navigation

### Public Event Pages

**Before:**
- `/p/{slug}` with no school context

**After:**
- `/p/{slug}` (unchanged URL! Backward compatible)
- School logo and color shown on event page
- School name displayed

---

## SuperAdmin Features

### School Management

Navigate to `/superadmin/schools` (coming soon) to:
- Create new schools
- Edit school branding (logo, color)
- Deactivate schools
- View school statistics

### Admin Management

Navigate to `/superadmin/admins` (coming soon) to:
- Create new admins
- Assign admins to schools
- Promote admins to super admin
- Reset admin passwords

### Global View

- View all events across all schools
- Filter by school
- Global statistics dashboard

---

## Security Notes

### Password Hashing

All passwords are hashed with bcrypt (10 rounds). Never store plain passwords.

### Session Management

- Sessions stored in HTTP-only cookies
- 7-day expiration
- Base64-encoded (use proper JWT in production)

### Role-Based Access

```typescript
// Super admin required
const admin = await requireSuperAdmin()

// Any admin required
const admin = await requireAdmin()

// Access to specific school required
const admin = await requireSchoolAccess(schoolId)
```

---

## Troubleshooting

### "School not found" error

Make sure you created the school first:

```bash
npm run school -- create "School Name" school-slug
```

### Login not working

1. Check database connection
2. Verify migration ran successfully
3. Check if admin was created: `npm run school -- list`
4. Try resetting password by creating admin again

### Events not showing

If school admin sees no events:
1. Check events have correct `schoolId`
2. Run migration script: `npm run school -- migrate-events <school-slug>`

---

## Rollback (Emergency)

If something goes wrong, you can rollback:

```bash
npx prisma migrate resolve --rolled-back <migration-name>
```

Then fix issues and re-run migration.

---

## Next Steps

1. **Change default passwords!** (production)
2. Create additional schools as needed
3. Assign school admins
4. Test multi-school functionality
5. Update branding (logos, colors)

---

## Support

For issues or questions, refer to:
- Prisma docs: https://www.prisma.io/docs
- Project README.md
- Check logs in browser console and server terminal
