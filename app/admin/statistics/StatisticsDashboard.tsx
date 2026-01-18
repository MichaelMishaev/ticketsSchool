'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  DollarSign,
  Users,
  BarChart3,
  CheckCircle2,
  Activity,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ArrowLeft,
} from 'lucide-react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts'

// Types
type DateRange = '7d' | '30d' | '90d' | '1y'
type ActiveTab = 'revenue' | 'registrations' | 'capacity' | 'checkins' | 'platform'

interface RevenueData {
  totalRevenue: number
  totalRefunds: number
  netRevenue: number
  failedPayments: number
  averagePayment: number
  completedPayments: number
  byDay: Array<{ date: string; revenue: number; refunds: number }>
  byStatus: Array<{ status: string; count: number; amount: number }>
  bySchool: Array<{ schoolName: string; revenue: number; count: number }>
  previousPeriod: {
    totalRevenue: number
    completedPayments: number
  }
}

interface RegistrationsData {
  totalRegistrations: number
  confirmedCount: number
  waitlistCount: number
  cancelledCount: number
  conversionRate: number
  cancellationRate: number
  byDay: Array<{ date: string; confirmed: number; waitlist: number; cancelled: number }>
  bySchool: Array<{ schoolName: string; confirmed: number; waitlist: number }>
  topEvents: Array<{ eventTitle: string; schoolName: string; registrations: number }>
  previousPeriod: {
    totalRegistrations: number
    conversionRate: number
  }
}

interface CapacityData {
  totalCapacity: number
  totalReserved: number
  averageFillRate: number
  waitlistPressure: number
  eventsAtCapacity: number
  eventsOverCapacity: number
  fillDistribution: Array<{ range: string; count: number }>
  bySchool: Array<{ schoolName: string; capacity: number; reserved: number; fillRate: number }>
  previousPeriod: {
    averageFillRate: number
    eventsAtCapacity: number
  }
}

interface CheckinsData {
  totalCheckedIn: number
  totalNotCheckedIn: number
  attendanceRate: number
  onTimeCount: number
  lateCount: number
  averageMinutesLate: number
  bySchool: Array<{ schoolName: string; checkedIn: number; notCheckedIn: number; rate: number }>
  byEvent: Array<{
    eventTitle: string
    schoolName: string
    checkedIn: number
    total: number
    rate: number
  }>
  previousPeriod: {
    attendanceRate: number
    lateCount: number
  }
}

interface PlatformData {
  totalSchools: number
  activeSchools: number
  inactiveSchools: number
  byPlan: Array<{ plan: string; count: number }>
  byStatus: Array<{ status: string; count: number }>
  totalAdmins: number
  activeAdmins: number
  newSchoolsTrend: Array<{ date: string; count: number }>
  trialExpiringSoon: Array<{ schoolName: string; expiresAt: string }>
  usageMetrics: {
    eventsCreated: number
    registrationsProcessed: number
    emailsSent: number
  }
  previousPeriod: {
    totalSchools: number
    activeAdmins: number
  }
}

// Color palette for charts
const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

// Date range options
const DATE_RANGES: Array<{ value: DateRange; label: string }> = [
  { value: '7d', label: '7 ימים' },
  { value: '30d', label: '30 ימים' },
  { value: '90d', label: '90 ימים' },
  { value: '1y', label: 'שנה' },
]

// Tab configuration - short labels for mobile
const TABS: Array<{ id: ActiveTab; label: string; shortLabel: string; icon: React.ElementType }> = [
  { id: 'revenue', label: 'הכנסות', shortLabel: 'הכנסות', icon: DollarSign },
  { id: 'registrations', label: 'הרשמות', shortLabel: 'הרשמות', icon: Users },
  { id: 'capacity', label: 'תפוסה', shortLabel: 'תפוסה', icon: BarChart3 },
  { id: 'checkins', label: 'נוכחות', shortLabel: 'נוכחות', icon: CheckCircle2 },
  { id: 'platform', label: 'בריאות המערכת', shortLabel: 'מערכת', icon: Activity },
]

export default function StatisticsDashboard() {
  const router = useRouter()
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [activeTab, setActiveTab] = useState<ActiveTab>('revenue')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data states
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null)
  const [registrationsData, setRegistrationsData] = useState<RegistrationsData | null>(null)
  const [capacityData, setCapacityData] = useState<CapacityData | null>(null)
  const [checkinsData, setCheckinsData] = useState<CheckinsData | null>(null)
  const [platformData, setPlatformData] = useState<PlatformData | null>(null)

  const getDateParams = useCallback(() => {
    const now = new Date()
    const to = now.toISOString()
    let from: Date

    switch (dateRange) {
      case '7d':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case '30d':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case '90d':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case '1y':
        from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }

    return { from: from.toISOString(), to }
  }, [dateRange])

  const fetchData = useCallback(
    async (tab: ActiveTab) => {
      const { from, to } = getDateParams()
      const params = new URLSearchParams({ from, to })

      try {
        const response = await fetch(`/api/admin/super/statistics/${tab}?${params}`)
        if (response.status === 403) {
          router.push('/admin')
          return null
        }
        if (!response.ok) {
          throw new Error(`Failed to fetch ${tab} data`)
        }
        return await response.json()
      } catch (err) {
        console.error(`Error fetching ${tab} data:`, err)
        throw err
      }
    },
    [getDateParams, router]
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Fetch data for the active tab
      const data = await fetchData(activeTab)
      if (!data) return

      switch (activeTab) {
        case 'revenue':
          setRevenueData(data)
          break
        case 'registrations':
          setRegistrationsData(data)
          break
        case 'capacity':
          setCapacityData(data)
          break
        case 'checkins':
          setCheckinsData(data)
          break
        case 'platform':
          setPlatformData(data)
          break
      }
    } catch (err) {
      setError('שגיאה בטעינת הנתונים. אנא נסה שוב.')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, fetchData])

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadData()
    setRefreshing(false)
  }

  const handleExport = async (type: string) => {
    const { from, to } = getDateParams()
    const params = new URLSearchParams({ type, from, to })

    try {
      const response = await fetch(`/api/admin/super/statistics/export?${params}`)
      if (!response.ok) throw new Error('Export failed')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `statistics_${type}_${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Export error:', err)
      alert('שגיאה בייצוא הנתונים')
    }
  }

  useEffect(() => {
    loadData()
  }, [loadData])

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS',
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Format percentage
  const formatPercent = (value: number) => `${Math.round(value)}%`

  // Format date for charts
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })
  }

  // Calculate percentage change
  const calculateChange = (
    current: number,
    previous: number
  ): { value: number; isPositive: boolean } => {
    if (previous === 0) return { value: 0, isPositive: true }
    const change = ((current - previous) / previous) * 100
    return { value: Math.abs(Math.round(change)), isPositive: change >= 0 }
  }

  // Stat Card Component
  const StatCard = ({
    title,
    value,
    previousValue,
    format = 'number',
    icon: Icon,
    color = 'blue',
  }: {
    title: string
    value: number
    previousValue?: number
    format?: 'number' | 'currency' | 'percent'
    icon: React.ElementType
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
  }) => {
    const formattedValue =
      format === 'currency'
        ? formatCurrency(value)
        : format === 'percent'
          ? formatPercent(value)
          : value.toLocaleString('he-IL')

    const change = previousValue !== undefined ? calculateChange(value, previousValue) : null

    const colorClasses = {
      blue: 'bg-blue-100 text-blue-600',
      green: 'bg-green-100 text-green-600',
      purple: 'bg-purple-100 text-purple-600',
      orange: 'bg-orange-100 text-orange-600',
      red: 'bg-red-100 text-red-600',
    }

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{formattedValue}</p>
            {change && (
              <div
                className={`flex items-center gap-1 mt-2 text-sm ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}
              >
                {change.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{change.value}% מהתקופה הקודמת</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    )
  }

  // Loading skeleton
  if (
    loading &&
    !revenueData &&
    !registrationsData &&
    !capacityData &&
    !checkinsData &&
    !platformData
  ) {
    return (
      <div className="space-y-6" dir="rtl">
        <div className="flex items-center justify-between">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="flex gap-2">
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="h-4 bg-gray-200 rounded w-20 mb-4 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="h-64 bg-gray-100 rounded animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/super"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">חזרה</span>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">סטטיסטיקות מערכת</h1>
            <p className="text-sm text-gray-500 mt-1">ניתוח מקיף של כל הפעילות במערכת</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Date Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {DATE_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setDateRange(range.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          {/* Export Button */}
          <button
            onClick={() => handleExport(activeTab)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">ייצוא CSV</span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">{error}</div>
      )}

      {/* Tabs - Responsive Grid */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-1 px-2 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="sm:hidden">{tab.shortLabel}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content based on active tab */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin" />
        </div>
      ) : (
        <>
          {/* Revenue Tab */}
          {activeTab === 'revenue' && revenueData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="הכנסות כוללות"
                  value={revenueData.totalRevenue}
                  previousValue={revenueData.previousPeriod.totalRevenue}
                  format="currency"
                  icon={DollarSign}
                  color="green"
                />
                <StatCard
                  title="החזרים"
                  value={revenueData.totalRefunds}
                  format="currency"
                  icon={TrendingDown}
                  color="red"
                />
                <StatCard
                  title="הכנסות נטו"
                  value={revenueData.netRevenue}
                  format="currency"
                  icon={TrendingUp}
                  color="blue"
                />
                <StatCard
                  title="תשלומים שהושלמו"
                  value={revenueData.completedPayments}
                  previousValue={revenueData.previousPeriod.completedPayments}
                  icon={CheckCircle2}
                  color="purple"
                />
              </div>

              {/* Revenue Trend Chart */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">מגמת הכנסות</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis tickFormatter={(v) => `₪${v}`} />
                      <Tooltip
                        labelFormatter={formatDate}
                        formatter={(value) => [formatCurrency(Number(value) || 0), '']}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        name="הכנסות"
                        stroke="#22c55e"
                        fill="#22c55e"
                        fillOpacity={0.3}
                      />
                      <Area
                        type="monotone"
                        dataKey="refunds"
                        name="החזרים"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Payment Status Distribution */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">פילוח סטטוס תשלומים</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={revenueData.byStatus}
                          dataKey="count"
                          nameKey="status"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                        >
                          {revenueData.byStatus.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [Number(value) || 0, 'מספר']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Top Schools by Revenue */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">בתי ספר מובילים</h3>
                  <div className="space-y-3">
                    {revenueData.bySchool.slice(0, 5).map((school, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="font-medium text-gray-900">{school.schoolName}</span>
                        </div>
                        <span className="text-green-600 font-semibold">
                          {formatCurrency(school.revenue)}
                        </span>
                      </div>
                    ))}
                    {revenueData.bySchool.length === 0 && (
                      <p className="text-gray-500 text-center py-4">אין נתונים להצגה</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Registrations Tab */}
          {activeTab === 'registrations' && registrationsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="סה״כ הרשמות"
                  value={registrationsData.totalRegistrations}
                  previousValue={registrationsData.previousPeriod.totalRegistrations}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="מאושרות"
                  value={registrationsData.confirmedCount}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="שיעור המרה"
                  value={registrationsData.conversionRate}
                  previousValue={registrationsData.previousPeriod.conversionRate}
                  format="percent"
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="שיעור ביטולים"
                  value={registrationsData.cancellationRate}
                  format="percent"
                  icon={TrendingDown}
                  color="red"
                />
              </div>

              {/* Registrations Trend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">מגמת הרשמות</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={registrationsData.byDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Legend />
                      <Bar dataKey="confirmed" name="מאושרות" fill="#22c55e" stackId="stack" />
                      <Bar dataKey="waitlist" name="המתנה" fill="#f59e0b" stackId="stack" />
                      <Bar dataKey="cancelled" name="בוטלו" fill="#ef4444" stackId="stack" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Events */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">אירועים מובילים לפי הרשמות</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          אירוע
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          בית ספר
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          הרשמות
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {registrationsData.topEvents.slice(0, 10).map((event, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {event.eventTitle}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{event.schoolName}</td>
                          <td className="px-4 py-3 text-sm font-semibold text-purple-600">
                            {event.registrations}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {registrationsData.topEvents.length === 0 && (
                    <p className="text-gray-500 text-center py-8">אין נתונים להצגה</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Capacity Tab */}
          {activeTab === 'capacity' && capacityData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="קיבולת כוללת"
                  value={capacityData.totalCapacity}
                  icon={Users}
                  color="blue"
                />
                <StatCard
                  title="מקומות תפוסים"
                  value={capacityData.totalReserved}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="שיעור תפוסה ממוצע"
                  value={capacityData.averageFillRate}
                  previousValue={capacityData.previousPeriod.averageFillRate}
                  format="percent"
                  icon={BarChart3}
                  color="purple"
                />
                <StatCard
                  title="אירועים בקיבולת מלאה"
                  value={capacityData.eventsAtCapacity}
                  previousValue={capacityData.previousPeriod.eventsAtCapacity}
                  icon={Activity}
                  color="orange"
                />
              </div>

              {/* Fill Rate Distribution */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">התפלגות תפוסה</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={capacityData.fillDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="range" type="category" width={100} />
                        <Tooltip />
                        <Bar dataKey="count" name="מספר אירועים" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Schools by Capacity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">תפוסה לפי בית ספר</h3>
                  <div className="space-y-4">
                    {capacityData.bySchool.slice(0, 5).map((school, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-gray-900">{school.schoolName}</span>
                          <span className="text-gray-600">{school.fillRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              school.fillRate >= 90
                                ? 'bg-red-500'
                                : school.fillRate >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(100, school.fillRate)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {capacityData.bySchool.length === 0 && (
                      <p className="text-gray-500 text-center py-4">אין נתונים להצגה</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Waitlist Pressure */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">לחץ רשימת המתנה</h3>
                  <span className="text-2xl font-bold text-orange-600">
                    {capacityData.waitlistPressure} מקומות
                  </span>
                </div>
                <p className="text-gray-600">סך כל המקומות ברשימת ההמתנה בכל האירועים הפעילים</p>
              </div>
            </div>
          )}

          {/* Check-ins Tab */}
          {activeTab === 'checkins' && checkinsData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="נכחו"
                  value={checkinsData.totalCheckedIn}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="לא הגיעו"
                  value={checkinsData.totalNotCheckedIn}
                  icon={Users}
                  color="red"
                />
                <StatCard
                  title="שיעור נוכחות"
                  value={checkinsData.attendanceRate}
                  previousValue={checkinsData.previousPeriod.attendanceRate}
                  format="percent"
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="הגיעו באיחור"
                  value={checkinsData.lateCount}
                  previousValue={checkinsData.previousPeriod.lateCount}
                  icon={Calendar}
                  color="orange"
                />
              </div>

              {/* Attendance by School */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">נוכחות לפי בית ספר</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={checkinsData.bySchool}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="schoolName" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="checkedIn" name="נכחו" fill="#22c55e" />
                      <Bar dataKey="notCheckedIn" name="לא הגיעו" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Top Events by Attendance */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">אירועים לפי שיעור נוכחות</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          אירוע
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          בית ספר
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          נכחו / סה״כ
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          שיעור
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {checkinsData.byEvent.slice(0, 10).map((event, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">
                            {event.eventTitle}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{event.schoolName}</td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {event.checkedIn} / {event.total}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span
                              className={`font-semibold ${event.rate >= 80 ? 'text-green-600' : event.rate >= 60 ? 'text-yellow-600' : 'text-red-600'}`}
                            >
                              {event.rate}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {checkinsData.byEvent.length === 0 && (
                    <p className="text-gray-500 text-center py-8">אין נתונים להצגה</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Platform Tab */}
          {activeTab === 'platform' && platformData && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  title="סה״כ בתי ספר"
                  value={platformData.totalSchools}
                  previousValue={platformData.previousPeriod.totalSchools}
                  icon={Activity}
                  color="blue"
                />
                <StatCard
                  title="בתי ספר פעילים"
                  value={platformData.activeSchools}
                  icon={CheckCircle2}
                  color="green"
                />
                <StatCard
                  title="סה״כ משתמשים"
                  value={platformData.totalAdmins}
                  icon={Users}
                  color="purple"
                />
                <StatCard
                  title="משתמשים פעילים"
                  value={platformData.activeAdmins}
                  previousValue={platformData.previousPeriod.activeAdmins}
                  icon={TrendingUp}
                  color="orange"
                />
              </div>

              {/* Plans & Usage */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* By Plan */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">בתי ספר לפי תוכנית</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={platformData.byPlan}
                          dataKey="count"
                          nameKey="plan"
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          label={({ name, percent }) =>
                            `${name} (${((percent || 0) * 100).toFixed(0)}%)`
                          }
                        >
                          {platformData.byPlan.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Usage Metrics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">מדדי שימוש (תקופה נבחרת)</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700">אירועים שנוצרו</span>
                      <span className="text-2xl font-bold text-blue-600">
                        {platformData.usageMetrics.eventsCreated}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-700">הרשמות שעובדו</span>
                      <span className="text-2xl font-bold text-green-600">
                        {platformData.usageMetrics.registrationsProcessed}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700">אימיילים שנשלחו</span>
                      <span className="text-2xl font-bold text-purple-600">
                        {platformData.usageMetrics.emailsSent}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* New Schools Trend */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">בתי ספר חדשים</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={platformData.newSchoolsTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickFormatter={formatDate} />
                      <YAxis />
                      <Tooltip labelFormatter={formatDate} />
                      <Area
                        type="monotone"
                        dataKey="count"
                        name="בתי ספר חדשים"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Trial Expiring Soon */}
              {platformData.trialExpiringSoon.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    תקופות ניסיון שעומדות לפוג
                  </h3>
                  <div className="space-y-2">
                    {platformData.trialExpiringSoon.map((school, idx) => (
                      <div
                        key={idx}
                        className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg"
                      >
                        <span className="font-medium text-gray-900">{school.schoolName}</span>
                        <span className="text-sm text-yellow-700">
                          פג תוקף: {new Date(school.expiresAt).toLocaleDateString('he-IL')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
