'use client'

import { Calendar, Users, Clock, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
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

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    waitlistCount: 0,
    occupancyRate: 0
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
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
        fetch('/api/events')
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

  const handleCardClick = async (type: 'activeEvents' | 'registrations' | 'waitlist' | 'occupancy') => {
    try {
      setIsLoading(true)
      const endpoint = {
        activeEvents: '/api/dashboard/active-events',
        registrations: '/api/dashboard/registrations',
        waitlist: '/api/dashboard/waitlist',
        occupancy: '/api/dashboard/occupancy'
      }[type]

      const response = await fetch(endpoint)
      const data = await response.json()

      const titles = {
        activeEvents: 'אירועים פעילים - פרטים מלאים',
        registrations: 'נרשמים - פרטים מלאים',
        waitlist: 'רשימת המתנה - פרטים מלאים',
        occupancy: 'אחוז תפוסה - פרטים מלאים'
      }

      setModalData({
        isOpen: true,
        title: titles[type],
        data,
        type
      })
    } catch (error) {
      console.error('Error fetching drilldown data:', error)
    } finally {
      setIsLoading(false)
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


      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-3 lg:grid-cols-4 mb-6 sm:mb-8">
        <button
          onClick={() => handleCardClick('activeEvents')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer text-right w-full group min-h-[88px] sm:min-h-[100px]"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  אירועים פעילים
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.activeEvents}</dd>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleCardClick('registrations')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer text-right w-full group min-h-[88px] sm:min-h-[100px]"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Users className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  סה"כ נרשמים
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.totalRegistrations}</dd>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleCardClick('waitlist')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer text-right w-full group min-h-[88px] sm:min-h-[100px]"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  ממתינים ברשימת המתנה
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.waitlistCount}</dd>
              </div>
            </div>
          </div>
        </button>

        <button
          onClick={() => handleCardClick('occupancy')}
          className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md hover:bg-gray-50 transition-all cursor-pointer text-right w-full group min-h-[88px] sm:min-h-[100px]"
        >
          <div className="p-4 sm:p-5">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <div className="flex-shrink-0 mb-2 sm:mb-0">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
              </div>
              <div className="sm:mr-3 w-full sm:w-0 sm:flex-1">
                <dt className="text-xs sm:text-sm font-medium text-gray-500 truncate">
                  אחוז תפוסה
                </dt>
                <dd className="text-base sm:text-lg font-medium text-gray-900">{stats.occupancyRate}%</dd>
              </div>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-white shadow sm:rounded-md">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            אירועים אחרונים
          </h3>
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