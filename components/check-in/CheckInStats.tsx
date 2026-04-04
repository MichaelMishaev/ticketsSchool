'use client'

import { useEffect, useState } from 'react'

interface CheckInStatsProps {
  eventId: string
  token: string
  initialStats?: {
    total: number
    checkedIn: number
    percentageCheckedIn: number
  }
}

export function CheckInStats({ eventId, token, initialStats }: CheckInStatsProps) {
  const [stats, setStats] = useState(initialStats)
  const [loading, setLoading] = useState(!initialStats)

  const fetchStats = async () => {
    try {
      const response = await fetch(`/api/check-in/${eventId}/${token}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    // Poll every 10 seconds for live updates
    const interval = setInterval(fetchStats, 10000)
    return () => clearInterval(interval)
  }, [eventId, token])

  if (loading || !stats) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md animate-pulse" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="h-6 w-32 bg-blue-400 rounded"></div>
          <div className="h-8 w-24 bg-blue-400 rounded"></div>
        </div>
      </div>
    )
  }

  const percentage = stats.percentageCheckedIn

  return (
    <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 shadow-md" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium opacity-90">סטטוס נוכחות</div>
          <div className="text-2xl font-bold mt-1">
            {stats.checkedIn} / {stats.total}
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold">{percentage}%</div>
          <div className="text-xs opacity-90">הגיעו</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 bg-blue-700 bg-opacity-30 rounded-full h-2 overflow-hidden">
        <div
          className="bg-white h-full rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
