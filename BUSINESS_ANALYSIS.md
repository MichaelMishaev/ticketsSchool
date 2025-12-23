# kartis.info - Business System Analysis
**Universal Event Registration & Capacity Management Platform**

---

## Executive Summary

**kartis.info** is a SaaS platform for managing ANY limited-capacity event with real-time registration tracking, automated waitlist management, and mobile-first Hebrew interface.

**Platform Versatility:** While initially designed for Israeli schools and sports clubs, kartis.info is a **general-purpose event management system** that works for:
- 🏫 Schools & Educational Events
- ⚽ Sports Clubs & Games
- 🎭 Community Events & Workshops
- 💼 Business Meetups & Networking
- 🎉 Private Events & Parties
- 🏢 Corporate Training Sessions
- 🎨 Classes & Courses
- 🍽️ Restaurant Reservations
- **ANY event with limited capacity**

**Go-to-Market Strategy:** Schools/sports clubs are our **beachhead market** (easier to reach, clear pain point), then expand to broader event organizers.

**Business Model:** Subscription-based SaaS with tiered pricing (FREE → STARTER → PRO → ENTERPRISE)

**Current Status:** Production-ready MVP deployed on Railway with automated CI/CD

---

## The Problem

**Anyone managing limited-capacity events faces the same challenges:**

### Universal Pain Points:
- **Manual registration chaos** - WhatsApp messages, spreadsheets, email forms, double bookings
- **Overbooking disasters** - No real-time capacity tracking leads to awkward cancellations
- **Mobile-first requirement** - Attendees register on phones, but most systems are desktop-only
- **Time waste** - Organizers spend hours manually managing registrations, confirmations, waitlists
- **No professional experience** - Generic tools (Google Forms) feel amateur, no confirmation codes

### Market-Specific Issues:
- **Hebrew RTL support** - Generic international platforms don't support proper Hebrew layout
- **Israeli phone format** - Manual phone number normalization (10 digits, +972 vs 0)
- **WhatsApp culture** - Israelis manage everything via WhatsApp, creating chaos for organizers

### Who Experiences This?
1. **Schools** - Field trips, parent-teacher meetings, school events
2. **Sports clubs** - Weekly games, tournaments, practice sessions
3. **Community organizers** - Workshops, classes, meetups
4. **Businesses** - Training sessions, networking events, seminars
5. **Restaurants/Venues** - Table reservations, private dining
6. **Event planners** - Any event with limited spots

---

## The Solution

### Core Features

**For Organizers (Admin Dashboard):**
- Create events in 2 minutes with custom registration fields
- Real-time capacity tracking (atomic enforcement prevents overbooking)
- Automatic waitlist management when full
- One-click registration editing/cancellation
- CSV export for reporting
- Multi-user team management (5-20 team members depending on plan)

**For Parents (Public Registration):**
- Mobile-first Hebrew interface
- Live capacity indicator ("15/30 spots left")
- Instant confirmation with unique code
- Screenshot-friendly confirmation screen
- Automatic waitlist if event full
- Duplicate prevention (by phone number)

**Advanced Features (NEW):**
- **Table Management** - Manage 30-40+ tables efficiently:
  - Duplicate tables with one click (create 1 → duplicate 29 times)
  - Template system for reusable table configurations
  - Bulk edit multiple tables at once
  - Perfect for soccer clubs managing multiple tables per game

### Technical Advantages

1. **Atomic Capacity Enforcement** - Database-level transactions prevent race conditions (no double bookings even during traffic spikes)
2. **Multi-Tenant Architecture** - Complete data isolation between organizations
3. **Mobile-Optimized** - 375px minimum width, Hebrew RTL, touch targets ≥44px
4. **Production-Ready** - Automated testing, CI/CD, health monitoring
5. **Israeli Phone Format** - Auto-normalizes phone numbers (10 digits, starts with 0)

---

## Business Model

### Pricing Tiers

| Plan | Price* | Events/Month | Registrations | Team Members | Target Customer |
|------|--------|--------------|---------------|--------------|-----------------|
| **FREE** | ₪0 | 3 | 100 | 1 | Trial users, small clubs |
| **STARTER** | ₪99/mo | Unlimited | 1,000 | 5 | Small schools, sports clubs |
| **PRO** | ₪399/mo | Unlimited | 10,000 | 20 | Medium schools, multiple clubs |
| **ENTERPRISE** | Custom | Unlimited | Unlimited | Unlimited | Large districts, federations |

**Example pricing (not finalized)*

### Revenue Streams

1. **Primary:** Monthly/annual subscriptions
2. **Add-ons:**
   - WhatsApp integration (PRO+)
   - SMS notifications (pay-per-message)
   - Custom branding & domain (PRO+)
   - White-label solution (ENTERPRISE)
3. **Future:** API access for integrations (PRO+)

### Feature Differentiation

| Feature | FREE | STARTER | PRO | ENTERPRISE |
|---------|------|---------|-----|------------|
| Events per month | 3 | Unlimited | Unlimited | Unlimited |
| Registrations/month | 100 | 1,000 | 10,000 | Unlimited |
| Team members | 1 | 5 | 20 | Unlimited |
| Multiple schools | 1 | 5 | Unlimited | Unlimited |
| Custom branding | ❌ | ✅ | ✅ | ✅ |
| Analytics | ❌ | ✅ | ✅ | ✅ |
| Custom domain | ❌ | ❌ | ✅ | ✅ |
| WhatsApp integration | ❌ | ❌ | ✅ | ✅ |
| API access | ❌ | ❌ | ✅ | ✅ |
| Priority support | ❌ | ❌ | ❌ | ✅ |
| White-label | ❌ | ❌ | ❌ | ✅ |

---

## Market Opportunity

### Total Addressable Market (TAM)

**kartis.info can serve ANY organization managing limited-capacity events:**

1. **Educational Institutions (Israel):** 4,500+ schools, colleges, training centers
   - Use cases: Field trips, parent-teacher meetings, workshops, open houses
   - Average: 5-10 events/month

2. **Sports & Recreation:** 2,500+ sports clubs, gyms, community centers
   - Use cases: Games, tournaments, classes, training sessions
   - Average: 15-20 events/month

3. **Business & Professional:** 15,000+ businesses, co-working spaces, professional organizations
   - Use cases: Networking events, seminars, training, team building
   - Average: 3-8 events/month

4. **Event Planners & Venues:** 2,000+ wedding planners, event companies, restaurants, theaters
   - Use cases: Private events, workshops, dining experiences, shows
   - Average: 20-30 events/month

5. **Community Organizations:** 1,000+ NGOs, religious organizations, hobby groups
   - Use cases: Meetups, classes, volunteer events, gatherings
   - Average: 5-10 events/month

### Market Size Calculation

**Israeli Market:**
- **Total addressable market (TAM):** 25,000+ organizations managing limited-capacity events
- **Serviceable addressable market (SAM):** ~5,000 organizations actively seeking digital solutions
- **Serviceable obtainable market (SOM):** ~500 customers in Year 1-2

**Global Expansion Potential:**
- Hebrew-speaking markets (diaspora communities)
- Other RTL languages (Arabic - 400M+ speakers)
- English version for international markets

### Beachhead Strategy: Schools & Sports Clubs First

**Why start with schools/sports clubs?**
1. ✅ Clear, immediate pain point (overbooking disasters are common)
2. ✅ High event frequency (weekly/monthly events = sticky usage)
3. ✅ Word-of-mouth networks (schools/clubs talk to each other)
4. ✅ Lower acquisition cost (concentrated in Facebook groups, forums)
5. ✅ Proof of concept for broader market

**Then expand to:**
- Community centers & NGOs (similar use case)
- Business events & corporate training (higher ARPU)
- Event planners & venues (enterprise tier)
- International markets (platform already multi-lingual ready)

### Revenue Potential

**Year 1 (Beachhead - Schools/Sports):**
- 50 customers × ₪199/mo average = ₪9,950/mo (₪119,400/year)

**Year 2 (Expand to Community/Business):**
- 200 customers × ₪249/mo average = ₪49,800/mo (₪597,600/year)

**Year 3 (Full Market Penetration):**
- 500 customers × ₪349/mo average = ₪174,500/mo (₪2,094,000/year)

**Enterprise Potential:**
- Event planning agencies: ₪2,000-5,000/mo (white-label, unlimited events)
- Corporate clients: ₪1,500-3,000/mo (multi-department usage)
- Venue chains: ₪3,000-10,000/mo (restaurant groups, theater chains)

---

## Competitive Advantages

### vs. International Platforms (Eventbrite/Eventim/Meetup):
- ❌ No Hebrew RTL support (UI breaks with Hebrew text)
- ❌ Desktop-first design (mobile registration clunky)
- ❌ Overkill features (ticketing, payments, complex analytics)
- ❌ Expensive (3-5% commission + fees per registration)
- ❌ Not built for Israeli market (phone format, payment methods)
- ✅ **kartis.info:** Simple, mobile-first, Hebrew-native, flat subscription pricing

### vs. Google Forms:
- ❌ No real-time capacity tracking (can't prevent overbooking)
- ❌ Manual waitlist management (organizer copies-pastes emails)
- ❌ No confirmation codes (attendees have nothing to show)
- ❌ Requires manual data cleanup (responses scattered)
- ❌ Not professional (no branding, generic Google interface)
- ✅ **kartis.info:** Automated capacity, instant confirmations, professional branding

### vs. Manual (WhatsApp/Excel):
- ❌ Hours of manual work (copy-paste names, count capacity)
- ❌ Overbooking disasters (no atomic tracking)
- ❌ No professional confirmation (screenshot of WhatsApp message?)
- ❌ Data scattered across platforms (WhatsApp + Excel + Email)
- ❌ No analytics (can't track trends, popular events)
- ✅ **kartis.info:** 10x faster, zero overbookings, all data in one place

### vs. Custom Development:
- ❌ Expensive (₪50,000+ to build custom system)
- ❌ Slow (6-12 months development time)
- ❌ Maintenance burden (need developer on retainer)
- ❌ No updates (stuck with v1.0 forever)
- ✅ **kartis.info:** ₪99-399/mo, ready today, continuous improvements

### Why kartis.info Wins:

**🎯 Focused Solution:** Built for ONE job (capacity-limited events), does it perfectly
**📱 Mobile-First:** 80%+ of registrations happen on phones, we're optimized for that
**🇮🇱 Israeli Market Fit:** Hebrew RTL, phone format, WhatsApp integration (roadmap)
**💰 Affordable:** Flat pricing, no per-registration fees
**🚀 Fast Setup:** Create event in 2 minutes, not 2 hours
**⚛️ Technical Excellence:** Atomic capacity enforcement (zero overbookings, even at scale)
**🌍 Universal Application:** Works for schools, meetups, business events, restaurants - ANY limited-capacity event

---

## Go-to-Market Strategy

### Beachhead Strategy: Schools & Sports Clubs → Expand to All Events

### Phase 1: Beachhead Market - Schools & Sports (Months 1-3)
**Target:** 10 beta customers (soccer clubs, small schools)
- **Why this segment first?** Clear pain point, easy to reach, high word-of-mouth
- **Pricing:** FREE trial → ₪99/mo STARTER
- **Channels:** Direct outreach, Facebook groups (Israeli parents), sports forums
- **Goal:** Prove product-market fit, gather testimonials, refine UX

### Phase 2: Expand Beachhead - Community & Education (Months 4-6)
**Target:** 50 paying customers (add community centers, hobby groups, tutors)
- **Pricing:** Introduce PRO tier (₪399/mo) for larger organizations
- **Channels:** Referral program (1 month free), content marketing (Hebrew blog), partnerships
- **Goal:** Establish brand in events space, build case studies

### Phase 3: Adjacent Markets - Business & Professional (Months 7-12)
**Target:** 200 paying customers (add corporate events, co-working spaces, training companies)
- **Pricing:** Launch ENTERPRISE tier (custom pricing, white-label)
- **Channels:** LinkedIn outreach, business event partnerships, demo webinars
- **Goal:** Higher ARPU customers, establish B2B credibility

### Phase 4: Full Market Expansion (Year 2)
**Target:** 500+ customers across ALL event types
- **New segments:**
  - Event planners & agencies (white-label solution)
  - Restaurants & venues (table management - we already built this!)
  - Entertainment (theaters, escape rooms, tours)
  - International expansion (English version, Arabic version)
- **Channels:**
  - Industry-specific marketing
  - Partner integrations (Waze Events, Google Calendar)
  - App stores (iOS/Android apps)
- **Goal:** Become THE platform for any limited-capacity event in Israel

### Distribution Channels (All Phases)

1. **Direct Sales**
   - Schools/clubs: Facebook groups, direct outreach to administrators
   - Businesses: LinkedIn, email campaigns, demo calls
   - Venues: Restaurant associations, event industry conferences

2. **Inbound Marketing**
   - Hebrew blog: "How to manage event registrations without chaos"
   - SEO: "רישום לאירועים" (event registration), "ניהול כרטיסים" (ticket management)
   - Video tutorials: YouTube demos in Hebrew

3. **Partnerships**
   - Sports federations (soccer, basketball)
   - Community center networks
   - Co-working space chains
   - Event planner associations

4. **Referral Program**
   - 1 month free for each successful referral
   - 10% commission for agencies/consultants who bring customers
   - "Powered by kartis.info" badge on public pages (FREE tier) → branding play

5. **Product-Led Growth**
   - Generous FREE tier (3 events/month) → attracts small organizers
   - Public event pages show "Powered by kartis.info" → virality
   - Easy upgrade path when users hit limits → natural conversion

---

## Key Metrics & KPIs

### Product Metrics
- **Monthly Active Organizations (MAO):** Schools/clubs creating events
- **Events Created Per Month:** Indicator of platform usage
- **Registrations Processed:** Volume indicator
- **Mobile Registration Rate:** Should be >80% (validates mobile-first approach)
- **Overbooking Rate:** Should be 0% (validates atomic capacity enforcement)

### Business Metrics
- **Monthly Recurring Revenue (MRR)**
- **Customer Acquisition Cost (CAC)**
- **Lifetime Value (LTV):** Target LTV:CAC ratio of 3:1
- **Churn Rate:** Target <5% monthly churn
- **Upgrade Rate:** FREE → STARTER conversion rate

### Current Status
- **Organizations:** 1 production deployment
- **Events Created:** Testing phase
- **Registrations Processed:** Testing phase
- **Deployment:** Production-ready on Railway
- **Test Coverage:** 65/780 automated tests (8% complete, infrastructure 100% ready)

---

## Technology & Scalability

### Built for Scale
- **Multi-tenant architecture** - Serve thousands of organizations on single platform
- **Cloud-native** - Deployed on Railway with auto-scaling
- **Modern stack** - Next.js 15, React 19, PostgreSQL, TypeScript
- **Automated testing** - 780 test scenarios planned, Playwright E2E testing
- **CI/CD pipeline** - Automated deployment on every code push

### Infrastructure Costs (estimated)
- **Free tier:** ₪0-200/mo (Railway, Resend, PostgreSQL)
- **100 customers:** ~₪500/mo infrastructure
- **500 customers:** ~₪1,500/mo infrastructure
- **Margin:** 85-90% gross margin after infrastructure costs

---

## Risks & Mitigation

| Risk | Mitigation |
|------|-----------|
| **Low adoption** | Free tier + referral program, direct outreach to early adopters |
| **Competition from generic platforms** | Israeli-specific features (Hebrew RTL, phone format, soccer focus) |
| **Schools hesitant to pay** | Freemium model, clear ROI (hours saved vs. ₪99/mo) |
| **Scalability issues** | Built on proven cloud infrastructure (Railway, PostgreSQL) |
| **Data security/privacy** | Multi-tenant isolation, JWT auth, GDPR-ready architecture |

---

## Investment Ask & Use of Funds

**Seeking:** ₪150,000 - ₪300,000 seed funding

### Use of Funds (12 months)

1. **Product Development (40%)** - ₪60,000-120,000
   - Complete test coverage (currently 8%)
   - WhatsApp integration
   - Analytics dashboard
   - Mobile apps (iOS/Android)

2. **Sales & Marketing (35%)** - ₪52,500-105,000
   - Digital marketing campaigns
   - Content creation (Hebrew)
   - Partnership development
   - Sales outreach tools

3. **Operations (15%)** - ₪22,500-45,000
   - Infrastructure scaling
   - Customer support tools
   - Legal (terms, privacy policy)

4. **Team (10%)** - ₪15,000-30,000
   - Part-time developer
   - Marketing/sales contractor

### 12-Month Milestones

- **Month 3:** 10 paying customers, ₪1,000 MRR
- **Month 6:** 50 paying customers, ₪10,000 MRR
- **Month 9:** 100 paying customers, ₪25,000 MRR
- **Month 12:** 200 paying customers, ₪50,000 MRR

**Break-even:** ~40 STARTER customers (₪4,000/mo revenue covers infrastructure + basic operations)

---

## Team & Expertise

**Founder/Developer:** Technical expertise in:
- Full-stack development (Next.js, React, TypeScript)
- Production SaaS deployment
- Hebrew RTL interfaces
- Multi-tenant architecture
- Automated testing & QA

**Needed Roles:**
- Sales/Marketing lead (part-time → full-time)
- Customer success manager (future)
- Additional developer (as scale grows)

---

## Traction & Validation

### Current Status
✅ Production-ready MVP deployed
✅ Multi-tenant architecture complete
✅ Mobile-first Hebrew interface
✅ Atomic capacity enforcement tested
✅ Advanced table management (40 tables in 2 minutes)
✅ Automated CI/CD pipeline
✅ Comprehensive test infrastructure

### Next Steps
- Launch beta program with 5-10 soccer clubs
- Gather user feedback on UX/features
- Iterate on pricing based on willingness to pay
- Build case studies from early adopters
- Prepare marketing materials (Hebrew landing page, demo videos)

---

## Why Now?

1. **Post-COVID digital shift** - ALL organizations (schools, businesses, clubs) moved online and expect digital solutions
2. **Mobile-first world** - 80%+ of web traffic is mobile, people expect to register on phones, not desktops
3. **WhatsApp fatigue** - Israeli organizations drowning in manual WhatsApp message management
4. **Event economy boom** - Meetups, workshops, classes, networking events at all-time high post-pandemic
5. **No-code movement** - People expect simple, beautiful tools (not enterprise software complexity)
6. **Proven tech stack** - Modern tools (Next.js, React) enable rapid development at low cost = fast iteration
7. **Table management trend** - Restaurants/venues need digital reservation systems (we already built advanced table features!)
8. **API economy** - Businesses want to integrate event registration into their own systems (PRO feature)

---

## Summary

**kartis.info is a universal event management platform** that solves capacity-limited event registration for ANY organization - schools, businesses, clubs, venues, event planners.

**Beachhead strategy:** Start with schools/sports clubs (easier to reach, clear pain point), then expand to ALL event types.

**Massive market opportunity:** 25,000+ Israeli organizations manage limited-capacity events. Global expansion potential (Arabic, English versions).

**Strong unit economics:** 85-90% gross margin, low CAC through product-led growth and referrals, sticky product (high switching cost once data is in system).

**Defensible moat:**
- Israeli market fit (Hebrew RTL, phone format, WhatsApp integration)
- Technical excellence (atomic capacity enforcement, mobile-first)
- Focused solution (does ONE thing perfectly vs. generic platforms)

**Clear path to profitability:** Break-even at 40 customers (~6 months), scale to ₪50,000 MRR in 12 months with just beachhead market. Potential for ₪2M+ ARR by Year 3 with full market expansion.

**Versatile platform, focused go-to-market:** The platform works for everything from school trips to corporate events to restaurant reservations. We'll prove it with schools first, then scale to every event type.

**Experienced founder:** Technical expertise to build and scale, seeking funding to accelerate customer acquisition and market expansion.

---

**Contact:** [Your contact information]
**Demo:** https://[your-railway-url].railway.app
**Deck:** [Link to pitch deck if available]
