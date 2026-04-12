'use client'

import { Calendar, Users, Clock, TrendingUp, ChevronLeft, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import DrilldownModal from '@/components/DrilldownModal'
import CreateEventDropdown from '@/components/CreateEventDropdown'

interface AdminInfo {
  role: 'SUPER_ADMIN' | 'OWNER' | 'ADMIN' | 'MANAGER'
  schoolId?: string
  schoolName?: string
}

// Color-coded styling for stat cards with semantic meaning
const getCardStyles = (
  type: 'activeEvents' | 'registrations' | 'waitlist' | 'occupancy',
  occupancyRate: number = 0
) => {
  const styles = {
    activeEvents: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      text: 'text-blue-900',
      label: 'text-blue-600',
      hover: 'hover:bg-blue-100 hover:border-blue-300',
      focus: 'focus:ring-blue-500/50',
      chevron: 'text-blue-400 group-hover:text-blue-600',
    },
    registrations: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      text: 'text-green-900',
      label: 'text-green-600',
      hover: 'hover:bg-green-100 hover:border-green-300',
      focus: 'focus:ring-green-500/50',
      chevron: 'text-green-400 group-hover:text-green-600',
    },
    waitlist: {
      bg: 'bg-orange-50',
      border: 'border-orange-200',
      icon: 'text-orange-600',
      text: 'text-orange-900',
      label: 'text-orange-600',
      hover: 'hover:bg-orange-100 hover:border-orange-300',
      focus: 'focus:ring-orange-500/50',
      chevron: 'text-orange-400 group-hover:text-orange-600',
    },
    occupancy: {
      // Dynamic color based on percentage - creates visual alarm system
      bg: occupancyRate >= 80 ? 'bg-red-50' : occupancyRate >= 50 ? 'bg-yellow-50' : 'bg-purple-50',
      border:
        occupancyRate >= 80
          ? 'border-red-200'
          : occupancyRate >= 50
            ? 'border-yellow-200'
            : 'border-purple-200',
      icon:
        occupancyRate >= 80
          ? 'text-red-600'
          : occupancyRate >= 50
            ? 'text-yellow-600'
            : 'text-purple-600',
      text:
        occupancyRate >= 80
          ? 'text-red-900'
          : occupancyRate >= 50
            ? 'text-yellow-900'
            : 'text-purple-900',
      label:
        occupancyRate >= 80
          ? 'text-red-600'
          : occupancyRate >= 50
            ? 'text-yellow-600'
            : 'text-purple-600',
      hover:
        occupancyRate >= 80
          ? 'hover:bg-red-100 hover:border-red-300'
          : occupancyRate >= 50
            ? 'hover:bg-yellow-100 hover:border-yellow-300'
            : 'hover:bg-purple-100 hover:border-purple-300',
      focus:
        occupancyRate >= 80
          ? 'focus:ring-red-500/50'
          : occupancyRate >= 50
            ? 'focus:ring-yellow-500/50'
            : 'focus:ring-purple-500/50',
      chevron:
        occupancyRate >= 80
          ? 'text-red-400 group-hover:text-red-600'
          : occupancyRate >= 50
            ? 'text-yellow-400 group-hover:text-yellow-600'
            : 'text-purple-400 group-hover:text-purple-600',
    },
  }
  return styles[type]
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    waitlistCount: 0,
    occupancyRate: 0,
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCardLoading, setIsCardLoading] = useState<string | null>(null) // Track which card is loading
  const [adminInfo, setAdminInfo] = useState<AdminInfo | null>(null)
  const [modalData, setModalData] = useState<{
    isOpen: boolean
    title: string
    data: any
    type: 'activeEvents' | 'registrations' | 'waitlist' | 'occupancy'
  }>({ isOpen: false, title: '', data: null, type: 'activeEvents' })

  useEffect(() => {
    fetchDashboardData()
    // Removed fetchAdminInfo() - layout already fetches this
    // If needed, we can fetch it lazily after dashboard loads
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch stats and events in parallel
      const [statsResponse, eventsResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/events'),
      ])

      const statsData = await statsResponse.json()
      const events = await eventsResponse.json()

      setStats(statsData)

      // Get recent events (last 5)
      setRecentEvents(events.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAdminInfo = async () => {
    try {
      const response = await fetch('/api/admin/me')
      const data = await response.json()
      if (data.authenticated && data.admin) {
        setAdminInfo(data.admin)
      }
    } catch (error) {
      console.error('Error fetching admin info:', error)
    }
  }

  // Lazy load admin info only if needed (for SUPER_ADMIN button)
  useEffect(() => {
    // Delay fetching admin info to not block initial render
    const timer = setTimeout(fetchAdminInfo, 100)
    return () => clearTimeout(timer)
  }, [])

  const handleCardClick = async (
    type: 'activeEvents' | 'registrations' | 'waitlist' | 'occupancy'
  ) => {
    try {
      setIsCardLoading(type) // Track which specific card is loading
      const endpoint = {
        activeEvents: '/api/dashboard/active-events',
        registrations: '/api/dashboard/registrations',
        waitlist: '/api/dashboard/waitlist',
        occupancy: '/api/dashboard/occupancy',
      }[type]

      const response = await fetch(endpoint)
      const data = await response.json()

      const titles = {
        activeEvents: 'אירועים פעילים - פרטים מלאים',
        registrations: 'נרשמים - פרטים מלאים',
        waitlist: 'רשימת המתנה - פרטים מלאים',
        occupancy: 'אחוז תפוסה - פרטים מלאים',
      }

      setModalData({
        isOpen: true,
        title: titles[type],
        data,
        type,
      })
    } catch (error) {
      console.error('Error fetching drilldown data:', error)
    } finally {
      setIsCardLoading(null)
    }
  }

  const closeModal = () => {
    setModalData({ isOpen: false, title: '', data: null, type: 'activeEvents' })
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">לוח בקרה</h2>
        {adminInfo?.role === 'SUPER_ADMIN' && (
          <Link
            href="/admin-prod"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            AdminProd
          </Link>
        )}
      </div>

      {/* Onboarding message for new users */}
      {!isLoading && stats.activeEvents === 0 && stats.totalRegistrations === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <Sparkles className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-blue-900 mb-1">ברוכים הבאים! 🎉</h3>
              <p className="text-blue-700 text-sm mb-4">
                התחל ליצור את האירוע הראשון שלך וצפה בסטטיסטיקות בזמן אמת
              </p>
              <CreateEventDropdown variant="page" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 mb-6 sm:mb-8">
        {/* Active Events Card */}
        {(() => {
          const styles = getCardStyles('activeEvents', stats.occupancyRate)
          return (
            <button
              onClick={() => handleCardClick('activeEvents')}
              disabled={isCardLoading === 'activeEvents'}
              aria-label={`אירועים פעילים: ${stats.activeEvents}. לחץ לצפייה בפרטים מלאים`}
              className={`
                ${styles.bg} ${styles.border} border-2 overflow-hidden shadow-sm rounded-xl
                ${styles.hover} transition-all duration-200 cursor-pointer text-right w-full group
                min-h-[88px] sm:min-h-[100px] relative
                focus:outline-none focus:ring-4 ${styles.focus} focus:ring-offset-2
                active:scale-[0.98] transform
                disabled:opacity-70 disabled:cursor-wait
              `}
            >
              {isCardLoading === 'activeEvents' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
                  <Loader2 className={`h-6 w-6 animate-spin ${styles.icon}`} />
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.icon}`} />
                    <ChevronLeft
                      className={`h-4 w-4 ${styles.chevron} transition-colors opacity-0 group-hover:opacity-100`}
                    />
                  </div>
                  <div className="text-right flex-1 mr-2">
                    <dd className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>
                      {stats.activeEvents}
                    </dd>
                    <dt className={`text-xs sm:text-sm font-medium ${styles.label} truncate`}>
                      אירועים פעילים
                    </dt>
                  </div>
                </div>
              </div>
            </button>
          )
        })()}

        {/* Total Registrations Card */}
        {(() => {
          const styles = getCardStyles('registrations', stats.occupancyRate)
          return (
            <button
              onClick={() => handleCardClick('registrations')}
              disabled={isCardLoading === 'registrations'}
              aria-label={`סה"כ נרשמים: ${stats.totalRegistrations}. לחץ לצפייה בפרטים מלאים`}
              className={`
                ${styles.bg} ${styles.border} border-2 overflow-hidden shadow-sm rounded-xl
                ${styles.hover} transition-all duration-200 cursor-pointer text-right w-full group
                min-h-[88px] sm:min-h-[100px] relative
                focus:outline-none focus:ring-4 ${styles.focus} focus:ring-offset-2
                active:scale-[0.98] transform
                disabled:opacity-70 disabled:cursor-wait
              `}
            >
              {isCardLoading === 'registrations' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
                  <Loader2 className={`h-6 w-6 animate-spin ${styles.icon}`} />
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.icon}`} />
                    <ChevronLeft
                      className={`h-4 w-4 ${styles.chevron} transition-colors opacity-0 group-hover:opacity-100`}
                    />
                  </div>
                  <div className="text-right flex-1 mr-2">
                    <dd className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>
                      {stats.totalRegistrations}
                    </dd>
                    <dt className={`text-xs sm:text-sm font-medium ${styles.label} truncate`}>
                      סה"כ נרשמים
                    </dt>
                  </div>
                </div>
              </div>
            </button>
          )
        })()}

        {/* Waitlist Card */}
        {(() => {
          const styles = getCardStyles('waitlist', stats.occupancyRate)
          return (
            <button
              onClick={() => handleCardClick('waitlist')}
              disabled={isCardLoading === 'waitlist'}
              aria-label={`ממתינים ברשימת המתנה: ${stats.waitlistCount}. לחץ לצפייה בפרטים מלאים`}
              className={`
                ${styles.bg} ${styles.border} border-2 overflow-hidden shadow-sm rounded-xl
                ${styles.hover} transition-all duration-200 cursor-pointer text-right w-full group
                min-h-[88px] sm:min-h-[100px] relative
                focus:outline-none focus:ring-4 ${styles.focus} focus:ring-offset-2
                active:scale-[0.98] transform
                disabled:opacity-70 disabled:cursor-wait
              `}
            >
              {isCardLoading === 'waitlist' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
                  <Loader2 className={`h-6 w-6 animate-spin ${styles.icon}`} />
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.icon}`} />
                    <ChevronLeft
                      className={`h-4 w-4 ${styles.chevron} transition-colors opacity-0 group-hover:opacity-100`}
                    />
                  </div>
                  <div className="text-right flex-1 mr-2">
                    <dd className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>
                      {stats.waitlistCount}
                    </dd>
                    <dt className={`text-xs sm:text-sm font-medium ${styles.label} truncate`}>
                      רשימת המתנה
                    </dt>
                  </div>
                </div>
              </div>
            </button>
          )
        })()}

        {/* Occupancy Rate Card - Dynamic color based on percentage */}
        {(() => {
          const styles = getCardStyles('occupancy', stats.occupancyRate)
          return (
            <button
              onClick={() => handleCardClick('occupancy')}
              disabled={isCardLoading === 'occupancy'}
              aria-label={`אחוז תפוסה: ${stats.occupancyRate}%. לחץ לצפייה בפרטים מלאים`}
              className={`
                ${styles.bg} ${styles.border} border-2 overflow-hidden shadow-sm rounded-xl
                ${styles.hover} transition-all duration-200 cursor-pointer text-right w-full group
                min-h-[88px] sm:min-h-[100px] relative
                focus:outline-none focus:ring-4 ${styles.focus} focus:ring-offset-2
                active:scale-[0.98] transform
                disabled:opacity-70 disabled:cursor-wait
              `}
            >
              {isCardLoading === 'occupancy' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-10 rounded-xl">
                  <Loader2 className={`h-6 w-6 animate-spin ${styles.icon}`} />
                </div>
              )}
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-5 w-5 sm:h-6 sm:w-6 ${styles.icon}`} />
                    <ChevronLeft
                      className={`h-4 w-4 ${styles.chevron} transition-colors opacity-0 group-hover:opacity-100`}
                    />
                  </div>
                  <div className="text-right flex-1 mr-2">
                    <dd className={`text-2xl sm:text-3xl font-bold ${styles.text}`}>
                      {stats.occupancyRate}%
                    </dd>
                    <dt className={`text-xs sm:text-sm font-medium ${styles.label} truncate`}>
                      אחוז תפוסה
                    </dt>
                  </div>
                </div>
              </div>
            </button>
          )
        })()}
      </div>

      <div className="bg-white shadow sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">אירועים אחרונים</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {isLoading ? (
            <div className="text-center text-gray-500">טוען...</div>
          ) : recentEvents.length > 0 ? (
            <div className="space-y-3">
              {recentEvents.map((event) => (
                <div key={event.id} className="border-b pb-3 last:border-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {event.title}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-gray-500">
                          {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                        </p>
                        {event.school && (
                          <>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                              {event.school.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {event.totalSpotsTaken || 0}/{event.totalCapacity || event.capacity}
                      </p>
                      <p className="text-xs text-gray-500">נרשמים</p>
                    </div>
                  </div>
                </div>
              ))}
              <Link
                href="/admin/events"
                className="block text-center text-sm text-blue-600 hover:text-blue-800 pt-2"
              >
                צפה בכל האירועים →
              </Link>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg mb-4">אין אירועים עדיין</p>
              <div className="flex justify-center">
                <CreateEventDropdown variant="page" />
              </div>
            </div>
          )}
        </div>
      </div>

      <DrilldownModal
        isOpen={modalData.isOpen}
        onClose={closeModal}
        title={modalData.title}
        data={modalData.data}
        type={modalData.type}
      />
    </div>
  )
}
