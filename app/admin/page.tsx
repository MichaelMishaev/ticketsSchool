'use client'

import { Calendar, Users, Clock, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeEvents: 0,
    totalRegistrations: 0,
    waitlistCount: 0,
    occupancyRate: 0
  })
  const [recentEvents, setRecentEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/events')
      const events = await response.json()

      // Calculate statistics
      const activeEvents = events.filter((e: any) => e.status === 'OPEN').length
      const totalRegistrations = events.reduce((sum: number, e: any) => sum + (e._count?.registrations || 0), 0)

      // Calculate occupancy rate
      const totalCapacity = events.reduce((sum: number, e: any) => sum + e.capacity, 0)
      const occupancyRate = totalCapacity > 0 ? Math.round((totalRegistrations / totalCapacity) * 100) : 0

      setStats({
        activeEvents,
        totalRegistrations,
        waitlistCount: 0, // This would need a separate API endpoint to get waitlist count
        occupancyRate
      })

      // Get recent events (last 5)
      setRecentEvents(events.slice(0, 5))
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">לוח בקרה</h2>
        <Link
          href="/admin-prod"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
        >
          AdminProd
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4 mb-6 sm:mb-8">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
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
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
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
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
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
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-3 sm:p-5">
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
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md">
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
                    <div>
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {event.title}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">
                        {event._count?.registrations || 0}/{event.capacity}
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
              <p className="text-lg">אין אירועים עדיין</p>
              <Link
                href="/admin/events/new"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                צור אירוע חדש
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}