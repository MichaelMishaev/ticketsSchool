'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Users,
  Clock,
  Edit,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  ChevronDown,
} from 'lucide-react'
import { format } from 'date-fns'
import CreateEventDropdown from '@/components/CreateEventDropdown'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

type EventTypeFilter = 'ALL' | 'CAPACITY_BASED' | 'TABLE_BASED'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('ALL')

  // Search by confirmation code
  const [searchCode, setSearchCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResult, setSearchResult] = useState<any>(null)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Delete confirmation modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean
    eventId: string | null
    eventTitle: string
    isDeleting: boolean
  }>({ isOpen: false, eventId: null, eventTitle: '', isDeleting: false })

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events')
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Open delete confirmation modal
  const openDeleteModal = (eventId: string, eventTitle: string) => {
    setDeleteModal({ isOpen: true, eventId, eventTitle, isDeleting: false })
  }

  // Close delete modal
  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, eventId: null, eventTitle: '', isDeleting: false })
  }

  // Confirm delete action
  const confirmDelete = async () => {
    if (!deleteModal.eventId) return

    setDeleteModal((prev) => ({ ...prev, isDeleting: true }))

    try {
      const response = await fetch(`/api/events/${deleteModal.eventId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        closeDeleteModal()
        fetchEvents() // Refresh the list
      } else {
        const errorData = await response.json()
        closeDeleteModal()
        alert(errorData.error || 'שגיאה במחיקת האירוע')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
      closeDeleteModal()
      alert('שגיאה במחיקת האירוע')
    }
  }

  const handleStatusChange = async (eventId: string, newStatus: 'OPEN' | 'PAUSED' | 'CLOSED') => {
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (response.ok) {
        fetchEvents() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const copyShareLink = (event: any) => {
    const link = `${window.location.origin}/p/${event.school.slug}/${event.slug}`
    navigator.clipboard.writeText(link)
    setCopiedEventId(event.id)
    setTimeout(() => setCopiedEventId(null), 2000)
  }

  const handleSearchByCode = async () => {
    if (!searchCode.trim()) {
      setSearchError('נא להזין קוד אישור')
      return
    }

    setIsSearching(true)
    setSearchError(null)
    setSearchResult(null)

    try {
      const response = await fetch(
        `/api/registrations/search?code=${encodeURIComponent(searchCode.trim())}`
      )
      const data = await response.json()

      if (response.ok) {
        setSearchResult(data.data)
      } else {
        setSearchError(data.error || 'שגיאה בחיפוש')
      }
    } catch (error) {
      console.error('Error searching by code:', error)
      setSearchError('שגיאה בחיפוש קוד אישור')
    } finally {
      setIsSearching(false)
    }
  }

  const clearSearch = () => {
    setSearchCode('')
    setSearchResult(null)
    setSearchError(null)
  }

  const getGameTypeIcon = (gameType: string): string => {
    const normalizedType = gameType.toLowerCase().trim()

    // Restaurant/dining
    if (normalizedType.includes('מסעדה') || normalizedType.includes('restaurant')) return '🍽️'
    if (
      normalizedType.includes('בית קפה') ||
      normalizedType.includes('cafe') ||
      normalizedType.includes('coffee')
    )
      return '☕'
    if (normalizedType.includes('בר') || normalizedType.includes('bar')) return '🍺'

    // Sports
    if (
      normalizedType.includes('כדורגל') ||
      normalizedType.includes('soccer') ||
      normalizedType.includes('football')
    )
      return '⚽'
    if (normalizedType.includes('כדורסל') || normalizedType.includes('basketball')) return '🏀'
    if (normalizedType.includes('טניס') || normalizedType.includes('tennis')) return '🎾'
    if (normalizedType.includes('שחייה') || normalizedType.includes('swimming')) return '🏊'

    // Events
    if (normalizedType.includes('סדנה') || normalizedType.includes('workshop')) return '🛠️'
    if (normalizedType.includes('הרצאה') || normalizedType.includes('lecture')) return '🎤'
    if (normalizedType.includes('כנס') || normalizedType.includes('conference')) return '🎪'
    if (normalizedType.includes('מסיבה') || normalizedType.includes('party')) return '🎉'

    // Default fallback
    return '📅'
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      OPEN: { text: 'פתוח', className: 'bg-green-100 text-green-800' },
      PAUSED: { text: 'מושהה', className: 'bg-yellow-100 text-yellow-800' },
      CLOSED: { text: 'סגור', className: 'bg-gray-100 text-gray-800' },
    }
    const { text, className } = statusMap[status] || statusMap.CLOSED
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}
      >
        {text}
      </span>
    )
  }

  // Get event timing status for badge display
  // Returns: 'active' | 'registration-ended' | 'event-ended'
  const getEventTimingStatus = (
    startAt: string | Date
  ): 'active' | 'registration-ended' | 'event-ended' => {
    const now = new Date()
    const eventStart = new Date(startAt)

    // Event hasn't started yet
    if (now <= eventStart) {
      return 'active'
    }

    // Check if it's the same calendar day
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDate = new Date(
      eventStart.getFullYear(),
      eventStart.getMonth(),
      eventStart.getDate()
    )

    if (nowDate.getTime() === eventDate.getTime()) {
      // Same day as event - registration ended but event ongoing
      return 'registration-ended'
    }

    // Next day or later - event fully ended
    return 'event-ended'
  }

  // Filter events based on selected type
  const filteredEvents = events.filter((event) => {
    if (eventTypeFilter === 'ALL') return true
    return event.eventType === eventTypeFilter
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">טוען אירועים...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">אירועים</h1>
      </div>

      {/* Search by Confirmation Code - Collapsible */}
      <details className="mb-6 group">
        <summary className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors list-none [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            חיפוש לפי קוד אישור
          </span>
          <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-2 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByCode()}
                placeholder="הזן קוד אישור (לדוגמה: 49CKLZ)"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium text-center tracking-wider"
                dir="ltr"
              />
            </div>
            <button
              onClick={handleSearchByCode}
              disabled={isSearching || !searchCode.trim()}
              className="sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[48px] flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              <span>{isSearching ? 'מחפש...' : 'חפש'}</span>
            </button>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{searchError}</p>
            </div>
          )}

          {/* Search Result */}
          {searchResult && (
            <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-lg font-bold text-green-900">נמצאה הרשמה!</h3>
                <button
                  onClick={clearSearch}
                  className="text-green-700 hover:text-green-900"
                  title="נקה חיפוש"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">קוד אישור:</span>
                  <span className="font-mono font-bold text-green-800">
                    {searchResult.confirmationCode}
                  </span>
                </div>
                {searchResult.data?.name && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">שם:</span>
                    <span className="text-gray-900">{searchResult.data.name}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">טלפון:</span>
                  <span className="text-gray-900 font-mono" dir="ltr">
                    {searchResult.phoneNumber}
                  </span>
                </div>
                {searchResult.data?.email && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">אימייל:</span>
                    <span className="text-gray-900" dir="ltr">
                      {searchResult.data.email}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">סטטוס:</span>
                  <span
                    className={`font-semibold ${
                      searchResult.status === 'CONFIRMED'
                        ? 'text-green-700'
                        : searchResult.status === 'WAITLIST'
                          ? 'text-yellow-700'
                          : 'text-red-700'
                    }`}
                  >
                    {searchResult.status === 'CONFIRMED'
                      ? '✓ אושר'
                      : searchResult.status === 'WAITLIST'
                        ? '⏳ רשימת המתנה'
                        : '✕ בוטל'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">אירוע:</span>
                  <span className="text-gray-900">{searchResult.event.title}</span>
                </div>
                {searchResult.event.school && (
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-700">בית ספר:</span>
                    <span className="text-gray-900">{searchResult.event.school.name}</span>
                  </div>
                )}
              </div>

              <Link
                href={`/admin/events/${searchResult.eventId}`}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 min-h-[48px]"
              >
                <Edit className="w-5 h-5" />
                <span>עבור לאירוע וההרשמה</span>
              </Link>
            </div>
          )}
        </div>
      </details>

      {/* Event Type Filter - 2025 UX Best Practices */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">סינון</h2>
          {eventTypeFilter !== 'ALL' && (
            <button
              onClick={() => setEventTypeFilter('ALL')}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              נקה סינון
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-3" dir="rtl">
          {/* All Events */}
          <button
            onClick={() => setEventTypeFilter('ALL')}
            className={`group relative px-3 py-2 sm:px-5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm min-h-[40px] sm:min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>כל האירועים</span>
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                  eventTypeFilter === 'ALL'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                }`}
              >
                {events.length}
              </span>
            </span>
          </button>

          {/* Regular Events */}
          <button
            onClick={() => setEventTypeFilter('CAPACITY_BASED')}
            className={`group relative px-3 py-2 sm:px-5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm min-h-[40px] sm:min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'CAPACITY_BASED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>אירועים</span>
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                  eventTypeFilter === 'CAPACITY_BASED'
                    ? 'bg-purple-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-700'
                }`}
              >
                {events.filter((e) => e.eventType === 'CAPACITY_BASED').length}
              </span>
            </span>
          </button>

          {/* Restaurant Events */}
          <button
            onClick={() => setEventTypeFilter('TABLE_BASED')}
            className={`group relative px-3 py-2 sm:px-5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm min-h-[40px] sm:min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'TABLE_BASED'
                ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span>מסעדות</span>
              <span
                className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${
                  eventTypeFilter === 'TABLE_BASED'
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600 group-hover:bg-orange-100 group-hover:text-orange-700'
                }`}
              >
                {events.filter((e) => e.eventType === 'TABLE_BASED').length}
              </span>
            </span>
          </button>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-500 mb-4">
            {events.length === 0 ? 'אין אירועים עדיין' : 'לא נמצאו אירועים מסוג זה'}
          </p>
          {events.length === 0 && (
            <div className="flex justify-center">
              <CreateEventDropdown variant="page" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white shadow-md rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="px-3 py-4 sm:px-6 sm:py-5">
                {/* Header Section - Title and Status */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4 pb-4 border-b border-gray-200">
                  {/* Left side: Title and metadata */}
                  <div className="flex-1">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3">
                      {event.title}
                    </h3>

                    {/* Metadata Row */}
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center text-sm text-gray-700">
                        <Calendar className="w-4 h-4 ml-1.5 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">
                          {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                        </span>
                      </div>
                      {/* Event Timing Status Badges - High visibility UX */}
                      {getEventTimingStatus(event.startAt) === 'registration-ended' && (
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 text-amber-800 rounded-lg font-bold text-sm border-2 border-amber-400 shadow-sm animate-pulse"
                          role="status"
                          aria-label="ההרשמה הסתיימה"
                          title="האירוע התחיל היום - ההרשמה סגורה"
                        >
                          <Clock className="w-4 h-4" />
                          <span>ההרשמה הסתיימה</span>
                        </span>
                      )}
                      {getEventTimingStatus(event.startAt) === 'event-ended' && (
                        <span
                          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg font-bold text-sm border-2 border-gray-400 shadow-sm"
                          role="status"
                          aria-label="האירוע הסתיים"
                          title="האירוע כבר עבר"
                        >
                          <Clock className="w-4 h-4" />
                          <span>הסתיים</span>
                        </span>
                      )}
                      <div className="flex items-center text-sm text-gray-700">
                        <Users className="w-4 h-4 ml-1.5 text-gray-500 flex-shrink-0" />
                        <span className="font-medium">
                          {event.totalSpotsTaken} / {event.totalCapacity || event.capacity}
                        </span>
                      </div>
                      {event.school && (
                        <span className="inline-flex items-center text-sm font-medium text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md border border-purple-200">
                          🏫 {event.school.name}
                        </span>
                      )}
                      {event.gameType && (
                        <span className="inline-flex items-center px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-sm border border-blue-200">
                          {getGameTypeIcon(event.gameType)} {event.gameType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Status dropdown with explanation */}
                  <div className="flex flex-col gap-1.5 lg:items-end">
                    <select
                      value={event.status}
                      onChange={(e) =>
                        handleStatusChange(event.id, e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')
                      }
                      className="text-sm px-3 py-2 border-2 border-gray-300 rounded-lg min-h-[44px] min-w-[110px] font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="OPEN">פתוח ✓</option>
                      <option value="PAUSED">מושהה ⏸</option>
                      <option value="CLOSED">סגור ✕</option>
                    </select>
                    <p className="text-xs text-gray-600 leading-snug max-w-[280px] lg:text-left">
                      {event.status === 'OPEN' && 'משתמשים יכולים להירשם לאירוע'}
                      {event.status === 'PAUSED' && 'השהיה זמנית - ניתן לפתוח מחדש מאוחר יותר'}
                      {event.status === 'CLOSED' &&
                        'סגירה סופית - האירוע הסתיים או תקופת ההרשמה עברה'}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {event.description && (
                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">{event.description}</p>
                )}

                {/* Action Buttons - Compact 2-row layout */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {/* Primary Action - Takes ~60% width on desktop */}
                  <Link
                    href={`/admin/events/${event.id}`}
                    className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 active:bg-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 h-10 shadow-sm transition-all"
                    title="ערוך וצפה בהרשמות"
                  >
                    <Edit className="w-4 h-4 flex-shrink-0" />
                    <span>ערוך אירוע</span>
                  </Link>

                  {/* Secondary Actions - Icon buttons */}
                  <button
                    onClick={() => copyShareLink(event)}
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 active:bg-green-800 focus:ring-2 focus:ring-green-500 focus:ring-offset-1 h-10 transition-colors"
                    title="העתק קישור שיתוף"
                  >
                    {copiedEventId === event.id ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline text-xs">העתק</span>
                  </button>

                  <Link
                    href={`/p/${event.school.slug}/${event.slug}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-1 h-10 transition-colors"
                    title="צפה בדף ההרשמה"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline text-xs">תצוגה</span>
                  </Link>

                  {event._count.registrations === 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        openDeleteModal(event.id, event.title)
                      }}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600 active:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-1 h-10 transition-colors"
                      title="מחק אירוע"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Event Code - Technical details */}
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">קוד:</span>
                      <span className="font-mono font-medium text-gray-700">{event.slug}</span>
                    </div>
                    <div className="flex items-start gap-2 bg-blue-50 p-2 rounded border border-blue-200">
                      <span className="text-blue-600 whitespace-nowrap font-medium">
                        🔗 קישור שיתוף:
                      </span>
                      <span className="font-mono text-blue-800 break-all select-all">
                        {typeof window !== 'undefined'
                          ? `${window.location.origin}/p/${event.school.slug}/${event.slug}`
                          : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        title="מחיקת אירוע"
        description={`האם אתה בטוח שברצונך למחוק את האירוע "${deleteModal.eventTitle}"? פעולה זו אינה ניתנת לביטול.`}
        confirmText="מחק אירוע"
        cancelText="ביטול"
        variant="danger"
        loading={deleteModal.isDeleting}
      />
    </div>
  )
}
