'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MessageSquare, Trash2, Check, Eye, X, Shield } from 'lucide-react'
import { useRouter } from 'next/navigation'

type Feedback = {
  id: string
  message: string
  email: string | null
  status: 'PENDING' | 'REVIEWED' | 'RESOLVED' | 'DISMISSED'
  adminNotes: string | null
  createdAt: string
  updatedAt: string
}

export default function AdminFeedbackPage() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')

  useEffect(() => {
    // Check if user is super admin
    fetch('/api/admin/me')
      .then(res => res.json())
      .then(data => {
        if (data.authenticated && data.admin && data.admin.role === 'SUPER_ADMIN') {
          setIsAuthorized(true)
          fetchFeedbacks()
        } else {
          // Not authorized, redirect to admin home
          router.push('/admin')
        }
      })
      .catch(() => {
        router.push('/admin')
      })
  }, [filter, router])

  const fetchFeedbacks = async () => {
    try {
      const url = filter === 'all'
        ? '/api/admin/feedback'
        : `/api/admin/feedback?status=${filter}`

      const response = await fetch(url)
      const data = await response.json()
      setFeedbacks(data)
    } catch (error) {
      console.error('Error fetching feedbacks:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchFeedbacks()
      }
    } catch (error) {
      console.error('Error updating feedback:', error)
    }
  }

  const updateNotes = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ adminNotes: notesText }),
      })

      if (response.ok) {
        setEditingNotes(null)
        setNotesText('')
        fetchFeedbacks()
      }
    } catch (error) {
      console.error('Error updating notes:', error)
    }
  }

  const deleteFeedback = async (id: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשוב הזה?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/feedback/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        fetchFeedbacks()
      }
    } catch (error) {
      console.error('Error deleting feedback:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      REVIEWED: 'bg-blue-100 text-blue-800',
      RESOLVED: 'bg-green-100 text-green-800',
      DISMISSED: 'bg-gray-100 text-gray-800',
    }
    const labels = {
      PENDING: 'ממתין',
      REVIEWED: 'נצפה',
      RESOLVED: 'טופל',
      DISMISSED: 'נדחה',
    }
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${badges[status as keyof typeof badges]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    )
  }

  const filteredFeedbacks = filter === 'all'
    ? feedbacks
    : feedbacks.filter(f => f.status === filter)

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Shield className="h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg text-gray-600">בודק הרשאות...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-gray-900">משובים</h2>
          <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 border border-purple-300">
            Super Admin Only
          </span>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">הכל</option>
            <option value="PENDING">ממתינים</option>
            <option value="REVIEWED">נצפו</option>
            <option value="RESOLVED">טופלו</option>
            <option value="DISMISSED">נדחו</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 py-8">טוען...</div>
      ) : filteredFeedbacks.length === 0 ? (
        <div className="text-center text-gray-500 py-8 bg-white rounded-lg shadow">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg">אין משובים להצגה</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFeedbacks.map((feedback) => (
            <div key={feedback.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(feedback.status)}
                    <span className="text-sm text-gray-500">
                      {format(new Date(feedback.createdAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </div>
                  {feedback.email && (
                    <p className="text-sm text-gray-600">
                      <strong>אימייל:</strong> {feedback.email}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => deleteFeedback(feedback.id)}
                  className="text-red-600 hover:text-red-800 p-2"
                  title="מחק"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md mb-4">
                <p className="text-gray-900 whitespace-pre-wrap text-right">
                  {feedback.message}
                </p>
              </div>

              {/* Admin Notes */}
              <div className="mb-4">
                {editingNotes === feedback.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-right"
                      rows={3}
                      placeholder="הערות פנימיות..."
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateNotes(feedback.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      >
                        שמור
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotes(null)
                          setNotesText('')
                        }}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        ביטול
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {feedback.adminNotes ? (
                      <div className="bg-blue-50 p-3 rounded-md text-right">
                        <p className="text-sm text-gray-700">
                          <strong>הערות:</strong> {feedback.adminNotes}
                        </p>
                        <button
                          onClick={() => {
                            setEditingNotes(feedback.id)
                            setNotesText(feedback.adminNotes || '')
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm mt-1"
                        >
                          ערוך
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNotes(feedback.id)
                          setNotesText('')
                        }}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        + הוסף הערות
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                {feedback.status !== 'REVIEWED' && (
                  <button
                    onClick={() => updateStatus(feedback.id, 'REVIEWED')}
                    className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-md hover:bg-blue-200 text-sm"
                  >
                    <Eye className="h-4 w-4" />
                    סמן כנצפה
                  </button>
                )}
                {feedback.status !== 'RESOLVED' && (
                  <button
                    onClick={() => updateStatus(feedback.id, 'RESOLVED')}
                    className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-md hover:bg-green-200 text-sm"
                  >
                    <Check className="h-4 w-4" />
                    סמן כטופל
                  </button>
                )}
                {feedback.status !== 'DISMISSED' && (
                  <button
                    onClick={() => updateStatus(feedback.id, 'DISMISSED')}
                    className="flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 rounded-md hover:bg-gray-200 text-sm"
                  >
                    <X className="h-4 w-4" />
                    סמן כנדחה
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
