# Behavior Lock Tests - Quick Start Guide

## What You Need to Know in 60 Seconds

### What are behavior locks?
Tests that verify **"it works THE SAME WAY"** not just **"it works"**

### Why do we need them?
Prevent silent regressions where code works but differently, breaking user assumptions.

### When do they run?
- Every PR (should be in CI/CD)
- Before deploying to production
- After any backend API changes

## Running the Tests

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Run behavior locks
npx playwright test tests/critical/behavior-locks.spec.ts
```

**Expected:** All 16 tests pass ✅

## What's Locked? (16 Critical Behaviors)

| Category | Count | Risk Level |
|----------|-------|------------|
| API Sort Order | 2 | Standard |
| Multi-Tenant Isolation | 4 | **CRITICAL** |
| Soft Delete | 1 | Standard |
| API Response Shape | 3 | Standard |
| Permission Boundaries | 4 | High |
| Side Effects (Atomic) | 2 | High |

## When a Behavior Lock Fails

### ❌ Test Failed - Now What?

1. **STOP** - Don't ignore it
2. **Check:** Was the behavior change intentional?
   - **NO** → Revert your changes (you broke something)
   - **YES** → Update the test + document the change

3. **If intentional change:**
   ```bash
   # Update the test to expect new behavior
   # Update LOCKED_BEHAVIORS.md with @changed annotation
   # Commit with clear message:
   git commit -m "feat: Change event sort order to alphabetical

   BREAKING BEHAVIOR CHANGE:
   - Old: createdAt DESC
   - New: title ASC
   - Updated behavior lock test"
   ```

## Common Scenarios

### "I changed the API response shape"
→ Update `API Response Shape Locks` test
→ Document in LOCKED_BEHAVIORS.md
→ Update API documentation

### "I changed how multi-tenant filtering works"
→ ⚠️ HIGH RISK - Get security team review
→ Update `Tenant Isolation Locks` test
→ Thorough testing required

### "I changed permission logic"
→ Update `Permission Boundary Locks` test
→ Update RBAC documentation
→ Test all affected roles

## File Locations

```
tests/critical/
├── behavior-locks.spec.ts     # 16 tests (927 lines)
├── README.md                   # Full documentation
├── LOCKED_BEHAVIORS.md         # Registry of all locked behaviors
└── QUICK_START.md              # This file
```

## Key Principles

1. **Exact assertions** - Use `.toEqual()` not `.toContain()`
2. **Test the "how"** - Not just the "what"
3. **Document changes** - When updating behavior locks
4. **Security first** - Multi-tenant tests are CRITICAL

## Red Flags

❌ Test fails but you didn't change anything → Race condition or timing issue
❌ Test fails in CI but passes locally → Environment difference
❌ Test fails after merge → Unintentional behavior change

## Questions?

Read full docs: `tests/critical/README.md`
View locked behaviors: `tests/critical/LOCKED_BEHAVIORS.md`
Ask: #qa-automation channel

---

**Remember:** Behavior locks prevent the worst kind of bugs - ones where everything "works" but users are confused because it works differently. Keep them passing! ✅
