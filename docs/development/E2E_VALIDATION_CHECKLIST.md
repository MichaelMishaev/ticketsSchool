# E2E Test Migration - Validation Checklist

**Date:** 2026-01-12
**Status:** Pre-Migration Validation

Use this checklist before and after migration to ensure successful transition.

---

## Pre-Migration Validation

### 1. Current Test Suite Status

- [ ] All 71 tests are passing
- [ ] No flaky tests blocking CI
- [ ] Dev server is running (`npm run dev`)
- [ ] Database is accessible

### 2. Backup & Safety

- [ ] Git working directory is clean (`git status`)
- [ ] Create backup branch: `git checkout -b backup-before-e2e-migration`
- [ ] Commit current state: `git commit -m "Backup before E2E migration"`
- [ ] Push backup: `git push -u origin backup-before-e2e-migration`

### 3. Environment Check

- [ ] Node.js version: 18+ (`node --version`)
- [ ] npm version: 9+ (`npm --version`)
- [ ] Playwright installed (`npx playwright --version`)
- [ ] All dependencies installed (`npm install`)

### 4. Documentation Review

- [ ] Read `E2E_TEST_MIGRATION_PLAN.md`
- [ ] Review `E2E_MIGRATION_SUMMARY.md`
- [ ] Understand `E2E_TEST_COMPARISON.md`

---

## Migration Execution

### Option A: Automated Script (Recommended)

```bash
# Run migration script
./scripts/migrate-e2e-tests.sh

# Expected output:
#   Active E2E tests:        10 (target: 10)
#   Archived tests:          56 (target: 56)
#   Integration candidates:  8 (target: 8)
```

### Option B: Manual Migration

Follow commands in `E2E_TEST_MIGRATION_PLAN.md` Step 1-7

---

## Post-Migration Validation

### 1. File Structure Verification

```bash
# Should output: 10
find tests -name "*.spec.ts" -not -path "tests/archived-e2e/*" -not -path "tests/integration/*" | wc -l

# Should output: 56
find tests/archived-e2e -name "*.spec.ts" | wc -l

# Should output: 8
find tests/integration -name "*.spec.ts" | wc -l
```

- [ ] Active tests: 10 files
- [ ] Archived tests: 56 files
- [ ] Integration tests: 8 files

### 2. Critical Test Files Exist

```bash
# Verify critical tests exist
ls -1 tests/critical/atomic-capacity.spec.ts
ls -1 tests/critical/multi-tenant-isolation.spec.ts
ls -1 tests/golden-path/admin-canary.spec.ts
ls -1 tests/golden-path/registration-canary.spec.ts
ls -1 tests/suites/04-public-registration-p0.spec.ts
ls -1 tests/suites/08-check-in-system-p0.spec.ts
ls -1 tests/suites/08-mobile-navigation-p0.spec.ts
ls -1 tests/suites/08-payment-integration-p0.spec.ts
ls -1 tests/suites/09-payment-regression-p0.spec.ts
ls -1 tests/suites/12-admin-logo-upload-p0.spec.ts
```

- [ ] All 10 critical test files exist
- [ ] No critical test was accidentally archived

### 3. Run Test Suite

```bash
# Run all critical tests
npm test
```

- [ ] All tests pass (0 failures)
- [ ] No new flaky tests
- [ ] Total runtime < 15 minutes
- [ ] No import errors

### 4. Run Canary Tests (Fast Smoke)

```bash
# Should complete in ~30 seconds
npx playwright test tests/golden-path/
```

- [ ] Admin canary passes
- [ ] Registration canary passes
- [ ] Runtime < 1 minute

### 5. Run Revenue-Critical Tests

```bash
# Payment tests
npx playwright test tests/suites/09-payment-regression-p0.spec.ts
npx playwright test tests/suites/08-payment-integration-p0.spec.ts

# Registration test
npx playwright test tests/suites/04-public-registration-p0.spec.ts

# Check-in test
npx playwright test tests/suites/08-check-in-system-p0.spec.ts
```

- [ ] Payment regression passes
- [ ] Payment integration passes
- [ ] Public registration passes
- [ ] Check-in system passes

### 6. Run Security-Critical Tests

```bash
# Multi-tenant isolation
npx playwright test tests/critical/multi-tenant-isolation.spec.ts

# File upload security
npx playwright test tests/suites/12-admin-logo-upload-p0.spec.ts

# Atomic capacity (race conditions)
npx playwright test tests/critical/atomic-capacity.spec.ts
```

- [ ] Multi-tenant isolation passes
- [ ] File upload security passes
- [ ] Atomic capacity passes

---

## Git Commit & Documentation

### 1. Stage Changes

```bash
git add tests/
git add docs/development/
git add scripts/migrate-e2e-tests.sh
```

### 2. Commit Migration

```bash
git commit -m "refactor(tests): reduce E2E tests from 71 to 10 critical flows

- Archive 56 redundant/debug/UI-only tests
- Keep 10 revenue-critical and security-critical tests
- Move 8 tests to integration test candidates
- Estimated CI time savings: 75% (40min → 10min)
- See docs/development/E2E_TEST_MIGRATION_PLAN.md for details"
```

### 3. Update CI Configuration

Edit `.github/workflows/test.yml`:

```yaml
# Before
- name: Run E2E tests
  run: npm test

# After (add fast canary check)
- name: Run Canary Tests (Fast Feedback)
  run: npx playwright test tests/golden-path/

- name: Run Critical E2E Tests
  run: npm test
```

- [ ] CI config updated
- [ ] Commit CI changes
- [ ] Push to branch

---

## Monitoring (Week 1-2)

### Daily Checks

- [ ] CI pipeline passes consistently
- [ ] No production incidents related to untested features
- [ ] Developer feedback on test suite

### Weekly Review

- [ ] Review CI execution times (target: <10 min)
- [ ] Check flaky test rate (target: <5%)
- [ ] Monitor production errors (should be unchanged)
- [ ] Collect developer satisfaction feedback

---

## Success Metrics (After 2 Weeks)

### Performance

- [ ] CI time reduced by >70% (before: 40min, after: <12min)
- [ ] Flaky test rate <5% (before: 15-20%)
- [ ] False positive rate minimal

### Quality

- [ ] Zero critical bugs missed by reduced suite
- [ ] No production incidents from untested scenarios
- [ ] Test coverage remains adequate

### Developer Experience

- [ ] Faster feedback loop
- [ ] Less time debugging flaky tests
- [ ] Easier to maintain test suite

---

## Rollback Procedure (If Needed)

If migration causes critical issues:

### 1. Restore All Tests

```bash
# Quick rollback
cp -r tests/archived-e2e/* tests/

# Or restore from backup branch
git checkout backup-before-e2e-migration tests/
```

### 2. Restore CI Config

```bash
git checkout backup-before-e2e-migration .github/workflows/test.yml
```

### 3. Verify Rollback

```bash
# Should output: 71
find tests -name "*.spec.ts" | wc -l

# Run full suite
npm test
```

---

## Next Steps After Successful Migration

### Week 3-4: Optimization

- [ ] Convert integration test candidates to Jest unit tests
- [ ] Set up Percy or Chromatic for visual regression
- [ ] Document new test strategy in `tests/README.md`

### Month 2: Cleanup

- [ ] Review archived tests (ensure nothing critical was missed)
- [ ] Update team documentation
- [ ] Train team on new test strategy

### Day 90: Final Cleanup

- [ ] Delete `tests/archived-e2e/` (after 90-day safety period)
- [ ] Delete backup branch `backup-before-e2e-migration`
- [ ] Archive migration documentation

---

## Approval Sign-Off

### Pre-Migration Approval

- [ ] Technical Lead: ************\_************
- [ ] QA Lead: ************\_************
- [ ] Product Owner: ************\_************

**Date:** ************\_************

### Post-Migration Verification

- [ ] All tests passing: Yes / No
- [ ] CI time reduced: Yes / No (before: ***min, after: ***min)
- [ ] No critical issues: Yes / No

**Verified By:** ************\_************
**Date:** ************\_************

---

## Support & Troubleshooting

### Common Issues

**Issue:** Test imports fail after migration
**Solution:** Run `npm install` and `npx playwright install`

**Issue:** "Cannot find module" errors
**Solution:** Update import paths in remaining tests

**Issue:** Tests pass locally but fail in CI
**Solution:** Check CI environment variables and database state

**Issue:** Higher flaky test rate after migration
**Solution:** Review test isolation, may need to add more cleanup

### Getting Help

- Slack: #qa-team or #engineering
- Email: qa-lead@company.com
- Documentation: `tests/README.md`

---

**Document Version:** 1.0
**Created:** 2026-01-12
**Author:** Claude Code (AI Agent)
