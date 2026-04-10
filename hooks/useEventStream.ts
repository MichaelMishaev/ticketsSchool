import { useState, useEffect, useCallback, useRef } from 'react'

interface Registration {
  id: string
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
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
}

interface UseEventStreamReturn {
  newRegistrations: Registration[]
  isConnected: boolean
  stats: Stats | null
  clearNewRegistrations: () => void
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
        setStats({ confirmed, waitlist, cancelled })

        // On first poll, just record the known IDs (don't show them as "new")
        if (!initializedRef.current) {
          knownIdsRef.current = new Set(registrations.map((r: Registration) => r.id))
          initializedRef.current = true
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

          // Play notification sound
          try {
            const ctx = new AudioContext()
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.frequency.value = 800
            gain.gain.value = 0.15
            osc.start()
            osc.stop(ctx.currentTime + 0.15)
          } catch {
            // Audio not supported
          }
        }
      } catch {
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
