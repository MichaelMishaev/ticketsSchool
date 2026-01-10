'use client'

import { format } from 'date-fns'

interface Registration {
  id: string
  data: Record<string, unknown>
  spotsCount: number
  guestsCount: number
  status: string
  confirmationCode: string
  phoneNumber: string | null
  qrCode: string | null
  checkIn: {
    id: string
    checkedInAt: Date
    checkedInBy: string | null
    undoneAt: Date | null
  } | null
  banned?: {
    reason: string
    remainingGames: number | null
    expiresAt: Date | null
  } | null
}

interface CheckInCardProps {
  registration: Registration
  onCheckIn: (id: string) => void
  onUndo: (id: string) => void
  loading?: boolean
}

export function CheckInCard({ registration, onCheckIn, onUndo, loading }: CheckInCardProps) {
  const isCheckedIn = registration.checkIn && !registration.checkIn.undoneAt
  const isBanned = !!registration.banned

  // Extract name from registration data
  const name = (registration.data?.name as string) || (registration.data?.parentName as string) || 'ללא שם'
  const childName = registration.data?.childName as string | undefined
  const phone = registration.phoneNumber

  // Determine card styling
  let bgColor = 'bg-amber-50'
  let borderColor = 'border-amber-200'
  let statusIcon = '⏳'
  let statusText = 'ממתין לנוכחות'
  let statusColor = 'text-amber-700'

  if (isBanned) {
    bgColor = 'bg-red-50'
    borderColor = 'border-red-200'
    statusIcon = '🚫'
    statusText = 'חסום'
    statusColor = 'text-red-700'
  } else if (isCheckedIn) {
    bgColor = 'bg-green-50'
    borderColor = 'border-green-200'
    statusIcon = '✅'
    statusText = 'הגיע'
    statusColor = 'text-green-700'
  }

  return (
    <div
      className={`${bgColor} border-2 ${borderColor} rounded-lg p-4 min-h-[72px] transition-all duration-200 hover:shadow-md`}
      dir="rtl"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left side - Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{statusIcon}</span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-gray-900 text-lg truncate">{name}</div>
              {childName && (
                <div className="text-sm text-gray-600">
                  ילד/ה: {childName}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
            {phone && (
              <div className="flex items-center gap-1">
                <span>📱</span>
                <span className="font-mono">{phone}</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <span>👥</span>
              <span>{registration.spotsCount + registration.guestsCount} מקומות</span>
            </div>
            {registration.confirmationCode && (
              <div className="flex items-center gap-1">
                <span>🎫</span>
                <span className="font-mono text-xs">{registration.confirmationCode}</span>
              </div>
            )}
          </div>

          {/* Banned message */}
          {isBanned && registration.banned && (
            <div className="mt-2 text-sm text-red-700 bg-red-100 rounded px-2 py-1">
              <div className="font-medium">סיבת חסימה: {registration.banned.reason}</div>
              {registration.banned.remainingGames !== null && (
                <div className="text-xs mt-1">
                  נותרו {registration.banned.remainingGames} משחקים
                </div>
              )}
              {registration.banned.expiresAt && (
                <div className="text-xs mt-1">
                  עד תאריך: {format(new Date(registration.banned.expiresAt), 'dd/MM/yyyy')}
                </div>
              )}
            </div>
          )}

          {/* Check-in timestamp */}
          {isCheckedIn && registration.checkIn && (
            <div className="mt-2 text-xs text-green-700">
              נכח בשעה: {format(new Date(registration.checkIn.checkedInAt), 'HH:mm')}
            </div>
          )}
        </div>

        {/* Right side - Status & Button */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className={`text-sm font-medium ${statusColor} whitespace-nowrap`}>
            {statusText}
          </div>

          {!isBanned && (
            <button
              onClick={() => (isCheckedIn ? onUndo(registration.id) : onCheckIn(registration.id))}
              disabled={loading}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] min-w-[100px] ${
                isCheckedIn
                  ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300'
              } disabled:cursor-not-allowed`}
            >
              {loading ? '...' : isCheckedIn ? 'בטל נוכחות' : 'סמן נוכח'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
