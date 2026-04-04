#!/bin/bash

# E2E Test Migration Script
# Reduces E2E tests from 71 to 10 critical flows
# Created: 2026-01-12

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

echo "========================================="
echo "E2E Test Migration Script"
echo "========================================="
echo ""
echo "This will reduce E2E tests from 71 to 10 critical flows."
echo "All archived tests will be moved to tests/archived-e2e/"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 1
fi

echo ""
echo "Step 1: Creating archive directories..."
mkdir -p tests/archived-e2e/{debug,visual,redundant,non-critical-features}
mkdir -p tests/integration
echo "✓ Directories created"

echo ""
echo "Step 2: Archiving debug tests (19 files)..."
mv tests/ultra-debug-test.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/debug-*.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/real-*.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/final-*.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/minimal-test.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/simple-*.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/landing-*.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/url-visual-test.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
mv tests/suites/99-minimal-test.spec.ts tests/archived-e2e/debug/ 2>/dev/null || true
echo "✓ Debug tests archived"

echo ""
echo "Step 3: Archiving visual tests (6 files)..."
mv tests/hero-with-badge.spec.ts tests/archived-e2e/visual/ 2>/dev/null || true
mv tests/green-box-layout.spec.ts tests/archived-e2e/visual/ 2>/dev/null || true
mv tests/purple-box-layout.spec.ts tests/archived-e2e/visual/ 2>/dev/null || true
mv tests/signup-section-screenshot.spec.ts tests/archived-e2e/visual/ 2>/dev/null || true
mv tests/step2-signup-box.spec.ts tests/archived-e2e/visual/ 2>/dev/null || true
mv tests/visual/ tests/archived-e2e/ 2>/dev/null || true
echo "✓ Visual tests archived"

echo ""
echo "Step 4: Archiving redundant tests (15 files)..."
mv tests/suites/01-auth-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/02-school-management-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/03-event-management-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/05-admin-registration-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/07-edge-cases-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/08-event-tabs-navigation-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/08-ui-ux-p0.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/suites/10-ui-regression-p1.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/admin-login-*.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/basic.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/create-event-dropdown.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/event-*.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/e2e-flow.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
mv tests/verify-navigation-works.spec.ts tests/archived-e2e/redundant/ 2>/dev/null || true
echo "✓ Redundant tests archived"

echo ""
echo "Step 5: Archiving non-critical feature tests (11 files)..."
mv tests/suites/06-multi-tenant-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/07-table-management-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/09-ban-enforcement-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/09-performance-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/09-sse-realtime-updates-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/10-attendance-ban-management-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/10-mobile-event-management-p0.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/suites/leads-management.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/table-event-registration-page.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/navigation-performance.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
mv tests/responsive-all-pages.spec.ts tests/archived-e2e/non-critical-features/ 2>/dev/null || true
echo "✓ Non-critical feature tests archived"

echo ""
echo "Step 6: Moving integration test candidates (8 files)..."
mv tests/critical/behavior-locks.spec.ts tests/integration/ 2>/dev/null || true
mv tests/critical/negative-tests.spec.ts tests/integration/ 2>/dev/null || true
mv tests/critical/registration-edge-cases.spec.ts tests/integration/ 2>/dev/null || true
mv tests/critical/runtime-guards.spec.ts tests/integration/ 2>/dev/null || true
mv tests/critical/security-validation.spec.ts tests/integration/ 2>/dev/null || true
mv tests/security/ tests/integration/ 2>/dev/null || true
mv tests/suites/08-security-regression-p0.spec.ts tests/integration/ 2>/dev/null || true
mv tests/qa-full-app.spec.ts tests/integration/ 2>/dev/null || true
echo "✓ Integration test candidates moved"

echo ""
echo "Step 7: Creating archive README..."
cat > tests/archived-e2e/README.md << 'EOF'
# Archived E2E Tests

These tests were archived on 2026-01-12 as part of the E2E test optimization.

## Why Archived?
- **Debug tests**: Created for debugging specific issues, no longer needed
- **Visual tests**: Moved to visual regression tools (Percy/Chromatic)
- **Redundant tests**: Coverage provided by critical tests
- **Non-critical features**: Low usage, moved to integration tests

## Categories
- `debug/` - Debug and temporary test artifacts (19 files)
- `visual/` - UI-only and screenshot tests (6 files)
- `redundant/` - Tests with overlapping coverage (15 files)
- `non-critical-features/` - Low usage features (11 files)

## Restoring a Test
If you need to restore a test:
1. Move file back to `tests/`
2. Update dependencies if needed
3. Run test to verify it still works
4. Update this README with justification

## Deletion Schedule
These tests will be permanently deleted after 90 days (2026-04-12).
EOF
echo "✓ README created"

echo ""
echo "Step 8: Verification..."
ACTIVE_COUNT=$(find tests -name "*.spec.ts" -not -path "tests/archived-e2e/*" -not -path "tests/integration/*" -type f | wc -l | tr -d ' ')
ARCHIVED_COUNT=$(find tests/archived-e2e -name "*.spec.ts" -type f 2>/dev/null | wc -l | tr -d ' ')
INTEGRATION_COUNT=$(find tests/integration -name "*.spec.ts" -type f 2>/dev/null | wc -l | tr -d ' ')

echo ""
echo "========================================="
echo "Migration Complete!"
echo "========================================="
echo ""
echo "Results:"
echo "  Active E2E tests:        $ACTIVE_COUNT (target: 10)"
echo "  Archived tests:          $ARCHIVED_COUNT (target: 56)"
echo "  Integration candidates:  $INTEGRATION_COUNT (target: 8)"
echo ""

if [ "$ACTIVE_COUNT" -le 12 ] && [ "$ACTIVE_COUNT" -ge 8 ]; then
    echo "✓ Migration successful! Active test count is within target range."
else
    echo "⚠ Warning: Active test count ($ACTIVE_COUNT) is outside target range (8-12)."
fi

echo ""
echo "Active E2E tests:"
find tests -name "*.spec.ts" -not -path "tests/archived-e2e/*" -not -path "tests/integration/*" -type f | sort

echo ""
echo "Next steps:"
echo "1. Run tests to verify: npm test"
echo "2. Update CI pipeline (.github/workflows/test.yml)"
echo "3. Monitor for 2 weeks"
echo "4. Convert integration tests to Jest unit tests"
echo "5. Delete archives after 90 days (2026-04-12)"
echo ""
echo "See docs/development/E2E_TEST_MIGRATION_PLAN.md for details."
