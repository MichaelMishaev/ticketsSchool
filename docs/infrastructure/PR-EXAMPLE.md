# Pull Request Example: What to Expect

This document shows what your PRs will look like after CI/CD is configured.

---

## Example 1: Successful PR (All Checks Pass)

### PR #123: Add table duplication feature

**Status: ✅ Ready to merge**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pull Request #123                                              │
│  feat: Add table duplication feature                            │
│                                                                 │
│  by @developer → into main                                      │
└─────────────────────────────────────────────────────────────────┘

Description:
  Adds ability to duplicate tables when creating events,
  reducing setup time from 40 minutes to 2 minutes for
  large events.

  - Implements duplicate API endpoint
  - Adds UI button and modal
  - Includes smart auto-increment for table names
  - Adds E2E tests

Changes:
  +523 −12

Files changed:
  app/api/events/[id]/tables/[tableId]/duplicate/route.ts
  components/admin/TableCard.tsx
  tests/suites/07-table-management-p0.spec.ts

┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (30s)
   All TypeScript types valid

✅ quality-gates / Lint check (23s)
   No linting violations found

✅ quality-gates / Run P0 Critical Tests (8m 12s)
   65 tests passed
   0 tests failed

┌─────────────────────────────────────────────────────────────────┐
│  Review                                                         │
└─────────────────────────────────────────────────────────────────┘

@reviewer approved this pull request ✅
└─ Looks great! Smart implementation of auto-increment.

┌─────────────────────────────────────────────────────────────────┐
│  Merge Pull Request                                             │
│                                                                 │
│  [Merge pull request]  [Squash and merge]  [Rebase and merge]  │
│                                                                 │
│  ✅ All checks have passed                                      │
│  ✅ 1 approval from reviewers                                   │
│  ✅ All conversations resolved                                  │
└─────────────────────────────────────────────────────────────────┘
```

**What happened:**
1. Developer created PR
2. CI ran automatically
3. All checks passed in ~9 minutes
4. Reviewer approved
5. Merge button enabled
6. Developer merged to main

**Timeline:**
- 00:00 - PR created
- 00:09 - CI completed (all pass)
- 00:25 - Review completed (approved)
- 00:30 - Merged to main

**Total time:** 30 minutes from PR to production

---

## Example 2: Failed PR (Tests Fail)

### PR #124: Fix phone validation

**Status: ❌ Cannot merge - checks failed**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pull Request #124                                              │
│  fix: Update phone validation for international numbers         │
│                                                                 │
│  by @developer → into main                                      │
└─────────────────────────────────────────────────────────────────┘

Description:
  Updates phone validation to accept international format.
  Fixes issue where users with +972 prefix couldn't register.

Changes:
  +15 −8

Files changed:
  lib/validation.ts
  app/api/p/[schoolSlug]/[eventSlug]/register/route.ts

┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (28s)
   All TypeScript types valid

✅ quality-gates / Lint check (21s)
   No linting violations found

❌ quality-gates / Run P0 Critical Tests (7m 45s)
   62 tests passed
   3 tests failed

   Failed tests:
   • 04-public-registration-p0.spec.ts
     └─ registration with Israeli phone number (normalized)
   • 04-public-registration-p0.spec.ts
     └─ registration with international prefix
   • 06-multi-tenant-p0.spec.ts
     └─ phone number validation across schools

   [View details]  [Download artifacts]

┌─────────────────────────────────────────────────────────────────┐
│  CI Comment (bot)                                               │
└─────────────────────────────────────────────────────────────────┘

❌ Some tests failed. Please review the test report.

Failed tests:
• registration with Israeli phone number (normalized)
• registration with international prefix
• phone number validation across schools

View detailed test report in artifacts

┌─────────────────────────────────────────────────────────────────┐
│  Merge Pull Request                                             │
│                                                                 │
│  [Merge pull request] ← DISABLED                                │
│                                                                 │
│  ❌ Required status checks must pass before merging             │
└─────────────────────────────────────────────────────────────────┘
```

**What happened:**
1. Developer created PR
2. CI ran automatically
3. 3 tests failed
4. Merge button disabled
5. Developer needs to fix

**What the developer does:**

```bash
# 1. Download test artifacts from GitHub
# 2. Review screenshots to see what broke

# 3. Reproduce locally
npm test -- 04-public-registration-p0.spec.ts

# 4. See the actual error:
# Error: Expected phone "0501234567" but got "+972501234567"

# 5. Fix the code
# (Update validation to normalize both formats)

# 6. Verify fix
npm test  # All pass ✅

# 7. Push fix
git add .
git commit -m "fix: normalize international phone format correctly"
git push
```

**After fix pushed:**

```
┌─────────────────────────────────────────────────────────────────┐
│  Checks (Re-run #2)                                             │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (29s)
✅ quality-gates / Lint check (22s)
✅ quality-gates / Run P0 Critical Tests (8m 5s)
   65 tests passed ← All pass now!
   0 tests failed

┌─────────────────────────────────────────────────────────────────┐
│  Merge Pull Request                                             │
│                                                                 │
│  [Merge pull request]  ← NOW ENABLED ✅                         │
└─────────────────────────────────────────────────────────────────┘
```

**Timeline:**
- 00:00 - PR created
- 00:08 - CI failed
- 00:15 - Developer fixes locally
- 00:20 - Fix pushed
- 00:28 - CI passes
- 00:35 - Merged

**Total time:** 35 minutes (includes debugging)

---

## Example 3: Type Error (Quick Fix)

### PR #125: Add event description field

**Status: ❌ Cannot merge - type error**

```
┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

❌ quality-gates / Type check (32s)
   Type errors found

   Error: app/admin/events/new/page.tsx:42:15
   error TS2345: Argument of type 'string | undefined'
   is not assignable to parameter of type 'string'.

   Property 'description' is possibly 'undefined'.

✅ quality-gates / Lint check (21s)
   (Tests not run - type check failed first)

⚪ quality-gates / Run P0 Critical Tests
   (Skipped - previous checks failed)
```

**Quick fix:**

```typescript
// Before (error)
const description = formData.get('description')
await createEvent({ description })  // Error: might be undefined

// After (fixed)
const description = formData.get('description')
if (!description) {
  throw new Error('Description is required')
}
await createEvent({ description })  // OK: guaranteed string
```

**Timeline:**
- 00:00 - PR created
- 00:01 - CI fails (type check)
- 00:02 - Developer sees error immediately
- 00:03 - Quick fix
- 00:04 - Push fix
- 00:05 - CI passes

**Total time:** 5 minutes (very fast!)

---

## Example 4: Lint Violation (Auto-fix)

### PR #126: Add event capacity warning

**Status: ❌ Cannot merge - lint errors**

```
┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (30s)

❌ quality-gates / Lint check (24s)
   Lint violations found

   Error: components/admin/EventCard.tsx:15:7
   error 'remainingCapacity' is assigned a value but never used
   @typescript-eslint/no-unused-vars

   Warning: components/admin/EventCard.tsx:23:9
   warning Unexpected console statement
   no-console
```

**Auto-fix:**

```bash
# Run lint with auto-fix
npm run lint:fix

# Fixed:
# - Removed unused variable
# - Removed console.log

# Verify
npm run lint  # ✅ Pass

# Commit
git add .
git commit -m "fix: resolve lint violations"
git push
```

**Timeline:**
- 00:00 - PR created
- 00:01 - CI fails (lint)
- 00:02 - Auto-fix with `npm run lint:fix`
- 00:03 - Push fix
- 00:04 - CI passes

**Total time:** 4 minutes (automated fix!)

---

## Example 5: Mobile UI Bug

### PR #127: Update registration form layout

**Status: ❌ Cannot merge - mobile tests fail**

```
┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (29s)
✅ quality-gates / Lint check (22s)

❌ quality-gates / Run P0 Critical Tests (8m 30s)
   60 tests passed
   5 tests failed

   Failed tests (Mobile Chrome):
   • 08-ui-ux-p0.spec.ts
     └─ form should be usable on mobile (375px width)
   • 08-ui-ux-p0.spec.ts
     └─ submit button should be visible on mobile
   • 08-ui-ux-p0.spec.ts
     └─ input fields should be readable on mobile
   • 08-ui-ux-p0.spec.ts
     └─ touch targets should be at least 44px
   • 08-ui-ux-p0.spec.ts
     └─ form should scroll properly on small screens

   [Download screenshots] ← Shows mobile viewport
```

**Investigation:**

1. **Download artifacts**
   - Screenshot shows form cut off at 375px width
   - Submit button is only 32px tall (should be 44px)

2. **Reproduce locally**
   ```bash
   npm run test:mobile  # Run mobile tests
   ```

3. **Fix issues**
   ```css
   /* Before */
   .submit-button {
     height: 32px;  /* Too small for touch */
   }

   /* After */
   .submit-button {
     height: 48px;   /* 44px minimum + padding */
     min-height: 44px;
   }
   ```

4. **Test on real device**
   - Test on iPhone 12
   - Test on Pixel 5
   - Verify touch targets

5. **Push fix**
   ```bash
   git add .
   git commit -m "fix: improve mobile form usability"
   git push
   ```

**Timeline:**
- 00:00 - PR created
- 00:09 - CI fails (mobile tests)
- 00:15 - Download screenshots
- 00:25 - Fix CSS issues
- 00:35 - Test on real devices
- 00:40 - Push fix
- 00:49 - CI passes

**Total time:** 49 minutes (mobile testing takes longer)

---

## Example 6: Multi-Tenant Security Issue (CRITICAL)

### PR #128: Add bulk event export

**Status: ❌ BLOCKED - Security violation detected**

```
┌─────────────────────────────────────────────────────────────────┐
│  Checks                                                         │
└─────────────────────────────────────────────────────────────────┘

✅ quality-gates / Type check (31s)
✅ quality-gates / Lint check (23s)

❌ quality-gates / Run P0 Critical Tests (7m 20s)
   58 tests passed
   7 tests failed

   CRITICAL FAILURES:
   • 06-multi-tenant-p0.spec.ts
     └─ School A admin cannot access School B events
   • 06-multi-tenant-p0.spec.ts
     └─ Export endpoint enforces school isolation
   • 06-multi-tenant-p0.spec.ts
     └─ Bulk operations respect tenant boundaries

   ⚠️  SECURITY ISSUE DETECTED
   Data from multiple schools is leaking!

   [View details]  [Download trace]
```

**Investigation:**

```typescript
// Bug found in code:
export async function GET(request: Request) {
  const admin = await getCurrentAdmin()

  // WRONG - Missing schoolId filter! 🚨
  const events = await prisma.event.findMany({
    // No where clause = returns ALL events from ALL schools!
  })

  return NextResponse.json({ events })
}
```

**Fix:**

```typescript
// Correct implementation:
export async function GET(request: Request) {
  const admin = await getCurrentAdmin()

  // CORRECT - Enforce school isolation ✅
  if (admin.role !== 'SUPER_ADMIN' && !admin.schoolId) {
    return NextResponse.json(
      { error: 'Admin must have school assigned' },
      { status: 403 }
    )
  }

  const where: any = {}
  if (admin.role !== 'SUPER_ADMIN') {
    where.schoolId = admin.schoolId
  }

  const events = await prisma.event.findMany({ where })

  return NextResponse.json({ events })
}
```

**Why this is critical:**

- Without schoolId filter, School A can see School B's data
- This is a SECURITY VULNERABILITY
- Tests caught it before production!
- CI prevented merge of broken code

**Timeline:**
- 00:00 - PR created
- 00:08 - CI catches security issue
- 00:15 - Review security test failure
- 00:25 - Understand the bug
- 00:35 - Implement proper isolation
- 00:40 - Add additional tests
- 00:45 - Push fix
- 00:54 - CI passes

**Total time:** 54 minutes (worth it to prevent data leak!)

---

## Key Takeaways

### 1. Fast Feedback
- Type errors caught in ~30 seconds
- Lint errors in ~20 seconds
- Full tests in ~8 minutes
- Total: <10 minutes to know if PR is good

### 2. Clear Error Messages
- CI shows exactly what failed
- Artifacts include screenshots
- Stack traces pinpoint issues
- Easy to reproduce locally

### 3. Security First
- Multi-tenant tests prevent data leaks
- Atomic capacity tests prevent race conditions
- Can't bypass even if you're an admin
- Production stays secure

### 4. Mobile Friendly
- Tests run on mobile viewports
- Catches responsive design issues
- Touch target validation
- Real device testing recommended

### 5. Developer Experience
- Auto-fix for lint errors
- Clear instructions in failures
- Re-runs automatically on push
- No manual intervention needed

---

## Best Practices from Examples

### DO:
✅ Run tests locally before creating PR
✅ Fix failures immediately
✅ Add tests for security-critical code
✅ Test on mobile if UI changes
✅ Review screenshots in artifacts

### DON'T:
❌ Ask admin to bypass checks
❌ Ignore multi-tenant test failures
❌ Skip mobile testing
❌ Push without running tests locally
❌ Merge with failing tests

---

## Next Steps

1. **Create your first PR** and see CI in action
2. **Review the checks** when they complete
3. **Practice fixing failures** in a test PR
4. **Share learnings** with team

**See also:**
- [CI-CD-QUICK-START.md](./CI-CD-QUICK-START.md) - Developer guide
- [CI-CD.md](./CI-CD.md) - Complete documentation
- [CI-CD-VISUAL-GUIDE.md](./CI-CD-VISUAL-GUIDE.md) - Diagrams
