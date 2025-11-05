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
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {event.title}
                        </h3>
                        <div className="flex items-center gap-2">
                          <select
                            value={event.status}
                            onChange={(e) => handleStatusChange(event.id, e.target.value as 'OPEN' | 'PAUSED' | 'CLOSED')}
                            className="text-xs px-2 py-1 border rounded"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <option value="OPEN">פתוח</option>
                            <option value="PAUSED">מושהה</option>
                            <option value="CLOSED">סגור</option>
                          </select>
                          {getStatusBadge(event.status)}
                        </div>
                      </div>

                      <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 ml-1" />
                          {format(new Date(event.startAt), 'dd/MM/yyyy HH:mm')}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 ml-1" />
                          {event.totalSpotsTaken} / {event.capacity} מקומות
                        </div>
                        {event.gameType && (
                          <div className="flex items-center">
                            <span className="font-medium">{event.gameType}</span>
                          </div>
                        )}
                      </div>

                      {event.description && (
                        <p className="mt-2 text-sm text-gray-600">{event.description}</p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="ערוך"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <Link
                        href={`/p/${event.slug}`}
                        target="_blank"
                        className="p-2 text-gray-600 hover:text-gray-900"
                        title="צפה בדף ההרשמה"
                      >
                        <ExternalLink className="w-5 h-5" />
                      </Link>
                      {event._count.registrations === 0 && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            handleDeleteEvent(event.id, event.title)
                          }}
                          className="p-2 text-red-600 hover:text-red-900"
                          title="מחק אירוע (רק אירועים ללא הרשמות)"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <div className="text-xs text-gray-500">
                      קוד אירוע: <span className="font-mono">{event.slug}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      קישור:
                      <span className="font-mono mr-1">
                        {typeof window !== 'undefined' ? `${window.location.origin}/p/${event.slug}` : ''}
                      </span>
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