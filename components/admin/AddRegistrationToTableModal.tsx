'use client'

import { useMemo, useState, useEffect, useRef } from 'react'
import { X, UserPlus, ArrowRightLeft, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react'
import {
  canAddRegistrationToTable,
  tableRemainingSpots,
  isTableEmpty,
  type TableRegistration,
} from './table-helpers'

// ─── Types ────────────────────────────────────────────────────────────────────

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
  data: unknown
  createdAt: string | Date
}

export interface AddRegistrationToTableModalProps {
  show: boolean
  table: Table | null
  waitlist: WaitlistEntry[]
  allTables: Table[]
  onClose: () => void
  onConfirm: (
    targetTable: Table,
    source: { id: string; isWaitlist: boolean; force?: boolean }
  ) => Promise<boolean>
  onManualAdd: (
    targetTable: Table,
    data: { name: string; phone: string; guestsCount: number }
  ) => Promise<boolean>
}

type ActiveTab = 'waitlist' | 'cross'
type ViewState = 'list' | 'manualForm'

// ─── Inline sub-components ────────────────────────────────────────────────────

interface CandidateRowProps {
  label: string
  sublabel?: string
  guestsCount: number
  onSelect: () => void
  disabled?: boolean
}

function CandidateRow({ label, sublabel, guestsCount, onSelect, disabled }: CandidateRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={[
        'w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg border text-right transition-colors',
        disabled
          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
          : 'border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 cursor-pointer',
      ].join(' ')}
    >
      <div className="flex flex-col min-w-0">
        <span className="font-medium text-gray-900 truncate">{label}</span>
        {sublabel && <span className="text-xs text-gray-500 truncate">{sublabel}</span>}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm text-gray-600 whitespace-nowrap">{guestsCount} אורחים</span>
        <ChevronRight className="w-4 h-4 text-gray-400 rotate-180" />
      </div>
    </button>
  )
}

interface EmptyStateProps {
  message: string
}

function EmptyState({ message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center text-gray-500">
      <p className="text-sm">{message}</p>
    </div>
  )
}

interface EmptyStateWithManualAddProps {
  onManualAdd: () => void
}

function EmptyStateWithManualAdd({ onManualAdd }: EmptyStateWithManualAddProps) {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
      <p className="text-sm text-gray-500">אין אנשים ברשימת המתנה שניתן להושיב בשולחן זה</p>
      <button
        type="button"
        onClick={onManualAdd}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors min-h-[40px]"
      >
        <UserPlus className="w-4 h-4" />
        הוסף אורח ידנית
      </button>
    </div>
  )
}

// ─── Manual Add Form ──────────────────────────────────────────────────────────

interface ManualAddFormProps {
  table: Table
  onSubmit: (data: { name: string; phone: string; guestsCount: number }) => Promise<boolean>
  onBack: () => void
}

function ManualAddForm({ table, onSubmit, onBack }: ManualAddFormProps) {
  const remaining = tableRemainingSpots(table)
  const defaultGuests = Math.max(1, Math.min(table.minOrder || 1, remaining))

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [guestsCount, setGuestsCount] = useState(defaultGuests)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Reset defaults when table changes
  useEffect(() => {
    const r = tableRemainingSpots(table)
    const d = Math.max(1, Math.min(table.minOrder || 1, r))
    setGuestsCount(d)
    setName('')
    setPhone('')
    setError(null)
    setValidationErrors({})
  }, [table])

  function validate(): boolean {
    const errs: Record<string, string> = {}
    if (!name.trim()) errs.name = 'שם מלא הוא שדה חובה'
    if (!phone.trim()) errs.phone = 'מספר טלפון הוא שדה חובה'
    if (guestsCount < 1) errs.guestsCount = 'יש להזין לפחות אורח אחד'
    if (guestsCount > remaining) errs.guestsCount = `מספר האורחים חורג מהמקומות הפנויים (${remaining})`
    setValidationErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return
    setIsSubmitting(true)
    setError(null)
    try {
      const success = await onSubmit({ name: name.trim(), phone: phone.trim(), guestsCount })
      if (!success) {
        setError('אירעה שגיאה בהוספת האורח. אנא נסה שנית.')
      }
      // If success, parent calls onClose — no need to do anything here
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'שגיאה לא צפויה'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-1">
      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* שם מלא */}
      <div className="flex flex-col gap-1">
        <label htmlFor="manualName" className="text-sm font-medium text-gray-700">
          שם מלא <span className="text-red-500">*</span>
        </label>
        <input
          id="manualName"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ישראל ישראלי"
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-right outline-none transition-colors',
            validationErrors.name
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          ].join(' ')}
          disabled={isSubmitting}
        />
        {validationErrors.name && (
          <p className="text-xs text-red-600">{validationErrors.name}</p>
        )}
      </div>

      {/* טלפון */}
      <div className="flex flex-col gap-1">
        <label htmlFor="manualPhone" className="text-sm font-medium text-gray-700">
          טלפון <span className="text-red-500">*</span>
        </label>
        <input
          id="manualPhone"
          type="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="05X-XXXXXXX"
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-left outline-none transition-colors',
            validationErrors.phone
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          ].join(' ')}
          disabled={isSubmitting}
        />
        {validationErrors.phone && (
          <p className="text-xs text-red-600">{validationErrors.phone}</p>
        )}
      </div>

      {/* מספר אורחים */}
      <div className="flex flex-col gap-1">
        <label htmlFor="manualGuests" className="text-sm font-medium text-gray-700">
          מספר אורחים <span className="text-red-500">*</span>
        </label>
        <input
          id="manualGuests"
          type="number"
          min={1}
          max={remaining}
          value={guestsCount}
          onChange={(e) => setGuestsCount(parseInt(e.target.value, 10) || 1)}
          className={[
            'w-full rounded-lg border px-3 py-2.5 text-sm text-right outline-none transition-colors',
            validationErrors.guestsCount
              ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          ].join(' ')}
          disabled={isSubmitting}
        />
        <p className="text-xs text-gray-500">מקומות פנויים: {remaining}</p>
        {validationErrors.guestsCount && (
          <p className="text-xs text-red-600">{validationErrors.guestsCount}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-h-[40px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              שומר...
            </>
          ) : (
            <>
              <UserPlus className="w-4 h-4" />
              הוסף אורח
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-transparent text-gray-600 text-sm font-medium hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed transition-colors min-h-[40px] border border-gray-300"
        >
          חזרה לרשימה
        </button>
      </div>
    </form>
  )
}

// ─── Main Modal ───────────────────────────────────────────────────────────────

export default function AddRegistrationToTableModal({
  show,
  table,
  waitlist,
  allTables,
  onClose,
  onConfirm,
  onManualAdd,
}: AddRegistrationToTableModalProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('waitlist')
  const [view, setView] = useState<ViewState>('list')
  const [pendingForceEntry, setPendingForceEntry] = useState<WaitlistEntry | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const backdropRef = useRef<HTMLDivElement>(null)

  // Reset to list view when modal closes
  useEffect(() => {
    if (!show) {
      setView('list')
      setActiveTab('waitlist')
      setPendingForceEntry(null)
      setIsConfirming(false)
    }
  }, [show])

  // ── Derived data ────────────────────────────────────────────────────────────

  const { fitsWaitlist, belowMinWaitlist } = useMemo(() => {
    if (!table) return { fitsWaitlist: [], belowMinWaitlist: [] }

    const fits: WaitlistEntry[] = []
    const belowMin: WaitlistEntry[] = []

    const sortedWaitlist = [...waitlist].sort(
      (a, b) => (a.waitlistPriority ?? Infinity) - (b.waitlistPriority ?? Infinity)
    )

    for (const entry of sortedWaitlist) {
      const guests = entry.guestsCount ?? 1
      const check = canAddRegistrationToTable(table, guests)

      if (check.ok) {
        fits.push(entry)
      } else {
        // Include in belowMin only when the ONLY reason for failure is minOrder on an empty table
        // i.e. the guests would fit capacity-wise but the table is empty + below minOrder
        const remaining = tableRemainingSpots(table)
        const tableEmpty = isTableEmpty(table)
        if (tableEmpty && guests < table.minOrder && guests <= remaining && guests >= 1) {
          belowMin.push(entry)
        }
      }
    }

    return { fitsWaitlist: fits, belowMinWaitlist: belowMin }
  }, [table, waitlist])

  const crossTableCandidates = useMemo(() => {
    if (!table) return []

    const candidates: Array<{ entry: TableRegistration; fromTable: Table }> = []

    for (const t of allTables) {
      if (t.id === table.id) continue
      for (const reg of t.registrations) {
        const guests = reg.guestsCount ?? 1
        const check = canAddRegistrationToTable(table, guests)
        if (check.ok) {
          candidates.push({ entry: reg, fromTable: t })
        }
      }
    }

    return candidates
  }, [table, allTables])

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) {
      onClose()
    }
  }

  async function handleConfirm(id: string, isWaitlist: boolean, force?: boolean) {
    if (!table) return
    setIsConfirming(true)
    try {
      await onConfirm(table, { id, isWaitlist, force })
    } finally {
      setIsConfirming(false)
      setPendingForceEntry(null)
    }
  }

  function handleWaitlistSelect(entry: WaitlistEntry) {
    const guests = entry.guestsCount ?? 1
    const check = canAddRegistrationToTable(table!, guests)
    if (check.ok) {
      void handleConfirm(entry.id, true)
    } else if (belowMinWaitlist.some((e) => e.id === entry.id)) {
      setPendingForceEntry(entry)
    }
  }

  async function handleManualAdd(data: { name: string; phone: string; guestsCount: number }) {
    if (!table) return false
    const success = await onManualAdd(table, data)
    if (success) {
      onClose()
    }
    return success
  }

  // ── Render guard ────────────────────────────────────────────────────────────

  if (!show || !table) return null

  const remaining = tableRemainingSpots(table)

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      dir="rtl"
    >
      <div
        className="relative w-full max-w-md max-h-[90vh] flex flex-col rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="flex flex-col">
            <h2 className="text-base font-semibold text-gray-900">
              {view === 'manualForm' ? 'הוסף אורח ידנית' : `הוסף לשולחן ${table.tableNumber}`}
            </h2>
            {view === 'list' && (
              <p className="text-xs text-gray-500 mt-0.5">
                {remaining} מקומות פנויים מתוך {table.capacity}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs — hidden in manualForm view */}
        {view === 'list' && (
          <div className="flex border-b border-gray-100 shrink-0">
            <button
              type="button"
              onClick={() => {
                setActiveTab('waitlist')
                setPendingForceEntry(null)
              }}
              className={[
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === 'waitlist'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <UserPlus className="w-4 h-4" />
              רשימת המתנה
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('cross')
                setPendingForceEntry(null)
              }}
              className={[
                'flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                activeTab === 'cross'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700',
              ].join(' ')}
            >
              <ArrowRightLeft className="w-4 h-4" />
              העברה משולחן
            </button>
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {view === 'manualForm' ? (
            <ManualAddForm
              table={table}
              onSubmit={handleManualAdd}
              onBack={() => {
                setView('list')
                setPendingForceEntry(null)
              }}
            />
          ) : activeTab === 'waitlist' ? (
            <WaitlistTabContent
              fitsWaitlist={fitsWaitlist}
              belowMinWaitlist={belowMinWaitlist}
              pendingForceEntry={pendingForceEntry}
              isConfirming={isConfirming}
              onSelect={handleWaitlistSelect}
              onForceConfirm={(entry) => handleConfirm(entry.id, true, true)}
              onForceDismiss={() => setPendingForceEntry(null)}
              onManualAdd={() => setView('manualForm')}
              minOrder={table.minOrder}
            />
          ) : (
            <CrossTableTabContent
              candidates={crossTableCandidates}
              isConfirming={isConfirming}
              onSelect={(reg) => handleConfirm(reg.id, false)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Tab content components ───────────────────────────────────────────────────

interface WaitlistTabContentProps {
  fitsWaitlist: WaitlistEntry[]
  belowMinWaitlist: WaitlistEntry[]
  pendingForceEntry: WaitlistEntry | null
  isConfirming: boolean
  minOrder: number
  onSelect: (entry: WaitlistEntry) => void
  onForceConfirm: (entry: WaitlistEntry) => void
  onForceDismiss: () => void
  onManualAdd: () => void
}

function WaitlistTabContent({
  fitsWaitlist,
  belowMinWaitlist,
  pendingForceEntry,
  isConfirming,
  minOrder,
  onSelect,
  onForceConfirm,
  onForceDismiss,
  onManualAdd,
}: WaitlistTabContentProps) {
  const hasAny = fitsWaitlist.length > 0 || belowMinWaitlist.length > 0

  if (!hasAny) {
    return <EmptyStateWithManualAdd onManualAdd={onManualAdd} />
  }

  function getDisplayName(entry: WaitlistEntry): string {
    if (entry.data && typeof entry.data === 'object') {
      const d = entry.data as Record<string, unknown>
      if (typeof d.name === 'string' && d.name) return d.name
      if (typeof d.fullName === 'string' && d.fullName) return d.fullName
    }
    return entry.confirmationCode
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Force-override confirmation banner */}
      {pendingForceEntry && (
        <div className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <p className="text-sm font-medium text-orange-800">מתחת למינימום השולחן</p>
              <p className="text-xs text-orange-700">
                ההזמנה כוללת {pendingForceEntry.guestsCount ?? 1} אורחים, אך המינימום לפתיחת שולחן
                הוא {minOrder}. האם לאשר בכל זאת?
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onForceConfirm(pendingForceEntry)}
              disabled={isConfirming}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 disabled:opacity-60 transition-colors min-h-[40px]"
            >
              {isConfirming ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              כן, אשר בכל זאת
            </button>
            <button
              type="button"
              onClick={onForceDismiss}
              disabled={isConfirming}
              className="flex-1 px-3 py-2 rounded-lg border border-orange-300 text-orange-700 text-xs font-medium hover:bg-orange-100 disabled:opacity-60 transition-colors min-h-[40px]"
            >
              ביטול
            </button>
          </div>
        </div>
      )}

      {/* Fits waitlist */}
      {fitsWaitlist.length > 0 && (
        <div className="flex flex-col gap-2">
          {belowMinWaitlist.length > 0 && (
            <p className="text-xs font-medium text-gray-500 px-1">מתאימים לשולחן</p>
          )}
          {fitsWaitlist.map((entry) => (
            <CandidateRow
              key={entry.id}
              label={getDisplayName(entry)}
              sublabel={entry.phoneNumber ?? entry.confirmationCode}
              guestsCount={entry.guestsCount ?? 1}
              onSelect={() => onSelect(entry)}
              disabled={isConfirming}
            />
          ))}
        </div>
      )}

      {/* Below min-order waitlist */}
      {belowMinWaitlist.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium text-orange-500 px-1 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            מתחת למינימום (ניתן לאשר ידנית)
          </p>
          {belowMinWaitlist.map((entry) => (
            <CandidateRow
              key={entry.id}
              label={getDisplayName(entry)}
              sublabel={entry.phoneNumber ?? entry.confirmationCode}
              guestsCount={entry.guestsCount ?? 1}
              onSelect={() => onSelect(entry)}
              disabled={isConfirming}
            />
          ))}
        </div>
      )}

      {/* Manual add shortcut at the bottom */}
      <div className="pt-1 border-t border-gray-100">
        <button
          type="button"
          onClick={onManualAdd}
          disabled={isConfirming}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-gray-300 text-gray-500 text-sm hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 disabled:opacity-60 transition-colors min-h-[40px]"
        >
          <UserPlus className="w-4 h-4" />
          הוסף אורח ידנית
        </button>
      </div>
    </div>
  )
}

interface CrossTableTabContentProps {
  candidates: Array<{ entry: TableRegistration; fromTable: Table }>
  isConfirming: boolean
  onSelect: (reg: TableRegistration) => void
}

function CrossTableTabContent({ candidates, isConfirming, onSelect }: CrossTableTabContentProps) {
  if (candidates.length === 0) {
    return (
      <EmptyState message="אין הזמנות מאושרות שניתן להעביר לשולחן זה" />
    )
  }

  function getDisplayName(reg: TableRegistration): string {
    if (reg.data && typeof reg.data === 'object') {
      const d = reg.data as Record<string, unknown>
      if (typeof d.name === 'string' && d.name) return d.name
      if (typeof d.fullName === 'string' && d.fullName) return d.fullName
    }
    return reg.confirmationCode
  }

  return (
    <div className="flex flex-col gap-2">
      {candidates.map(({ entry, fromTable }) => (
        <CandidateRow
          key={entry.id}
          label={getDisplayName(entry)}
          sublabel={`שולחן ${fromTable.tableNumber}${entry.phoneNumber ? ` · ${entry.phoneNumber}` : ''}`}
          guestsCount={entry.guestsCount ?? 1}
          onSelect={() => onSelect(entry)}
          disabled={isConfirming}
        />
      ))}
    </div>
  )
}
