'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Share2,
  Copy,
  ExternalLink,
  Edit,
  Copy as CopyIcon,
  Trash2,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CreditCard,
  User,
} from 'lucide-react'

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
  const [copiedLink, setCopiedLink] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(false)

  // Generate public registration URL
  const publicUrl = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/p/${event.school.slug}/${event.slug}`

  // Calculate stats from actual registrations
  const registrations = event.registrations || []
  const confirmedRegistrations = registrations.filter(r => r.status === 'CONFIRMED')
  const waitlistRegistrations = registrations.filter(r => r.status === 'WAITLIST')

  const confirmedCount = confirmedRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const waitlistCount = waitlistRegistrations.reduce((sum, reg) => sum + (reg.spotsCount || 0), 0)
  const totalCapacity = event.totalCapacity || event.capacity
  const availableSpots = Math.max(0, totalCapacity - confirmedCount)
  const capacityPercent = Math.min(100, (confirmedCount / totalCapacity) * 100)

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Share via Web Share API (mobile)
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `הרשם לאירוע: ${event.title}`,
          url: publicUrl,
        })
      } catch (error) {
        // User cancelled or share failed
        console.log('Share cancelled or failed')
      }
    } else {
      // Fallback to copy
      handleCopyLink()
    }
  }

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
  const recentRegistrations = registrations
    .filter(r => r.status !== 'CANCELLED')
    .slice(0, 5)

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
      {/* Event Details Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">{event.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(event.status)}`}>
                {getStatusLabel(event.status)}
              </span>
            </div>

            {event.gameType && (
              <p className="text-sm text-gray-500 mb-3">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  {event.gameType}
                </span>
              </p>
            )}
          </div>
        </div>

        {/* Event meta info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-700">תאריך ושעה</p>
              <p className="text-sm text-gray-900">{formatDate(event.startAt)}</p>
              {event.endAt && (
                <p className="text-xs text-gray-500">עד: {formatDate(event.endAt)}</p>
              )}
            </div>
          </div>

          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">מיקום</p>
                <p className="text-sm text-gray-900">{event.location}</p>
              </div>
            </div>
          )}
        </div>

        {event.description && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
          </div>
        )}

        {/* Payment Indicator */}
        {event.paymentRequired && (
          <div className="mb-4 pb-4 border-b border-gray-100">
            <div className="flex items-start gap-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border-2 border-green-200">
              <CreditCard className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-bold text-green-800">אירוע בתשלום</p>
                  {event.priceAmount && (
                    <span className="text-lg font-bold text-green-900">₪{event.priceAmount}</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  {event.pricingModel === 'FIXED_PRICE' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      מחיר קבוע
                    </span>
                  )}
                  {event.pricingModel === 'PER_GUEST' && (
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                      מחיר למשתתף
                    </span>
                  )}
                  {event.paymentTiming === 'UPFRONT' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      💳 תשלום מראש
                    </span>
                  )}
                  {event.paymentTiming === 'POST_REGISTRATION' && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                      📧 תשלום לאחר הרשמה
                    </span>
                  )}
                  {event.paymentTiming === 'OPTIONAL' && (
                    <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full font-medium">
                      אופציונלי
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick stats - Clickable Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Confirmed Registrations Card */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
                // Add small delay to ensure tab switches before filter applies
                setTimeout(() => {
                  const filterEvent = new CustomEvent('filterRegistrations', {
                    detail: { status: 'CONFIRMED' }
                  })
                  window.dispatchEvent(filterEvent)
                }, 100)
              }
            }}
            className="text-center p-3 bg-green-50 rounded-lg border-2 border-green-100
                     cursor-pointer transition-all duration-300 ease-out
                     hover:bg-green-100 hover:border-green-300 hover:shadow-lg hover:-translate-y-1
                     active:scale-95 focus:outline-none focus:ring-4 focus:ring-green-500/30
                     group"
            aria-label="הצג רשומים מאושרים"
          >
            <p className="text-2xl font-bold text-green-600 group-hover:text-green-700 transition-colors">
              {confirmedCount}
            </p>
            <p className="text-xs text-green-700 font-medium group-hover:text-green-800 transition-colors">
              מאושרים
            </p>
          </button>

          {/* Waitlist Card */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
                setTimeout(() => {
                  const filterEvent = new CustomEvent('filterRegistrations', {
                    detail: { status: 'WAITLIST' }
                  })
                  window.dispatchEvent(filterEvent)
                }, 100)
              }
            }}
            className="text-center p-3 bg-amber-50 rounded-lg border-2 border-amber-100
                     cursor-pointer transition-all duration-300 ease-out
                     hover:bg-amber-100 hover:border-amber-300 hover:shadow-lg hover:-translate-y-1
                     active:scale-95 focus:outline-none focus:ring-4 focus:ring-amber-500/30
                     group"
            aria-label="הצג רשימת המתנה"
          >
            <p className="text-2xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
              {waitlistCount}
            </p>
            <p className="text-xs text-amber-700 font-medium group-hover:text-amber-800 transition-colors">
              רשימת המתנה
            </p>
          </button>

          {/* Available Spots Card */}
          <button
            onClick={() => {
              if (onTabChange) {
                onTabChange('registrations')
              }
            }}
            className="text-center p-3 bg-blue-50 rounded-lg border-2 border-blue-100
                     cursor-pointer transition-all duration-300 ease-out
                     hover:bg-blue-100 hover:border-blue-300 hover:shadow-lg hover:-translate-y-1
                     active:scale-95 focus:outline-none focus:ring-4 focus:ring-blue-500/30
                     group"
            aria-label="עבור לרשימת משתתפים"
          >
            <p className="text-2xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
              {availableSpots}
            </p>
            <p className="text-xs text-blue-700 font-medium group-hover:text-blue-800 transition-colors">
              מקומות פנויים
            </p>
          </button>
        </div>

        {/* Capacity bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="font-medium text-gray-700">תפוסה</span>
            <span className="text-gray-600">{confirmedCount} / {totalCapacity}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                capacityPercent >= 90
                  ? 'bg-red-500'
                  : capacityPercent >= 75
                  ? 'bg-amber-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* PRIMARY CTA: Share Event */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">שתף את האירוע</h2>
            <p className="text-blue-100 text-sm">קישור ישיר להרשמה</p>
          </div>
        </div>

        {/* URL display */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
          <p className="text-sm text-blue-100 mb-2">קישור להרשמה:</p>
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
            <code className="text-sm font-mono flex-1 truncate text-white">{publicUrl}</code>
            <button
              onClick={handleCopyLink}
              className="p-2 hover:bg-white/20 rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="העתק קישור"
            >
              {copiedLink ? (
                <CheckCircle2 className="w-5 h-5 text-green-200" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
          >
            <CopyIcon className="w-5 h-5" />
            <span>העתק קישור</span>
          </button>

          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={handleShare}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30 focus:outline-none focus:ring-4 focus:ring-white/50"
            >
              <Share2 className="w-5 h-5" />
              <span>שתף</span>
            </button>
          )}

          <button
            onClick={() => window.open(publicUrl, '_blank')}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white/20 backdrop-blur-sm text-white rounded-lg font-semibold hover:bg-white/30 transition-colors border border-white/30 focus:outline-none focus:ring-4 focus:ring-white/50"
          >
            <ExternalLink className="w-5 h-5" />
            <span>תצוגה מקדימה</span>
          </button>
        </div>

        {copiedLink && (
          <div className="mt-3 flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-lg px-4 py-2">
            <CheckCircle2 className="w-5 h-5 text-green-200" />
            <span className="text-sm font-medium">הקישור הועתק ללוח!</span>
          </div>
        )}
      </div>

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
                          {registration.spotsCount} {registration.spotsCount === 1 ? 'משתתף' : 'משתתפים'}
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
  )
}
