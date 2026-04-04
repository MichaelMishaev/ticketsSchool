'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Calendar,
  Edit,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Search,
  X,
  MoreHorizontal,
} from 'lucide-react'
import { format } from 'date-fns'
import CreateEventDropdown from '@/components/CreateEventDropdown'
import ConfirmationModal from '@/components/ui/ConfirmationModal'
import DevFeatureLabel from '@/components/dev/DevFeatureLabel'

type EventTypeFilter = 'ALL' | 'CAPACITY_BASED' | 'TABLE_BASED'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copiedEventId, setCopiedEventId] = useState<string | null>(null)
  const [eventTypeFilter, setEventTypeFilter] = useState<EventTypeFilter>('ALL')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Search by confirmation code
  const [showSearchModal, setShowSearchModal] = useState(false)
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
  const getEventTimingStatus = (
    startAt: string | Date
  ): 'active' | 'registration-ended' | 'event-ended' => {
    const now = new Date()
    const eventStart = new Date(startAt)

    if (now <= eventStart) return 'active'

    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const eventDate = new Date(
      eventStart.getFullYear(),
      eventStart.getMonth(),
      eventStart.getDate()
    )

    if (nowDate.getTime() === eventDate.getTime()) return 'registration-ended'
    return 'event-ended'
  }

  // Capacity percentage helper
  const getSpotsPercent = (event: any) => {
    const taken = event.totalSpotsTaken || 0
    const total = event.totalCapacity || event.capacity || 1
    return Math.min(100, Math.round((taken / total) * 100))
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
    <div dir="rtl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">אירועים</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-gray-500">{events.length} אירועים</span>
            {events.filter((e) => e.status === 'OPEN').length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                {events.filter((e) => e.status === 'OPEN').length} פעילים
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors h-10 shadow-sm"
          >
            <Search className="w-4 h-4" />
            <span className="hidden sm:inline">חיפוש בקוד</span>
          </button>
          <CreateEventDropdown variant="page" />
        </div>
      </div>

      {/* Filter tabs — underline style, scrollable on small screens */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {[
            { id: 'ALL' as EventTypeFilter, label: 'הכל', count: events.length },
            {
              id: 'CAPACITY_BASED' as EventTypeFilter,
              label: 'אירועים',
              count: events.filter((e) => e.eventType === 'CAPACITY_BASED').length,
            },
            {
              id: 'TABLE_BASED' as EventTypeFilter,
              label: '🍽️ מסעדות',
              count: events.filter((e) => e.eventType === 'TABLE_BASED').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setEventTypeFilter(tab.id)}
              className={`min-h-[44px] px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                eventTypeFilter === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              <span
                className={`mr-1.5 text-xs ${eventTypeFilter === tab.id ? 'text-blue-500' : 'text-gray-400'}`}
              >
                ({tab.count})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Events list */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {events.length === 0 ? 'עדיין אין אירועים' : 'לא נמצאו אירועים מסוג זה'}
          </h3>
          <p className="text-gray-500 text-sm mb-6">
            {events.length === 0
              ? 'צור את האירוע הראשון שלך כדי להתחיל'
              : 'נסה לשנות את הסינון'}
          </p>
          {events.length === 0 && (
            <div className="flex justify-center">
              <CreateEventDropdown variant="page" />
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const spotsPercent = getSpotsPercent(event)
            return (
              <div
                key={event.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-4 sm:p-5">
                  {/* Title + badges row */}
                  <div className="flex items-start gap-2 mb-2">
                    <h3 className="text-base font-bold text-gray-900 leading-snug flex-1 min-w-0">
                      {event.title}
                    </h3>
                    <div className="flex flex-wrap items-center justify-end gap-1 flex-shrink-0">
                      {getEventTimingStatus(event.startAt) === 'registration-ended' && (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          ההרשמה הסתיימה
                        </span>
                      )}
                      {getEventTimingStatus(event.startAt) === 'event-ended' && (
                        <span className="text-xs font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          הסתיים
                        </span>
                      )}
                      {getStatusBadge(event.status)}
                    </div>
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                    {event.school && (
                      <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs font-medium">
                        🏫 {event.school.name}
                      </span>
                    )}
                    {event.gameType && (
                      <span className="text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-xs font-medium">
                        {getGameTypeIcon(event.gameType)} {event.gameType}
                      </span>
                    )}
                  </div>

                  {/* Capacity bar + status dropdown */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                        <span>תפוסה</span>
                        <span className="font-semibold text-gray-700">
                          {event.totalSpotsTaken} / {event.totalCapacity || event.capacity}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-full rounded-full transition-all ${
                            spotsPercent >= 90
                              ? 'bg-red-500'
                              : spotsPercent >= 70
                                ? 'bg-amber-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${spotsPercent}%` }}
                        />
                      </div>
                    </div>
                    <select
                      value={event.status}
                      onChange={(e) =>
                        handleStatusChange(
                          event.id,
                          e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED'
                        )
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs px-2.5 py-2 border border-gray-300 rounded-lg min-h-[44px] font-medium bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    >
                      <option value="OPEN">פתוח ✓</option>
                      <option value="PAUSED">מושהה ⏸</option>
                      <option value="CLOSED">סגור ✕</option>
                    </select>
                  </div>

                  {/* Actions row */}
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[44px] bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                      title="ערוך וצפה בהרשמות"
                    >
                      <Edit className="w-4 h-4" />
                      <span>ערוך אירוע</span>
                    </Link>

                    <button
                      onClick={() => copyShareLink(event)}
                      className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      title="העתק קישור שיתוף"
                    >
                      {copiedEventId === event.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>

                    {/* Overflow menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenMenuId(openMenuId === event.id ? null : event.id)}
                        className="min-w-[44px] min-h-[44px] flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        title="פעולות נוספות"
                      >
                        <MoreHorizontal className="w-4 h-4 text-gray-600" />
                      </button>

                      {openMenuId === event.id && (
                        <>
                          <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl border border-gray-200 shadow-xl z-20 overflow-hidden"
                            dir="rtl"
                          >
                            <Link
                              href={`/p/${event.school.slug}/${event.slug}`}
                              target="_blank"
                              onClick={() => setOpenMenuId(null)}
                              className="flex items-center gap-2.5 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>דף הרשמה</span>
                            </Link>
                            {event._count.registrations === 0 && (
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  setOpenMenuId(null)
                                  openDeleteModal(event.id, event.title)
                                }}
                                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>מחק</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Search Code Modal */}
      {showSearchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg p-5 sm:p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-blue-600" />
                חיפוש לפי קוד אישור
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false)
                  clearSearch()
                }}
                className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchByCode()}
                placeholder="הזן קוד אישור (לדוגמה: 49CKLZ)"
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white placeholder-gray-500 font-medium text-center tracking-wider"
                dir="ltr"
                autoFocus
              />
              <button
                onClick={handleSearchByCode}
                disabled={isSearching || !searchCode.trim()}
                className="px-5 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed min-h-[48px] flex items-center gap-2 transition-colors"
              >
                <Search className="w-4 h-4" />
                {isSearching ? 'מחפש...' : 'חפש'}
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
              <div className="mt-4 p-4 bg-green-50 border-2 border-green-300 rounded-xl">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-base font-bold text-green-900">נמצאה הרשמה!</h3>
                  <button
                    onClick={clearSearch}
                    className="text-green-700 hover:text-green-900"
                    title="נקה חיפוש"
                  >
                    <X className="w-4 h-4" />
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
                  onClick={() => setShowSearchModal(false)}
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 min-h-[48px] transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>עבור לאירוע וההרשמה</span>
                </Link>
              </div>
            )}
          </div>
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
      <DevFeatureLabel feature="event-management" />
    </div>
  )
}
