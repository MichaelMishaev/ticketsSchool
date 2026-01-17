'use client'

import { useState, useEffect } from 'react'
import {
  QrCode,
  ClipboardCheck,
  ArrowLeft,
  Calendar,
  BarChart,
} from 'lucide-react'

interface CheckInHeroCardProps {
  eventId: string
  eventStartAt: Date
  eventEndAt?: Date | null
  onNavigateToCheckIn: () => void
  onNavigateToReports: () => void
}

interface CheckInStats {
  totalRegistrations: number
  checkedInCount: number
  checkInPercentage: number
}

export default function CheckInHeroCard({
  eventId,
  eventStartAt,
  eventEndAt,
  onNavigateToCheckIn,
  onNavigateToReports,
}: CheckInHeroCardProps) {
  const [stats, setStats] = useState<CheckInStats | null>(null)
  const [loading, setLoading] = useState(true)

  // Check if event has passed
  const isPastEvent = () => {
    const now = new Date()
    // Use endAt if available, otherwise startAt
    const eventDate = eventEndAt ? new Date(eventEndAt) : new Date(eventStartAt)
    return now > eventDate
  }

  const pastEvent = isPastEvent()

  useEffect(() => {
    fetchCheckInStats()
  }, [eventId])

  const fetchCheckInStats = async () => {
    try {
      const response = await fetch(`/api/check-in/${eventId}/stats`)
      if (response.ok) {
        const data = await response.json()
        setStats({
          totalRegistrations: data.totalRegistrations || 0,
          checkedInCount: data.checkedInCount || 0,
          checkInPercentage: data.checkInPercentage || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching check-in stats:', error)
      // Set default stats on error
      setStats({
        totalRegistrations: 0,
        checkedInCount: 0,
        checkInPercentage: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl opacity-10 blur-lg"></div>
        <div className="relative bg-white/95 rounded-2xl border-2 border-gray-200/80 p-6 animate-pulse">
          <div className="h-24 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    )
  }

  // Archive view for past events
  if (pastEvent) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-purple-500"></div>

        <div className="p-6">
          {/* Archive icon and title */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-200">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">סיכום נוכחות</h3>
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
              ארכיון
            </span>
          </div>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              האירוע הסתיים - צפה בסיכום הנוכחות והדוחות המלאים
            </p>

          {/* Stats Preview - Clean Design */}
          {stats && stats.totalRegistrations > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                <div className="text-2xl font-black text-gray-900">
                  {stats.totalRegistrations}
                </div>
                <div className="text-xs text-gray-700 font-bold">נרשמו</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
                <div className="text-2xl font-black text-green-600">{stats.checkedInCount}</div>
                <div className="text-xs text-gray-700 font-bold">הגיעו</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
                <div className="text-2xl font-black text-purple-600">
                  {stats.checkInPercentage}%
                </div>
                <div className="text-xs text-gray-700 font-bold">אחוז הגעה</div>
              </div>
            </div>
          )}

          {/* CTA Button - Navigate to Reports */}
          <button
            onClick={onNavigateToReports}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4
                     bg-purple-600 text-white rounded-lg font-bold text-sm
                     hover:bg-purple-700 active:scale-[0.98] transition-all duration-200
                     shadow-sm hover:shadow-md
                     focus:outline-none focus:ring-4 focus:ring-purple-500/30"
          >
            <BarChart className="w-5 h-5" />
            <span>צפה בדוח נוכחות מלא</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // Active event view
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Top accent */}
      <div className="h-1 bg-green-500"></div>

      <div className="p-6">
        {/* Header with Icon */}
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
            <ClipboardCheck className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">ניהול כניסה ונוכחות</h3>
        </div>

        <p className="text-sm text-gray-600 mb-5 leading-relaxed">
          סרוק QR, סמן נוכחות, וקבל סטטיסטיקה בזמן אמת
        </p>

        {/* Stats Preview - Clean Design */}
        {stats && stats.totalRegistrations > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
              <div className="text-2xl font-black text-gray-900">
                {stats.totalRegistrations}
              </div>
              <div className="text-xs text-gray-700 font-bold">נרשמו</div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg border border-green-200 text-center">
              <div className="text-2xl font-black text-green-600">{stats.checkedInCount}</div>
              <div className="text-xs text-gray-700 font-bold">הגיעו</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-center">
              <div className="text-2xl font-black text-purple-600">
                {stats.checkInPercentage}%
              </div>
              <div className="text-xs text-gray-700 font-bold">אחוז הגעה</div>
            </div>
          </div>
        )}

        {/* CTA Button - Clean Style */}
        <button
          onClick={onNavigateToCheckIn}
          className="w-full flex items-center justify-center gap-2.5 px-6 py-4
                   bg-green-600 text-white rounded-lg font-bold text-sm
                   hover:bg-green-700 active:scale-[0.98] transition-all duration-200
                   shadow-sm hover:shadow-md
                   focus:outline-none focus:ring-4 focus:ring-green-500/30"
        >
          <QrCode className="w-5 h-5" />
          <span>פתח מסך כניסה ונוכחות</span>
          <ArrowLeft className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
