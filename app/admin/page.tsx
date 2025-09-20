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
  const [isFixing, setIsFixing] = useState(false)
  const [fixResult, setFixResult] = useState<any>(null)

  useEffect(() => {
    fetchDashboardData()
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

  const handleFixRegistrationStatus = async () => {
    if (!confirm('האם אתה בטוח שברצונך לתקן את סטטוס ההרשמות? פעולה זו תעדכן את כל ההרשמות לפי סדר הגעה.')) {
      return
    }

    setIsFixing(true)
    setFixResult(null)

    try {
      const response = await fetch('/api/admin/fix-registration-status', {
        method: 'POST'
      })
      const result = await response.json()
      setFixResult(result)

      if (result.success) {
        // Refresh dashboard data after fix
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Error fixing registration status:', error)
      setFixResult({ success: false, error: 'Failed to fix registration status' })
    } finally {
      setIsFixing(false)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">לוח בקרה</h2>
        <div className="flex gap-2">
          <button
            onClick={handleFixRegistrationStatus}
            disabled={isFixing}
            className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isFixing ? 'מתקן...' : 'תקן סטטוס הרשמות'}
          </button>
          <Link
            href="/admin-prod"
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition"
          >
            AdminProd
          </Link>
        </div>
      </div>

      {fixResult && (
        <div className={`mb-6 p-4 rounded-lg ${
          fixResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <h3 className={`font-medium ${fixResult.success ? 'text-green-800' : 'text-red-800'}`}>
            {fixResult.success ? '✅ התיקון הושלם בהצלחה' : '❌ שגיאה בתיקון'}
          </h3>
          {fixResult.success && fixResult.fixes && (
            <div className="mt-2">
              <p className="text-green-700">תוקנו {fixResult.fixes.length} הרשמות:</p>
              {fixResult.fixes.slice(0, 5).map((fix: any, index: number) => (
                <div key={index} className="text-sm text-green-600 mt-1">
                  {fix.eventTitle} - {fix.registrationCode}: {fix.oldStatus} → {fix.newStatus}
                </div>
              ))}
              {fixResult.fixes.length > 5 && (
                <div className="text-sm text-green-600 mt-1">
                  ועוד {fixResult.fixes.length - 5} תיקונים...
                </div>
              )}
            </div>
          )}
          {fixResult.error && (
            <p className="text-red-700 mt-2">{fixResult.error}</p>
          )}
        </div>
      )}

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