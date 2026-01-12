## Description

<!-- Provide a clear and concise description of your changes -->

## Type of Change

<!-- Mark the relevant option with an 'x' -->

- [ ] Bug fix (non-breaking change that fixes an issue)
- [ ] New feature (non-breaking change that adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Code refactoring
- [ ] Test coverage improvement

## Related Issues

<!-- Link related issues here. Use "Closes #123" to auto-close issues when PR is merged -->

Closes #

## Pre-Merge Checklist

### Testing

- [ ] **All tests pass locally** (`npm test`)
- [ ] **Tests added for new features/bug fixes**
- [ ] **Mobile tests pass** (`npm run test:mobile`) - if UI changes
- [ ] **No console errors or warnings** in browser/terminal
- [ ] **Tested on real mobile device** (if UI changes) - iOS and/or Android

### Code Quality

- [ ] **Type checking passes** (`npx tsc --noEmit`)
- [ ] **Linting passes** (`npm run lint`)
- [ ] **Code follows project conventions** (see CLAUDE.md)
- [ ] **No commented-out code or debug logs** (unless intentional)

### Security & Data

- [ ] **Multi-tenant isolation enforced** (if touching data queries)
- [ ] **No secrets or API keys committed**
- [ ] **Input validation added** (if new API endpoints)
- [ ] **SQL injection prevention verified** (using Prisma, not raw SQL)

### Documentation

- [ ] **CLAUDE.md updated** (if changing architecture/patterns)
- [ ] **Breaking changes documented** in PR description
- [ ] **Bug documented** in `/docs/bugs/bugs.md` (if bug fix)
- [ ] **API changes documented** (if new endpoints)

### Database Changes

- [ ] **Migration created** (`npx prisma migrate dev`)
- [ ] **Migration tested locally**
- [ ] **Test fixtures updated** (if schema changes)
- [ ] **Production migration plan documented** (if complex migration)

## Screenshots/Videos

<!-- If UI changes, add before/after screenshots -->
<!-- For mobile changes, include screenshots from iPhone AND Android -->

### Desktop

<!-- Screenshots here -->

### Mobile

<!-- Screenshots here -->

## Testing Instructions

<!-- Step-by-step instructions for reviewers to test your changes -->

1.
2.
3.

## Performance Impact

<!-- Does this change affect performance? Add metrics if applicable -->

- [ ] No performance impact
- [ ] Performance improved (add metrics)
- [ ] Performance degraded (explain why acceptable)

## Deployment Notes

<!-- Any special deployment considerations? -->

- [ ] No special deployment needed
- [ ] Environment variables need to be set (list them)
- [ ] Database migration required
- [ ] Requires production testing before full rollout

## Additional Context

<!-- Add any other context about the PR here -->

---

**Note to reviewers:** Please ensure all CI checks pass before approving. Pay special attention to:

- Multi-tenant data isolation (if data queries changed)
- Mobile responsiveness (if UI changed)
- Test coverage (all new code should have tests)
