# School Management Test Scenarios

## 1. School Onboarding

### 1.1 Happy Path - Complete Onboarding
- **Given**: New user just signed up (schoolId is NULL)
- **When**: User fills onboarding form (schoolName, schoolSlug, address, phone)
- **Then**:
  - School record created in database
  - admin.schoolId updated with new school ID
  - Session cookie updated with schoolId
  - User redirected to dashboard
  - Can immediately access school-scoped features

### 1.2 Onboarding Form Validation
- **Given**: User on onboarding page
- **When**: User submits with missing required fields
- **Then**:
  - Missing fields highlighted in red
  - Hebrew error message shown
  - Form not submitted

### 1.3 School Slug Uniqueness Check
- **Given**: User entering school slug during onboarding
- **When**: User enters slug that already exists
- **Then**:
  - Real-time validation error shown
  - Cannot proceed until unique slug entered

### 1.4 Skip Onboarding (Edge Case)
- **Given**: User tries to skip onboarding and access dashboard
- **When**: User manually navigates to /admin/dashboard
- **Then**:
  - Middleware/page checks for schoolId
  - Redirects back to onboarding if NULL
  - Cannot access features without school

### 1.5 Onboarding Mobile Experience
- **Given**: User on mobile device
- **When**: User completes onboarding
- **Then**:
  - Form fields properly sized
  - Hebrew RTL layout correct
  - Input text visible (not white on white)
  - Submit button accessible

---

## 2. School Settings Management

### 2.1 View School Profile
- **Given**: User is logged in admin (OWNER or higher)
- **When**: User navigates to school settings
- **Then**:
  - School name, slug, address, phone displayed
  - Only editable by OWNER or SUPER_ADMIN
  - Contact email shown

### 2.2 Update School Information (OWNER)
- **Given**: User is OWNER of school
- **When**: User updates school name, address, phone
- **Then**:
  - Changes saved to database
  - Success message shown
  - Updated info reflected immediately

### 2.3 Update School Slug (OWNER)
- **Given**: User is OWNER trying to change slug
- **When**: User enters new slug
- **Then**:
  - System validates uniqueness
  - Warning shown about breaking existing public URLs
  - Requires confirmation before saving
  - All event URLs updated (/p/[newSlug]/[eventSlug])

### 2.4 Unauthorized Update Attempt (ADMIN/MANAGER)
- **Given**: User is ADMIN or MANAGER (not OWNER)
- **When**: User tries to edit school settings
- **Then**:
  - 403 Forbidden error
  - Form fields disabled/read-only
  - Error message shown

### 2.5 School Logo Upload
- **Given**: User is OWNER
- **When**: User uploads school logo image
- **Then**:
  - Image validated (size, format)
  - Stored securely
  - Logo appears in header, public pages
  - (Future: S3/storage integration)

---

## 3. Team Management - Invitations

### 3.1 Send Team Invitation (OWNER)
- **Given**: User is OWNER
- **When**: User invites team member (email, role, message)
- **Then**:
  - TeamInvitation record created
  - Invitation email sent to invitee
  - Expires after 7 days
  - Token generated for verification

### 3.2 Invitation Email Content
- **Given**: Invitation sent
- **When**: Invitee receives email
- **Then**:
  - Contains school name, role offered
  - Invitation link with secure token
  - Expiration date shown
  - Clear call-to-action button

### 3.3 Accept Team Invitation - New User
- **Given**: Invitee has NO account
- **When**: Invitee clicks invitation link
- **Then**:
  - Redirected to signup page
  - Email pre-filled from invitation
  - After signup, automatically linked to school
  - Role assigned as per invitation
  - Email already verified (since came from trusted invitation)

### 3.4 Accept Team Invitation - Existing User
- **Given**: Invitee already has account
- **When**: Invitee clicks invitation link while logged in
- **Then**:
  - Current admin.schoolId updated to invited school
  - Role assigned as per invitation
  - Session updated with new schoolId
  - Redirected to invited school's dashboard

### 3.5 Expired Invitation
- **Given**: Invitation older than 7 days
- **When**: User clicks invitation link
- **Then**:
  - Error message "Invitation expired"
  - Prompt to request new invitation
  - Old invitation marked as expired

### 3.6 Invalid Invitation Token
- **Given**: Malformed or tampered token
- **When**: User accesses invitation link
- **Then**:
  - Error message "Invalid invitation"
  - No data leaked

### 3.7 Duplicate Invitation
- **Given**: User already invited (pending invitation exists)
- **When**: OWNER sends another invitation to same email
- **Then**:
  - Old invitation invalidated
  - New invitation sent
  - Only latest invitation valid

### 3.8 Role Selection Validation
- **Given**: OWNER sending invitation
- **When**: OWNER selects role for invitee
- **Then**:
  - Role options: ADMIN, MANAGER, VIEWER (not OWNER or SUPER_ADMIN)
  - Cannot invite SUPER_ADMIN (platform reserved)
  - OWNER can only be transferred, not added

---

## 4. Team Management - Member List

### 4.1 View Team Members (OWNER)
- **Given**: User is OWNER
- **When**: User navigates to team page
- **Then**:
  - List of all admins in school shown
  - Displays: name, email, role, joined date
  - Shows pending invitations separately

### 4.2 View Pending Invitations
- **Given**: User is OWNER with sent invitations
- **When**: User views team page
- **Then**:
  - Pending invitations listed
  - Shows: email, role, sent date, expiration
  - Option to resend or cancel

### 4.3 Resend Invitation
- **Given**: Invitation sent but not accepted
- **When**: OWNER clicks "Resend invitation"
- **Then**:
  - New invitation email sent
  - Expiration extended
  - Same token or new token generated

### 4.4 Cancel Invitation
- **Given**: Pending invitation exists
- **When**: OWNER cancels invitation
- **Then**:
  - Invitation marked as cancelled
  - Token invalidated
  - Removed from pending list

---

## 5. Team Management - Edit Members

### 5.1 Change Team Member Role (OWNER)
- **Given**: User is OWNER, team member exists
- **When**: OWNER changes member role (e.g., VIEWER → ADMIN)
- **Then**:
  - Admin.role updated in database
  - Member's next request reflects new permissions
  - Activity log recorded (future)

### 5.2 Remove Team Member (OWNER)
- **Given**: User is OWNER
- **When**: OWNER removes team member from school
- **Then**:
  - admin.schoolId set to NULL
  - Member loses access to school immediately
  - Session invalidated on next request
  - Confirmation prompt shown before removal

### 5.3 Cannot Remove Self (OWNER)
- **Given**: User is OWNER viewing team
- **When**: OWNER tries to remove themselves
- **Then**:
  - Error message "Cannot remove yourself"
  - Must transfer ownership first

### 5.4 Transfer Ownership
- **Given**: User is OWNER wanting to transfer ownership
- **When**: OWNER selects another team member and confirms transfer
- **Then**:
  - New OWNER assigned
  - Previous OWNER downgraded to ADMIN
  - Requires password confirmation
  - Email notification sent to both parties

### 5.5 Unauthorized Team Management (ADMIN/MANAGER)
- **Given**: User is ADMIN, MANAGER, or VIEWER
- **When**: User tries to access team management
- **Then**:
  - 403 Forbidden error
  - Team management features hidden in UI

---

## 6. School Usage & Plan Management

### 6.1 View Usage Stats (OWNER)
- **Given**: User is OWNER
- **When**: User views billing/usage page
- **Then**:
  - Current plan shown (FREE, STARTER, PRO, ENTERPRISE)
  - Monthly usage displayed:
    - Events created
    - Registrations received
    - Emails sent
    - SMS sent (future)
    - API calls
    - Storage used
  - Percentage of quota used

### 6.2 Usage Limits Enforced - Events
- **Given**: School on FREE plan (limit: 5 events/month)
- **When**: User tries to create 6th event
- **Then**:
  - Error message "Monthly event limit reached"
  - Prompt to upgrade plan
  - Event not created

### 6.3 Usage Limits Enforced - Registrations
- **Given**: School on FREE plan (limit: 100 registrations/month)
- **When**: 101st registration attempted
- **Then**:
  - Error message shown to admin
  - Public registration page shows "Event registration paused"
  - Prompt to upgrade plan

### 6.4 Upgrade Plan (OWNER)
- **Given**: User is OWNER hitting usage limits
- **When**: User clicks "Upgrade plan"
- **Then**:
  - (Future) Redirected to Stripe checkout
  - (Future) Plan upgraded upon payment
  - Limits increased immediately

### 6.5 Monthly Usage Reset
- **Given**: School has used quotas during month
- **When**: New month begins
- **Then**:
  - All monthly usage counters reset to 0
  - Quotas available again
  - Historical data preserved

### 6.6 Feature Access by Plan
- **Given**: School on specific plan
- **When**: User tries to use features
- **Then**:
  - FREE: Basic events, no custom branding
  - STARTER: Custom fields, email notifications
  - PRO: SMS, advanced analytics, API access
  - ENTERPRISE: White-label, priority support

---

## 7. School Deletion & Data Management

### 7.1 Request School Deletion (OWNER)
- **Given**: User is OWNER wanting to close school
- **When**: OWNER initiates deletion
- **Then**:
  - Confirmation prompt with severe warning
  - Requires typing school name to confirm
  - Requires password re-entry

### 7.2 School Data Deletion
- **Given**: School deletion confirmed
- **When**: Deletion process runs
- **Then**:
  - All events deleted
  - All registrations deleted
  - All team members unlinked (schoolId → NULL)
  - School record soft-deleted or hard-deleted
  - Data export offered before deletion

### 7.3 Export School Data (OWNER)
- **Given**: User is OWNER
- **When**: User requests data export
- **Then**:
  - CSV files generated:
    - Events list
    - All registrations
    - Team members
    - Usage history
  - Download link sent to email
  - Compliant with GDPR/data privacy

---

## 8. Multi-School Management (SUPER_ADMIN)

### 8.1 View All Schools (SUPER_ADMIN)
- **Given**: User is SUPER_ADMIN
- **When**: User accesses schools admin panel
- **Then**:
  - List of all schools in system
  - Shows: name, slug, plan, created date, team size
  - Searchable and filterable

### 8.2 Impersonate School (SUPER_ADMIN)
- **Given**: User is SUPER_ADMIN
- **When**: SUPER_ADMIN selects "View as school"
- **Then**:
  - Session temporarily scoped to that school
  - Can access all features as OWNER of that school
  - Clear indicator shown (e.g., banner "Viewing as [School]")

### 8.3 Manually Adjust School Quota (SUPER_ADMIN)
- **Given**: User is SUPER_ADMIN
- **When**: SUPER_ADMIN modifies school plan/quota
- **Then**:
  - Plan upgraded/downgraded
  - Custom quotas set if needed
  - Change reflected immediately
  - Notification sent to school OWNER

### 8.4 Deactivate School (SUPER_ADMIN)
- **Given**: School violates terms or requests suspension
- **When**: SUPER_ADMIN deactivates school
- **Then**:
  - All admins lose access
  - Public event pages show "School suspended"
  - Data preserved but inaccessible
  - Can be reactivated later

---

## 9. School Branding & Customization

### 9.1 Custom Colors (PRO+)
- **Given**: School on PRO or ENTERPRISE plan
- **When**: User sets custom brand colors
- **Then**:
  - Primary/secondary colors saved
  - Public event pages use custom colors
  - Admin dashboard can optionally use branding

### 9.2 Custom Domain (ENTERPRISE)
- **Given**: School on ENTERPRISE plan
- **When**: User configures custom domain (e.g., events.school.com)
- **Then**:
  - DNS verification required
  - SSL certificate provisioned
  - Events accessible at custom domain
  - Original ticketcap.com URL still works

### 9.3 Email From Address (PRO+)
- **Given**: School on PRO+ plan
- **When**: User sets custom email from address
- **Then**:
  - Domain verification required (SPF/DKIM)
  - Confirmation emails sent from custom address
  - Improves deliverability and trust

---

## 10. Mobile School Management

### 10.1 Mobile Team Management
- **Given**: OWNER on mobile device
- **When**: Managing team members
- **Then**:
  - Team list scrollable and readable
  - Actions (edit, remove) accessible
  - Confirmation dialogs mobile-optimized

### 10.2 Mobile Usage Dashboard
- **Given**: OWNER on mobile device
- **When**: Viewing usage stats
- **Then**:
  - Charts/graphs responsive
  - Key metrics visible without scrolling
  - Touch-friendly controls

---

## Test Coverage Priority

**Critical (P0):**
- 1.1, 1.4, 3.1, 3.3-3.4, 4.1, 5.1-5.2, 6.2-6.3

**High (P1):**
- 1.2-1.3, 2.1-2.4, 3.5-3.7, 4.2-4.4, 5.3-5.4, 6.1, 6.4, 8.1-8.4

**Medium (P2):**
- 1.5, 2.5, 3.8, 5.5, 6.5-6.6, 7.1-7.3, 9.1-9.3

**Low (P3):**
- 10.1-10.2
