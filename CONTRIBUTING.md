# Contributing to TicketCap

## Quick Start for Developers

### Initial Setup
```bash
# Clone and install
git clone <repo-url>
cd ticketsSchool
npm install  # Automatically sets up git hooks!

# Start development
docker-compose up -d  # Start database
npm run dev           # Start dev server on port 9000
```

## Git Workflow with Pre-Commit Hooks

TicketCap uses **automated quality checks** that run before every commit and push. This catches bugs early!

### Making a Commit

```bash
# 1. Make your changes
# 2. Stage files
git add .

# 3. Commit (hooks run automatically)
git commit -m "feat: add new feature"

# You'll see:
🔍 Running pre-commit checks...
📝 Type checking...
✅ Type check passed
🧹 Running ESLint...
✅ ESLint passed
💅 Formatting staged files...
✅ Formatting passed
✨ All pre-commit checks passed! Proceeding with commit...
```

### If Hooks Catch an Error

**Type Error:**
```bash
❌ Type check failed. Fix TypeScript errors before committing.

# Fix the error, then commit again
```

**Lint Error:**
```bash
❌ ESLint failed. Fix linting errors before committing.

# Fix the error, then commit again
```

### Pushing Code

```bash
git push origin your-branch

# P0 tests will run automatically (1-2 minutes)
🧪 Running P0 critical tests before push...
✅ All P0 critical tests passed!
🚀 Proceeding with push...
```

### Emergency Bypass (Rare!)

Only use `--no-verify` for genuine emergencies:

```bash
# Skip pre-commit checks
git commit --no-verify -m "hotfix: critical bug"

# Skip pre-push checks
git push --no-verify
```

**When bypass is acceptable:**
- ✅ Critical production hotfixes
- ❌ "I don't want to fix errors" (NOT acceptable!)

## Development Workflow

### 1. Create Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Write Tests First (TDD)
```bash
# Add test in tests/suites/
npx playwright test -g "your test name"  # Should fail
```

### 3. Implement Feature
```bash
# Write code
# Hooks will check quality on commit
git add .
git commit -m "feat: your feature"
```

### 4. Run Full Test Suite
```bash
npm test                    # All tests
npm run test:p0             # P0 critical tests only
npm run test:mobile         # Mobile tests
```

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
# Create PR on GitHub
```

## Available Commands

### Development
```bash
npm run dev                 # Start dev server (port 9000)
npm run build               # Production build
```

### Code Quality
```bash
npm run type-check          # TypeScript type checking
npm run lint                # ESLint
npm run lint:fix            # Auto-fix ESLint issues
npm run format              # Format all files with Prettier
npm run format:check        # Check if files are formatted
```

### Testing
```bash
npm test                    # Run all Playwright tests
npm run test:p0             # P0 critical tests only
npm run test:ui             # Playwright UI mode
npm run test:headed         # Run tests in headed mode
npm run test:mobile         # Mobile viewport tests
npm run test:debug          # Debug specific test
```

### Database
```bash
npx prisma generate         # Generate Prisma client
npx prisma migrate dev      # Run migrations
npx prisma studio           # Open Prisma Studio
npm run db:status           # Check migration status
```

## Pre-Commit Hooks Details

### What's Checked on Commit?
1. **TypeScript Types** - Catches type errors
2. **ESLint** - Code quality and best practices
3. **Prettier** - Auto-formats code

### What's Checked on Push?
1. **P0 Critical Tests** - Essential functionality:
   - Authentication
   - Public registration
   - Multi-tenancy
   - Event management
   - Table management

### Performance
- **Pre-commit:** ~10-30 seconds
- **Pre-push:** ~1-2 minutes

## Troubleshooting

### Hooks Not Running?
```bash
# Re-install hooks
npm run prepare

# Verify they're executable
ls -la .husky/
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### Type Check Fails?
```bash
# Regenerate Prisma client
npx prisma generate

# Clear Next.js cache
rm -rf .next
```

### Tests Fail?
```bash
# Make sure dev server is NOT running (port 9000)
# Make sure database is running
docker-compose up -d

# Run tests again
npm test
```

## Code Style

We use:
- **TypeScript Strict Mode** - All types must be explicit
- **ESLint** - Next.js recommended config
- **Prettier** - Consistent formatting
  - No semicolons
  - Single quotes
  - 100 character line width
  - 2 space indentation

Your code is automatically formatted on commit!

## Testing Requirements

**All code must have tests.** No exceptions.

1. Write test first (fails)
2. Implement feature (test passes)
3. Run full suite (no regressions)

See `tests/README.md` for complete testing guide.

## Need Help?

- 📖 **Full documentation:** `docs/infrastructure/pre-commit-hooks.md`
- 📖 **Testing guide:** `tests/README.md`
- 📖 **Project guide:** `CLAUDE.md`
- 💬 **Team chat:** Ask questions!

## Pull Request Checklist

Before creating a PR:

- [ ] All tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code is formatted (`npm run format`)
- [ ] New features have tests
- [ ] Bug fixes have tests that would have caught the bug
- [ ] Documentation updated (if needed)
- [ ] Mobile responsiveness tested (if UI changes)

## Git Commit Messages

We use conventional commits:

```bash
feat: add new feature
fix: fix bug in registration
docs: update README
test: add tests for auth
refactor: simplify event logic
chore: update dependencies
```

**Format:**
```
<type>: <short description>

<optional longer description>

<optional footer>
```

## License

See LICENSE file for details.

---

**Questions?** Open an issue or ask in team chat!
