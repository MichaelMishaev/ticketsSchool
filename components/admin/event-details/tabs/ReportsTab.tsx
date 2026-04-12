'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Download,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
} from 'lucide-react'
import { format, differenceInDays } from 'date-fns'

interface ReportsTabProps {
  eventId: string
}

interface Registration {
  id: string
  status: string
  createdAt: Date
  spotsCount: number
  data: Record<string, any>
}

interface Event {
  title: string
  startAt: Date
  capacity: number
  spotsReserved: number
  registrations: Registration[]
}

export default function ReportsTab({ eventId }: ReportsTabProps) {
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  useEffect(() => {
    fetchEventData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const fetchEventData = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}`)
      if (response.ok) {
        const data = await response.json()
        setEvent(data)
      }
    } catch (error) {
      console.error('Error fetching event:', error)
    } finally {
      setLoading(false)
    }
  }

  // Calculate metrics
  const metrics = useMemo(() => {
    if (!event) return null

    const registrations = event.registrations || []
    const confirmed = registrations.filter((r) => r.status === 'CONFIRMED')
    const waitlist = registrations.filter((r) => r.status === 'WAITLIST')
    const cancelled = registrations.filter((r) => r.status === 'CANCELLED')

    // Calculate actual spots from registrations
    const spotsConfirmed = confirmed.reduce((sum, r) => sum + r.spotsCount, 0)
    const spotsWaitlist = waitlist.reduce((sum, r) => sum + r.spotsCount, 0)

    // Conversion rate: confirmed / total registrations
    const conversionRate =
      registrations.length > 0 ? Math.round((confirmed.length / registrations.length) * 100) : 0

    // Average registration time (days before event)
    const avgDaysBeforeEvent =
      confirmed.length > 0
        ? Math.round(
            confirmed.reduce((sum, r) => {
              const daysBeforeEvent = differenceInDays(
                new Date(event.startAt),
                new Date(r.createdAt)
              )
              return sum + daysBeforeEvent
            }, 0) / confirmed.length
          )
        : 0

    // Cancellation rate
    const cancellationRate =
      registrations.length > 0 ? Math.round((cancelled.length / registrations.length) * 100) : 0

    // Capacity fill rate (use actual confirmed spots, not database spotsReserved)
    const fillRate = Math.round((spotsConfirmed / event.capacity) * 100)

    // Total spots registered (including waitlist)
    const totalSpotsRegistered = registrations.reduce((sum, r) => sum + r.spotsCount, 0)

    // Available spots (use actual confirmed spots)
    const availableSpots = Math.max(0, event.capacity - spotsConfirmed)

    return {
      totalRegistrations: registrations.length,
      confirmedCount: confirmed.length,
      waitlistCount: waitlist.length,
      cancelledCount: cancelled.length,
      conversionRate,
      avgDaysBeforeEvent,
      cancellationRate,
      fillRate,
      totalSpotsRegistered,
      spotsConfirmed,
      spotsWaitlist,
      availableSpots,
    }
  }, [event])

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${event?.title || 'event'}_registrations_${format(new Date(), 'yyyy-MM-dd')}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        setShowSuccessToast(true)
        setTimeout(() => setShowSuccessToast(false), 3000)
      }
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const handleExportSummary = () => {
    if (!event || !metrics) return

    const summary = `
דוח סיכום אירוע - ${event.title}
תאריך: ${format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
נוצר: ${format(new Date(), 'dd/MM/yyyy HH:mm')}

סטטיסטיקות כלליות:
- סה"כ הרשמות: ${metrics.totalRegistrations}
- מאושרים: ${metrics.confirmedCount} (${metrics.conversionRate}%)
- רשימת המתנה: ${metrics.waitlistCount}
- בוטלו: ${metrics.cancelledCount}

תפוסה:
- קיבולת: ${event.capacity} מקומות
- מקומות תפוסים: ${metrics.spotsConfirmed} (${metrics.fillRate}%)
- מקומות פנויים: ${metrics.availableSpots}
- סה"כ מקומות בהרשמות: ${metrics.totalSpotsRegistered}

מדדי ביצועים:
- שיעור המרה: ${metrics.conversionRate}%
- שיעור ביטולים: ${metrics.cancellationRate}%
- זמן ממוצע להרשמה: ${metrics.avgDaysBeforeEvent} ימים לפני האירוע
    `.trim()

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.title}_summary_${format(new Date(), 'yyyy-MM-dd')}.txt`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  if (loading || !event || !metrics) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-44 md:pb-6" dir="rtl">
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">טוען נתונים...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-44 md:pb-6" dir="rtl">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-40 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">הקובץ יוצא בהצלחה</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">דוחות וסטטיסטיקות</h2>
          <p className="text-sm text-gray-600 mt-1">ניתוח מפורט ויצוא נתונים</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportSummary}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">סיכום</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors focus:outline-none focus:ring-4 focus:ring-green-500/20"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ייצוא CSV</span>
          </button>
        </div>
      </div>

      {/* Key Metrics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Conversion Rate */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-green-700">{metrics.conversionRate}%</span>
          </div>
          <h3 className="text-sm font-semibold text-green-900 mb-1">שיעור המרה</h3>
          <p className="text-xs text-green-700">
            {metrics.confirmedCount} מאושרים מתוך {metrics.totalRegistrations} הרשמות
          </p>
        </div>

        {/* Average Registration Time */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-blue-700">{metrics.avgDaysBeforeEvent}</span>
          </div>
          <h3 className="text-sm font-semibold text-blue-900 mb-1">זמן ממוצע להרשמה</h3>
          <p className="text-xs text-blue-700">ימים לפני האירוע</p>
        </div>

        {/* Capacity Fill Rate */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <span className="text-3xl font-bold text-purple-700">{metrics.fillRate}%</span>
          </div>
          <h3 className="text-sm font-semibold text-purple-900 mb-1">תפוסה</h3>
          <p className="text-xs text-purple-700">
            {metrics.spotsConfirmed} מתוך {event.capacity} מקומות
          </p>
        </div>
      </div>

      {/* Registration Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">פילוח הרשמות</h3>

        <div className="space-y-4">
          {/* Confirmed */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-900">מאושרים</span>
              </div>
              <span className="text-lg font-bold text-green-600">{metrics.confirmedCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${metrics.totalRegistrations > 0 ? (metrics.confirmedCount / metrics.totalRegistrations) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">{metrics.spotsConfirmed} מקומות</p>
          </div>

          {/* Waitlist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-600" />
                <span className="font-medium text-gray-900">רשימת המתנה</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{metrics.waitlistCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-amber-500"
                style={{
                  width: `${metrics.totalRegistrations > 0 ? (metrics.waitlistCount / metrics.totalRegistrations) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">{metrics.spotsWaitlist} מקומות</p>
          </div>

          {/* Cancelled */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="font-medium text-gray-900">בוטלו</span>
              </div>
              <span className="text-lg font-bold text-red-600">{metrics.cancelledCount}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-red-500"
                style={{
                  width: `${metrics.totalRegistrations > 0 ? (metrics.cancelledCount / metrics.totalRegistrations) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-600 mt-1">שיעור ביטולים: {metrics.cancellationRate}%</p>
          </div>
        </div>
      </div>

      {/* Additional Insights */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">תובנות נוספות</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">סה"כ מקומות בהרשמות</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.totalSpotsRegistered}</p>
            <p className="text-xs text-gray-500 mt-1">כולל רשימת המתנה</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">ביקוש עודף</p>
            <p className="text-2xl font-bold text-gray-900">
              {Math.max(0, metrics.totalSpotsRegistered - event.capacity)}
            </p>
            <p className="text-xs text-gray-500 mt-1">מקומות מעבר לקיבולת</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">ממוצע מקומות להרשמה</p>
            <p className="text-2xl font-bold text-gray-900">
              {metrics.totalRegistrations > 0
                ? (metrics.totalSpotsRegistered / metrics.totalRegistrations).toFixed(1)
                : '0.0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">מקומות ממוצעים</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">מקומות פנויים</p>
            <p className="text-2xl font-bold text-gray-900">{metrics.availableSpots}</p>
            <p className="text-xs text-gray-500 mt-1">זמינים להרשמה</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translate(-50%, 20px);
            opacity: 0;
          }
          to {
            transform: translate(-50%, 0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
