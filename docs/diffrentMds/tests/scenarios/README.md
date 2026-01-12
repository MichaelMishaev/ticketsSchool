# TicketCap Test Scenarios - Comprehensive Documentation

This directory contains comprehensive test scenarios for the TicketCap event registration system. These scenarios cover all aspects of the application including functional requirements, security, performance, accessibility, and edge cases.

## 📋 Overview

The test scenarios are organized into 9 major categories covering over 500 individual test cases. Each scenario follows a consistent format:

```
### Scenario Title
- **Given**: Initial conditions/context
- **When**: Action or trigger
- **Then**: Expected outcome/behavior
```

## 📁 Scenario Categories

### [01. Authentication & Authorization](./01-authentication-authorization.md)
**90+ scenarios** covering:
- Email/password signup and login flows
- Email verification
- Google OAuth integration
- Password reset functionality
- Role-based access control (SUPER_ADMIN, OWNER, ADMIN, MANAGER, VIEWER)
- Session management and JWT tokens
- Security considerations (XSS, CSRF prevention)
- Mobile authentication UX

**Key Areas:**
- New user registration and onboarding
- Multi-factor authentication setup (future)
- Account linking and security
- Session expiration and renewal

---

### [02. School Management](./02-school-management.md)
**70+ scenarios** covering:
- School onboarding and setup
- School profile management
- Team invitations and management
- Role assignments and permissions
- Usage tracking and plan limits
- Subscription management
- Multi-school administration (SUPER_ADMIN)
- School data export and deletion

**Key Areas:**
- Team collaboration features
- Ownership transfer
- Plan upgrades and billing
- White-label customization (ENTERPRISE)

---

### [03. Event Management](./03-event-management.md)
**80+ scenarios** covering:
- Event creation with standard and custom fields
- Event editing and capacity management
- Event deletion and archiving
- Custom registration fields (text, email, phone, dropdown, checkbox, etc.)
- Event slugs and public URLs
- Event duplication
- Capacity enforcement and waitlist management
- Event analytics and reporting

**Key Areas:**
- Multi-tenant event isolation
- Event lifecycle management
- Custom field schema design
- Mobile event management

---

### [04. Public Registration Flow](./04-public-registration-flow.md)
**80+ scenarios** covering:
- Public event page viewing
- Registration form submission
- Form validation (client and server-side)
- Phone number normalization (Israeli format)
- Custom field handling
- Capacity enforcement during registration
- Confirmation codes and emails
- Waitlist registration
- Mobile registration UX
- Error handling and recovery

**Key Areas:**
- Race condition prevention
- Atomic capacity checks
- Real-time validation
- Accessibility and Hebrew RTL

---

### [05. Admin Registration Management](./05-admin-registration-management.md)
**90+ scenarios** covering:
- View and search registrations
- Edit registration details
- Cancel and reactivate registrations
- Manual registration entry
- Waitlist promotion
- Bulk operations
- Export to CSV/Excel
- Email and SMS notifications (future)
- Registration analytics
- Check-in management (future)
- Role-based permissions

**Key Areas:**
- Multi-tenant data isolation
- Permission boundaries by role
- Export performance
- Communication with registrants

---

### [06. Multi-Tenancy & Security](./06-multi-tenancy-security.md)
**95+ scenarios** covering:
- Data isolation between schools (events, registrations, team)
- SUPER_ADMIN special access
- Session security (JWT, HTTP-only cookies)
- API authorization patterns
- SQL injection prevention
- XSS and CSRF protection
- Authentication security (password hashing, brute force protection)
- Authorization edge cases
- Sensitive data exposure prevention
- Audit logging (future)
- Secure configuration
- Input validation and sanitization

**Key Areas:**
- Critical security vulnerabilities (OWASP Top 10)
- Consistent schoolId enforcement
- Token security and validation
- Defense in depth

---

### [07. Edge Cases & Error Handling](./07-edge-cases-error-handling.md)
**100+ scenarios** covering:
- Database connection failures
- Email sending failures
- Concurrent operations and race conditions
- Invalid or malformed data
- Time and date edge cases (timezones, DST, midnight)
- Network and connectivity issues
- File upload edge cases
- Browser and device compatibility
- Data integrity issues
- API rate limiting and abuse prevention
- Payment and billing edge cases (future)
- Locale and language handling
- Unusual user behavior
- Third-party service failures
- Deployment and configuration errors
- Resource exhaustion

**Key Areas:**
- Graceful degradation
- Error recovery
- Data consistency
- Failover strategies

---

### [08. UI/UX & Accessibility](./08-ui-ux-accessibility.md)
**90+ scenarios** covering:
- Mobile responsiveness (375px to 1920px)
- Hebrew RTL layout and bidirectional text
- Touch targets and mobile UX
- Visual feedback and loading states
- Form usability and validation
- Color contrast (WCAG AA compliance)
- Keyboard accessibility
- Screen reader compatibility
- Visual design consistency
- Animations and transitions
- Error prevention and recovery
- Performance perception
- Empty states
- Mobile keyboard handling
- Internationalization and locale

**Key Areas:**
- WCAG 2.0 AA compliance
- Mobile-first design
- Hebrew language support
- Universal design principles

---

### [09. Performance & Scale](./09-performance-scale.md)
**85+ scenarios** covering:
- Page load performance (FCP, LCP, TTI, CLS)
- Database query performance
- Registration performance under high load
- Export performance (CSV/Excel)
- Search performance
- Memory usage and leak detection
- Database indexing strategies
- API response times (P50, P95, P99)
- Caching strategies (future)
- Horizontal scalability
- Database optimization
- Frontend performance (bundle size, image optimization)
- Load testing (10, 100, 500, 1000+ concurrent users)
- Real-world monitoring (APM, uptime)
- Optimization strategies

**Key Areas:**
- Core Web Vitals
- Atomic operations performance
- Query optimization
- Scalability patterns

---

## 🎯 Test Priority Levels

Each scenario file categorizes tests by priority:

- **Critical (P0)**: Must pass before any release. Core functionality, security, data integrity.
- **High (P1)**: Essential features and common workflows. Should pass before major releases.
- **Medium (P2)**: Important but not blocking. Can be addressed in minor releases.
- **Low (P3)**: Nice-to-have features, future enhancements, edge cases.

## 📊 Statistics

| Category | Scenario Count | P0 (Critical) | P1 (High) | P2 (Medium) | P3 (Low) |
|----------|---------------|---------------|-----------|-------------|----------|
| Authentication | 90 | 25 | 45 | 18 | 2 |
| School Management | 70 | 22 | 30 | 15 | 3 |
| Event Management | 80 | 28 | 32 | 17 | 3 |
| Public Registration | 80 | 30 | 35 | 12 | 3 |
| Admin Registration | 90 | 32 | 38 | 16 | 4 |
| Multi-Tenancy & Security | 95 | 45 | 35 | 15 | 0 |
| Edge Cases & Error Handling | 100 | 35 | 40 | 20 | 5 |
| UI/UX & Accessibility | 90 | 28 | 42 | 18 | 2 |
| Performance & Scale | 85 | 30 | 40 | 15 | 0 |
| **TOTAL** | **780** | **275** | **337** | **146** | **22** |

## 🏗️ Architecture Context

These scenarios are designed for **TicketCap**, a multi-tenant event registration system with:

- **Tech Stack**: Next.js 15.5.3, React 19, TypeScript, Prisma 6, PostgreSQL, TailwindCSS 4
- **Key Features**:
  - JWT-based authentication with role-based access control
  - Atomic capacity enforcement preventing overbooking
  - Multi-tenant data isolation at the school level
  - Hebrew RTL support and Israeli localization
  - Mobile-first responsive design
  - Real-time registration tracking

- **Roles**: SUPER_ADMIN (platform), OWNER (school), ADMIN, MANAGER, VIEWER
- **Plans**: FREE, STARTER, PRO, ENTERPRISE with usage limits

## 🧪 Using These Scenarios

### For Manual Testing
1. Navigate to the relevant scenario file
2. Follow the Given-When-Then steps
3. Verify expected outcomes
4. Log any deviations or bugs

### For Automation (Playwright)
1. Use scenarios as specification for test cases
2. Prioritize P0 and P1 scenarios first
3. Implement as E2E tests in `/tests` directory
4. Reference scenario number in test description

Example:
```typescript
test('[01.1.1] Complete signup flow with email verification', async ({ page }) => {
  // Given: User is on landing page
  await page.goto('/')

  // When: User clicks signup and fills valid details
  await page.click('text=Sign Up')
  await page.fill('input[name="email"]', 'test@example.com')
  // ... rest of the test

  // Then: Account created successfully
  await expect(page.locator('text=Verification email sent')).toBeVisible()
})
```

### For Test Coverage Analysis
- Map implemented tests to scenario numbers
- Track coverage percentage by category
- Identify gaps in test coverage
- Prioritize missing P0/P1 tests

## 🔄 Maintenance

These scenarios should be updated when:
- New features are added
- Requirements change
- Bugs are discovered (add regression test scenario)
- Performance requirements change
- Security vulnerabilities are addressed

## 📝 Scenario Format Guidelines

Each scenario should follow this structure:

```markdown
### X.Y Scenario Title
- **Given**: Clear preconditions and context
- **When**: Specific action or trigger
- **Then**: Expected observable outcome
  - Multiple outcomes can be listed
  - Include error cases
  - Specify data changes
```

**Best Practices:**
- Keep scenarios atomic (one behavior per scenario)
- Use concrete examples over abstract descriptions
- Include both happy path and error cases
- Consider mobile and desktop separately when UX differs
- Address Hebrew RTL specifics for UI scenarios
- Include performance expectations where relevant

## 🚀 Quick Start for Test Implementation

### Recommended Implementation Order

1. **Phase 1 - Core Functionality (P0)**
   - 06. Multi-Tenancy & Security (all P0 scenarios) - **CRITICAL FIRST**
   - 01. Authentication & Authorization (P0)
   - 04. Public Registration Flow (P0)
   - 03. Event Management (P0)

2. **Phase 2 - Admin Features (P0 + P1)**
   - 05. Admin Registration Management (P0, P1)
   - 02. School Management (P0, P1)
   - 07. Edge Cases & Error Handling (P0, P1)

3. **Phase 3 - Quality & UX (P1)**
   - 08. UI/UX & Accessibility (P1)
   - 09. Performance & Scale (P1)

4. **Phase 4 - Comprehensive Coverage (P2, P3)**
   - All remaining scenarios by priority

### Test Data Setup

Create test fixtures for:
- Multiple schools (School A, B, C) with different plans
- Admin users with different roles
- Events with various configurations (full, open, past, future)
- Registrations in different states (confirmed, waitlist, cancelled)
- Custom field schemas

### Environment Setup

Ensure test environment has:
- PostgreSQL test database
- Valid JWT_SECRET
- Test email configuration (Resend test mode)
- Google OAuth test credentials (if testing OAuth)

## 📞 Support

For questions about these scenarios:
- Reference the scenario number (e.g., "01.1.1")
- Check `/app/docs/bugs/bugs.md` for known issues
- Review `CLAUDE.md` for architecture context
- Consult `README.md` for setup instructions

## 🎓 Learning Resources

Understanding the codebase:
- **Authentication**: `/lib/auth.server.ts` - Session management
- **Multi-tenancy**: All API routes enforce schoolId filtering
- **Capacity**: Prisma transactions in registration API
- **Custom Fields**: Event.fieldsSchema JSON schema
- **Mobile**: TailwindCSS responsive classes, 44px touch targets

---

**Total Test Scenarios**: 780
**Priority Distribution**: 35% Critical (P0), 43% High (P1), 19% Medium (P2), 3% Low (P3)
**Estimated Manual Test Time**: ~120 hours for all scenarios
**Recommended Automation Coverage**: 80% (focus on P0/P1)

Last Updated: 2025-12-05
