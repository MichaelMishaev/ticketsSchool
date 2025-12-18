# Locked Behaviors Registry

This document serves as the canonical list of all behaviors that are locked by behavior lock tests. If you need to change any of these behaviors, you MUST update the corresponding test and document the change.

## 1. API Sort Order Behaviors

### 1.1 Event List Default Sort Order
- **Behavior:** GET /api/events returns events sorted by `createdAt DESC` (newest first)
- **Why Locked:** Users expect to see their newest events first in the admin dashboard
- **Test:** `event list maintains createdAt DESC sort order`
- **File:** tests/critical/behavior-locks.spec.ts:46
- **Owner:** backend-team
- **Since:** 2025-12-18

### 1.2 Registration List Default Sort Order
- **Behavior:** GET /api/events/{id}/registrations returns registrations sorted by `createdAt ASC` (oldest first)
- **Why Locked:** First-come-first-served principle - first registrants appear first
- **Test:** `registrations list maintains createdAt ASC sort order`
- **File:** tests/critical/behavior-locks.spec.ts:106
- **Owner:** backend-team
- **Since:** 2025-12-18

## 2. Multi-Tenant Data Isolation Behaviors (CRITICAL SECURITY)

### 2.1 Automatic SchoolId Filtering for Non-SuperAdmins
- **Behavior:** All non-SuperAdmin queries automatically filter by session's schoolId
- **Why Locked:** CRITICAL SECURITY - prevents cross-school data leakage
- **Test:** `non-SuperAdmin event queries automatically include schoolId filter`
- **File:** tests/critical/behavior-locks.spec.ts:183
- **Owner:** security-team
- **Since:** 2025-12-18
- **Risk Level:** CRITICAL

### 2.2 SuperAdmin Cross-School Access
- **Behavior:** SuperAdmin can query across all schools without automatic filtering
- **Why Locked:** Platform owners need to see all schools for administration
- **Test:** `SuperAdmin queries can see all schools when no filter specified`
- **File:** tests/critical/behavior-locks.spec.ts:231
- **Owner:** backend-team
- **Since:** 2025-12-18

### 2.3 Cross-School Access Rejection
- **Behavior:** Attempts to access another school's resources return HTTP 403 Forbidden
- **Why Locked:** Clear error for unauthorized access (not 404, not 200)
- **Test:** `cross-school access attempts return 403 Forbidden`
- **File:** tests/critical/behavior-locks.spec.ts:280
- **Owner:** security-team
- **Since:** 2025-12-18
- **Risk Level:** CRITICAL

### 2.4 Admin Without School Assignment
- **Behavior:** Admin without schoolId assignment gets 403 with descriptive error message
- **Why Locked:** Prevents accidental data exposure if admin misconfigured
- **Test:** `admin without schoolId gets 403 with descriptive error`
- **File:** tests/critical/behavior-locks.spec.ts:327
- **Owner:** security-team
- **Since:** 2025-12-18
- **Risk Level:** HIGH

## 3. Soft Delete and Status Behaviors

### 3.1 Cancelled Registration Capacity Handling
- **Behavior:** Registrations with status=CANCELLED are excluded from spotsReserved count
- **Why Locked:** Cancelled spots should become available again
- **Test:** `CANCELLED registrations excluded from spotsReserved count`
- **File:** tests/critical/behavior-locks.spec.ts:370
- **Owner:** backend-team
- **Since:** 2025-12-18

## 4. API Response Shape Behaviors

### 4.1 Event List Response Structure
- **Behavior:** GET /api/events returns array with specific fields: id, title, slug, capacity, spotsReserved, schoolId, createdAt, startAt
- **Why Locked:** Frontend code depends on exact field names and types
- **Test:** `GET /api/events returns expected response shape`
- **File:** tests/critical/behavior-locks.spec.ts:435
- **Owner:** backend-team
- **Since:** 2025-12-18

### 4.2 Event Creation Response Structure
- **Behavior:** POST /api/events returns complete created event object including school relation
- **Why Locked:** Client needs full object for immediate UI update without additional fetch
- **Test:** `POST /api/events returns complete created event object`
- **File:** tests/critical/behavior-locks.spec.ts:498
- **Owner:** backend-team
- **Since:** 2025-12-18

### 4.3 Error Response Format
- **Behavior:** All error responses include {error: string} shape
- **Why Locked:** Client error handling depends on consistent error format
- **Test:** `error responses maintain consistent {error: string} shape`
- **File:** tests/critical/behavior-locks.spec.ts:561
- **Owner:** backend-team
- **Since:** 2025-12-18

## 5. Role-Based Permission Boundaries

### 5.1 ADMIN Role Permissions
- **Behavior:** Users with ADMIN role can create and edit events within their school
- **Why Locked:** Standard admin permissions required for normal workflow
- **Test:** `ADMIN role can create events in their school`
- **File:** tests/critical/behavior-locks.spec.ts:586
- **Owner:** backend-team
- **Since:** 2025-12-18

### 5.2 MANAGER Role Permissions
- **Behavior:** Users with MANAGER role can view events but cannot create (returns 403)
- **Why Locked:** Read-only access is core to MANAGER role definition
- **Test:** `MANAGER role can view but cannot create events`
- **File:** tests/critical/behavior-locks.spec.ts:637
- **Owner:** security-team
- **Since:** 2025-12-18

### 5.3 VIEWER Role Permissions
- **Behavior:** Users with VIEWER role have read-only access, cannot create/edit (returns 403)
- **Why Locked:** Minimal permissions are core to VIEWER role definition
- **Test:** `VIEWER role has read-only access`
- **File:** tests/critical/behavior-locks.spec.ts:698
- **Owner:** security-team
- **Since:** 2025-12-18

### 5.4 SUPER_ADMIN Role Permissions
- **Behavior:** SUPER_ADMIN retains full access to all schools and resources
- **Why Locked:** Platform administration requires unrestricted access
- **Test:** `SUPER_ADMIN retains full access to all resources`
- **File:** tests/critical/behavior-locks.spec.ts:755
- **Owner:** backend-team
- **Since:** 2025-12-18

## 6. Side Effect Behaviors (Atomic Operations)

### 6.1 Registration Creation Side Effects
- **Behavior:** Creating a confirmed registration atomically increments event.spotsReserved
- **Why Locked:** Atomic capacity tracking prevents overbooking
- **Test:** `creating registration increments spotsReserved counter`
- **File:** tests/critical/behavior-locks.spec.ts:803
- **Owner:** backend-team
- **Since:** 2025-12-18
- **Risk Level:** HIGH (race condition prevention)

### 6.2 Registration Cancellation Side Effects
- **Behavior:** Cancelling a registration atomically decrements event.spotsReserved
- **Why Locked:** Cancelled capacity should become available immediately
- **Test:** `cancelling registration decrements spotsReserved counter`
- **File:** tests/critical/behavior-locks.spec.ts:860
- **Owner:** backend-team
- **Since:** 2025-12-18
- **Risk Level:** HIGH (race condition prevention)

---

## How to Propose a Behavior Change

If you need to change any of these locked behaviors:

1. **Review the risk level** - CRITICAL and HIGH behaviors require extra scrutiny
2. **Create a proposal document** explaining:
   - Current behavior and why it's problematic
   - Proposed new behavior
   - Impact assessment (what breaks?)
   - Migration plan
3. **Get approval** from the behavior's owner team
4. **Update the behavior lock test** to expect the new behavior
5. **Update this document** with @changed annotation
6. **Document in commit message** with "BREAKING BEHAVIOR CHANGE" tag

## Statistics

- Total locked behaviors: 16
- CRITICAL security behaviors: 2
- HIGH risk behaviors: 4
- Standard behaviors: 10
- Owners:
  - backend-team: 10 behaviors
  - security-team: 6 behaviors

Last updated: 2025-12-18
