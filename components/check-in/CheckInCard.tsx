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
  disabled?: boolean
}

export function CheckInCard({ registration, onCheckIn, onUndo, loading, disabled }: CheckInCardProps) {
  const isCheckedIn = registration.checkIn && !registration.checkIn.undoneAt
  const isBanned = !!registration.banned
  const isWaitlist = registration.status === 'WAITLIST'

  // Extract name from registration data
  const name = (registration.data?.name as string) || (registration.data?.parentName as string) || 'ללא שם'
  const childName = registration.data?.childName as string | undefined
  const phone = registration.phoneNumber

  // Convert Israeli phone to WhatsApp format
  const getWhatsAppUrl = (phoneNumber: string) => {
    // Remove leading 0 and add 972 (Israel country code)
    // Also remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '').replace(/^0/, '972')
    return `https://wa.me/${cleanNumber}`
  }

  // Format phone number for display (remove + and other special chars)
  const formatPhoneDisplay = (phoneNumber: string) => {
    return phoneNumber.replace(/[^\d]/g, '')
  }

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
  } else if (isWaitlist) {
    bgColor = 'bg-gray-50'
    borderColor = 'border-gray-300'
    statusIcon = '⏳'
    statusText = 'רשימת המתנה'
    statusColor = 'text-gray-600'
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
            {/* Waitlist badge */}
            {isWaitlist && (
              <span className="flex-shrink-0 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-bold border border-purple-200">
                רשימת המתנה
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-gray-600 mt-2">
            {phone && (
              <a
                href={getWhatsAppUrl(phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-green-600 transition-colors cursor-pointer active:scale-95 group"
              >
                <span className="font-mono underline decoration-dotted">{formatPhoneDisplay(phone)}</span>
                {/* WhatsApp Icon - placed after number (on left in RTL) */}
                <svg
                  className="w-5 h-5 text-green-500 group-hover:text-green-600 flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
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

          {/* Waitlist message */}
          {isWaitlist && (
            <div className="mt-2 text-sm text-gray-700 bg-gray-100 rounded px-2 py-1">
              <div className="font-medium">👤 ברשימת המתנה - יש לפנות למנהל לשיבוץ</div>
            </div>
          )}

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

          {!isBanned && !isWaitlist && (
            <button
              onClick={() => (isCheckedIn ? onUndo(registration.id) : onCheckIn(registration.id))}
              disabled={loading || disabled}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] min-w-[100px] ${
                disabled
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : isCheckedIn
                  ? 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 disabled:bg-red-300'
                  : 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-300'
              } disabled:cursor-not-allowed`}
            >
              {loading ? '...' : isCheckedIn ? 'בטל נוכחות' : 'סמן נוכח'}
            </button>
          )}

          {isWaitlist && !isBanned && (
            <button
              disabled={true}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-all min-h-[44px] min-w-[100px] bg-gray-200 text-gray-500 cursor-not-allowed"
              title="לא ניתן לרשום נוכחות לרשימת המתנה"
            >
              לא זמין
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
