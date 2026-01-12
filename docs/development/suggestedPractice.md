🏆 Best QA & Code Management Practices

  Copy-Paste Ready for Any Project

  ---
  📋 1. Testing Strategy (TDD/BDD)

  Red-Green-Refactor Cycle (MANDATORY)

  // ❌ RED: Write FAILING test first
  describe('Feature', () => {
    it('should do something', () => {
      const result = myFunction()
      expect(result).toBe(expected)  // WILL FAIL - feature doesn't exist yet
    })
  })

  // Run: npm test → Should FAIL ❌

  // ✅ GREEN: Write MINIMAL code to pass
  function myFunction() {
    return expected  // Simplest implementation
  }

  // Run: npm test → Should PASS ✅

  // 🔄 REFACTOR: Improve code while keeping tests green
  function myFunction() {
    // Optimized, clean implementation
    return computeResult()
  }

  // Run: npm test → Still PASS ✅

  Coverage Requirements
  ┌──────────────────────┬───────────────────┬──────────────────────────────────────────────────┐
  │    Component Type    │ Coverage Required │                    Rationale                     │
  ├──────────────────────┼───────────────────┼──────────────────────────────────────────────────┤
  │ Critical Safety Code │ 100%              │ Curriculum validation, answer checking, security │
  ├──────────────────────┼───────────────────┼──────────────────────────────────────────────────┤
  │ Business Logic       │ ≥ 90%             │ Core features, state management                  │
  ├──────────────────────┼───────────────────┼──────────────────────────────────────────────────┤
  │ API Endpoints        │ ≥ 80%             │ Request/response validation                      │
  ├──────────────────────┼───────────────────┼──────────────────────────────────────────────────┤
  │ UI Components        │ ≥ 70%             │ User interactions, visual state                  │
  ├──────────────────────┼───────────────────┼──────────────────────────────────────────────────┤
  │ Utility Functions    │ ≥ 80%             │ Shared helpers, formatters                       │
  └──────────────────────┴───────────────────┴──────────────────────────────────────────────────┘
  ---
  🐛 2. Regression Testing (Bug Fix Protocol)

  EVERY Bug Fix MUST Include:

  # 1. Write FAILING test that reproduces bug
  describe('Bug #123 - Login accepts empty passwords', () => {
    it('should reject empty password', () => {
      const validator = new LoginValidator()
      const result = validator.validate({ email: 'test@test.com', password: '' })
      expect(result.valid).toBe(false)  // ❌ WILL FAIL (bug exists)
      expect(result.errors).toContain('Password is required')
    })
  })

  # 2. Verify test FAILS (confirms bug reproduction)
  npm test  # ❌ Must fail

  # 3. Fix the bug
  export class LoginValidator {
    validate({ email, password }) {
      if (!password || password.trim() === '') {
        return { valid: false, errors: ['Password is required'] }
      }
      // ... rest of validation
    }
  }

  # 4. Verify test PASSES (confirms fix works)
  npm test  # ✅ Must pass

  # 5. Commit test + fix together
  git add .
  git commit -m "fix(auth): reject empty passwords

  - Bug #123: Login accepted empty passwords
  - Root cause: Missing empty string validation
  - Fix: Add trim() check for password field
  - Test: LoginValidator.test.ts:45 (regression test)
  "

  Bug Documentation Template

  ## Bug #123: Login accepts empty passwords

  **Severity:** HIGH
  **Status:** FIXED
  **Found:** 2026-01-11
  **Fixed:** 2026-01-11

  ### Reproduction Steps:
  1. Navigate to login page
  2. Enter valid email
  3. Leave password field empty
  4. Click submit
  5. ❌ Login succeeds (should reject)

  ### Root Cause:
  Missing empty string validation in LoginValidator.validate()

  ### Fix Summary:
  Added `password.trim()` check to reject empty/whitespace-only passwords

  ### Regression Test:
  - File: `LoginValidator.test.ts:45`
  - Test: "should reject empty password"
  - Status: ✅ Passes (failed before fix, passes after)

  ### Prevention:
  - Added input validation layer
  - Updated validation schema (Zod)
  - Added ESLint rule: `no-implicit-coercion`

  ### Commit Hash:
  `a3f2b9c`

  ---
  🛠️ 3. QA Automation Tools (100% FREE)

  Testing Stack

  {
    "devDependencies": {
      // Unit Testing
      "vitest": "^2.1.8",                          // Fast unit tests (Vite-powered)
      "@vitest/ui": "^2.1.8",                      // Test UI dashboard

      // Component Testing
      "@testing-library/react": "^16.1.0",         // React component tests
      "@testing-library/user-event": "^14.5.2",    // User interaction simulation
      "@testing-library/jest-dom": "^6.6.3",       // DOM matchers

      // E2E Testing
      "@playwright/test": "^1.49.0",               // Web E2E tests
      "detox": "^20.27.0",                         // Mobile E2E (React Native)

      // Visual Regression
      "jest-image-snapshot": "^6.4.0",             // Visual regression testing
      "playwright": "^1.49.0",                     // Screenshot comparisons

      // Contract Testing
      "@pact-foundation/pact": "^13.1.0",          // Microservices contract tests

      // Code Quality
      "eslint": "^9.18.0",                         // Linter
      "prettier": "^3.4.2",                        // Formatter
      "typescript": "^5.7.2",                      // Type safety

      // Security Scanning
      "trivy": "latest",                           // Container/dependency scanner (CLI)
      "npm-audit": "built-in",                     // Dependency vulnerabilities

      // Coverage Reporting
      "@vitest/coverage-v8": "^2.1.8"              // Code coverage (V8)
    }
  }

  Test Commands

  {
    "scripts": {
      "test:unit": "vitest run",
      "test:unit:watch": "vitest",
      "test:unit:ui": "vitest --ui",
      "test:components": "vitest --config vitest.config.components.ts",
      "test:e2e:web": "playwright test",
      "test:e2e:mobile": "detox test",
      "test:visual": "jest --config jest.visual.config.js",
      "test:contract": "jest --config jest.pact.config.js",
      "test:all": "npm run test:unit && npm run test:e2e:web && npm run test:visual",
      "test:coverage": "vitest run --coverage",
      "test:coverage:threshold": "vitest run --coverage --coverage.thresholds.lines=80",

      // Code Quality
      "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
      "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
      "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
      "type-check": "tsc --noEmit",

      // Security
      "security:scan": "trivy fs . --severity HIGH,CRITICAL",
      "security:audit": "npm audit --audit-level=high",
      "security:all": "npm run security:scan && npm run security:audit",

      // Pre-commit
      "pre-commit": "npm run lint && npm run type-check && npm run test:unit",

      // Pre-push
      "pre-push": "npm run test:all && npm run security:all"
    }
  }

  ---
  ✅ 4. Development Checklist

  Before Writing Code:

  - Read existing code/patterns (understand before modifying)
  - Plan complex features (use pseudocode/diagrams)
  - Write failing tests (TDD RED phase)
  - Ensure tests fail for the right reason

  During Development:

  - Follow TDD: RED → GREEN → REFACTOR
  - Run tests in watch mode (npm run test:unit:watch)
  - Commit small, atomic changes
  - Keep test:code ratio ≥ 1:1 (more tests than code is good!)

  After Writing Code:

  - All tests pass (npm run test:unit)
  - Coverage meets requirements (npm run test:coverage)
  - Linter passes (npm run lint)
  - Type-check passes (npm run type-check)
  - Security scan clean (npm run security:scan)
  - Visual regression approved (if UI changes)

  Before Commit:

  # Run pre-commit checks
  npm run pre-commit

  # If all pass:
  git add .
  git commit -m "feat(scope): description

  - Details about changes
  - Test coverage: 95%
  - Breaking changes: none
  "

  Before Push:

  # Run full test suite
  npm run pre-push

  # If all pass:
  git push origin feature/branch-name

  Before PR/Merge:

  - Full E2E test suite passes
  - Visual regression tests pass
  - Security audit clean
  - Documentation updated (if API/behavior changes)
  - CHANGELOG.md updated
  - Migration guide written (if breaking changes)

  ---
  🤖 5. CI/CD Pipeline (GitHub Actions)

  .github/workflows/ci-test-matrix.yml

  name: CI/CD Pipeline

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    # Job 1: Code Quality (fastest)
    code-quality:
      runs-on: ubuntu-latest
      timeout-minutes: 5
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Lint
          run: npm run lint

        - name: Type Check
          run: npm run type-check

        - name: Format Check
          run: npm run format -- --check

    # Job 2: Unit Tests (parallel)
    unit-tests:
      runs-on: ubuntu-latest
      timeout-minutes: 10
      strategy:
        matrix:
          shard: [1, 2, 3, 4]  # Split tests into 4 shards
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci

        - name: Run Unit Tests (Shard ${{ matrix.shard }}/4)
          run: npm run test:unit -- --shard=${{ matrix.shard }}/4

        - name: Upload Coverage
          uses: codecov/codecov-action@v4
          with:
            files: ./coverage/coverage-final.json

    # Job 3: Component Tests
    component-tests:
      runs-on: ubuntu-latest
      timeout-minutes: 10
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npm run test:components

    # Job 4: E2E Tests (Web)
    e2e-web:
      runs-on: ubuntu-latest
      timeout-minutes: 20
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npx playwright install --with-deps
        - run: npm run test:e2e:web

        - name: Upload Playwright Report
          if: failure()
          uses: actions/upload-artifact@v4
          with:
            name: playwright-report
            path: playwright-report/

    # Job 5: E2E Tests (Mobile) - iOS
    e2e-ios:
      runs-on: macos-latest
      timeout-minutes: 30
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npx detox build -c ios.sim.release
        - run: npx detox test -c ios.sim.release

    # Job 6: Visual Regression
    visual-regression:
      runs-on: ubuntu-latest
      timeout-minutes: 15
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npm run test:visual

        - name: Upload Diff Images
          if: failure()
          uses: actions/upload-artifact@v4
          with:
            name: visual-diff
            path: __image_snapshots__/__diff_output__/

    # Job 7: Security Scanning
    security:
      runs-on: ubuntu-latest
      timeout-minutes: 10
      steps:
        - uses: actions/checkout@v4

        - name: Run Trivy Scanner
          uses: aquasecurity/trivy-action@master
          with:
            scan-type: 'fs'
            scan-ref: '.'
            severity: 'HIGH,CRITICAL'
            exit-code: '1'  # Fail CI if vulnerabilities found

        - name: NPM Audit
          run: npm audit --audit-level=high

    # Job 8: Coverage Check
    coverage-check:
      runs-on: ubuntu-latest
      timeout-minutes: 10
      needs: [unit-tests, component-tests]
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npm run test:coverage

        - name: Check Coverage Thresholds
          run: |
            COVERAGE=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
            echo "Total coverage: $COVERAGE%"
            if (( $(echo "$COVERAGE < 80" | bc -l) )); then
              echo "❌ Coverage below 80% threshold"
              exit 1
            fi
            echo "✅ Coverage meets 80% threshold"

    # Job 9: Build (production)
    build:
      runs-on: ubuntu-latest
      timeout-minutes: 15
      needs: [code-quality, unit-tests, component-tests]
      steps:
        - uses: actions/checkout@v4
        - uses: actions/setup-node@v4
          with:
            node-version: '20'
            cache: 'npm'

        - run: npm ci
        - run: npm run build

        - name: Upload Build Artifacts
          uses: actions/upload-artifact@v4
          with:
            name: build
            path: dist/

    # Job 10: Deploy (only on main)
    deploy:
      runs-on: ubuntu-latest
      needs: [build, e2e-web, visual-regression, security, coverage-check]
      if: github.ref == 'refs/heads/main'
      steps:
        - uses: actions/checkout@v4
        - uses: actions/download-artifact@v4
          with:
            name: build
            path: dist/

        - name: Deploy to Production
          run: |
            # Add your deployment script here
            echo "🚀 Deploying to production..."

  Pipeline Success Criteria
  ┌───────────────────┬──────────┬───────────────────────────┐
  │        Job        │ Max Time │      Failure Action       │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Code Quality      │ 5 min    │ Block PR                  │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Unit Tests        │ 10 min   │ Block PR                  │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Component Tests   │ 10 min   │ Block PR                  │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ E2E Web           │ 20 min   │ Block PR                  │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ E2E Mobile        │ 30 min   │ Block PR (main only)      │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Visual Regression │ 15 min   │ Require manual review     │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Security Scan     │ 10 min   │ Block PR if HIGH/CRITICAL │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Coverage Check    │ 10 min   │ Block PR if < 80%         │
  ├───────────────────┼──────────┼───────────────────────────┤
  │ Build             │ 15 min   │ Block PR                  │
  └───────────────────┴──────────┴───────────────────────────┘
  ---
  📦 6. Git Workflow & Commit Standards

  Branch Strategy

  main (production)
    └── develop (staging)
          ├── feature/add-login
          ├── feature/fix-bug-123
          ├── hotfix/critical-security-fix
          └── release/v2.0.0

  Conventional Commits

  # Format: <type>(<scope>): <subject>

  # Types:
  feat(auth): add JWT refresh token support
  fix(api): handle null values in user profile
  docs(readme): update installation instructions
  style(ui): fix button alignment
  refactor(utils): simplify date formatting logic
  perf(db): add index to users.email
  test(auth): add regression test for bug #123
  chore(deps): upgrade React to v18.3.0
  ci(pipeline): add visual regression tests
  revert(api): revert "add experimental feature"

  # Breaking Changes:
  feat(api)!: change response format for /users endpoint

  BREAKING CHANGE: User API now returns paginated results
  Migration guide: docs/migrations/v2-user-api.md

  # With Body:
  fix(auth): reject empty passwords in login validation

  - Bug #123: Login accepted empty passwords
  - Root cause: Missing empty string validation
  - Fix: Add trim() check for password field
  - Test: LoginValidator.test.ts:45 (regression test)
  - Coverage: 100% for LoginValidator

  PR Template

  ## 📝 Description
  Brief description of changes (1-2 sentences)

  ## 🎯 Type of Change
  - [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
  - [ ] ✨ New feature (non-breaking change which adds functionality)
  - [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
  - [ ] 📚 Documentation update
  - [ ] 🎨 Style/UI update
  - [ ] ♻️ Refactoring
  - [ ] ⚡ Performance improvement
  - [ ] ✅ Test update

  ## 🧪 Testing
  - [ ] Unit tests added/updated
  - [ ] Component tests added/updated
  - [ ] E2E tests added/updated
  - [ ] Visual regression tests added/updated
  - [ ] Regression test for bug fix (if applicable)
  - [ ] All tests passing locally
  - [ ] Coverage ≥ 80% (100% for critical code)

  ## 📊 Coverage Report
  <!-- Paste coverage report -->
  Total Coverage: 87.3%
  - Statements: 89.2%
  - Branches: 85.1%
  - Functions: 87.9%
  - Lines: 87.3%

  ## 🔒 Security
  - [ ] No secrets/credentials committed
  - [ ] Trivy scan passing
  - [ ] npm audit clean
  - [ ] Input validation added (if applicable)
  - [ ] SQL injection prevention (if applicable)
  - [ ] XSS prevention (if applicable)

  ## 📸 Screenshots (if UI changes)
  <!-- Add before/after screenshots -->

  ## 📝 Related Issues
  Closes #123
  Relates to #456

  ## ✅ Checklist
  - [ ] Code follows project style guide
  - [ ] Self-reviewed my own code
  - [ ] Commented code (where logic isn't self-evident)
  - [ ] Documentation updated
  - [ ] No new warnings/errors
  - [ ] Linter passing
  - [ ] Type-check passing
  - [ ] CI pipeline passing

  ---
  🏗️ 7. Code Quality Standards

  ESLint Configuration (.eslintrc.json)

  {
    "extends": [
      "eslint:recommended",
      "plugin:@typescript-eslint/recommended",
      "plugin:@typescript-eslint/recommended-requiring-type-checking",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:jsx-a11y/recommended",
      "plugin:security/recommended",
      "prettier"
    ],
    "rules": {
      // Prevent bugs
      "no-implicit-coercion": "error",
      "no-unused-vars": "error",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/explicit-function-return-type": "warn",

      // Security
      "security/detect-object-injection": "warn",
      "security/detect-non-literal-regexp": "warn",

      // Best practices
      "prefer-const": "error",
      "no-var": "error",
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],

      // React
      "react/prop-types": "off",  // Using TypeScript
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Accessibility
      "jsx-a11y/alt-text": "error",
      "jsx-a11y/aria-props": "error"
    }
  }

  TypeScript Configuration (tsconfig.json)

  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true,
      "strictPropertyInitialization": true,
      "noImplicitThis": true,
      "alwaysStrict": true,
      "noUnusedLocals": true,
      "noUnusedParameters": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true
    }
  }

  Prettier Configuration (.prettierrc.json)

  {
    "semi": false,
    "singleQuote": true,
    "trailingComma": "es5",
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false,
    "arrowParens": "avoid",
    "endOfLine": "lf"
  }

  ---
  🧪 8. Test Organization

  File Structure

  project/
  ├── src/
  │   ├── features/
  │   │   └── auth/
  │   │       ├── LoginValidator.ts
  │   │       └── __tests__/
  │   │           ├── LoginValidator.test.ts       # Unit tests
  │   │           ├── LoginForm.component.test.tsx # Component tests
  │   │           └── login-flow.e2e.test.ts       # E2E tests
  │   └── utils/
  │       ├── formatters.ts
  │       └── __tests__/
  │           └── formatters.test.ts
  ├── e2e/
  │   ├── web/
  │   │   └── login.spec.ts                        # Playwright
  │   └── mobile/
  │       └── login.e2e.ts                         # Detox
  ├── contracts/
  │   └── user-service.pact.test.ts                # Pact tests
  └── visual/
      └── LoginForm.visual.test.tsx                # Visual regression

  Test Naming Convention

  // ✅ GOOD: Descriptive, behavior-focused
  describe('LoginValidator', () => {
    describe('password validation', () => {
      it('rejects empty passwords', () => { /* ... */ })
      it('rejects passwords shorter than 8 characters', () => { /* ... */ })
      it('accepts valid passwords', () => { /* ... */ })
    })

    describe('email validation', () => {
      it('rejects invalid email formats', () => { /* ... */ })
      it('accepts valid email addresses', () => { /* ... */ })
    })
  })

  // ❌ BAD: Vague, implementation-focused
  describe('LoginValidator', () => {
    it('test 1', () => { /* ... */ })
    it('validates input', () => { /* ... */ })
    it('works correctly', () => { /* ... */ })
  })

  Test Patterns

  // AAA Pattern: Arrange, Act, Assert
  describe('Calculator', () => {
    it('adds two numbers correctly', () => {
      // Arrange
      const calculator = new Calculator()
      const a = 5
      const b = 3

      // Act
      const result = calculator.add(a, b)

      // Assert
      expect(result).toBe(8)
    })
  })

  // Given-When-Then (BDD)
  describe('Shopping Cart', () => {
    it('calculates total price with tax', () => {
      // Given a shopping cart with items
      const cart = new ShoppingCart()
      cart.addItem({ name: 'Book', price: 10 })
      cart.addItem({ name: 'Pen', price: 2 })

      // When calculating total with 10% tax
      const total = cart.getTotalWithTax(0.1)

      // Then total should be $13.20
      expect(total).toBe(13.2)
    })
  })

  ---
  📊 9. Monitoring & Observability

  Test Reports Dashboard

  {
    "scripts": {
      "test:report": "vitest run --reporter=html --reporter=json --reporter=verbose",
      "test:dashboard": "open coverage/index.html"
    }
  }

  Coverage Reporting

  // vitest.config.ts
  export default defineConfig({
    test: {
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.{ts,tsx}'],
        exclude: [
          'src/**/*.test.{ts,tsx}',
          'src/**/*.spec.{ts,tsx}',
          'src/**/__tests__/**',
          'src/**/*.d.ts',
          'src/**/types/**'
        ],
        thresholds: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
          // Critical code requires 100%
          './src/validators/CurriculumGuard.ts': {
            lines: 100,
            functions: 100,
            branches: 100,
            statements: 100
          }
        }
      }
    }
  })

  ---
  🎯 10. Quick Reference: Daily Checklist

  Morning (Start of Day)

  # 1. Pull latest changes
  git pull origin develop

  # 2. Install new dependencies (if any)
  npm install

  # 3. Run tests to ensure baseline
  npm run test:unit

  # 4. Check CI status
  gh pr checks  # GitHub CLI

  During Development

  # 1. Create feature branch
  git checkout -b feature/my-feature

  # 2. Write failing test
  # ... write test ...

  # 3. Run test in watch mode
  npm run test:unit:watch

  # 4. Implement feature (TDD)
  # ... write code ...

  # 5. Commit frequently
  git add .
  git commit -m "feat(scope): description"

  # 6. Run pre-commit checks
  npm run pre-commit

  Before Push

  # 1. Full test suite
  npm run test:all

  # 2. Security scan
  npm run security:all

  # 3. Coverage check
  npm run test:coverage

  # 4. Push
  git push origin feature/my-feature

  # 5. Create PR
  gh pr create --title "Title" --body "Description"

  Before Merge

  # 1. Review CI pipeline
  # ... check GitHub Actions ...

  # 2. Code review
  # ... address feedback ...

  # 3. Squash commits (if needed)
  git rebase -i HEAD~5

  # 4. Merge
  gh pr merge --squash

  ---
  🏆 Success Metrics

  Code Quality KPIs
  ┌───────────────────────┬──────────┬───────────────────────────────────┐
  │        Metric         │  Target  │            Measurement            │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Test Coverage         │ ≥ 80%    │ npm run test:coverage             │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Bug Escape Rate       │ < 5%     │ Bugs found in prod / total bugs   │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ CI Pipeline Success   │ ≥ 95%    │ Successful builds / total builds  │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Time to Fix Bugs      │ < 24h    │ Time from report to fix           │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Code Review Time      │ < 4h     │ Time from PR creation to approval │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Deployment Frequency  │ Daily    │ Deploys to production per day     │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Mean Time to Recovery │ < 1h     │ Time to rollback/fix prod issues  │
  ├───────────────────────┼──────────┼───────────────────────────────────┤
  │ Test Execution Time   │ < 10 min │ Full CI pipeline duration         │
  └───────────────────────┴──────────┴───────────────────────────────────┘
  ---
  🚀 Implementation Roadmap

  Phase 1: Foundation (Week 1)

  - Install testing tools (npm install -D vitest @testing-library/react)
  - Configure CI/CD pipeline (.github/workflows/ci-test-matrix.yml)
  - Set up pre-commit hooks (Husky + lint-staged)
  - Configure ESLint/Prettier/TypeScript
  - Write first TDD example

  Phase 2: Testing (Week 2)

  - Write unit tests for critical code (aim for 100% coverage)
  - Add component tests for UI
  - Set up E2E testing (Playwright)
  - Configure visual regression testing
  - Achieve 80% overall coverage

  Phase 3: Automation (Week 3)

  - Automate CI pipeline (all checks green)
  - Set up security scanning (Trivy + npm audit)
  - Configure coverage thresholds (block PRs < 80%)
  - Add contract testing (if microservices)
  - Set up monitoring/alerts

  Phase 4: Refinement (Week 4)

  - Optimize test execution time (parallel tests)
  - Add performance benchmarks
  - Document testing best practices
  - Train team on TDD workflow
  - Continuous improvement (retrospectives)

  ---
  💾 Copy-Paste Scripts

  Install All Tools

  # Testing
  npm install -D vitest @vitest/ui @vitest/coverage-v8
  npm install -D @testing-library/react @testing-library/user-event @testing-library/jest-dom
  npm install -D @playwright/test playwright
  npm install -D jest-image-snapshot
  npm install -D @pact-foundation/pact

  # Code Quality
  npm install -D eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser
  npm install -D prettier eslint-config-prettier eslint-plugin-prettier
  npm install -D eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y
  npm install -D eslint-plugin-security

  # Git Hooks
  npm install -D husky lint-staged

  # TypeScript
  npm install -D typescript @types/node @types/react @types/react-dom

  # Initialize Husky
  npx husky init

  .husky/pre-commit

  #!/bin/sh
  . "$(dirname "$0")/_/husky.sh"

  npm run lint
  npm run type-check
  npm run test:unit

  package.json (lint-staged)

  {
    "lint-staged": {
      "*.{ts,tsx,js,jsx}": [
        "eslint --fix",
        "prettier --write",
        "vitest related --run"
      ],
      "*.{json,md}": [
        "prettier --write"
      ]
    }
  }

  ---
  🎉 You now have enterprise-grade QA and code management practices!

  Key Takeaways:
  1. ✅ Test-first always (TDD Red-Green-Refactor)
  2. ✅ Regression tests for bugs (test must fail before fix, pass after)
  3. ✅ 100% coverage for critical code (80% for everything else)
  4. ✅ Automate everything (CI/CD, security, quality checks)
  5. ✅ Fast feedback loops (< 10 min CI pipeline)
  6. ✅ Block bad code (coverage thresholds, linting, type-checking)