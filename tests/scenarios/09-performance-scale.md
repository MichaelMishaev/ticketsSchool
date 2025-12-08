# Performance & Scale Test Scenarios

## 1. Page Load Performance

### 1.1 Landing Page Load Time
- **Given**: User visits home page
- **When**: Page loads
- **Then**:
  - Initial render < 2 seconds (on 3G)
  - Time to Interactive (TTI) < 3 seconds
  - Core Web Vitals: Good ratings
  - Images optimized and lazy-loaded

### 1.2 Public Event Page Load Time
- **Given**: User visits /p/[schoolSlug]/[eventSlug]
- **When**: Page loads
- **Then**:
  - Event data fetched quickly (< 500ms)
  - Form renders immediately
  - No layout shift (CLS < 0.1)
  - Registration form interactive quickly

### 1.3 Admin Dashboard Load Time
- **Given**: Admin visits dashboard after login
- **When**: Page loads
- **Then**:
  - Initial data (stats, recent events) < 1 second
  - Skeleton screens for loading states
  - Progressive enhancement (some data loads first)
  - Usable before fully loaded

### 1.4 Slow Network Performance (3G)
- **Given**: User on slow 3G connection
- **When**: Loading pages
- **Then**:
  - Still functional (not broken)
  - Critical content prioritized
  - Non-critical resources deferred
  - Reasonable wait times (< 10 seconds)

### 1.5 Fast Network Performance (4G/WiFi)
- **Given**: User on fast connection
- **When**: Loading pages
- **Then**:
  - Near-instant page loads (< 1 second)
  - Takes advantage of fast connection
  - No artificial delays

---

## 2. Database Query Performance

### 2.1 Event List Query - Small School (< 50 events)
- **Given**: School has 30 events
- **When**: Admin requests event list
- **Then**:
  - Query executes < 100ms
  - All events returned
  - Includes basic stats (registrations count)
  - Efficient Prisma query

### 2.2 Event List Query - Large School (500+ events)
- **Given**: School has 600 events
- **When**: Admin requests event list
- **Then**:
  - Pagination applied (50 per page)
  - Query with LIMIT/OFFSET < 200ms
  - Total count available
  - No full table scan

### 2.3 Registration List Query - Small Event (< 50 registrations)
- **Given**: Event has 30 registrations
- **When**: Admin views registrations
- **Then**:
  - Query < 50ms
  - All registrations with details
  - Custom fields included
  - Single query (no N+1)

### 2.4 Registration List Query - Large Event (5000+ registrations)
- **Given**: Event has 7000 registrations
- **When**: Admin views registrations
- **Then**:
  - Pagination required (100 per page)
  - Query with indexes < 300ms
  - Search functionality performant
  - Export available but may take time

### 2.5 Dashboard Stats Query
- **Given**: Admin views dashboard
- **When**: Stats calculated (total events, registrations, etc.)
- **Then**:
  - Aggregation queries < 500ms
  - Uses database aggregation (COUNT, SUM)
  - Not fetching all records and counting in app
  - Potentially cached for short time (future)

### 2.6 Concurrent Registration Queries
- **Given**: 10 users viewing same event simultaneously
- **When**: Public event page loaded by all
- **Then**:
  - Database handles concurrent reads
  - No lock contention (read-only)
  - All queries < 200ms
  - Connection pool sufficient

### 2.7 N+1 Query Prevention
- **Given**: API returns list of events with registration counts
- **When**: Query executed
- **Then**:
  - Single query with JOIN or include
  - Not separate query per event
  - Prisma optimized query plan
  - Total queries logged and monitored

---

## 3. Registration Performance (High Load)

### 3.1 Single Registration Submission
- **Given**: User submits registration form
- **When**: API processes request
- **Then**:
  - Response time < 1 second
  - Transaction completes quickly
  - Email queued or sent async
  - User sees confirmation immediately

### 3.2 10 Concurrent Registrations (Same Event)
- **Given**: 10 users register simultaneously for event
- **When**: All submissions hit API
- **Then**:
  - All transactions complete successfully
  - No race conditions (atomic spotsReserved)
  - All responses < 2 seconds
  - Database locks handled correctly

### 3.3 100 Concurrent Registrations (Same Event)
- **Given**: Popular event, 100 users register at once (event opens)
- **When**: Load spike hits
- **Then**:
  - Database handles load (connection pool)
  - Transactions queued if needed
  - Most complete < 5 seconds
  - No failures or data corruption

### 3.4 1000 Registrations in 1 Minute (Various Events)
- **Given**: System-wide load spike
- **When**: Many registrations across events
- **Then**:
  - Server handles load (horizontal scaling in production)
  - Database not bottleneck
  - Response times degrade gracefully (not crash)
  - Auto-scaling kicks in (cloud deployment)

### 3.5 Registration with Email Sending
- **Given**: Registration submitted, email sent
- **When**: Processing
- **Then**:
  - Registration saved immediately
  - Email sent asynchronously (doesn't block response)
  - User sees confirmation before email sent
  - Background job handles email

---

## 4. Export Performance

### 4.1 Export 100 Registrations to CSV
- **Given**: Event with 100 registrations
- **When**: Admin clicks "Export to CSV"
- **Then**:
  - CSV generated < 2 seconds
  - Download starts immediately
  - No timeout errors
  - All data included

### 4.2 Export 5000 Registrations to CSV
- **Given**: Event with 5000 registrations
- **When**: Admin requests export
- **Then**:
  - Processing time < 15 seconds
  - Streaming response (no memory overflow)
  - Progress indicator shown
  - CSV correctly formatted

### 4.3 Export 50,000 Registrations (System-Wide)
- **Given**: SUPER_ADMIN exports all registrations
- **When**: Large export requested
- **Then**:
  - Background job created (not inline)
  - Admin notified when ready
  - Email with download link sent
  - File stored temporarily (S3/disk)

### 4.4 Export with Custom Fields
- **Given**: Registrations have 20 custom fields each
- **When**: CSV exported
- **Then**:
  - All custom fields as columns
  - JSON parsing efficient
  - Export time reasonable (< 2x base time)
  - No memory issues

---

## 5. Search Performance

### 5.1 Search Registrations - Small Dataset (< 100)
- **Given**: Event with 80 registrations
- **When**: Admin searches by name/email
- **Then**:
  - Results returned < 100ms
  - Full-text search on name, email
  - Case-insensitive
  - Partial match supported

### 5.2 Search Registrations - Large Dataset (10,000+)
- **Given**: Event with 15,000 registrations
- **When**: Admin searches
- **Then**:
  - Database indexes used
  - Results < 500ms
  - Pagination of results
  - Search term highlighted

### 5.3 Search Events - Text Search
- **Given**: School with 500 events
- **When**: Admin searches event titles/descriptions
- **Then**:
  - Full-text search on title and description
  - Results < 300ms
  - Relevant results first (ranking)
  - Handles Hebrew text search

### 5.4 Search with Filters
- **Given**: Admin applies filters (date range, status) + search term
- **When**: Query executed
- **Then**:
  - Combined WHERE clauses optimized
  - Indexes used appropriately
  - Results < 500ms
  - Accurate results

---

## 6. Memory Usage

### 6.1 Memory During Normal Operation
- **Given**: Application running with typical load
- **When**: Monitored over 24 hours
- **Then**:
  - Memory usage stable (no leaks)
  - Stays within reasonable bounds (< 512MB for small instance)
  - Garbage collection effective
  - No crashes from OOM

### 6.2 Memory During Large Export
- **Given**: Exporting 50,000 registrations
- **When**: Export processing
- **Then**:
  - Memory usage spikes temporarily
  - Streaming used (not loading all in memory)
  - Peak memory < 1GB
  - Returns to baseline after export

### 6.3 Memory During High Traffic
- **Given**: 1000 concurrent users
- **When**: Server handling requests
- **Then**:
  - Memory scales linearly (not exponential)
  - Connection pool limits prevent overflow
  - Auto-scaling adds instances if needed
  - No single instance overloaded

---

## 7. Database Indexing

### 7.1 Index on Event.schoolId
- **Given**: Database has 10,000 events from 500 schools
- **When**: Query events for specific school
- **Then**:
  - Index used (EXPLAIN shows index scan)
  - Query < 50ms
  - No full table scan

### 7.2 Index on Registration.eventId
- **Given**: Database has 100,000 registrations
- **When**: Query registrations for specific event
- **Then**:
  - Index used
  - Query < 100ms
  - Efficient retrieval

### 7.3 Index on Registration.email
- **Given**: Searching registrations by email
- **When**: Query executed
- **Then**:
  - Index used for email searches
  - Duplicate check fast
  - Case-insensitive search supported

### 7.4 Composite Index on Event (schoolId, createdAt)
- **Given**: Querying events by school, sorted by date
- **When**: Query with ORDER BY
- **Then**:
  - Composite index used
  - No separate sort operation needed
  - Query < 100ms

### 7.5 Index on Registration.confirmationCode
- **Given**: Looking up registration by confirmation code
- **When**: Query executed
- **Then**:
  - Unique index used
  - Lookup near-instant (< 10ms)
  - No collisions

---

## 8. API Response Times

### 8.1 API Response Time - 50th Percentile
- **Given**: Typical API requests
- **When**: Monitored over time
- **Then**:
  - P50 response time < 200ms
  - Most requests very fast
  - Good user experience

### 8.2 API Response Time - 95th Percentile
- **Given**: Including slower requests
- **When**: Measured
- **Then**:
  - P95 response time < 1 second
  - Even slower requests acceptable
  - No extremely slow outliers

### 8.3 API Response Time - 99th Percentile
- **Given**: Worst-case scenarios
- **When**: Measured
- **Then**:
  - P99 response time < 3 seconds
  - Acceptable even for slow queries
  - May include complex exports or reports

### 8.4 API Timeout Configuration
- **Given**: API request processing
- **When**: Request takes too long
- **Then**:
  - Timeout at 30 seconds (configurable)
  - Error returned to client
  - Resources cleaned up
  - No hanging requests

---

## 9. Caching Strategies (Future)

### 9.1 Public Event Page Caching
- **Given**: Popular event viewed many times
- **When**: Page requested
- **Then**:
  - (Future) Event data cached (Redis, CDN)
  - Cache invalidated on event update
  - Faster load for repeat visitors
  - Reduced database load

### 9.2 Dashboard Stats Caching
- **Given**: Admin dashboard stats calculated
- **When**: Multiple admins view dashboard
- **Then**:
  - (Future) Stats cached for 5 minutes
  - First request computes, others hit cache
  - Cache keyed by schoolId
  - Significant performance improvement

### 9.3 Static Asset Caching
- **Given**: CSS, JS, images served
- **When**: User loads page
- **Then**:
  - Browser caching headers set (1 year for immutable assets)
  - CDN caching (production)
  - Fast subsequent page loads
  - Cache busting with hashes

### 9.4 API Response Caching (Selective)
- **Given**: Read-only API endpoints
- **When**: Frequently accessed (e.g., event details)
- **Then**:
  - (Future) Short-lived cache (1-5 minutes)
  - Cache-Control headers set
  - Balance freshness and performance

---

## 10. Scalability

### 10.1 Horizontal Scaling - Multiple Instances
- **Given**: Traffic increases beyond single instance capacity
- **When**: Load balancer distributes requests
- **Then**:
  - Multiple Node.js instances run
  - Stateless design allows scaling
  - Session managed via database or Redis
  - No sticky sessions required

### 10.2 Database Connection Pool Scaling
- **Given**: More app instances connecting to database
- **When**: Connection pool configured
- **Then**:
  - Pool size per instance: 5-10 connections
  - Total connections managed (not exceed DB limit)
  - Connection pooler (PgBouncer) if needed
  - Efficient connection reuse

### 10.3 Read Replicas (Future)
- **Given**: High read traffic (public pages)
- **When**: Read operations
- **Then**:
  - Reads directed to replicas
  - Writes to primary only
  - Replication lag acceptable (< 1 second)
  - Scalable read capacity

### 10.4 CDN for Static Assets (Production)
- **Given**: Static files (JS, CSS, images)
- **When**: Served to users
- **Then**:
  - CDN edge locations used (CloudFlare, CloudFront)
  - Low latency worldwide
  - Reduced server load
  - Cost-effective

### 10.5 Auto-Scaling (Cloud Deployment)
- **Given**: Traffic spikes (e.g., popular event opens)
- **When**: Load increases
- **Then**:
  - Auto-scaling adds instances
  - Scales down when traffic decreases
  - Metrics-based scaling (CPU, memory, requests/sec)
  - Cost-efficient

---

## 11. Database Performance Optimization

### 11.1 Query Plan Analysis
- **Given**: Slow query identified
- **When**: EXPLAIN ANALYZE run
- **Then**:
  - Query plan reviewed
  - Missing indexes identified
  - Query rewritten if needed
  - Performance improved

### 11.2 Prisma Query Optimization
- **Given**: API endpoint fetching related data
- **When**: Query executed
- **Then**:
  - Use `include` or `select` to fetch related data in one query
  - Avoid separate queries for relations
  - Limit fields returned (`select`)
  - Minimize data transfer

### 11.3 Database Vacuum (PostgreSQL)
- **Given**: Database running for extended period
- **When**: Dead tuples accumulate
- **Then**:
  - Autovacuum configured and running
  - Manual vacuum if needed
  - Performance maintained
  - Disk space reclaimed

### 11.4 Database Statistics Update
- **Given**: Data distribution changes
- **When**: Query planner makes decisions
- **Then**:
  - Statistics up-to-date (ANALYZE)
  - Optimal query plans chosen
  - Performance consistent

---

## 12. Frontend Performance

### 12.1 JavaScript Bundle Size
- **Given**: Frontend JavaScript built
- **When**: Bundle analyzed
- **Then**:
  - Total bundle size < 500KB (gzipped)
  - Code splitting for routes
  - Tree shaking removes unused code
  - Lazy loading for non-critical features

### 12.2 CSS Bundle Size
- **Given**: TailwindCSS compiled
- **When**: Production build
- **Then**:
  - PurgeCSS removes unused styles
  - Minified and compressed
  - Size < 50KB (gzipped)
  - Critical CSS inlined

### 12.3 Image Optimization
- **Given**: Event images, logos displayed
- **When**: Images loaded
- **Then**:
  - Optimized formats (WebP, AVIF with fallback)
  - Responsive images (srcset)
  - Lazy loading for below-fold images
  - Compressed without quality loss

### 12.4 Lighthouse Score - Performance
- **Given**: Public event page
- **When**: Lighthouse audit run
- **Then**:
  - Performance score > 90 (mobile)
  - Performance score > 95 (desktop)
  - Core Web Vitals: Good
  - No critical issues

### 12.5 First Contentful Paint (FCP)
- **Given**: User loads page
- **When**: First content renders
- **Then**:
  - FCP < 1.8 seconds (good)
  - User sees content quickly
  - Not staring at blank page

### 12.6 Largest Contentful Paint (LCP)
- **Given**: User loads page
- **When**: Largest content element renders
- **Then**:
  - LCP < 2.5 seconds (good)
  - Main content visible quickly
  - Images optimized and prioritized

### 12.7 Cumulative Layout Shift (CLS)
- **Given**: Page loading
- **When**: Elements render and shift
- **Then**:
  - CLS < 0.1 (good)
  - Minimal unexpected layout shifts
  - Reserved space for dynamic content

### 12.8 Time to Interactive (TTI)
- **Given**: Page loaded
- **When**: User can interact
- **Then**:
  - TTI < 3.8 seconds (good)
  - Page fully interactive quickly
  - No long tasks blocking main thread

---

## 13. Load Testing

### 13.1 Baseline Load - 10 Concurrent Users
- **Given**: Load test with 10 concurrent users
- **When**: Users perform various actions
- **Then**:
  - All requests succeed
  - Average response time < 500ms
  - No errors
  - Server load minimal

### 13.2 Moderate Load - 100 Concurrent Users
- **Given**: Load test with 100 users
- **When**: Simulating typical traffic
- **Then**:
  - Success rate > 99%
  - Average response time < 1 second
  - Database handles load
  - No crashes

### 13.3 High Load - 500 Concurrent Users
- **Given**: Load test with 500 users
- **When**: Simulating traffic spike
- **Then**:
  - Success rate > 95%
  - Response times degrade gracefully (< 3 seconds)
  - Auto-scaling triggered (if configured)
  - System remains stable

### 13.4 Stress Test - Find Breaking Point
- **Given**: Gradually increasing load
- **When**: Users added until failure
- **Then**:
  - Breaking point identified (e.g., 1000 users)
  - Failure mode observed (timeouts, 503 errors)
  - Recovery after load reduced
  - Bottlenecks identified

### 13.5 Spike Test - Sudden Traffic Increase
- **Given**: Sudden 10x traffic increase
- **When**: Simulating event launch (e.g., concert tickets)
- **Then**:
  - System handles spike with grace period
  - Auto-scaling kicks in (if configured)
  - Queue system prevents overload (future)
  - Users eventually served

---

## 14. Real-World Performance Monitoring

### 14.1 Application Performance Monitoring (APM)
- **Given**: APM tool installed (e.g., New Relic, DataDog)
- **When**: Application running in production
- **Then**:
  - Response times tracked
  - Slow transactions identified
  - Error rates monitored
  - Alerts configured for anomalies

### 14.2 Database Query Monitoring
- **Given**: Database performance tracked
- **When**: Queries executed
- **Then**:
  - Slow queries logged (> 1 second)
  - Query frequency tracked
  - Optimization opportunities identified
  - Indexes recommended

### 14.3 Error Rate Monitoring
- **Given**: Errors tracked in production
- **When**: Errors occur
- **Then**:
  - Error rate < 0.1% (very low)
  - Errors logged with context
  - Alerts for spikes
  - Root causes investigated

### 14.4 Uptime Monitoring
- **Given**: Uptime service pinging health endpoint
- **When**: Service checked (e.g., every 5 minutes)
- **Then**:
  - Uptime > 99.9% (three nines)
  - Downtime detected immediately
  - Alerts sent to team
  - Incidents tracked

---

## 15. Optimization Strategies

### 15.1 Database Connection Pooling
- **Given**: Prisma configured
- **When**: Multiple requests
- **Then**:
  - Connection pool reuses connections
  - No connection overhead per request
  - Pool size tuned (5-10 per instance)
  - Efficient resource usage

### 15.2 Lazy Loading Components (Frontend)
- **Given**: Large React app
- **When**: User visits page
- **Then**:
  - Only necessary components loaded initially
  - Route-based code splitting
  - Dynamic imports for modals, heavy components
  - Faster initial load

### 15.3 Debouncing Search Input
- **Given**: User typing in search box
- **When**: Each keystroke
- **Then**:
  - API calls debounced (300ms delay)
  - Reduced server load
  - Better UX (not too many requests)
  - Final query accurate

### 15.4 Pagination Everywhere
- **Given**: Large datasets displayed
- **When**: User views list
- **Then**:
  - Pagination or infinite scroll used
  - Limited records per page (50-100)
  - Total count available
  - Fast queries with LIMIT/OFFSET

### 15.5 Efficient JSON Serialization
- **Given**: API returning large objects
- **When**: Response serialized
- **Then**:
  - Only necessary fields included
  - Prisma `select` used
  - Nested relations limited
  - Response size minimized

---

## Test Coverage Priority

**Critical (P0):**
- 1.1-1.3, 2.1-2.7, 3.1-3.3, 7.1-7.5, 8.1-8.4, 13.1-13.3

**High (P1):**
- 1.4-1.5, 3.4-3.5, 4.1-4.3, 5.1-5.4, 6.1-6.3, 10.1-10.2, 11.1-11.4, 12.1-12.8, 13.4-13.5

**Medium (P2):**
- 4.4, 9.1-9.4, 10.3-10.5, 14.1-14.4, 15.1-15.5

**Low (P3):**
- None (all performance scenarios important at scale)
