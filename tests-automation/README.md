# Test Automation Suite

Comprehensive end-to-end test automation for kartis.info platform.

## 📁 Structure

```
tests-automation/
├── helpers/           # Reusable test utilities
│   ├── test-data.ts      # Test data factory
│   ├── auth-helpers.ts   # Authentication utilities
│   └── event-helpers.ts  # Event management utilities
├── public/            # Public-facing tests
│   ├── landing-page.spec.ts
│   └── event-registration.spec.ts
├── auth/              # Authentication flow tests
│   ├── login.spec.ts
│   └── signup.spec.ts
├── admin/             # Admin panel tests
│   └── dashboard.spec.ts
├── security/          # Security and isolation tests
│   └── multi-tenant-isolation.spec.ts
└── README.md
```

## 🚀 Running Tests

### Run all tests

```bash
npx playwright test --config=playwright-automation.config.ts
```

### Run specific test file

```bash
npx playwright test tests-automation/public/landing-page.spec.ts --config=playwright-automation.config.ts
```

### Run with UI mode (visual debugging)

```bash
npx playwright test --ui --config=playwright-automation.config.ts
```

### Run on specific browser

```bash
npx playwright test --project="Desktop Chrome" --config=playwright-automation.config.ts
npx playwright test --project="Mobile Safari" --config=playwright-automation.config.ts
```

### Run in headed mode (see browser)

```bash
npx playwright test --headed --config=playwright-automation.config.ts
```

## 📊 View Report

After running tests:

```bash
npx playwright show-report playwright-automation-report
```

## ✅ Test Coverage

### Public Flows (2 files, 15+ tests)

- Landing page navigation and responsiveness
- Event registration form validation (Bug #18, #19 fixes)
- Capacity indicators and waitlist logic
- Mobile responsiveness (375px - 1920px)

### Authentication (2 files, 20+ tests)

- Login with email/password
- Signup with two-step form (Bug #13 fix)
- Session cookie security (Bug #2 fix)
- Email verification flow (Bug #14 fix)
- Mobile responsiveness

### Admin Dashboard (1 file, 12+ tests)

- Stats cards and drilldown modals
- Super admin button visibility (Bug #12 fix)
- Navigation and logout
- Mobile menu and responsiveness

### Security (1 file, 12+ tests)

- Multi-tenant data isolation (Bug #11 fix)
- Cross-school event access prevention
- JWT session security (Bug #2 fix)
- Role-based access control

## 🧪 Test Data

Tests use predefined test accounts and data from `helpers/test-data.ts`:

- **School A:** test-school-alpha (admin-a@playwright-test.com)
- **School B:** test-school-beta (admin-b@playwright-test.com)
- **Super Admin:** super@playwright-test.com

## 🛡️ Critical Security Tests

The `security/multi-tenant-isolation.spec.ts` file contains critical tests that verify:

- School A cannot see School B's events
- School A cannot access School B's event details
- Dashboard stats are school-specific
- SUPER_ADMIN can see all schools
- JWT tampering is detected

**These tests MUST pass before production deployment.**

## 📱 Mobile Testing

All tests include mobile viewport testing:

- iPhone SE: 375px x 667px
- iPad Pro: 1024px x 1366px
- Touch targets minimum 44px height
- Dark text on white background (Bug #18 fix)

## 🐛 Bug Coverage

Tests verify fixes for documented bugs:

- Bug #2: Session tampering (JWT security)
- Bug #11: Multi-tenant isolation
- Bug #12: Super admin button visibility
- Bug #13: Two-step signup form
- Bug #14: Resend verification email
- Bug #18: White text on white background (mobile)
- Bug #19: Form validation with missing fields

## 📈 Success Criteria

- ✅ All tests pass (100% pass rate)
- ✅ No security vulnerabilities found
- ✅ Mobile tests pass on 375px viewport
- ✅ Multi-tenant isolation verified
- ✅ Session security confirmed

## 🔧 Troubleshooting

### Tests fail with "baseURL not available"

Ensure dev server is running on port 9000:

```bash
npm run dev
```

### Tests fail with authentication errors

Ensure test accounts exist in database. Create them via:

```bash
npm run school -- seed
```

### Tests are flaky

Increase timeouts in `playwright-automation.config.ts`

## 📚 Adding New Tests

1. Create test file in appropriate directory
2. Use helpers from `helpers/` for common operations
3. Follow naming convention: `feature-name.spec.ts`
4. Add test data to `helpers/test-data.ts` if needed
5. Run tests to verify
6. Update this README with coverage info

## 🎯 Priority Test Execution

**Phase 1 (Critical):**

1. `public/event-registration.spec.ts` - User registration flow
2. `auth/login.spec.ts` - Admin authentication
3. `security/multi-tenant-isolation.spec.ts` - Data isolation

**Phase 2 (Important):** 4. `admin/dashboard.spec.ts` - Admin features 5. `auth/signup.spec.ts` - User onboarding

**Phase 3 (Nice-to-have):** 6. `public/landing-page.spec.ts` - Marketing pages
