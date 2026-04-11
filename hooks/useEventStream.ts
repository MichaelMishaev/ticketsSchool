import { useState, useEffect, useCallback, useRef } from 'react'

interface Registration {
  id: string
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED' | 'PAYMENT_PENDING'
  spotsCount: number
  phoneNumber: string
  data: Record<string, unknown>
  confirmationCode: string
  createdAt: string
}

interface Stats {
  confirmed: number
  waitlist: number
  cancelled: number
  paymentPending: number
}

interface UseEventStreamReturn {
  newRegistrations: Registration[]
  isConnected: boolean
  stats: Stats | null
  clearNewRegistrations: () => void
}

/**
 * Play a notification chime via WebAudio. Two variants:
 *   - 'normal':  single 800Hz tone, 150ms — a new CONFIRMED/WAITLIST reg.
 *   - 'pending': two-tone 600Hz→900Hz, 200ms total — PAYMENT_PENDING reg
 *                that needs manual attention (distinctly "unresolved").
 *
 * Uses AudioContext timeline scheduling (not setTimeout) for sample-accurate
 * note transitions that aren't affected by React render cycles.
 */
function playChime(kind: 'normal' | 'pending'): void {
  try {
    const ctx = new AudioContext()

    if (kind === 'normal') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 800
      gain.gain.value = 0.15
      osc.start()
      osc.stop(ctx.currentTime + 0.15)
      return
    }

    // 'pending': 600Hz (100ms) then 900Hz (100ms) — a clearly distinct chime.
    const gain = ctx.createGain()
    gain.gain.value = 0.18
    gain.connect(ctx.destination)

    const tone1 = ctx.createOscillator()
    tone1.frequency.value = 600
    tone1.connect(gain)
    tone1.start(ctx.currentTime)
    tone1.stop(ctx.currentTime + 0.1)

    const tone2 = ctx.createOscillator()
    tone2.frequency.value = 900
    tone2.connect(gain)
    tone2.start(ctx.currentTime + 0.1)
    tone2.stop(ctx.currentTime + 0.2)
  } catch {
    // Audio not supported or blocked by autoplay policy — silently ignore.
  }
}

/**
 * Real-time registration updates via polling.
 *
 * Polls the registrations API every 3 seconds and detects new entries
 * by comparing IDs with the previously known set.
 *
 * This replaces the previous SSE approach which was unreliable due to
 * Next.js dev server buffering streaming responses.
 */
export function useEventStream(eventId: string, enabled: boolean = true): UseEventStreamReturn {
  const [newRegistrations, setNewRegistrations] = useState<Registration[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState<Stats | null>(null)

  const knownIdsRef = useRef<Set<string>>(new Set())
  const initializedRef = useRef(false)

  const clearNewRegistrations = useCallback(() => {
    setNewRegistrations([])
  }, [])

  useEffect(() => {
    if (!enabled || !eventId) return

    let isMounted = true
    let pollTimer: NodeJS.Timeout | undefined

    const poll = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/registrations`)
        if (!res.ok) {
          console.warn('[PAYMENT_PENDING_TRACE][useEventStream] poll fetch !ok', {
            eventId,
            httpStatus: res.status,
          })
          if (isMounted) setIsConnected(false)
          return
        }

        const data = await res.json()
        if (!isMounted) return

        setIsConnected(true)

        const registrations: Registration[] = data.registrations || []

        // Update stats
        const confirmed = registrations.filter((r: Registration) => r.status === 'CONFIRMED').length
        const waitlist = registrations.filter((r: Registration) => r.status === 'WAITLIST').length
        const cancelled = registrations.filter((r: Registration) => r.status === 'CANCELLED').length
        const paymentPending = registrations.filter(
          (r: Registration) => r.status === 'PAYMENT_PENDING'
        ).length
        setStats({ confirmed, waitlist, cancelled, paymentPending })

        console.log('[PAYMENT_PENDING_TRACE][useEventStream] poll stats', {
          eventId,
          total: registrations.length,
          confirmed,
          waitlist,
          cancelled,
          paymentPending,
          firstPoll: !initializedRef.current,
          pendingIds: registrations.filter((r) => r.status === 'PAYMENT_PENDING').map((r) => r.id),
        })

        // On first poll, just record the known IDs (don't show them as "new")
        if (!initializedRef.current) {
          knownIdsRef.current = new Set(registrations.map((r: Registration) => r.id))
          initializedRef.current = true
          console.log('[PAYMENT_PENDING_TRACE][useEventStream] initialized known IDs', {
            count: knownIdsRef.current.size,
          })
          return
        }

        // Find registrations we haven't seen before
        const brandNew = registrations.filter((r: Registration) => !knownIdsRef.current.has(r.id))

        if (brandNew.length > 0) {
          // Add new IDs to known set
          for (const r of brandNew) {
            knownIdsRef.current.add(r.id)
          }

          // Prepend new registrations (most recent first)
          setNewRegistrations((prev) => {
            const existingIds = new Set(prev.map((r) => r.id))
            const truly = brandNew.filter((r: Registration) => !existingIds.has(r.id))
            return [...truly, ...prev]
          })

          // Play notification chime. Priority: any PAYMENT_PENDING in the
          // brand-new batch upgrades us to the urgent 2-tone chime, even if
          // a regular confirmation also arrived in the same poll — admin
          // attention should escalate, not dilute.
          const hasPending = brandNew.some((r: Registration) => r.status === 'PAYMENT_PENDING')
          console.log('[PAYMENT_PENDING_TRACE][useEventStream] brand-new detected', {
            brandNewCount: brandNew.length,
            brandNewStatuses: brandNew.map((r) => r.status),
            brandNewIds: brandNew.map((r) => r.id),
            chime: hasPending ? 'pending' : 'normal',
          })
          playChime(hasPending ? 'pending' : 'normal')
        }
      } catch (err) {
        console.error('[PAYMENT_PENDING_TRACE][useEventStream] poll threw', err)
        if (isMounted) setIsConnected(false)
      }
    }

    // Start polling immediately, then every 3 seconds
    poll()
    pollTimer = setInterval(poll, 3000)

    return () => {
      isMounted = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [eventId, enabled])

  return {
    newRegistrations,
    isConnected,
    stats,
    clearNewRegistrations,
  }
}
