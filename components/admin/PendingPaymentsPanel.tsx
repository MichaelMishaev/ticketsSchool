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

import { useState, useEffect, useCallback } from 'react'
import { Clock, X, Loader2 } from 'lucide-react'

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

export default function PendingPaymentsPanel({ eventId }: PendingPaymentsPanelProps) {
  const [pending, setPending] = useState<PendingRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleCancel = async (registrationId: string) => {
    if (!confirm('לבטל את ההזמנה הממתינה לתשלום?')) return
    setCancellingId(registrationId)
    setError(null)

    try {
      // PATCH the reg to CANCELLED — the registrations PATCH route handles
      // PAYMENT_PENDING → CANCELLED transitions without touching spotsReserved.
      const res = await fetch(`/api/events/${eventId}/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to cancel')
      }
      // Optimistic: remove from local state; next poll will reconcile anyway.
      setPending((prev) => prev.filter((r) => r.id !== registrationId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setCancellingId(null)
    }
  }

  // Don't render anything when there are no pending regs — avoids a permanent
  // "0 pending" panel that adds visual noise on healthy events.
  if (loading) return null
  if (pending.length === 0) return null

  return (
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
                  onClick={() => handleCancel(reg.id)}
                  disabled={cancellingId === reg.id}
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
  )
}
