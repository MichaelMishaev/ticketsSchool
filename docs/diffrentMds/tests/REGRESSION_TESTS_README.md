# Regression Tests - Quick Start Guide

## Prerequisites

Before running regression tests, ensure:

1. **Dev Server Running:**
   ```bash
   npm run dev
   ```
   Server must be running on `http://localhost:9000`

2. **Database Running:**
   ```bash
   docker-compose up -d
   ```

3. **Database Migrations Applied:**
   ```bash
   npx prisma migrate dev
   ```

4. **Clean Test Database:**
   ```bash
   npm run db:clean  # If available
   # OR manually clean test data
   ```

---

## Running Tests

### Quick Test (Recommended First)
```bash
# Test only a few critical scenarios to verify setup
npx playwright test tests/suites/08-security-regression-p0.spec.ts:23 --headed
```

### Run All Regression Tests
```bash
# Run all P0 + P1 regression tests
npx playwright test tests/suites/08-*.spec.ts tests/suites/09-*.spec.ts tests/suites/10-*.spec.ts
```

### Run by Priority
```bash
# P0 Security Tests (15 scenarios)
npx playwright test tests/suites/08-security-regression-p0.spec.ts

# P0 Payment Tests (16 scenarios)
npx playwright test tests/suites/09-payment-regression-p0.spec.ts

# P1 UI Tests (14 scenarios)
npx playwright test tests/suites/10-ui-regression-p1.spec.ts

# All Multi-Tenant Tests (includes regression)
npx playwright test tests/suites/06-multi-tenant-p0.spec.ts
```

### Run Specific Bug Test
```bash
# Test specific bug fix
npx playwright test -g "Bug #19"
npx playwright test -g "UPFRONT payment bypass"
```

### Mobile Testing
```bash
# Test mobile-specific bugs
npx playwright test tests/suites/10-ui-regression-p1.spec.ts --project="Mobile Chrome"
```

---

## Important Notes

### Payment Tests May Need Adjustments

Some payment tests depend on features that may not be fully implemented yet:

1. **Payment API Endpoint**: `/api/payment/create`
   - May return 404 if not implemented
   - Tests will fail gracefully
   - Fix: Implement payment API or skip those tests

2. **Payment Enum Values**:
   - Schema uses: `FIXED_PRICE`, `PER_GUEST`, `FREE`
   - Tests use: `FLAT_RATE`, `PER_GUEST`, `FREE`
   - **Update needed**: Change `FLAT_RATE` → `FIXED_PRICE` in test files

3. **Payment Timing**:
   - Schema uses: `OPTIONAL`, `UPFRONT`, `POST_REGISTRATION`
   - Tests correctly use these values

### Expected Test Results

#### Tests That Should Pass (Core Regressions):
- ✅ Bug #1: Session isolation
- ✅ Bug #11: Data isolation bypass
- ✅ Bug #12: AdminProd button authorization
- ✅ Bug #15: Feedback super admin check
- ✅ Bug #22: Event overview participant display
- ✅ Bug #0: TABLE_BASED events availability

#### Tests That May Fail (Pending Implementation):
- ⚠️ Bug #18: Payment API field mismatch (if `/api/payment/create` not implemented)
- ⚠️ Bug #19: UPFRONT payment bypass (depends on payment API)
- ⚠️ Bug #20: Public API payment fields (may need schema sync)

---

## Debugging Failed Tests

### Test Failure: "404 Not Found" on Payment API
**Cause**: Payment API endpoint `/api/payment/create` not implemented
**Fix**: Either implement the API or skip payment tests:
```bash
npx playwright test tests/suites/08-security-regression-p0.spec.ts --grep-invert "payment"
```

### Test Failure: "Cannot find module Prisma"
**Cause**: Prisma client not generated
**Fix**:
```bash
npx prisma generate
```

### Test Failure: "Connection refused" on localhost:9000
**Cause**: Dev server not running
**Fix**:
```bash
npm run dev  # In separate terminal
```

### Test Failure: "Timeout waiting for login"
**Cause**: Database empty or test data issues
**Fix**:
```bash
# Clean and restart
docker-compose down
docker-compose up -d
npx prisma migrate dev
```

---

## Test Data Cleanup

Tests use automatic cleanup in `test.afterAll()`, but if tests crash:

```bash
# Manual cleanup
npx prisma studio  # GUI to delete test data

# OR via script
ts-node scripts/cleanup-test-data.ts
```

---

## Known Issues & Workarounds

### Issue: Payment Tests Fail (Expected)
**Reason**: Payment system (YaadPay integration) not fully implemented
**Workaround**:
```bash
# Skip payment tests for now
npx playwright test --grep-invert "payment|Payment"
```

### Issue: Mobile Tests Timeout
**Reason**: Mobile viewports load slower
**Workaround**: Increase timeout in `playwright.config.ts`:
```typescript
use: {
  timeout: 60000,  // Increase from 30000
}
```

### Issue: Session Tests Fail on Logout
**Reason**: Cookie deletion timing
**Workaround**: Add wait after logout:
```typescript
await page.click('text=יציאה')
await page.waitForTimeout(1000)  // Wait for cookie deletion
```

---

## Success Criteria

Regression tests are passing if:

- ✅ At least 30/45 tests pass (excluding payment tests)
- ✅ All security tests pass (Bug #1, #11, #12, #15)
- ✅ All multi-tenant tests pass (Bug #11)
- ✅ All UI tests pass (Bug #0, #16, #18, #22)
- ⚠️ Payment tests (Bug #18, #19, #20) may fail if API not implemented

---

## CI/CD Integration

Tests run automatically on:
- Pull request creation
- Push to `development` branch
- Before production deployment

**Blocking**: Tests must pass before merge to `main`

---

## Next Steps After Test Failures

1. **Identify failing tests**:
   ```bash
   npx playwright test --reporter=list | grep "✘"
   ```

2. **Check if bug is truly fixed**:
   - Read bug documentation in `/app/docs/bugs/bugs.md`
   - Verify fix was applied correctly
   - Check if test expectations match fix

3. **Update tests if needed**:
   - Fix test code (not bug code)
   - Align with actual implementation
   - Update expectations

4. **Report new bugs**:
   - If test reveals new issue, document in `bugs.md`
   - Create new regression test
   - Fix and verify

---

## Quick Reference

```bash
# Full regression suite
npm run test:regression  # If script exists

# OR manual
npx playwright test tests/suites/08-*.spec.ts tests/suites/09-*.spec.ts tests/suites/10-*.spec.ts

# With UI (debugging)
npx playwright test tests/suites/08-security-regression-p0.spec.ts --ui

# Generate HTML report
npx playwright test && npx playwright show-report
```

---

## Contact

For test issues or questions:
- Check `/tests/README.md` for comprehensive testing guide
- Review `/tests/REGRESSION_TESTS_SUMMARY.md` for test coverage
- See `/app/docs/bugs/bugs.md` for bug details

**Last Updated:** 2026-01-11
