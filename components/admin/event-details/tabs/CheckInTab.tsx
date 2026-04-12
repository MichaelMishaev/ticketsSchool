'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Copy, Check, QrCode, Search, UserCheck, RefreshCw, Users, ListChecks, UserX } from 'lucide-react'

interface CheckInTabProps {
  eventId: string
  eventDate: Date
}

interface CheckInRecord {
  id: string
  checkedInAt: string
  checkedInBy: string | null
  undoneAt: string | null
  isLate?: boolean
  minutesLate?: number | null
}

interface Registration {
  id: string
  data: Record<string, unknown>
  spotsCount: number
  guestsCount: number
  status: 'CONFIRMED' | 'WAITLIST'
  confirmationCode: string
  phoneNumber: string
  qrCode: string | null
  checkIn: CheckInRecord | null
  createdAt: string
}

interface RecentActivity {
  registrationId: string
  name: string
  time: string
  isLate?: boolean
  minutesLate?: number | null
}

export default function CheckInTab({ eventId, eventDate }: CheckInTabProps) {
  const now = new Date()
  const eventDateObj = new Date(eventDate)
  const isEventDay = now.toDateString() === eventDateObj.toDateString()
  const isPastEvent = now > eventDateObj
  const daysUntilEvent = Math.ceil((eventDateObj.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  const [checkInLink, setCheckInLink] = useState<string | null>(null)
  const [checkInToken, setCheckInToken] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    confirmed: 0,
    checkedIn: 0,
    notCheckedIn: 0, // People confirmed but not yet arrived
    waitlist: 0,
    cancelled: 0,
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [isCheckingIn, setIsCheckingIn] = useState(false)

  // Fetch check-in link and stats
  useEffect(() => {
    fetchCheckInData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  // Auto-refresh stats on event day (every 5 seconds for live updates)
  useEffect(() => {
    if (!isEventDay || !checkInToken) return

    const interval = setInterval(async () => {
      try {
        // Fetch stats
        const statsResponse = await fetch(`/api/check-in/${eventId}/${checkInToken}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            confirmed: statsData.breakdown.confirmed,
            checkedIn: statsData.checkedIn,
            notCheckedIn: statsData.notCheckedIn,
            waitlist: statsData.breakdown.waitlist,
            cancelled: 0,
          })
        }

        // Fetch registrations to update recent activity
        const regResponse = await fetch(`/api/check-in/${eventId}/${checkInToken}`)
        if (regResponse.ok) {
          const regData = await regResponse.json()
          setRegistrations(regData.registrations || [])

          // Update recent activity feed
          const checkedIn = (regData.registrations || [])
            .filter((r: Registration) => r.checkIn && !r.checkIn.undoneAt)
            .map((r: Registration) => {
              const data = r.data as Record<string, unknown>
              const name = (data.name as string) || (data.childName as string) || 'אורח'
              return {
                registrationId: r.id,
                name,
                time: r.checkIn!.checkedInAt,
                isLate: r.checkIn!.isLate,
                minutesLate: r.checkIn!.minutesLate,
              }
            })
            .sort(
              (a: RecentActivity, b: RecentActivity) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
            )
            .slice(0, 10)

          setRecentActivity(checkedIn)
        }
      } catch (err) {
        console.error('Error refreshing data:', err)
      }
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [isEventDay, checkInToken, eventId])

  const fetchCheckInData = async () => {
    try {
      // Get check-in link from API
      const linkResponse = await fetch(`/api/events/${eventId}/check-in-link`)

      if (linkResponse.ok) {
        const linkData = await linkResponse.json()
        setCheckInLink(linkData.url)
        setCheckInToken(linkData.token)

        // Fetch live stats using the token
        const statsResponse = await fetch(`/api/check-in/${eventId}/${linkData.token}/stats`)
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats({
            confirmed: statsData.breakdown.confirmed,
            checkedIn: statsData.checkedIn,
            notCheckedIn: statsData.notCheckedIn,
            waitlist: statsData.breakdown.waitlist,
            cancelled: 0, // Stats API doesn't track cancelled
          })
        }

        // Fetch registrations for manual check-in
        const regResponse = await fetch(`/api/check-in/${eventId}/${linkData.token}`)
        if (regResponse.ok) {
          const regData = await regResponse.json()
          setRegistrations(regData.registrations || [])

          // Build recent activity feed from checked-in registrations
          const checkedIn = (regData.registrations || [])
            .filter((r: Registration) => r.checkIn && !r.checkIn.undoneAt)
            .map((r: Registration) => {
              const data = r.data as Record<string, unknown>
              const name = (data.name as string) || (data.childName as string) || 'אורח'
              return {
                registrationId: r.id,
                name,
                time: r.checkIn!.checkedInAt,
                isLate: r.checkIn!.isLate,
                minutesLate: r.checkIn!.minutesLate,
              }
            })
            .sort(
              (a: RecentActivity, b: RecentActivity) =>
                new Date(b.time).getTime() - new Date(a.time).getTime()
            )
            .slice(0, 10) // Show last 10 check-ins

          setRecentActivity(checkedIn)
        }
      }
    } catch (error) {
      console.error('Error fetching check-in data:', error)
    } finally {
      setLoading(false)
    }
  }

  const showSuccess = (message: string) => {
    setSuccessMessage(message)
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
  }

  const handleRefreshStats = async () => {
    if (!checkInToken) return

    try {
      const statsResponse = await fetch(`/api/check-in/${eventId}/${checkInToken}/stats`)
      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats({
          confirmed: statsData.breakdown.confirmed,
          checkedIn: statsData.checkedIn,
          notCheckedIn: statsData.notCheckedIn,
          waitlist: statsData.breakdown.waitlist,
          cancelled: 0,
        })
        showSuccess('הסטטיסטיקות עודכנו')
      }
    } catch (error) {
      console.error('Error refreshing stats:', error)
    }
  }

  const handleManualCheckIn = async (registrationId: string) => {
    if (!checkInToken || isCheckingIn) return

    setIsCheckingIn(true)
    try {
      const response = await fetch(`/api/check-in/${eventId}/${checkInToken}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registrationId,
          checkedInBy: 'manual',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('נוכחות נרשמה בהצלחה')
        // Refresh data to update stats and recent activity
        await fetchCheckInData()
        setSearchTerm('') // Clear search
      } else {
        showSuccess(data.error || 'שגיאה ברישום נוכחות')
      }
    } catch (error) {
      console.error('Error checking in:', error)
      showSuccess('שגיאה ברישום נוכחות')
    } finally {
      setIsCheckingIn(false)
    }
  }

  const handleUndoCheckIn = async (registrationId: string) => {
    if (!checkInToken || isCheckingIn) return

    setIsCheckingIn(true)
    try {
      const response = await fetch(`/api/check-in/${eventId}/${checkInToken}/${registrationId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          undoneBy: 'manual',
          undoneReason: 'ביטול ידני ממסך הכניסה',
        }),
      })

      const data = await response.json()

      if (response.ok) {
        showSuccess('נוכחות בוטלה בהצלחה')
        // Refresh data to update stats and recent activity
        await fetchCheckInData()
      } else {
        showSuccess(data.error || 'שגיאה בביטול נוכחות')
      }
    } catch (error) {
      console.error('Error undoing check-in:', error)
      showSuccess('שגיאה בביטול נוכחות')
    } finally {
      setIsCheckingIn(false)
    }
  }

  // Filter registrations based on search term
  const filteredRegistrations = registrations
    .filter((r) => {
      // If no search term, show all registrations
      if (!searchTerm.trim()) return true

      const data = r.data as Record<string, unknown>
      const name = ((data.name as string) || (data.childName as string) || '').toLowerCase()
      const phone = r.phoneNumber.toLowerCase()
      const code = r.confirmationCode.toLowerCase()
      const search = searchTerm.toLowerCase()

      return name.includes(search) || phone.includes(search) || code.includes(search)
    })
    .slice(0, 20) // Limit to 20 results

  const handleCopyLink = () => {
    if (checkInLink) {
      navigator.clipboard.writeText(checkInLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      showSuccess('קישור הכניסה הועתק ללוח')
    }
  }

  const checkedInPercent =
    stats.confirmed > 0 ? Math.round((stats.checkedIn / stats.confirmed) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-44 md:pb-6 overflow-x-hidden" dir="rtl">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-40 md:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
          <div className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3">
            <Check className="w-5 h-5" />
            <span className="font-medium">{successMessage}</span>
          </div>
        </div>
      )}

      {isPastEvent ? (
        // Past Event - Summary View
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">האירוע הסתיים</h2>
            <p className="text-gray-600 mb-6">ניתן לצפות בסטטיסטיקות הנוכחות בלשונית "דוחות"</p>

            {/* Final Stats */}
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">הגיעו</p>
                <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">אושרו</p>
                <p className="text-3xl font-bold text-gray-600">{stats.confirmed}</p>
              </div>
            </div>
          </div>
        </>
      ) : isEventDay ? (
        // Event Day - Full Check-In Interface
        <>
          {/* Check-In Link Card */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <QrCode className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">קישור כניסה לאירוע</h2>
                <p className="text-green-100 text-sm">שתף עם הגורם שמחלק את הכרטיסים</p>
              </div>
            </div>

            {/* URL display */}
            {checkInLink && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-4 border border-white/20">
                <p className="text-sm text-green-100 mb-2">קישור סריקה:</p>
                <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                  <code className="text-sm font-mono flex-1 truncate text-white">
                    {checkInLink}
                  </code>
                  <button
                    onClick={handleCopyLink}
                    className="p-2 hover:bg-white/20 rounded transition-colors flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-white/50"
                    aria-label="העתק קישור"
                  >
                    {copiedLink ? (
                      <Check className="w-5 h-5 text-green-200" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Action button */}
            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors focus:outline-none focus:ring-4 focus:ring-white/50"
            >
              <Copy className="w-5 h-5" />
              <span>העתק קישור</span>
            </button>
          </div>

          {/* Live Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">סטטיסטיקות בזמן אמת</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefreshStats}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  aria-label="רענן סטטיסטיקות"
                  title="רענן סטטיסטיקות"
                >
                  <RefreshCw className="w-4 h-4 text-gray-600 hover:text-gray-900" />
                </button>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                  <span>מתעדכן אוטומטית</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold text-gray-900">הגעה</span>
                <span className="text-2xl font-bold text-green-600">
                  {stats.checkedIn} / {stats.confirmed}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500 flex items-center justify-center"
                  style={{ width: `${checkedInPercent}%` }}
                >
                  {checkedInPercent > 10 && (
                    <span className="text-xs font-bold text-white">{checkedInPercent}%</span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4 w-full">
              <div className="text-center p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg min-w-0 overflow-hidden">
                <p className="text-xs sm:text-sm text-green-700 mb-1 truncate">הגיעו</p>
                <p className="text-2xl sm:text-3xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-amber-50 border border-amber-200 rounded-lg min-w-0 overflow-hidden">
                <p className="text-xs sm:text-sm text-amber-700 mb-1 truncate">ממתינים</p>
                <p className="text-2xl sm:text-3xl font-bold text-amber-600">{stats.notCheckedIn}</p>
              </div>
              <div className="text-center p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg min-w-0 overflow-hidden">
                <p className="text-xs sm:text-sm text-blue-700 mb-1 truncate">המתנה</p>
                <p className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.waitlist}</p>
              </div>
            </div>
          </div>

          {/* Manual Check-In */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">כניסה ידנית</h3>

            <div className="relative mb-4">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="חפש לפי שם, טלפון או קוד אישור..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pr-10 pl-4 py-3 border-2 border-gray-300 rounded-lg focus:border-green-500 focus:ring-4 focus:ring-green-500/20 transition-all"
              />
            </div>

            {filteredRegistrations.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto overflow-x-hidden">
                {filteredRegistrations.map((reg) => {
                  const data = reg.data as Record<string, unknown>
                  const name = (data.name as string) || (data.childName as string) || 'אורח'
                  const isCheckedIn = reg.checkIn && !reg.checkIn.undoneAt

                  return (
                    <div
                      key={reg.id}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        isCheckedIn
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white hover:border-green-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{name}</p>
                          <div className="flex items-center gap-2 sm:gap-4 mt-1 text-sm text-gray-600 flex-wrap">
                            <span className="truncate">{reg.phoneNumber}</span>
                            <span className="text-gray-400 hidden sm:inline">•</span>
                            <span className="truncate">קוד: {reg.confirmationCode}</span>
                            {reg.status === 'WAITLIST' && (
                              <>
                                <span className="text-gray-400 hidden sm:inline">•</span>
                                <span className="text-amber-600 font-medium whitespace-nowrap">
                                  המתנה
                                </span>
                              </>
                            )}
                          </div>
                          {isCheckedIn && reg.checkIn?.checkedInAt && (
                            <div className="mt-2 flex items-center gap-2 text-xs text-green-700">
                              <Clock className="w-3.5 h-3.5" />
                              <span>
                                נכח ב-
                                {new Date(reg.checkIn.checkedInAt).toLocaleString('he-IL', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() =>
                            isCheckedIn ? handleUndoCheckIn(reg.id) : handleManualCheckIn(reg.id)
                          }
                          disabled={isCheckingIn || reg.status === 'WAITLIST'}
                          className={`px-3 sm:px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 whitespace-nowrap min-w-[100px] sm:min-w-[120px] text-sm sm:text-base focus:outline-none focus:ring-4 ${
                            isCheckedIn
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 active:scale-95 focus:ring-amber-200'
                              : reg.status === 'WAITLIST'
                                ? 'bg-gray-100 text-gray-500 cursor-not-allowed focus:ring-gray-200'
                                : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 focus:ring-green-200'
                          }`}
                        >
                          {isCheckedIn
                            ? 'בטל נוכחות'
                            : reg.status === 'WAITLIST'
                              ? 'המתנה'
                              : 'סמן נוכחות'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : searchTerm.trim() ? (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">לא נמצאו משתתפים תואמים</p>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm">אין משתתפים רשומים לאירוע</p>
              </div>
            )}
          </div>

          {/* Live Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              פעילות אחרונה
            </h3>

            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={`${activity.registrationId}-${index}`}
                    className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserCheck className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{activity.name}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(activity.time).toLocaleTimeString('he-IL', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-green-600 font-medium text-sm">נכח ✓</span>
                      {activity.isLate && activity.minutesLate && (
                        <span className="text-amber-600 font-semibold text-xs">
                          • איחר {activity.minutesLate} דק׳
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">טרם נרשמה כניסה</p>
                <p className="text-xs text-gray-400 mt-1">כניסות אחרונות יופיעו כאן</p>
              </div>
            )}
          </div>
        </>
      ) : (
        // Before Event Day - Modern Preview (2026 Design)
        <>
          {/* Loading Skeleton */}
          {loading ? (
            <div className="space-y-6 animate-pulse" role="status" aria-label="טוען נתונים...">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-6"></div>
                <div className="h-8 bg-gray-200 rounded-lg max-w-md mx-auto mb-4"></div>
                <div className="h-4 bg-gray-200 rounded-lg max-w-xs mx-auto mb-8"></div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                  <div className="h-32 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Hero Section - Compact */}
              <div className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 rounded-xl shadow-md overflow-hidden mb-4">
                <div className="relative p-5 text-center text-white">
                  {/* Icon */}
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mx-auto mb-3 border border-white/30">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>

                  {/* Heading */}
                  <h1 className="text-xl sm:text-2xl font-bold mb-2">
                    האירוע מתחיל בעוד{' '}
                    <span className="inline-block px-2 py-0.5 bg-white/20 rounded-md border border-white/30">
                      {daysUntilEvent}
                    </span>{' '}
                    ימים
                  </h1>

                  <p className="text-blue-100 text-sm mb-3">
                    עמוד הכניסה יפתח ביום האירוע
                  </p>

                  {/* Event Date Badge */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-md text-white rounded-lg border border-white/20 text-sm">
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">
                      {eventDateObj.toLocaleDateString('he-IL', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Grid - Compact 3-Column */}
              <div className="grid grid-cols-3 gap-3" role="region" aria-label="סטטיסטיקות הרשמה">
                {/* Confirmed Card */}
                <article
                  className="bg-green-50 border border-green-200 rounded-xl p-4 text-center"
                  aria-labelledby="stat-confirmed"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Users className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p id="stat-confirmed" className="text-xs font-medium text-green-700 mb-1">
                    מאושרים
                  </p>
                  <p className="text-2xl font-bold text-green-600 tabular-nums">
                    {stats.confirmed}
                  </p>
                </article>

                {/* Waitlist Card */}
                <article
                  className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center"
                  aria-labelledby="stat-waitlist"
                >
                  <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <ListChecks className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p id="stat-waitlist" className="text-xs font-medium text-amber-700 mb-1">
                    המתנה
                  </p>
                  <p className="text-2xl font-bold text-amber-600 tabular-nums">
                    {stats.waitlist}
                  </p>
                </article>

                {/* Cancelled Card */}
                <article
                  className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center"
                  aria-labelledby="stat-cancelled"
                >
                  <div className="w-10 h-10 bg-gray-400 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <UserX className="w-5 h-5 text-white" aria-hidden="true" />
                  </div>
                  <p id="stat-cancelled" className="text-xs font-medium text-gray-600 mb-1">
                    ביטולים
                  </p>
                  <p className="text-2xl font-bold text-gray-500 tabular-nums">
                    {stats.cancelled}
                  </p>
                </article>
              </div>

              {/* Info Card - Compact */}
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3" role="note">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <QrCode className="w-4 h-4 text-white" aria-hidden="true" />
                </div>
                <p className="text-sm text-blue-700">
                  <span className="font-medium">מערכת הכניסה תפעל ביום האירוע</span> - סריקת QR ורישום נוכחות
                </p>
              </div>
            </>
          )}
        </>
      )}

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

        /* Smooth number transitions */
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}</style>
    </div>
  )
}
