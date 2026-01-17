'use client'

import { useRouter } from 'next/navigation'
import {
  Edit,
  Trash2,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  CreditCard,
  User,
} from 'lucide-react'
import CheckInHeroCard from '@/components/admin/event-details/CheckInHeroCard'
import CheckInShareCard from '@/components/admin/event-details/CheckInShareCard'
import RegistrationShareCard from '@/components/admin/event-details/RegistrationShareCard'
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

  // Calculate stats from actual registrations
  const registrations = event.registrations || []
  const confirmedRegistrations = registrations.filter((r) => r.status === 'CONFIRMED')
  const waitlistRegistrations = registrations.filter((r) => r.status === 'WAITLIST')
  const cancelledRegistrations = registrations.filter((r) => r.status === 'CANCELLED')

  const confirmedCount = confirmedRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const waitlistCount = waitlistRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const cancelledCount = cancelledRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
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
      {/* Hero Header - Event Title + Status */}
      <EventHeroHeader event={event} />

      <div
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-44 md:pb-6 space-y-6 overflow-x-hidden"
        dir="rtl"
      >
        {/* LAYER 2: Event Details - When & Where (CONTEXT FIRST) */}
        {/* Event Info Card - Clean, Minimal Design */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          {/* Event Meta */}
          <div className="p-5 pb-4">
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

          {/* Payment Indicator - Clean Design */}
          {event.paymentRequired && (
            <div className="bg-green-50 border-t border-green-100 p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white rounded-lg border border-green-200">
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
                      <span className="px-2 py-0.5 bg-white border border-green-200 rounded">
                        מחיר קבוע
                      </span>
                    )}
                    {event.pricingModel === 'PER_GUEST' && (
                      <span className="px-2 py-0.5 bg-white border border-green-200 rounded">
                        מחיר למשתתף
                      </span>
                    )}
                    {event.paymentTiming === 'UPFRONT' && (
                      <span className="px-2 py-0.5 bg-white border border-green-200 rounded">
                        תשלום מראש
                      </span>
                    )}
                    {event.paymentTiming === 'POST_REGISTRATION' && (
                      <span className="px-2 py-0.5 bg-white border border-green-200 rounded">
                        תשלום לאחר הרשמה
                      </span>
                    )}
                    {event.paymentTiming === 'OPTIONAL' && (
                      <span className="px-2 py-0.5 bg-white border border-green-200 rounded">
                        אופציונלי
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Registration Share Card - Share to get attendees */}
        <RegistrationShareCard
          eventSlug={event.slug}
          schoolSlug={event.school.slug}
          eventTitle={event.title}
        />

        {/* Check-In Share Card - Share with gate person */}
        <CheckInShareCard eventId={event.id} eventTitle={event.title} />

        {/* Edit Button - Secondary action, minimal visual weight */}
        <div className="flex justify-end -mt-2">
          <button
            onClick={() => router.push(`/admin/events/${event.id}/edit`)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <Edit className="w-4 h-4" />
            <span>ערוך אירוע</span>
          </button>
        </div>

        {/* LAYER 3: Capacity Status - How Full? */}
        {/* Unified Capacity Widget - Progress Bar + Interactive Stats */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          {/* Header with Count */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-gray-900">תפוסת אירוע</h3>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-gray-900">{confirmedCount}</span>
              <span className="text-sm text-gray-500">/ {totalCapacity}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full bg-gray-100 rounded-full h-3 overflow-hidden mb-4">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityPercent >= 90
                  ? 'bg-red-500'
                  : capacityPercent >= 75
                    ? 'bg-amber-500'
                    : 'bg-green-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mb-5 text-center">
            {capacityPercent.toFixed(0)}% תפוסה
          </p>

          {/* Interactive Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            {/* CONFIRMED */}
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
              className="bg-green-50 border border-green-200 rounded-lg p-3 text-center
                       hover:bg-green-100 hover:border-green-300 hover:shadow-sm
                       active:scale-[0.98] transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-green-500/30"
              aria-label="הצג רשומים מאושרים"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <p className="text-xs font-semibold text-green-800">מאושרים</p>
              </div>
              <p className="text-2xl font-bold text-green-700">{confirmedCount}</p>
            </button>

            {/* WAITLIST */}
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
              className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center
                       hover:bg-amber-100 hover:border-amber-300 hover:shadow-sm
                       active:scale-[0.98] transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              aria-label="הצג רשימת המתנה"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Clock className="w-4 h-4 text-amber-600" />
                <p className="text-xs font-semibold text-amber-800">המתנה</p>
              </div>
              <p className="text-2xl font-bold text-amber-700">{waitlistCount}</p>
            </button>

            {/* AVAILABLE */}
            <button
              onClick={() => onTabChange && onTabChange('registrations')}
              className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center
                       hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm
                       active:scale-[0.98] transition-all duration-200
                       focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label="עבור לרשימת משתתפים"
            >
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <AlertCircle className="w-4 h-4 text-blue-600" />
                <p className="text-xs font-semibold text-blue-800">פנויים</p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{availableSpots}</p>
            </button>
          </div>
        </div>

        {/* Check-In Hero Card - Stats and access */}
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

        {/* Delete Action - Only show if no registrations */}
        {confirmedCount === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <button
              onClick={() => {
                if (confirm('האם אתה בטוח שברצונך למחוק את האירוע? פעולה זו לא ניתנת לביטול.')) {
                  // Handle delete
                }
              }}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-all focus:outline-none focus:ring-4 focus:ring-red-500/20"
            >
              <Trash2 className="w-5 h-5" />
              <span>מחק אירוע</span>
            </button>
          </div>
        )}

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
                            <span className="text-gray-500 font-normal"> נרשם/ה לאירוע</span>
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
      </div>
    </>
  )
}
