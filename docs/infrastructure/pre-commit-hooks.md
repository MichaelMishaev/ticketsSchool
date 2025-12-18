# Pre-Commit Hooks Documentation

## Overview

TicketCap uses **Husky** and **lint-staged** to enforce code quality checks before commits and pushes reach the repository. This catches bugs at the earliest possible stage - before they enter the codebase.

## What Gets Checked

### Pre-Commit Hook (`git commit`)
Runs automatically on every commit attempt:

1. **TypeScript Type Check** (`npm run type-check`)
   - Validates all TypeScript types
   - Catches type errors before runtime
   - Uses `tsc --noEmit` (no compilation, just validation)

2. **ESLint** (`npm run lint`)
   - Checks code quality and style
   - Enforces Next.js best practices
   - Detects common programming errors

3. **Prettier + Auto-fix** (`npx lint-staged`)
   - Auto-formats staged files
   - Fixes ESLint auto-fixable issues
   - Only runs on files you're committing (fast!)

**Estimated time:** 10-30 seconds (depending on number of changed files)

### Pre-Push Hook (`git push`)
Runs automatically before code is pushed to remote:

1. **P0 Critical Tests** (`npm run test:p0`)
   - Runs only priority-0 critical test suites
   - Tests: auth, public registration, multi-tenancy, event management
   - Prevents pushing broken code to remote branches

**Estimated time:** 1-2 minutes

## Example Output

### Successful Pre-Commit
```bash
$ git commit -m "feat: add new feature"

🔍 Running pre-commit checks...

📝 Type checking...
✅ Type check passed

🧹 Running ESLint...
✅ ESLint passed

💅 Formatting staged files...
✨ Formatting staged files using 'npx lint-staged'...
✨ Running tasks for staged files...
✨ Successfully ran tasks for staged files!
✅ Formatting passed

✨ All pre-commit checks passed! Proceeding with commit...

[development abc1234] feat: add new feature
 2 files changed, 15 insertions(+), 3 deletions(-)
```

### Failed Pre-Commit (Type Error)
```bash
$ git commit -m "feat: add new feature"

🔍 Running pre-commit checks...

📝 Type checking...

app/admin/events/new/page.tsx:45:12 - error TS2322: Type 'string' is not assignable to type 'number'.

45   const count: number = "invalid"
            ^^^^^

Found 1 error in app/admin/events/new/page.tsx:45

❌ Type check failed. Fix TypeScript errors before committing.
```

### Failed Pre-Commit (ESLint Error)
```bash
$ git commit -m "feat: add new feature"

🔍 Running pre-commit checks...

📝 Type checking...
✅ Type check passed

🧹 Running ESLint...

/Users/you/ticketsSchool/app/api/events/route.ts
  12:7  error  'admin' is assigned a value but never used  @typescript-eslint/no-unused-vars

✖ 1 problem (1 error, 0 warnings)

❌ ESLint failed. Fix linting errors before committing.
```

### Successful Pre-Push
```bash
$ git push origin development

🧪 Running P0 critical tests before push...

⚠️  This may take 1-2 minutes. You can skip with --no-verify if needed.

Running 65 tests using 3 workers
  65 passed (1.5m)

✅ All P0 critical tests passed!
🚀 Proceeding with push...

Enumerating objects: 5, done.
Counting objects: 100% (5/5), done.
...
```

### Failed Pre-Push (Test Failures)
```bash
$ git push origin development

🧪 Running P0 critical tests before push...

⚠️  This may take 1-2 minutes. You can skip with --no-verify if needed.

Running 65 tests using 3 workers
  3 failed
  62 passed (1.3m)

  1) [Mobile Chrome] › suites/04-public-registration-p0.spec.ts:45:7 › Public Registration › should validate required fields

❌ P0 critical tests failed!

Please fix failing tests before pushing to remote.
To bypass this check (emergency only): git push --no-verify
```

## Bypassing Hooks (Emergency Use Only)

### When to Bypass
- **Emergency hotfixes** - Critical production bug that needs immediate fix
- **WIP commits** - Work-in-progress that you need to backup (use branches instead)
- **Documentation-only changes** - If hooks are genuinely not needed

### How to Bypass

**Skip pre-commit hook:**
```bash
git commit --no-verify -m "hotfix: emergency fix"
# or
git commit -n -m "hotfix: emergency fix"
```

**Skip pre-push hook:**
```bash
git push --no-verify
# or
git push -n
```

**⚠️ WARNING:**
- Bypassing hooks should be **extremely rare**
- You're responsible for ensuring code quality when bypassing
- CI/CD may still fail if you push broken code
- Team should be notified of any bypass commits

## Configuration Files

### `.husky/pre-commit`
The pre-commit hook script. Runs type-check, lint, and lint-staged.

### `.husky/pre-push`
The pre-push hook script. Runs P0 critical tests.

### `package.json` - `lint-staged` section
```json
"lint-staged": {
  "*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write"
  ],
  "*.{json,md}": [
    "prettier --write"
  ]
}
```

Defines which tools run on which file types.

### `.prettierrc`
Prettier formatting rules (semicolons, quotes, line width, etc.)

### `.prettierignore`
Files/directories that Prettier should skip.

## Troubleshooting

### "Husky command not found"
```bash
npm install
# This runs 'prepare' script which sets up husky
```

### Hooks not running
```bash
# Re-initialize husky
npm run prepare

# Check hook files are executable
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Type check fails but TypeScript seems fine
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next

# Try again
npm run type-check
```

### ESLint failures
```bash
# Auto-fix what's possible
npm run lint:fix

# Check remaining issues
npm run lint
```

### Tests fail in pre-push
```bash
# Run tests locally to debug
npm run test:p0

# Run specific failing test
npx playwright test -g "test name"

# Run with UI for debugging
npm run test:ui
```

### Pre-commit takes too long
The pre-commit hook is designed to be fast (10-30 seconds). If it's slower:
- Check if too many files are staged (commit in smaller chunks)
- Ensure dev dependencies are installed (`npm install`)
- Check if type-check is scanning unnecessary files (check `tsconfig.json`)

### Pre-push takes too long
Pre-push runs P0 tests which should take 1-2 minutes. If longer:
- Check if dev server is running (Playwright needs port 9000 available)
- Ensure test database is accessible
- Run `npm run test:p0` directly to debug

## Best Practices

1. **Commit frequently** - Small commits are faster to validate
2. **Run checks manually** - Before staging files:
   ```bash
   npm run type-check
   npm run lint
   ```
3. **Fix issues immediately** - Don't let type errors accumulate
4. **Use `--no-verify` sparingly** - Only for genuine emergencies
5. **Keep hooks fast** - Pre-commit should be <30s, pre-push <2min
6. **Update hooks** - If adding new checks, update documentation

## Team Onboarding

When a new developer joins:

1. **Clone repository**
   ```bash
   git clone <repo-url>
   cd ticketsSchool
   ```

2. **Install dependencies** (automatically sets up hooks)
   ```bash
   npm install
   ```

3. **Verify hooks are working**
   ```bash
   # Check hook files exist
   ls -la .husky/

   # Should see:
   # pre-commit (executable)
   # pre-push (executable)
   ```

4. **Test hooks**
   ```bash
   # Create a test commit
   git add .
   git commit -m "test: verify hooks work"

   # You should see the pre-commit checks running
   ```

## Continuous Integration (CI/CD)

Pre-commit hooks are a **first line of defense**, not a replacement for CI/CD:

- **Pre-commit:** Fast checks before committing (type-check, lint, format)
- **Pre-push:** Medium checks before pushing (P0 tests, ~2 min)
- **CI/CD:** Full checks on server (all tests, build, deploy)

Even with hooks, CI/CD should run:
- Full test suite (not just P0)
- Production builds
- Security scans
- Deployment validation

## Updating Hooks

To add new checks to pre-commit:

1. Edit `.husky/pre-commit`
2. Add your check with clear echo messages
3. Test it works: `git commit --allow-empty -m "test"`
4. Update this documentation

Example:
```bash
# Add to .husky/pre-commit after lint check

echo "🔒 Running security audit..."
npm audit --audit-level=high
if [ $? -ne 0 ]; then
  echo "❌ Security vulnerabilities found!"
  exit 1
fi
echo "✅ Security audit passed"
```

## Performance Tips

### Faster Type Checking
Use incremental builds in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".next/.tsbuildinfo"
  }
}
```

### Faster Linting
Use ESLint cache:
```json
"scripts": {
  "lint": "next lint --cache"
}
```

### Faster Tests
Only run changed tests (future enhancement):
```json
"scripts": {
  "test:changed": "playwright test --only-changed"
}
```

## Metrics

Track hook performance over time:

- **Pre-commit average:** ~15 seconds
- **Pre-push average:** ~90 seconds
- **Bypass rate:** Should be <1% of commits
- **Hook failure rate:** ~10-15% (catching issues early!)

High bypass rate = developers finding hooks too slow or annoying
High failure rate = good! Hooks are catching issues

## Support

Questions or issues with hooks?
- Check this documentation first
- Ask in team chat
- File issue with:
  - Hook output (full error message)
  - What you were trying to commit
  - Your environment (OS, Node version)

---

**Last Updated:** 2025-12-18
**Maintained By:** Development Team
