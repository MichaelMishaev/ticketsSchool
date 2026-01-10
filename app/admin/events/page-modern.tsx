'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, Edit, ExternalLink, Trash2, Copy, Check, Search, X } from 'lucide-react'
import { format } from 'date-fns'
import CreateEventDropdown from '@/components/CreateEventDropdown'

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

  const handleDeleteEvent = async (eventId: string, eventTitle: string) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את האירוע "${eventTitle}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        fetchEvents()
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'שגיאה במחיקת האירוע')
      }
    } catch (error) {
      console.error('Error deleting event:', error)
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
        fetchEvents()
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

    if (normalizedType.includes('מסעדה') || normalizedType.includes('restaurant')) return '🍽️'
    if (normalizedType.includes('בית קפה') || normalizedType.includes('cafe') || normalizedType.includes('coffee')) return '☕'
    if (normalizedType.includes('בר') || normalizedType.includes('bar')) return '🍺'
    if (normalizedType.includes('כדורגל') || normalizedType.includes('soccer') || normalizedType.includes('football')) return '⚽'
    if (normalizedType.includes('כדורסל') || normalizedType.includes('basketball')) return '🏀'
    if (normalizedType.includes('טניס') || normalizedType.includes('tennis')) return '🎾'
    if (normalizedType.includes('שחייה') || normalizedType.includes('swimming')) return '🏊'
    if (normalizedType.includes('סדנה') || normalizedType.includes('workshop')) return '🛠️'
    if (normalizedType.includes('הרצאה') || normalizedType.includes('lecture')) return '🎤'
    if (normalizedType.includes('כנס') || normalizedType.includes('conference')) return '🎪'
    if (normalizedType.includes('מסיבה') || normalizedType.includes('party')) return '🎉'

    return '📅'
  }

  // Get status styles
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'OPEN':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          dot: 'bg-green-500',
          text: 'text-green-700',
          label: 'פתוח',
        }
      case 'PAUSED':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          dot: 'bg-yellow-500',
          text: 'text-yellow-700',
          label: 'מושהה',
        }
      case 'CLOSED':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          dot: 'bg-red-500',
          text: 'text-red-700',
          label: 'סגור',
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          dot: 'bg-gray-500',
          text: 'text-gray-700',
          label: status,
        }
    }
  }

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
    <div className="pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">אירועים</h1>
        <p className="text-sm text-gray-600 mt-1">ניהול כל האירועים שלך במקום אחד</p>
      </div>

      {/* Search by Confirmation Code */}
      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-3">חיפוש לפי קוד אישור</h2>
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

        {searchError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <X className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800">{searchError}</p>
          </div>
        )}

        {searchResult && (
          <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-lg font-bold text-green-900">נמצאה הרשמה!</h3>
              <button onClick={clearSearch} className="text-green-700 hover:text-green-900" title="נקה חיפוש">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">קוד אישור:</span>
                <span className="font-mono font-bold text-green-800">{searchResult.confirmationCode}</span>
              </div>
              {searchResult.data?.name && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">שם:</span>
                  <span className="text-gray-900">{searchResult.data.name}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">טלפון:</span>
                <span className="text-gray-900 font-mono" dir="ltr">{searchResult.phoneNumber}</span>
              </div>
              {searchResult.data?.email && (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-700">אימייל:</span>
                  <span className="text-gray-900" dir="ltr">{searchResult.data.email}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-700">סטטוס:</span>
                <span className={`font-semibold ${searchResult.status === 'CONFIRMED' ? 'text-green-700' : searchResult.status === 'WAITLIST' ? 'text-yellow-700' : 'text-red-700'}`}>
                  {searchResult.status === 'CONFIRMED' ? '✓ אושר' : searchResult.status === 'WAITLIST' ? '⏳ רשימת המתנה' : '✕ בוטל'}
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

      {/* Filters */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">סינון</h2>
          {eventTypeFilter !== 'ALL' && (
            <button onClick={() => setEventTypeFilter('ALL')} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
              נקה סינון
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3" dir="rtl">
          <button
            onClick={() => setEventTypeFilter('ALL')}
            className={`px-5 py-3 rounded-full font-semibold text-sm min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'ALL'
                ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>כל האירועים</span>
              <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${eventTypeFilter === 'ALL' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {events.length}
              </span>
            </span>
          </button>

          <button
            onClick={() => setEventTypeFilter('CAPACITY_BASED')}
            className={`px-5 py-3 rounded-full font-semibold text-sm min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'CAPACITY_BASED'
                ? 'bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300 hover:bg-purple-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span>אירועים</span>
              <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${eventTypeFilter === 'CAPACITY_BASED' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {events.filter((e) => e.eventType === 'CAPACITY_BASED').length}
              </span>
            </span>
          </button>

          <button
            onClick={() => setEventTypeFilter('TABLE_BASED')}
            className={`px-5 py-3 rounded-full font-semibold text-sm min-h-[48px] transition-all duration-200 border-2 ${
              eventTypeFilter === 'TABLE_BASED'
                ? 'bg-orange-600 text-white border-orange-600 shadow-lg shadow-orange-200'
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50'
            }`}
          >
            <span className="flex items-center gap-2">
              <span className="text-base">🍽️</span>
              <span>מסעדות</span>
              <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full text-xs font-bold ${eventTypeFilter === 'TABLE_BASED' ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                {events.filter((e) => e.eventType === 'TABLE_BASED').length}
              </span>
            </span>
          </button>
        </div>
      </div>

      {/* Events Grid */}
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredEvents.map((event) => {
            const statusStyle = getStatusStyle(event.status)
            return (
              <article
                key={event.id}
                className={`bg-white rounded-xl border-2 ${statusStyle.border} overflow-hidden
                           shadow-sm hover:shadow-lg
                           transition-all duration-200 ease-out
                           hover:-translate-y-1 hover:border-gray-400`}
              >
                {/* Header with status */}
                <div className={`${statusStyle.bg} px-5 py-3 border-b-2 ${statusStyle.border}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${statusStyle.dot} animate-pulse`} />
                      <span className={`text-sm font-bold ${statusStyle.text}`}>{statusStyle.label}</span>
                    </div>
                    <select
                      value={event.status}
                      onChange={(e) => handleStatusChange(event.id, e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')}
                      className="text-xs px-2 py-1 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="OPEN">שנה ל: פתוח</option>
                      <option value="PAUSED">שנה ל: מושהה</option>
                      <option value="CLOSED">שנה ל: סגור</option>
                    </select>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-900 leading-tight line-clamp-2">
                    {event.title}
                  </h3>

                  {/* Metadata */}
                  <div className="space-y-2">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium">{format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}</span>
                    </div>

                    {/* Capacity */}
                    <div className="flex items-center gap-2 text-sm text-gray-700">
                      <Users className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <span className="font-medium">
                        {event.totalSpotsTaken} / {event.totalCapacity || event.capacity}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({Math.round((event.totalSpotsTaken / (event.totalCapacity || event.capacity)) * 100)}% תפוסה)
                      </span>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-wrap gap-2">
                      {event.school && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-md">
                          🏫 {event.school.name}
                        </span>
                      )}
                      {event.gameType && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium text-xs">
                          {getGameTypeIcon(event.gameType)} {event.gameType}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="col-span-3 flex items-center justify-center gap-2 px-4 py-3 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                      title="נהל אירוע"
                    >
                      <Edit className="w-4 h-4" />
                      <span>נהל אירוע</span>
                    </Link>

                    <Link
                      href={`/p/${event.school.slug}/${event.slug}`}
                      target="_blank"
                      className="col-span-2 flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      title="תצוגה מקדימה"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>תצוגה</span>
                    </Link>

                    <button
                      onClick={() => copyShareLink(event)}
                      className="flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors"
                      title="העתק קישור"
                    >
                      {copiedEventId === event.id ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>הועתק</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>העתק</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Delete (if no registrations) */}
                  {event._count.registrations === 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        handleDeleteEvent(event.id, event.title)
                      }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>מחק אירוע</span>
                    </button>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
