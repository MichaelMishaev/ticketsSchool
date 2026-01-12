# Critical Behavior Lock Tests

## What are Behavior Locks?

Behavior locks test **unchanged behavior**, not new features. They prevent "it works, but differently" regressions where implicit assumptions are violated.

**Examples:**
- "Events are always sorted newest first" → Behavior lock
- "New event creation returns full event object" → Behavior lock
- "Non-SuperAdmin can only see their school's data" → Behavior lock
- "Cancelled registrations don't count toward capacity" → Behavior lock

**NOT behavior locks:**
- Testing a new feature works
- Testing basic functionality (that's P0 tests)
- Testing edge cases (that's regular test suites)

## Why Behavior Locks Matter

Silent regressions are the worst kind of bugs:
- ✅ Code works (tests pass)
- ❌ But works differently (breaks user assumptions)

Example: Someone optimizes the events query and accidentally changes sort order from DESC to ASC. All tests pass, but users complain "my newest events disappeared!" The behavior lock would have caught this.

## Test Coverage (16 Critical Behaviors)

### 1. API Sort Order Locks (2 tests)
- ✅ Events list maintains `createdAt DESC` (newest first)
- ✅ Registrations list maintains `createdAt ASC` (first-come-first-served)

### 2. Tenant Isolation Locks (4 tests)
- ✅ Non-SuperAdmin queries auto-filter by schoolId (CRITICAL security)
- ✅ SuperAdmin can bypass schoolId filter
- ✅ Cross-school access attempts rejected with 403
- ✅ Admin without schoolId gets 403 with clear error

### 3. Soft Delete Behavior Locks (1 test)
- ✅ CANCELLED registrations excluded from spotsReserved count

### 4. API Response Shape Locks (3 tests)
- ✅ GET /api/events response shape unchanged
- ✅ POST /api/events returns complete created event object
- ✅ Error responses always include {error: string} shape

### 5. Permission Boundary Locks (4 tests)
- ✅ ADMIN can create events in their school
- ✅ MANAGER can view but cannot create events
- ✅ VIEWER has read-only access only
- ✅ SUPER_ADMIN retains full access to all resources

### 6. Side Effect Locks (2 tests)
- ✅ Creating registration increments spotsReserved counter
- ✅ Cancelling registration decrements spotsReserved counter

## Running the Tests

### Prerequisites
1. **Start dev server** (behavior locks test against running app):
   ```bash
   npm run dev
   ```

2. **Run tests in separate terminal**:
   ```bash
   # Run all behavior locks
   npx playwright test tests/critical/behavior-locks.spec.ts

   # Run with UI
   npx playwright test tests/critical/behavior-locks.spec.ts --ui

   # Run specific test
   npx playwright test tests/critical/behavior-locks.spec.ts -g "event list maintains"

   # Run on specific project
   npx playwright test tests/critical/behavior-locks.spec.ts --project=chromium
   ```

### Expected Results
- ✅ All 16 tests should PASS on main/development branch
- ⚠️ If any test FAILS, it indicates a behavior regression

## When to Update Behavior Locks

**ONLY update these tests when intentionally changing a locked behavior.**

### Example Scenario: Changing Sort Order

```typescript
// ❌ BAD: Silently changing behavior
// Someone changes events query to sort by title
const events = await prisma.event.findMany({
  orderBy: { title: 'asc' } // BREAKS BEHAVIOR LOCK
})
// Behavior lock test fails → Good! This would break user assumptions

// ✅ GOOD: Intentional change with documentation
// 1. Update the code
const events = await prisma.event.findMany({
  orderBy: { title: 'asc' }
})

// 2. Update the behavior lock test
test('event list maintains title ASC sort order', async () => {
  // Updated test...
})

// 3. Update test comments
/**
 * INVARIANT: Event list default sort order is title ASC
 * INTENT: Users expect alphabetical order
 * @owner backend-team
 * @created 2025-12-18
 * @changed 2025-12-19 - Changed from createdAt DESC to title ASC (PR #123)
 */

// 4. Document in commit message
git commit -m "feat: Change event sort order to alphabetical

BREAKING BEHAVIOR CHANGE:
- Old: Events sorted by createdAt DESC (newest first)
- New: Events sorted by title ASC (alphabetical)
- Reason: User feedback requested alphabetical sorting
- Updated behavior lock: tests/critical/behavior-locks.spec.ts"
```

## Integration with CI/CD

Add to `.github/workflows/test.yml`:

```yaml
- name: Run Behavior Lock Tests
  run: |
    npm run dev &
    sleep 10 # Wait for dev server
    npx playwright test tests/critical/behavior-locks.spec.ts
    kill %1 # Stop dev server
```

## Common Issues

### 1. "Connection Refused" Error
**Problem:** Dev server not running
**Solution:** Run `npm run dev` before tests

### 2. Tests Pass Locally but Fail in CI
**Problem:** Race conditions or timing issues
**Solution:** Add appropriate waits, increase timeouts

### 3. Behavior Lock Fails After Merge
**Problem:** Unintentional behavior change
**Solution:**
1. Review the change that caused the failure
2. Determine if behavior change was intentional
3. If unintentional: Revert the change
4. If intentional: Update behavior lock + document

## Maintenance

**Review quarterly:**
- Are all locked behaviors still critical?
- Are there new behaviors that should be locked?
- Are test names and comments accurate?

**When adding new behavior locks:**
1. Identify an implicit assumption users depend on
2. Write test that verifies EXACT behavior (not loose check)
3. Add INVARIANT, INTENT, BREAKING THIS comments
4. Update this README with new test count

## Test Structure

Each behavior lock test MUST include:

```typescript
/**
 * INVARIANT: What exact behavior is locked
 * INTENT: Why users depend on this behavior
 * BREAKING THIS: What would happen if this changed
 * @owner team-responsible-for-this-behavior
 * @created YYYY-MM-DD
 */
test('descriptive name of locked behavior', async () => {
  // Setup test data

  // Execute operation that depends on behavior

  // BEHAVIOR LOCK: Assert EXACT expected behavior
  expect(result).toEqual(exactExpectedValue) // Not .toContain, .toMatch, etc.
})
```

## Resources

- Behavior Lock Pattern: [Martin Fowler - Subcutaneous Testing](https://martinfowler.com/bliki/SubcutaneousTest.html)
- Implicit Assumptions: Tests that verify "how" not just "what"
- Regression Prevention: Catching "works differently" bugs

## Questions?

Ask in #qa-automation or review existing tests for patterns.
