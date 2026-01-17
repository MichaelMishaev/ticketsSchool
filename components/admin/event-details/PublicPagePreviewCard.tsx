'use client'

import { useMemo } from 'react'
import { Calendar, Clock, Link2 } from 'lucide-react'

interface PublicPagePreviewCardProps {
  eventStartAt: Date
  confirmedCount: number
  waitlistCount: number
  cancelledCount: number
}

export default function PublicPagePreviewCard({
  eventStartAt,
  confirmedCount,
  waitlistCount,
  cancelledCount,
}: PublicPagePreviewCardProps) {
  // Calculate days until event
  const { daysUntil, formattedDate, isToday, isPast } = useMemo(() => {
    const now = new Date()
    const eventDate = new Date(eventStartAt)

    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const targetDate = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate())

    const diffTime = targetDate.getTime() - nowDate.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const formatted = new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(eventDate)

    return {
      daysUntil: diffDays,
      formattedDate: formatted,
      isToday: diffDays === 0,
      isPast: diffDays < 0,
    }
  }, [eventStartAt])

  const getCountdownMessage = () => {
    if (isPast) return 'האירוע הסתיים'
    if (isToday) return 'האירוע היום!'
    if (daysUntil === 1) return 'האירוע מתחיל מחר'
    return `האירוע מתחיל בעוד ${daysUntil} ימים`
  }

  const getSecondaryMessage = () => {
    if (isPast) return 'צפה בסיכום האירוע'
    if (isToday) return 'עמוד הכניסה פתוח עכשיו'
    return 'עמוד הכניסה יפתח ביום האירוע'
  }

  return (
    <div className="w-full" dir="rtl">
      {/* Simple Card - No phone frame to avoid overflow issues */}
      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Top accent */}
        <div className="h-1 bg-gradient-to-l from-blue-500 via-purple-500 to-pink-500" />

        {/* Badge */}
        <div className="absolute top-3 right-4">
          <span className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-full">
            תצוגה מקדימה
          </span>
        </div>

        {/* Content */}
        <div className="p-6 pt-10">
          {/* Calendar Icon */}
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center shadow-sm">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          {/* Countdown */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-1">
            {getCountdownMessage()}
          </h3>

          <p className="text-sm text-gray-500 text-center mb-4">
            {getSecondaryMessage()}
          </p>

          {/* Date Badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">{formattedDate}</span>
            </div>
          </div>

          {/* Stats - Simple flexbox instead of grid */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 bg-gray-50 rounded-lg p-3 text-center border border-gray-200">
              <p className="text-[10px] font-medium text-gray-500 mb-0.5">ביטולים</p>
              <p className="text-xl font-bold text-gray-600">{cancelledCount}</p>
            </div>
            <div className="flex-1 bg-amber-50 rounded-lg p-3 text-center border border-amber-200">
              <p className="text-[10px] font-medium text-amber-600 mb-0.5">המתנה</p>
              <p className="text-xl font-bold text-amber-600">{waitlistCount}</p>
            </div>
            <div className="flex-1 bg-green-50 rounded-lg p-3 text-center border border-green-200">
              <p className="text-[10px] font-medium text-green-600 mb-0.5">מאושרים</p>
              <p className="text-xl font-bold text-green-600">{confirmedCount}</p>
            </div>
          </div>

          {/* Check-in URL info */}
          <div className="bg-purple-50 rounded-lg p-3 border border-purple-100">
            <div className="flex items-center gap-2">
              <Link2 className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
              <p className="text-[11px] text-gray-600">
                בקישור זה ניתן לאשר הגעה ולסמן נוכחות משתתפים
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
