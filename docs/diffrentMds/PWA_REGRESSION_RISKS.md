# PWA Conversion - Regression Risks Analysis

## 🚨 Critical Risks (High Priority)

### 1. **Authentication & Session Management**

**Risk Level:** 🔴 **CRITICAL**

**Current Implementation:**
- HTTP-only cookies (`admin_session`) with JWT tokens
- 7-day session duration
- Middleware validates JWT on Edge Runtime
- Client-side uses `localStorage` as hint (`admin_logged_in`)

**Potential Regressions:**
- Service worker may cache authentication responses (`/api/admin/me`)
- Cached login state could persist after logout
- Service worker intercepts could bypass middleware checks
- Stale session tokens served from cache
- OAuth callback flows could break if cached incorrectly

**Mitigation Required:**
- Never cache `/api/admin/*` endpoints
- Never cache `/api/auth/*` endpoints
- Implement cache-busting for auth checks
- Ensure service worker doesn't intercept cookie-based auth

---

### 2. **Real-Time Data & Capacity Management**

**Risk Level:** 🔴 **CRITICAL**

**Current Implementation:**
- Event capacity checks happen in real-time
- Race condition fixes use database transactions (`SELECT FOR UPDATE`)
- Dashboard stats are live (not cached)
- Registration status depends on current capacity

**Potential Regressions:**
- Service worker caching could serve stale capacity data
- Users might see "spots available" when event is full
- Dashboard could show outdated registration counts
- Waitlist status could be incorrect
- **Could cause overselling** if capacity checks are cached

**Critical Endpoints That Must NOT Be Cached:**
```
/api/p/[schoolSlug]/[eventSlug]          # Event details (capacity)
/api/p/[schoolSlug]/[eventSlug]/register # Registration endpoint
/api/events                               # Event list (capacity)
/api/dashboard/stats                      # Live statistics
/api/dashboard/occupancy                  # Real-time occupancy
```

**Mitigation Required:**
- All capacity-related endpoints must bypass service worker
- Use `Cache-Control: no-store` headers
- Implement network-first strategy for critical data
- Add cache versioning for event data

---

### 3. **Multi-Tenant Data Isolation**

**Risk Level:** 🔴 **CRITICAL**

**Current Implementation:**
- School-level data isolation via `schoolId` filtering
- Super admins can see all schools
- Regular admins restricted to their school
- Middleware enforces access control

**Potential Regressions:**
- Service worker could cache data from wrong school
- Cross-school data leakage if cache keys aren't school-specific
- Admin switching schools could see stale data
- Super admin filtering could break

**Mitigation Required:**
- Include `schoolId` in cache keys
- Never cache admin-scoped data
- Clear cache on school context change
- Validate cache keys match current session

---

### 4. **Race Condition Protection**

**Risk Level:** 🔴 **CRITICAL**

**Current Implementation:**
- Database transactions with `Serializable` isolation
- Row-level locking (`SELECT FOR UPDATE`)
- Atomic counter system (`spotsReserved`)

**Potential Regressions:**
- Service worker could queue requests incorrectly
- Cached responses could bypass transaction checks
- Multiple registrations could use stale capacity data
- **Could reintroduce overselling vulnerability**

**Mitigation Required:**
- Registration endpoints must always hit network
- No caching for POST/PATCH/DELETE operations
- Ensure service worker doesn't batch critical requests

---

## ⚠️ High Risks (Medium Priority)

### 5. **Build & Deployment Configuration**

**Risk Level:** 🟡 **HIGH**

**Current Implementation:**
- Next.js `standalone` output for Docker
- Railway deployment
- Custom build scripts

**Potential Regressions:**
- PWA plugins might conflict with `standalone` output
- Service worker generation could break Docker builds
- Build size increase (service worker + manifest)
- Deployment pipeline might need updates

**Mitigation Required:**
- Test PWA build with Docker
- Verify Railway deployment works
- Monitor build size changes
- Update deployment scripts if needed

---

### 6. **Middleware & Edge Runtime**

**Risk Level:** 🟡 **HIGH**

**Current Implementation:**
- Edge Runtime middleware (`middleware.ts`)
- JWT verification using `jose` library
- Route protection logic

**Potential Regressions:**
- Service worker might intercept before middleware runs
- Edge Runtime compatibility with service workers
- Route matching could conflict
- Public vs protected route logic might break

**Mitigation Required:**
- Ensure middleware runs before service worker
- Test Edge Runtime compatibility
- Verify route matching still works
- Test protected route access

---

### 7. **Public Event Pages**

**Risk Level:** 🟡 **HIGH**

**Current Implementation:**
- Public routes: `/p/[schoolSlug]/[eventSlug]`
- No authentication required
- Real-time capacity display
- Registration forms

**Potential Regressions:**
- Aggressive caching could show stale event data
- Capacity indicators could be wrong
- Registration forms might submit stale data
- SEO could be affected if cached incorrectly

**Mitigation Required:**
- Use stale-while-revalidate for public pages
- Always fetch fresh capacity data
- Cache static assets, not dynamic content
- Ensure registration always hits network

---

## 📊 Medium Risks (Low Priority)

### 8. **Client-Side State Management**

**Risk Level:** 🟠 **MEDIUM**

**Current Implementation:**
- `localStorage` for login hint
- React state for dashboard data
- Client-side form validation

**Potential Regressions:**
- Service worker could conflict with localStorage
- State synchronization issues
- Form data could be lost on offline
- Client-side validation might not match server

**Mitigation Required:**
- Test localStorage compatibility
- Implement proper state sync
- Handle offline form submissions
- Validate on server regardless

---

### 9. **OAuth Flow**

**Risk Level:** 🟠 **MEDIUM**

**Current Implementation:**
- Google OAuth callback (`/api/auth/google/callback`)
- OAuth state management
- Account linking logic

**Potential Regressions:**
- OAuth callbacks could be cached
- State tokens might expire incorrectly
- Redirect flows could break
- Account linking might fail

**Mitigation Required:**
- Never cache OAuth endpoints
- Ensure redirects work correctly
- Test OAuth flow end-to-end
- Handle OAuth errors gracefully

---

### 10. **Email Verification & Password Reset**

**Risk Level:** 🟠 **MEDIUM**

**Current Implementation:**
- Email verification tokens (24-hour expiry)
- Password reset tokens (1-hour expiry)
- Token-based authentication

**Potential Regressions:**
- Tokens could be cached and reused
- Expiry checks might not work offline
- Verification links could break

**Mitigation Required:**
- Never cache token endpoints
- Always validate tokens on server
- Ensure links work correctly

---

## 🔍 Low Risks (Monitor)

### 11. **Static Assets & Images**

**Risk Level:** 🟢 **LOW**

**Current Implementation:**
- Images in `/public/images/`
- Next.js image optimization
- Font loading

**Potential Regressions:**
- Image caching might be too aggressive
- Font loading could be affected
- Asset versioning might break

**Mitigation Required:**
- Use appropriate cache headers
- Test image loading
- Verify font loading works

---

### 12. **Analytics & Tracking**

**Risk Level:** 🟢 **LOW**

**Current Implementation:**
- Google Analytics component
- Client-side tracking

**Potential Regressions:**
- Analytics might not fire offline
- Tracking could be delayed
- Service worker might interfere

**Mitigation Required:**
- Queue analytics events offline
- Sync when back online
- Test tracking accuracy

---

## 📋 Testing Checklist

### Pre-Conversion Testing

- [ ] Test all authentication flows (login, logout, OAuth)
- [ ] Verify session management works correctly
- [ ] Test multi-tenant data isolation
- [ ] Verify race condition protections still work
- [ ] Test capacity checks with concurrent requests
- [ ] Verify dashboard shows live data
- [ ] Test public event pages
- [ ] Verify registration flow works correctly
- [ ] Test OAuth callback flow
- [ ] Verify email verification works
- [ ] Test password reset flow
- [ ] Verify build process works
- [ ] Test Docker deployment
- [ ] Verify Railway deployment

### Post-Conversion Testing

- [ ] Test offline functionality (if implemented)
- [ ] Verify cache invalidation works
- [ ] Test service worker updates
- [ ] Verify no stale data is served
- [ ] Test all critical user flows
- [ ] Monitor error rates
- [ ] Check build size impact
- [ ] Verify performance metrics

---

## 🛡️ Recommended Mitigation Strategy

### Phase 1: Conservative Approach (Recommended)

1. **Implement PWA with minimal caching:**
   - Only cache static assets (CSS, JS, images)
   - Never cache API endpoints
   - Never cache authentication endpoints
   - Use network-first strategy for all dynamic content

2. **Add explicit cache headers:**
   ```typescript
   // In API routes
   headers: {
     'Cache-Control': 'no-store, no-cache, must-revalidate',
     'Pragma': 'no-cache',
     'Expires': '0'
   }
   ```

3. **Service worker configuration:**
   - Network-first for all `/api/*` routes
   - Cache-first only for static assets
   - Skip service worker for critical operations

### Phase 2: Progressive Enhancement

1. **Add offline support gradually:**
   - Start with static pages only
   - Add offline fallbacks for non-critical pages
   - Never cache critical operations

2. **Implement cache versioning:**
   - Version cache keys
   - Clear old caches on update
   - Handle cache migration

### Phase 3: Advanced Features (Optional)

1. **Background sync for non-critical operations**
2. **Push notifications** (if needed)
3. **Offline form queuing** (with clear warnings)

---

## 🎯 Critical Success Criteria

Before deploying PWA, ensure:

1. ✅ **No authentication regressions** - All auth flows work identically
2. ✅ **No data isolation issues** - Multi-tenant security maintained
3. ✅ **No capacity calculation errors** - Real-time data always accurate
4. ✅ **No race condition reintroduction** - Transaction safety maintained
5. ✅ **Build process works** - Docker and Railway deployments succeed
6. ✅ **Performance maintained** - No significant slowdowns
7. ✅ **Error rates stable** - No increase in errors

---

## 📝 Notes

- **This system has critical business logic** (capacity management, multi-tenancy)
- **Security is paramount** (authentication, data isolation)
- **Real-time accuracy is essential** (capacity, registrations, stats)
- **Conservative approach recommended** - Better to cache less than cache incorrectly

**Recommendation:** Start with Phase 1 (minimal caching) and gradually add features only after thorough testing.

