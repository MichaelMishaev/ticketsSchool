# Branch Protection Setup Instructions

## For Repository Administrators

This guide walks you through enabling branch protection rules for TicketCap to enforce quality gates.

---

## Prerequisites

- Repository admin access
- CI/CD workflows already configured (`.github/workflows/pr-checks.yml` exists)
- At least one successful workflow run (to see available status checks)

---

## Step-by-Step Setup

### Step 1: Navigate to Branch Settings

1. Go to your GitHub repository
2. Click **Settings** (top navigation)
3. Click **Branches** (left sidebar)
4. Click **Add rule** (under "Branch protection rules")

### Step 2: Configure Main Branch Protection

#### Branch Name Pattern
```
main
```

#### Settings to Enable

**1. Require a pull request before merging**
- ✅ Check this box
- Set **Require approvals** to: `1`
- ✅ Check **Dismiss stale pull request approvals when new commits are pushed**
- ⬜ Leave **Require review from Code Owners** unchecked (unless you have CODEOWNERS file)
- ⬜ Leave **Restrict who can dismiss pull request reviews** unchecked

**2. Require status checks to pass before merging**
- ✅ Check this box
- ✅ Check **Require branches to be up to date before merging**
- In the search box, find and select these status checks:
  - `quality-gates / Type check`
  - `quality-gates / Lint check`
  - `quality-gates / Run P0 Critical Tests`

  **Note:** These will only appear after the workflow has run at least once. If you don't see them:
  1. Create a test PR to trigger the workflow
  2. Wait for workflow to complete
  3. Come back to this settings page
  4. The checks should now appear in the search

**3. Require conversation resolution before merging**
- ✅ Check this box
- This ensures all PR comments are resolved before merge

**4. Require linear history** (Optional but Recommended)
- ✅ Check this box
- Prevents merge commits, keeps git history clean
- Forces rebase or squash merges

**5. Do not allow bypassing the above settings**
- ✅ Check this box
- Applies rules to administrators too
- Critical for security

**6. Settings to LEAVE UNCHECKED**
- ⬜ Require deployments to succeed before merging (not needed for main)
- ⬜ Lock branch (too restrictive)
- ⬜ Do not allow force pushes (automatically enforced by PR requirement)
- ⬜ Allow deletions (dangerous for main branch)

#### Click "Create" or "Save changes"

---

### Step 3: Configure Development Branch Protection

Repeat Step 2 with these changes:

#### Branch Name Pattern
```
development
```

#### Modified Settings

**Require approvals:**
- Set to `0` (allows self-merge for faster iteration)
- OR set to `1` if you want peer review even in development

**All other settings:** Same as `main` branch

#### Click "Create"

---

### Step 4: Verify Protection Rules

1. Go to **Settings → Branches**
2. You should see two rules:
   ```
   main
   └─ Status checks required: 3
   └─ Require pull request: Yes
   └─ Require approvals: 1

   development
   └─ Status checks required: 3
   └─ Require pull request: Yes
   └─ Require approvals: 0 (or 1)
   ```

---

## Testing Branch Protection

### Test 1: Try to Push Directly (Should Fail)

```bash
# Attempt to push directly to main
git checkout main
git commit --allow-empty -m "test: verify protection"
git push origin main
```

**Expected result:**
```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Cannot push directly to protected branch
```

✅ **Success!** Branch is protected.

### Test 2: Create PR with Failing Tests (Should Block Merge)

1. Create a test branch:
   ```bash
   git checkout -b test-branch-protection
   ```

2. Break a test intentionally:
   ```typescript
   // In any test file, add:
   test('this will fail', async () => {
     expect(true).toBe(false)
   })
   ```

3. Commit and push:
   ```bash
   git add .
   git commit -m "test: intentional failure"
   git push -u origin test-branch-protection
   ```

4. Create PR on GitHub

5. Wait for CI to run

**Expected result:**
- ✅ Type check passes
- ✅ Lint check passes
- ❌ Run P0 Critical Tests fails
- **Merge button is DISABLED** with message: "Required status checks must pass before merging"

✅ **Success!** Quality gates are working.

6. Clean up:
   - Close the PR
   - Delete the test branch

### Test 3: Create PR with Passing Tests (Should Allow Merge)

1. Create a test branch:
   ```bash
   git checkout -b test-branch-protection-success
   ```

2. Make a trivial change:
   ```bash
   echo "# Test" >> README.md
   git add README.md
   git commit -m "docs: test branch protection"
   git push -u origin test-branch-protection-success
   ```

3. Create PR on GitHub

4. Wait for CI to run

**Expected result:**
- ✅ Type check passes
- ✅ Lint check passes
- ✅ Run P0 Critical Tests passes
- **Merge button is ENABLED** (after 1 approval if configured)

✅ **Success!** Branch protection is fully working!

5. Clean up:
   - Close the PR (or merge if you want)
   - Delete the test branch

---

## What Happens After Setup

### For Developers

**Before branch protection:**
```bash
git checkout main
git pull
# Make changes
git commit -m "quick fix"
git push origin main  # ✅ Works (but dangerous!)
```

**After branch protection:**
```bash
git checkout main
git pull
# Make changes
git commit -m "quick fix"
git push origin main  # ❌ Fails - must create PR

# Instead:
git checkout -b fix/issue-123
git commit -m "fix: resolve issue"
git push -u origin fix/issue-123
# Then create PR on GitHub
```

### For PRs

**What gets blocked:**
- PRs with type errors
- PRs with linting violations
- PRs with failing tests
- PRs without required approvals (if configured)
- PRs with unresolved conversations

**What gets allowed:**
- PRs where all status checks pass
- PRs with required approvals
- PRs with all conversations resolved

---

## Troubleshooting

### "Status checks not appearing in search"

**Problem:** Can't find `quality-gates / Type check` etc. in the status check search box.

**Solution:**
1. The workflow must run at least once before checks appear
2. Create a test PR to trigger the workflow
3. Wait for workflow to complete
4. Refresh the branch protection settings page
5. The checks should now appear

### "Can't push to main even with PR"

**Problem:** Getting error when trying to merge PR.

**Cause:** All status checks must pass before merge is allowed.

**Solution:**
1. Check PR "Checks" tab
2. Find which check failed
3. Fix the issue locally
4. Push fix to PR branch
5. Wait for checks to re-run

### "Need to bypass protection for emergency"

**Problem:** Need to push critical hotfix immediately.

**⚠️ NOT RECOMMENDED:** Disabling branch protection is dangerous.

**Better approach:**
1. Create PR as normal
2. Fix will take same time whether you bypass or not
3. If tests fail, fix is probably broken anyway
4. Get teammate to review while tests run (parallel work)
5. Merge as soon as tests pass

**If you MUST bypass (last resort):**
1. Settings → Branches → Edit rule for `main`
2. Uncheck "Do not allow bypassing the above settings"
3. Save changes
4. You can now merge despite failing checks (not recommended!)
5. **IMMEDIATELY re-enable** after hotfix

### "Teammate can't merge their own PRs"

**Problem:** Self-approval not working.

**Cause:** "Require approvals" is set to 1+

**Solutions:**
- **Option A:** Get another teammate to approve (recommended)
- **Option B:** Reduce required approvals to 0 for `development` branch
- **Option C:** Enable "Allow specified actors to bypass required pull requests" (not recommended for `main`)

---

## Advanced Configuration

### Add Code Owners

Create `.github/CODEOWNERS`:

```
# Default owners for everything
*       @your-username

# Specific file patterns
/docs/  @tech-writer-username
/tests/ @qa-username
*.md    @tech-writer-username
```

Then in branch protection:
- ✅ Check "Require review from Code Owners"

### Add Deploy Checks

If you have deployment workflows:

In branch protection:
- ✅ Check "Require deployments to succeed before merging"
- Select environment: `production`

### Restrict Who Can Push

In branch protection:
- ✅ Check "Restrict who can push to matching branches"
- Add: Specific teams or users

Useful for release branches like `release/*`

---

## Monitoring

### Weekly Review

Check these metrics:

1. **CI Success Rate**
   - Go to: Actions → Workflows → PR Quality Checks
   - Look at success/failure ratio
   - **Target:** >95% first-time pass rate

2. **Average Time to Merge**
   - How long from PR creation to merge?
   - **Target:** <24 hours
   - If higher: improve CI speed or review process

3. **Failed Merges**
   - How many PRs get blocked?
   - What are common failures?
   - Update documentation to prevent recurring issues

### Monthly Review

1. **Update status checks**
   - Add new checks as CI evolves
   - Remove obsolete checks

2. **Review bypass logs**
   - Settings → Branches → [Rule] → View protection matching this rule
   - Check if admins are bypassing protection
   - Investigate why (should be rare)

3. **Team feedback**
   - Is branch protection too strict?
   - Too lenient?
   - Adjust based on team needs

---

## Next Steps After Setup

1. ✅ **Educate team**
   - Share `/docs/infrastructure/CI-CD-QUICK-START.md` with developers
   - Explain new PR workflow
   - Run team training session

2. ✅ **Configure notifications**
   - Set up Slack/email alerts for failed nightly tests
   - See `/docs/infrastructure/CI-CD.md` for instructions

3. ✅ **Monitor and iterate**
   - Watch first few PRs closely
   - Help teammates with CI failures
   - Improve documentation based on questions

4. ✅ **Expand testing**
   - Increase test coverage from current 8% to target 80%
   - Add more critical tests to P0 suite
   - See `/tests/README.md` for test plan

---

## Rollback Instructions

If you need to disable branch protection:

1. Settings → Branches
2. Find the rule (e.g., `main`)
3. Click **Delete** (trash icon)
4. Confirm deletion

**⚠️ WARNING:** Only do this if absolutely necessary. Branch protection is your safety net.

---

## Support

**Questions?**
- Read full documentation: `/docs/infrastructure/CI-CD.md`
- Check quick start: `/docs/infrastructure/CI-CD-QUICK-START.md`
- Create issue with label `ci/cd`

**Found a bug in setup?**
- Document in `/docs/bugs/bugs.md`
- Create PR with fix
- Update this documentation

---

## Summary Checklist

After following this guide, you should have:

- ✅ Branch protection enabled for `main`
- ✅ Branch protection enabled for `development`
- ✅ 3 required status checks configured
- ✅ Pull request requirement enforced
- ✅ Approval requirement configured (1 for main, 0-1 for development)
- ✅ Tested with failing and passing PRs
- ✅ Team educated on new workflow
- ✅ Notifications configured (optional)

**Your repository is now protected!** 🎉
