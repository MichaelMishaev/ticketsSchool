'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Users, School, TrendingUp, Search, Filter, Trash2, UserX, Building2 } from 'lucide-react'

interface EventStats {
  id: string
  title: string
  slug: string
  schoolName: string
  schoolSlug: string
  startAt: string
  status: string
  capacity: number
  spotsReserved: number
  registrationCount: number
  waitlistCount: number
}

interface Statistics {
  totalSchools: number
  totalEvents: number
  totalRegistrations: number
  activeEvents: number
}

interface Admin {
  id: string
  email: string
  name: string
  role: string
  schoolId: string | null
  schoolName: string | null
  emailVerified: boolean
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

interface SchoolData {
  id: string
  name: string
  slug: string
  logo: string | null
  primaryColor: string
  isActive: boolean
  plan: string
  subscriptionStatus: string
  eventCount: number
  adminCount: number
  admins: Array<{
    id: string
    email: string
    name: string
    role: string
  }>
  createdAt: string
}

type ActiveTab = 'events' | 'admins' | 'schools'

export default function SuperAdminDashboard() {
  const [events, setEvents] = useState<EventStats[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<ActiveTab>('events')
  const [sortByRegistrations, setSortByRegistrations] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    try {
      setLoading(true)

      // Always fetch overview for statistics
      const overviewResponse = await fetch('/api/admin/super/overview')
      if (overviewResponse.status === 403) {
        router.push('/admin')
        return
      }
      if (!overviewResponse.ok) throw new Error('Failed to fetch overview data')
      const overviewData = await overviewResponse.json()
      setEvents(overviewData.events || [])
      setStatistics(overviewData.statistics || null)

      // Fetch additional data based on active tab
      if (activeTab === 'admins') {
        const adminsResponse = await fetch('/api/admin/super/admins')
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json()
          setAdmins(adminsData.admins || [])
        }
      } else if (activeTab === 'schools') {
        const schoolsResponse = await fetch('/api/admin/super/schools')
        if (schoolsResponse.ok) {
          const schoolsData = await schoolsResponse.json()
          setSchools(schoolsData.schools || [])
        }
      }
    } catch (error) {
      console.error('Error fetching super admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (adminId: string, email: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את המשתמש ${email}? פעולה זו לא ניתנת לביטול.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/super/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`שגיאה במחיקת המשתמש: ${error.error}`)
        return
      }

      alert('המשתמש נמחק בהצלחה')
      fetchData()
    } catch (error) {
      console.error('Error deleting admin:', error)
      alert('שגיאה במחיקת המשתמש')
    }
  }

  const handleDeleteSchool = async (schoolId: string, schoolName: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את בית הספר "${schoolName}"? פעולה זו תמחק גם את כל האירועים והמשתמשים המשוייכים לבית הספר. פעולה זו לא ניתנת לביטול!`)) {
      return
    }

    // Double confirmation for school deletion
    if (!confirm(`אישור נוסף: פעולה זו תמחק לצמיתות את בית הספר "${schoolName}" וכל המידע הקשור אליו. האם להמשיך?`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/super/schools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId })
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`שגיאה במחיקת בית הספר: ${error.error}`)
        return
      }

      const result = await response.json()
      alert(`בית הספר נמחק בהצלחה. נמחקו: ${result.deletedSchool.eventsDeleted} אירועים, ${result.deletedSchool.adminsDeleted} משתמשים`)
      fetchData()
    } catch (error) {
      console.error('Error deleting school:', error)
      alert('שגיאה במחיקת בית הספר')
    }
  }

  const uniqueSchools = Array.from(new Set(events.map(e => e.schoolName)))

  const filteredEvents = events
    .filter(event => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           event.schoolName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesSchool = selectedSchool === 'all' || event.schoolName === selectedSchool
      const matchesStatus = selectedStatus === 'all' || event.status === selectedStatus
      return matchesSearch && matchesSchool && matchesStatus
    })
    .sort((a, b) => {
      if (sortByRegistrations) {
        return b.registrationCount - a.registrationCount
      }
      return new Date(b.startAt).getTime() - new Date(a.startAt).getTime()
    })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">לוח בקרה - Super Admin</h1>
          <p className="mt-1 text-sm text-gray-500">ניהול מלא של המערכת</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('events')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'events'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Calendar className="w-4 h-4" />
            אירועים
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'admins'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="w-4 h-4" />
            משתמשים
          </button>
          <button
            onClick={() => setActiveTab('schools')}
            className={`flex items-center gap-2 px-6 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'schools'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <School className="w-4 h-4" />
            בתי ספר
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button
            onClick={() => setActiveTab('schools')}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer text-right"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">בתי ספר</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalSchools}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <School className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('events')
              setSelectedStatus('all')
              setSortByRegistrations(false)
            }}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer text-right"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה״כ אירועים</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalEvents}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('events')
              setSelectedStatus('OPEN')
              setSortByRegistrations(false)
            }}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer text-right"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">אירועים פעילים</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.activeEvents}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setActiveTab('events')
              setSelectedStatus('all')
              setSortByRegistrations(true)
            }}
            className="bg-white rounded-lg shadow p-6 border border-gray-200 hover:shadow-lg hover:border-orange-300 transition-all cursor-pointer text-right"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סה״כ הרשמות</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{statistics.totalRegistrations}</p>
              </div>
              <div className="bg-orange-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <>
          {sortByRegistrations && (
            <div className="bg-orange-50 border-r-4 border-orange-400 p-3 rounded flex items-center justify-between">
              <button
                onClick={() => setSortByRegistrations(false)}
                className="text-xs px-3 py-1 bg-white rounded border border-orange-300 hover:bg-orange-100 transition-colors"
              >
                חזרה למיון לפי תאריך
              </button>
              <p className="text-sm text-orange-800 text-right">
                מסודר לפי מספר הרשמות (מהרב למעט)
              </p>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="חיפוש אירוע או בית ספר..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    setSortByRegistrations(false)
                  }}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* School Filter */}
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedSchool}
                  onChange={(e) => {
                    setSelectedSchool(e.target.value)
                    setSortByRegistrations(false)
                  }}
                  className="w-full pr-10 pl-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="all">כל בתי הספר</option>
                  {uniqueSchools.map(school => (
                    <option key={school} value={school}>{school}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value)
                    setSortByRegistrations(false)
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none"
                >
                  <option value="all">כל הסטטוסים</option>
                  <option value="OPEN">פתוח</option>
                  <option value="PAUSED">מושהה</option>
                  <option value="CLOSED">סגור</option>
                </select>
              </div>
            </div>
          </div>

          {/* Events Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  אירוע
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  בית ספר
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תאריך
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  סטטוס
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  תפוסה
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  הרשמות
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    לא נמצאו אירועים
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => {
                  const fillPercentage = event.capacity > 0
                    ? Math.round((event.spotsReserved / event.capacity) * 100)
                    : 0

                  return (
                    <tr key={event.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <a
                            href={`/p/${event.schoolSlug}/${event.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-purple-600 hover:text-purple-800 hover:underline"
                          >
                            {event.title}
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{event.schoolName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(event.startAt).toLocaleDateString('he-IL', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          event.status === 'OPEN'
                            ? 'bg-green-100 text-green-800'
                            : event.status === 'PAUSED'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {event.status === 'OPEN' ? 'פתוח' : event.status === 'PAUSED' ? 'מושהה' : 'סגור'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm text-gray-900 ml-2">
                            {fillPercentage}%
                          </div>
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                fillPercentage >= 90 ? 'bg-red-500' :
                                fillPercentage >= 70 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {event.registrationCount}
                          {event.waitlistCount > 0 && (
                            <span className="text-xs text-gray-500 mr-1">
                              (+{event.waitlistCount} ברשימת המתנה)
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

          {/* Summary */}
          <div className="text-sm text-gray-500 text-center">
            מציג {filteredEvents.length} מתוך {events.length} אירועים
          </div>
        </>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    אימייל
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    שם
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    תפקיד
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    בית ספר
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    סטטוס
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      {loading ? 'טוען...' : 'לא נמצאו משתמשים'}
                    </td>
                  </tr>
                ) : (
                  admins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{admin.email}</div>
                        {!admin.emailVerified && (
                          <span className="text-xs text-amber-600">לא מאומת</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.role === 'SUPER_ADMIN'
                            ? 'bg-red-100 text-red-800'
                            : admin.role === 'OWNER'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {admin.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.schoolName || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {admin.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => handleDeleteAdmin(admin.id, admin.email)}
                          disabled={admin.role === 'SUPER_ADMIN'}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                            admin.role === 'SUPER_ADMIN'
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-red-100 text-red-700 hover:bg-red-200'
                          }`}
                          title={admin.role === 'SUPER_ADMIN' ? 'לא ניתן למחוק Super Admin' : 'מחק משתמש'}
                        >
                          <Trash2 className="w-4 h-4" />
                          מחק
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {admins.length > 0 && (
            <div className="px-6 py-4 text-sm text-gray-500 bg-gray-50 border-t border-gray-200">
              סה״כ {admins.length} משתמשים
            </div>
          )}
        </div>
      )}

      {/* Schools Tab */}
      {activeTab === 'schools' && (
        <div className="space-y-4">
          {schools.length === 0 ? (
            <div className="bg-white rounded-lg shadow border border-gray-200 p-8 text-center text-gray-500">
              {loading ? 'טוען...' : 'לא נמצאו בתי ספר'}
            </div>
          ) : (
            schools.map((school) => (
              <div key={school.id} className="bg-white rounded-lg shadow border border-gray-200 p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{school.name}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        school.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {school.isActive ? 'פעיל' : 'לא פעיל'}
                      </span>
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {school.plan}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mb-4">
                      <span className="font-medium">Slug:</span> {school.slug}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-xs text-gray-500">אירועים</div>
                        <div className="text-lg font-semibold text-gray-900">{school.eventCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">משתמשים</div>
                        <div className="text-lg font-semibold text-gray-900">{school.adminCount}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">סטטוס מנוי</div>
                        <div className="text-sm font-medium text-gray-900">{school.subscriptionStatus}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">נוצר ב</div>
                        <div className="text-sm text-gray-900">
                          {new Date(school.createdAt).toLocaleDateString('he-IL')}
                        </div>
                      </div>
                    </div>

                    {school.admins.length > 0 && (
                      <div className="mt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">משתמשים:</div>
                        <div className="flex flex-wrap gap-2">
                          {school.admins.map((admin) => (
                            <span
                              key={admin.id}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-xs"
                            >
                              <span className="font-medium">{admin.email}</span>
                              <span className="text-gray-500">({admin.role})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteSchool(school.id, school.name)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    מחק בית ספר
                  </button>
                </div>
              </div>
            ))
          )}
          {schools.length > 0 && (
            <div className="text-sm text-gray-500 text-center">
              סה״כ {schools.length} בתי ספר
            </div>
          )}
        </div>
      )}
    </div>
  )
}
