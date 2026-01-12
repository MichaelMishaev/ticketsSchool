# QA Tests for Multi-School Features

This directory contains comprehensive Playwright tests for the multi-tenant school management system.

## Test Structure

```
app/qa/
├── playwright.config.ts          # Playwright configuration for QA tests
├── fixtures/
│   ├── auth.ts                   # Authentication helpers and fixtures
│   └── test-data.ts              # Test data and constants
├── multi-school-isolation.spec.ts   # Tests for school data isolation
├── invitation-flow.spec.ts          # Tests for team invitation system
└── super-admin-access.spec.ts       # Tests for super admin features
```

## Test Suites

### 1. Multi-School Isolation Tests (`multi-school-isolation.spec.ts`)

Tests that verify proper data isolation between schools:

- ✅ Creating multiple separate schools
- ✅ School admins can only see their own events
- ✅ Dashboard stats are filtered by school
- ✅ School admins cannot access other schools' data
- ✅ Regular admins cannot access super admin features

### 2. Team Invitation Flow Tests (`invitation-flow.spec.ts`)

Tests the complete team invitation workflow:

- ✅ Owner/Admin can send team invitations
- ✅ Invitations appear in the team management interface
- ✅ Invitations can be revoked
- ✅ Duplicate invitations are prevented
- ⚠️ Invitation acceptance (requires email token retrieval)

### 3. Super Admin Access Tests (`super-admin-access.spec.ts`)

Tests super admin capabilities:

- ✅ Super admin can login and access dashboard
- ✅ Super admin sees global statistics across all schools
- ✅ Super admin can filter events by school
- ✅ Super admin can access events from any school
- ✅ Super admin can manage team members
- ✅ Regular admins cannot access super admin features

## Running the Tests

### Prerequisites

1. Install dependencies:
   ```bash
   npm install
   npx playwright install
   ```

2. Set up test database:
   ```bash
   npm run db:push
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Make sure it's running on `http://localhost:9000` (or update `BASE_URL` in config)

### Run All QA Tests

```bash
# From project root
npx playwright test --config=app/qa/playwright.config.ts

# Or from qa directory
cd app/qa
npx playwright test
```

### Run Specific Test Suite

```bash
npx playwright test app/qa/multi-school-isolation.spec.ts
npx playwright test app/qa/invitation-flow.spec.ts
npx playwright test app/qa/super-admin-access.spec.ts
```

### Run Tests in UI Mode

```bash
npx playwright test --config=app/qa/playwright.config.ts --ui
```

### Debug Tests

```bash
npx playwright test --config=app/qa/playwright.config.ts --debug
```

### View Test Report

```bash
npx playwright show-report playwright-report-qa
```

## Test Configuration

The tests use a separate Playwright config (`app/qa/playwright.config.ts`) with:

- **Sequential execution**: Tests run one at a time to avoid data conflicts
- **Single worker**: Ensures consistency in database state
- **Video on failure**: Captures videos when tests fail
- **Screenshots on failure**: Takes screenshots for debugging

## Environment Variables

You can customize the test environment:

```bash
# Use different base URL
BASE_URL=https://kartis.info npx playwright test --config=app/qa/playwright.config.ts

# Run in CI mode
CI=true npx playwright test --config=app/qa/playwright.config.ts
```

## Test Data

Test accounts are automatically created during test execution:

- **Super Admin**: `admin@beeri.com` / `beeri123`
- **School Admins**: Generated dynamically with unique emails
- **Team Members**: Created via invitation flow

All test data uses email format: `{prefix}-{timestamp}@playwright-test.com`

## Known Limitations

1. **Invitation Token Retrieval**: Full invitation acceptance tests require access to email tokens. Current implementation tests the UI structure but cannot complete the full flow without database access or test API endpoints.

2. **Database State**: Tests assume a clean or semi-clean database. Running tests multiple times may accumulate test data.

3. **Email Integration**: Tests don't actually send emails. Invitation tokens would need to be retrieved from the database or via a test endpoint.

## Adding New Tests

1. Create a new `.spec.ts` file in `app/qa/`
2. Import fixtures from `./fixtures/auth` and `./fixtures/test-data`
3. Use descriptive test names and include comments
4. Update this README with new test suite information

## Best Practices

- ✅ Use `test.describe()` to group related tests
- ✅ Use `test.beforeAll()` for setup that can be shared
- ✅ Generate unique test data to avoid conflicts
- ✅ Clean up after tests when possible
- ✅ Use meaningful assertions with good error messages
- ✅ Add console.log statements for debugging

## Continuous Integration

To run these tests in CI:

```yaml
# .github/workflows/qa-tests.yml
name: QA Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run db:push
      - run: npm run dev &
      - run: npx playwright test --config=app/qa/playwright.config.ts
```

## Troubleshooting

**Tests timing out?**
- Increase timeout in config: `timeout: 60000`
- Check if dev server is running on correct port

**Authentication failures?**
- Verify admin credentials in test-data.ts
- Check if session cookies are being set correctly

**Data isolation failures?**
- Ensure schoolId filtering is implemented in all APIs
- Check Prisma queries for proper where clauses

**Can't see test results?**
- Run with `--reporter=list` for console output
- Check `playwright-report-qa/` directory

## Support

For issues or questions about these tests, please check:
- Test output and screenshots in `playwright-report-qa/`
- Console logs in test files
- Project documentation in `/app/docs/`
