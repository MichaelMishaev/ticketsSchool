# Infrastructure Documentation

This directory contains documentation for TicketCap's infrastructure, CI/CD pipelines, and development workflows.

---

## CI/CD Pipeline

### Quick Start

**For Developers:**
- Read: [CI-CD-QUICK-START.md](./CI-CD-QUICK-START.md) (5 min read)
- Essential checklist before creating PRs
- How to fix common CI failures
- What gets checked and why

**For Repository Admins:**
- Read: [BRANCH-PROTECTION-SETUP.md](./BRANCH-PROTECTION-SETUP.md) (15 min read)
- Step-by-step setup instructions
- Testing and verification
- Troubleshooting guide

### Complete Documentation

**[CI-CD.md](./CI-CD.md)** - The complete guide (30 min read)
- Workflow descriptions
- Quality gates explanation
- Viewing test results
- Fixing failed CI runs
- Notification setup
- Best practices
- Metrics and monitoring

**[CI-CD-VISUAL-GUIDE.md](./CI-CD-VISUAL-GUIDE.md)** - Diagrams and flowcharts (20 min read)
- Complete workflow diagrams
- PR checks detailed flow
- Branch protection decision tree
- Error handling flow
- Timeline visualization

**[CI-CD-SETUP-SUMMARY.md](./CI-CD-SETUP-SUMMARY.md)** - Implementation summary (10 min read)
- What was created
- Files and their purposes
- Setup checklist
- Success criteria

---

## Pre-commit Hooks

**[pre-commit-hooks.md](./pre-commit-hooks.md)** - Local quality gates
- Husky + lint-staged setup
- Automatic formatting with Prettier
- ESLint on staged files
- Type checking before commit

**[HOOKS_SETUP_SUMMARY.md](./HOOKS_SETUP_SUMMARY.md)** - Setup summary
- What was configured
- How it works
- Troubleshooting

---

## Runtime Guards

**[runtime-guards.md](./runtime-guards.md)** - Production safety checks
- Whitelist-based security
- Type validation at runtime
- Multi-tenant isolation enforcement
- Error handling patterns

---

## Golden Path Canary Tests

**[golden-path-canary-setup.md](./golden-path-canary-setup.md)** - Smoke testing
- Quick smoke tests for critical paths
- Runs on every commit
- Fast feedback (<2 minutes)

---

## File Organization

```
docs/infrastructure/
├── README.md                         ← You are here
│
├── CI-CD.md                          ← Complete CI/CD guide
├── CI-CD-QUICK-START.md              ← Developer quick reference
├── CI-CD-VISUAL-GUIDE.md             ← Diagrams and flowcharts
├── CI-CD-SETUP-SUMMARY.md            ← Implementation summary
├── BRANCH-PROTECTION-SETUP.md        ← Admin setup guide
│
├── pre-commit-hooks.md               ← Pre-commit hooks guide
├── HOOKS_SETUP_SUMMARY.md            ← Hooks setup summary
│
├── runtime-guards.md                 ← Runtime validation
├── golden-path-canary-setup.md       ← Smoke tests
└── baseRules.md                      ← Core development rules
```

---

## Quick Reference

### For Daily Development

**Before creating a PR:**
```bash
npm run type-check    # Type safety
npm run lint          # Code quality
npm test              # Run tests
```

**After PR created:**
- CI runs automatically
- Review results in "Checks" tab
- Fix any failures locally
- Push fixes (CI re-runs)

**See:** [CI-CD-QUICK-START.md](./CI-CD-QUICK-START.md)

---

### For Repository Setup (One-time)

**Enable branch protection:**
1. Settings → Branches → Add rule
2. Branch: `main`
3. Enable required checks:
   - Type check
   - Lint check
   - P0 Critical Tests
4. Require 1 approval
5. Save

**See:** [BRANCH-PROTECTION-SETUP.md](./BRANCH-PROTECTION-SETUP.md)

---

### For Troubleshooting

**CI failures:**
- Check [CI-CD.md](./CI-CD.md) → "Fixing Failed CI Runs" section
- Download artifacts from GitHub Actions
- Reproduce locally: `npm test`

**Pre-commit hook failures:**
- Check [pre-commit-hooks.md](./pre-commit-hooks.md) → "Troubleshooting" section
- Run manually: `npm run lint:fix`
- Skip if needed (not recommended): `git commit --no-verify`

**Runtime errors:**
- Check [runtime-guards.md](./runtime-guards.md)
- Review error messages for validation failures
- Update whitelists if needed

---

## Documentation Map

### I want to...

**...set up CI/CD for the first time**
→ Start with [CI-CD-SETUP-SUMMARY.md](./CI-CD-SETUP-SUMMARY.md)
→ Then follow [BRANCH-PROTECTION-SETUP.md](./BRANCH-PROTECTION-SETUP.md)

**...understand what CI checks on my PRs**
→ Read [CI-CD-QUICK-START.md](./CI-CD-QUICK-START.md)

**...see visual diagrams of the workflow**
→ Check [CI-CD-VISUAL-GUIDE.md](./CI-CD-VISUAL-GUIDE.md)

**...fix a failing CI run**
→ See [CI-CD.md](./CI-CD.md) → "Fixing Failed CI Runs"

**...configure Slack notifications**
→ See [CI-CD.md](./CI-CD.md) → "Notification Setup"

**...set up pre-commit hooks**
→ Read [pre-commit-hooks.md](./pre-commit-hooks.md)

**...understand runtime validation**
→ Read [runtime-guards.md](./runtime-guards.md)

**...add new smoke tests**
→ Read [golden-path-canary-setup.md](./golden-path-canary-setup.md)

---

## Best Practices Summary

### 1. Always Run Tests Locally First
```bash
npm test  # Must pass before creating PR
```

### 2. Keep PRs Small
- Easier to review
- Faster CI runs
- Easier to debug

### 3. Write Tests as You Code
- Don't wait until the end
- TDD approach recommended
- Update tests when changing behavior

### 4. Never Bypass CI
- Don't ask admin to force-merge
- Fix the underlying issue
- CI exists to protect production

### 5. Monitor and Iterate
- Review CI metrics weekly
- Fix flaky tests immediately
- Improve documentation based on questions

**See:** [CI-CD.md](./CI-CD.md) → "Best Practices" for full list

---

## Support

### Getting Help

1. **Search documentation** - Use Cmd+F in relevant doc file
2. **Check examples** - Review existing PRs and workflow runs
3. **Ask team** - Create issue with `infrastructure` label
4. **Update docs** - If you find gaps, create PR to improve

### Contributing

**Found a bug in infrastructure setup?**
1. Document in `/docs/bugs/bugs.md`
2. Create PR with fix
3. Update relevant documentation
4. Add to troubleshooting section

**Want to improve documentation?**
1. Make changes
2. Create PR
3. Tag with `documentation` label

---

## Related Documentation

- [Main CLAUDE.md](../../CLAUDE.md) - Project overview and patterns
- [Testing Guide](../../tests/README.md) - Test organization and coverage
- [Bug Tracking](../bugs/bugs.md) - Known issues and fixes

---

## Changelog

### 2025-12-18 - Initial CI/CD Setup
- Created PR quality checks workflow
- Created nightly test suite workflow
- Created PR template
- Created comprehensive documentation suite
- Added branch protection instructions

---

**Questions?** Read the docs or create an issue with the `infrastructure` label.
