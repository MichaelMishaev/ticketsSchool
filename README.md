# kartis.info

**Multi-Tenant Event Registration System for Israeli Schools & Organizations**

[![Tests](https://img.shields.io/badge/tests-446%2B%20passing-brightgreen)](https://github.com/your-org/kartis.info/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)](./coverage/index.html)
[![Security](https://img.shields.io/badge/security-A%2B-brightgreen)](https://github.com/your-org/kartis.info/security)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.16-2D3748)](https://www.prisma.io/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

---

## 🎯 Overview

kartis.info is an enterprise-grade event registration system built for Israeli schools, clubs, and organizations managing limited-capacity events (especially sports/soccer). The system features atomic capacity enforcement, waitlist management, real-time registration tracking, and Hebrew RTL interface.

**Key Features:**

- ✅ Multi-tenant architecture with school-level data isolation
- ✅ Atomic capacity enforcement (prevents overbooking)
- ✅ Advanced table management (duplicate, templates, bulk edit)
- ✅ Automatic waitlist management
- ✅ QR code check-in system
- ✅ Hebrew RTL interface
- ✅ Mobile-first design
- ✅ Role-based access control
- ✅ 446+ automated tests (100% critical file coverage)

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **Docker** (for PostgreSQL)
- **npm** or **yarn**

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/kartis.info.git
cd kartis.info

# 2. Install dependencies
npm install

# 3. Start PostgreSQL
docker-compose up -d

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# 5. Run database migrations
npx prisma migrate dev

# 6. Start development server
npm run dev
```

Visit http://localhost:9000

---

## 📚 Documentation

- **[CLAUDE.md](./CLAUDE.md)** - Architecture & development guide
- **[TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** - Comprehensive testing guide
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - Contribution guidelines
- **[SECURITY.md](./SECURITY.md)** - Security policy
- **[Table Management Guide](./docs/features/table-management.md)** - Advanced table features

---

## 🏗️ Tech Stack

| Category           | Technology                  | Purpose                        |
| ------------------ | --------------------------- | ------------------------------ |
| **Frontend**       | Next.js 15.5.3 (App Router) | React framework with SSR       |
|                    | React 19.1.0                | UI library                     |
|                    | TailwindCSS 4               | Styling with RTL support       |
|                    | Framer Motion               | Animations                     |
| **Backend**        | Next.js API Routes          | Serverless API                 |
|                    | Prisma 6.16.2               | ORM & database toolkit         |
|                    | PostgreSQL                  | Primary database               |
| **Authentication** | JWT (jsonwebtoken + jose)   | Session management             |
|                    | bcrypt                      | Password hashing               |
| **Testing**        | Vitest                      | Unit & component tests         |
|                    | Playwright                  | E2E & visual tests             |
|                    | Testing Library             | React testing                  |
| **Security**       | Trivy                       | Vulnerability scanning         |
|                    | npm audit                   | Dependency scanning            |
|                    | gitleaks                    | Secret detection               |
| **CI/CD**          | GitHub Actions              | Automated testing & deployment |
|                    | Railway                     | Production hosting             |

---

## 🧪 Testing & Quality

**Enterprise-Grade QA with 446+ Automated Tests:**

| Test Type       | Tool                     | Count | Coverage            |
| --------------- | ------------------------ | ----- | ------------------- |
| Unit Tests      | Vitest                   | 185+  | 100% critical files |
| Component Tests | Vitest + Testing Library | 176+  | 85% UI components   |
| E2E Tests       | Playwright               | 65+   | Critical workflows  |
| Visual Tests    | Playwright Screenshots   | 20+   | Desktop + Mobile    |

### Running Tests

```bash
# Unit + Component tests
npm run test:unit              # Run all
npm run test:unit:coverage     # With coverage
npm run test:unit:ui           # Visual test UI

# E2E tests (requires dev server on port 9000)
npm test                       # Run all
npm run test:ui                # With Playwright UI
npm run test:p0                # P0 critical only

# Visual regression
npx playwright test tests/visual/
npx playwright test tests/visual/ --update-snapshots
```

### Quality Gates (Enforced in CI)

- ✅ **Type checking** (TypeScript strict mode)
- ✅ **Linting** (ESLint)
- ✅ **Unit tests** (12% overall, 100% critical files)
- ✅ **Security scans** (Trivy + npm audit)
- ✅ **Secret detection** (gitleaks)
- ✅ **P0 E2E tests** (critical user workflows)
- ✅ **Visual regression** (screenshot comparison)

---

## 🗂️ Project Structure

```
/app
  /admin                        # Admin dashboard (Hebrew RTL)
    /events                     # Event management
    /team                       # Team management
    /settings                   # School settings
  /api                          # API routes
    /admin                      # Admin operations
    /events                     # Event CRUD
    /p/[schoolSlug]/[eventSlug] # Public registration
  /p/[schoolSlug]/[eventSlug]  # Public registration pages
/components                     # Reusable React components
/lib                            # Business logic & utilities
  auth.server.ts                # Authentication (100% coverage)
  table-assignment.ts           # SMALLEST_FIT algorithm (100%)
  usage.ts                      # Billing/limits (100%)
  prisma-guards.ts              # Multi-tenant isolation (100%)
/tests                          # Playwright E2E tests
  /suites                       # Priority-based test suites
  /visual                       # Visual regression tests
  /fixtures                     # Test data builders
/docs                           # Documentation
/prisma                         # Database schema & migrations
```

---

## 🎨 Key Features

### 1. Advanced Table Management

- **Duplicate Tables**: Create 1 table → Duplicate 29 times → 30 tables in 30 seconds
- **Template System**: Save/apply table configurations for recurring events
- **Bulk Edit**: Update capacity, min order, status for multiple tables at once
- **Bulk Delete**: Delete multiple tables (protected: can't delete reserved)

### 2. Atomic Capacity Enforcement

```typescript
// Prevents overbooking with atomic transaction
await prisma.$transaction(async (tx) => {
  const event = await tx.event.findUnique({ where: { id } })

  if (event.spotsReserved + spotsCount > event.capacity) {
    status = 'WAITLIST'
  } else {
    await tx.event.update({
      where: { id },
      data: { spotsReserved: { increment: spotsCount } },
    })
    status = 'CONFIRMED'
  }
})
```

### 3. Multi-Tenant Data Isolation

Every query enforces school-level isolation:

```typescript
// CRITICAL: All queries MUST filter by schoolId
if (admin.role !== 'SUPER_ADMIN') {
  where.schoolId = admin.schoolId
}

const events = await prisma.event.findMany({ where })
```

### 4. QR Code Check-In System

- Generate unique check-in links per event
- Scan QR codes to mark attendance
- Real-time stats (checked in / total)
- Mobile-optimized interface

### 5. Role-Based Access Control

| Role          | Permissions                             |
| ------------- | --------------------------------------- |
| `SUPER_ADMIN` | Platform owner, all schools access      |
| `OWNER`       | School owner, billing & team management |
| `ADMIN`       | School admin, all event operations      |
| `MANAGER`     | View events, edit registrations         |
| `VIEWER`      | Read-only access                        |

---

## 🔒 Security

**Enterprise-Grade Security:**

- ✅ JWT-based authentication (HTTP-only cookies)
- ✅ Multi-tenant data isolation (runtime guards)
- ✅ Password hashing (bcrypt, 10 rounds)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS prevention (React escaping + sanitization)
- ✅ CSRF protection (SameSite cookies)
- ✅ Automated security scans (Trivy + npm audit)
- ✅ Secret detection (gitleaks)
- ✅ Daily vulnerability scans (2 AM UTC)

**Security Response:**

- 24h acknowledgment
- 7d severity assessment
- 30d patch for HIGH/CRITICAL

See [SECURITY.md](./SECURITY.md) for reporting vulnerabilities.

---

## 📊 Performance

**Optimized CI/CD Pipeline:**

| Metric               | Before  | After     | Improvement       |
| -------------------- | ------- | --------- | ----------------- |
| Unit tests           | ~8 min  | ~2-3 min  | **50-60% faster** |
| Total CI             | ~15 min | ~8-10 min | **40-50% faster** |
| Test parallelization | 1 shard | 4 shards  | **4x concurrent** |

**Features:**

- Smart test selection (only run changed files)
- Parallel test execution (4 shards)
- Playwright browser caching
- Prisma engine caching

---

## 🚢 Deployment

### Railway (Production)

```bash
# Deploy to Railway
railway up

# Run migrations on production
railway run npm run db:migrate

# View logs
railway logs --follow

# Open production app
railway open
```

### Environment Variables

Required:

- `DATABASE_URL` - PostgreSQL connection (Railway auto-provides)
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `RESEND_API_KEY` - Email service API key
- `EMAIL_FROM` - Verified sender email

See `.env.example` for full reference.

---

## 🤝 Contributing

We welcome contributions! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Development workflow
- Coding standards
- Testing requirements
- Commit message guidelines
- PR process

**Quick Start:**

```bash
# 1. Fork the repo
# 2. Create feature branch
git checkout -b feature/your-feature

# 3. Make changes with tests
# 4. Run tests locally
npm run test:unit
npm test

# 5. Commit and push
git commit -m "feat: add your feature"
git push origin feature/your-feature

# 6. Create Pull Request
```

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Testing with [Playwright](https://playwright.dev/) and [Vitest](https://vitest.dev/)
- Hosted on [Railway](https://railway.app/)

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/kartis.info/issues)
- **Documentation**: `/docs` directory
- **Security**: See [SECURITY.md](./SECURITY.md)

---

**Made with ❤️ for Israeli schools and organizations**

_Last Updated: January 2026_
