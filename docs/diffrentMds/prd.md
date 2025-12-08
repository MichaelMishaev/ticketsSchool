# TicketCap – Product App Document (PAD) – v1 Final

A lightweight, mobile‑first web app to manage limited‑quantity sign‑ups for games/events. Includes admin event creation + user self‑registration with automatic capacity lock and waitlist.

---

## 1) Problem & Goals

**Problem:** Teams, schools, and clubs often receive a small number of tickets for games. Manual sign‑ups via chat or paper lists cause overbooking, errors, and frustration.

**Goals:**

* Single shareable link per event for self‑serve registration.
* Enforce capacity automatically — no overbooking.
* Show live remaining spots and waitlist.
* Keep admin overhead minimal.
* Hebrew‑first, responsive UX optimized for mobile.

**Non‑Goals (v1):** Payments, seat maps, auto‑notifications, multi‑currency checkout.

---

## 2) Target Users

* **Admin/Organizer:** Creates events, sets capacity, manages list, exports CSV, edits or removes registrations.
* **Attendee:** Opens link, sees spots left, submits details quickly, sees immediate confirmation or waitlist message.

---

## 3) Value Proposition

“Create a limited‑ticket event in minutes, share one link, and stop registrations exactly at the cap — with a clear waitlist option.”

---

## 4) Core Features (MVP)

### Admin

* **Event Creation:** Title, game type, description, location, date/time, global capacity.
* **Form Builder:** Choose fields (name, phone, class, custom), mark required/optional, set max spots per person.
* **Dashboard:** View live count (confirmed + waitlist), search/filter, edit or remove registrations, export CSV.
* **Manual Waitlist Promotion:** Change status from waitlist → confirmed.
* **Conditions:** Free‑text conditions/terms with required checkbox.
* **Status Control:** Open / Pause / Close registration.
* **Auth:** Email magic link or Google OAuth for admin.

### Attendee

* **Event Page:** Hebrew‑only page showing title, time, venue (map link), remaining spots.
* **Registration Form:** Admin‑configured fields (default name, phone, class) + spots selector.
* **Validation:** Required fields enforced client + server side.
* **Confirmation Screen:** Displays success message + unique confirmation code to screenshot.
* **Waitlist Mode:** When full, form switches to waitlist; shows number of people already waiting and clear message that this is not a confirmation.

### System

* Capacity enforcement with atomic DB transaction.
* Rate limiting & duplicate prevention (phone/email).
* Hebrew RTL UI and timezone handling.

---

## 5) Excluded in v1

* Self‑service cancellation by attendees.
* Automatic waitlist promotion or notifications.
* Payments, QR check‑in, seat maps, multi‑org roles.

---

## 6) Success Metrics

* Admin can create and share event in under 2 minutes.
* 0% over‑capacity registrations.
* ≥ 60% conversion from visit → registration.
* CSV exports include class distribution for admin insights.

---

## 7) User Stories

**Admin:**

* As an admin, I can create an event, choose which fields to collect, and set max spots per person.
* As an admin, I can view remaining spots and waitlist count in real time.
* As an admin, I can edit or remove any registration.
* As an admin, I can manually move waitlisted users to confirmed.
* As an admin, I can export a CSV including all collected fields.

**Attendee:**

* As an attendee, I can register from my phone in under 20 seconds.
* As an attendee, I can clearly see if the event is full and how many are on the waitlist.
* As an attendee, I receive a clear on‑screen confirmation with a code I can screenshot.

---

## 8) Data Model (Simplified)

**Event**

* id, slug, title, description, gameType, location, startAt, endAt, capacity, status (OPEN/PAUSED/CLOSED), maxSpotsPerPerson, fieldsSchema (JSON), createdBy, createdAt.

**Registration**

* id, eventId, data (JSON: name, phone, class, custom fields), spotsCount, status (CONFIRMED/WAITLIST/CANCELLED), createdAt.

**User (Admin)**

* id, email, name, authProvider, createdAt.

---

## 9) Capacity & Waitlist Logic

* Transactional insert with `SELECT FOR UPDATE` or atomic counter.
* If capacity full → insert as WAITLIST.
* Admin manually promotes waitlist entries; system does not auto‑promote.
* Public page displays current waitlist size.

---

## 10) API Sketch (REST)

* `POST /events` (admin) create
* `PATCH /events/:id` update status/fields/capacity
* `GET /events/:id/registrations?export=csv`
* `GET /p/:slug` public event meta
* `POST /p/:slug/register` submit (returns confirmed or waitlist status + confirmation code)

---

## 11) UX Notes

* Hebrew‑only RTL layout.
* Large tap targets, single‑screen form.
* Clear state changes: Open → Few left → Full → Waitlist.
* Confirmation screen with big code, easy to screenshot.

---

## 12) Security & Privacy

* Unique slug per event (unguessable).
* Normalized phone numbers (E.164).
* Server‑side validation + rate limit per IP/phone.
* PII only accessible to admin; no exposure in public endpoint.

---

## 13) Roadmap

* **v1.0:** Create event, configurable fields, global cap, waitlist with visible count, admin dashboard, CSV export, Hebrew UI.
* **v1.1:** Optional notifications, bulk waitlist promotion, simple QR check‑in.
* **v1.2:** Roles/teams, analytics dashboard, multi‑org support.

---

## 14) Deliverables

* Deployed app (admin + public) on Vercel.
* GitHub repo with README, schema, and seed data.
* Playwright tests for create/register/cap/waitlist flows.

---

## 15) Open Questions

* Should admin be able to re‑order custom fields or just append new ones?
* Do we need an announcement banner feature for last‑minute changes?
