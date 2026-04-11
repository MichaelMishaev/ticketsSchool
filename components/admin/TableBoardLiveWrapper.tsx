'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import TableBoardStats from './TableBoardStats'
import TableBoardClient from './TableBoardClient'
import TableBoardTabs from './TableBoardTabs'
import WaitlistManager from './WaitlistManager'
import PendingPaymentsPanel from './PendingPaymentsPanel'
import type { TableRegistration } from './table-helpers'

interface Table {
  id: string
  tableNumber: string
  capacity: number
  minOrder: number
  status: 'AVAILABLE' | 'RESERVED' | 'INACTIVE'
  hasWaitlistMatch: boolean
  // Sharing-aware: one table may host N CONFIRMED registrations.
  registrations: TableRegistration[]
}

interface WaitlistEntry {
  id: string
  confirmationCode: string
  guestsCount: number | null
  phoneNumber: string | null
  waitlistPriority: number | null
  data: any
  createdAt: Date
  matchingTables: Array<{ id: string; tableNumber: string; capacity: number; minOrder: number }>
  bestTable: { id: string; tableNumber: string; capacity: number } | null
  hasMatch: boolean
}

interface TableBoardLiveWrapperProps {
  eventId: string
  initialTables: Table[]
  initialWaitlist: WaitlistEntry[]
  initialStats: {
    total: number
    available: number
    reserved: number
    waitlistCount: number
    matchAvailable: number
  }
}

export default function TableBoardLiveWrapper({
  eventId,
  initialTables,
  initialWaitlist,
  initialStats,
}: TableBoardLiveWrapperProps) {
  const [localTables, setLocalTables] = useState<Table[]>(initialTables)
  const [localWaitlist, setLocalWaitlist] = useState<WaitlistEntry[]>(initialWaitlist)
  const [activeTab, setActiveTab] = useState<'tables' | 'waitlist'>('tables')
  const switchToWaitlist = useCallback(() => setActiveTab('waitlist'), [])

  // Sync server props when they change (after router.refresh())
  useEffect(() => {
    setLocalTables(initialTables)
  }, [initialTables])

  useEffect(() => {
    setLocalWaitlist(initialWaitlist)
  }, [initialWaitlist])

  // Track previously RESERVED IDs — initialized from initialTables
  const prevReservedIdsRef = useRef<Set<string>>(
    new Set(initialTables.filter((t) => t.status === 'RESERVED').map((t) => t.id))
  )

  // Play a two-tone chime using Web Audio API — no audio file required
  const playBookingChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const notes = [880, 660]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = 'sine'
        osc.frequency.value = freq
        const start = ctx.currentTime + i * 0.18
        gain.gain.setValueAtTime(0, start)
        gain.gain.linearRampToValueAtTime(0.3, start + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35)
        osc.start(start)
        osc.stop(start + 0.35)
      })
    } catch {
      // silent fail
    }
  }

  // Poll tables every 3s
  useEffect(() => {
    let isMounted = true
    let isFirstPoll = true
    let pollTimer: ReturnType<typeof setInterval> | undefined

    const poll = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/tables`, { credentials: 'same-origin' })
        if (!res.ok || !isMounted) return
        const data: { tables: Table[] } = await res.json()
        if (!isMounted) return

        // Detect newly RESERVED tables — skip chime on first poll (just initializing)
        if (!isFirstPoll) {
          const newlyReserved = data.tables.filter(
            (t) => t.status === 'RESERVED' && !prevReservedIdsRef.current.has(t.id)
          )
          if (newlyReserved.length > 0) {
            playBookingChime()
          }
        }

        // Update tracking ref for next comparison
        prevReservedIdsRef.current = new Set(
          data.tables.filter((t) => t.status === 'RESERVED').map((t) => t.id)
        )
        isFirstPoll = false

        setLocalTables(data.tables)
      } catch {
        // Network blip — silent, next poll retries
      }
    }

    poll()
    pollTimer = setInterval(poll, 3000)

    return () => {
      isMounted = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [eventId])

  // Poll waitlist every 3s (separate effect with its own isMounted guard)
  useEffect(() => {
    let isMounted = true
    let pollTimer: ReturnType<typeof setInterval> | undefined

    const poll = async () => {
      try {
        const res = await fetch(`/api/events/${eventId}/waitlist`, { credentials: 'same-origin' })
        if (!res.ok || !isMounted) return
        const data: { waitlist: WaitlistEntry[] } = await res.json()
        if (!isMounted) return

        setLocalWaitlist(data.waitlist)
      } catch {
        // Network blip — silent, next poll retries
      }
    }

    poll()
    pollTimer = setInterval(poll, 3000)

    return () => {
      isMounted = false
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [eventId])

  // Compute live stats from local state
  const liveStats = {
    total: localTables.length,
    available: localTables.filter((t) => t.status === 'AVAILABLE').length,
    reserved: localTables.filter((t) => t.status === 'RESERVED').length,
    waitlistCount: localWaitlist.length,
    matchAvailable: localTables.filter((t) => t.hasWaitlistMatch && t.status === 'AVAILABLE')
      .length,
  }

  const tablesView = (
    <TableBoardClient
      tables={localTables}
      waitlist={localWaitlist}
      eventId={eventId}
      onSwitchToWaitlist={switchToWaitlist}
    />
  )
  const waitlistView = <WaitlistManager eventId={eventId} waitlist={localWaitlist} />

  return (
    <div className="space-y-4">
      <TableBoardStats tables={localTables} waitlist={localWaitlist} stats={liveStats} />

      {/* Pending payments — only renders when there's at least one PAYMENT_PENDING */}
      <PendingPaymentsPanel eventId={eventId} />

      {liveStats.matchAvailable > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-100/20 via-transparent to-transparent pointer-events-none" />
          <div className="relative p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                <span className="text-base">✨</span>
              </div>
              <div className="flex-1 min-w-0" dir="rtl">
                <p className="text-sm font-semibold text-amber-900 mb-1">יש התאמות זמינות!</p>
                <p className="text-xs text-amber-800">
                  {liveStats.matchAvailable}{' '}
                  {liveStats.matchAvailable === 1 ? 'שולחן פנוי' : 'שולחנות פנויים'} מתאימים לאורחים
                  ברשימת ההמתנה. עבור ללשונית &quot;רשימת המתנה&quot; לשיבוץ.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <TableBoardTabs
        tablesView={tablesView}
        waitlistView={waitlistView}
        waitlistCount={liveStats.waitlistCount}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
    </div>
  )
}
