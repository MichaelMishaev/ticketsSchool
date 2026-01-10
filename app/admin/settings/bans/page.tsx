'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { he } from 'date-fns/locale'

interface Ban {
  id: string
  phoneNumber: string
  email: string | null
  name: string | null
  reason: string
  bannedGamesCount: number
  eventsBlocked: number
  bannedAt: Date
  expiresAt: Date | null
  active: boolean
  liftedAt: Date | null
  liftedBy: string | null
  liftedReason: string | null
  createdByName: string
  isActive: boolean
  isDateBased: boolean
  remainingGames: number | null
}

interface BanCounts {
  active: number
  expired: number
  total: number
}

type FilterStatus = 'active' | 'expired' | 'all'

interface LiftBanModal {
  show: boolean
  ban: Ban | null
}

export default function BanManagementPage() {
  const [bans, setBans] = useState<Ban[]>([])
  const [counts, setCounts] = useState<BanCounts>({ active: 0, expired: 0, total: 0 })
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('active')
  const [searchQuery, setSearchQuery] = useState('')
  const [liftModal, setLiftModal] = useState<LiftBanModal>({ show: false, ban: null })
  const [liftReason, setLiftReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Fetch bans
  const fetchBans = async () => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      if (filterStatus !== 'all') {
        params.set('status', filterStatus)
      }
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/admin/bans?${params}`)
      if (!response.ok) throw new Error('Failed to load bans')

      const data = await response.json()
      setBans(data.bans)
      setCounts(data.counts)
    } catch (error) {
      console.error('Error loading bans:', error)
      showToast('שגיאה בטעינת נתונים', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBans()
  }, [filterStatus])

  // Show toast
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Open lift modal
  const openLiftModal = (ban: Ban) => {
    setLiftModal({ show: true, ban })
    setLiftReason('')
  }

  // Lift ban
  const liftBan = async () => {
    if (!liftModal.ban) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/admin/bans/${liftModal.ban.id}/lift`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: liftReason })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to lift ban')
      }

      showToast('החסימה הוסרה בהצלחה', 'success')
      setLiftModal({ show: false, ban: null })
      fetchBans()
    } catch (error: unknown) {
      console.error('Error lifting ban:', error)
      const errorMessage = error instanceof Error ? error.message : 'שגיאה בהסרת חסימה'
      showToast(errorMessage, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBans()
  }

  // Format ban expiration
  const formatExpiration = (ban: Ban) => {
    if (ban.isDateBased && ban.expiresAt) {
      return format(new Date(ban.expiresAt), 'dd/MM/yyyy', { locale: he })
    } else if (!ban.isDateBased && ban.remainingGames !== null) {
      return `${ban.remainingGames} משחקים נוספים`
    }
    return 'לא מוגדר'
  }

  // Get status badge
  const getStatusBadge = (ban: Ban) => {
    if (ban.isActive) {
      return (
        <span className="inline-block px-3 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
          🔴 פעיל
        </span>
      )
    } else {
      return (
        <span className="inline-block px-3 py-1 text-xs font-medium bg-gray-200 text-gray-700 rounded-full">
          הסתיים
        </span>
      )
    }
  }

  // Filter tabs
  const tabs: Array<{ id: FilterStatus; label: string; count: number }> = [
    { id: 'active', label: 'פעילים', count: counts.active },
    { id: 'expired', label: 'הסתיימו', count: counts.expired },
    { id: 'all', label: 'הכל', count: counts.total }
  ]

  if (loading && bans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <div className="text-gray-600">טוען רשימת חסימות...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12" dir="rtl">
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

      {/* Lift Ban Modal */}
      {liftModal.show && liftModal.ban && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">הסרת חסימה</h3>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="font-medium">{liftModal.ban.name || 'לא ידוע'}</div>
                <div className="text-sm text-gray-600">{liftModal.ban.phoneNumber}</div>
                <div className="text-sm text-gray-500 mt-2">
                  סיבת חסימה: {liftModal.ban.reason}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                  סיבת הסרה (אופציונלי)
                </label>
                <textarea
                  value={liftReason}
                  onChange={(e) => setLiftReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
                  placeholder="למשל: התנצל והבטיח להגיע בעתיד"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setLiftModal({ show: false, ban: null })}
                  className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg hover:bg-gray-50 min-h-[44px]"
                  disabled={submitting}
                >
                  ביטול
                </button>
                <button
                  onClick={liftBan}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 min-h-[44px]"
                >
                  {submitting ? 'מסיר...' : 'הסר חסימה'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold">ניהול חסימות</h1>
          <p className="text-gray-600 mt-1">רשימת כל המשתמשים החסומים במערכת</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="חיפוש לפי טלפון או שם..."
              className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 min-h-[44px]"
            >
              🔍
            </button>
          </div>
        </form>

        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        {/* Bans list */}
        {bans.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">
              {filterStatus === 'active' ? '🎉' : '📋'}
            </div>
            <div className="text-gray-600">
              {filterStatus === 'active'
                ? 'אין חסימות פעילות'
                : searchQuery
                ? 'לא נמצאו תוצאות'
                : 'אין חסימות במערכת'}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {bans.map((ban) => (
              <div
                key={ban.id}
                className={`bg-white rounded-lg shadow-sm p-6 border-2 ${
                  ban.isActive ? 'border-red-200' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="font-bold text-lg text-gray-900">
                        {ban.name || 'לא ידוע'}
                      </div>
                      {getStatusBadge(ban)}
                    </div>
                    <div className="text-sm text-gray-600">
                      📞 {ban.phoneNumber}
                    </div>
                    {ban.email && (
                      <div className="text-sm text-gray-600">
                        ✉️ {ban.email}
                      </div>
                    )}
                  </div>
                </div>

                {/* Ban details grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">תאריך חסימה</div>
                    <div className="text-sm font-medium">
                      {format(new Date(ban.bannedAt), 'dd/MM/yyyy HH:mm', { locale: he })}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs text-gray-500 mb-1">
                      {ban.isDateBased ? 'תאריך תפוגה' : 'משחקים נותרו'}
                    </div>
                    <div className="text-sm font-medium">
                      {formatExpiration(ban)}
                    </div>
                  </div>

                  {ban.isDateBased && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">אירועים שנחסמו</div>
                      <div className="text-sm font-medium">{ban.eventsBlocked}</div>
                    </div>
                  )}

                  <div>
                    <div className="text-xs text-gray-500 mb-1">נוצר על ידי</div>
                    <div className="text-sm font-medium">{ban.createdByName}</div>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <div className="text-xs text-gray-500 mb-1">סיבה</div>
                  <div className="text-sm text-gray-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    {ban.reason}
                  </div>
                </div>

                {/* Lifted info */}
                {ban.liftedAt && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="text-sm text-green-800">
                      ✅ החסימה הוסרה ב-{format(new Date(ban.liftedAt), 'dd/MM/yyyy HH:mm')}
                    </div>
                    {ban.liftedReason && (
                      <div className="text-xs text-green-700 mt-1">
                        סיבה: {ban.liftedReason}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {ban.isActive && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => openLiftModal(ban)}
                      className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 min-h-[44px]"
                    >
                      הסר חסימה
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
