'use client'

/**
 * PendingPaymentsPanel
 *
 * Surfaces TABLE_BASED registrations stuck in `PAYMENT_PENDING` state — those
 * that started the HYP payment flow but never completed. These regs have
 * `tableId: null` (we assign the table at callback, not at reservation),
 * so they don't appear on the main table board at all. Without this panel,
 * admins have no way to notice who "booked a table but walked away at HYP".
 *
 * The panel polls `GET /api/events/[id]/registrations?status=PAYMENT_PENDING`
 * every 5 seconds (slower than the 3s table poll — less urgent). It does NOT
 * play a chime; the table board already chimes when a reg actually transitions
 * to CONFIRMED+RESERVED, which is the success signal.
 *
 * IMPORTANT INVARIANT: PAYMENT_PENDING regs deliberately do NOT consume table
 * capacity in `table-helpers.ts` — we display them here but the occupancy math
 * still counts only CONFIRMED. The "no soft-hold" design is load-bearing:
 * holding tables while payments pend would create a DoS surface.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { Clock, X, Loader2, CheckCircle, RotateCcw } from 'lucide-react'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

const UNDO_TTL_MS = 5000

interface PendingRegistration {
  id: string
  status: string
  spotsCount: number | null
  guestsCount: number | null
  phoneNumber: string | null
  data: Record<string, unknown> | null
  confirmationCode: string
  createdAt: string
}

interface PendingPaymentsPanelProps {
  eventId: string
}

type ModalAction = { type: 'pay'; regId: string } | { type: 'cancel'; regId: string } | null

interface UndoState {
  regId: string
  reg: PendingRegistration
  /** seconds remaining (counts down from 5) */
  secondsLeft: number
  restoringId: string | null
}

export default function PendingPaymentsPanel({ eventId }: PendingPaymentsPanelProps) {
  const [pending, setPending] = useState<PendingRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<ModalAction>(null)
  const [undo, setUndo] = useState<UndoState | null>(null)
  const undoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearUndoTimer = () => {
    if (undoTimerRef.current) {
      clearInterval(undoTimerRef.current)
      undoTimerRef.current = null
    }
  }

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/registrations?status=PAYMENT_PENDING`, {
        credentials: 'same-origin',
      })
      if (!res.ok) return
      const data: { registrations: PendingRegistration[] } = await res.json()
      setPending(data.registrations)
    } catch {
      // Silent — next poll will retry
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    let isMounted = true

    const tick = async () => {
      if (!isMounted) return
      await fetchPending()
    }

    tick()
    const pollTimer = setInterval(tick, 5000)

    return () => {
      isMounted = false
      clearInterval(pollTimer)
    }
  }, [fetchPending])

  // Cleanup undo timer on unmount
  useEffect(() => () => clearUndoTimer(), [])

  const startUndoCountdown = (reg: PendingRegistration) => {
    clearUndoTimer()
    setUndo({ regId: reg.id, reg, secondsLeft: Math.ceil(UNDO_TTL_MS / 1000), restoringId: null })

    undoTimerRef.current = setInterval(() => {
      setUndo((prev) => {
        if (!prev) return null
        const next = prev.secondsLeft - 1
        if (next <= 0) {
          clearUndoTimer()
          // Timer expired — permanently remove from list
          setPending((p) => p.filter((r) => r.id !== prev.regId))
          return null
        }
        return { ...prev, secondsLeft: next }
      })
    }, 1000)
  }

  const handleUndoCancel = async () => {
    if (!undo) return
    clearUndoTimer()
    const { regId, reg } = undo
    setUndo((prev) => (prev ? { ...prev, restoringId: regId } : null))
    setError(null)

    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${regId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'PAYMENT_PENDING' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to restore')
      }
      // Restore the row
      setPending((prev) => {
        if (prev.find((r) => r.id === regId)) return prev
        return [reg, ...prev]
      })
      setUndo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setUndo(null)
    }
  }

  const handleMarkAsPaid = async (registrationId: string) => {
    setConfirmingId(registrationId)
    setPendingAction(null)
    setError(null)
    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CONFIRMED' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to confirm')
      }
      setPending((prev) => prev.filter((r) => r.id !== registrationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setConfirmingId(null)
    }
  }

  const handleCancel = async (registrationId: string) => {
    setCancellingId(registrationId)
    setPendingAction(null)
    setError(null)

    try {
      const res = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to cancel')
      }
      // Hide the row and start undo countdown instead of removing immediately
      const reg = pending.find((r) => r.id === registrationId)
      if (reg) {
        setPending((prev) => prev.filter((r) => r.id !== registrationId))
        startUndoCountdown(reg)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCancellingId(null)
    }
  }

  const handleModalConfirm = () => {
    if (!pendingAction) return
    if (pendingAction.type === 'pay') handleMarkAsPaid(pendingAction.regId)
    else handleCancel(pendingAction.regId)
  }

  const isPayModal = pendingAction?.type === 'pay'

  // Don't render anything when there are no pending regs AND no undo toast
  if (loading) return null
  if (pending.length === 0 && !undo) return null

  return (
    <>
      <div
        className="relative overflow-hidden bg-amber-50 border-2 border-amber-200 rounded-xl shadow-sm"
        dir="rtl"
      >
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-700" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-amber-900">
                ⏳ {pending.length} הזמנות ממתינות לתשלום
              </h3>
              <p className="text-xs text-amber-800 mt-0.5">
                המזמינים התחילו לשלם אבל לא סיימו. השולחן עדיין לא משובץ.
              </p>
            </div>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-800">
              {error}
            </div>
          )}

          {/* Undo toast — shown after a cancel, before the countdown expires */}
          {undo && (
            <div className="mb-2 flex items-center gap-3 bg-gray-800 text-white rounded-lg px-3 py-2 text-sm">
              <span className="flex-1 text-xs">ההזמנה בוטלה</span>
              <button
                onClick={handleUndoCancel}
                disabled={undo.restoringId !== null}
                className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-white text-gray-800
                           rounded hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {undo.restoringId ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RotateCcw className="w-3 h-3" />
                )}
                <span>בטל פעולה ({undo.secondsLeft})</span>
              </button>
            </div>
          )}

          <div className="space-y-2">
            {pending.map((reg) => {
              const guestLabel = reg.guestsCount ?? reg.spotsCount ?? '?'
              const name =
                (reg.data && typeof reg.data === 'object' && 'name' in reg.data
                  ? String((reg.data as Record<string, unknown>).name)
                  : null) || 'ללא שם'
              const createdAt = new Date(reg.createdAt)
              const minutesAgo = Math.round((Date.now() - createdAt.getTime()) / 60000)
              return (
                <div
                  key={reg.id}
                  className="flex items-center gap-3 bg-white rounded-lg border border-amber-200 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900 truncate">{name}</span>
                      <span className="text-xs text-gray-500">
                        {guestLabel} אורחים · קוד {reg.confirmationCode}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {reg.phoneNumber ? `${reg.phoneNumber} · ` : ''}
                      {minutesAgo < 1 ? 'עכשיו' : `לפני ${minutesAgo} דקות`}
                    </div>
                  </div>
                  <button
                    onClick={() => setPendingAction({ type: 'pay', regId: reg.id })}
                    disabled={confirmingId === reg.id || cancellingId === reg.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 hover:bg-green-50 rounded border border-green-200 disabled:opacity-50"
                    title="אשר תשלום ידני"
                  >
                    {confirmingId === reg.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3 h-3" />
                    )}
                    <span>שולם</span>
                  </button>
                  <button
                    onClick={() => setPendingAction({ type: 'cancel', regId: reg.id })}
                    disabled={cancellingId === reg.id || confirmingId === reg.id}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-700 hover:bg-red-50 rounded border border-red-200 disabled:opacity-50"
                    title="בטל הזמנה ממתינה"
                  >
                    {cancellingId === reg.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <X className="w-3 h-3" />
                    )}
                    <span>בטל</span>
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={pendingAction !== null}
        onClose={() => setPendingAction(null)}
        onConfirm={handleModalConfirm}
        title={isPayModal ? 'אישור תשלום ידני' : 'ביטול הזמנה'}
        description={
          isPayModal
            ? 'לסמן את ההזמנה כשולמה ידנית? השולחן יוקצה אוטומטית.'
            : 'לבטל את ההזמנה הממתינה לתשלום? תוכל לבטל את הפעולה תוך 5 שניות.'
        }
        confirmText={isPayModal ? 'כן, שולם' : 'כן, בטל'}
        cancelText="חזור"
        variant={isPayModal ? 'info' : 'danger'}
        loading={confirmingId === pendingAction?.regId || cancellingId === pendingAction?.regId}
      />
    </>
  )
}
