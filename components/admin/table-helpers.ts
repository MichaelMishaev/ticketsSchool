/**
 * Shared types + helpers for the admin table board.
 *
 * The data model is sharing-aware: a single Table can host multiple
 * CONFIRMED Registrations (after the 2026-04-11 FK flip from 1:1 to many-to-one).
 * These helpers abstract over table.registrations[] so every consumer
 * computes occupancy the same way.
 */

export interface TableRegistration {
  id: string
  confirmationCode: string
  guestsCount: number | null
  phoneNumber: string | null
  data: unknown
  createdAt: string | Date
}

export interface TableWithRegistrations {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  registrations: TableRegistration[]
  hasWaitlistMatch?: boolean
}

/** True when the table has no CONFIRMED registrations at all. */
export const isTableEmpty = (t: { registrations: TableRegistration[] }): boolean =>
  t.registrations.length === 0

/**
 * Total seats occupied on a table across all CONFIRMED registrations.
 * Missing guestsCount is treated as 0 (nullable in schema for historical reasons).
 */
export const tableOccupiedSpots = (t: { registrations: TableRegistration[] }): number =>
  t.registrations.reduce((sum, r) => sum + (r.guestsCount ?? 0), 0)

/** Seats still bookable on this table. Never negative. */
export const tableRemainingSpots = (t: {
  capacity: number
  registrations: TableRegistration[]
}): number => Math.max(0, t.capacity - tableOccupiedSpots(t))

/**
 * minOrder is enforced only when the table is empty — it's an "open the table"
 * gate, not a per-registration rule. Once at least one CONFIRMED reg is on
 * the table, subsequent adds are only bounded by remaining capacity.
 */
export const canAddRegistrationToTable = (
  t: { capacity: number; minOrder: number; status: string; registrations: TableRegistration[] },
  incomingGuestCount: number
): { ok: boolean; reason?: string } => {
  if (t.status === 'INACTIVE') return { ok: false, reason: 'שולחן מוחזק' }
  if (incomingGuestCount < 1) return { ok: false, reason: 'צריך לפחות אורח אחד' }

  const remaining = tableRemainingSpots(t)
  if (incomingGuestCount > remaining) {
    return { ok: false, reason: `אין מספיק מקומות (נותרו ${remaining})` }
  }

  if (isTableEmpty(t) && incomingGuestCount < t.minOrder) {
    return { ok: false, reason: `מתחת למינימום השולחן (${t.minOrder})` }
  }

  return { ok: true }
}
