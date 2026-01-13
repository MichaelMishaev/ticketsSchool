'use client'

import { useState, useEffect } from 'react'
import {
  QrCode,
  ClipboardCheck,
  TrendingUp,
  ArrowLeft,
  Sparkles,
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
      <div className="relative group">
        {/* Gray/purple gradient glow */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-gray-600 via-purple-600 to-gray-600 rounded-2xl opacity-20 blur-lg"></div>

        {/* Main Card */}
        <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200/80 shadow-xl overflow-hidden">
          {/* Gray/purple gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gray-500 via-purple-500 to-gray-500"></div>

          <div className="relative p-6">
            {/* Archive icon and title */}
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-gradient-to-br from-gray-50 to-purple-50 rounded-xl border border-gray-200/50">
                <Calendar className="w-6 h-6 text-gray-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">סיכום נוכחות</h3>
              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded">
                ארכיון
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-5 leading-relaxed">
              האירוע הסתיים - צפה בסיכום הנוכחות והדוחות המלאים
            </p>

            {/* Stats Preview - Same as before */}
            {stats && stats.totalRegistrations > 0 && (
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg border border-gray-200/50 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-2xl font-black text-gray-900">
                      {stats.totalRegistrations}
                    </div>
                    <div className="text-xs text-gray-700 font-bold">נרשמו</div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200/50 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-2xl font-black text-green-600">{stats.checkedInCount}</div>
                    <div className="text-xs text-gray-700 font-bold">הגיעו</div>
                  </div>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-lg border border-purple-200/50 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <div className="text-2xl font-black text-purple-600">
                      {stats.checkInPercentage}%
                    </div>
                    <div className="text-xs text-gray-700 font-bold">תפוסה</div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA Button - Navigate to Reports */}
            <button
              onClick={onNavigateToReports}
              className="w-full flex items-center justify-center gap-2.5 px-6 py-4
                       bg-gradient-to-r from-gray-600 via-purple-600 to-gray-600
                       text-white rounded-xl font-bold text-sm
                       hover:from-gray-700 hover:via-purple-700 hover:to-gray-700
                       active:scale-[0.97] transition-all duration-200
                       shadow-lg shadow-gray-500/30
                       focus:outline-none focus:ring-4 focus:ring-gray-500/30
                       group/btn overflow-hidden relative"
            >
              {/* Shine effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

              <BarChart className="w-5 h-5 relative" />
              <span className="relative">צפה בדוח נוכחות מלא</span>
              <ArrowLeft className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Active event view
  return (
    <div className="relative group">
      {/* Gradient Background Glow */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 rounded-2xl opacity-20 blur-lg group-hover:opacity-30 transition-opacity duration-300"></div>

      {/* Main Card */}
      <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl border-2 border-gray-200/80 shadow-xl overflow-hidden">
        {/* Top Gradient Accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>

        {/* Decorative Corner Gradient */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-green-500/5 via-emerald-500/5 to-transparent rounded-br-[200px] pointer-events-none"></div>

        <div className="relative p-6">
          {/* Header with Icon */}
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50">
              <ClipboardCheck className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">ניהול כניסה ונוכחות</h3>
          </div>

          <p className="text-sm text-gray-600 mb-5 leading-relaxed">
            סרוק QR, סמן נוכחות, וקבל סטטיסטיקה בזמן אמת
          </p>

          {/* Stats Preview - Enhanced */}
          {stats && stats.totalRegistrations > 0 && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="p-3 bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg border border-gray-200/50 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl font-black text-gray-900">
                    {stats.totalRegistrations}
                  </div>
                  <div className="text-xs text-gray-700 font-bold">נרשמו</div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200/50 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl font-black text-green-600">{stats.checkedInCount}</div>
                  <div className="text-xs text-gray-700 font-bold">הגיעו</div>
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50/30 rounded-lg border border-purple-200/50 text-center">
                <div className="flex flex-col items-center gap-1">
                  <div className="text-2xl font-black text-purple-600">
                    {stats.checkInPercentage}%
                  </div>
                  <div className="text-xs text-gray-700 font-bold">אחוז הגעה</div>
                </div>
              </div>
            </div>
          )}

          {/* CTA Button - Premium Style */}
          <button
            onClick={onNavigateToCheckIn}
            className="w-full flex items-center justify-center gap-2.5 px-6 py-4
                     bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600
                     text-white rounded-xl font-bold text-sm
                     hover:from-green-700 hover:via-emerald-700 hover:to-teal-700
                     active:scale-[0.97] transition-all duration-200
                     shadow-lg shadow-green-500/30 hover:shadow-xl hover:shadow-emerald-500/40
                     focus:outline-none focus:ring-4 focus:ring-green-500/30
                     group/btn overflow-hidden relative"
          >
            {/* Shine effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

            <QrCode className="w-5 h-5 relative" />
            <span className="relative">פתח מסך כניסה ונוכחות</span>
            <ArrowLeft className="w-4 h-4 relative group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  )
}
