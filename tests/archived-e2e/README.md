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
