# Contributing to kartis.info

Thank you for your interest in contributing to kartis.info! This guide will help you get started with contributing code, reporting bugs, and improving the project.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Workflow](#development-workflow)
4. [Coding Standards](#coding-standards)
5. [Testing Requirements](#testing-requirements)
6. [Commit Message Guidelines](#commit-message-guidelines)
7. [Pull Request Process](#pull-request-process)
8. [Security](#security)
9. [Questions & Support](#questions--support)

---

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors. Please be respectful and constructive in all interactions.

### Expected Behavior

- ✅ Be respectful and inclusive
- ✅ Provide constructive feedback
- ✅ Focus on what is best for the community
- ✅ Show empathy towards other contributors

### Unacceptable Behavior

- ❌ Harassment or discriminatory language
- ❌ Personal attacks or trolling
- ❌ Publishing others' private information
- ❌ Spam or off-topic content

---

## Getting Started

### Prerequisites

- **Node.js**: 18.x or higher
- **Docker**: For PostgreSQL database
- **Git**: For version control
- **VS Code** (recommended): With Prettier and ESLint extensions

### Setup Your Development Environment

1. **Fork the repository**

   ```bash
   # Visit https://github.com/your-org/kartis.info and click "Fork"
   ```

2. **Clone your fork**

   ```bash
   git clone https://github.com/YOUR_USERNAME/kartis.info.git
   cd kartis.info
   ```

3. **Install dependencies**

   ```bash
   npm install
   ```

4. **Start PostgreSQL**

   ```bash
   docker-compose up -d
   ```

5. **Run database migrations**

   ```bash
   npx prisma migrate dev
   ```

6. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your local settings
   ```

7. **Start the development server**

   ```bash
   npm run dev
   ```

8. **Visit** http://localhost:9000

### Verify Your Setup

```bash
# Run tests
npm run test:unit
npm test

# Type check
npm run type-check

# Lint
npm run lint
```

---

## Development Workflow

### 1. Create a Branch

```bash
# Always create a new branch from development
git checkout development
git pull origin development
git checkout -b feature/your-feature-name
```

**Branch naming conventions:**

- `feature/add-table-templates` - New features
- `fix/registration-race-condition` - Bug fixes
- `docs/update-testing-guide` - Documentation
- `refactor/simplify-auth-logic` - Code refactoring
- `test/add-modal-tests` - Test improvements

### 2. Make Your Changes

- Write clean, maintainable code
- Follow existing code patterns
- Add tests for new features/bug fixes
- Update documentation if needed

### 3. Test Your Changes

```bash
# Run all tests
npm run test:unit
npm test

# Check coverage
npm run test:unit:coverage

# Lint and type check
npm run lint
npm run type-check
```

### 4. Commit Your Changes

```bash
# Add files
git add .

# Commit with conventional commit message
git commit -m "feat: add table template system"

# Pre-commit hooks will run automatically:
# ✅ Type checking
# ✅ Linting
# ✅ Unit tests
```

### 5. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Target: development branch (NOT main)
```

---

## Coding Standards

### TypeScript

- **Strict mode enabled**: All code must pass TypeScript strict checks
- **Type everything**: Avoid `any`, use proper types
- **No implicit any**: Define explicit types for function parameters

✅ **Good:**

```typescript
interface CreateEventParams {
  title: string
  capacity: number
  date: Date
}

export async function createEvent(params: CreateEventParams): Promise<Event> {
  return await prisma.event.create({ data: params })
}
```

❌ **Bad:**

```typescript
export async function createEvent(params: any) {
  return await prisma.event.create({ data: params })
}
```

### Code Style

- **Formatting**: Use Prettier (auto-formats on save)
- **Linting**: Use ESLint (enforced in pre-commit hook)
- **Line length**: Max 100 characters (Prettier default)
- **Imports**: Use `@/` path alias for imports

```typescript
// ✅ Good
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth.server'

// ❌ Bad
import { prisma } from '../../lib/prisma'
import { requireAdmin } from '../../../lib/auth.server'
```

### File Organization

```
/app/api/[feature]/route.ts       # API routes
/lib/[utility].ts                 # Business logic
/components/[Component].tsx       # React components
/lib/__tests__/[utility].test.ts  # Unit tests
/components/__tests__/[Component].test.tsx  # Component tests
```

### Naming Conventions

| Type       | Convention       | Example                 |
| ---------- | ---------------- | ----------------------- |
| Files      | kebab-case       | `table-assignment.ts`   |
| Components | PascalCase       | `Modal.tsx`             |
| Functions  | camelCase        | `assignTable()`         |
| Constants  | UPPER_SNAKE_CASE | `MAX_CAPACITY`          |
| Interfaces | PascalCase       | `TableAssignmentParams` |

---

## Testing Requirements

### Test Coverage Requirements

**All code changes MUST include tests.** PRs without tests will not be merged.

| Change Type        | Required Tests                    | Coverage Target         |
| ------------------ | --------------------------------- | ----------------------- |
| **New feature**    | Unit + E2E                        | 80% minimum             |
| **Bug fix**        | Failing test → Fix → Passing test | 100% of bug code        |
| **Refactoring**    | All existing tests pass           | No decrease             |
| **Critical files** | 100% coverage required            | auth, billing, security |

### Writing Tests

**1. Unit Tests** (for lib files)

```typescript
// lib/__tests__/table-assignment.test.ts
import { describe, it, expect } from 'vitest'
import { assignTable } from '../table-assignment'

describe('assignTable', () => {
  it('should assign smallest fitting table', () => {
    const tables = [
      { id: '1', capacity: 4 },
      { id: '2', capacity: 8 },
    ]

    const result = assignTable(tables, 4)

    expect(result.tableId).toBe('1')
  })
})
```

**2. Component Tests** (for React components)

```typescript
// components/__tests__/Modal.test.tsx
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Modal from '../Modal'

it('should render modal content', () => {
  render(
    <Modal isOpen={true} onClose={vi.fn()} title="Test">
      <p>Content</p>
    </Modal>
  )

  expect(screen.getByText('Content')).toBeInTheDocument()
})
```

**3. E2E Tests** (for user workflows)

```typescript
// tests/suites/03-event-management-p0.spec.ts
import { test, expect } from '@playwright/test'

test('admin can create event', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/events/new')
  await page.fill('[name="title"]', 'Soccer Match')
  await page.click('button[type="submit"]')

  await expect(page.locator('text=Event created')).toBeVisible()
})
```

### Running Tests Locally

```bash
# BEFORE committing
npm run test:unit              # Unit + component tests
npm test                       # E2E tests
npm run test:unit:coverage     # Check coverage
```

---

## Commit Message Guidelines

We follow **Conventional Commits** specification.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

| Type       | When to Use                  | Example                                       |
| ---------- | ---------------------------- | --------------------------------------------- |
| `feat`     | New feature                  | `feat: add table template system`             |
| `fix`      | Bug fix                      | `fix: resolve race condition in registration` |
| `docs`     | Documentation only           | `docs: update testing guide`                  |
| `style`    | Code style (no logic change) | `style: format auth.server.ts`                |
| `refactor` | Code refactoring             | `refactor: simplify table assignment logic`   |
| `test`     | Adding/updating tests        | `test: add modal component tests`             |
| `chore`    | Maintenance tasks            | `chore: update dependencies`                  |
| `perf`     | Performance improvements     | `perf: optimize database queries`             |

### Examples

✅ **Good:**

```
feat: add table template system

Implements save-as-template and apply-template functionality
for event table management. Reduces setup time for recurring
events by 90%.

Closes #123
```

```
fix: resolve registration race condition

Use atomic transaction to increment spotsReserved counter,
preventing double-booking when concurrent registrations occur.

Fixes #456
```

❌ **Bad:**

```
update code
```

```
fixed bug
```

```
WIP
```

### Footer

Add references to issues/PRs:

```
Closes #123
Fixes #456
Relates to #789
```

### Co-Authorship

Pre-commit hook automatically adds:

```
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

---

## Pull Request Process

### Before Creating PR

1. ✅ All tests pass locally
2. ✅ Coverage meets requirements (80% minimum)
3. ✅ No linting errors
4. ✅ Type checking passes
5. ✅ Documentation updated (if needed)
6. ✅ CLAUDE.md updated (if changing architecture)

### PR Checklist

```markdown
## Description

[Describe what this PR does]

## Type of Change

- [ ] Bug fix (non-breaking change)
- [ ] New feature (non-breaking change)
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing locally
- [ ] Coverage meets requirements (80%+)

## Screenshots (if applicable)

[Add screenshots for UI changes]

## Closes

Closes #[issue number]
```

### PR Title

Follow conventional commits format:

```
feat: add table template system
fix: resolve registration race condition
docs: update testing guide
```

### CI Checks

Your PR must pass all CI checks:

- ✅ **Type checking** (TypeScript strict mode)
- ✅ **Linting** (ESLint)
- ✅ **Unit tests** (4 parallel shards)
- ✅ **Coverage** (12% overall, 100% critical files)
- ✅ **Security scans** (Trivy + npm audit)
- ✅ **P0 E2E tests** (critical user workflows)

### Code Review Process

1. **Automated checks run** (~8-10 minutes)
2. **Maintainer reviews** code quality, tests, architecture
3. **Feedback addressed** - Make requested changes
4. **Approval granted** - PR approved by maintainer
5. **Merge** to development branch

### After Merge

- Your branch will be deleted automatically
- Tests run again on development branch
- Changes deployed to staging environment

---

## Security

### Reporting Security Vulnerabilities

**DO NOT** open a public issue for security vulnerabilities.

Instead:

1. Email: [Add security contact email]
2. GitHub Security Advisories: Use "Security" tab

### Security Guidelines

**Never commit:**

- ❌ API keys, passwords, tokens
- ❌ Private keys, certificates
- ❌ Database credentials
- ❌ `.env` files

**Always:**

- ✅ Use environment variables
- ✅ Validate all user input
- ✅ Sanitize database queries (Prisma parameterized)
- ✅ Enforce multi-tenant isolation (`schoolId`)

### Security Checks

Pre-push hook runs:

- ✅ npm audit (HIGH/CRITICAL vulnerabilities)
- ✅ gitleaks (secret scanning)

CI runs:

- ✅ Trivy filesystem scan
- ✅ Trivy secret scan
- ✅ Dependency review

---

## Questions & Support

### Getting Help

- **Documentation**: Check `/docs` directory
- **Testing Guide**: `/docs/TESTING_GUIDE.md`
- **Architecture**: `/CLAUDE.md`
- **GitHub Issues**: Search existing issues first

### Asking Questions

**Before asking:**

1. Check documentation
2. Search existing issues
3. Review CLAUDE.md for architecture questions

**When asking:**

- Provide context (what you're trying to do)
- Include error messages
- Share code snippets (if applicable)
- Describe what you've tried

---

## Recognition

### Contributors

All contributors are recognized in:

- GitHub contributors list
- Release notes (for significant features)

### First-Time Contributors

Welcome! Look for issues tagged with `good first issue` to get started.

---

## Development Tips

### Recommended VS Code Extensions

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "prisma.prisma",
    "ms-playwright.playwright"
  ]
}
```

### Useful Commands

```bash
# Quick test
npm run test:unit:watch         # Watch mode for unit tests

# Debugging
npm run test:ui                 # Playwright UI mode
npm run test:headed             # See browser during E2E tests

# Database
npx prisma studio               # Visual database editor
npx prisma migrate dev          # Create new migration

# Code quality
npm run lint:fix                # Auto-fix linting issues
```

### Performance Tips

- Use `npm run dev` (not `next dev`) - includes server optimizations
- Run Postgres in Docker - consistent environment
- Clear Prisma cache: `rm -rf node_modules/.prisma`
- Clear Next cache: `rm -rf .next`

---

## Thank You!

Thank you for contributing to kartis.info! Every contribution, no matter how small, helps make the project better for everyone.

**Questions?** Open an issue or reach out to maintainers.

---

**Last Updated:** January 2026
**Version:** 1.0.0
