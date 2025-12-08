'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import SearchableSelect from '@/components/SearchableSelect'

interface Lead {
  name: string
  phone: string
  email: string | null
  events: Array<{ id: string; name: string; date: Date; status: string }>
  confirmedCount: number
  waitlistCount: number
  latestRegistration: Date
  totalGuests: number
}

interface Event {
  id: string
  title: string
}

type SortField = 'name' | 'phone' | 'eventsCount' | 'latestRegistration'
type SortDirection = 'asc' | 'desc'

export default function LeadsPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [eventFilter, setEventFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Sorting
  const [sortField, setSortField] = useState<SortField>('latestRegistration')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // Fetch events for filter dropdown
  useEffect(() => {
    async function fetchEvents() {
      try {
        const res = await fetch('/api/events')
        if (!res.ok) {
          console.error('Failed to fetch events:', res.status)
          return
        }
        const data = await res.json()
        // /api/events returns array directly
        const eventList = Array.isArray(data) ? data : []
        setEvents(eventList)
      } catch (err) {
        console.error('Failed to fetch events:', err)
      }
    }
    fetchEvents()
  }, [])

  // Fetch leads data
  useEffect(() => {
    async function fetchLeads() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (eventFilter) params.append('eventId', eventFilter)
        if (statusFilter) params.append('status', statusFilter)
        if (searchQuery) params.append('search', searchQuery)
        if (dateFrom) params.append('dateFrom', dateFrom)
        if (dateTo) params.append('dateTo', dateTo)

        const res = await fetch(`/api/admin/leads?${params.toString()}`)
        if (!res.ok) {
          if (res.status === 401) {
            router.push('/admin/login')
            return
          }
          throw new Error('Failed to fetch leads')
        }

        const data = await res.json()
        setLeads(data.leads || [])
        setError('')
      } catch (err) {
        console.error('Failed to fetch leads:', err)
        setError('שגיאה בטעינת הלידים')
      } finally {
        setLoading(false)
      }
    }

    fetchLeads()
  }, [eventFilter, statusFilter, searchQuery, dateFrom, dateTo, router])

  // Sort leads
  const sortedLeads = [...leads].sort((a, b) => {
    let aVal: any
    let bVal: any

    switch (sortField) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'phone':
        aVal = a.phone
        bVal = b.phone
        break
      case 'eventsCount':
        aVal = a.events.length
        bVal = b.events.length
        break
      case 'latestRegistration':
        aVal = new Date(a.latestRegistration).getTime()
        bVal = new Date(b.latestRegistration).getTime()
        break
      default:
        return 0
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  // Handle column header click for sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['שם', 'טלפון', 'אירועים', 'מאושרים', 'ממתינים', 'רישום אחרון']
    const rows = sortedLeads.map(lead => [
      lead.name,
      lead.phone,
      lead.events.map(e => e.name).join('; '),
      lead.confirmedCount.toString(),
      lead.waitlistCount.toString(),
      new Date(lead.latestRegistration).toLocaleDateString('he-IL'),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `leads-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>
    return sortDirection === 'asc' ? <span>↑</span> : <span>↓</span>
  }

  // Calculate stats from leads
  const stats = {
    total: sortedLeads.length,
    confirmed: sortedLeads.reduce((sum, lead) => sum + lead.confirmedCount, 0),
    waitlist: sortedLeads.reduce((sum, lead) => sum + lead.waitlistCount, 0),
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">לידים</h1>
          <p className="mt-2 text-gray-600">
            ניהול כל הלקוחות והנרשמים מכל האירועים
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {/* Total Leads */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סך הכל לידים</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Confirmed */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">רשומים מאושרים</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{stats.confirmed}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Waitlist */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">רשימת המתנה</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600 mt-2">{stats.waitlist}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Event Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                אירוע
              </label>
              <SearchableSelect
                options={[
                  { value: '', label: 'כל האירועים' },
                  ...events.map(event => ({
                    value: event.id,
                    label: event.title
                  }))
                ]}
                value={eventFilter}
                onChange={setEventFilter}
                placeholder="חפש אירוע..."
                emptyMessage="לא נמצאו אירועים"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                סטטוס
              </label>
              <select
                name="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">הכל</option>
                <option value="CONFIRMED">מאושרים בלבד</option>
                <option value="WAITLIST">ממתינים בלבד</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                מתאריך
              </label>
              <input
                type="date"
                name="dateFrom"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                עד תאריך
              </label>
              <input
                type="date"
                name="dateTo"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              חיפוש (שם, טלפון, אימייל)
            </label>
            <input
              type="text"
              name="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חפש לפי שם, טלפון או אימייל..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            סה"כ {sortedLeads.length} לידים
          </div>
          <button
            onClick={handleExportCSV}
            disabled={sortedLeads.length === 0}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            ייצוא ל-CSV
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Skeleton Loading */}
        {loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שם</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">טלפון</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">אירועים</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סטטוס</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">רישום אחרון</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {[...Array(5)].map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-40"></div>
                          <div className="h-4 bg-gray-200 rounded w-36"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center gap-2">
                        שם
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('phone')}
                    >
                      <div className="flex items-center gap-2">
                        טלפון
                        <SortIcon field="phone" />
                      </div>
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('eventsCount')}
                    >
                      <div className="flex items-center gap-2">
                        אירועים
                        <SortIcon field="eventsCount" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      סטטוס
                    </th>
                    <th
                      className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort('latestRegistration')}
                    >
                      <div className="flex items-center gap-2">
                        רישום אחרון
                        <SortIcon field="latestRegistration" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-16">
                        <div className="text-center">
                          {/* Icon */}
                          <div className="flex justify-center mb-4">
                            <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                              </svg>
                            </div>
                          </div>

                          {/* Message */}
                          <h3 className="text-lg font-medium text-gray-900 mb-2">
                            לא נמצאו לידים
                          </h3>
                          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                            {eventFilter || statusFilter || searchQuery || dateFrom || dateTo
                              ? 'לא נמצאו לידים התואמים את הפילטרים שבחרת'
                              : 'עדיין אין לידים במערכת'}
                          </p>

                          {/* Suggestions */}
                          {(eventFilter || statusFilter || searchQuery || dateFrom || dateTo) && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto mb-6 text-right">
                              <p className="text-sm font-medium text-blue-900 mb-2">💡 נסה:</p>
                              <ul className="text-sm text-blue-800 space-y-1">
                                {searchQuery && <li>• לחפש משהו אחר</li>}
                                {eventFilter && <li>• לבחור אירוע אחר</li>}
                                {statusFilter && <li>• לשנות את הסטטוס</li>}
                                {(dateFrom || dateTo) && <li>• להרחיב את טווח התאריכים</li>}
                                <li>• לנקות חלק מהפילטרים</li>
                              </ul>
                            </div>
                          )}

                          {/* Clear Filters Button */}
                          {(eventFilter || statusFilter || searchQuery || dateFrom || dateTo) && (
                            <button
                              onClick={() => {
                                setEventFilter('')
                                setStatusFilter('')
                                setSearchQuery('')
                                setDateFrom('')
                                setDateTo('')
                              }}
                              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                            >
                              <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              נקה את כל הפילטרים
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    sortedLeads.map((lead, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {lead.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 ltr">
                          {lead.phone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          <div className="space-y-1">
                            {lead.events.map((event, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <span>{event.name}</span>
                                <span className={`text-xs px-2 py-0.5 rounded ${
                                  event.status === 'CONFIRMED'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {event.status === 'CONFIRMED' ? '✓' : '⏰'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div className="space-y-1">
                            <div>{lead.confirmedCount} ✓ מאושרים</div>
                            <div>{lead.waitlistCount} ⏰ ממתינים</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(lead.latestRegistration).toLocaleDateString('he-IL')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
