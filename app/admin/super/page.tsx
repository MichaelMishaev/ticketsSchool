'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Calendar,
  Users,
  School,
  TrendingUp,
  Search,
  Filter,
  Trash2,
  UserX,
  Building2,
  AlertTriangle,
  FileText,
  BarChart3,
  Command,
  X,
  Zap,
  CheckCircle2,
  Clock,
  XCircle,
  Activity,
  ArrowUpRight,
} from 'lucide-react'
import Link from 'next/link'
import Modal from '@/components/Modal'

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

type ActiveView = 'overview' | 'events' | 'admins' | 'schools' | 'logs' | 'statistics'

interface DeleteAdminModalState {
  isOpen: boolean
  admin: Admin | null
}

interface DeleteSchoolModalState {
  isOpen: boolean
  school: SchoolData | null
}

export default function SuperAdminDashboard() {
  const [events, setEvents] = useState<EventStats[]>([])
  const [statistics, setStatistics] = useState<Statistics | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [schools, setSchools] = useState<SchoolData[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchool, setSelectedSchool] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [activeView, setActiveView] = useState<ActiveView>('overview')
  const [sortByRegistrations, setSortByRegistrations] = useState(false)
  const [deleteAdminModal, setDeleteAdminModal] = useState<DeleteAdminModalState>({
    isOpen: false,
    admin: null,
  })
  const [deleteSchoolModal, setDeleteSchoolModal] = useState<DeleteSchoolModalState>({
    isOpen: false,
    school: null,
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const router = useRouter()

  // Command Palette Keyboard Shortcut (cmd+k)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen((prev) => !prev)
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    fetchData()
  }, [activeView])

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

      // Fetch additional data based on active view
      if (activeView === 'admins') {
        const adminsResponse = await fetch('/api/admin/super/admins')
        if (adminsResponse.ok) {
          const adminsData = await adminsResponse.json()
          setAdmins(adminsData.admins || [])
        }
      } else if (activeView === 'schools') {
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

  const handleDeleteAdmin = async () => {
    if (!deleteAdminModal.admin) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/super/admins', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: deleteAdminModal.admin.id }),
      })

      if (!response.ok) {
        let errorMessage = 'שגיאה במחיקת המשתמש'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json()
            errorMessage = error.error || error.details || errorMessage
          } else {
            const text = await response.text()
            console.error('Non-JSON error response:', text)
            errorMessage = `שגיאת שרת (${response.status}): ${response.statusText}`
          }
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          errorMessage = `שגיאת שרת (${response.status}): ${response.statusText}`
        }
        alert(errorMessage)
        return
      }

      let result
      try {
        result = await response.json()
      } catch (parseError) {
        console.error('Failed to parse success response:', parseError)
        alert('המשתמש נמחק, אך לא ניתן היה לקרוא את תגובת השרת')
        setDeleteAdminModal({ isOpen: false, admin: null })
        fetchData()
        return
      }

      let message = `המשתמש ${result.adminDeleted.email} נמחק בהצלחה`
      if (result.schoolDeleted) {
        message += `\n\n⚠️ נמחק גם בית הספר "${result.schoolDeleted.name}"`
        message += `\n• אירועים שנמחקו: ${result.schoolDeleted.eventsDeleted}`
        message += `\n• משתמשים שנמחקו: ${result.schoolDeleted.adminsDeleted}`
      }

      alert(message)
      setDeleteAdminModal({ isOpen: false, admin: null })
      fetchData()
    } catch (error) {
      console.error('Error deleting admin:', error)
      const errorMessage = error instanceof Error ? error.message : 'שגיאה לא ידועה'
      alert(`שגיאה במחיקת המשתמש: ${errorMessage}`)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleDeleteSchool = async () => {
    if (!deleteSchoolModal.school) return

    setIsDeleting(true)
    try {
      const response = await fetch('/api/admin/super/schools', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schoolId: deleteSchoolModal.school.id }),
      })

      if (!response.ok) {
        const error = await response.json()
        alert(`שגיאה במחיקת בית הספר: ${error.error}`)
        return
      }

      const result = await response.json()
      alert(
        `בית הספר נמחק בהצלחה.\n\nנמחקו:\n• ${result.deletedSchool.eventsDeleted} אירועים\n• ${result.deletedSchool.adminsDeleted} משתמשים`
      )
      setDeleteSchoolModal({ isOpen: false, school: null })
      fetchData()
    } catch (error) {
      console.error('Error deleting school:', error)
      alert('שגיאה במחיקת בית הספר')
    } finally {
      setIsDeleting(false)
    }
  }

  const uniqueSchools = Array.from(new Set(events.map((e) => e.schoolName)))

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // Navigation items - reordered with most important first for mobile (shows first 5)
  const navItems = [
    { id: 'overview' as ActiveView, label: 'סקירה', icon: Activity, badge: null },
    {
      id: 'events' as ActiveView,
      label: 'אירועים',
      icon: Calendar,
      badge: statistics?.totalEvents,
    },
    {
      id: 'schools' as ActiveView,
      label: 'בתי ספר',
      icon: School,
      badge: statistics?.totalSchools,
    },
    { id: 'statistics' as ActiveView, label: 'סטטיסטיקות', icon: BarChart3, badge: null },
    { id: 'admins' as ActiveView, label: 'משתמשים', icon: Users, badge: admins.length || null },
    { id: 'logs' as ActiveView, label: 'לוגים', icon: FileText, badge: null },
  ]

  if (loading && !statistics) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">טוען נתונים...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50" dir="rtl">
      {/* Vertical Sidebar Navigation - Modern 2026 Design */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-white border-l border-gray-200 fixed right-0 top-0 bottom-0 z-30">
        {/* Logo/Header */}
        <div className="px-6 py-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Super Admin</h1>
              <p className="text-xs text-gray-500">ניהול מערכת</p>
            </div>
          </div>
        </div>

        {/* Command Palette Trigger */}
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="mx-4 mt-4 px-4 py-2.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors duration-200 flex items-center gap-3 group"
        >
          <Search className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
          <span className="text-sm text-gray-500 flex-1 text-right">חיפוש מהיר...</span>
          <kbd className="px-2 py-0.5 bg-white border border-gray-200 rounded text-xs text-gray-500 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'logs') {
                    router.push('/admin/logs')
                  } else if (item.id === 'statistics') {
                    router.push('/admin/statistics')
                  } else {
                    setActiveView(item.id)
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-purple-600' : 'text-gray-400'}`} />
                <span className="flex-1 text-right font-medium text-sm">{item.label}</span>
                {item.badge !== null && (
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                      isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Footer - System Status */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-green-700">מערכת פעילה</span>
          </div>
        </div>
      </aside>

      {/* Mobile Navigation */}
      <div className="lg:hidden fixed top-0 right-0 left-0 bg-white border-b border-gray-200 px-2 py-2 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Search className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-base font-bold text-gray-900">Super Admin</h1>
          <div className="w-8 h-8" /> {/* Spacer for centering */}
        </div>

        {/* Mobile Tab Bar - Shows first 5 items with compact layout */}
        <div className="flex justify-between gap-0.5">
          {navItems.slice(0, 5).map((item) => {
            const Icon = item.icon
            const isActive = activeView === item.id

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'statistics') {
                    router.push('/admin/statistics')
                  } else if (item.id === 'logs') {
                    router.push('/admin/logs')
                  } else {
                    setActiveView(item.id)
                  }
                }}
                className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-1.5 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-[9px] font-medium truncate max-w-full">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 lg:mr-64 pt-20 lg:pt-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
          {/* Overview View */}
          {activeView === 'overview' && statistics && (
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 animate-fadeIn">
              {/* Header */}
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  סקירה כללית
                </h2>
                <p className="text-sm sm:text-base text-gray-600">מבט על הפעילות במערכת</p>
              </div>

              {/* Statistics Cards - Modern 2026 Design - Mobile Optimized */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {/* Schools Card */}
                <button
                  onClick={() => setActiveView('schools')}
                  className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-xl border border-gray-200 hover:border-blue-300 transition-all duration-300 hover:-translate-y-1 text-right"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-blue-50 rounded-lg sm:rounded-xl group-hover:bg-blue-100 transition-colors">
                      <School className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-blue-600" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-blue-600 transition-colors hidden sm:block" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">
                      בתי ספר
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      {statistics.totalSchools}
                    </p>
                  </div>
                </button>

                {/* Events Card */}
                <button
                  onClick={() => setActiveView('events')}
                  className="group bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-xl border border-gray-200 hover:border-purple-300 transition-all duration-300 hover:-translate-y-1 text-right"
                >
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-purple-50 rounded-lg sm:rounded-xl group-hover:bg-purple-100 transition-colors">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-purple-600" />
                    </div>
                    <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-purple-600 transition-colors hidden sm:block" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">
                      סה״כ אירועים
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      {statistics.totalEvents}
                    </p>
                  </div>
                </button>

                {/* Active Events Card */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 text-right text-white">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl backdrop-blur-sm">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                    </div>
                    <div className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-white/20 rounded-md sm:rounded-lg backdrop-blur-sm">
                      <Activity className="w-3 h-3 sm:w-4 sm:h-4 text-white animate-pulse" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-green-50 mb-0.5 sm:mb-1">
                      אירועים פעילים
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                      {statistics.activeEvents}
                    </p>
                  </div>
                </div>

                {/* Registrations Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-sm hover:shadow-xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 text-right">
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className="p-2 sm:p-3 bg-orange-50 rounded-lg sm:rounded-xl">
                      <Users className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-orange-600" />
                    </div>
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-600 mb-0.5 sm:mb-1">
                      סה״כ הרשמות
                    </p>
                    <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                      {statistics.totalRegistrations}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Activity - Preview */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900">
                    פעילות אחרונה
                  </h3>
                  <button
                    onClick={() => setActiveView('events')}
                    className="text-xs sm:text-sm font-medium text-purple-600 hover:text-purple-700 flex items-center gap-1"
                  >
                    <span>הצג הכל</span>
                    <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4" />
                  </button>
                </div>

                <div className="space-y-2 sm:space-y-4">
                  {events.slice(0, 5).map((event) => {
                    const fillPercentage =
                      event.capacity > 0
                        ? Math.round((event.spotsReserved / event.capacity) * 100)
                        : 0

                    return (
                      <div
                        key={event.id}
                        className="flex items-center gap-2 sm:gap-4 p-2 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div
                          className={`p-1.5 sm:p-2 rounded-lg flex-shrink-0 ${
                            event.status === 'OPEN'
                              ? 'bg-green-100'
                              : event.status === 'PAUSED'
                                ? 'bg-yellow-100'
                                : 'bg-red-100'
                          }`}
                        >
                          {event.status === 'OPEN' ? (
                            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                          ) : event.status === 'PAUSED' ? (
                            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
                          ) : (
                            <XCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            {event.schoolName}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className="text-left hidden sm:block">
                            <p className="text-xs text-gray-500">תפוסה</p>
                            <p className="text-sm font-semibold text-gray-900">{fillPercentage}%</p>
                          </div>
                          <div className="w-12 sm:w-20 h-1.5 sm:h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                fillPercentage >= 90
                                  ? 'bg-red-500'
                                  : fillPercentage >= 70
                                    ? 'bg-yellow-500'
                                    : 'bg-green-500'
                              }`}
                              style={{ width: `${fillPercentage}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-700 sm:hidden w-8 text-left">
                            {fillPercentage}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Events View */}
          {activeView === 'events' && (
            <div className="space-y-3 sm:space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  אירועים
                </h2>
                <p className="text-sm sm:text-base text-gray-600">ניהול כל האירועים במערכת</p>
              </div>

              {sortByRegistrations && (
                <div className="bg-orange-50 border-r-4 border-orange-400 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs sm:text-sm text-orange-800 font-medium order-1 sm:order-2">
                    מסודר לפי מספר הרשמות (מהרב למעט)
                  </p>
                  <button
                    onClick={() => setSortByRegistrations(false)}
                    className="text-xs sm:text-sm px-3 sm:px-4 py-1.5 sm:py-2 bg-white rounded-lg border border-orange-300 hover:bg-orange-100 transition-colors font-medium order-2 sm:order-1"
                  >
                    חזרה למיון לפי תאריך
                  </button>
                </div>
              )}

              {/* Filters */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm p-3 sm:p-6 border border-gray-200">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
                  <div className="relative sm:col-span-2 md:col-span-1">
                    <Search className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="חיפוש..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value)
                        setSortByRegistrations(false)
                      }}
                      className="w-full pr-9 sm:pr-12 pl-3 sm:pl-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm sm:text-base"
                    />
                  </div>

                  <div className="relative">
                    <select
                      value={selectedSchool}
                      onChange={(e) => {
                        setSelectedSchool(e.target.value)
                        setSortByRegistrations(false)
                      }}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all text-sm sm:text-base"
                    >
                      <option value="all">כל בתי הספר</option>
                      {uniqueSchools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>

                  <select
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value)
                      setSortByRegistrations(false)
                    }}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent appearance-none transition-all text-sm sm:text-base"
                  >
                    <option value="all">כל הסטטוסים</option>
                    <option value="OPEN">פתוח</option>
                    <option value="PAUSED">מושהה</option>
                    <option value="CLOSED">סגור</option>
                  </select>
                </div>
              </div>

              {/* Events Table */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          אירוע
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          בית ספר
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          תאריך
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          סטטוס
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          תפוסה
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          הרשמות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredEvents.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Calendar className="w-12 h-12 text-gray-300" />
                              <p className="text-gray-500 font-medium">לא נמצאו אירועים</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredEvents.map((event) => {
                          const fillPercentage =
                            event.capacity > 0
                              ? Math.round((event.spotsReserved / event.capacity) * 100)
                              : 0

                          return (
                            <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4">
                                <a
                                  href={`/p/${event.schoolSlug}/${event.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-purple-600 hover:text-purple-800 hover:underline"
                                >
                                  {event.title}
                                </a>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-700">{event.schoolName}</span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-sm text-gray-700">
                                  {new Date(event.startAt).toLocaleDateString('he-IL', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                    event.status === 'OPEN'
                                      ? 'bg-green-100 text-green-700'
                                      : event.status === 'PAUSED'
                                        ? 'bg-yellow-100 text-yellow-700'
                                        : 'bg-red-100 text-red-700'
                                  }`}
                                >
                                  {event.status === 'OPEN'
                                    ? 'פתוח'
                                    : event.status === 'PAUSED'
                                      ? 'מושהה'
                                      : 'סגור'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-semibold text-gray-700 min-w-[3ch]">
                                    {fillPercentage}%
                                  </span>
                                  <div className="w-24 bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div
                                      className={`h-full transition-all duration-500 ${
                                        fillPercentage >= 90
                                          ? 'bg-red-500'
                                          : fillPercentage >= 70
                                            ? 'bg-yellow-500'
                                            : 'bg-green-500'
                                      }`}
                                      style={{ width: `${fillPercentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-gray-900">
                                    {event.registrationCount}
                                  </span>
                                  {event.waitlistCount > 0 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                                      +{event.waitlistCount} ברשימת המתנה
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

                {filteredEvents.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      מציג {filteredEvents.length} מתוך {events.length} אירועים
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Admins View */}
          {activeView === 'admins' && (
            <div className="space-y-3 sm:space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  משתמשים
                </h2>
                <p className="text-sm sm:text-base text-gray-600">ניהול משתמשי המערכת</p>
              </div>

              <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          אימייל
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          שם
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          תפקיד
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          בית ספר
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          סטטוס
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          פעולות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {admins.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-12 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <Users className="w-12 h-12 text-gray-300" />
                              <p className="text-gray-500 font-medium">
                                {loading ? 'טוען...' : 'לא נמצאו משתמשים'}
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        admins.map((admin) => (
                          <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900">
                                  {admin.email}
                                </span>
                                {!admin.emailVerified && (
                                  <span className="text-xs text-amber-600 mt-0.5">לא מאומת</span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">{admin.name}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                  admin.role === 'SUPER_ADMIN'
                                    ? 'bg-red-100 text-red-700'
                                    : admin.role === 'OWNER'
                                      ? 'bg-purple-100 text-purple-700'
                                      : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {admin.role}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-700">
                                {admin.schoolName || '-'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                                  admin.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}
                              >
                                {admin.isActive ? 'פעיל' : 'לא פעיל'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <button
                                onClick={() => setDeleteAdminModal({ isOpen: true, admin })}
                                disabled={admin.role === 'SUPER_ADMIN'}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                                  admin.role === 'SUPER_ADMIN'
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-red-50 text-red-600 hover:bg-red-100 hover:shadow-md'
                                }`}
                                title={
                                  admin.role === 'SUPER_ADMIN'
                                    ? 'לא ניתן למחוק Super Admin'
                                    : 'מחק משתמש'
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-sm">מחק</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {admins.length > 0 && (
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <p className="text-sm text-gray-600 text-center">
                      סה״כ {admins.length} משתמשים
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schools View */}
          {activeView === 'schools' && (
            <div className="space-y-3 sm:space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                  בתי ספר
                </h2>
                <p className="text-sm sm:text-base text-gray-600">ניהול כל בתי הספר במערכת</p>
              </div>

              {schools.length === 0 ? (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-8 sm:p-12 text-center">
                  <School className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                  <p className="text-sm sm:text-base text-gray-500 font-medium">
                    {loading ? 'טוען...' : 'לא נמצאו בתי ספר'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 sm:space-y-4">
                  {schools.map((school) => (
                    <div
                      key={school.id}
                      className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 hover:shadow-lg transition-all duration-300"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                              {school.name}
                            </h3>
                            <span
                              className={`px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full ${
                                school.isActive
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {school.isActive ? 'פעיל' : 'לא פעיל'}
                            </span>
                            <span className="px-2 sm:px-3 py-0.5 sm:py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-700">
                              {school.plan}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
                            <span className="font-medium">Slug:</span> {school.slug}
                          </p>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">אירועים</p>
                              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {school.eventCount}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">משתמשים</p>
                              <p className="text-xl sm:text-2xl font-bold text-gray-900">
                                {school.adminCount}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">סטטוס מנוי</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                {school.subscriptionStatus}
                              </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
                              <p className="text-xs text-gray-500 mb-0.5 sm:mb-1">נוצר ב</p>
                              <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                {new Date(school.createdAt).toLocaleDateString('he-IL')}
                              </p>
                            </div>
                          </div>

                          {school.admins.length > 0 && (
                            <div className="hidden sm:block">
                              <p className="text-sm font-semibold text-gray-700 mb-2 sm:mb-3">
                                משתמשים:
                              </p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {school.admins.map((admin) => (
                                  <span
                                    key={admin.id}
                                    className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition-colors"
                                  >
                                    <span className="font-medium text-gray-900">{admin.email}</span>
                                    <span className="text-xs text-gray-500">({admin.role})</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => setDeleteSchoolModal({ isOpen: true, school })}
                          className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 bg-red-50 text-red-600 rounded-lg sm:rounded-xl hover:bg-red-100 hover:shadow-md transition-all font-medium text-sm self-start sm:self-auto"
                        >
                          <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>מחק</span>
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="text-center pt-2 sm:pt-4">
                    <p className="text-xs sm:text-sm text-gray-600">
                      סה״כ {schools.length} בתי ספר
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Command Palette Modal - 2026 Modern Design */}
      {commandPaletteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200">
            {/* Search Input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200">
              <Command className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש מהיר... (ESC לסגירה)"
                autoFocus
                className="flex-1 bg-transparent border-none outline-none text-lg text-gray-900 placeholder-gray-400"
              />
              <button
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Quick Actions */}
            <div className="p-4 max-h-96 overflow-y-auto">
              <div className="mb-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  ניווט מהיר
                </p>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (item.id === 'logs') {
                            router.push('/admin/logs')
                          } else if (item.id === 'statistics') {
                            router.push('/admin/statistics')
                          } else {
                            setActiveView(item.id)
                          }
                          setCommandPaletteOpen(false)
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-right"
                      >
                        <Icon className="w-5 h-5 text-gray-600" />
                        <span className="flex-1 font-medium text-gray-900">{item.label}</span>
                        {item.badge !== null && (
                          <span className="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 mt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3 mb-2">
                  פעולות
                </p>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setActiveView('events')
                      setCommandPaletteOpen(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 rounded-xl transition-colors text-right"
                  >
                    <Search className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900">חיפוש אירועים</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">
                    ↑↓
                  </kbd>
                  <span>ניווט</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">
                    Enter
                  </kbd>
                  <span>בחירה</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-2 py-1 bg-white border border-gray-200 rounded font-mono">
                    ESC
                  </kbd>
                  <span>סגירה</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Admin Modal */}
      <Modal
        isOpen={deleteAdminModal.isOpen}
        onClose={() => !isDeleting && setDeleteAdminModal({ isOpen: false, admin: null })}
        title="⚠️ מחיקת משתמש - אזהרה!"
        type="error"
        size="md"
        closeOnBackdropClick={!isDeleting}
        closeOnEsc={!isDeleting}
        showCloseButton={!isDeleting}
        buttons={[
          {
            label: 'ביטול',
            onClick: () => setDeleteAdminModal({ isOpen: false, admin: null }),
            variant: 'secondary',
            disabled: isDeleting,
          },
          {
            label: isDeleting ? 'מוחק...' : 'מחק לצמיתות',
            onClick: handleDeleteAdmin,
            variant: 'danger',
            disabled: isDeleting,
            icon: <Trash2 className="w-4 h-4" />,
          },
        ]}
      >
        {deleteAdminModal.admin && (
          <div className="space-y-4" dir="rtl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">פעולה זו תמחק לצמיתות:</h4>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-center gap-2">
                      <UserX className="w-4 h-4" />
                      <span>
                        את המשתמש: <strong>{deleteAdminModal.admin.email}</strong>
                      </span>
                    </li>
                    {deleteAdminModal.admin.schoolName && (
                      <>
                        <li className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          <span>
                            את בית הספר: <strong>{deleteAdminModal.admin.schoolName}</strong>
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            את <strong>כל האירועים</strong> של בית הספר
                          </span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          <span>
                            את <strong>כל ההרשמות</strong> לאירועים
                          </span>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ פעולה זו לא ניתנת לביטול! כל המידע יימחק לצמיתות מהמערכת.
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-600 text-sm">האם אתה בטוח לחלוטין שברצונך להמשיך?</p>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete School Modal */}
      <Modal
        isOpen={deleteSchoolModal.isOpen}
        onClose={() => !isDeleting && setDeleteSchoolModal({ isOpen: false, school: null })}
        title="⚠️ מחיקת בית ספר - אזהרה!"
        type="error"
        size="md"
        closeOnBackdropClick={!isDeleting}
        closeOnEsc={!isDeleting}
        showCloseButton={!isDeleting}
        buttons={[
          {
            label: 'ביטול',
            onClick: () => setDeleteSchoolModal({ isOpen: false, school: null }),
            variant: 'secondary',
            disabled: isDeleting,
          },
          {
            label: isDeleting ? 'מוחק...' : 'מחק לצמיתות',
            onClick: handleDeleteSchool,
            variant: 'danger',
            disabled: isDeleting,
            icon: <Building2 className="w-4 h-4" />,
          },
        ]}
      >
        {deleteSchoolModal.school && (
          <div className="space-y-4" dir="rtl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-red-900 mb-2">פעולה זו תמחק לצמיתות:</h4>
                  <ul className="space-y-2 text-sm text-red-800">
                    <li className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>
                        את בית הספר: <strong>{deleteSchoolModal.school.name}</strong>
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        <strong>{deleteSchoolModal.school.eventCount}</strong> אירועים
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        <strong>{deleteSchoolModal.school.adminCount}</strong> משתמשים
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Trash2 className="w-4 h-4" />
                      <span>
                        את <strong>כל ההרשמות</strong> לאירועים
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {deleteSchoolModal.school.admins.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 mb-2">משתמשים שיימחקו:</p>
                <div className="flex flex-wrap gap-1">
                  {deleteSchoolModal.school.admins.map((admin) => (
                    <span
                      key={admin.id}
                      className="text-xs bg-white px-2 py-1 rounded border border-blue-300"
                    >
                      {admin.email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-900 font-medium">
                ⚠️ פעולה זו לא ניתנת לביטול! כל המידע יימחק לצמיתות מהמערכת.
              </p>
            </div>

            <div className="text-center">
              <p className="text-gray-600 text-sm">האם אתה בטוח לחלוטין שברצונך להמשיך?</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
