'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Calendar, Users, Clock, Edit, ExternalLink, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

export default function EventsPage() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
        method: 'DELETE'
      })
      if (response.ok) {
        fetchEvents() // Refresh the list
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
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchEvents() // Refresh the list
      }
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      OPEN: { text: 'פתוח', className: 'bg-green-100 text-green-800' },
      PAUSED: { text: 'מושהה', className: 'bg-yellow-100 text-yellow-800' },
      CLOSED: { text: 'סגור', className: 'bg-gray-100 text-gray-800' },
    }
    const { text, className } = statusMap[status] || statusMap.CLOSED
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
        {text}
      </span>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">טוען אירועים...</div>
      </div>
    )
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">אירועים</h1>
        <Link
          href="/admin/events/new"
          className="mt-3 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          צור אירוע חדש
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-500">אין אירועים עדיין</p>
          <Link
            href="/admin/events/new"
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            צור אירוע חדש
          </Link>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {events.map((event) => (
              <li key={event.id}>
                <div className="px-4 py-5 sm:px-6 hover:bg-gray-50">
                  {/* Header Section - Title and Status */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <h3 className="text-lg sm:text-xl font-medium text-gray-900 flex-1">
                      {event.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <select
                        value={event.status}
                        onChange={(e) => handleStatusChange(event.id, e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')}
                        className="text-sm px-3 py-1.5 border rounded-md min-h-[44px] min-w-[100px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <option value="OPEN">פתוח</option>
                        <option value="PAUSED">מושהה</option>
                        <option value="CLOSED">סגור</option>
                      </select>
                      <div className="hidden sm:block">
                        {getStatusBadge(event.status)}
                      </div>
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="space-y-2 mb-3">
                    <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 text-sm text-gray-600">
                      <div className="flex items-center min-h-[40px]">
                        <Calendar className="w-5 h-5 ml-2 flex-shrink-0" />
                        <span className="font-medium">{format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}</span>
                      </div>
                      <div className="flex items-center min-h-[40px]">
                        <Users className="w-5 h-5 ml-2 flex-shrink-0" />
                        <span className="font-medium">{event.totalSpotsTaken} / {event.capacity} מקומות</span>
                      </div>
                      {event.gameType && (
                        <div className="flex items-center min-h-[40px]">
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-sm">
                            {event.gameType}
                          </span>
                        </div>
                      )}
                      {event.school && (
                        <div className="flex items-center min-h-[40px]">
                          <span className="text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-md border border-purple-200">
                            🏫 {event.school.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {event.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{event.description}</p>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <Link
                      href={`/admin/events/${event.id}`}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 min-h-[44px]"
                      title="ערוך וצפה בהרשמות"
                    >
                      <Edit className="w-4 h-4" />
                      <span>ערוך וצפה בהרשמות</span>
                    </Link>
                    <Link
                      href={`/p/${event.school.slug}/${event.slug}`}
                      target="_blank"
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 min-h-[44px]"
                      title="צפה בדף ההרשמה"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>צפה בדף</span>
                    </Link>
                    {event._count.registrations === 0 && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          handleDeleteEvent(event.id, event.title)
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 min-h-[44px]"
                        title="מחק אירוע"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>מחק</span>
                      </button>
                    )}
                  </div>

                  {/* Event Code - Collapsible on mobile */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500 space-y-1">
                      <div>
                        קוד אירוע: <span className="font-mono font-medium">{event.slug}</span>
                      </div>
                      <div className="hidden sm:block break-all">
                        קישור: <span className="font-mono">{typeof window !== 'undefined' ? `${window.location.origin}/p/${event.school.slug}/${event.slug}` : ''}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}