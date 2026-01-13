'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  User,
} from 'lucide-react'
import CheckInHeroCard from '@/components/admin/event-details/CheckInHeroCard'
import EventHeroHeader from '@/components/admin/event-details/EventHeroHeader'

interface Registration {
  id: string
  data: Record<string, unknown>
  phoneNumber: string
  spotsCount: number
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED'
  confirmationCode: string
  createdAt: string | Date
}

interface Event {
  id: string
  title: string
  description: string | null
  gameType: string | null
  location: string | null
  startAt: Date
  endAt: Date | null
  capacity: number
  status: 'OPEN' | 'PAUSED' | 'CLOSED'
  school: {
    slug: string
  }
  slug: string
  _count?: {
    registrations: number
  }
  spotsReserved: number
  totalCapacity?: number
  totalSpotsTaken?: number
  registrations?: Registration[]
  paymentRequired?: boolean
  paymentTiming?: 'OPTIONAL' | 'UPFRONT' | 'POST_REGISTRATION'
  pricingModel?: 'FREE' | 'FIXED_PRICE' | 'PER_GUEST'
  priceAmount?: number
  currency?: string
}

interface OverviewTabProps {
  event: Event
  onEventUpdate: () => void
  onTabChange?: (tab: string) => void
}

export default function OverviewTab({ event, onEventUpdate, onTabChange }: OverviewTabProps) {
  const router = useRouter()
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Calculate stats from actual registrations
  const registrations = event.registrations || []
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED')
  const waitlistRegistrations = registrations.filter((r) => r.status === 'WAITLIST')

  const confirmedCount = confirmedRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const waitlistCount = waitlistRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const totalCapacity = event.totalCapacity || event.capacity
  const availableSpots = Math.max(0, totalCapacity - confirmedCount)
  const capacityPercent = Math.min(100, (confirmedCount / totalCapacity) * 100)

  // Status badge styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'PAUSED':
        return 'bg-amber-100 text-amber-800 border-amber-200'
      case 'CLOSED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'פעיל'
      case 'PAUSED':
        return 'מושהה'
      case 'CLOSED':
        return 'סגור'
      default:
        return status
    }
  }

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date))
  }

  // Format relative time (e.g., "לפני 2 שעות", "לפני 3 ימים")
  const formatRelativeTime = (date: Date | string) => {
    const now = new Date()
    const then = new Date(date)
    const diffMs = now.getTime() - then.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'עכשיו'
    if (diffMins < 60) return `לפני ${diffMins} דקות`
    if (diffHours < 24) return `לפני ${diffHours} שעות`
    if (diffDays < 7) return `לפני ${diffDays} ימים`

    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(then)
  }

  // Get participant name from registration data
  const getParticipantName = (registration: Registration): string => {
    const data = registration.data
    // Try common field names for participant name
    const nameFields = ['fullName', 'name', 'שם מלא', 'שם']
    for (const field of nameFields) {
      if (data[field] && typeof data[field] === 'string') {
        return data[field] as string
      }
    }
    // Fallback to phone number if name not found
    return registration.phoneNumber
  }

  // Get recent registrations (latest 5, excluding cancelled)
  const recentRegistrations = registrations.filter((r) => r.status !== 'CANCELLED').slice(0, 5)

  return (
    <>
      {/* Hero Header - Event Title + Sharing (MOST IMPORTANT) */}
      <EventHeroHeader event={event} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6" dir="rtl">
        {/* Event Info Card - Compact with Decorative Pattern */}
        <div className="relative bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Decorative SVG Pattern Background */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern
                  id="event-pattern"
                  x="0"
                  y="0"
                  width="40"
                  height="40"
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx="20" cy="20" r="1.5" fill="currentColor" className="text-blue-600" />
                  <circle cx="0" cy="0" r="1" fill="currentColor" className="text-purple-600" />
                  <circle cx="40" cy="40" r="1" fill="currentColor" className="text-purple-600" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#event-pattern)" />
            </svg>
          </div>

          {/* Gradient Accent - Top Right Corner */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent rounded-bl-[100px] pointer-events-none"></div>

          {/* Event Meta */}
          <div className="relative p-5 pb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-bold text-gray-500 mb-0.5">תאריך ושעה</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(event.startAt)}</p>
                  {event.endAt && (
                    <p className="text-xs text-gray-500 mt-0.5">עד: {formatDate(event.endAt)}</p>
                  )}
                </div>
              </div>

              {event.location && (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-500 mb-0.5">מיקום</p>
                    <p className="text-sm font-semibold text-gray-900">{event.location}</p>
                  </div>
                </div>
              )}
            </div>

            {event.gameType && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-semibold">
                  {event.gameType}
                </span>
              </div>
            )}

            {event.description && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}
          </div>

          {/* Payment Indicator - Prominent */}
          {event.paymentRequired && (
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-t-2 border-green-200 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <CreditCard className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-green-900">אירוע בתשלום</p>
                    {event.priceAmount && (
                      <span className="text-xl font-black text-green-700">
                        ₪{event.priceAmount}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs font-medium text-green-700">
                    {event.pricingModel === 'FIXED_PRICE' && (
                      <span className="px-2 py-0.5 bg-white/60 rounded">מחיר קבוע</span>
                    )}
                    {event.pricingModel === 'PER_GUEST' && (
                      <span className="px-2 py-0.5 bg-white/60 rounded">מחיר למשתתף</span>
                    )}
                    {event.paymentTiming === 'UPFRONT' && (
                      <span className="px-2 py-0.5 bg-white/60 rounded">תשלום מראש</span>
                    )}
                    {event.paymentTiming === 'POST_REGISTRATION' && (
                      <span className="px-2 py-0.5 bg-white/60 rounded">תשלום לאחר הרשמה</span>
                    )}
                    {event.paymentTiming === 'OPTIONAL' && (
                      <span className="px-2 py-0.5 bg-white/60 rounded">אופציונלי</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick stats - Clickable Cards - 2026 Premium Design with Proper RTL */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* CONFIRMED Card - Primary (Rightmost in RTL) */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
                setTimeout(() => {
                  const filterEvent = new CustomEvent('filterRegistrations', {
                    detail: { status: 'CONFIRMED' },
                  })
                  window.dispatchEvent(filterEvent)
                }, 100)
              }
            }}
            className="relative overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 text-center
                     border-2 border-green-200 shadow-md shadow-green-500/10
                     hover:shadow-lg hover:shadow-green-500/20 hover:scale-[1.01]
                     active:scale-[0.99] transition-all duration-200
                     focus:outline-none focus:ring-3 focus:ring-green-500/30
                     cursor-pointer group"
            aria-label="הצג רשומים מאושרים"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-green-500 via-emerald-500 to-green-600"></div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <p className="text-sm font-semibold text-green-800">משתתפים מאושרים</p>
            </div>

            <p className="text-3xl font-bold text-green-700 mb-3 group-hover:scale-105 transition-transform duration-300">
              {confirmedCount}
            </p>

            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-green-600/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-green-700">פעיל</span>
            </div>
          </button>

          {/* WAITLIST Card - Secondary (Center in RTL) */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
                setTimeout(() => {
                  const filterEvent = new CustomEvent('filterRegistrations', {
                    detail: { status: 'WAITLIST' },
                  })
                  window.dispatchEvent(filterEvent)
                }, 100)
              }
            }}
            className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-5 text-center
                     border-2 border-amber-200 shadow-md shadow-amber-500/10
                     hover:shadow-lg hover:shadow-amber-500/20 hover:scale-[1.01]
                     active:scale-[0.99] transition-all duration-200
                     focus:outline-none focus:ring-3 focus:ring-amber-500/30
                     cursor-pointer group"
            aria-label="הצג רשימת המתנה"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-amber-500 via-orange-500 to-amber-600"></div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">רשימת המתנה</p>
            </div>

            <p className="text-3xl font-bold text-amber-700 mb-3 group-hover:scale-105 transition-transform duration-300">
              {waitlistCount}
            </p>

            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-amber-600/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-xs font-semibold text-amber-700">ממתין</span>
            </div>
          </button>

          {/* AVAILABLE Card - Tertiary (Leftmost in RTL) */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
              }
            }}
            className="relative overflow-hidden bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-5 text-center
                     border-2 border-blue-200 shadow-md shadow-blue-500/10
                     hover:shadow-lg hover:shadow-blue-500/20 hover:scale-[1.01]
                     active:scale-[0.99] transition-all duration-200
                     focus:outline-none focus:ring-3 focus:ring-blue-500/30
                     cursor-pointer group"
            aria-label="עבור לרשימת משתתפים"
          >
            {/* Gradient accent bar */}
            <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-l from-blue-500 via-cyan-500 to-blue-600"></div>

            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">מקומות פנויים</p>
            </div>

            <p className="text-3xl font-bold text-blue-700 mb-3 group-hover:scale-105 transition-transform duration-300">
              {availableSpots}
            </p>

            <div className="flex items-center justify-center gap-1.5 px-2.5 py-1 bg-blue-600/10 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              <span className="text-xs font-semibold text-blue-700">זמין</span>
            </div>
          </button>
        </div>

        {/* Capacity Progress - Modern Design */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 mt-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg ${
                  capacityPercent >= 90
                    ? 'bg-red-100'
                    : capacityPercent >= 75
                      ? 'bg-amber-100'
                      : 'bg-green-100'
                }`}
              >
                <AlertCircle
                  className={`w-4 h-4 ${
                    capacityPercent >= 90
                      ? 'text-red-600'
                      : capacityPercent >= 75
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                />
              </div>
              <span className="text-sm font-bold text-gray-700">תפוסת אירוע</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{confirmedCount}</span>
              <span className="text-sm text-gray-500">/ {totalCapacity}</span>
            </div>
          </div>
          <div className="relative w-full bg-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 shadow-sm ${
                capacityPercent >= 90
                  ? 'bg-gradient-to-l from-red-500 to-rose-600'
                  : capacityPercent >= 75
                    ? 'bg-gradient-to-l from-amber-500 to-orange-600'
                    : 'bg-gradient-to-l from-green-500 to-emerald-600'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            {capacityPercent.toFixed(0)}% תפוסה
          </p>
        </div>
      </div>

      {/* Check-In Hero Card - Discoverable but secondary to sharing */}
      <CheckInHeroCard
        eventId={event.id}
        eventStartAt={event.startAt}
        eventEndAt={event.endAt}
        onNavigateToCheckIn={() => {
          if (onTabChange) {
            onTabChange('checkin')
          }
        }}
        onNavigateToReports={() => {
          if (onTabChange) {
            onTabChange('reports')
          }
        }}
      />

      {/* Quick Actions (Collapsible) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <button
          onClick={() => setShowQuickActions(!showQuickActions)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20"
        >
          <span className="font-semibold text-gray-900">פעולות מהירות</span>
          {showQuickActions ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </button>

        {showQuickActions && (
          <div className="px-6 pb-6 space-y-3 border-t border-gray-100 pt-4">
            <button
              onClick={() => router.push(`/admin/events/${event.id}/edit`)}
              className="w-full flex items-center gap-3 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            >
              <Edit className="w-5 h-5" />
              <span>ערוך פרטי אירוע</span>
            </button>

            {confirmedCount === 0 && (
              <button
                onClick={() => {
                  if (confirm('האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו לא ניתנת לביטול.')) {
                    // Handle delete
                  }
                }}
                className="w-full flex items-center gap-3 px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20"
              >
                <Trash2 className="w-5 h-5" />
                <span>מחק אירוע</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-400" />
          פעילות אחרונה
        </h3>

        <div className="space-y-3">
          {recentRegistrations.length === 0 ? (
            /* Empty state - No registrations yet */
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">טרם נרשמו משתתפים</p>
              <p className="text-xs text-gray-400 mt-1">פעילות אחרונה תוצג כאן</p>
            </div>
          ) : (
            /* Show recent registrations */
            <>
              {recentRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* User icon */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      registration.status === 'CONFIRMED'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-amber-100 text-amber-600'
                    }`}
                  >
                    <User className="w-5 h-5" />
                  </div>

                  {/* Registration details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {getParticipantName(registration)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {registration.spotsCount}{' '}
                          {registration.spotsCount === 1 ? 'משתתף' : 'משתתפים'}
                          {' • '}
                          <span
                            className={
                              registration.status === 'CONFIRMED'
                                ? 'text-green-600 font-medium'
                                : 'text-amber-600 font-medium'
                            }
                          >
                            {registration.status === 'CONFIRMED' ? 'מאושר' : 'ברשימת המתנה'}
                          </span>
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {formatRelativeTime(registration.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Show more link if there are more registrations */}
              {registrations.length > 5 && (
                <button
                  onClick={() => onTabChange && onTabChange('registrations')}
                  className="w-full text-center py-2 text-sm text-blue-600 hover:text-blue-700 font-medium hover:bg-blue-50 rounded-lg transition-colors"
                >
                  הצג את כל {registrations.length} ההרשמות
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </>
  )
}
