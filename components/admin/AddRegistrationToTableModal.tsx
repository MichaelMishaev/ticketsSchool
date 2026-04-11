'use client'

import { useMemo, useState } from 'react'
import { X, UserPlus, ArrowRightLeft } from 'lucide-react'
import {
  canAddRegistrationToTable,
  tableRemainingSpots,
  type TableRegistration,
} from './table-helpers'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  registrations: TableRegistration[]
}

interface WaitlistEntry {
  id: string
  confirmationCode: string
  guestsCount: number | null
  phoneNumber: string | null
  waitlistPriority: number | null
  data: any
  createdAt: string | Date
}

interface AddRegistrationToTableModalProps {
  show: boolean
  table: Table | null
  waitlist: WaitlistEntry[]
  allTables: Table[]
  onClose: () => void
  onConfirm: (targetTable: Table, source: { id: string; isWaitlist: boolean }) => Promise<boolean>
}

type SourceKind = 'waitlist' | 'confirmed'

/**
 * Extract a human-readable name from the registration's custom `data` blob.
 * Matches the same fallback chain used by TableCard / CheckInTab / RegistrationsTab
 * so the admin UI displays the same label everywhere.
 */
function extractName(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const candidates = [d.name, d.studentName, d.childName, d.parentName, d.fullName]
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim() !== '') return c.trim()
  }
  return null
}

/**
 * Sharing-aware modal: lets the admin drop a WAITLIST reg or a CONFIRMED reg
 * from another table into the currently-selected target table.
 *
 * The modal is dumb about policy — it ONLY shows candidates that pass
 * `canAddRegistrationToTable`, i.e. fit in the remaining seats and satisfy
 * the empty-table minOrder gate. The server re-validates on submit (belt
 * and suspenders against stale polling data).
 */
export default function AddRegistrationToTableModal({
  show,
  table,
  waitlist,
  allTables,
  onClose,
  onConfirm,
}: AddRegistrationToTableModalProps) {
  const [activeKind, setActiveKind] = useState<SourceKind>('waitlist')
  const [busyId, setBusyId] = useState<string | null>(null)

  // Bail early without running any hooks that depend on `table`.
  // (useMemo is still fine to declare — just guards against a null table.)
  const remaining = table ? tableRemainingSpots(table) : 0

  // Waitlist candidates that FIT this table's remaining capacity + minOrder rule.
  const waitlistCandidates = useMemo(() => {
    if (!table) return []
    return waitlist
      .filter((w) => {
        const guests = w.guestsCount ?? 0
        return canAddRegistrationToTable(table, guests).ok
      })
      .sort((a, b) => (a.waitlistPriority ?? 9999) - (b.waitlistPriority ?? 9999))
  }, [table, waitlist])

  // CONFIRMED regs currently on OTHER tables that would fit here.
  // Each reg carries its source table number so the admin sees the move clearly.
  const confirmedCandidates = useMemo(() => {
    if (!table) return []
    const out: Array<{
      reg: TableRegistration
      fromTableNumber: string
    }> = []
    for (const other of allTables) {
      if (other.id === table.id) continue
      for (const r of other.registrations) {
        const guests = r.guestsCount ?? 0
        if (canAddRegistrationToTable(table, guests).ok) {
          out.push({ reg: r, fromTableNumber: other.tableNumber })
        }
      }
    }
    return out
  }, [table, allTables])

  if (!show || !table) return null

  const handlePick = async (sourceId: string, isWaitlist: boolean) => {
    setBusyId(sourceId)
    const ok = await onConfirm(table, { id: sourceId, isWaitlist })
    setBusyId(null)
    if (ok) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      dir="rtl"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">הוספה לשולחן {table.tableNumber}</h2>
            <p className="text-sm text-gray-600 mt-1">
              נותרו {remaining} {remaining === 1 ? 'מקום פנוי' : 'מקומות פנויים'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="סגור">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200" role="tablist">
          <button
            role="tab"
            aria-selected={activeKind === 'waitlist'}
            onClick={() => setActiveKind('waitlist')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeKind === 'waitlist'
                ? 'text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>רשימת המתנה ({waitlistCandidates.length})</span>
          </button>
          <button
            role="tab"
            aria-selected={activeKind === 'confirmed'}
            onClick={() => setActiveKind('confirmed')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
              activeKind === 'confirmed'
                ? 'text-blue-700 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4" />
            <span>העבר משולחן אחר ({confirmedCandidates.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {activeKind === 'waitlist' && (
            <>
              {waitlistCandidates.length === 0 ? (
                <EmptyState message="אין הזמנות מתאימות ברשימת ההמתנה" />
              ) : (
                waitlistCandidates.map((w) => (
                  <CandidateRow
                    key={w.id}
                    name={extractName(w.data)}
                    code={w.confirmationCode}
                    guests={w.guestsCount ?? 0}
                    phone={w.phoneNumber}
                    meta={w.waitlistPriority != null ? `#${w.waitlistPriority}` : null}
                    busy={busyId === w.id}
                    onPick={() => handlePick(w.id, true)}
                  />
                ))
              )}
            </>
          )}

          {activeKind === 'confirmed' && (
            <>
              {confirmedCandidates.length === 0 ? (
                <EmptyState message="אין הזמנות מאושרות שניתן להעביר לשולחן זה" />
              ) : (
                confirmedCandidates.map(({ reg, fromTableNumber }) => (
                  <CandidateRow
                    key={reg.id}
                    name={extractName(reg.data)}
                    code={reg.confirmationCode}
                    guests={reg.guestsCount ?? 0}
                    phone={reg.phoneNumber}
                    meta={`משולחן ${fromTableNumber}`}
                    busy={busyId === reg.id}
                    onPick={() => handlePick(reg.id, false)}
                  />
                ))
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function CandidateRow({
  name,
  code,
  guests,
  phone,
  meta,
  busy,
  onPick,
}: {
  name: string | null
  code: string
  guests: number
  phone: string | null
  meta: string | null
  busy: boolean
  onPick: () => void
}) {
  return (
    <button
      onClick={onPick}
      disabled={busy}
      className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg transition-colors text-right disabled:opacity-50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {meta && (
            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full shrink-0">
              {meta}
            </span>
          )}
          <span className="font-semibold text-gray-900 truncate">{name ?? 'ללא שם'}</span>
        </div>
        <div className="text-xs text-gray-500 font-mono mt-0.5">{code}</div>
        {phone && <div className="text-xs text-gray-600 mt-0.5">{phone}</div>}
      </div>
      <div className="text-sm text-gray-700 shrink-0 ms-3">
        {guests} {guests === 1 ? 'אורח' : 'אורחים'}
      </div>
    </button>
  )
}

function EmptyState({ message }: { message: string }) {
  return <div className="text-center py-8 text-gray-500 text-sm">{message}</div>
}
