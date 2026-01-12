'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Copy, Check, QrCode, Search, UserCheck, RefreshCw } from 'lucide-react'

interface CheckInTabProps {
  eventId: string
  eventDate: Date
}

interface CheckInRecord {
  id: string
  checkedInAt: string
  checkedInBy: string | null
  undoneAt: string | null
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
    cancelled: 0
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
            cancelled: 0
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
                time: r.checkIn!.checkedInAt
              }
            })
            .sort((a: RecentActivity, b: RecentActivity) =>
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
            cancelled: 0 // Stats API doesn't track cancelled
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
                time: r.checkIn!.checkedInAt
              }
            })
            .sort((a: RecentActivity, b: RecentActivity) =>
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
          cancelled: 0
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
          checkedInBy: 'manual'
        })
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

  // Filter registrations based on search term
  const filteredRegistrations = registrations.filter(r => {
    if (!searchTerm.trim()) return false

    const data = r.data as Record<string, unknown>
    const name = ((data.name as string) || (data.childName as string) || '').toLowerCase()
    const phone = r.phoneNumber.toLowerCase()
    const code = r.confirmationCode.toLowerCase()
    const search = searchTerm.toLowerCase()

    return name.includes(search) || phone.includes(search) || code.includes(search)
  }).slice(0, 20) // Limit to 20 results

  const handleCopyLink = () => {
    if (checkInLink) {
      navigator.clipboard.writeText(checkInLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
      showSuccess('קישור הכניסה הועתק ללוח')
    }
  }

  const checkedInPercent = stats.confirmed > 0 ? Math.round((stats.checkedIn / stats.confirmed) * 100) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6" dir="rtl">
      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_300ms_ease-out]">
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
                  <code className="text-sm font-mono flex-1 truncate text-white">{checkInLink}</code>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">הגיעו</p>
                <p className="text-3xl font-bold text-green-600">{stats.checkedIn}</p>
              </div>
              <div className="text-center p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 mb-1">ממתינים</p>
                <p className="text-3xl font-bold text-amber-600">{stats.notCheckedIn}</p>
              </div>
              <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-700 mb-1">רשימת המתנה</p>
                <p className="text-3xl font-bold text-blue-600">{stats.waitlist}</p>
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredRegistrations.map(reg => {
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
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{name}</p>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                            <span>{reg.phoneNumber}</span>
                            <span className="text-gray-400">•</span>
                            <span>קוד: {reg.confirmationCode}</span>
                            {reg.status === 'WAITLIST' && (
                              <>
                                <span className="text-gray-400">•</span>
                                <span className="text-amber-600 font-medium">המתנה</span>
                              </>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleManualCheckIn(reg.id)}
                          disabled={isCheckedIn || isCheckingIn || reg.status === 'WAITLIST'}
                          className={`px-4 py-2 rounded-lg font-medium transition-all flex-shrink-0 ${
                            isCheckedIn
                              ? 'bg-green-100 text-green-700 cursor-not-allowed'
                              : reg.status === 'WAITLIST'
                              ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                              : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'
                          }`}
                        >
                          {isCheckedIn ? 'נכח ✓' : reg.status === 'WAITLIST' ? 'המתנה' : 'סמן נוכחות'}
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
                <p className="text-sm">חפש משתתף כדי לסמן נוכחות ידנית</p>
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
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <div className="text-green-600 font-medium text-sm">נכח ✓</div>
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
        // Before Event Day - Preview
        <>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              האירוע מתחיל בעוד {daysUntilEvent} ימים
            </h2>
            <p className="text-gray-600 mb-6">עמוד הכניסה יפתח ביום האירוע</p>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">
                {eventDateObj.toLocaleDateString('he-IL', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>

            {/* Preview Stats */}
            <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700 mb-1">מאושרים</p>
                <p className="text-2xl font-bold text-green-600">{stats.confirmed}</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-700 mb-1">המתנה</p>
                <p className="text-2xl font-bold text-amber-600">{stats.waitlist}</p>
              </div>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-700 mb-1">ביטולים</p>
                <p className="text-2xl font-bold text-gray-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>
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
      `}</style>
    </div>
  )
}
