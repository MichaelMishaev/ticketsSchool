# CI/CD Quick Start Guide

## For Developers: What You Need to Know

### Before Creating a PR

**Run this checklist:**

```bash
# 1. Type check (30 seconds)
npx tsc --noEmit

# 2. Lint (20 seconds)
npm run lint

# 3. Run all tests (5-7 minutes)
npm test

# 4. If you changed UI, test on mobile (2-3 minutes)
npm run test:mobile
```

**All must pass ✅ before creating PR.**

---

### What CI Will Check

When you create a PR, GitHub Actions will automatically run:

1. **Type Check** - TypeScript compilation
2. **Lint Check** - Code style validation
3. **P0 Tests** - Critical test suite (all `tests/suites/*-p0.spec.ts` files)

**If any fail, your PR cannot be merged.** ❌

---

### If CI Fails

**Step 1: Check what failed**
- Go to PR → Scroll to "Checks" section
- Click "Details" next to red ❌

**Step 2: Fix locally**
```bash
# Reproduce the failure
npm test

# Fix the code
# ...

# Verify fix
npm test  # Must pass ✅
```

**Step 3: Push fix**
```bash
git add .
git commit -m "fix: resolve CI failure"
git push
```

CI will automatically re-run.

---

### Common CI Failures

#### Type Errors

```
error TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
```

**Fix:**
```typescript
// Add type guard
if (!value) throw new Error('Value required')
```

#### Lint Errors

```
error  'admin' is assigned a value but never used
```

**Fix:**
```typescript
// Remove or use the variable
// OR prefix with _ if intentionally unused
const _admin = getAdmin()
```

#### Test Failures

```
Error: expect(locator).toBeVisible()
```

**Fix:**
1. Run test locally with UI: `npm run test:ui`
2. See what's actually happening
3. Fix the code or update the test
4. Verify: `npm test`

---

### PR Checklist Template

Copy this into your PR description:

```markdown
## Pre-Merge Checklist

- [ ] All tests pass locally (`npm test`)
- [ ] Type check passes (`npx tsc --noEmit`)
- [ ] Lint passes (`npm run lint`)
- [ ] Tests added for new features
- [ ] Mobile tested (if UI changes)
- [ ] No console errors
- [ ] Bug documented (if bug fix)
```

---

### Nightly Tests

Every night at 2 AM UTC, a full test suite runs across all browsers:
- Desktop Chrome
- Mobile Chrome
- Mobile Safari

**If it fails:**
- You'll get a notification (Slack/email once configured)
- Fix within 24 hours
- Don't let test debt accumulate

---

### Best Practices

**DO:**
- ✅ Run tests before pushing
- ✅ Keep PRs small (easier to debug)
- ✅ Write tests as you code
- ✅ Fix CI failures immediately

**DON'T:**
- ❌ Create PR with failing tests
- ❌ Ask admin to force-merge
- ❌ Ignore flaky tests (fix them!)
- ❌ Bypass CI checks

---

### Need Help?

1. **Read full documentation:** `/docs/infrastructure/CI-CD.md`
2. **Check test guide:** `/tests/README.md`
3. **View test artifacts:** Download from GitHub Actions UI
4. **Ask team:** Create issue or Slack message

---

## For Repository Admins

### Enable Branch Protection (One-Time Setup)

**Step 1: Go to Settings**
```
Repository → Settings → Branches → Add rule
```

**Step 2: Configure for `main` branch**

**Branch name pattern:** `main`

**Enable these:**
- ✅ Require pull request before merging (1 approval)
- ✅ Require status checks to pass before merging
  - Required checks:
    - `quality-gates / Type check`
    - `quality-gates / Lint check`
    - `quality-gates / Run P0 Critical Tests`
- ✅ Require conversation resolution before merging

**Step 3: Repeat for `development` branch**

Same settings, but optionally allow 0 approvals for faster iteration.

**Step 4: Test it**
1. Create test PR
2. Verify CI runs automatically
3. Try to merge with failing tests (should be blocked)
4. Fix tests, verify merge is allowed

---

### Monitoring

**Weekly review:**
- Check CI success rate (target: >95%)
- Review failed nightly tests
- Monitor runtime (target: <10 minutes)

**Monthly review:**
- Update GitHub Actions dependencies
- Review test coverage progress
- Optimize slow tests

---

### Setting Up Notifications (Optional)

**Slack Notifications:**

1. Create Slack webhook: https://api.slack.com/apps
2. Add secret: `Repository Settings → Secrets → SLACK_WEBHOOK_URL`
3. Update `nightly-tests.yml` (see full CI-CD.md for code)

**Email Notifications:**

1. Go to: Repository → Watch → Custom
2. Enable: "Notify me when workflow run fails"

---

## Example: What a PR Looks Like

### ✅ Good PR (All checks pass)

```
✅ quality-gates / Type check
✅ quality-gates / Lint check
✅ quality-gates / Run P0 Critical Tests (chromium)

Merge pull request button: ENABLED ✅
```

### ❌ Bad PR (Tests fail)

```
✅ quality-gates / Type check
✅ quality-gates / Lint check
❌ quality-gates / Run P0 Critical Tests (chromium)
   - 3 tests failed
   - View details for error messages

Merge pull request button: DISABLED ❌
```

**Action required:** Fix tests before merge!

---

## Next Steps

1. ✅ Enable branch protection (admin only)
2. ✅ Configure notifications (Slack/email)
3. ✅ Educate team on CI workflow
4. ✅ Monitor and iterate

**Full documentation:** `/docs/infrastructure/CI-CD.md`
