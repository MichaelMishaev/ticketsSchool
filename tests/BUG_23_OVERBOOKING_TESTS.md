# Bug #23 Overbooking Prevention - E2E Test Suite

## Overview

Comprehensive E2E test suite created to verify the fix for **Bug #23: Overbooking Prevention**.

**Issue**: The public registration form allowed users to select more spots than available, potentially causing overbooking.

**Fix Verification**: These tests ensure the spot selector dropdown is properly limited to available capacity.

---

## Test Suite Location

**File**: `/tests/suites/04-public-registration-p0.spec.ts`

**Test Group**: `[BUG #23] Overbooking Prevention - Spot Limit Enforcement`

**Total Tests**: 7 comprehensive scenarios

---

## Test Scenarios

### 1. Limit Dropdown to Available Capacity (7 spots available)
**Test**: `should limit spot dropdown to available capacity (7 spots available)`

**Scenario**:
- Event with capacity 20, already 13 reserved (7 available)
- User navigates to public registration page
- Spot dropdown should show max 7 options (1-7)

**Assertions**:
- ✅ Dropdown has ≤ 7 options
- ✅ No option value > 7 exists
- ✅ Manual input of 8 is limited/rejected

**Expected Behavior**: User cannot select more than 7 spots.

---

### 2. Prevent Selecting More Spots Than Available
**Test**: `should prevent selecting more spots than available`

**Scenario**:
- Event with capacity 10, already 5 reserved (5 available)
- User navigates to registration page
- Verify specific invalid options don't exist

**Assertions**:
- ✅ No option for 8 spots
- ✅ No option for 9 spots
- ✅ No option for 10 spots

**Expected Behavior**: Dropdown does NOT include options exceeding available capacity.

---

### 3. Limit Waitlist Registrations to Max 5 Spots
**Test**: `should limit waitlist registrations to max 5 spots`

**Scenario**:
- Event FULL (capacity 20, all 20 reserved)
- User goes to waitlist registration
- Waitlist should be limited to reasonable amount

**Assertions**:
- ✅ Max dropdown value ≤ 5
- ✅ Manual input of 10 is limited to ≤ 5

**Expected Behavior**: Even on waitlist, users can't request excessive spots.

---

### 4. Respect maxSpotsPerPerson Limit
**Test**: `should respect maxSpotsPerPerson limit even when more spots available`

**Scenario**:
- Event with capacity 20, 10 reserved (10 available)
- **maxSpotsPerPerson = 3** (admin constraint)
- User should be limited to 3 spots even though 10 are available

**Assertions**:
- ✅ Max dropdown value = 3
- ✅ No option for 4 spots
- ✅ No option for 5 spots

**Expected Behavior**: Admin-defined `maxSpotsPerPerson` takes precedence over available capacity.

---

### 5. Dynamic Update After Registration
**Test**: `should dynamically update available spots after registration`

**Scenario**:
- Event with capacity 10, 5 reserved (5 available)
- User 1 registers for 3 spots → 2 spots remain
- User 2 loads page → should see max 2 options

**Assertions**:
- ✅ User 1 confirms successfully
- ✅ User 2's dropdown shows max 2 options

**Expected Behavior**: Real-time capacity updates reflected in dropdown limits.

---

### 6. Event Full - Show Proper Message
**Test**: `should show "Event Full" when no spots available and prevent registration`

**Scenario**:
- Event FULL (capacity 10, all 10 reserved)
- User navigates to registration page
- Should either show "Event Full" or waitlist with limited spots

**Assertions**:
- ✅ Either shows "Event Full" message OR waitlist text
- ✅ If waitlist visible, dropdown limited to ≤ 5

**Expected Behavior**: Clear messaging when event is at capacity.

---

### 7. Edge Case: Exactly 1 Spot Remaining
**Test**: `should handle edge case: exactly 1 spot remaining`

**Scenario**:
- Event with capacity 10, 9 reserved (1 available)
- User should only see option for 1 spot

**Assertions**:
- ✅ Max dropdown value = 1
- ✅ No option for 2 spots

**Expected Behavior**: Handles edge case of single remaining spot correctly.

---

## Technical Implementation

### Test Data Builders Used
```typescript
import { createSchool, createEvent } from '../fixtures/test-data'
import { PublicEventPage } from '../page-objects/PublicEventPage'
import { generateEmail, generateIsraeliPhone } from '../helpers/test-helpers'
```

### New EventBuilder Method Added
```typescript
// Added to /tests/fixtures/test-data.ts
withMaxSpotsPerPerson(max: number) {
  this.data.maxSpotsPerPerson = max
  return this
}
```

**Usage Example**:
```typescript
const event = await createEvent()
  .withTitle('Limited Per Person Event')
  .withSchool(school.id)
  .withCapacity(20)
  .withSpotsReserved(10)
  .withMaxSpotsPerPerson(3) // NEW METHOD
  .inFuture()
  .create()
```

---

## Running the Tests

### Prerequisites
1. Start dev server: `npm run dev` (runs on port 9000)
2. Ensure PostgreSQL is running: `docker-compose up -d`

### Run All Bug #23 Tests
```bash
# Run only Bug #23 tests
npx playwright test tests/suites/04-public-registration-p0.spec.ts -g "BUG #23"

# Run with UI
npx playwright test tests/suites/04-public-registration-p0.spec.ts -g "BUG #23" --ui

# Run in headed mode (see browser)
npx playwright test tests/suites/04-public-registration-p0.spec.ts -g "BUG #23" --headed

# Run with debug
npx playwright test tests/suites/04-public-registration-p0.spec.ts -g "BUG #23" --debug
```

### Run Full P0 Public Registration Suite
```bash
# Run all public registration tests (includes Bug #23)
npx playwright test tests/suites/04-public-registration-p0.spec.ts

# Run all P0 critical tests
npx playwright test tests/suites/*-p0.spec.ts
```

---

## Test Coverage Summary

### What's Tested ✅
- [x] Dropdown limits match available capacity
- [x] Cannot select more spots than available
- [x] Waitlist registrations limited to max 5
- [x] `maxSpotsPerPerson` constraint respected
- [x] Dynamic capacity updates after registrations
- [x] Event full messaging
- [x] Edge case: exactly 1 spot remaining

### What's NOT Tested (Future)
- [ ] Concurrent registrations depleting last spots (covered in race condition tests)
- [ ] API-level validation (server-side enforcement)
- [ ] Mobile-specific dropdown behavior
- [ ] Accessibility screen reader announcements

---

## Expected Test Results

When Bug #23 fix is implemented correctly:
```
✅ 7 tests passing in "[BUG #23] Overbooking Prevention"
```

When Bug #23 is NOT fixed:
```
❌ Tests will FAIL with errors like:
   - Expected max value ≤ 7, but found 10
   - Options for 8, 9, 10 spots exist when they shouldn't
   - Waitlist allows 10+ spots
```

---

## Integration with Existing Tests

These tests are part of the **P0 Critical Public Registration suite**:

**File Structure**:
```
tests/suites/04-public-registration-p0.spec.ts
├── [04.2.1] Happy Path - Complete Registration
├── [04.2.2-2.5] Form Validation
├── [04.4.1-4.4] Atomic Capacity Enforcement
├── [04.5.1-5.4] Confirmation & Feedback
├── [04.6.1-6.4] Error Handling
├── [04.9.1-9.5] Mobile UX & Accessibility
└── [BUG #23] Overbooking Prevention ← NEW SECTION (7 tests)
```

**Total P0 Tests**: 27+ tests (20 existing + 7 new)

---

## Next Steps

1. **Run Tests to Verify Current State**:
   ```bash
   npm run dev  # Start server
   npx playwright test tests/suites/04-public-registration-p0.spec.ts -g "BUG #23"
   ```

2. **If Tests FAIL**: Bug #23 is still present, implement the fix in:
   - `/app/p/[schoolSlug]/[eventSlug]/page.tsx` (frontend dropdown logic)
   - `/app/api/p/[schoolSlug]/[eventSlug]/route.ts` (backend validation)

3. **If Tests PASS**: Bug #23 is already fixed, tests ensure no regression.

4. **Add to CI/CD**: These tests run automatically on every commit via GitHub Actions.

---

## Test Pattern Best Practices Used

✅ **Follows existing patterns** from suite
✅ **Uses test data builders** (SchoolBuilder, EventBuilder)
✅ **Uses page objects** (PublicEventPage)
✅ **Descriptive test names** (what is being tested)
✅ **Clear comments** (Setup, Action, Assert)
✅ **Cleanup handled** by `test.afterAll()`
✅ **Realistic scenarios** (7 spots, 5 spots, full event, edge cases)

---

## Files Modified

### 1. `/tests/suites/04-public-registration-p0.spec.ts`
**Changes**: Added 7 new tests in "[BUG #23] Overbooking Prevention" describe block

**Lines Added**: ~260 lines (408-660)

### 2. `/tests/fixtures/test-data.ts`
**Changes**: Added `withMaxSpotsPerPerson(max: number)` method to EventBuilder

**Lines Added**: 4 lines (275-278)

---

## Success Criteria

**All 7 tests must PASS** for Bug #23 to be considered fixed:

1. ✅ Limit dropdown to available capacity (7 spots)
2. ✅ Prevent selecting more spots than available (5 spots)
3. ✅ Limit waitlist to max 5 spots
4. ✅ Respect maxSpotsPerPerson constraint
5. ✅ Dynamic updates after registration
6. ✅ Event full messaging
7. ✅ Edge case: 1 spot remaining

---

## Contact

For questions or issues with these tests:
- Check `/tests/README.md` for test architecture
- Review `/CLAUDE.md` for project context
- Run `npm run test:ui` for interactive debugging

---

**Test Suite Created**: 2026-01-12
**Bug Reference**: Bug #23 (Overbooking Prevention)
**Test Framework**: Playwright
**Test Priority**: P0 (Critical)
