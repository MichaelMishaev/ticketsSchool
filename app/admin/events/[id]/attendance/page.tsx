'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface NoShow {
  id: string
  name: string
  phone: string | null
  email: string | null
  spotsCount: number
  confirmationCode: string
  status: string
  attendanceHistory?: {
    totalEvents: number
    attendedEvents: number
    attendanceRate: number
  }
}

interface AttendanceStats {
  total: number
  checkedIn: number
  noShows: number
  attendanceRate: number
}

interface BanModalData {
  users: Array<{
    phoneNumber: string
    email?: string | null
    name?: string
  }>
  show: boolean
}

export default function AttendanceReviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter()
  const [resolvedParams, setResolvedParams] = useState<{ id: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventTitle, setEventTitle] = useState('')
  const [stats, setStats] = useState<AttendanceStats | null>(null)
  const [noShows, setNoShows] = useState<NoShow[]>([])
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [loadingHistory, setLoadingHistory] = useState<Set<string>>(new Set())
  const [banModal, setBanModal] = useState<BanModalData>({ users: [], show: false })
  const [banType, setBanType] = useState<'games' | 'date'>('games')
  const [bannedGamesCount, setBannedGamesCount] = useState(3)
  const [expiresAt, setExpiresAt] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Resolve params
  useEffect(() => {
    params.then(setResolvedParams)
  }, [params])

  // Fetch attendance data
  useEffect(() => {
    if (!resolvedParams) return

    const fetchData = async () => {
      try {
        setLoading(true)

        const response = await fetch(`/api/events/${resolvedParams.id}/attendance`)
        if (!response.ok) {
          throw new Error('Failed to load attendance data')
        }

        const data = await response.json()
        setEventTitle(data.event.title)
        setStats(data.stats)
        setNoShows(data.noShows)
      } catch (error) {
        console.error('Error:', error)
        showToast('שגיאה בטעינת נתוני נוכחות', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams])

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Toggle user selection
  const toggleUser = (noShow: NoShow) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(noShow.phone || '')) {
      newSelected.delete(noShow.phone || '')
    } else {
      if (noShow.phone) {
        newSelected.add(noShow.phone)
      }
    }
    setSelectedUsers(newSelected)
  }

  // Load attendance history for a user
  const loadHistory = async (phone: string) => {
    if (!phone) return

    setLoadingHistory(prev => new Set(prev).add(phone))

    try {
      const response = await fetch(`/api/admin/attendance/history?phone=${encodeURIComponent(phone)}`)
      if (!response.ok) throw new Error('Failed to load history')

      const data = await response.json()

      setNoShows(prev =>
        prev.map(noShow =>
          noShow.phone === phone
            ? { ...noShow, attendanceHistory: data.stats }
            : noShow
        )
      )
    } catch (error) {
      console.error('Error loading history:', error)
      showToast('שגיאה בטעינת היסטוריה', 'error')
    } finally {
      setLoadingHistory(prev => {
        const newSet = new Set(prev)
        newSet.delete(phone)
        return newSet
      })
    }
  }

  // Open ban modal
  const openBanModal = () => {
    const users = Array.from(selectedUsers)
      .map(phone => {
        const noShow = noShows.find(ns => ns.phone === phone)
        return noShow
          ? {
              phoneNumber: phone,
              email: noShow.email,
              name: noShow.name
            }
          : null
      })
      .filter(Boolean) as BanModalData['users']

    setBanModal({ users, show: true })
    setReason('לא הגיע למספר משחקים רצופים')
  }

  // Submit ban
  const submitBan = async () => {
    if (!reason.trim()) {
      showToast('נא למלא סיבת חסימה', 'error')
      return
    }

    if (banType === 'games' && (!bannedGamesCount || bannedGamesCount < 1)) {
      showToast('נא למלא מספר משחקים תקין', 'error')
      return
    }

    if (banType === 'date' && !expiresAt) {
      showToast('נא לבחור תאריך תפוגה', 'error')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/admin/bans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          users: banModal.users,
          reason,
          bannedGamesCount: banType === 'games' ? bannedGamesCount : undefined,
          expiresAt: banType === 'date' ? expiresAt : undefined
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create ban')
      }

      showToast(`${banModal.users.length} משתמשים נחסמו בהצלחה`, 'success')
      setBanModal({ users: [], show: false })
      setSelectedUsers(new Set())
    } catch (error: unknown) {
      console.error('Error creating ban:', error)
      const errorMessage = error instanceof Error ? error.message : 'שגיאה ביצירת חסימה'
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Get attendance badge color
  const getAttendanceBadge = (rate: number | undefined) => {
    if (rate === undefined) return null

    if (rate >= 80) {
      return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">🟢 {rate}% נוכחות טובה</span>
    } else if (rate >= 50) {
      return <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded">⚠️ {rate}% נוכחות בינונית</span>
    } else {
      return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">🔴 {rate}% נוכחות נמוכה</span>
    }
  }

  if (!resolvedParams) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">טוען...</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-600">טוען נתוני נוכחות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-lg shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white font-medium`}
        >
          {toast.message}
        </div>
      )}

      {/* Ban Modal */}
      {banModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">חסימת משתמשים</h3>

              {/* Selected users */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-2">
                  {banModal.users.length} משתמשים נבחרו:
                </div>
                {banModal.users.map((user, idx) => (
                  <div key={idx} className="text-sm">
                    • {user.name} ({user.phoneNumber})
                  </div>
                ))}
              </div>

              {/* Ban type */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">סוג חסימה</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setBanType('games')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                      banType === 'games'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    מספר משחקים
                  </button>
                  <button
                    onClick={() => setBanType('date')}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                      banType === 'date'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-700'
                    }`}
                  >
                    תאריך תפוגה
                  </button>
                </div>
              </div>

              {/* Games count or expiration date */}
              {banType === 'games' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">מספר משחקים</label>
                  <input
                    type="number"
                    min="1"
                    value={bannedGamesCount}
                    onChange={(e) => setBannedGamesCount(parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>
              ) : (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">תאריך תפוגה</label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  />
                </div>
              )}

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">סיבה</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  placeholder="לדוגמה: לא הגיע ל-3 משחקים רצופים"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setBanModal({ users: [], show: false })}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]"
                  disabled={submitting}
                >
                  ביטול
                </button>
                <button
                  onClick={submitBan}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'שומר...' : 'אישור חסימה'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <button
            onClick={() => router.back()}
            className="text-blue-500 hover:text-blue-600 mb-3 flex items-center gap-2 min-h-[44px]"
          >
            ← חזרה
          </button>
          <h1 className="text-2xl font-bold">ניהול נוכחות - {eventTitle}</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-gray-900">{stats?.total || 0}</div>
              <div className="text-sm text-gray-600">סך הכל נרשמו</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">{stats?.checkedIn || 0}</div>
              <div className="text-sm text-gray-600">הגיעו ✅</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-600">{stats?.noShows || 0}</div>
              <div className="text-sm text-gray-600">לא הגיעו ❌</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">{stats?.attendanceRate || 0}%</div>
              <div className="text-sm text-gray-600">אחוז נוכחות</div>
            </div>
          </div>
        </div>

        {/* No shows list */}
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-4">משתמשים שלא הגיעו ({noShows.length})</h2>

          {noShows.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">🎉</div>
              <div className="text-gray-600">כולם הגיעו! אין אף אחד שלא התייצב</div>
            </div>
          ) : (
            <div className="space-y-3">
              {noShows.map((noShow) => (
                <div
                  key={noShow.id}
                  className="bg-white rounded-lg shadow-sm p-4 border-2 border-gray-200"
                >
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    {noShow.phone && (
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(noShow.phone)}
                        onChange={() => toggleUser(noShow)}
                        className="mt-1 w-5 h-5 cursor-pointer"
                      />
                    )}

                    {/* Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="font-medium text-gray-900">{noShow.name}</div>
                          <div className="text-sm text-gray-600">{noShow.phone || 'ללא טלפון'}</div>
                          {noShow.spotsCount > 1 && (
                            <div className="text-xs text-gray-500">
                              {noShow.spotsCount} מקומות
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {noShow.confirmationCode}
                        </div>
                      </div>

                      {/* Attendance history */}
                      {noShow.attendanceHistory ? (
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              הגיע ל-{noShow.attendanceHistory.attendedEvents} מתוך{' '}
                              {noShow.attendanceHistory.totalEvents} משחקים
                            </div>
                            {getAttendanceBadge(noShow.attendanceHistory.attendanceRate)}
                          </div>
                        </div>
                      ) : (
                        noShow.phone && (
                          <button
                            onClick={() => loadHistory(noShow.phone!)}
                            disabled={loadingHistory.has(noShow.phone!)}
                            className="text-sm text-blue-500 hover:text-blue-600 mt-2 min-h-[44px]"
                          >
                            {loadingHistory.has(noShow.phone!)
                              ? 'טוען היסטוריה...'
                              : '📊 הצג היסטוריית נוכחות'}
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      {selectedUsers.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-lg p-4 z-40">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div className="font-medium">
              {selectedUsers.size} נבחרו
            </div>
            <button
              onClick={openBanModal}
              className="bg-red-500 text-white px-6 py-3 rounded-lg hover:bg-red-600 font-medium min-h-[44px]"
            >
              חסום משתמשים
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
